import { NgFor, NgIf } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewContainerRef,
  computed,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoPipe, TranslocoService } from '@ngneat/transloco';
import {
  EMPTY,
  Observable,
  Subscription,
  concatMap,
  from,
  map,
  of,
  catchError,
} from 'rxjs';
import { saveRawAsFile } from 'src/app/shared/utilities/file';
import { DfBadgeComponent } from 'src/app/shared/components/df-badge/df-badge.component';
import { DfConfirmDialogComponent } from 'src/app/shared/components/df-confirm-dialog/df-confirm-dialog.component';
import { DfEmptyStateComponent } from 'src/app/shared/components/df-empty-state/df-empty-state.component';
import { DfPageHeaderComponent } from 'src/app/shared/components/df-page-header/df-page-header.component';
import {
  SEMANTIC_KINDS,
  SemanticDraftReport,
  SemanticEntry,
  SemanticImportReport,
  SemanticKind,
  SemanticStatus,
  SemanticValidateResult,
  isAutomated,
  reviewCounts,
  serverMessage,
  summarize,
  Translate,
} from './semantic-catalog';
import { SemanticCatalogApiService } from './semantic-catalog-api.service';
import {
  DfSemanticEntryDialogComponent,
  SemanticEntryDialogData,
} from './df-semantic-entry-dialog.component';
import {
  DfSemanticPreviewDialogComponent,
  SemanticPreviewDialogData,
} from './df-semantic-preview-dialog.component';
import {
  DfSemanticDraftDialogComponent,
  SemanticDraftDialogData,
} from './df-semantic-draft-dialog.component';
import {
  DfSemanticImportDialogComponent,
  SemanticImportDialogData,
} from './df-semantic-import-dialog.component';

type Banner = {
  tone: 'ok' | 'warn' | 'error';
  text: string;
  details?: string[];
};

const SOURCE_VARIANT: Record<string, 'neutral' | 'ai'> = {
  seeded: 'neutral',
  drafted: 'ai',
  imported: 'neutral',
  harvested: 'neutral',
};

type KindFilter = 'all' | SemanticKind;

/** Page sizes for the entry list, as on the other DF lists that page. */
const PAGE_SIZES = [25, 50, 100];

/**
 * Whether this admin can use the catalog: `missing` when the list call 404s
 * (df-semantic is not installed), `forbidden` on a 403.
 */
export type SemanticAccess = 'ok' | 'missing' | 'forbidden';
type StatusFilter = 'all' | SemanticStatus;

const STATUS_VARIANT = {
  draft: 'neutral',
  approved: 'success',
  stale: 'warning',
} as const;

/**
 * df-semantic-catalog: the Semantic catalog section of a database service.
 *
 * Admins curate glossary terms, metrics, verified queries and notes for the service;
 * approved entries ride along in MCP get_data_model as the `semantics` block.
 * Lists the service's entries by kind with status chips, row actions
 * (edit / approve / back to draft / delete), a schema re-check (_validate)
 * and a preview of exactly what agents receive (_preview).
 */
@Component({
  selector: 'df-semantic-catalog',
  standalone: true,
  templateUrl: './df-semantic-catalog.component.html',
  styleUrls: ['./df-semantic-catalog.component.scss'],
  imports: [
    NgIf,
    NgFor,
    MatButtonModule,
    MatButtonToggleModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatMenuModule,
    MatTooltipModule,
    TranslocoPipe,
    DfBadgeComponent,
    DfEmptyStateComponent,
    DfPageHeaderComponent,
  ],
})
export class DfSemanticCatalogComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) serviceName = '';
  @Input() serviceLabel = '';
  /** Tells the host to hide the section (and its jump button) on `missing`. */
  @Output() availability = new EventEmitter<SemanticAccess>();

  readonly kinds = SEMANTIC_KINDS;
  readonly statusVariant = STATUS_VARIANT;
  readonly sourceVariant = SOURCE_VARIANT;

  readonly entries = signal<SemanticEntry[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal('');
  readonly access = signal<SemanticAccess>('ok');
  readonly kindFilter = signal<KindFilter>('all');
  readonly statusFilter = signal<StatusFilter>('all');
  readonly busyId = signal<number | null>(null);
  /** Inline error per entry id (approve 400 lists the missing columns). */
  readonly rowErrors = signal<Record<number, string>>({});
  /**
   * Row errors from approve-all: shown on the row but not announced one by
   * one; the run's summary banner speaks for them.
   */
  readonly quietErrors = signal<ReadonlySet<number>>(new Set());
  readonly validateResult = signal<SemanticValidateResult | null>(null);
  readonly validating = signal(false);
  readonly actionError = signal('');
  /** Outcome of seed / draft / import / bulk approve, shown above the list. */
  readonly banner = signal<Banner | null>(null);
  /** Review mode: only drafts from seeding, AI and imports are listed. */
  readonly reviewMode = signal(false);
  readonly bulkBusy = signal(false);
  /** Approve-all progress while it runs. */
  readonly bulkProgress = signal<{
    done: number;
    total: number;
    failed: number;
  } | null>(null);
  private bulkSub: Subscription | null = null;
  private bulkCancelled = false;
  readonly seeding = signal(false);

  /** Table names, cached once loaded; a failed load is retried next time. */
  private tables: string[] | null = null;
  /** Set from the click that opens a dialog until that dialog closes. */
  private dialogBusy = false;

  readonly counts = computed(() => {
    const out = {
      term: 0,
      metric: 0,
      query: 0,
      note: 0,
      draft: 0,
      approved: 0,
      stale: 0,
    };
    for (const e of this.entries()) {
      out[e.kind]++;
      out[e.status]++;
    }
    return out;
  });

  readonly review = computed(() => reviewCounts(this.entries()));

  /** Text filter over name, description and the one-line summary. */
  readonly query = signal('');
  readonly pageSizes = PAGE_SIZES;
  readonly pageSize = signal(PAGE_SIZES[0]);
  private readonly pageIndex = signal(0);

  /** Every entry the filters let through, in list order (kind, then name). */
  readonly filtered = computed(() => {
    const kind = this.kindFilter();
    const status = this.statusFilter();
    const reviewing = this.reviewMode();
    const q = this.query().trim().toLowerCase();
    const order = (k: SemanticKind) => this.kinds.indexOf(k);
    return this.entries()
      .filter(e => kind === 'all' || e.kind === kind)
      .filter(e => status === 'all' || e.status === status)
      .filter(
        e => !reviewing || (e.status === 'draft' && isAutomated(e.source))
      )
      .filter(
        e =>
          !q ||
          `${e.name}\n${e.description ?? ''}\n${this.summary(e)}`
            .toLowerCase()
            .includes(q)
      )
      .sort(
        (a, b) => order(a.kind) - order(b.kind) || a.name.localeCompare(b.name)
      );
  });

  /** The current page, kept in range when the list shrinks. */
  readonly page = computed(() => {
    const last = Math.max(
      0,
      Math.ceil(this.filtered().length / this.pageSize()) - 1
    );
    return Math.min(this.pageIndex(), last);
  });

  readonly paged = computed(() => {
    const start = this.page() * this.pageSize();
    return this.filtered().slice(start, start + this.pageSize());
  });

  /** Paging only appears once a list is longer than the smallest page. */
  readonly paginated = computed(
    () => this.filtered().length > this.pageSizes[0]
  );

  /**
   * The page, grouped by kind. Each heading counts the kind's matches across
   * all pages. An empty kind keeps its "add one" prompt only on the first
   * page of an unfiltered list, outside review.
   */
  readonly groups = computed(() => {
    const kind = this.kindFilter();
    const all = this.filtered();
    const rows = this.paged();
    const prompts =
      !this.reviewMode() && !this.query().trim() && this.page() === 0;
    return this.kinds
      .filter(k => kind === 'all' || kind === k)
      .map(k => ({
        kind: k,
        total: all.filter(e => e.kind === k).length,
        entries: rows.filter(e => e.kind === k),
      }))
      .filter(g => g.entries.length > 0 || (prompts && g.total === 0));
  });

  /** The drafts a bulk approve would touch: what review mode lists. */
  readonly reviewable = computed(() =>
    this.entries().filter(e => e.status === 'draft' && isAutomated(e.source))
  );

  constructor(
    private api: SemanticCatalogApiService,
    private dialog: MatDialog,
    private viewContainerRef: ViewContainerRef,
    private transloco: TranslocoService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['serviceName'] && this.serviceName) {
      this.bulkSub?.unsubscribe();
      this.bulkSub = null;
      this.bulkBusy.set(false);
      this.bulkProgress.set(null);
      this.tables = null;
      this.validateResult.set(null);
      this.banner.set(null);
      this.reviewMode.set(false);
      this.setAccess('ok');
      this.reload();
    }
  }

  reload() {
    this.loading.set(true);
    this.loadError.set('');
    this.api.list(this.serviceName).subscribe({
      next: rows => {
        this.entries.set(rows);
        this.loading.set(false);
      },
      error: err => {
        this.loading.set(false);
        const status = err?.status;
        if (status === 404 || status === 403) {
          this.entries.set([]);
          this.setAccess(status === 404 ? 'missing' : 'forbidden');
          return;
        }
        this.loadError.set(serverMessage(err, this.tr));
      },
    });
  }

  private setAccess(access: SemanticAccess) {
    if (this.access() === access) return;
    this.access.set(access);
    this.availability.emit(access);
  }

  summary(e: SemanticEntry) {
    return summarize(e, this.tr);
  }

  showSource(e: SemanticEntry) {
    return isAutomated(e.source);
  }

  /** "8 seeded, 4 AI drafts" for the review banner. */
  reviewDetail(): string {
    return Object.entries(this.review().bySource)
      .map(([source, n]) => this.t(`review.detail.${source}`, { count: n }))
      .join(', ');
  }

  trackById(_: number, e: SemanticEntry) {
    return e.id;
  }

  private t(key: string, params?: Record<string, unknown>) {
    return this.transloco.translate(`services.semantic.${key}`, params);
  }

  private readonly tr: Translate = (key, params) => this.t(key, params);

  /**
   * Put a saved entry in the list. Only the editor adds rows (a create);
   * a late approve result for a row deleted meanwhile does not bring it back.
   */
  private replace(entry: SemanticEntry, add = false) {
    const rows = this.entries();
    const i = rows.findIndex(r => r.id === entry.id);
    if (i < 0 && !add) return;
    this.entries.set(
      i >= 0 ? rows.map(r => (r.id === entry.id ? entry : r)) : [...rows, entry]
    );
  }

  private setRowError(id: number, message: string | null, quiet = false) {
    const next = { ...this.rowErrors() };
    if (message) next[id] = message;
    else delete next[id];
    this.rowErrors.set(next);
    const q = new Set(this.quietErrors());
    if (message && quiet) q.add(id);
    else q.delete(id);
    this.quietErrors.set(q);
  }

  // ----- editor -----

  /**
   * One dialog at a time: a double click (or a click while the table list
   * loads) would otherwise stack two. Returns false when one is already up.
   */
  private claimDialog(): boolean {
    if (this.dialogBusy || this.dialog.openDialogs.length) return false;
    this.dialogBusy = true;
    return true;
  }

  private releaseDialog() {
    this.dialogBusy = false;
  }

  /** null tables = the list could not be loaded; not cached, so it is retried. */
  private withTables(open: (tables: string[] | null) => void) {
    if (this.tables) {
      open(this.tables);
      return;
    }
    this.api.tables(this.serviceName).subscribe(tables => {
      if (tables) this.tables = tables;
      open(tables);
    });
  }

  openEditor(kind: SemanticKind, entry?: SemanticEntry) {
    if (!this.claimDialog()) return;
    this.withTables(tables => {
      const data: SemanticEntryDialogData = {
        service: this.serviceName,
        kind,
        entry,
        tables,
      };
      this.dialog
        .open(DfSemanticEntryDialogComponent, {
          data,
          width: '760px',
          maxWidth: '95vw',
          maxHeight: '92vh',
          autoFocus: 'first-tabbable',
          viewContainerRef: this.viewContainerRef,
        })
        .afterClosed()
        .subscribe(saved => {
          this.releaseDialog();
          if (!saved) return;
          this.replace(saved, true);
          this.setRowError(saved.id, null);
        });
    });
  }

  // ----- row actions -----

  private run(entry: SemanticEntry, req: Observable<SemanticEntry>) {
    this.busyId.set(entry.id);
    this.setRowError(entry.id, null);
    req.subscribe({
      next: updated => {
        this.busyId.set(null);
        this.replace(updated);
      },
      error: err => {
        this.busyId.set(null);
        this.setRowError(entry.id, serverMessage(err, this.tr));
      },
    });
  }

  approve(entry: SemanticEntry) {
    this.run(entry, this.api.approve(this.serviceName, entry.id));
  }

  unapprove(entry: SemanticEntry) {
    this.run(entry, this.api.unapprove(this.serviceName, entry.id));
  }

  confirmDelete(entry: SemanticEntry) {
    if (!this.claimDialog()) return;
    this.dialog
      .open(DfConfirmDialogComponent, {
        data: {
          title: this.t('delete.title'),
          message: this.t('delete.message', { name: entry.name }),
        },
        viewContainerRef: this.viewContainerRef,
      })
      .afterClosed()
      .subscribe(ok => {
        this.releaseDialog();
        if (!ok) return;
        this.busyId.set(entry.id);
        this.api.remove(this.serviceName, entry.id).subscribe({
          next: () => {
            this.busyId.set(null);
            this.entries.set(this.entries().filter(e => e.id !== entry.id));
            this.setRowError(entry.id, null);
          },
          error: err => {
            this.busyId.set(null);
            this.setRowError(entry.id, serverMessage(err, this.tr));
          },
        });
      });
  }

  // ----- header actions -----

  checkSchema() {
    this.validating.set(true);
    this.actionError.set('');
    this.api.validate(this.serviceName).subscribe({
      next: result => {
        this.validating.set(false);
        this.validateResult.set(result);
        // Stale flags are written server-side; re-read so the chips match.
        this.reload();
      },
      error: err => {
        this.validating.set(false);
        this.actionError.set(serverMessage(err, this.tr));
      },
    });
  }

  dismissValidate() {
    this.validateResult.set(null);
  }

  dismissBanner() {
    this.banner.set(null);
  }

  // ----- filling the catalog: seed / draft / import / export -----

  seed() {
    this.seeding.set(true);
    this.actionError.set('');
    this.api.seed(this.serviceName).subscribe({
      next: r => {
        this.seeding.set(false);
        this.banner.set(
          r.created
            ? {
                tone: 'ok',
                text: this.t('banner.seedOk', {
                  created: r.created,
                  skipped: r.skipped,
                }),
              }
            : r.skipped
              ? {
                  tone: 'ok',
                  text: this.t('banner.seedAllExist', { skipped: r.skipped }),
                }
              : { tone: 'warn', text: this.t('banner.seedNone') }
        );
        if (r.created) this.reload();
      },
      error: err => {
        this.seeding.set(false);
        this.actionError.set(serverMessage(err, this.tr));
      },
    });
  }

  openDraft() {
    if (!this.claimDialog()) return;
    this.withTables(tables => {
      const data: SemanticDraftDialogData = {
        service: this.serviceName,
        tables,
      };
      const ref = this.dialog.open(DfSemanticDraftDialogComponent, {
        data,
        width: '720px',
        maxWidth: '95vw',
        maxHeight: '92vh',
        viewContainerRef: this.viewContainerRef,
      });
      // Escape and the backdrop close without a result; the report still counts.
      ref.beforeClosed().subscribe((result?: SemanticDraftReport) => {
        this.releaseDialog();
        const report = result ?? ref.componentInstance?.report ?? undefined;
        if (!report) return;
        this.banner.set({
          tone: report.created ? 'ok' : 'warn',
          text: this.t('banner.draftOk', {
            proposed: report.proposed,
            created: report.created,
            rejected: report.rejected.length,
          }),
        });
        if (report.created) this.reload();
      });
    });
  }

  openImport() {
    if (!this.claimDialog()) return;
    const data: SemanticImportDialogData = { service: this.serviceName };
    const ref = this.dialog.open(DfSemanticImportDialogComponent, {
      data,
      width: '720px',
      maxWidth: '95vw',
      maxHeight: '92vh',
      viewContainerRef: this.viewContainerRef,
    });
    ref.beforeClosed().subscribe((result?: SemanticImportReport) => {
      this.releaseDialog();
      const report = result ?? ref.componentInstance?.report ?? undefined;
      if (!report) return;
      this.banner.set({
        tone: report.failed.length ? 'warn' : 'ok',
        text: this.t('banner.importOk', {
          created: report.created,
          updated: report.updated,
          unchanged: report.unchanged,
          approved: report.approved,
          failed: report.failed.length,
        }),
      });
      if (report.created || report.updated || report.approved) this.reload();
    });
  }

  exportJson() {
    this.actionError.set('');
    this.api.export(this.serviceName).subscribe({
      next: doc => {
        saveRawAsFile(
          JSON.stringify(doc, null, 2),
          `semantic-${this.serviceName}.json`,
          'json'
        );
      },
      error: err => this.actionError.set(serverMessage(err, this.tr)),
    });
  }

  // ----- review -----

  startReview() {
    this.reviewMode.set(true);
    this.statusFilter.set('all');
    this.pageIndex.set(0);
  }

  endReview() {
    this.reviewMode.set(false);
    this.pageIndex.set(0);
  }

  // ----- filter + paging -----

  setKind(kind: KindFilter) {
    this.kindFilter.set(kind);
    this.pageIndex.set(0);
  }

  setStatus(status: StatusFilter) {
    this.statusFilter.set(status);
    this.pageIndex.set(0);
  }

  setQuery(q: string) {
    this.query.set(q ?? '');
    this.pageIndex.set(0);
  }

  onPage(event: PageEvent) {
    this.pageSize.set(event.pageSize);
    this.pageIndex.set(event.pageIndex);
  }

  /**
   * Approve every reviewable draft after a confirmation, one request at a
   * time so each 400 (a stale column, a filter the service rejects) lands on
   * its own row. Results apply as they arrive with an "n / N" count; Cancel
   * stops before the next request (the one in flight still lands).
   */
  approveAllReviewable() {
    const drafts = this.reviewable();
    if (!drafts.length || this.bulkBusy() || !this.claimDialog()) return;
    this.dialog
      .open(DfConfirmDialogComponent, {
        data: {
          title: this.t('approveAll.title', { count: drafts.length }),
          message: this.t('approveAll.message', { count: drafts.length }),
        },
        viewContainerRef: this.viewContainerRef,
      })
      .afterClosed()
      .subscribe(ok => {
        this.releaseDialog();
        if (ok) this.runApproveAll(drafts);
      });
  }

  private runApproveAll(drafts: SemanticEntry[]) {
    if (this.bulkBusy()) return;
    this.bulkBusy.set(true);
    this.bulkCancelled = false;
    this.bulkProgress.set({ done: 0, total: drafts.length, failed: 0 });
    let ok = 0;
    let failed = 0;
    this.bulkSub = from(drafts)
      .pipe(
        concatMap(e =>
          this.bulkCancelled
            ? EMPTY
            : this.api.approve(this.serviceName, e.id).pipe(
                map(updated => ({ entry: e, updated, error: '' })),
                catchError(err =>
                  of({
                    entry: e,
                    updated: null,
                    error: serverMessage(err, this.tr),
                  })
                )
              )
        )
      )
      .subscribe({
        next: r => {
          if (r.updated) {
            ok++;
            this.replace(r.updated);
            this.setRowError(r.entry.id, null);
          } else {
            failed++;
            this.setRowError(r.entry.id, r.error, true);
          }
          this.bulkProgress.set({
            done: ok + failed,
            total: drafts.length,
            failed,
          });
        },
        complete: () => {
          const done = ok + failed;
          this.bulkBusy.set(false);
          this.bulkProgress.set(null);
          this.bulkSub = null;
          this.banner.set({
            tone: failed || done < drafts.length ? 'warn' : 'ok',
            text:
              done < drafts.length
                ? this.t('banner.approveAllStopped', {
                    ok,
                    done,
                    total: drafts.length,
                    failed,
                  })
                : this.t('banner.approveAll', {
                    ok,
                    total: drafts.length,
                    failed,
                  }),
          });
          if (!failed && done === drafts.length) this.reviewMode.set(false);
        },
      });
  }

  /** Stop a running approve-all before its next request. */
  cancelApproveAll() {
    this.bulkCancelled = true;
  }

  ngOnDestroy(): void {
    this.bulkSub?.unsubscribe();
  }

  openPreview() {
    if (!this.claimDialog()) return;
    const data: SemanticPreviewDialogData = {
      service: this.serviceName,
      serviceLabel: this.serviceLabel || this.serviceName,
    };
    this.dialog
      .open(DfSemanticPreviewDialogComponent, {
        data,
        width: '820px',
        maxWidth: '95vw',
        maxHeight: '92vh',
        viewContainerRef: this.viewContainerRef,
      })
      .afterClosed()
      .subscribe(() => this.releaseDialog());
  }
}
