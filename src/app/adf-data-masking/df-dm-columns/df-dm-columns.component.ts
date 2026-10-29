import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DoCheck,
  ElementRef,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren,
  inject,
} from '@angular/core';
import { NgClass, NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoPipe } from '@ngneat/transloco';
import { Subscription } from 'rxjs';
import { DfEmptyStateComponent } from 'src/app/shared/components/df-empty-state/df-empty-state.component';
import { ROUTES } from 'src/app/shared/types/routes';
import { BASELINES, BaselineDef } from '../data-masking.catalog';
import { DfClassPickerComponent } from '../df-class-picker/df-class-picker.component';
import { DfEvidenceLedgerComponent } from '../df-evidence-ledger/df-evidence-ledger.component';
import { DfMaskedValueComponent } from '../df-masked-value/df-masked-value.component';
import { DfSensitivityStripComponent } from '../df-sensitivity-strip/df-sensitivity-strip.component';
import {
  ColumnFilter,
  DataMaskingStore,
  tableKey,
} from '../data-masking.store';
import {
  CoverageService,
  MaskedColumn,
  ServiceTables,
  TableSummary,
} from '../data-masking.types';
import { relTime } from '../dm-time';

interface RailRow {
  key: string;
  table: string;
  summary: TableSummary | undefined;
}

interface RailGroup {
  service: string;
  label: string;
  rows: RailRow[];
}

/** A scanned database with nothing under the current filter. */
interface QuietRow {
  service: string;
  label: string;
  /** none = tables, nothing sensitive; empty = no tables at all. */
  status: 'none' | 'empty';
}

const FILTERS: ColumnFilter[] = ['review', 'masked', 'clear', 'all'];
/** Rows drawn at once; the rest follow in chunks so a wide table opens fast. */
export const FIRST_ROWS = 60;
const ROW_CHUNK = 120;
const SEARCH_DEBOUNCE_MS = 150;

/** The filters are disjoint, like the counts on their chips. */
export function passesFilter(c: MaskedColumn, f: ColumnFilter): boolean {
  return f === 'all' || c.verdict === f;
}

/**
 * Columns tab. Change detection is OnPush: ngDoCheck compares the store
 * state the view reads (references and counters) and marks the view only
 * when one moved, so wide schemas do not re-check every row on every event.
 * The rail and the grid are one tab stop each (roving tabindex): arrows
 * move inside, Tab moves on.
 */
@Component({
  selector: 'df-dm-columns',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgIf,
    NgFor,
    NgClass,
    NgTemplateOutlet,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatTooltipModule,
    TranslocoPipe,
    DfEmptyStateComponent,
    DfClassPickerComponent,
    DfEvidenceLedgerComponent,
    DfMaskedValueComponent,
    DfSensitivityStripComponent,
  ],
  templateUrl: './df-dm-columns.component.html',
  styleUrls: ['./df-dm-columns.component.scss'],
})
export class DfDmColumnsComponent implements OnInit, DoCheck, OnDestroy {
  readonly store = inject(DataMaskingStore);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  readonly allFilters = FILTERS;
  /** First run: one shortcut per framework into its Compliance baseline. */
  readonly baselines = BASELINES;

  @ViewChildren('rowEl') rowEls!: QueryList<ElementRef<HTMLElement>>;
  /** Rail table rows, in railKeys order. */
  @ViewChildren('railEl') railEls!: QueryList<ElementRef<HTMLElement>>;

  filter: ColumnFilter = 'review';
  search = '';
  selected: string | null = null;

  rail: RailGroup[] = [];
  /** Scanned databases with nothing to list under the current filter. */
  quiet: QuietRow[] = [];
  /** Column ids shown for the selected table; a decision never removes one. */
  private visible: string[] = [];
  rows: MaskedColumn[] = [];
  /** How many of `rows` are drawn; grows in chunks after a table opens. */
  shown = FIRST_ROWS;
  /**
   * Reviewing one column is easier next to its neighbours, so the review
   * filter lists the rest of the table after the queue, quietly.
   */
  context = new Set<string>();
  /** Index of the first quiet context row, or -1. */
  firstContext = -1;
  expanded = new Set<string>();
  /** Rows that just changed state, for the settle animation. */
  settled = new Set<string>();
  /** The grid row that holds the grid's one tab stop. */
  activeRow = 0;
  /** The rail row that holds the rail's one tab stop. */
  railFocus: string | null = null;

  private lastVersion = -1;
  private lastStructure = -1;
  private lastServices: ServiceTables[] | null = null;
  private seen: unknown[] = [];
  private sub?: Subscription;
  private timers = new Set<ReturnType<typeof setTimeout>>();
  private growTimer?: ReturnType<typeof setTimeout>;
  private searchTimer?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.sub = this.store.viewReset$.subscribe(() => {
      this.reset();
      this.cdr.markForCheck();
    });
    if (!this.store.loading) this.reset();
  }

  ngDoCheck(): void {
    const s = this.store;
    if (
      s.structure !== this.lastStructure ||
      s.services !== this.lastServices
    ) {
      this.lastStructure = s.structure;
      this.lastServices = s.services;
      this.lastVersion = s.version;
      if (!s.loading) this.buildRail();
    } else if (s.version !== this.lastVersion) {
      this.lastVersion = s.version;
      this.refreshRows();
      this.refreshRail();
    }
    // What the view reads: store state, and local state methods may change
    // outside a template event (tests, timers, the store's view resets).
    const now = [
      s.version,
      s.structure,
      s.services,
      s.overview,
      s.idFilter,
      s.settling,
      s.loading,
      s.tableCounts,
      this.rail,
      this.rows,
      this.quiet,
      this.filter,
      this.selected,
      this.shown,
      this.activeRow,
      this.search,
    ];
    if (now.some((v, i) => v !== this.seen[i])) {
      this.seen = now;
      this.cdr.markForCheck();
    }
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.timers.forEach(id => clearTimeout(id));
    this.timers.clear();
  }

  /** setTimeout that dies with the component and refreshes the view. */
  private later(fn: () => void, ms = 0): ReturnType<typeof setTimeout> {
    const id = setTimeout(() => {
      this.timers.delete(id);
      fn();
      this.cdr.markForCheck();
    }, ms);
    this.timers.add(id);
    return id;
  }

  private cancel(id?: ReturnType<typeof setTimeout>): void {
    if (id === undefined) return;
    clearTimeout(id);
    this.timers.delete(id);
  }

  // ----------------------------------------------------------- view state

  /** Re-snapshot from the store: filter, rail and selection. */
  reset(): void {
    const requested = this.store.filter;
    this.store.filter = null;
    if (this.store.idFilter) {
      this.filter = 'all';
    } else if (requested) {
      this.filter = requested;
    } else {
      this.filter = this.store.counts.review > 0 ? 'review' : 'masked';
    }
    this.buildRail();
  }

  setFilter(f: ColumnFilter): void {
    this.filter = f;
    this.buildRail();
  }

  /** Typing: rebuild once the keystrokes pause. */
  searchChanged(): void {
    this.cancel(this.searchTimer);
    this.searchTimer = this.later(() => this.onSearch(), SEARCH_DEBOUNCE_MS);
  }

  onSearch(): void {
    this.cancel(this.searchTimer);
    this.buildRail();
  }

  clearSearch(): void {
    this.search = '';
    this.onSearch();
  }

  clearIdFilter(): void {
    this.store.idFilter = null;
    this.buildRail();
  }

  select(key: string): void {
    const same = key === this.selected;
    this.selected = key;
    this.railFocus = key;
    this.expanded.clear();
    this.snapshotRows(!same);
  }

  private get q(): string {
    return this.search.trim().toLowerCase();
  }

  summary(service: string, table: string): TableSummary | undefined {
    return this.store.summaryOf(service, table);
  }

  summaryFor(key: string): TableSummary | undefined {
    const [service, table] = key.split('\u0000');
    return this.summary(service, table);
  }

  private columnPasses(c: MaskedColumn, tableHit: boolean): boolean {
    const ids = this.store.idFilter?.ids;
    if (ids && !ids.has(c.id)) return false;
    if (!passesFilter(c, this.filter)) return false;
    if (this.q && !tableHit && !c.column.toLowerCase().includes(this.q)) {
      return false;
    }
    return true;
  }

  private buildRail(): void {
    const q = this.q;
    const groups: RailGroup[] = [];
    for (const s of this.store.services) {
      const rows: RailRow[] = [];
      for (const t of s.tables) {
        const hit = !!q && t.name.toLowerCase().includes(q);
        const cols = this.store.tableColumns(s.service, t.name);
        if (!cols.some(c => this.columnPasses(c, hit))) continue;
        rows.push(this.railRow(s.service, t.name));
      }
      if (rows.length)
        groups.push({ service: s.service, label: s.label, rows });
    }
    this.rail = groups;
    this.quiet = this.quietRows();
    const keys = this.railKeys;
    const before = this.selected;
    if (!this.selected || !keys.includes(this.selected)) {
      this.selected = keys[0] ?? null;
      this.expanded.clear();
    }
    if (!this.railFocus || !keys.includes(this.railFocus)) {
      this.railFocus = this.selected;
    }
    this.snapshotRows(this.selected !== before);
  }

  private railRow(service: string, table: string): RailRow {
    return {
      key: tableKey(service, table),
      table,
      summary: this.summary(service, table),
    };
  }

  /** A decision changed some summaries: refresh them, keep membership. */
  private refreshRail(): void {
    this.rail = this.rail.map(g => ({
      ...g,
      rows: g.rows.map(r => {
        const [service] = r.key.split('\u0000');
        const summary = this.summary(service, r.table);
        return summary === r.summary ? r : { ...r, summary };
      }),
    }));
  }

  /**
   * Scanned databases missing from the rail: one with tables but nothing
   * masked or to review (under those filters), or one with no tables. They
   * stay listed so a scanned database never looks unscanned.
   */
  private quietRows(): QuietRow[] {
    if (this.store.idFilter) return [];
    const inRail = new Set(this.rail.map(g => g.service));
    const out: QuietRow[] = [];
    for (const s of this.store.services) {
      if (inRail.has(s.service) || this.store.scanErrorOf(s)) continue;
      if (!this.matchesSearch(s.label, s.service)) continue;
      if (!s.tables.length) {
        if (s.scannedAt) out.push({ ...this.quietOf(s), status: 'empty' });
        continue;
      }
      const sensitive = s.tables.some(
        t => t.columns.masked + t.columns.review > 0
      );
      if (
        !sensitive &&
        (this.filter === 'masked' || this.filter === 'review')
      ) {
        out.push({ ...this.quietOf(s), status: 'none' });
      }
    }
    return out;
  }

  private quietOf(s: ServiceTables) {
    return { service: s.service, label: s.label };
  }

  /** Open a "nothing sensitive" database under All, on its first table. */
  openQuiet(row: QuietRow): void {
    const svc = this.store.services.find(s => s.service === row.service);
    const first = svc?.tables[0]?.name;
    this.search = '';
    this.filter = 'all';
    this.buildRail();
    if (first) this.select(tableKey(row.service, first));
  }

  /**
   * Rebuild the row list for the selected table. `opened` is a different
   * table: drawing starts over from the first rows. The same table keeps
   * what is drawn (a filter or search change must not redraw it all).
   */
  private snapshotRows(opened = true): void {
    if (!this.selected) {
      this.visible = [];
      this.rows = [];
      this.context = new Set();
      this.firstContext = -1;
      return;
    }
    const [service, table] = this.selected.split('\u0000');
    const hit = !!this.q && table.toLowerCase().includes(this.q);
    const all = this.store.tableColumns(service, table);
    const queue = all.filter(c => this.columnPasses(c, hit)).map(c => c.id);
    const withContext =
      this.filter === 'review' && !this.q && !this.store.idFilter;
    const inQueue = new Set(queue);
    const rest = withContext
      ? all.map(c => c.id).filter(id => !inQueue.has(id))
      : [];
    this.context = new Set(rest);
    this.visible = [...queue, ...rest];
    if (opened) this.activeRow = 0;
    this.refreshRows();
    this.startGrowing(opened);
  }

  private refreshRows(): void {
    if (!this.selected) {
      this.rows = [];
      return;
    }
    const [service, table] = this.selected.split('\u0000');
    const byId = new Map(
      this.store.tableColumns(service, table).map(c => [c.id, c])
    );
    this.rows = this.visible
      .map(id => byId.get(id))
      .filter((c): c is MaskedColumn => !!c);
    this.firstContext = this.rows.findIndex(r => this.context.has(r.id));
    if (this.activeRow >= this.rows.length) this.activeRow = 0;
  }

  /** Draw the first rows now and the rest a chunk per tick. */
  private startGrowing(opened: boolean): void {
    this.cancel(this.growTimer);
    const keep = opened ? 0 : this.shown;
    this.shown = Math.min(this.rows.length, Math.max(FIRST_ROWS, keep));
    const grow = () => {
      this.shown = Math.min(this.rows.length, this.shown + ROW_CHUNK);
      if (this.shown < this.rows.length) this.growTimer = this.later(grow, 16);
    };
    if (this.shown < this.rows.length) this.growTimer = this.later(grow, 16);
  }

  get shownRows(): MaskedColumn[] {
    return this.shown >= this.rows.length
      ? this.rows
      : this.rows.slice(0, this.shown);
  }

  // -------------------------------------------------------------- derived

  get scanProgress(): number {
    return this.store.scanProgress ?? 0;
  }

  /** Scan button / first-run label: with a percentage once the server has one. */
  get scanningLabel(): string {
    const p = this.store.scanProgress;
    return p === null
      ? this.store.t('columns.scanningNoProgress')
      : this.store.t('columns.scanning', { progress: p });
  }

  scan(service?: string): void {
    if (!this.store.scanning) this.store.scan(service);
  }

  /**
   * The server lists no SQL database it could scan (a brand-new instance):
   * the first step is adding one, not scanning.
   */
  get noDatabases(): boolean {
    const c = this.store.overview?.coverage;
    return !!c && c.covered.length === 0 && !this.store.services.length;
  }

  /** The last (first) scan could not read these databases. */
  get firstScanFailures(): string {
    const scan = this.store.overview?.scan;
    if (scan?.lastStatus !== 'failed' || !scan.failed?.length) return '';
    return this.store.nameList(scan.failed.map(f => f.label || f.service));
  }

  addDatabase(): void {
    this.router.navigate([
      '/',
      ROUTES.API_CONNECTIONS,
      ROUTES.API_TYPES,
      ROUTES.DATABASE,
      ROUTES.CREATE,
    ]);
  }

  /** Open Compliance on a baseline. */
  openBaseline(b: BaselineDef): void {
    this.router.navigate(['/', ROUTES.API_SECURITY, ROUTES.COMPLIANCE], {
      queryParams: { baseline: b.id },
    });
  }

  private matchesSearch(...names: string[]): boolean {
    const q = this.q;
    return !q || names.some(n => n.toLowerCase().includes(q));
  }

  /** Covered services that were never scanned: shown with a Scan action. */
  get pendingServices(): ServiceTables[] {
    if (this.store.idFilter) return [];
    return this.store.unscannedServices.filter(s =>
      this.matchesSearch(s.label, s.service)
    );
  }

  /** Covered services the last scan could not read: shown with Retry. */
  get failedServices(): ServiceTables[] {
    if (this.store.idFilter) return [];
    return this.store.failedServices.filter(s =>
      this.matchesSearch(s.label, s.service)
    );
  }

  /** Services Data Masking cannot mask: a muted group at the rail's foot. */
  get uncovered(): CoverageService[] {
    if (this.store.idFilter) return [];
    return this.store.uncovered.filter(s =>
      this.matchesSearch(s.label, s.service, s.type)
    );
  }

  get railKeys(): string[] {
    return this.rail.flatMap(g => g.rows.map(r => r.key));
  }

  get selectedTable(): string {
    return this.selected?.split('\u0000')[1] ?? '';
  }

  get selectedService(): string {
    const svc = this.selected?.split('\u0000')[0];
    return this.store.services.find(s => s.service === svc)?.label ?? '';
  }

  /** Chips: To review only while there is something to review (or it is open). */
  get filters(): ColumnFilter[] {
    return FILTERS.filter(
      f => f !== 'review' || this.count('review') > 0 || this.filter === f
    );
  }

  /** Disjoint counts that add up to All, like the header and the export. */
  count(f: ColumnFilter): number {
    const c = this.store.counts;
    return f === 'all' ? c.masked + c.review + c.clear : c[f];
  }

  /** Review flow: the next rail table that still has columns to review. */
  get nextReviewTable(): string | null {
    if (this.filter !== 'review') return null;
    const keys = this.railKeys;
    const i = keys.indexOf(this.selected ?? '');
    const ordered = [...keys.slice(i + 1), ...keys.slice(0, Math.max(i, 0))];
    return (
      ordered.find(k => (this.summaryFor(k)?.columns.review ?? 0) > 0) ?? null
    );
  }

  get selectedDone(): boolean {
    return (
      this.filter === 'review' &&
      !!this.selected &&
      (this.summaryFor(this.selected)?.columns.review ?? 0) === 0
    );
  }

  stripLabel(t: TableSummary | undefined): string {
    if (!t) return '';
    return this.store.t('strip', {
      masked: t.columns.masked,
      review: t.columns.review,
      clear: t.columns.clear,
    });
  }

  decidedTip(c: MaskedColumn): string {
    const when = relTime(c.decidedAt);
    return c.decidedBy
      ? this.store.t('ledger.setBy', { name: c.decidedBy, when })
      : this.store.t('ledger.setByYou', { when });
  }

  // -------------------------------------------------------------- actions

  /**
   * Decide a column. From a row button, focus moves to the row first: the
   * button disappears with the decision, and keyboard review (j/k/m/n)
   * continues from the row.
   */
  decide(c: MaskedColumn, cls: string | null, row?: HTMLElement): void {
    if (row) {
      const i = this.rows.findIndex(r => r.id === c.id);
      if (i >= 0) this.activeRow = i;
      row.focus();
    }
    this.store.decide(c, cls);
    this.settled.add(c.id);
    this.later(() => this.settled.delete(c.id), 900);
  }

  /**
   * Keep masked confirms the detected class. A review column without one
   * has nothing to keep (and null would mean not sensitive), so the button
   * is hidden and the class chip is the way to decide.
   */
  canKeep(c: MaskedColumn): boolean {
    return c.verdict === 'review' && !!c.class;
  }

  keep(c: MaskedColumn, row?: HTMLElement): void {
    if (this.canKeep(c)) this.decide(c, c.class, row);
  }

  toggle(c: MaskedColumn): void {
    if (this.expanded.has(c.id)) this.expanded.delete(c.id);
    else this.expanded.add(c.id);
  }

  goNext(): void {
    const next = this.nextReviewTable;
    if (next) {
      this.select(next);
      this.later(() => this.focusRow(0));
    }
  }

  private focusRow(i: number): void {
    const target = Math.max(0, Math.min(i, this.rows.length - 1));
    this.activeRow = target;
    if (target >= this.shown) {
      this.shown = Math.min(this.rows.length, target + ROW_CHUNK);
      this.cdr.detectChanges();
    }
    this.rowEls?.toArray()[target]?.nativeElement.focus();
  }

  /** j/k (arrows, Home/End) move, m keeps masked, n marks not sensitive, enter expands. */
  onRowKey(e: KeyboardEvent, c: MaskedColumn, i: number): void {
    if (e.target !== e.currentTarget) return;
    switch (e.key) {
      case 'j':
      case 'ArrowDown':
        this.focusRow(i + 1);
        break;
      case 'k':
      case 'ArrowUp':
        this.focusRow(i - 1);
        break;
      case 'Home':
        this.focusRow(0);
        break;
      case 'End':
        this.focusRow(this.rows.length - 1);
        break;
      case 'm':
        this.keep(c);
        break;
      case 'n':
        if (c.verdict === 'review') this.decide(c, null);
        break;
      case 'Enter':
        this.toggle(c);
        break;
      default:
        return;
    }
    e.preventDefault();
  }

  /** Arrows (and Home/End) move through the rail; the focused table opens. */
  onRailKey(e: KeyboardEvent, key: string): void {
    const keys = this.railKeys;
    const i = keys.indexOf(key);
    let next: string | undefined;
    switch (e.key) {
      case 'ArrowDown':
        next = keys[Math.min(i + 1, keys.length - 1)];
        break;
      case 'ArrowUp':
        next = keys[Math.max(i - 1, 0)];
        break;
      case 'Home':
        next = keys[0];
        break;
      case 'End':
        next = keys[keys.length - 1];
        break;
      default:
        return;
    }
    e.preventDefault();
    if (!next || next === key) return;
    this.select(next);
    this.cdr.detectChanges();
    this.railEls?.toArray()[keys.indexOf(next)]?.nativeElement.focus();
  }

  trackRailRow = (_: number, r: RailRow) => r.key;
  trackGroup = (_: number, g: RailGroup) => g.service;
  trackService = (_: number, s: { service: string }) => s.service;
  trackBaseline = (_: number, b: BaselineDef) => b.id;
  trackRow = (_: number, c: MaskedColumn) => c.id;
  keyOf = (service: string, table: string) => tableKey(service, table);
}
