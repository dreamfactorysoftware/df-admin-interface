/**
 * Shared state for the Data Masking page. The shell provides one instance;
 * every tab injects it. Writes are optimistic: the UI moves first, the
 * server confirms, and a failure rolls back with a single error toast.
 */
import { Injectable, OnDestroy, inject } from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';
import {
  EMPTY,
  Observable,
  Subject,
  Subscription,
  catchError,
  defer,
  exhaustMap,
  filter,
  finalize,
  forkJoin,
  from,
  fromEvent,
  interval,
  map,
  merge,
  mergeMap,
  of,
  retry,
  takeWhile,
  tap,
  timer,
  toArray,
} from 'rxjs';
import { DfSnackbarService } from 'src/app/shared/services/df-snackbar.service';
import { isAppError, normalizeError } from 'src/app/shared/utilities/app-error';
import { DfDataMaskingApiService } from './data-masking-api.service';
import { MaskFormat, classDef } from './data-masking.catalog';
import {
  AccessPatch,
  AccessSettings,
  ActivityEvent,
  ActivityKind,
  BuiltInRules,
  CoverageService,
  DetectionRule,
  MaskSetting,
  MaskedColumn,
  MaskingMode,
  MaskingOverview,
  ScanFailure,
  ScanOutcome,
  ServiceTables,
  StripMark,
  TableSummary,
  Verdict,
} from './data-masking.types';
import { DmUndoToastService } from './df-dm-undo-toast/df-dm-undo-toast.component';

export type ColumnFilter = 'review' | 'masked' | 'clear' | 'all';

/** Tab slices that load on their own and can fail on their own. */
export type DmSlice = 'access' | 'masks' | 'rules' | 'activity';

/** A column-id filter set from elsewhere (a rule's Matches count). */
export interface IdFilter {
  label: string;
  ids: Set<string>;
}

/** HTTP status of a failed request (AppError or raw), if any. */
export function errorStatus(e: unknown): number | undefined {
  return isAppError(e) ? e.status : (e as { status?: number })?.status;
}

export const tableKey = (service: string, table: string) =>
  `${service}\u0000${table}`;

/** Activity rows per page (the server's default). */
export const ACTIVITY_PAGE = 200;
/** How often an open page checks for scans it did not start. */
const WATCH_MS = 30_000;
/** Poll retries before a running scan is given up on. */
const POLL_RETRIES = 4;

export function stripMark(c: MaskedColumn): StripMark {
  if (c.verdict === 'review') return 'review';
  if (c.verdict === 'clear' || !c.tier) return 'clear';
  return c.tier;
}

export function summarize(
  name: string,
  cols: MaskedColumn[],
  rows?: number | null
): TableSummary {
  const columns = { masked: 0, review: 0, clear: 0 };
  for (const c of cols) columns[c.verdict]++;
  return {
    name,
    rows,
    columns,
    strip: cols.map(c => ({
      column: c.column,
      mark: stripMark(c),
      tier: c.tier,
    })),
  };
}

/**
 * The evidence line a rule writes on the columns it matches (the scanner's
 * Rules::describe): "Custom rule P", "Custom value rule P", or
 * "Baseline rule P (hipaa)".
 */
export function ruleEvidence(rule: DetectionRule): string {
  const kind = rule.match === 'value' ? 'value rule' : 'rule';
  const source = rule.source ?? 'admin';
  return source.startsWith('baseline:')
    ? `Baseline ${kind} ${rule.pattern} (${source.slice('baseline:'.length)})`
    : `Custom ${kind} ${rule.pattern}`;
}

/** What deleting a rule leaves behind. */
export interface RuleFootprint {
  /** Columns the rule masked (masked because of it, not decided by an admin). */
  masked: MaskedColumn[];
  /** Of those, the ones nothing else would flag: safe to unmask. */
  ruleOnly: MaskedColumn[];
}

export function ruleFootprint(
  rule: DetectionRule,
  columns: MaskedColumn[]
): RuleFootprint {
  const text = ruleEvidence(rule);
  const masked: MaskedColumn[] = [];
  const ruleOnly: MaskedColumn[] = [];
  for (const c of columns) {
    if (c.source !== 'detected' || c.verdict !== 'masked') continue;
    const lines = c.evidence?.lines ?? [];
    const line = lines.find(l => l.points > 0 && l.text === text);
    if (!line) continue;
    const others = lines
      .filter(l => l !== line)
      .reduce((sum, l) => sum + l.points, 0);
    if (others >= c.evidence.thresholdMask) continue; // masked anyway
    masked.push(c);
    if (others < c.evidence.thresholdReview) ruleOnly.push(c);
  }
  return { masked, ruleOnly };
}

interface AccessWrite {
  patch: AccessPatch;
  onError?: () => void;
  toast: string;
}

@Injectable()
export class DataMaskingStore implements OnDestroy {
  private api = inject(DfDataMaskingApiService);
  private snackbar = inject(DfSnackbarService);
  private undoToast = inject(DmUndoToastService);
  private transloco = inject(TranslocoService);

  overview: MaskingOverview | null = null;
  services: ServiceTables[] = [];
  /** Columns by service name. */
  columns = new Map<string, MaskedColumn[]>();
  access: AccessSettings | null = null;
  masks: MaskSetting[] | null = null;
  rules: DetectionRule[] | null = null;
  builtin: BuiltInRules | null = null;
  /** Activity for the current filter, newest first; null until loaded. */
  activity: ActivityEvent[] | null = null;
  /** Older activity exists for the current filter. */
  activityHasMore = false;
  activityLoadingOlder = false;

  loading = true;
  loadFailed = false;
  /** The server's reason when the page could not load (e.g. not set up). */
  loadError: string | null = null;
  /** Slices whose last load failed; their tab shows a retry state. */
  readonly failed = new Set<DmSlice>();
  /** A mode PATCH is in flight; the toggle waits for it. */
  modeSaving = false;

  /** Columns-tab view state, kept here so other tabs can steer it. */
  filter: ColumnFilter | null = null;
  idFilter: IdFilter | null = null;
  /** Emits whenever a tab should re-snapshot its view (filter jump). */
  readonly viewReset$ = new Subject<void>();
  /** Bumped on every column change so views can memoize cheaply. */
  version = 0;
  /**
   * Bumped when the service/table list is replaced (a scan finished in the
   * background): views rebuild their lists but keep filter and selection.
   */
  structure = 0;

  /**
   * First run: tables each covered database lists, by service, once the
   * probe answered (only asked before the first scan). A database that
   * could not be asked is left out, so it never counts as empty.
   */
  tableCounts: Map<string, number> | null = null;

  private poll?: Subscription;
  private watch?: Subscription;
  /**
   * Write sequence per target (column id, 'masks'). A response only lands
   * if it belongs to the latest write for its target, so a slow failure
   * can never roll back over a newer success.
   */
  private seq = new Map<string, number>();
  /**
   * Bumped by every mode change. An overview requested before the latest
   * change keeps the mode on screen, so a slow poll never puts an old mode
   * back.
   */
  private modeEpoch = 0;

  private nextSeq(key: string): number {
    const n = (this.seq.get(key) ?? 0) + 1;
    this.seq.set(key, n);
    return n;
  }

  private isLatest(key: string, n: number): boolean {
    return this.seq.get(key) === n;
  }

  t(key: string, params?: Record<string, unknown>): string {
    return this.transloco.translate(`dataMasking.${key}`, params);
  }

  /** "1 column" / "3 columns" from plural.<key>.one|other. */
  plural(key: string, count: number): string {
    return this.t(`plural.${key}.${count === 1 ? 'one' : 'other'}`, { count });
  }

  /** "hr", "hr and crm", "hr and 2 more". */
  nameList(names: string[]): string {
    if (names.length <= 1) return names[0] ?? '';
    if (names.length === 2) {
      return this.t('list.two', { a: names[0], b: names[1] });
    }
    return this.t('list.more', { a: names[0], count: names.length - 1 });
  }

  get mode(): MaskingMode {
    return this.overview?.mode ?? 'off';
  }

  get counts() {
    return this.overview?.counts ?? { masked: 0, review: 0, clear: 0 };
  }

  /**
   * Columns masked when masking is on: decided masked plus those still to
   * review (they fail closed). The counts on screen stay disjoint; only the
   * turn-on confirm uses this total.
   */
  get maskedTotal(): number {
    const c = this.counts;
    return c.masked + c.review;
  }

  /** Every column the last scan classified. */
  get totalColumns(): number {
    const c = this.counts;
    return c.masked + c.review + c.clear;
  }

  /**
   * Something has been classified. /table lists every covered service, a
   * never-scanned one with `tables: []`, so a service row alone proves
   * nothing: it takes a finished scan, a service with a scan time, or at
   * least one classified table.
   */
  get scanned(): boolean {
    return (
      !!this.overview?.scan.finishedAt ||
      this.services.some(s => s.tables.length > 0 || !!s.scannedAt)
    );
  }

  /**
   * A scan has found at least one column. A finished scan of empty
   * databases does not count: there is nothing to preview, and the server
   * refuses On until a scan finds columns (decision 21c).
   */
  get foundColumns(): boolean {
    return this.totalColumns > 0 || (this.overview?.scan.columns ?? 0) > 0;
  }

  /** Databases with at least one masked (or still-to-review) column. */
  get maskedDatabases(): number {
    return this.services.filter(s =>
      s.tables.some(t => t.columns.masked + t.columns.review > 0)
    ).length;
  }

  /** Database services Data Masking cannot mask (non-SQL connectors). */
  get uncovered(): CoverageService[] {
    return this.overview?.coverage?.uncovered ?? [];
  }

  /**
   * Covered services that have never been scanned (added since). A scanned
   * database with no tables has a scan time and nothing to show; it is not
   * "not scanned yet". One the last scan could not read is listed under
   * "Couldn't scan" instead.
   */
  get unscannedServices(): ServiceTables[] {
    return this.services.filter(
      s => !s.tables.length && !s.scannedAt && !this.scanErrorOf(s)
    );
  }

  /** Covered services the last scan could not read. */
  get failedServices(): ServiceTables[] {
    return this.services.filter(s => !!this.scanErrorOf(s));
  }

  /** Why a service could not be scanned: /table's scan_error, else the overview's list. */
  scanErrorOf(s: ServiceTables): string | null {
    if (s.scanError) return s.scanError;
    if (s.scanError === null) return null;
    const f = this.overview?.scan.failed?.find(x => x.service === s.service);
    return f ? f.reason || this.t('columns.scanFailed') : null;
  }

  /**
   * Scanned, and no covered database holds a table: there is nothing to
   * mask until a database with tables is added.
   */
  get noTables(): boolean {
    if (!this.services.length) return false;
    if (this.unscannedServices.length || this.failedServices.length) {
      return false;
    }
    return this.services.every(s => !s.tables.length);
  }

  /**
   * Before the first scan: every covered database answered the table probe
   * and none lists a table (a default install's built-in `db`), so a scan
   * would find nothing.
   */
  get nothingToScan(): boolean {
    const covered = this.overview?.coverage?.covered ?? [];
    const counts = this.tableCounts;
    if (!covered.length || !counts) return false;
    return covered.every(c => counts.get(c.service) === 0);
  }

  /** Scan progress 0-100, or null while the server can't say yet. */
  get scanProgress(): number | null {
    const p = this.overview?.scan.progress;
    return typeof p === 'number' ? p : null;
  }

  /**
   * Nothing has been classified yet: masking has nothing to act on, so
   * Preview and On wait for the first scan to finish.
   */
  get unscanned(): boolean {
    return !this.scanned && (this.overview?.scan.columns ?? 0) === 0;
  }

  /**
   * The server could not read its scan history: whether (and when) anything
   * was scanned is unknown, so the screen must not look never-scanned or
   * offer the first scan.
   */
  get scanUnknown(): boolean {
    return (
      !!this.overview?.scan.unknown || this.services.some(s => !!s.scanUnknown)
    );
  }

  /**
   * The first-run view: never scanned, or the first scan just finished and
   * its results are still loading (so the page never flashes an empty
   * filter between the last poll and the first table list).
   */
  get firstRun(): boolean {
    return !this.scanned || this.settling;
  }

  /** The first scan finished and its tables/columns are loading. */
  settling = false;

  get scanning(): boolean {
    return this.overview?.scan.status === 'running';
  }

  /** Can the signed-in admin lower the mode (On to Preview or Off)? */
  get canLower(): boolean {
    return !!this.overview?.you.canGrant;
  }

  load(): void {
    this.loading = true;
    this.loadError = null;
    const epoch = this.modeEpoch;
    forkJoin({
      overview: this.api.overview(),
      services: this.api.tables(),
    }).subscribe({
      next: ({ overview, services }) => {
        this.applyOverview(overview, epoch);
        this.setServices(services);
        this.loadColumns().subscribe(() => {
          this.loading = false;
          this.loadFailed = false;
          this.viewReset$.next();
        });
        if (overview.scan.status === 'running') this.startPolling(false);
        if (this.unscanned) this.probeTables();
      },
      error: e => {
        this.loading = false;
        this.loadFailed = true;
        const err = isAppError(e) ? e : normalizeError(e);
        // "Not set up yet: run …" is worth showing in place; generic
        // failures keep the plain message.
        this.loadError = err.status === 503 ? err.message : null;
      },
    });
  }

  private setServices(services: ServiceTables[]): void {
    this.services = services;
    this.structure++;
  }

  private loadColumns(): Observable<void> {
    if (!this.services.length) return of(undefined);
    return forkJoin(
      this.services.map(s =>
        this.api.columns(s.service).pipe(
          tap(cols => this.columns.set(s.service, cols)),
          catchError(() => of([]))
        )
      )
    ).pipe(
      map(() => {
        this.version++;
      })
    );
  }

  /**
   * First run only: ask each covered database how many tables it lists, so
   * an instance whose only database is empty is sent to add one instead of
   * scanning nothing. A database that cannot answer is assumed worth a scan.
   */
  private probeTables(): void {
    const covered = this.overview?.coverage?.covered ?? [];
    // A real instance with many databases is never "nothing to scan".
    if (!covered.length || covered.length > 5) return;
    forkJoin(
      covered.map(c =>
        this.api.tableCount(c.service).pipe(
          map(n => [c.service, n] as const),
          catchError(() => of(null))
        )
      )
    ).subscribe(rows => {
      const counts = new Map<string, number>();
      rows.forEach(r => r && counts.set(r[0], r[1]));
      this.tableCounts = counts;
    });
  }

  private tableIndex: {
    version: number;
    lists: MaskedColumn[][];
    map: Map<string, MaskedColumn[]>;
  } = { version: -1, lists: [], map: new Map() };

  /** Every loaded column, in rail order. */
  allColumns(): MaskedColumn[] {
    return this.services.flatMap(s => this.columns.get(s.service) ?? []);
  }

  /**
   * A table's columns, from an index rebuilt once per column change (or
   * when a service's column list is replaced).
   */
  tableColumns(service: string, table: string): MaskedColumn[] {
    const lists = [...this.columns.values()];
    const idx = this.tableIndex;
    const fresh =
      idx.version === this.version &&
      idx.lists.length === lists.length &&
      idx.lists.every((l, i) => l === lists[i]);
    if (!fresh) {
      const map = new Map<string, MaskedColumn[]>();
      for (const [svc, cols] of this.columns) {
        for (const c of cols) {
          const k = tableKey(svc, c.table);
          const list = map.get(k);
          if (list) list.push(c);
          else map.set(k, [c]);
        }
      }
      this.tableIndex = { version: this.version, lists, map };
    }
    return this.tableIndex.map.get(tableKey(service, table)) ?? [];
  }

  private summaryIndex: {
    services: ServiceTables[] | null;
    version: number;
    map: Map<string, TableSummary>;
  } = { services: null, version: -1, map: new Map() };

  /** A table's rail summary (counts and strip). */
  summaryOf(service: string, table: string): TableSummary | undefined {
    const idx = this.summaryIndex;
    if (idx.services !== this.services || idx.version !== this.version) {
      const m = new Map<string, TableSummary>();
      for (const s of this.services) {
        for (const t of s.tables) m.set(tableKey(s.service, t.name), t);
      }
      this.summaryIndex = {
        services: this.services,
        version: this.version,
        map: m,
      };
    }
    return this.summaryIndex.map.get(tableKey(service, table));
  }

  /**
   * Take an overview response. One requested before the latest mode change
   * (or while one is saving) keeps the mode on screen: it is older news.
   */
  private applyOverview(o: MaskingOverview, epoch: number): void {
    const stale = epoch !== this.modeEpoch || this.modeSaving;
    this.overview =
      stale && this.overview ? { ...o, mode: this.overview.mode } : o;
  }

  // ---------------------------------------------------------------- mode

  setMode(mode: MaskingMode): void {
    if (!this.overview || this.modeSaving || mode === this.overview.mode) {
      return;
    }
    const prev = this.overview.mode;
    this.modeEpoch++;
    this.overview = { ...this.overview, mode };
    this.modeSaving = true;
    this.api
      .setMode(mode)
      .pipe(finalize(() => (this.modeSaving = false)))
      .subscribe({
        next: o => {
          this.overview = { ...this.overview!, ...o };
          this.toast(
            prev === 'on' && mode === 'preview'
              ? 'toast.mode.paused'
              : `toast.mode.${mode}`
          );
          this.invalidateActivity();
        },
        error: e => {
          this.overview = { ...this.overview!, mode: prev };
          this.fail(e);
        },
      });
  }

  // ---------------------------------------------------------------- scan

  /** Mode before the running scan started: the first scan may move it. */
  private modeAtScan: MaskingMode | null = null;
  /** finished_at before the running scan: tells an old backend's failure. */
  private finishedBefore: string | null = null;

  /** Scan every covered service, or just `service`. */
  scan(service?: string): void {
    if (!this.overview || this.scanning) return;
    this.modeAtScan = this.overview.mode;
    this.finishedBefore = this.overview.scan.finishedAt ?? null;
    this.overview = {
      ...this.overview,
      scan: { ...this.overview.scan, status: 'running', progress: 0 },
    };
    const epoch = this.modeEpoch;
    this.api.scan(service).subscribe({
      next: o => {
        this.applyOverview(o, epoch);
        this.startPolling(true);
      },
      error: e => {
        this.overview = {
          ...this.overview!,
          scan: { ...this.overview!.scan, status: 'idle' },
        };
        this.fail(e);
      },
    });
  }

  /**
   * Poll the overview while a scan runs. exhaustMap never stacks requests
   * behind a slow backend, a failed poll is retried with backoff (one proxy
   * blip must not abandon the scan), and takeWhile(…, true) lets exactly
   * one finished response through, so the finish work runs once. `own`
   * scans (started here) announce how they ended; one found running in
   * the background just refreshes the page.
   */
  private startPolling(own: boolean): void {
    this.poll?.unsubscribe();
    if (!own) {
      this.modeAtScan = this.overview?.mode ?? null;
      this.finishedBefore = this.overview?.scan.finishedAt ?? null;
    }
    let finished = false;
    this.poll = timer(800, 800)
      .pipe(
        exhaustMap(() => {
          const epoch = this.modeEpoch;
          // defer: every retry is a fresh request.
          return defer(() => this.api.overview(true)).pipe(
            retry({ count: POLL_RETRIES, delay: (_e, i) => timer(1000 * i) }),
            map(o => ({ o, epoch }))
          );
        }),
        takeWhile(({ o }) => o.scan.status === 'running', true)
      )
      .subscribe({
        next: ({ o, epoch }) => {
          this.applyOverview(o, epoch);
          if (o.scan.status !== 'running') finished = true;
        },
        complete: () => {
          this.poll = undefined;
          if (finished) this.finishScan(own);
        },
        error: e => {
          this.poll = undefined;
          // Polling lost the scan after its retries: stop showing it as
          // running so Scan now is usable again, and say so once.
          if (this.overview) {
            this.overview = {
              ...this.overview,
              scan: { ...this.overview.scan, status: 'idle' },
            };
          }
          this.fail(e);
        },
      });
  }

  /** How the scan that just finished went. */
  private outcome(): ScanOutcome {
    const scan = this.overview?.scan;
    if (scan?.lastStatus) return scan.lastStatus;
    // A backend without last_status: a failed scan leaves finished_at alone.
    return scan?.finishedAt && scan.finishedAt !== this.finishedBefore
      ? 'done'
      : 'failed';
  }

  private finishScan(own: boolean): void {
    // The server switches Off to Preview after the first scan ever; the
    // last poll already carried the new mode, so say why it moved.
    const toPreview =
      this.modeAtScan === 'off' && this.overview?.mode === 'preview';
    const outcome = this.outcome();
    const failed: ScanFailure[] = this.overview?.scan.failed ?? [];
    this.modeAtScan = null;
    const first = !this.services.some(s => s.tables.length || s.scannedAt);
    this.settling = first && outcome !== 'failed';
    this.api.tables().subscribe({
      next: services => {
        this.setServices(services);
        this.loadColumns().subscribe(() => {
          this.settling = false;
          this.invalidateActivity();
          // The first results pick the opening filter; later ones keep the
          // admin's place (filter, table) and only refresh the lists.
          if (first) this.viewReset$.next();
          if (own || outcome !== 'done')
            this.announce(outcome, failed, toPreview);
        });
      },
      error: () => (this.settling = false),
    });
  }

  private announce(
    outcome: ScanOutcome,
    failed: ScanFailure[],
    toPreview: boolean
  ): void {
    const label = this.nameList(failed.map(f => f.label || f.service));
    if (outcome === 'done') {
      this.toast(toPreview ? 'toast.scanDonePreview' : 'toast.scanDone');
    } else if (outcome === 'partial') {
      this.warn('toast.scanPartial', { label });
    } else {
      this.warn(label ? 'toast.scanFailed' : 'toast.scanFailedNoReason', {
        label,
      });
    }
  }

  /**
   * Keep an open page current: every 30 s while it is visible, and when the
   * window regains focus, re-read the overview. A scan started elsewhere
   * (a new database, the CLI) is followed to its end; results that changed
   * since (finished_at or the covered databases) reload the lists in place.
   */
  startWatching(): void {
    if (this.watch || typeof window === 'undefined') return;
    const visible = () =>
      typeof document === 'undefined' || document.visibilityState !== 'hidden';
    this.watch = merge(
      interval(WATCH_MS),
      fromEvent(window, 'focus'),
      fromEvent(document, 'visibilitychange')
    )
      .pipe(
        filter(
          () =>
            visible() &&
            !this.loading &&
            !!this.overview &&
            !this.poll &&
            !this.scanning
        ),
        exhaustMap(() => {
          const epoch = this.modeEpoch;
          return this.api.overview(true).pipe(
            map(o => ({ o, epoch })),
            catchError(() => EMPTY)
          );
        })
      )
      .subscribe(({ o, epoch }) => this.onWatched(o, epoch));
  }

  stopWatching(): void {
    this.watch?.unsubscribe();
    this.watch = undefined;
  }

  private onWatched(o: MaskingOverview, epoch: number): void {
    const prev = this.overview;
    if (!prev || this.poll) return;
    const covered = (x: MaskingOverview | null) =>
      (x?.coverage?.covered ?? []).map(c => c.service).join('\u0000');
    const changed =
      (o.scan.finishedAt ?? null) !== (prev.scan.finishedAt ?? null) ||
      covered(o) !== covered(prev);
    // Counts move with optimistic decisions; keep ours while any is saving.
    const keepCounts = this.confirmed.size > 0;
    this.applyOverview(keepCounts ? { ...o, counts: prev.counts } : o, epoch);
    if (o.scan.status === 'running') {
      this.startPolling(false);
    } else if (changed) {
      this.refreshTables();
    }
  }

  /** Reload the table list and columns in place (no filter reset). */
  private refreshTables(): void {
    this.api.tables().subscribe({
      next: services => {
        this.setServices(services);
        this.loadColumns().subscribe(() => this.invalidateActivity());
      },
      error: () => undefined,
    });
  }

  // ------------------------------------------------------------ decisions

  /**
   * Record an admin decision: a class id masks the column with that class,
   * null marks it not sensitive.
   */
  decide(col: MaskedColumn, cls: string | null): void {
    const { service, id } = col;
    // Roll back to what the server last confirmed, not to whatever an
    // earlier optimistic write left on screen.
    const before = this.confirmed.get(id) ?? this.findColumn(service, id);
    if (!before) return;
    const shown = this.findColumn(service, id) ?? before;
    if (!this.confirmed.has(id)) {
      // Every write so far is older than this baseline.
      this.confirmed.set(id, { ...before });
      this.confirmedSeq.set(id, this.seq.get(id) ?? 0);
    }
    const n = this.nextSeq(id);
    const verdict: Verdict = cls ? 'masked' : 'clear';
    const def = classDef(cls);
    this.patchColumn(service, id, {
      verdict,
      class: cls,
      tier: def?.tier ?? null,
      source: 'admin',
      decidedBy: null,
      decidedAt: new Date().toISOString(),
    });
    // Unmasking says so once it is saved, with an Undo that masks the
    // column again with the class it had.
    const undoTo =
      !cls && shown.verdict !== 'clear' && shown.class ? shown.class : null;
    this.api.decide(id, cls).subscribe({
      next: saved => {
        if (!this.isLatest(id, n)) {
          // A newer write is in flight; it owns the screen. Remember this
          // one as confirmed (unless a newer one already confirmed) in case
          // the newer one fails.
          if (this.confirmed.has(id) && n > (this.confirmedSeq.get(id) ?? 0)) {
            this.confirmed.set(id, { ...before, ...saved });
            this.confirmedSeq.set(id, n);
          }
          return;
        }
        this.confirmed.delete(id);
        this.confirmedSeq.delete(id);
        this.patchColumn(service, id, saved);
        this.invalidateActivity();
        if (undoTo) this.offerUndo(col, undoTo);
      },
      error: e => {
        if (!this.isLatest(id, n)) return;
        const back = this.confirmed.get(id) ?? before;
        this.confirmed.delete(id);
        this.confirmedSeq.delete(id);
        this.patchColumn(service, id, back);
        this.fail(e);
      },
    });
  }

  private offerUndo(col: MaskedColumn, cls: string): void {
    this.undoToast.open(
      this.t('toast.notSensitive', { column: col.column }),
      this.t('undo'),
      () => {
        const now = this.findColumn(col.service, col.id);
        if (now && now.verdict === 'clear') this.decide(now, cls);
      }
    );
  }

  /** Last server-confirmed state of columns with writes in flight. */
  private confirmed = new Map<string, MaskedColumn>();
  /** The newest write each confirmed state already includes. */
  private confirmedSeq = new Map<string, number>();

  private findColumn(service: string, id: string): MaskedColumn | undefined {
    return this.columns.get(service)?.find(c => c.id === id);
  }

  private patchColumn(
    service: string,
    id: string,
    patch: Partial<MaskedColumn>
  ): void {
    const list = this.columns.get(service);
    if (!list) return;
    const i = list.findIndex(c => c.id === id);
    if (i < 0) return;
    const prev = list[i];
    const next: MaskedColumn = { ...prev, ...patch };
    list[i] = next;
    this.version++;
    // Keep the rail summaries and header counts in step.
    const svc = this.services.find(s => s.service === service);
    const idx = svc?.tables.findIndex(t => t.name === next.table) ?? -1;
    if (svc && idx >= 0) {
      svc.tables[idx] = summarize(
        next.table,
        this.tableColumns(service, next.table),
        svc.tables[idx].rows
      );
    }
    if (this.overview && prev.verdict !== next.verdict) {
      const counts = { ...this.overview.counts };
      counts[prev.verdict]--;
      counts[next.verdict]++;
      this.overview = { ...this.overview, counts };
    }
  }

  // --------------------------------------------------------------- access

  /**
   * (Re)load access. The tab calls this every time it opens; a write in
   * flight owns the screen, so a read that lands meanwhile is dropped.
   */
  loadAccess(quiet = false): void {
    this.failed.delete('access');
    this.api.access(quiet).subscribe({
      next: a => {
        if (this.accessBusy || this.accessQueue.length) return;
        this.access = a;
        this.accessConfirmed = a;
      },
      error: () => {
        if (!this.access) this.failed.add('access');
      },
    });
  }

  /** Access as the server last confirmed it (with its version). */
  private accessConfirmed: AccessSettings | null = null;
  private accessQueue: AccessWrite[] = [];
  private accessBusy = false;

  /**
   * Auto-save one access change. Writes go out one at a time, each with
   * the version of the last answer, so a change made elsewhere since the
   * page read access is refused (409) instead of being overwritten. A
   * failure restores the last confirmed settings, drops the writes queued
   * behind it (they were built on the refused state) and calls their
   * `onError` so the view can drop local choices; a 409 also re-reads.
   */
  updateAccess(
    patch: AccessPatch,
    optimistic: AccessSettings,
    onError?: () => void,
    toast = 'toast.access'
  ): void {
    this.access = optimistic;
    this.accessQueue.push({ patch, onError, toast });
    this.drainAccess();
  }

  private drainAccess(): void {
    if (this.accessBusy) return;
    const write = this.accessQueue.shift();
    if (!write) return;
    this.accessBusy = true;
    const version = this.accessConfirmed?.version;
    const body: AccessPatch = version
      ? { ...write.patch, version }
      : write.patch;
    this.api.updateAccess(body).subscribe({
      next: a => {
        this.accessBusy = false;
        this.accessConfirmed = a;
        if (!this.accessQueue.length) {
          this.access = a;
          this.invalidateActivity();
          this.refreshOverview();
          this.toast(write.toast);
        }
        this.drainAccess();
      },
      error: e => {
        this.accessBusy = false;
        const dropped = [write, ...this.accessQueue];
        this.accessQueue = [];
        this.access = this.accessConfirmed;
        dropped.forEach(w => w.onError?.());
        if (errorStatus(e) === 409) {
          // Changed elsewhere (another admin, the CLI, a grant that ended):
          // the page re-reads, so say that rather than "reload".
          this.warn('toast.accessStale');
          this.loadAccess(true);
        } else {
          this.fail(e);
        }
      },
    });
  }

  private refreshOverview(): void {
    const epoch = this.modeEpoch;
    this.api.overview().subscribe({
      next: o => this.applyOverview(o, epoch),
      error: () => undefined,
    });
  }

  /** Baselines being tracked, for the grant limit they set (quiet). */
  trackedBaselines: string[] | null = null;

  loadTrackedBaselines(): void {
    this.api.baselines().subscribe({
      next: list =>
        (this.trackedBaselines = list.filter(b => b.adopted).map(b => b.id)),
      error: () => undefined,
    });
  }

  // ---------------------------------------------------------------- masks

  loadMasks(): void {
    this.failed.delete('masks');
    this.api.masks().subscribe({
      next: m => {
        this.masks = m;
        this.masksConfirmed = m;
      },
      error: () => {
        if (!this.masks) this.failed.add('masks');
      },
    });
  }

  private masksConfirmed: MaskSetting[] | null = null;

  setMask(cls: string, format: MaskFormat): void {
    if (!this.masks) return;
    const n = this.nextSeq('masks');
    this.masks = this.masks.map(m => (m.class === cls ? { ...m, format } : m));
    this.api.setMask(cls, format).subscribe({
      next: masks => {
        if (masks.length) this.masksConfirmed = masks;
        if (!this.isLatest('masks', n)) return;
        if (masks.length) this.masks = masks;
        this.invalidateActivity();
        // Column examples follow the class format.
        this.loadColumns().subscribe();
        this.toast('toast.mask');
      },
      error: e => {
        if (!this.isLatest('masks', n)) return;
        this.masks = this.masksConfirmed;
        this.fail(e);
      },
    });
  }

  // ---------------------------------------------------------------- rules

  loadRules(): void {
    this.failed.delete('rules');
    this.api.rules().subscribe({
      next: r => (this.rules = r),
      error: () => {
        if (!this.rules) this.failed.add('rules');
      },
    });
    if (!this.builtin) {
      this.api.builtInRules().subscribe({
        next: b => (this.builtin = b),
        error: () => undefined,
      });
    }
  }

  /**
   * Save a custom rule. Returns the request so the dialog can stay open
   * (and keep what was typed) until the server accepts it; a refused rule
   * is the caller's to explain inline. Not being allowed to change
   * settings (403) is no fault of the rule: it gets the error toast, like
   * every other write.
   */
  addRule(
    rule: Pick<DetectionRule, 'match' | 'pattern' | 'class'>
  ): Observable<DetectionRule> {
    return this.api.addRule(rule).pipe(
      tap({
        next: saved => {
          this.rules = [...(this.rules ?? []), saved];
          this.invalidateActivity();
          this.toast('toast.ruleAdded');
          this.reloadAfterRule();
        },
        error: e => {
          if (errorStatus(e) === 403) this.fail(e);
        },
      })
    );
  }

  /** What deleting `rule` leaves masked, from the loaded columns. */
  footprint(rule: DetectionRule): RuleFootprint {
    return ruleFootprint(rule, this.allColumns());
  }

  /**
   * Delete a rule. Its columns stay masked (automatic changes never clear
   * masking); `unmask` lists the ones to mark not sensitive with it. A
   * failure puts back only this rule, never the whole list.
   */
  deleteRule(rule: DetectionRule, unmask: MaskedColumn[] = []): void {
    const kept = this.footprint(rule).masked.length;
    this.rules = (this.rules ?? []).filter(r => r.id !== rule.id);
    this.api.deleteRule(rule.id).subscribe({
      next: () => {
        this.invalidateActivity();
        if (!unmask.length) {
          this.toast(kept ? 'toast.ruleDeletedKept' : 'toast.ruleDeleted', {
            columns: this.plural('columns', kept),
          });
          this.reloadAfterRule();
          return;
        }
        from(unmask)
          .pipe(
            mergeMap(
              c =>
                this.api.decide(c.id, null).pipe(
                  map((): unknown => null),
                  catchError(e => of(e ?? true))
                ),
              4
            ),
            toArray()
          )
          .subscribe(results => {
            const failures = results.filter(r => r !== null);
            const done = results.length - failures.length;
            const forbidden = failures.find(e => errorStatus(e) === 403);
            if (!failures.length) {
              this.toast('toast.ruleDeletedUnmasked', {
                columns: this.plural('columns', done),
              });
            } else if (forbidden) {
              // Not allowed to mark columns not sensitive: the server says
              // why; the reload shows which columns stayed masked.
              this.fail(forbidden);
            } else {
              this.warn('toast.ruleUnmaskPartial', {
                done,
                total: results.length,
              });
            }
            this.reloadAfterRule();
          });
      },
      error: e => {
        if (!(this.rules ?? []).some(r => r.id === rule.id)) {
          this.rules = [...(this.rules ?? []), rule].sort(
            (a, b) => a.id - b.id
          );
        }
        this.fail(e);
      },
    });
  }

  /** Rules change verdicts and counts, so re-read them. */
  private reloadAfterRule(): void {
    const epoch = this.modeEpoch;
    forkJoin({
      overview: this.api.overview(),
      services: this.api.tables(),
    }).subscribe({
      next: ({ overview, services }) => {
        this.applyOverview(overview, epoch);
        this.setServices(services);
        this.loadColumns().subscribe();
      },
      error: () => undefined,
    });
  }

  // ------------------------------------------------------------- activity

  /** The kinds the Activity list shows ('' = every kind), null = never opened. */
  private activityKey: string | null = null;
  private activityKinds: ActivityKind[] | null = null;
  /** Pages already loaded per filter, so switching chips back is instant. */
  private activityCache = new Map<
    string,
    { events: ActivityEvent[]; hasMore: boolean }
  >();
  private activitySub?: Subscription;

  /**
   * Show activity of these kinds (all when null). The server filters and
   * pages, so a quiet kind is never hidden behind a busy one.
   */
  showActivity(kinds: ActivityKind[] | null): void {
    const key = kinds?.join(',') ?? '';
    if (key === this.activityKey && this.activity) return;
    this.activityKey = key;
    this.activityKinds = kinds;
    const cached = this.activityCache.get(key);
    this.activity = cached?.events ?? null;
    this.activityHasMore = cached?.hasMore ?? false;
    this.loadActivity();
  }

  /** Loads (or refreshes) the first page. The old list stays up meanwhile. */
  loadActivity(): void {
    if (this.activityKey === null) {
      this.activityKey = '';
      this.activityKinds = null;
    }
    const key = this.activityKey;
    this.failed.delete('activity');
    this.activitySub?.unsubscribe();
    this.activitySub = this.api
      .activity({ kinds: this.activityKinds, limit: ACTIVITY_PAGE })
      .subscribe({
        next: page => {
          // Older pages already loaded stay below the fresh first page.
          const cur = key === this.activityKey ? this.activity : null;
          const last = page.events[page.events.length - 1];
          const merged =
            cur && last && cur.length > page.events.length
              ? {
                  events: [...page.events, ...cur.filter(e => e.id < last.id)],
                  hasMore: this.activityHasMore,
                }
              : page;
          this.activityCache.set(key, merged);
          if (key !== this.activityKey) return;
          this.activity = merged.events;
          this.activityHasMore = merged.hasMore;
        },
        error: () => {
          if (key === this.activityKey && !this.activity) {
            this.failed.add('activity');
          }
        },
      });
  }

  /** Append the next older page. */
  loadOlderActivity(): void {
    const list = this.activity;
    const key = this.activityKey;
    if (!list?.length || key === null || this.activityLoadingOlder) return;
    this.activityLoadingOlder = true;
    this.api
      .activity({
        kinds: this.activityKinds,
        limit: ACTIVITY_PAGE,
        before: list[list.length - 1].id,
      })
      .pipe(finalize(() => (this.activityLoadingOlder = false)))
      .subscribe({
        next: page => {
          if (key !== this.activityKey) return;
          const seen = new Set(list.map(e => e.id));
          this.activity = [
            ...list,
            ...page.events.filter(e => !seen.has(e.id)),
          ];
          this.activityHasMore = page.hasMore;
          this.activityCache.set(key, {
            events: this.activity,
            hasMore: page.hasMore,
          });
        },
        error: e => this.fail(e),
      });
  }

  /**
   * Something happened that Activity would list. If the list was opened,
   * refresh the current filter in place (other filters reload when picked);
   * otherwise the tab loads fresh when opened.
   */
  invalidateActivity(): void {
    if (this.activityKey === null) return;
    this.activityCache.clear();
    this.loadActivity();
  }

  // ---------------------------------------------------------- navigation

  /** Steer the Columns tab (from header counts or a rule's Matches). */
  showColumns(filter: ColumnFilter, idFilter: IdFilter | null = null): void {
    this.filter = filter;
    this.idFilter = idFilter;
    this.viewReset$.next();
  }

  // -------------------------------------------------------------- helpers

  toast(key: string, params?: Record<string, unknown>): void {
    this.snackbar.openSnackBar(this.t(key, params), 'success');
  }

  warn(key: string, params?: Record<string, unknown>): void {
    this.snackbar.openSnackBar(this.t(key, params), 'warning');
  }

  fail(e: unknown): void {
    this.snackbar.openError(isAppError(e) ? e : normalizeError(e));
  }

  ngOnDestroy(): void {
    this.poll?.unsubscribe();
    this.stopWatching();
    this.activitySub?.unsubscribe();
  }
}
