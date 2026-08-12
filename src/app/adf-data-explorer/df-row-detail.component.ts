import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgIf, NgFor, JsonPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoModule } from '@ngneat/transloco';
import {
  FieldInfo,
  TableSchemaResponse,
} from './services/data-explorer.service';

@Component({
  selector: 'df-row-detail',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    JsonPipe,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatTooltipModule,
    TranslocoModule,
  ],
  template: `
    <div class="row-detail-panel" *transloco="let t; scope: 'dataExplorer'">
      <div class="detail-header">
        <span class="detail-title">{{ t('dataExplorer.recordDetail') }}</span>
        <button mat-icon-button (click)="closeClicked.emit()" class="close-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="detail-body" *ngIf="row">
        <div class="field-entry" *ngFor="let key of objectKeys(row)">
          <div class="field-label">
            <span class="field-key">{{ key }}</span>
            <span class="field-type-badge" *ngIf="getFieldInfo(key) as fi">{{
              fi.dbType
            }}</span>
            <mat-chip-set class="field-badges" *ngIf="getFieldInfo(key) as fi">
              <mat-chip *ngIf="fi.isPrimaryKey" class="badge-pk" disabled
                >PK</mat-chip
              >
              <mat-chip
                *ngIf="fi.isForeignKey"
                class="badge-fk"
                disabled
                [matTooltip]="fi.refTable + '.' + fi.refField"
                >FK</mat-chip
              >
            </mat-chip-set>
          </div>
          <div
            class="field-value"
            [class.null-value]="row[key] === null || row[key] === undefined">
            <ng-container *ngIf="row[key] === null || row[key] === undefined">
              <span class="null-badge">{{ t('dataExplorer.nullValue') }}</span>
            </ng-container>
            <ng-container *ngIf="row[key] !== null && row[key] !== undefined">
              <pre *ngIf="isObject(row[key])" class="json-value">{{
                row[key] | json
              }}</pre>
              <span *ngIf="!isObject(row[key])" class="text-value">{{
                row[key]
              }}</span>
            </ng-container>
          </div>
          <div
            class="field-ref"
            *ngIf="
              getFieldInfo(key)?.isForeignKey && getFieldInfo(key)?.refTable
            ">
            <mat-icon class="ref-icon">link</mat-icon>
            <a
              class="ref-link"
              (click)="navigateToTable.emit(getFieldInfo(key)!.refTable!)">
              {{ getFieldInfo(key)!.refTable }}.{{
                getFieldInfo(key)!.refField
              }}
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .row-detail-panel {
        display: flex;
        flex-direction: column;
        height: 100%;
        width: 380px;
        border-left: 1px solid var(--df-border);
        background: var(--df-bg);
        overflow: hidden;
      }

      .detail-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        border-bottom: 1px solid var(--df-border);
        background: var(--df-surface-2);

        .detail-title {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--df-text-muted);
        }

        .close-btn {
          width: 28px;
          height: 28px;
          line-height: 28px;
        }
      }

      .detail-body {
        flex: 1;
        overflow-y: auto;
        padding: 0;
      }

      .field-entry {
        padding: 8px 12px;
        border-bottom: 1px solid var(--df-border-2);

        .field-label {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 4px;

          .field-key {
            font-size: 12px;
            font-weight: 600;
            color: var(--df-text);
            font-family: 'SFMono-Regular', Menlo, Consolas, monospace;
          }

          .field-type-badge {
            font-size: 10px;
            color: var(--df-text-faint);
            font-family: 'SFMono-Regular', Menlo, Consolas, monospace;
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
              --mdc-chip-elevated-container-color: var(--df-accent);
              --mdc-chip-label-text-color: var(--df-accent-contrast);
            }

            .badge-fk {
              --mdc-chip-elevated-container-color: var(--df-accent-soft);
              --mdc-chip-label-text-color: var(--df-accent-strong);
            }
          }
        }

        .field-value {
          font-size: 1.3rem;
          color: var(--df-text);
          word-break: break-word;

          .null-badge {
            display: inline-block;
            font-size: 11px;
            padding: 1px 8px;
            border-radius: var(--df-radius-sm);
            background: var(--df-surface-2);
            color: var(--df-text-faint);
            font-style: italic;
          }

          .json-value {
            font-size: 12px;
            font-family: 'SFMono-Regular', Menlo, Consolas, monospace;
            background: var(--df-surface-2);
            border: 1px solid var(--df-border);
            border-radius: var(--df-radius-sm);
            padding: 8px;
            margin: 4px 0 0;
            overflow-x: auto;
            max-height: 200px;
            white-space: pre-wrap;
          }

          .text-value {
            white-space: pre-wrap;
          }
        }

        &.null-value .field-value {
          color: var(--df-text-faint);
        }

        .field-ref {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-top: 4px;

          .ref-icon {
            font-size: 14px;
            width: 14px;
            height: 14px;
            color: var(--df-text-faint);
          }
        }
      }

      .ref-link {
        color: var(--df-accent);
        cursor: pointer;
        font-size: 11px;
        text-decoration: none;
        &:hover {
          color: var(--df-accent-strong);
          text-decoration: underline;
        }
      }
    `,
  ],
})
export class DfRowDetailComponent {
  @Input() row: Record<string, any> | null = null;
  @Input() schema: TableSchemaResponse | null = null;
  @Output() closeClicked = new EventEmitter<void>();
  @Output() navigateToTable = new EventEmitter<string>();

  objectKeys = Object.keys;

  isObject(value: any): boolean {
    return value !== null && typeof value === 'object';
  }

  getFieldInfo(columnName: string): FieldInfo | null {
    if (!this.schema?.field) return null;
    return this.schema.field.find(f => f.name === columnName) || null;
  }
}
