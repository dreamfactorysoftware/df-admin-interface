import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoModule } from '@ngneat/transloco';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faTable, faDatabase } from '@fortawesome/free-solid-svg-icons';
import { TableInfo } from './services/data-explorer.service';

@Component({
  selector: 'df-schema-tree',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    FormsModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    TranslocoModule,
    FontAwesomeModule,
  ],
  template: `
    <div class="schema-tree" *transloco="let t; scope: 'dataExplorer'">
      <!-- Header with back button -->
      <div class="panel-header">
        <button mat-icon-button (click)="backClicked.emit()" class="back-btn">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <fa-icon [icon]="faDatabase" class="header-icon"></fa-icon>
        <span class="header-title" [matTooltip]="serviceLabel">{{ serviceLabel }}</span>
      </div>

      <!-- Search -->
      <div class="search-box" *ngIf="!loading && !error && tables.length > 0">
        <mat-form-field appearance="outline" class="search-field">
          <mat-icon matPrefix>search</mat-icon>
          <input matInput
                 [placeholder]="t('dataExplorer.searchTables')"
                 [(ngModel)]="searchQuery"
                 (ngModelChange)="filterTables()">
        </mat-form-field>
      </div>

      <!-- Tables header -->
      <div class="tables-header" *ngIf="!loading && !error && tables.length > 0">
        <span class="tables-label">{{ t('dataExplorer.tables') }}</span>
        <span class="tables-count">{{ filteredTables.length }}</span>
      </div>

      <!-- Loading -->
      <div class="loading-state" *ngIf="loading">
        <mat-spinner diameter="32"></mat-spinner>
        <span>{{ t('dataExplorer.loadingSchema') }}</span>
      </div>

      <!-- Error -->
      <div class="error-state" *ngIf="error && !loading">
        <mat-icon color="warn">error_outline</mat-icon>
        <span>{{ error }}</span>
        <button mat-stroked-button color="primary" (click)="retry.emit()">
          {{ t('dataExplorer.retry') }}
        </button>
      </div>

      <!-- Empty -->
      <div class="empty-state" *ngIf="!loading && !error && tables.length === 0">
        <mat-icon>info_outline</mat-icon>
        <span>{{ t('dataExplorer.noTables') }}</span>
        <small>{{ t('dataExplorer.noTablesHint') }}</small>
      </div>

      <!-- Table list -->
      <mat-nav-list *ngIf="!loading && !error && filteredTables.length > 0" class="table-list">
        <a mat-list-item
           *ngFor="let table of filteredTables"
           (click)="tableSelected.emit(table)"
           [class.selected]="selectedTable?.name === table.name"
           class="table-item">
          <fa-icon [icon]="faTable" class="table-icon"></fa-icon>
          <span class="table-name">{{ table.name }}</span>
        </a>
      </mat-nav-list>
    </div>
  `,
  styles: [
    `
      .schema-tree {
        height: 100%;
        display: flex;
        flex-direction: column;
      }

      .panel-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px 8px 8px;
        border-bottom: 1px solid #e0e0e0;
        font-weight: 500;
        font-size: 14px;
        color: #424242;
        min-height: 52px;

        .back-btn {
          flex-shrink: 0;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;

          ::ng-deep .mat-mdc-button-touch-target {
            width: 36px;
            height: 36px;
          }

          mat-icon {
            font-size: 20px;
            width: 20px;
            height: 20px;
          }
        }

        .header-icon {
          color: #7b1fa2;
          font-size: 16px;
          flex-shrink: 0;
        }

        .header-title {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
          min-width: 0;
        }
      }

      :host-context(.dark-theme) .panel-header {
        border-bottom-color: #424242;
        color: #e0e0e0;
        .header-icon { color: #ce93d8; }
      }

      .search-box {
        padding: 12px 12px 0;

        .search-field {
          width: 100%;

          ::ng-deep .mat-mdc-form-field-infix {
            min-height: 44px;
            padding: 8px 0 !important;
            display: flex;
            align-items: center;
          }
          ::ng-deep .mat-mdc-text-field-wrapper {
            padding: 0 12px;
          }
          ::ng-deep .mat-mdc-form-field-icon-prefix {
            padding: 0 8px 0 0;
            display: flex;
            align-items: center;
          }
          ::ng-deep input.mat-mdc-input-element {
            font-size: 14px;
            line-height: 1.4;
            height: auto;
          }
          ::ng-deep .mat-mdc-form-field-subscript-wrapper {
            display: none;
          }
        }
      }

      .tables-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 16px 4px;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: #9e9e9e;
        font-weight: 600;

        .tables-count {
          background: #e0e0e0;
          border-radius: 10px;
          padding: 1px 8px;
          font-size: 11px;
          font-weight: 500;
          color: #616161;
        }
      }

      :host-context(.dark-theme) .tables-header {
        color: #757575;
        .tables-count {
          background: #424242;
          color: #bdbdbd;
        }
      }

      .loading-state,
      .error-state,
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        padding: 32px 16px;
        text-align: center;
        color: #757575;
        font-size: 13px;
      }

      .table-list {
        flex: 1;
        overflow-y: auto;
        padding-top: 0;
      }

      .table-item {
        height: 40px !important;
        padding: 0 16px !important;
        font-size: 13px;
        cursor: pointer;

        ::ng-deep .mdc-list-item__primary-text {
          display: flex !important;
          align-items: center;
          width: 100%;
        }

        .table-icon {
          color: #7b1fa2;
          font-size: 13px;
          margin-right: 10px;
          flex-shrink: 0;
          pointer-events: none;
        }

        .table-name {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          pointer-events: none;
        }

        &.selected {
          background: rgba(123, 31, 162, 0.08);
          font-weight: 500;
        }
      }

      :host-context(.dark-theme) .table-item {
        .table-icon { color: #ce93d8; }
        &.selected {
          background: rgba(206, 147, 216, 0.12);
        }
      }
    `,
  ],
})
export class DfSchemaTreeComponent implements OnChanges {
  @Input() serviceName = '';
  @Input() serviceLabel = '';
  @Input() tables: TableInfo[] = [];
  @Input() loading = false;
  @Input() error: string | null = null;
  @Input() selectedTable: TableInfo | null = null;
  @Output() tableSelected = new EventEmitter<TableInfo>();
  @Output() backClicked = new EventEmitter<void>();
  @Output() retry = new EventEmitter<void>();

  faTable = faTable;
  faDatabase = faDatabase;

  searchQuery = '';
  filteredTables: TableInfo[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tables']) {
      this.filterTables();
    }
  }

  filterTables(): void {
    if (!this.searchQuery) {
      this.filteredTables = this.tables;
    } else {
      const q = this.searchQuery.toLowerCase();
      this.filteredTables = this.tables.filter(t =>
        t.name.toLowerCase().includes(q)
      );
    }
  }
}
