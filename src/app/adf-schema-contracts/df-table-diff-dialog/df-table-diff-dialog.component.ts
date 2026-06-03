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
import { MatTabsModule } from '@angular/material/tabs';
import { Observable, catchError, of } from 'rxjs';
import { DfSchemaContractsService } from '../services/df-schema-contracts.service';
import {
  DriftChange,
  DriftSummary,
  TableDiffResponse,
  TestResponse,
} from '../types';

export type DiffDialogMode = 'diff' | 'test';

interface DialogData {
  service: string;
  table: string;
  /** `diff` = read drift vs active snapshot; `test` = dry-run lock preview. */
  mode: DiffDialogMode;
}

/**
 * Unified view-model normalising `TableDiffResponse` (from GET /diff) and
 * `TestResponse` (from POST /test) into a single shape the template binds
 * to. The two responses overlap heavily; differences are in the header
 * metadata.
 */
interface ReportViewModel {
  checkedAt: string;
  hasDrift: boolean;
  hasBreaking: boolean;
  summary: DriftSummary;
  changes: DriftChange[];
  candidate: Record<string, unknown> | null;

  // Header lines: only one set is rendered depending on mode.
  // diff mode
  activeSnapshotVersion: number | null;
  activeSnapshotHash: string | null;
  // test mode adds
  wouldBeVersion: number | null;
  wouldBeAction: 'locked' | 'promoted' | 'no_change' | null;
}

@Component({
  selector: 'df-table-diff-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTabsModule,
  ],
  template: `
    <h2 mat-dialog-title>
      {{ titlePrefix }} &mdash; {{ data.service }}.{{ data.table }}
    </h2>

    <div mat-dialog-content class="diff-dialog">
      <div *ngIf="loading" class="loading">
        <mat-progress-spinner
          diameter="32"
          mode="indeterminate"></mat-progress-spinner>
      </div>

      <div *ngIf="errorMessage" class="error">
        <mat-icon>error_outline</mat-icon>
        {{ errorMessage }}
      </div>

      <ng-container *ngIf="report && !loading">
        <section class="header-row">
          <div class="meta">
            <ng-container *ngIf="data.mode === 'test'">
              <div>
                <strong>Would be:</strong>
                v{{ report.wouldBeVersion }}
                <em>({{ report.wouldBeAction }})</em>
              </div>
              <div *ngIf="report.activeSnapshotVersion !== null">
                <strong>Currently active:</strong> v{{
                  report.activeSnapshotVersion
                }}
              </div>
              <div *ngIf="report.activeSnapshotVersion === null">
                <strong>Currently active:</strong>
                <em>none (would be initial lock)</em>
              </div>
            </ng-container>
            <ng-container *ngIf="data.mode === 'diff'">
              <div>
                <strong>Active version:</strong> v{{
                  report.activeSnapshotVersion
                }}
              </div>
              <div *ngIf="report.activeSnapshotHash">
                <strong>Hash:</strong>
                <code>{{ report.activeSnapshotHash | slice: 0 : 12 }}…</code>
              </div>
            </ng-container>
            <div><strong>Checked at:</strong> {{ report.checkedAt }}</div>
          </div>
          <div class="status">
            <span
              class="status-badge"
              [class.bad]="report.hasBreaking"
              [class.good]="!report.hasDrift">
              {{
                report.hasBreaking
                  ? 'BREAKING'
                  : report.hasDrift
                    ? 'DRIFT'
                    : 'NO DRIFT'
              }}
            </span>
          </div>
        </section>

        <section class="counts">
          <span class="count breaking"
            >{{ report.summary.breakingCount }} breaking</span
          >
          <span class="count maybe"
            >{{ report.summary.potentiallyBreakingCount }} maybe-breaking</span
          >
          <span class="count additive"
            >{{ report.summary.additiveCount }} additive</span
          >
          <span class="count cosmetic"
            >{{ report.summary.cosmeticCount }} cosmetic</span
          >
        </section>

        <mat-tab-group *ngIf="report.hasDrift">
          <mat-tab label="Changes ({{ report.summary.totalChanges }})">
            <ul class="change-list">
              <li
                *ngFor="let c of sortedChanges"
                [class]="'severity-' + c.severity">
                <span class="kind">{{ c.kind }}</span>
                <span class="path">{{ c.path }}</span>
                <details *ngIf="hasInterestingDetail(c)">
                  <summary>detail</summary>
                  <pre>{{ formatDetail(c) }}</pre>
                </details>
              </li>
            </ul>
          </mat-tab>
          <mat-tab label="Candidate JSON" *ngIf="report.candidate">
            <pre class="candidate-json">{{ candidateJson }}</pre>
          </mat-tab>
        </mat-tab-group>

        <p *ngIf="!report.hasDrift" class="no-drift">
          {{ noDriftMessage }}
        </p>
      </ng-container>
    </div>

    <div mat-dialog-actions align="end">
      <button mat-button (click)="close()">Close</button>
    </div>
  `,
  styles: [
    `
      .diff-dialog {
        min-width: 600px;
        max-height: 70vh;
        overflow: auto;
      }
      .loading,
      .error {
        display: flex;
        justify-content: center;
        padding: 24px;
      }
      .error {
        color: #b00020;
        gap: 8px;
        align-items: center;
      }

      .header-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding-bottom: 12px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.08);
      }
      .meta div {
        font-size: 13px;
        margin-bottom: 2px;
      }
      .meta code {
        background: #f5f5f5;
        padding: 1px 4px;
        border-radius: 3px;
      }
      .meta em {
        color: rgba(0, 0, 0, 0.6);
        font-style: italic;
      }

      .status-badge {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 999px;
        font-weight: 600;
        font-size: 12px;
        letter-spacing: 0.5px;
        background: #fff3e0;
        color: #e65100;

        &.good {
          background: #e8f5e9;
          color: #1b5e20;
        }
        &.bad {
          background: #ffebee;
          color: #b71c1c;
        }
      }

      .counts {
        display: flex;
        gap: 12px;
        margin: 12px 0;
        flex-wrap: wrap;

        .count {
          font-size: 12px;
          padding: 2px 8px;
          border-radius: 4px;
          background: #f5f5f5;

          &.breaking {
            background: #ffebee;
            color: #b71c1c;
          }
          &.maybe {
            background: #fff3e0;
            color: #e65100;
          }
          &.additive {
            background: #fffde7;
            color: #795548;
          }
          &.cosmetic {
            color: rgba(0, 0, 0, 0.55);
          }
        }
      }

      .change-list {
        list-style: none;
        padding: 0;
        margin: 8px 0 0;

        li {
          display: grid;
          grid-template-columns: 220px 1fr;
          gap: 12px;
          padding: 8px 0;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          align-items: baseline;

          .kind {
            font-family: monospace;
            font-size: 12px;
            color: rgba(0, 0, 0, 0.7);
          }
          .path {
            font-weight: 500;
          }
          details {
            grid-column: 1 / -1;
            margin-top: 4px;
          }
          pre {
            background: #fafafa;
            padding: 8px;
            border-radius: 4px;
            font-size: 11px;
            overflow-x: auto;
            margin: 4px 0 0;
          }

          &.severity-breaking {
            border-left: 3px solid #b71c1c;
            padding-left: 8px;
          }
          &.severity-potentially_breaking {
            border-left: 3px solid #e65100;
            padding-left: 8px;
          }
          &.severity-additive {
            border-left: 3px solid #fbc02d;
            padding-left: 8px;
          }
          &.severity-cosmetic {
            border-left: 3px solid rgba(0, 0, 0, 0.2);
            padding-left: 8px;
          }
        }
      }

      .candidate-json {
        background: #fafafa;
        padding: 12px;
        border-radius: 4px;
        font-size: 11px;
        max-height: 50vh;
        overflow: auto;
      }

      .no-drift {
        padding: 24px 0;
        text-align: center;
        color: rgba(0, 0, 0, 0.55);
      }
    `,
  ],
})
export class DfTableDiffDialogComponent implements OnInit {
  private readonly contracts = inject(DfSchemaContractsService);
  private readonly dialogRef = inject(MatDialogRef<DfTableDiffDialogComponent>);

  report: ReportViewModel | null = null;
  sortedChanges: DriftChange[] = [];
  candidateJson = '';
  loading = true;
  errorMessage = '';

  constructor(@Inject(MAT_DIALOG_DATA) public data: DialogData) {}

  get titlePrefix(): string {
    return this.data.mode === 'test' ? 'Lock preview' : 'Drift';
  }

  get noDriftMessage(): string {
    return this.data.mode === 'test'
      ? 'No drift — locking now would be a no-op.'
      : 'The live schema matches the active snapshot — no drift detected.';
  }

  ngOnInit(): void {
    const source$: Observable<TableDiffResponse | TestResponse | null> =
      this.data.mode === 'test'
        ? this.contracts.testTable(this.data.service, this.data.table)
        : this.contracts.getTableDiff(this.data.service, this.data.table);

    source$
      .pipe(
        catchError(err => {
          this.errorMessage =
            err?.error?.error?.message ??
            err?.message ??
            'Failed to load report.';
          return of(null);
        })
      )
      .subscribe(response => {
        this.loading = false;
        if (!response) {
          return;
        }
        this.report = this.toViewModel(response);
        this.sortedChanges = [...response.changes].sort(
          (a, b) =>
            this.severityRank(a.severity) - this.severityRank(b.severity)
        );
        if (response.candidate) {
          this.candidateJson = JSON.stringify(response.candidate, null, 2);
        }
      });
  }

  hasInterestingDetail(change: DriftChange): boolean {
    return Object.keys(change.detail ?? {}).length > 0;
  }

  formatDetail(change: DriftChange): string {
    return JSON.stringify(change.detail, null, 2);
  }

  close(): void {
    this.dialogRef.close();
  }

  private toViewModel(r: TableDiffResponse | TestResponse): ReportViewModel {
    const isTest = 'wouldBeVersion' in r;
    return {
      checkedAt: r.checkedAt,
      hasDrift: r.hasDrift,
      hasBreaking: r.hasBreaking,
      summary: r.summary,
      changes: r.changes,
      candidate: r.candidate,
      activeSnapshotVersion: r.activeSnapshotVersion ?? null,
      activeSnapshotHash: r.activeSnapshotHash ?? null,
      wouldBeVersion: isTest ? (r as TestResponse).wouldBeVersion : null,
      wouldBeAction: isTest ? (r as TestResponse).wouldBeAction : null,
    };
  }

  private severityRank(s: string): number {
    switch (s) {
      case 'breaking':
        return 0;
      case 'potentially_breaking':
        return 1;
      case 'additive':
        return 2;
      case 'cosmetic':
        return 3;
      default:
        return 4;
    }
  }
}
