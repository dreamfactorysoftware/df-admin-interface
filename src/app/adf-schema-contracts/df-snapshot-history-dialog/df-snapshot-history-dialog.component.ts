import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { catchError, of } from 'rxjs';
import { DfSchemaContractsService } from '../services/df-schema-contracts.service';
import { LockResponse, SnapshotHistoryEntry } from '../types';

interface DialogData {
  service: string;
  table: string;
}

@Component({
  selector: 'df-snapshot-history-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
  ],
  template: `
    <h2 mat-dialog-title>
      Snapshot history &mdash; {{ data.service }}.{{ data.table }}
    </h2>

    <div mat-dialog-content class="history-dialog">
      <div *ngIf="loading" class="loading">
        <mat-progress-spinner
          diameter="32"
          mode="indeterminate"></mat-progress-spinner>
      </div>

      <div *ngIf="errorMessage" class="error">
        <mat-icon>error_outline</mat-icon>
        {{ errorMessage }}
      </div>

      <ng-container *ngIf="versions.length && !loading">
        <table mat-table [dataSource]="versions" class="history-table">
          <ng-container matColumnDef="version">
            <th mat-header-cell *matHeaderCellDef>Version</th>
            <td mat-cell *matCellDef="let v">v{{ v.contractVersion }}</td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let v">
              <span class="status" [class.active]="v.status === 'active'">
                {{ v.status }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="hash">
            <th mat-header-cell *matHeaderCellDef>Hash</th>
            <td mat-cell *matCellDef="let v">
              <code>{{ v.schemaHash | slice: 0 : 12 }}…</code>
            </td>
          </ng-container>

          <ng-container matColumnDef="created">
            <th mat-header-cell *matHeaderCellDef>Created</th>
            <td mat-cell *matCellDef="let v">{{ v.createdDate || '—' }}</td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let v">
              <button
                mat-button
                (click)="viewVersion(v)"
                [disabled]="loadingVersion === v.contractVersion">
                {{
                  selectedVersion?.contractVersion === v.contractVersion
                    ? 'Hide'
                    : 'View JSON'
                }}
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr
            mat-row
            *matRowDef="let row; columns: displayedColumns"
            [class.selected-row]="
              selectedVersion?.contractVersion === row.contractVersion
            "></tr>
        </table>

        <div *ngIf="selectedVersion && selectedSnapshotJson" class="json-pane">
          <div class="json-header">
            <strong
              >Version {{ selectedVersion.contractVersion }} canonical
              JSON</strong
            >
            <span class="hash">{{ selectedVersion.schemaHash }}</span>
          </div>
          <pre>{{ selectedSnapshotJson }}</pre>
        </div>

        <div *ngIf="loadingVersion !== null" class="loading inline">
          <mat-progress-spinner
            diameter="20"
            mode="indeterminate"></mat-progress-spinner>
          Loading v{{ loadingVersion }}…
        </div>
      </ng-container>

      <p
        *ngIf="!loading && !errorMessage && versions.length === 0"
        class="empty">
        No snapshots exist for this table yet.
      </p>
    </div>

    <div mat-dialog-actions align="end">
      <button mat-button (click)="close()">Close</button>
    </div>
  `,
  styles: [
    `
      .history-dialog {
        min-width: 700px;
        max-height: 75vh;
        overflow: auto;
      }
      .loading,
      .error {
        display: flex;
        justify-content: center;
        padding: 24px;
        gap: 8px;
        align-items: center;
      }
      .loading.inline {
        padding: 12px;
        font-size: 13px;
        color: var(--df-text-muted);
      }
      .error {
        color: var(--df-danger);
      }
      .empty {
        padding: 24px;
        text-align: center;
        color: var(--df-text-muted);
      }

      .history-table {
        width: 100%;

        .status {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          background: var(--df-surface-2);
          color: var(--df-text-muted);
          text-transform: capitalize;

          &.active {
            background: var(--df-success-soft);
            color: var(--df-success);
            font-weight: 500;
          }
        }

        code {
          background: var(--df-surface-2);
          padding: 1px 6px;
          border-radius: 3px;
          font-size: 12px;
        }

        tr.selected-row {
          background: rgba(25, 118, 210, 0.04);
        }
      }

      .json-pane {
        margin-top: 16px;
        border: 1px solid var(--df-border-2);
        border-radius: 4px;
        overflow: hidden;

        .json-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: var(--df-surface-2);
          font-size: 13px;

          .hash {
            font-family: monospace;
            font-size: 11px;
            color: var(--df-text-muted);
          }
        }

        pre {
          margin: 0;
          padding: 12px;
          font-size: 11px;
          max-height: 40vh;
          overflow: auto;
          background: var(--df-surface);
        }
      }
    `,
  ],
})
export class DfSnapshotHistoryDialogComponent implements OnInit {
  private readonly contracts = inject(DfSchemaContractsService);
  private readonly dialogRef = inject(
    MatDialogRef<DfSnapshotHistoryDialogComponent>
  );

  versions: SnapshotHistoryEntry[] = [];
  selectedVersion: SnapshotHistoryEntry | null = null;
  selectedSnapshotJson = '';

  loading = true;
  loadingVersion: number | null = null;
  errorMessage = '';

  readonly displayedColumns = [
    'version',
    'status',
    'hash',
    'created',
    'actions',
  ];

  constructor(@Inject(MAT_DIALOG_DATA) public data: DialogData) {}

  ngOnInit(): void {
    this.contracts
      .listSnapshots(this.data.service, this.data.table)
      .pipe(
        catchError(err => {
          this.errorMessage =
            err?.error?.error?.message ??
            err?.message ??
            'Failed to load snapshot history.';
          return of(null);
        })
      )
      .subscribe(response => {
        this.loading = false;
        this.versions = response?.versions ?? [];
      });
  }

  viewVersion(version: SnapshotHistoryEntry): void {
    // Toggle: clicking the currently-selected version collapses the JSON pane.
    if (this.selectedVersion?.contractVersion === version.contractVersion) {
      this.selectedVersion = null;
      this.selectedSnapshotJson = '';
      return;
    }

    this.loadingVersion = version.contractVersion;
    this.contracts
      .getSnapshotVersion(
        this.data.service,
        this.data.table,
        version.contractVersion
      )
      .pipe(
        catchError(err => {
          this.errorMessage =
            err?.error?.error?.message ??
            err?.message ??
            'Failed to load version content.';
          return of(null);
        })
      )
      .subscribe(snapshot => {
        this.loadingVersion = null;
        if (!snapshot) {
          return;
        }
        this.selectedVersion = version;
        this.selectedSnapshotJson = JSON.stringify(snapshot.schema, null, 2);
      });
  }

  close(): void {
    this.dialogRef.close();
  }
}
