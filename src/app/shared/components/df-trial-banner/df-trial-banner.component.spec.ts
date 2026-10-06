import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Injectable } from '@angular/core';
import { By } from '@angular/platform-browser';
import { BehaviorSubject, of } from 'rxjs';
import {
  Translation,
  TranslocoLoader,
  provideTransloco,
} from '@ngneat/transloco';
import {
  DfTrialBannerComponent,
  TRIAL_BANNER_HEIGHT_VAR,
  TRIAL_BANNER_ROW_MIN_WIDTH,
  trialBannerLayout,
} from './df-trial-banner.component';
import { DfTrialService } from '../../services/df-trial.service';
import { TrialInfo, TrialRemaining } from '../../types/trial';
import { splitTrialRemaining } from '../../utilities/trial';

// Real copy from src/assets/i18n/en.json so the spec guards the section-9 text.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const EN: Translation = require('../../../../assets/i18n/en.json');

@Injectable()
class InlineLoader implements TranslocoLoader {
  getTranslation() {
    return of(EN);
  }
}

const DAY = 86400;

/**
 * jsdom has no ResizeObserver and no layout engine. This stand-in records the
 * observed element and lets a test fire the callback with a stubbed box, so
 * the height-propagation path is exercised end to end.
 */
class FakeResizeObserver {
  static instances: FakeResizeObserver[] = [];
  target: Element | null = null;
  disconnected = false;
  constructor(private callback: ResizeObserverCallback) {
    FakeResizeObserver.instances.push(this);
  }
  observe(el: Element) {
    this.target = el;
  }
  unobserve() {
    this.target = null;
  }
  disconnect() {
    this.disconnected = true;
    this.target = null;
  }
  fire() {
    this.callback([], this as unknown as ResizeObserver);
  }
}

function stubHeight(el: HTMLElement, height: number, width = 1440) {
  jest.spyOn(el, 'getBoundingClientRect').mockReturnValue({
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: width,
    bottom: height,
    width,
    height,
    toJSON: () => ({}),
  } as DOMRect);
}

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  });
}

const publishedHeight = () =>
  document.documentElement.style.getPropertyValue(TRIAL_BANNER_HEIGHT_VAR);

const TRIAL: TrialInfo = {
  status: 'active',
  trialId: 'trl_01TEST',
  email: 'user@company.com',
  plan: 'gold-trial',
  startedAt: '2026-10-03T20:00:00+00:00',
  expiresAt: '2026-11-02T20:00:00+00:00',
  daysRemaining: 30,
  secondsRemaining: 29 * DAY + 4 * 3600,
  warnDays: 7,
  criticalDays: 3,
  contactEmail: 'sales@dreamfactory.com',
  demoUrl: 'https://www.dreamfactory.com/demo',
  portalUrl: 'https://portal.dreamfactory.com',
  version: '7.7.1',
};

describe('DfTrialBannerComponent', () => {
  let fixture: ComponentFixture<DfTrialBannerComponent>;
  const trial$ = new BehaviorSubject<TrialInfo | null>(null);
  const remaining$ = new BehaviorSubject<TrialRemaining | null>(null);
  const expired$ = new BehaviorSubject<boolean>(false);

  const banner = () =>
    fixture.debugElement.query(By.css('[data-testid="trial-banner"]'));
  const text = (selector: string) =>
    fixture.debugElement
      .query(By.css(selector))
      .nativeElement.textContent.replace(/\s+/g, ' ')
      .trim();

  async function render() {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  const originalInnerWidth = window.innerWidth;

  beforeEach(async () => {
    trial$.next(null);
    remaining$.next(null);
    expired$.next(false);
    FakeResizeObserver.instances = [];
    (window as unknown as { ResizeObserver?: unknown }).ResizeObserver =
      FakeResizeObserver;
    setViewportWidth(1440);
    document.documentElement.style.removeProperty(TRIAL_BANNER_HEIGHT_VAR);
    await TestBed.configureTestingModule({
      imports: [DfTrialBannerComponent],
      providers: [
        provideTransloco({
          config: { defaultLang: 'en', availableLangs: ['en'] },
          loader: InlineLoader,
        }),
        {
          provide: DfTrialService,
          useValue: { trial$, remaining$, expired$ },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(DfTrialBannerComponent);
  });

  afterEach(() => {
    fixture.destroy();
    delete (window as unknown as { ResizeObserver?: unknown }).ResizeObserver;
    setViewportWidth(originalInnerWidth);
    document.documentElement.style.removeProperty(TRIAL_BANNER_HEIGHT_VAR);
  });

  it('renders nothing on a non-trial install', async () => {
    await render();
    expect(banner()).toBeNull();
    expect(publishedHeight()).toBe('');
    expect(FakeResizeObserver.instances).toHaveLength(0);
  });

  it('shows the section-9 copy with the live countdown and both CTAs', async () => {
    trial$.next(TRIAL);
    remaining$.next(splitTrialRemaining(29 * DAY + 4 * 3600 + 7, 7, 3));
    await render();

    expect(banner()).not.toBeNull();
    expect(banner().attributes['data-severity']).toBe('info');
    expect(banner().classes['trial-banner--info']).toBe(true);
    expect(text('.banner-label')).toBe('Trial license');
    expect(text('[data-testid="trial-countdown"]')).toBe(
      '29 days, 4 hours remaining'
    );
    // short prompt on the strip, full section-9 sentence as the tooltip
    expect(text('.banner-help')).toBe('Need more time?');
    expect(
      fixture.debugElement
        .query(By.css('[data-testid="trial-help"]'))
        .nativeElement.getAttribute('title')
    ).toBe(
      'Need more time? Contact sales@dreamfactory.com or book time at dreamfactory.com/demo.'
    );
    expect(text('.banner-text')).toBe(
      'Trial license 29 days, 4 hours remaining · Need more time?'
    );

    const contact = fixture.debugElement.query(
      By.css('[data-testid="trial-contact-cta"]')
    );
    const demo = fixture.debugElement.query(
      By.css('[data-testid="trial-demo-cta"]')
    );
    expect(contact.nativeElement.getAttribute('href')).toBe(
      'mailto:sales@dreamfactory.com'
    );
    expect(demo.nativeElement.getAttribute('href')).toBe(
      'https://www.dreamfactory.com/demo'
    );
    expect(demo.nativeElement.getAttribute('target')).toBe('_blank');
    expect(demo.nativeElement.getAttribute('rel')).toBe('noopener');
    // in-flow sticky host: no fixed positioning, no hand-sized spacer
    expect(fixture.debugElement.query(By.css('.banner-spacer'))).toBeNull();
  });

  it('re-renders the countdown on every tick', async () => {
    trial$.next(TRIAL);
    remaining$.next(splitTrialRemaining(29 * DAY + 4 * 3600, 7, 3));
    await render();
    expect(text('[data-testid="trial-countdown"]')).toBe(
      '29 days, 4 hours remaining'
    );
    remaining$.next(splitTrialRemaining(29 * DAY + 3 * 3600 + 59 * 60, 7, 3));
    fixture.detectChanges();
    expect(text('[data-testid="trial-countdown"]')).toBe(
      '29 days, 3 hours remaining'
    );
  });

  it('pluralises units: "1 day, 1 hour" and "0 days, 1 hour"', async () => {
    trial$.next(TRIAL);
    remaining$.next(splitTrialRemaining(DAY + 3600 + 5, 7, 3));
    await render();
    expect(text('[data-testid="trial-countdown"]')).toBe(
      '1 day, 1 hour remaining'
    );
    remaining$.next(splitTrialRemaining(3600 + 5, 7, 3));
    fixture.detectChanges();
    expect(text('[data-testid="trial-countdown"]')).toBe(
      '0 days, 1 hour remaining'
    );
  });

  it('escalates to the warning and critical colour states', async () => {
    trial$.next(TRIAL);
    remaining$.next(splitTrialRemaining(6 * DAY, 7, 3));
    await render();
    expect(banner().attributes['data-severity']).toBe('warning');
    expect(banner().classes['trial-banner--warning']).toBe(true);
    expect(banner().classes['trial-banner--info']).toBeFalsy();

    remaining$.next(splitTrialRemaining(2 * DAY, 7, 3));
    fixture.detectChanges();
    expect(banner().attributes['data-severity']).toBe('critical');
    expect(banner().classes['trial-banner--critical']).toBe(true);
    expect(banner().classes['trial-banner--warning']).toBeFalsy();
  });

  it('hides while the instance is locked (the expired page is the message)', async () => {
    trial$.next(TRIAL);
    remaining$.next(splitTrialRemaining(29 * DAY, 7, 3));
    await render();
    expect(banner()).not.toBeNull();

    expired$.next(true);
    fixture.detectChanges();
    expect(banner()).toBeNull();
  });

  it('hides when the trial block itself is not active', async () => {
    trial$.next({ ...TRIAL, status: 'expired' });
    remaining$.next(splitTrialRemaining(0, 7, 3));
    await render();
    expect(banner()).toBeNull();
  });

  it('falls back to the section-9 contact and demo constants when the block omits them', async () => {
    trial$.next({ ...TRIAL, contactEmail: '', demoUrl: '' });
    remaining$.next(splitTrialRemaining(10 * DAY, 7, 3));
    await render();
    expect(
      fixture.debugElement
        .query(By.css('[data-testid="trial-contact-cta"]'))
        .nativeElement.getAttribute('href')
    ).toBe('mailto:sales@dreamfactory.com');
    expect(
      fixture.debugElement
        .query(By.css('[data-testid="trial-demo-cta"]'))
        .nativeElement.getAttribute('href')
    ).toBe('https://www.dreamfactory.com/demo');
  });
  describe('layout space (height propagation)', () => {
    it('mirrors the rendered height into --df-trial-banner-height on <html> via ResizeObserver', async () => {
      trial$.next(TRIAL);
      remaining$.next(splitTrialRemaining(29 * DAY, 7, 3));
      const el = () => banner().nativeElement as HTMLElement;
      // first measurement happens as soon as the banner element exists
      await render();
      expect(FakeResizeObserver.instances).toHaveLength(1);
      const ro = FakeResizeObserver.instances[0];
      expect(ro.target).toBe(el());

      stubHeight(el(), 38);
      ro.fire();
      expect(publishedHeight()).toBe('38px');
      expect(fixture.componentInstance.publishedHeight).toBe(38);

      // copy wraps / viewport narrows: the variable follows the real box
      stubHeight(el(), 70.4);
      ro.fire();
      expect(publishedHeight()).toBe('70.4px');
    });

    it('clears the variable and disconnects when the banner hides (locked) and on destroy', async () => {
      trial$.next(TRIAL);
      remaining$.next(splitTrialRemaining(29 * DAY, 7, 3));
      await render();
      const ro = FakeResizeObserver.instances[0];
      stubHeight(banner().nativeElement, 38);
      ro.fire();
      expect(publishedHeight()).toBe('38px');

      expired$.next(true);
      fixture.detectChanges();
      expect(banner()).toBeNull();
      expect(publishedHeight()).toBe('');
      expect(ro.disconnected).toBe(true);

      // comes back with a fresh observer when the trial is active again
      expired$.next(false);
      fixture.detectChanges();
      expect(FakeResizeObserver.instances).toHaveLength(2);
      stubHeight(banner().nativeElement, 38);
      FakeResizeObserver.instances[1].fire();
      expect(publishedHeight()).toBe('38px');

      fixture.destroy();
      expect(publishedHeight()).toBe('');
      expect(FakeResizeObserver.instances[1].disconnected).toBe(true);
    });

    it('falls back to window resize measurements when ResizeObserver is unavailable', async () => {
      delete (window as unknown as { ResizeObserver?: unknown }).ResizeObserver;
      trial$.next(TRIAL);
      remaining$.next(splitTrialRemaining(29 * DAY, 7, 3));
      await render();
      expect(FakeResizeObserver.instances).toHaveLength(0);

      stubHeight(banner().nativeElement, 52.59);
      window.dispatchEvent(new Event('resize'));
      expect(publishedHeight()).toBe('52.59px');

      fixture.destroy();
      expect(publishedHeight()).toBe('');
      // listener gone: a later resize must not resurrect the variable
      window.dispatchEvent(new Event('resize'));
      expect(publishedHeight()).toBe('');
    });
  });

  describe('compactness (row vs stack)', () => {
    it('trialBannerLayout switches at the 960px breakpoint', () => {
      expect(TRIAL_BANNER_ROW_MIN_WIDTH).toBe(960);
      expect(trialBannerLayout(1920)).toBe('row');
      expect(trialBannerLayout(960)).toBe('row');
      expect(trialBannerLayout(959)).toBe('stack');
      expect(trialBannerLayout(390)).toBe('stack');
    });

    it('renders the single desktop row at >= 960px and the stacked block below', async () => {
      setViewportWidth(1440);
      trial$.next(TRIAL);
      remaining$.next(splitTrialRemaining(29 * DAY, 7, 3));
      await render();
      expect(banner().attributes['data-layout']).toBe('row');
      expect(banner().classes['trial-banner--row']).toBe(true);
      expect(banner().classes['trial-banner--stack']).toBeFalsy();

      setViewportWidth(834);
      window.dispatchEvent(new Event('resize'));
      fixture.detectChanges();
      expect(banner().attributes['data-layout']).toBe('stack');
      expect(banner().classes['trial-banner--stack']).toBe(true);
      expect(banner().classes['trial-banner--row']).toBeFalsy();

      setViewportWidth(960);
      window.dispatchEvent(new Event('resize'));
      fixture.detectChanges();
      expect(banner().attributes['data-layout']).toBe('row');
    });

    it('keeps the pill, countdown, prompt and both small CTAs in every layout', async () => {
      setViewportWidth(390);
      trial$.next(TRIAL);
      remaining$.next(splitTrialRemaining(2 * DAY + 3600, 7, 3));
      await render();
      expect(banner().attributes['data-layout']).toBe('stack');
      expect(banner().attributes['data-severity']).toBe('critical');
      expect(text('.banner-label')).toBe('Trial license');
      expect(text('[data-testid="trial-countdown"]')).toBe(
        '2 days, 1 hour remaining'
      );
      expect(text('.banner-help')).toBe('Need more time?');
      expect(
        fixture.debugElement.queryAll(By.css('.banner-actions .cta-button'))
      ).toHaveLength(2);
    });
  });
});
