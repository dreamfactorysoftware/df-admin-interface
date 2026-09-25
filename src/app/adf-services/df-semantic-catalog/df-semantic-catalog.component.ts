import { NgFor, NgIf } from '@angular/common';
import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ViewContainerRef,
  computed,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoPipe, TranslocoService } from '@ngneat/transloco';
import { Observable } from 'rxjs';
import { DfBadgeComponent } from 'src/app/shared/components/df-badge/df-badge.component';
import { DfConfirmDialogComponent } from 'src/app/shared/components/df-confirm-dialog/df-confirm-dialog.component';
import { DfEmptyStateComponent } from 'src/app/shared/components/df-empty-state/df-empty-state.component';
import { DfPageHeaderComponent } from 'src/app/shared/components/df-page-header/df-page-header.component';
import {
  SEMANTIC_KINDS,
  SemanticEntry,
  SemanticKind,
  SemanticStatus,
  SemanticValidateResult,
  serverMessage,
  summarize,
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

type KindFilter = 'all' | SemanticKind;
type StatusFilter = 'all' | SemanticStatus;

const STATUS_VARIANT = {
  draft: 'neutral',
  approved: 'success',
  stale: 'warning',
} as const;

/**
 * df-semantic-catalog: the Semantic catalog section of a database service.
 *
 * Admins curate glossary terms, metrics and verified queries for the service;
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
    MatIconModule,
    MatTooltipModule,
    TranslocoPipe,
    DfBadgeComponent,
    DfEmptyStateComponent,
    DfPageHeaderComponent,
  ],
})
export class DfSemanticCatalogComponent implements OnChanges {
  @Input({ required: true }) serviceName = '';
  @Input() serviceLabel = '';

  readonly kinds = SEMANTIC_KINDS;
  readonly statusVariant = STATUS_VARIANT;

  readonly entries = signal<SemanticEntry[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal('');
  readonly kindFilter = signal<KindFilter>('all');
  readonly statusFilter = signal<StatusFilter>('all');
  readonly busyId = signal<number | null>(null);
  /** Inline error per entry id (approve 400 lists the missing columns). */
  readonly rowErrors = signal<Record<number, string>>({});
  readonly validateResult = signal<SemanticValidateResult | null>(null);
  readonly validating = signal(false);
  readonly actionError = signal('');

  private tables: string[] | null = null;

  readonly counts = computed(() => {
    const out = {
      term: 0,
      metric: 0,
      query: 0,
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

  readonly groups = computed(() => {
    const kind = this.kindFilter();
    const status = this.statusFilter();
    return this.kinds
      .filter(k => kind === 'all' || kind === k)
      .map(k => ({
        kind: k,
        entries: this.entries()
          .filter(e => e.kind === k)
          .filter(e => status === 'all' || e.status === status)
          .sort((a, b) => a.name.localeCompare(b.name)),
      }));
  });

  constructor(
    private api: SemanticCatalogApiService,
    private dialog: MatDialog,
    private viewContainerRef: ViewContainerRef,
    private transloco: TranslocoService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['serviceName'] && this.serviceName) {
      this.tables = null;
      this.validateResult.set(null);
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
        this.loadError.set(serverMessage(err));
        this.loading.set(false);
      },
    });
  }

  summary(e: SemanticEntry) {
    return summarize(e);
  }

  trackById(_: number, e: SemanticEntry) {
    return e.id;
  }

  private t(key: string, params?: Record<string, unknown>) {
    return this.transloco.translate(`services.semantic.${key}`, params);
  }

  private replace(entry: SemanticEntry) {
    const rows = this.entries();
    const i = rows.findIndex(r => r.id === entry.id);
    this.entries.set(
      i >= 0 ? rows.map(r => (r.id === entry.id ? entry : r)) : [...rows, entry]
    );
  }

  private setRowError(id: number, message: string | null) {
    const next = { ...this.rowErrors() };
    if (message) next[id] = message;
    else delete next[id];
    this.rowErrors.set(next);
  }

  // ----- editor -----

  private withTables(open: (tables: string[]) => void) {
    if (this.tables) {
      open(this.tables);
      return;
    }
    this.api.tables(this.serviceName).subscribe(tables => {
      this.tables = tables;
      open(tables);
    });
  }

  openEditor(kind: SemanticKind, entry?: SemanticEntry) {
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
          if (!saved) return;
          this.replace(saved);
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
        this.setRowError(entry.id, serverMessage(err));
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
            this.setRowError(entry.id, serverMessage(err));
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
        this.actionError.set(serverMessage(err));
      },
    });
  }

  dismissValidate() {
    this.validateResult.set(null);
  }

  openPreview() {
    const data: SemanticPreviewDialogData = {
      service: this.serviceName,
      serviceLabel: this.serviceLabel || this.serviceName,
    };
    this.dialog.open(DfSemanticPreviewDialogComponent, {
      data,
      width: '820px',
      maxWidth: '95vw',
      maxHeight: '92vh',
      viewContainerRef: this.viewContainerRef,
    });
  }
}
