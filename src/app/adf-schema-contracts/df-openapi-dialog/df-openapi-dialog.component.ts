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
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, of } from 'rxjs';
import { DfSchemaContractsService } from '../services/df-schema-contracts.service';
import { TableOpenApiResponse } from '../types';

interface DialogData {
  service: string;
  table: string;
}

@Component({
  selector: 'df-openapi-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>
      OpenAPI schema &mdash; {{ data.service }}.{{ data.table }}
    </h2>

    <div mat-dialog-content class="openapi-dialog">
      <div *ngIf="loading" class="loading">
        <mat-progress-spinner
          diameter="32"
          mode="indeterminate"></mat-progress-spinner>
      </div>

      <div *ngIf="errorMessage" class="error">
        <mat-icon>error_outline</mat-icon>
        {{ errorMessage }}
      </div>

      <ng-container *ngIf="response && !loading">
        <section class="header-row">
          <div class="meta">
            <div>
              <strong>Schema name:</strong>
              <code>{{ response.schemaName }}</code>
            </div>
          </div>
          <span
            class="source-badge"
            [class.locked]="response.source === 'snapshot'">
            {{
              response.source === 'snapshot'
                ? 'locked · v' + response.snapshotVersion
                : 'live'
            }}
          </span>
        </section>

        <p class="hint" *ngIf="response.source === 'snapshot'">
          Frozen to the locked contract. It won't change as the database drifts
          until the table is re-locked or promoted.
        </p>
        <p class="hint" *ngIf="response.source === 'live'">
          Generated from live schema. Lock the table (or set mode to
          auto/strict) to freeze this contract.
        </p>

        <pre class="schema-json">{{ schemaJson }}</pre>
      </ng-container>
    </div>

    <div mat-dialog-actions align="end">
      <button mat-button (click)="copy()" *ngIf="response">Copy JSON</button>
      <button mat-button (click)="close()">Close</button>
    </div>
  `,
  styles: [
    `
      .openapi-dialog {
        min-width: 600px;
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
      .error {
        color: #b00020;
      }

      .header-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 8px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.08);

        .meta code {
          background: #f5f5f5;
          padding: 1px 6px;
          border-radius: 3px;
        }
      }

      .source-badge {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 999px;
        font-weight: 600;
        font-size: 12px;
        letter-spacing: 0.5px;
        background: #e3f2fd;
        color: #0d47a1;

        &.locked {
          background: #e8f5e9;
          color: #1b5e20;
        }
      }

      .hint {
        font-size: 13px;
        color: rgba(0, 0, 0, 0.6);
        margin: 12px 0;
      }

      .schema-json {
        background: #fafafa;
        padding: 12px;
        border-radius: 4px;
        font-size: 11px;
        max-height: 55vh;
        overflow: auto;
      }
    `,
  ],
})
export class DfOpenApiDialogComponent implements OnInit {
  private readonly contracts = inject(DfSchemaContractsService);
  private readonly dialogRef = inject(MatDialogRef<DfOpenApiDialogComponent>);
  private readonly snackBar = inject(MatSnackBar);

  response: TableOpenApiResponse | null = null;
  schemaJson = '';
  loading = true;
  errorMessage = '';

  constructor(@Inject(MAT_DIALOG_DATA) public data: DialogData) {}

  ngOnInit(): void {
    this.contracts
      .getTableOpenApi(this.data.service, this.data.table)
      .pipe(
        catchError(err => {
          this.errorMessage =
            err?.error?.error?.message ??
            err?.message ??
            'Failed to load OpenAPI schema.';
          return of(null);
        })
      )
      .subscribe(response => {
        this.loading = false;
        if (!response) {
          return;
        }
        this.response = response;
        this.schemaJson = JSON.stringify(response.schema, null, 2);
      });
  }

  copy(): void {
    if (!this.schemaJson) {
      return;
    }
    navigator.clipboard?.writeText(this.schemaJson).then(
      () =>
        this.snackBar.open('Schema copied to clipboard', 'Dismiss', {
          duration: 2500,
        }),
      () => this.snackBar.open('Copy failed', 'Dismiss', { duration: 2500 })
    );
  }

  close(): void {
    this.dialogRef.close();
  }
}
