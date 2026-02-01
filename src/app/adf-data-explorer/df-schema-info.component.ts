import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  EventEmitter,
  Output,
} from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoModule } from '@ngneat/transloco';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  DataExplorerService,
  TableSchemaResponse,
  FieldInfo,
  RelatedInfo,
} from './services/data-explorer.service';

@Component({
  selector: 'df-schema-info',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    TranslocoModule,
  ],
  template: `
    <div class="schema-info-panel" *transloco="let t; scope: 'dataExplorer'">
      <div class="schema-header">
        <span class="schema-title">{{ t('dataExplorer.schemaInfo') }}</span>
        <button mat-icon-button (click)="closeClicked.emit()" class="close-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="schema-loading" *ngIf="loading">
        <mat-spinner diameter="24"></mat-spinner>
      </div>

      <div class="schema-error" *ngIf="error && !loading">
        <mat-icon color="warn">error_outline</mat-icon>
        <span>{{ error }}</span>
      </div>

      <div class="schema-body" *ngIf="schema && !loading && !error">
        <!-- Fields -->
        <div class="section-header">{{ t('dataExplorer.columns') }} ({{ schema.field.length }})</div>
        <div class="field-list">
          <div class="field-row" *ngFor="let field of schema.field">
            <div class="field-name">
              <span>{{ field.name }}</span>
              <mat-chip-set class="field-badges">
                <mat-chip *ngIf="field.isPrimaryKey" class="badge-pk" disabled>PK</mat-chip>
                <mat-chip *ngIf="field.isForeignKey" class="badge-fk" disabled
                  [matTooltip]="field.refTable + '.' + field.refField">FK</mat-chip>
                <mat-chip *ngIf="field.isUnique && !field.isPrimaryKey" class="badge-uq" disabled>UQ</mat-chip>
              </mat-chip-set>
            </div>
            <div class="field-type">{{ field.dbType }}</div>
            <div class="field-meta">
              <span *ngIf="!field.allowNull" class="not-null">NOT NULL</span>
              <span *ngIf="field.autoIncrement" class="auto-inc">AUTO</span>
            </div>
            <div class="field-ref" *ngIf="field.isForeignKey && field.refTable">
              <mat-icon class="ref-icon">subdirectory_arrow_right</mat-icon>
              <a class="ref-link" (click)="navigateToTable.emit(field.refTable!)">
                {{ field.refTable }}.{{ field.refField }}
              </a>
            </div>
          </div>
        </div>

        <!-- Relationships -->
        <div *ngIf="schema.related && schema.related.length > 0">
          <div class="section-header">{{ t('dataExplorer.relationships') }} ({{ schema.related!.length }})</div>
          <div class="rel-list">
            <div class="rel-row" *ngFor="let rel of schema.related">
              <mat-icon class="rel-icon">{{ rel.type === 'belongs_to' ? 'arrow_back' : 'arrow_forward' }}</mat-icon>
              <div class="rel-info">
                <span class="rel-type">{{ rel.type }}</span>
                <a class="ref-link" (click)="navigateToTable.emit(rel.refTable)">{{ rel.refTable }}</a>
                <span class="rel-field">{{ rel.field }} → {{ rel.refField }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .schema-info-panel {
        display: flex;
        flex-direction: column;
        height: 100%;
        border-left: 1px solid #e0e0e0;
        background: #fafafa;
        width: 320px;
        overflow: hidden;
      }

      .schema-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        border-bottom: 1px solid #e0e0e0;
        background: #f5f5f5;

        .schema-title {
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #616161;
        }

        .close-btn {
          width: 28px;
          height: 28px;
          line-height: 28px;
        }
      }

      .schema-loading {
        display: flex;
        justify-content: center;
        padding: 24px;
      }

      .schema-error {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px;
        font-size: 13px;
        color: #d32f2f;
      }

      .schema-body {
        flex: 1;
        overflow-y: auto;
        padding: 0;
      }

      .section-header {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: #9e9e9e;
        padding: 12px 12px 6px;
        border-bottom: 1px solid #eeeeee;
      }

      .field-list {
        .field-row {
          padding: 6px 12px;
          border-bottom: 1px solid #f5f5f5;
          font-size: 12px;

          .field-name {
            display: flex;
            align-items: center;
            gap: 6px;
            font-weight: 500;
            color: #212121;
            font-family: 'Roboto Mono', monospace;
          }

          .field-badges {
            display: inline-flex;
            gap: 4px;

            mat-chip {
              font-size: 9px;
              min-height: 18px;
              padding: 0 6px;
            }

            .badge-pk {
              --mdc-chip-elevated-container-color: #7b1fa2;
              --mdc-chip-label-text-color: white;
            }

            .badge-fk {
              --mdc-chip-elevated-container-color: #1565c0;
              --mdc-chip-label-text-color: white;
            }

            .badge-uq {
              --mdc-chip-elevated-container-color: #ef6c00;
              --mdc-chip-label-text-color: white;
            }
          }

          .field-type {
            font-size: 11px;
            color: #757575;
            margin-top: 2px;
            font-family: 'Roboto Mono', monospace;
          }

          .field-meta {
            display: flex;
            gap: 8px;
            margin-top: 2px;

            .not-null, .auto-inc {
              font-size: 10px;
              color: #9e9e9e;
              text-transform: uppercase;
            }
          }

          .field-ref {
            display: flex;
            align-items: center;
            gap: 4px;
            margin-top: 2px;

            .ref-icon {
              font-size: 14px;
              width: 14px;
              height: 14px;
              color: #9e9e9e;
            }
          }
        }
      }

      .ref-link {
        color: #1565c0;
        cursor: pointer;
        font-size: 11px;
        text-decoration: none;
        &:hover {
          text-decoration: underline;
        }
      }

      .rel-list {
        .rel-row {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 6px 12px;
          border-bottom: 1px solid #f5f5f5;

          .rel-icon {
            font-size: 16px;
            width: 16px;
            height: 16px;
            color: #7b1fa2;
            margin-top: 2px;
          }

          .rel-info {
            display: flex;
            flex-direction: column;
            gap: 2px;

            .rel-type {
              font-size: 10px;
              text-transform: uppercase;
              color: #9e9e9e;
              letter-spacing: 0.5px;
            }

            .rel-field {
              font-size: 11px;
              color: #757575;
              font-family: 'Roboto Mono', monospace;
            }
          }
        }
      }

      :host-context(.dark-theme) {
        .schema-info-panel {
          background: #1e1e1e;
          border-left-color: #424242;
        }
        .schema-header {
          background: #2c2c2c;
          border-bottom-color: #424242;
          .schema-title { color: #bdbdbd; }
        }
        .section-header {
          color: #757575;
          border-bottom-color: #333;
        }
        .field-list .field-row {
          border-bottom-color: #2c2c2c;
          .field-name { color: #e0e0e0; }
          .field-type { color: #9e9e9e; }
        }
        .ref-link { color: #64b5f6; }
        .rel-list .rel-row {
          border-bottom-color: #2c2c2c;
          .rel-icon { color: #ce93d8; }
        }
      }
    `,
  ],
})
export class DfSchemaInfoComponent implements OnChanges, OnDestroy {
  @Input() serviceName = '';
  @Input() tableName = '';
  @Output() closeClicked = new EventEmitter<void>();
  @Output() navigateToTable = new EventEmitter<string>();

  schema: TableSchemaResponse | null = null;
  loading = false;
  error: string | null = null;

  private cache = new Map<string, TableSchemaResponse>();
  private destroy$ = new Subject<void>();

  constructor(private dataExplorerService: DataExplorerService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tableName'] || changes['serviceName']) {
      this.loadSchema();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadSchema(): void {
    if (!this.serviceName || !this.tableName) return;

    const cacheKey = `${this.serviceName}:${this.tableName}`;
    if (this.cache.has(cacheKey)) {
      this.schema = this.cache.get(cacheKey)!;
      return;
    }

    this.loading = true;
    this.error = null;

    this.dataExplorerService
      .getTableSchema(this.serviceName, this.tableName)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: schema => {
          this.schema = schema;
          this.cache.set(cacheKey, schema);
          this.loading = false;
        },
        error: err => {
          this.error = err?.error?.error?.message || 'Failed to load schema';
          this.loading = false;
        },
      });
  }

  getSchema(): TableSchemaResponse | null {
    return this.schema;
  }

  getCachedSchema(serviceName: string, tableName: string): TableSchemaResponse | null {
    return this.cache.get(`${serviceName}:${tableName}`) || null;
  }
}
