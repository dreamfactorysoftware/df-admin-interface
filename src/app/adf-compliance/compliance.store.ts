/**
 * State for the Compliance page. The page provides one instance. Baselines
 * load as a list; a baseline's checks load on selection and are cached.
 * Apply changes instance-wide settings, so after it every other baseline's
 * score is stale: the list reloads and the other cached details drop.
 */
import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, OnDestroy, inject } from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';
import {
  Observable,
  Subscription,
  catchError,
  finalize,
  of,
  switchMap,
  tap,
  timer,
} from 'rxjs';
import { DfSnackbarService } from 'src/app/shared/services/df-snackbar.service';
import { isAppError, normalizeError } from 'src/app/shared/utilities/app-error';
import { saveRawAsFile } from 'src/app/shared/utilities/file';
import { DfDataMaskingApiService } from 'src/app/adf-data-masking/data-masking-api.service';
import {
  MaskingMode,
  MaskingOverview,
} from 'src/app/adf-data-masking/data-masking.types';
import { DfComplianceApiService } from './compliance-api.service';
import { VERTICALS, verticalOrder } from './compliance.catalog';
import {
  BaselineChange,
  BaselineControl,
  BaselineDetail,
  BaselineSummary,
  ReportFormat,
} from './compliance.types';

export interface VerticalGroup {
  vertical: string;
  icon: string;
  baselines: BaselineSummary[];
}

/** Automated checks only: manual and n/a never count for or against. */
export function scoreOf(controls: BaselineControl[]): {
  pass: number;
  checked: number;
} {
  let pass = 0;
  let fail = 0;
  for (const c of controls) {
    if (c.status === 'pass') pass++;
    else if (c.status === 'fail') fail++;
  }
  return { pass, checked: pass + fail };
}

/**
 * Where a control's Fix link goes, as router commands. Only in-app routes
 * are honored ("/api-security/data-masking?tab=access", with or without the
 * leading slash or the "#"); anything with a scheme is dropped.
 */
export function fixLink(
  route: string | null | undefined
): { path: string; query: Record<string, string> } | null {
  if (!route) return null;
  let r = route.trim();
  if (!r || /^[a-z][a-z0-9+.-]*:/i.test(r) || r.startsWith('//')) return null;
  r = r.replace(/^\/?dreamfactory\/dist\/?/, '').replace(/^#/, '');
  const q = r.indexOf('?');
  const rawPath = q >= 0 ? r.slice(0, q) : r;
  const query: Record<string, string> = {};
  if (q >= 0) {
    new URLSearchParams(r.slice(q + 1)).forEach((v, k) => (query[k] = v));
  }
  const path = `/${rawPath.replace(/^\/+/, '')}`;
  return path === '/' ? null : { path, query };
}

/** yyyy-mm-dd in local time, for report file names. */
function today(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** How often a running scan is polled for progress. */
export const SCAN_POLL_MS = 2000;

@Injectable()
export class ComplianceStore implements OnDestroy {
  private api = inject(DfComplianceApiService);
  private masking = inject(DfDataMaskingApiService);
  private snackbar = inject(DfSnackbarService);
  private transloco = inject(TranslocoService);

  baselines: BaselineSummary[] | null = null;
  readonly details = new Map<string, BaselineDetail>();
  selectedId: string | null = null;

  loading = true;
  loadFailed = false;
  /**
   * The server's reason when the list failed (e.g. 503 "Data Masking is
   * not set up yet. Run: ..."); null for a generic failure.
   */
  loadError: string | null = null;
  detailFailed = false;
  /** Write in flight: apply / stop tracking / export. */
  busy: 'apply' | 'stop' | ReportFormat | null = null;
  /** Masking mode, for the "also turn masking on" choice; null = unknown. */
  maskingMode: MaskingMode | null = null;
  /** The last masking overview read; null = not read (or failed). */
  private overview: MaskingOverview | null = null;
  /** Apply started the first scan; shown until polling sees it finish. */
  private scanKicked = false;
  private poll?: Subscription;

  /** Only the latest detail request may land. */
  private detailSeq = 0;

  /**
   * No scan has found anything yet: none has finished, or only scans of
   * empty databases (the server still refuses On, and Apply scans again).
   */
  get neverScanned(): boolean {
    const o = this.overview;
    if (!o) return false;
    const c = o.counts;
    const found =
      (o.scan?.columns ?? 0) > 0 || (!!c && c.masked + c.review + c.clear > 0);
    return !o.scan?.finishedAt || !found;
  }

  /** A scan is running (one Apply started, or one already under way). */
  get scanning(): boolean {
    return this.scanKicked || this.overview?.scan?.status === 'running';
  }

  /** Scan progress 0-100, or null while the server can't say yet. */
  get scanProgress(): number | null {
    const p = this.overview?.scan?.progress;
    return this.overview?.scan?.status === 'running' && typeof p === 'number'
      ? p
      : null;
  }

  /**
   * Offer turning masking on with Apply: only once a scan has finished
   * (the server refuses On before the first scan) and while it isn't on.
   */
  get offerTurnOn(): boolean {
    return (
      !!this.overview &&
      !this.neverScanned &&
      !this.scanKicked &&
      this.overview.mode !== 'on'
    );
  }

  t(key: string, params?: Record<string, unknown>): string {
    return this.transloco.translate(`compliance.${key}`, params);
  }

  get selected(): BaselineSummary | undefined {
    return this.baselines?.find(b => b.id === this.selectedId);
  }

  get detail(): BaselineDetail | undefined {
    return this.selectedId ? this.details.get(this.selectedId) : undefined;
  }

  /** Baselines grouped by vertical, verticals in catalog order. */
  get groups(): VerticalGroup[] {
    const out = new Map<string, VerticalGroup>();
    const sorted = [...(this.baselines ?? [])].sort(
      (a, b) => verticalOrder(a.vertical) - verticalOrder(b.vertical)
    );
    for (const b of sorted) {
      let g = out.get(b.vertical);
      if (!g) {
        g = {
          vertical: b.vertical,
          icon:
            VERTICALS.find(v => v.id === b.vertical)?.icon ?? 'verified_user',
          baselines: [],
        };
        out.set(b.vertical, g);
      }
      g.baselines.push(b);
    }
    return [...out.values()];
  }

  /**
   * Load the list, then select `preferred` if it exists, else the first
   * tracked baseline, else the first one.
   */
  load(preferred?: string | null): void {
    this.loading = true;
    this.loadFailed = false;
    this.loadError = null;
    this.refreshMaskingMode();
    this.api.list().subscribe({
      next: list => {
        this.baselines = list;
        this.loading = false;
        const pick =
          list.find(b => b.id === preferred) ??
          list.find(b => b.adopted) ??
          list[0];
        if (pick) this.select(pick.id);
      },
      error: e => {
        this.loading = false;
        this.loadFailed = true;
        const message = normalizeError(e).message;
        this.loadError = /^(errors|alerts)\./.test(message) ? null : message;
      },
    });
  }

  select(id: string): void {
    if (!this.baselines?.some(b => b.id === id)) return;
    this.selectedId = id;
    this.detailFailed = false;
    this.loadDetail(id);
  }

  /**
   * (Re)load a baseline's checks; a cached copy stays up meanwhile. Every
   * response is cached under its own id, so a slow one for a baseline the
   * admin already left never shows in place of the selected one.
   */
  loadDetail(id: string): void {
    const n = ++this.detailSeq;
    this.detailFailed = false;
    this.api.get(id).subscribe({
      next: d => {
        this.details.set(id, d);
        this.patchSummary(d);
      },
      error: () => {
        if (n === this.detailSeq && !this.details.has(id)) {
          this.detailFailed = true;
        }
      },
    });
  }

  /** Keep the rail's score and tracking dot in step with a fresh detail. */
  private patchSummary(d: BaselineDetail): void {
    if (!this.baselines) return;
    const counts = { pass: 0, fail: 0, manual: 0, total: d.controls.length };
    for (const c of d.controls) {
      if (c.status === 'pass') counts.pass++;
      else if (c.status === 'fail') counts.fail++;
      else if (c.status === 'manual') counts.manual++;
    }
    this.baselines = this.baselines.map(b =>
      b.id === d.id ? { ...b, adopted: d.adopted, score: counts } : b
    );
  }

  private refreshMaskingMode(): void {
    this.masking.overview(true).subscribe({
      next: o => this.setOverview(o),
      error: () => {
        this.overview = null;
        this.maskingMode = null;
      },
    });
  }

  private setOverview(o: MaskingOverview): void {
    this.overview = o;
    this.maskingMode = o?.mode ?? null;
    if (o?.scan?.status === 'running') this.watchScan();
  }

  /**
   * Poll the scan until it finishes, then re-read the checks: the scan
   * decides masking.scanned and every count-based check.
   */
  private watchScan(): void {
    if (this.poll) return;
    this.poll = timer(SCAN_POLL_MS, SCAN_POLL_MS)
      .pipe(
        switchMap(() =>
          this.masking.overview(true).pipe(catchError(() => of(null)))
        )
      )
      .subscribe(o => {
        if (!o) return; // transient: keep polling
        this.overview = o;
        this.maskingMode = o.mode ?? null;
        if (o.scan?.status !== 'running') {
          this.stopPolling();
          this.scanKicked = false;
          this.afterScan();
        }
      });
  }

  private stopPolling(): void {
    this.poll?.unsubscribe();
    this.poll = undefined;
  }

  private afterScan(): void {
    const keep = this.selectedId;
    for (const id of [...this.details.keys()]) {
      if (id !== keep) this.details.delete(id);
    }
    this.reloadList();
    if (keep) this.loadDetail(keep);
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  /**
   * Apply (and adopt) a baseline. Settings are instance-wide, so every
   * other baseline's checks are stale afterwards.
   */
  apply(id: string, turnOn: boolean): Observable<BaselineDetail> {
    this.busy = 'apply';
    return this.api.apply(id, turnOn).pipe(
      tap({
        next: d => {
          const name = d.name || this.nameOf(id);
          this.details.clear();
          this.details.set(id, d);
          this.reloadList();
          if (d.scanStarted) {
            // Apply on a never-scanned instance starts the first scan.
            this.scanKicked = true;
            this.watchScan();
          }
          this.refreshMaskingMode();
          this.toast(
            d.scanStarted
              ? 'toast.appliedScanning'
              : turnOn
                ? 'toast.appliedOn'
                : 'toast.applied',
            { name }
          );
        },
        error: e => this.fail(e),
      }),
      finalize(() => (this.busy = null))
    );
  }

  /** What Apply would change with masking turned on too (read-only). */
  changesWithModeOn(id: string): Observable<BaselineChange[]> {
    return this.api.changesWithModeOn(id);
  }

  stopTracking(id: string): void {
    if (this.busy) return;
    this.busy = 'stop';
    const name = this.nameOf(id);
    this.api
      .stopTracking(id)
      .pipe(finalize(() => (this.busy = null)))
      .subscribe({
        next: () => {
          const d = this.details.get(id);
          if (d) this.details.set(id, { ...d, adopted: false });
          if (this.baselines) {
            this.baselines = this.baselines.map(b =>
              b.id === id ? { ...b, adopted: false } : b
            );
          }
          this.loadDetail(id);
          this.toast('toast.stopped', { name });
        },
        error: e => this.fail(e),
      });
  }

  /** Download the evidence report exactly as the server rendered it. */
  exportReport(id: string, format: ReportFormat): void {
    if (this.busy) return;
    this.busy = format;
    this.api
      .report(id, format)
      .pipe(finalize(() => (this.busy = null)))
      .subscribe({
        next: text =>
          saveRawAsFile(
            text,
            `dreamfactory-${id}-baseline-${today()}.${format}`,
            format
          ),
        error: e => this.fail(parseTextError(e)),
      });
  }

  private reloadList(): void {
    this.api.list().subscribe({
      next: list => (this.baselines = list),
      error: () => undefined,
    });
  }

  private nameOf(id: string): string {
    return this.baselines?.find(b => b.id === id)?.name ?? id;
  }

  toast(key: string, params?: Record<string, unknown>): void {
    this.snackbar.openSnackBar(this.t(key, params), 'success');
  }

  fail(e: unknown): void {
    this.snackbar.openError(isAppError(e) ? e : normalizeError(e));
  }
}

/**
 * A text-typed request's error body is the raw JSON string. Parse it back
 * into DreamFactory's error envelope so the toast carries the server's
 * message, not a generic status line. Works on the raw HttpErrorResponse
 * and on the AppError the error interceptor already made of it (toast-off
 * requests reach the store normalized, with the string body in `raw`).
 */
export function parseTextError(e: unknown): unknown {
  if (isAppError(e)) {
    const body = typeof e.raw === 'string' ? parseJson(e.raw) : null;
    if (!body) return e;
    const parsed = normalizeError(
      new HttpErrorResponse({ error: body, status: e.status, url: e.url }),
      { url: e.url, method: e.method }
    );
    return parsed.message.startsWith('errors.') ? e : parsed;
  }
  if (!(e instanceof HttpErrorResponse) || typeof e.error !== 'string') {
    return e;
  }
  const body = parseJson(e.error);
  return body
    ? new HttpErrorResponse({
        error: body,
        headers: e.headers,
        status: e.status,
        statusText: e.statusText,
        url: e.url ?? undefined,
      })
    : e;
}

function parseJson(text: string): object | null {
  try {
    const body: unknown = JSON.parse(text);
    return body && typeof body === 'object' ? body : null;
  } catch {
    return null;
  }
}
