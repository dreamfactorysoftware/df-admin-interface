import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { catchError, forkJoin, of } from 'rxjs';
import { SERVICES_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';
import { AlertType } from 'src/app/shared/components/df-alert/df-alert.component';
import { DfSnackbarService } from 'src/app/shared/services/df-snackbar.service';
import { DfOpenApiDialogComponent } from '../df-openapi-dialog/df-openapi-dialog.component';
import { DfSnapshotHistoryDialogComponent } from '../df-snapshot-history-dialog/df-snapshot-history-dialog.component';
import { DfTableDiffDialogComponent } from '../df-table-diff-dialog/df-table-diff-dialog.component';
import { DfSchemaContractsService } from '../services/df-schema-contracts.service';
import {
  ContractMode,
  PromoteResponse,
  ServiceDescriptor,
  ServiceSummary,
  TableEntry,
  TablesResponse,
} from '../types';

/**
 * Service types treated as SQL for the purposes of the schema-contracts
 * picker. Mirrors the connector list in
 * df-schema-contracts/docs/CANONICAL_SCHEMA_JSON.md.
 */
const SQL_SERVICE_TYPES: ReadonlySet<string> = new Set([
  'mysql',
  'pgsql',
  'sqlite',
  'sqlsrv',
  'oracle',
  'snowflake',
  'ibmdb2',
  'informix',
  'firebird',
  'sqlanywhere',
  'memsql',
  'databricks',
  'trino',
  'hana',
  'dremio',
]);

@Component({
  selector: 'df-manage-schema-contracts',
  templateUrl: './df-manage-schema-contracts.component.html',
  styleUrls: ['./df-manage-schema-contracts.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDialogModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatMenuModule,
    MatTableModule,
    MatTooltipModule,
  ],
})
export class DfManageSchemaContractsComponent implements OnInit {
  private readonly servicesApi = inject(SERVICES_SERVICE_TOKEN);
  private readonly contracts   = inject(DfSchemaContractsService);
  private readonly dialog      = inject(MatDialog);
  private readonly snackbar    = inject(DfSnackbarService);

  readonly serviceControl = new FormControl<string | null>(null);

  sqlServices: ServiceDescriptor[] = [];
  tablesResponse: TablesResponse | null = null;
  serviceSummary: ServiceSummary | null = null;

  loadingServices = false;
  loadingTables   = false;
  busyAction      = false;

  readonly displayedColumns = ['name', 'locked', 'drift', 'actions'];

  // Service-level config — mirrors what PATCH /{service} accepts. The local
  // model tracks user intent; we only push to the server when "Save" is hit
  // so the user can experiment before committing.
  pendingMode: ContractMode = 'none';
  pendingRetention: number | null = null;
  configDirty = false;

  ngOnInit(): void {
    this.loadServices();
  }

  loadServices(): void {
    this.loadingServices = true;
    this.servicesApi.getAll<{ resource: ServiceDescriptor[] }>({ limit: 1000, sort: 'name' })
      .pipe(catchError(() => of({ resource: [] })))
      .subscribe(({ resource }) => {
        this.sqlServices = (resource ?? []).filter(s =>
          SQL_SERVICE_TYPES.has((s.type ?? '').toLowerCase())
        );
        this.loadingServices = false;
      });
  }

  private notify(message: string, alertType: AlertType = 'info'): void {
    this.snackbar.openSnackBar(message, alertType);
  }

  onServiceChange(): void {
    const name = this.serviceControl.value;
    if (!name) {
      this.tablesResponse = null;
      this.serviceSummary = null;
      return;
    }
    this.refreshTables();
  }

  /**
   * Pulls both endpoints in parallel: `/tables` drives the table grid,
   * `/{service}` drives the service-wide summary card. The /{service}
   * call cheap-paths when no active snapshots exist, so the parallel cost
   * is essentially one describeService() round trip total.
   */
  refreshTables(): void {
    const name = this.serviceControl.value;
    if (!name) {
      return;
    }
    this.loadingTables = true;
    forkJoin({
      tables: this.contracts.listTables(name).pipe(catchError(err => {
        this.notify(`Failed to load tables: ${err?.error?.error?.message ?? err?.message ?? 'unknown error'}`, 'error');
        return of(null);
      })),
      summary: this.contracts.getServiceSummary(name).pipe(catchError(() => of(null))),
    }).subscribe(({ tables, summary }) => {
      this.tablesResponse = tables;
      this.serviceSummary = summary;
      this.loadingTables = false;

      // Sync the user-facing form state with what the server actually has.
      // Until the user edits, pending state equals server state.
      this.pendingMode      = summary?.mode ?? 'none';
      this.pendingRetention = summary?.archiveRetentionCount ?? null;
      this.configDirty      = false;
    });
  }

  onConfigEdit(): void {
    this.configDirty = true;
  }

  saveConfig(): void {
    const name = this.serviceControl.value;
    if (!name) { return; }
    this.busyAction = true;
    this.contracts.updateServiceConfig(name, {
      mode: this.pendingMode,
      archiveRetentionCount: this.pendingRetention,
    })
      .pipe(catchError(err => {
        this.notify(`Save failed: ${err?.error?.error?.message ?? 'unknown error'}`, 'error');
        return of(null);
      }))
      .subscribe(updated => {
        this.busyAction = false;
        if (updated) {
          this.serviceSummary = updated;
          this.pendingMode      = updated.mode;
          this.pendingRetention = updated.archiveRetentionCount;
          this.configDirty      = false;
          this.notify(`${name}: mode=${updated.mode}`, 'success');
        }
      });
  }

  promote(): void {
    const name = this.serviceControl.value;
    if (!name) { return; }
    this.busyAction = true;
    this.contracts.promoteService(name)
      .pipe(catchError(err => {
        this.notify(`Promote failed: ${err?.error?.error?.message ?? 'unknown error'}`, 'error');
        return of(null);
      }))
      .subscribe((response: PromoteResponse | null) => {
        this.busyAction = false;
        if (!response) { return; }
        const s = response.summary;
        const parts: string[] = [];
        if (s.tablesPromoted > 0)    { parts.push(`${s.tablesPromoted} promoted`); }
        if (s.tablesNeedsReview > 0) { parts.push(`${s.tablesNeedsReview} need review`); }
        if (s.tablesNoDrift > 0)     { parts.push(`${s.tablesNoDrift} unchanged`); }
        const tone: AlertType = s.tablesNeedsReview > 0 ? 'warning' : 'success';
        this.notify(
          `${name} (${response.mode}): ${parts.join(', ') || 'nothing to do'}`,
          tone
        );
        this.refreshTables();
      });
  }

  unlockService(): void {
    const name = this.serviceControl.value;
    if (!name) { return; }
    if (!confirm(`Archive every active snapshot for "${name}" and clear its mode? Snapshots are kept as history.`)) {
      return;
    }
    this.busyAction = true;
    this.contracts.unlockService(name)
      .pipe(catchError(err => {
        this.notify(`Unlock service failed: ${err?.error?.error?.message ?? 'unknown error'}`, 'error');
        return of(null);
      }))
      .subscribe(result => {
        this.busyAction = false;
        if (result) {
          this.notify(
            `${name}: unlocked (${result.snapshotsArchived} snapshot${result.snapshotsArchived === 1 ? '' : 's'} archived)`,
            'success'
          );
          this.refreshTables();
        }
      });
  }

  lock(row: TableEntry): void {
    const service = this.serviceControl.value;
    if (!service) { return; }
    this.busyAction = true;
    this.contracts.lockTable(service, row.name)
      .pipe(catchError(err => {
        this.notify(`Lock failed: ${err?.error?.error?.message ?? 'unknown error'}`, 'error');
        return of(null);
      }))
      .subscribe(result => {
        this.busyAction = false;
        if (result) {
          const action = result.lockResult ?? 'updated';
          // "no_change" is an info; "locked" and "promoted" are successes.
          const tone: AlertType = action === 'no_change' ? 'info' : 'success';
          this.notify(`${row.name}: ${action} (v${result.contractVersion})`, tone);
          this.refreshTables();
        }
      });
  }

  unlock(row: TableEntry): void {
    const service = this.serviceControl.value;
    if (!service) { return; }
    this.busyAction = true;
    this.contracts.unlockTable(service, row.name)
      .pipe(catchError(err => {
        this.notify(`Unlock failed: ${err?.error?.error?.message ?? 'unknown error'}`, 'error');
        return of(null);
      }))
      .subscribe(() => {
        this.busyAction = false;
        this.notify(`${row.name}: unlocked`, 'success');
        this.refreshTables();
      });
  }

  viewDiff(row: TableEntry): void {
    const service = this.serviceControl.value;
    if (!service) { return; }
    this.dialog.open(DfTableDiffDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { service, table: row.name, mode: 'diff' },
    });
  }

  /**
   * Dry-run preview of what locking would do right now. Works on unlocked
   * tables too — shows the candidate that would become v1.
   */
  test(row: TableEntry): void {
    const service = this.serviceControl.value;
    if (!service) { return; }
    this.dialog.open(DfTableDiffDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { service, table: row.name, mode: 'test' },
    });
  }

  viewHistory(row: TableEntry): void {
    const service = this.serviceControl.value;
    if (!service) { return; }
    this.dialog.open(DfSnapshotHistoryDialogComponent, {
      width: '1000px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { service, table: row.name },
    });
  }

  viewOpenApi(row: TableEntry): void {
    const service = this.serviceControl.value;
    if (!service) { return; }
    this.dialog.open(DfOpenApiDialogComponent, {
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { service, table: row.name },
    });
  }

  /**
   * Pick the worst severity present on the table so the row badge reflects
   * the strongest signal, not just the most common one.
   */
  driftBadge(entry: TableEntry): { label: string; color: 'red' | 'orange' | 'yellow' | 'green' | 'grey' } {
    if (!entry.locked) {
      return { label: 'unlocked', color: 'grey' };
    }
    const d = entry.drift;
    if (!d || !d.hasDrift) {
      return { label: 'no drift', color: 'green' };
    }
    if (d.hasBreaking) {
      return { label: 'breaking', color: 'red' };
    }
    if (d.summary.potentiallyBreakingCount > 0) {
      return { label: 'potentially breaking', color: 'orange' };
    }
    if (d.summary.additiveCount > 0) {
      return { label: 'additive', color: 'yellow' };
    }
    if (d.summary.cosmeticCount > 0) {
      return { label: 'cosmetic', color: 'grey' };
    }
    return { label: 'no drift', color: 'green' };
  }
}
