import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgIf, NgFor, JsonPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoModule } from '@ngneat/transloco';
import { FieldInfo, TableSchemaResponse } from './services/data-explorer.service';

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
            <span class="field-type-badge" *ngIf="getFieldInfo(key) as fi">{{ fi.dbType }}</span>
            <mat-chip-set class="field-badges" *ngIf="getFieldInfo(key) as fi">
              <mat-chip *ngIf="fi.isPrimaryKey" class="badge-pk" disabled>PK</mat-chip>
              <mat-chip *ngIf="fi.isForeignKey" class="badge-fk" disabled
                [matTooltip]="fi.refTable + '.' + fi.refField">FK</mat-chip>
            </mat-chip-set>
          </div>
          <div class="field-value" [class.null-value]="row[key] === null || row[key] === undefined">
            <ng-container *ngIf="row[key] === null || row[key] === undefined">
              <span class="null-badge">{{ t('dataExplorer.nullValue') }}</span>
            </ng-container>
            <ng-container *ngIf="row[key] !== null && row[key] !== undefined">
              <pre *ngIf="isObject(row[key])" class="json-value">{{ row[key] | json }}</pre>
              <span *ngIf="!isObject(row[key])" class="text-value">{{ row[key] }}</span>
            </ng-container>
          </div>
          <div class="field-ref" *ngIf="getFieldInfo(key)?.isForeignKey && getFieldInfo(key)?.refTable">
            <mat-icon class="ref-icon">link</mat-icon>
            <a class="ref-link" (click)="navigateToTable.emit(getFieldInfo(key)!.refTable!)">
              {{ getFieldInfo(key)!.refTable }}.{{ getFieldInfo(key)!.refField }}
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
        border-left: 1px solid #e0e0e0;
        background: #fafafa;
        overflow: hidden;
      }

      .detail-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        border-bottom: 1px solid #e0e0e0;
        background: #f5f5f5;

        .detail-title {
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

      .detail-body {
        flex: 1;
        overflow-y: auto;
        padding: 0;
      }

      .field-entry {
        padding: 8px 12px;
        border-bottom: 1px solid #f0f0f0;

        .field-label {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 4px;

          .field-key {
            font-size: 12px;
            font-weight: 600;
            color: #424242;
            font-family: 'Roboto Mono', monospace;
          }

          .field-type-badge {
            font-size: 10px;
            color: #9e9e9e;
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
          }
        }

        .field-value {
          font-size: 13px;
          color: #212121;
          word-break: break-word;

          .null-badge {
            display: inline-block;
            font-size: 11px;
            padding: 1px 8px;
            border-radius: 4px;
            background: #eeeeee;
            color: #9e9e9e;
            font-style: italic;
          }

          .json-value {
            font-size: 12px;
            font-family: 'Roboto Mono', monospace;
            background: #f5f5f5;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
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
          color: #9e9e9e;
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
            color: #9e9e9e;
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

      :host-context(.dark-theme) {
        .row-detail-panel {
          background: #1e1e1e;
          border-left-color: #424242;
        }
        .detail-header {
          background: #2c2c2c;
          border-bottom-color: #424242;
          .detail-title { color: #bdbdbd; }
        }
        .field-entry {
          border-bottom-color: #2c2c2c;
          .field-label .field-key { color: #e0e0e0; }
          .field-value {
            color: #e0e0e0;
            .null-badge {
              background: #333;
              color: #757575;
            }
            .json-value {
              background: #2c2c2c;
              border-color: #424242;
              color: #e0e0e0;
            }
          }
        }
        .ref-link { color: #64b5f6; }
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
