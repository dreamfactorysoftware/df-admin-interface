import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { NgClass, NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoPipe } from '@ngneat/transloco';
import { Subscription } from 'rxjs';
import { DfEmptyStateComponent } from 'src/app/shared/components/df-empty-state/df-empty-state.component';
import { DfPaywallComponent } from 'src/app/shared/components/df-paywall/df-paywall.component';
import { DfSkeletonComponent } from 'src/app/shared/components/df-skeleton/df-skeleton.component';
import { ComplianceStore, fixLink, scoreOf } from '../compliance.store';
import {
  BaselineControl,
  BaselineDetail,
  BaselineSummary,
  ControlStatus,
  ReportFormat,
} from '../compliance.types';
import {
  ApplyDialogData,
  ApplyDialogResult,
  DfComplianceApplyDialogComponent,
} from './df-compliance-apply-dialog.component';
import { shortWhen } from 'src/app/adf-data-masking/dm-time';

/** The check that only "Apply with masking turned on" fixes. */
const MODE_CHECK = 'masking.mode';

/** One action for a failing check: a page that fixes it, or Apply. */
export type CheckAction =
  | { kind: 'link'; path: string; query: Record<string, string> }
  | { kind: 'apply'; turnOn: boolean };

const STATUS_ICON: Record<ControlStatus, string> = {
  pass: 'check_circle',
  fail: 'cancel',
  manual: 'radio_button_unchecked',
  na: 'remove_circle_outline',
};

/**
 * Compliance (/api-security/compliance): baselines grouped by vertical in
 * a rail, the selected one's score, its checks (status, title, framework
 * refs, one action) and Apply / Export / Stop tracking. Manual checks sit
 * collapsed at the end. The selection lives in ?baseline= so links from
 * Data Masking's first run (and reloads) land on it.
 */
@Component({
  selector: 'df-compliance',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    NgClass,
    NgTemplateOutlet,
    RouterLink,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatMenuModule,
    MatProgressBarModule,
    MatSelectModule,
    MatTooltipModule,
    TranslocoPipe,
    DfEmptyStateComponent,
    DfPaywallComponent,
    DfSkeletonComponent,
  ],
  providers: [ComplianceStore],
  templateUrl: './df-compliance.component.html',
  styleUrls: ['./df-compliance.component.scss'],
})
export class DfComplianceComponent implements OnInit, OnDestroy {
  readonly store = inject(ComplianceStore);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  /** No security_baseline resource: the shared paywall instead. */
  paywall = false;
  /** Manual checks start collapsed; reset when the baseline changes. */
  manualOpen = false;
  private subs: Subscription[] = [];

  ngOnInit(): void {
    this.subs.push(
      this.route.data.subscribe(d => {
        this.paywall = d?.['data'] === 'paywall';
        if (!this.paywall && !this.store.baselines) {
          this.store.load(this.route.snapshot.queryParamMap.get('baseline'));
        }
      }),
      this.route.queryParamMap.subscribe(q => {
        const id = q.get('baseline');
        if (id && id !== this.store.selectedId && this.store.baselines) {
          this.manualOpen = false;
          this.store.select(id);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  select(id: string): void {
    if (id === this.store.selectedId) return;
    this.manualOpen = false;
    this.store.select(id);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { baseline: id },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  // -------------------------------------------------------------- derived

  verticalLabel(v: string): string {
    const key = `compliance.verticals.${v}`;
    const label = this.store.t(`verticals.${v}`);
    return label === key ? v : label;
  }

  railScore(b: BaselineSummary): string {
    return `${b.score.pass}/${b.score.pass + b.score.fail}`;
  }

  railLabel(b: BaselineSummary): string {
    const score = this.store.t('scoreLabel', {
      pass: b.score.pass,
      total: b.score.pass + b.score.fail,
    });
    return b.adopted
      ? `${b.name}, ${this.store.t('tracking')}, ${score}`
      : `${b.name}, ${score}`;
  }

  /** Checks the score counts, in server order; n/a ones trail, muted. */
  automated(d: BaselineDetail): BaselineControl[] {
    const live = d.controls.filter(
      c => c.status === 'pass' || c.status === 'fail'
    );
    const na = d.controls.filter(c => c.status === 'na');
    return [...live, ...na];
  }

  manual(d: BaselineDetail): BaselineControl[] {
    return d.controls.filter(c => c.status === 'manual');
  }

  score(d: BaselineDetail): { pass: number; checked: number; pct: number } {
    const s = scoreOf(d.controls);
    return { ...s, pct: s.checked ? (s.pass / s.checked) * 100 : 0 };
  }

  /**
   * What was found, under the title: for a failing, manual or n/a check.
   * A passing check's detail only restates its title, so it stays out
   * (the evidence export carries every detail).
   */
  showDetail(c: BaselineControl): boolean {
    return !!c.detail && c.status !== 'pass';
  }

  statusIcon(c: BaselineControl): string {
    return STATUS_ICON[c.status] ?? 'help_outline';
  }

  statusLabel(c: BaselineControl): string {
    return this.store.t(`status.${c.status}`);
  }

  /** The baseline's name as a title: "{{name}} baseline", never a score. */
  title(d: BaselineDetail): string {
    return this.store.t('title', { name: d.name });
  }

  /** What it maps to, and that it is not a certification: one muted line. */
  mapped(d: BaselineDetail): string {
    const note = this.store.t('notCertification');
    return d.frameworks?.length
      ? `${this.store.t('mapped', { frameworks: d.frameworks.join(', ') })} · ${note}`
      : note;
  }

  /**
   * A failing check's one action, or null. 'link': the page that fixes it.
   * 'apply': Apply fixes it; "Masking is on" needs Apply with masking
   * turned on, so its Fix opens Apply with that ticked. Before the first
   * scan masking can't be turned on: that Fix goes to Data Masking, where
   * the scan starts.
   */
  action(c: BaselineControl): CheckAction | null {
    if (c.status !== 'fail') return null;
    if (c.fix?.kind === 'link') {
      const l = fixLink(c.fix.route);
      return l ? { kind: 'link', ...l } : null;
    }
    if (c.fix?.kind !== 'apply') return null;
    if (c.id !== MODE_CHECK) return { kind: 'apply', turnOn: false };
    if (this.store.offerTurnOn) return { kind: 'apply', turnOn: true };
    return this.store.maskingMode === 'on'
      ? null
      : { kind: 'link', path: '/api-security/data-masking', query: {} };
  }

  trackingTip(d: BaselineDetail): string {
    return d.adoptedAt
      ? this.store.t('trackingSince', { when: shortWhen(d.adoptedAt) })
      : this.store.t('tracking');
  }

  /**
   * Apply does something: adopt, change settings, or fix a failing check
   * that Apply fixes (masking.mode needs it with masking turned on, which
   * `changes` leaves out). Never hidden while such a check fails.
   */
  canApply(d: BaselineDetail): boolean {
    return (
      !d.adopted ||
      d.changes.length > 0 ||
      d.controls.some(c => c.status === 'fail' && c.fix?.kind === 'apply')
    );
  }

  // -------------------------------------------------------------- actions

  /** Run a failing check's Apply action. */
  fixWithApply(d: BaselineDetail, a: CheckAction): void {
    if (a.kind === 'apply') this.apply(d, a.turnOn);
  }

  apply(d: BaselineDetail, turnOn = false): void {
    if (this.store.busy) return;
    const offerTurnOn = this.store.offerTurnOn;
    const data: ApplyDialogData = {
      name: d.name,
      changes: d.changes,
      offerTurnOn,
      turnOn: offerTurnOn && turnOn,
      changesOn$: offerTurnOn ? this.store.changesWithModeOn(d.id) : undefined,
    };
    this.dialog
      .open<
        DfComplianceApplyDialogComponent,
        ApplyDialogData,
        ApplyDialogResult | undefined
      >(DfComplianceApplyDialogComponent, {
        data,
        autoFocus: 'dialog',
        width: '520px',
        maxWidth: 'calc(100vw - 32px)',
      })
      .afterClosed()
      .subscribe(res => {
        if (!res) return;
        this.store
          .apply(d.id, res.turnOn)
          .subscribe({ error: () => undefined });
      });
  }

  stop(d: BaselineDetail): void {
    this.store.stopTracking(d.id);
  }

  exportReport(d: BaselineDetail, format: ReportFormat): void {
    this.store.exportReport(d.id, format);
  }

  trackGroup = (_: number, g: { vertical: string }) => g.vertical;
  trackBaseline = (_: number, b: BaselineSummary) => b.id;
  trackControl = (_: number, c: BaselineControl) => c.id;
  trackRef = (_: number, r: string) => r;
}
