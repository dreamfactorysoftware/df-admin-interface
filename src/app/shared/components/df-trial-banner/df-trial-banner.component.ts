import {
  Component,
  ElementRef,
  Inject,
  NgZone,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { AsyncPipe, DOCUMENT, NgIf } from '@angular/common';
import { TranslocoModule } from '@ngneat/transloco';
import {
  Observable,
  combineLatest,
  distinctUntilChanged,
  fromEvent,
  map,
  startWith,
} from 'rxjs';
import { DfTrialService } from '../../services/df-trial.service';
import {
  TRIAL_CONTACT_EMAIL,
  TRIAL_DEMO_URL,
  TrialInfo,
  TrialRemaining,
} from '../../types/trial';

/**
 * CSS custom property written on <html> with the banner's rendered height
 * (e.g. "37.5px"), or removed while no banner is shown. The app shell
 * subtracts it from its 100% height (df-side-nav .app-container) so the
 * banner takes real layout space instead of pushing the shell below the fold
 * and creating a second scrollbar. Anything sized with 100vh can consume it
 * the same way: calc(100vh - var(--df-trial-banner-height, 0px)).
 */
export const TRIAL_BANNER_HEIGHT_VAR = '--df-trial-banner-height';

/** Viewport width (px) from which the banner renders as a single row. */
export const TRIAL_BANNER_ROW_MIN_WIDTH = 960;

export type TrialBannerLayout = 'row' | 'stack';

/**
 * Compactness rule: one row (pill · countdown · short message · CTAs) at
 * desktop widths, a stacked block below TRIAL_BANNER_ROW_MIN_WIDTH. Pure so
 * the spec can pin the breakpoint without a layout engine.
 */
export function trialBannerLayout(viewportWidth: number): TrialBannerLayout {
  return viewportWidth >= TRIAL_BANNER_ROW_MIN_WIDTH ? 'row' : 'stack';
}

export interface TrialBannerViewModel {
  trial: TrialInfo;
  remaining: TrialRemaining;
  contactEmail: string;
  contactHref: string;
  demoUrl: string;
  /** trial.units.day | trial.units.days - "1 day" must never read "1 days". */
  daysUnitKey: string;
  hoursUnitKey: string;
  layout: TrialBannerLayout;
}

/**
 * Sticky-top countdown for self-service Docker trials (TRIAL-DESIGN.md
 * section 5 / copy section 9). Replaces <df-engagement-banner> whenever the
 * environment carries a trial block, so two top banners never stack: the
 * engagement banner hides itself on trial instances.
 *
 * Layout contract: the host is an in-flow, sticky block, so the banner always
 * occupies exactly its rendered height - whatever the width, severity, copy
 * length or wrapping - and can never cover the toolbar or page content. A
 * ResizeObserver mirrors that height into --df-trial-banner-height on <html>
 * for the 100%-tall shell (see TRIAL_BANNER_HEIGHT_VAR).
 *
 * Visible pre-login (top-level `trial`) and post-login (`platform.trial`);
 * hidden while the instance is locked - the trial-expired page is the
 * message then. Severity escalates info -> warning (<= warnDays) ->
 * critical (<= criticalDays) using the UI's --df-accent / --df-warning /
 * --df-danger tokens, which repaint in light, dark and phosphor.
 */
@Component({
  selector: 'df-trial-banner',
  templateUrl: './df-trial-banner.component.html',
  styleUrls: ['./df-trial-banner.component.scss'],
  standalone: true,
  imports: [NgIf, AsyncPipe, TranslocoModule],
})
export class DfTrialBannerComponent implements OnDestroy {
  /** Last height (px) published to --df-trial-banner-height; 0 when hidden. */
  publishedHeight = 0;

  private readonly layout$: Observable<TrialBannerLayout> = fromEvent(
    this.document.defaultView as Window,
    'resize'
  ).pipe(
    startWith(null),
    map(() => trialBannerLayout(this.viewportWidth())),
    distinctUntilChanged()
  );

  vm$: Observable<TrialBannerViewModel | null> = combineLatest([
    this.trialService.trial$,
    this.trialService.remaining$,
    this.trialService.expired$,
    this.layout$,
  ]).pipe(
    map(([trial, remaining, locked, layout]) => {
      if (!trial || locked || trial.status !== 'active' || !remaining) {
        return null;
      }
      const contactEmail = trial.contactEmail || TRIAL_CONTACT_EMAIL;
      return {
        trial,
        remaining,
        contactEmail,
        contactHref: `mailto:${contactEmail}`,
        demoUrl: trial.demoUrl || TRIAL_DEMO_URL,
        daysUnitKey:
          remaining.days === 1 ? 'trial.units.day' : 'trial.units.days',
        hoursUnitKey:
          remaining.hours === 1 ? 'trial.units.hour' : 'trial.units.hours',
        layout,
      };
    })
  );

  private bannerEl: HTMLElement | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private fallbackResize: (() => void) | null = null;

  /**
   * The banner lives under *ngIf, so the query setter fires whenever it is
   * created or torn down: observe its box while present, clear the custom
   * property as soon as it is gone.
   */
  @ViewChild('bannerEl')
  set bannerRef(ref: ElementRef<HTMLElement> | undefined) {
    this.detach();
    if (ref) {
      this.attach(ref.nativeElement);
    }
  }

  constructor(
    private trialService: DfTrialService,
    @Inject(DOCUMENT) private document: Document,
    private zone: NgZone
  ) {}

  ngOnDestroy(): void {
    this.detach();
  }

  private viewportWidth(): number {
    const win = this.document.defaultView;
    return win?.innerWidth || this.document.documentElement.clientWidth || 0;
  }

  private attach(el: HTMLElement): void {
    this.bannerEl = el;
    const win = this.document.defaultView;
    const RO = win && (win as Window & typeof globalThis).ResizeObserver;
    if (RO) {
      // Size notifications arrive after layout and before paint, so the
      // shell never renders a frame with a stale offset. Run outside Angular:
      // the property write is DOM-only and needs no change detection.
      this.zone.runOutsideAngular(() => {
        this.resizeObserver = new RO(() => this.syncHeight());
        this.resizeObserver.observe(el);
      });
    } else if (win) {
      this.fallbackResize = () => this.syncHeight();
      win.addEventListener('resize', this.fallbackResize);
    }
    this.syncHeight();
  }

  private detach(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    if (this.fallbackResize) {
      this.document.defaultView?.removeEventListener(
        'resize',
        this.fallbackResize
      );
      this.fallbackResize = null;
    }
    this.bannerEl = null;
    this.publishHeight(0);
  }

  /** Measure the rendered banner and mirror it into the custom property. */
  syncHeight(): void {
    if (!this.bannerEl) {
      return;
    }
    const height = this.bannerEl.getBoundingClientRect().height;
    this.publishHeight(Math.round(height * 100) / 100);
  }

  private publishHeight(height: number): void {
    const root = this.document.documentElement;
    if (!root) {
      return;
    }
    if (height > 0) {
      root.style.setProperty(TRIAL_BANNER_HEIGHT_VAR, `${height}px`);
    } else {
      root.style.removeProperty(TRIAL_BANNER_HEIGHT_VAR);
    }
    this.publishedHeight = height;
  }
}
