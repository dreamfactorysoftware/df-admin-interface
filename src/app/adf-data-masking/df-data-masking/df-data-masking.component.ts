import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { NgFor, NgIf, NgSwitch, NgSwitchCase } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  MatButtonToggleGroup,
  MatButtonToggleModule,
} from '@angular/material/button-toggle';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { TranslocoPipe } from '@ngneat/transloco';
import { Subscription } from 'rxjs';
import { DfPaywallComponent } from 'src/app/shared/components/df-paywall/df-paywall.component';
import { DfSkeletonComponent } from 'src/app/shared/components/df-skeleton/df-skeleton.component';
import { DfEmptyStateComponent } from 'src/app/shared/components/df-empty-state/df-empty-state.component';
import { ColumnFilter, DataMaskingStore } from '../data-masking.store';
import { MaskingMode } from '../data-masking.types';
import { DfDmColumnsComponent } from '../df-dm-columns/df-dm-columns.component';
import { DfDmAccessComponent } from '../df-dm-access/df-dm-access.component';
import { DfDmMasksComponent } from '../df-dm-masks/df-dm-masks.component';
import { DfDmDetectionComponent } from '../df-dm-detection/df-dm-detection.component';
import { DfDmActivityComponent } from '../df-dm-activity/df-dm-activity.component';
import {
  DfDmConfirmDialogComponent,
  DmConfirmData,
} from './df-dm-confirm-dialog.component';

export type DmTab = 'columns' | 'access' | 'masks' | 'detection' | 'activity';
const COLUMN_FILTERS: ColumnFilter[] = ['review', 'masked', 'clear', 'all'];
export const DM_TABS: DmTab[] = [
  'columns',
  'access',
  'masks',
  'detection',
  'activity',
];

/**
 * Data Masking page shell (/api-security/data-masking). The admin chrome
 * already prints the page H1, so the shell carries only the one primary
 * control (Off / Preview / On), live counts that double as navigation, and
 * the tab bar. The tab lives in ?tab= so links and reloads keep it.
 */
@Component({
  selector: 'df-data-masking',
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    NgSwitch,
    NgSwitchCase,
    MatButtonToggleModule,
    MatDialogModule,
    MatIconModule,
    MatSelectModule,
    MatTabsModule,
    RouterLink,
    TranslocoPipe,
    DfPaywallComponent,
    DfSkeletonComponent,
    DfEmptyStateComponent,
    DfDmColumnsComponent,
    DfDmAccessComponent,
    DfDmMasksComponent,
    DfDmDetectionComponent,
    DfDmActivityComponent,
  ],
  providers: [DataMaskingStore],
  templateUrl: './df-data-masking.component.html',
  styleUrls: ['./df-data-masking.component.scss'],
})
export class DfDataMaskingComponent implements OnInit, OnDestroy {
  readonly store = inject(DataMaskingStore);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('modeGroup') modeGroup?: MatButtonToggleGroup;

  readonly tabs = DM_TABS;
  readonly modes: MaskingMode[] = ['off', 'preview', 'on'];
  paywall = false;
  tab: DmTab = 'columns';
  private subs: Subscription[] = [];

  ngOnInit(): void {
    this.subs.push(
      this.route.data.subscribe(d => {
        this.paywall = d?.['data'] === 'paywall';
        if (this.paywall) return;
        if (!this.store.overview) this.store.load();
        // Pick up scans that finish while the page is open.
        this.store.startWatching();
      }),
      this.route.queryParamMap.subscribe(q => {
        const t = q.get('tab') as DmTab | null;
        this.tab = t && DM_TABS.includes(t) ? t : 'columns';
        this.consumeFilter(q.get('filter'));
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    this.store.stopWatching();
  }

  /**
   * Before the first scan with masking off there is nothing to switch: the
   * page leads with its one action (scan) and the control stays out of the
   * way. A scan that found no columns (empty databases) counts as no scan.
   * A mode left on by other means still shows, so Off is reachable.
   */
  get showModeControl(): boolean {
    const s = this.store;
    return (
      !!s.overview && !((s.unscanned || !s.foundColumns) && s.mode === 'off')
    );
  }

  /**
   * Lowering the mode from On (to Preview or Off) is the super admin's call
   * once one is designated; raising it is always allowed.
   */
  get lowerLocked(): boolean {
    return this.store.mode === 'on' && !this.store.canLower;
  }

  /**
   * Off is never held back by the scan state. Preview and On wait for the
   * first scan that finds columns (there is nothing to mask yet, and the
   * server refuses On until then), including while it runs and its first
   * columns arrive; Off and Preview lock while On when this admin cannot
   * lower it.
   */
  modeDisabled(m: MaskingMode): boolean {
    if (m === this.store.mode) return false;
    if (m !== 'off' && !(this.store.scanned && this.store.foundColumns))
      return true;
    return m !== 'on' && this.lowerLocked;
  }

  /**
   * ?filter=review|masked|clear|all opens Columns on that filter (deep
   * links such as a Compliance check's Fix). Applied once, then dropped
   * from the URL so later tab switches never re-impose it.
   */
  private consumeFilter(f: string | null): void {
    if (!f || !COLUMN_FILTERS.includes(f as ColumnFilter)) return;
    if (this.store.loading || !this.store.overview) {
      // Read by the Columns tab when its first view is built.
      this.store.filter = f as ColumnFilter;
    } else {
      this.store.showColumns(f as ColumnFilter);
    }
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { filter: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  tabQuery(tab: DmTab): Record<string, string | null> {
    return { tab: tab === 'columns' ? null : tab };
  }

  setTab(tab: DmTab): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tab === 'columns' ? null : tab },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  /** Header count jump: open Columns on that filter. */
  showColumns(filter: 'review' | 'masked'): void {
    this.store.showColumns(filter);
    this.setTab('columns');
  }

  requestMode(mode: MaskingMode): void {
    // The toggle shows the mode in force, never the one asked for: put it
    // back now, and let the store move it once the change is real.
    this.syncMode();
    if (mode === this.store.mode || this.store.modeSaving) return;
    if (this.modeDisabled(mode)) return;
    const data = this.confirmFor(mode);
    if (!data) {
      this.store.setMode(mode);
      return;
    }
    this.dialog
      .open(DfDmConfirmDialogComponent, { data, autoFocus: 'dialog' })
      .afterClosed()
      .subscribe(ok => {
        if (ok) this.store.setMode(mode);
        this.syncMode();
      });
  }

  /**
   * A confirm whenever masking is added or removed: turning On, and leaving
   * On (for Preview or Off). Off and Preview swap without one: neither
   * masks anything.
   */
  private confirmFor(mode: MaskingMode): DmConfirmData | null {
    const s = this.store;
    const t = (k: string, p?: Record<string, unknown>) => s.t(k, p);
    if (mode === 'on') {
      const o = s.overview;
      const review = o?.counts.review ?? 0;
      const audience = o?.you.seesRealValues
        ? 'mode.confirmOn.messageWithAccess'
        : 'mode.confirmOn.message';
      const message = [
        t(audience, {
          columns: s.plural('columns', s.maskedTotal),
          databases: s.plural('databases', s.maskedDatabases),
        }),
        review > 0 ? t('mode.confirmOn.review', { review }) : '',
      ]
        .filter(Boolean)
        .join(' ');
      return {
        title: t('mode.confirmOn.title'),
        message,
        confirm: t('mode.confirmOn.confirm'),
        cancel: t('cancel'),
      };
    }
    if (s.mode !== 'on') return null;
    const key = mode === 'preview' ? 'confirmPreview' : 'confirmOff';
    return {
      title: t(`mode.${key}.title`),
      message: t(`mode.${key}.message`),
      confirm: t(`mode.${key}.confirm`),
      cancel: t('cancel'),
      danger: true,
    };
  }

  /**
   * mat-button-toggle selects the clicked toggle itself, after our (change)
   * handler runs, so reset both now and once its click handling is done.
   */
  private syncMode(): void {
    const reset = () => {
      const group = this.modeGroup;
      if (!group) return;
      group.value = this.store.mode;
      group._buttonToggles?.forEach(
        b => (b.checked = b.value === this.store.mode)
      );
      this.cdr.markForCheck();
    };
    reset();
    setTimeout(reset);
  }
}
