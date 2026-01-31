import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort, Sort } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatChipsModule } from '@angular/material/chips';
import { TranslocoModule } from '@ngneat/transloco';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faTable, faLock } from '@fortawesome/free-solid-svg-icons';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DataExplorerService } from './services/data-explorer.service';

@Component({
  selector: 'df-data-grid',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatToolbarModule,
    MatChipsModule,
    TranslocoModule,
    FontAwesomeModule,
  ],
  template: `
    <div class="data-grid-container" *transloco="let t; scope: 'dataExplorer'">
      <!-- Toolbar -->
      <div class="grid-toolbar">
        <div class="toolbar-left">
          <fa-icon [icon]="faTable" class="toolbar-icon"></fa-icon>
          <span class="table-title">{{ tableName }}</span>
          <mat-chip-set class="readonly-chip">
            <mat-chip disabled>
              <fa-icon [icon]="faLock" class="lock-icon"></fa-icon>
              {{ t('dataExplorer.readOnly') }}
            </mat-chip>
          </mat-chip-set>
        </div>
        <div class="toolbar-right" *ngIf="totalRecords > 0">
          <span class="record-count">
            {{ t('dataExplorer.showing') }}
            {{ currentOffset + 1 }}-{{ currentOffset + dataSource.data.length }}
            {{ t('dataExplorer.of') }}
            {{ totalRecords }}
            {{ t('dataExplorer.records') }}
          </span>
        </div>
      </div>

      <!-- Loading -->
      <div class="loading-state" *ngIf="loading">
        <mat-spinner diameter="40"></mat-spinner>
        <span>{{ t('dataExplorer.loadingData') }}</span>
      </div>

      <!-- Error -->
      <div class="error-state" *ngIf="error && !loading">
        <mat-icon color="warn">error_outline</mat-icon>
        <span>{{ error }}</span>
        <button mat-stroked-button color="primary" (click)="loadData()">
          {{ t('dataExplorer.retry') }}
        </button>
      </div>

      <!-- Empty -->
      <div class="empty-state" *ngIf="!loading && !error && dataSource.data.length === 0 && columns.length === 0">
        <mat-icon>inbox</mat-icon>
        <span>{{ t('dataExplorer.noData') }}</span>
        <small>{{ t('dataExplorer.noDataHint') }}</small>
      </div>

      <!-- Data Table -->
      <div class="table-wrapper" *ngIf="!loading && !error && columns.length > 0">
        <div class="table-scroll">
          <table mat-table [dataSource]="dataSource" matSort (matSortChange)="onSortChange($event)" class="data-table">
            <ng-container *ngFor="let col of columns" [matColumnDef]="col">
              <th mat-header-cell *matHeaderCellDef mat-sort-header class="header-cell">
                {{ col }}
              </th>
              <td mat-cell *matCellDef="let row" class="data-cell">
                {{ formatCellValue(row[col]) }}
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="columns; sticky: true"></tr>
            <tr mat-row *matRowDef="let row; columns: columns;"></tr>
          </table>
        </div>

        <mat-paginator
          [length]="totalRecords"
          [pageSize]="pageSize"
          [pageSizeOptions]="[25, 50, 100]"
          [pageIndex]="pageIndex"
          (page)="onPageChange($event)"
          showFirstLastButtons>
        </mat-paginator>
      </div>
    </div>
  `,
  styles: [
    `
      .data-grid-container {
        height: 100%;
        display: flex;
        flex-direction: column;
      }

      .grid-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 20px;
        border-bottom: 1px solid #e0e0e0;
        background: #fafafa;
        min-height: 48px;

        .toolbar-left {
          display: flex;
          align-items: center;
          gap: 10px;

          .toolbar-icon {
            color: #7b1fa2;
            font-size: 16px;
          }

          .table-title {
            font-size: 16px;
            font-weight: 500;
            color: #212121;
          }

          .readonly-chip {
            .lock-icon {
              font-size: 11px;
              margin-right: 4px;
            }
          }
        }

        .toolbar-right {
          .record-count {
            font-size: 13px;
            color: #757575;
          }
        }
      }

      :host-context(.dark-theme) .grid-toolbar {
        border-bottom-color: #424242;
        background: #303030;
        .toolbar-left {
          .toolbar-icon { color: #ce93d8; }
          .table-title { color: #e0e0e0; }
        }
        .toolbar-right .record-count { color: #9e9e9e; }
      }

      .loading-state,
      .error-state,
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 16px;
        padding: 48px 24px;
        color: #757575;
        font-size: 14px;
        flex: 1;
      }

      .table-wrapper {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .table-scroll {
        flex: 1;
        overflow: auto;
      }

      .data-table {
        width: 100%;
        min-width: max-content;

        .header-cell {
          font-weight: 600;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #616161;
          background: #f5f5f5;
          white-space: nowrap;
          padding: 0 16px;
          min-width: 120px;
          max-width: 300px;
          border-right: 1px solid #e0e0e0;
        }

        .data-cell {
          font-size: 13px;
          padding: 0 16px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 300px;
          min-width: 120px;
          border-right: 1px solid #f0f0f0;
          font-family: 'Roboto Mono', monospace;
        }

        tr.mat-mdc-row:hover {
          background: rgba(123, 31, 162, 0.04);
        }

        tr.mat-mdc-row {
          height: 36px;
        }

        tr.mat-mdc-header-row {
          height: 40px;
        }
      }

      :host-context(.dark-theme) .data-table {
        .header-cell {
          color: #bdbdbd;
          background: #383838;
          border-right-color: #424242;
        }
        .data-cell {
          border-right-color: #383838;
          color: #e0e0e0;
        }
        tr.mat-mdc-row:hover {
          background: rgba(206, 147, 216, 0.06);
        }
      }

      mat-paginator {
        border-top: 1px solid #e0e0e0;
      }

      :host-context(.dark-theme) mat-paginator {
        border-top-color: #424242;
      }
    `,
  ],
})
export class DfDataGridComponent implements OnChanges, OnDestroy, AfterViewInit {
  @Input() serviceName = '';
  @Input() tableName = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  dataSource = new MatTableDataSource<any>([]);
  columns: string[] = [];
  totalRecords = 0;
  pageSize = 50;
  pageIndex = 0;
  currentOffset = 0;
  loading = false;
  error: string | null = null;
  currentSort: string | undefined;

  faTable = faTable;
  faLock = faLock;

  private destroy$ = new Subject<void>();

  constructor(private dataExplorerService: DataExplorerService) {}

  ngAfterViewInit(): void {
    // Paginator and sort are ready
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tableName'] || changes['serviceName']) {
      this.resetAndLoad();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  resetAndLoad(): void {
    this.columns = [];
    this.dataSource.data = [];
    this.totalRecords = 0;
    this.pageIndex = 0;
    this.currentOffset = 0;
    this.currentSort = undefined;
    this.loadData();
  }

  loadData(): void {
    if (!this.serviceName || !this.tableName) return;

    this.loading = true;
    this.error = null;

    this.dataExplorerService
      .getTableData(
        this.serviceName,
        this.tableName,
        this.pageSize,
        this.currentOffset,
        this.currentSort
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          const records = res.resource || [];
          if (records.length > 0) {
            this.columns = Object.keys(records[0]);
          }
          this.dataSource.data = records;
          this.totalRecords = res.meta?.count ?? records.length;
          this.loading = false;
        },
        error: err => {
          this.error =
            err?.error?.error?.message || 'Failed to load table data';
          this.loading = false;
        },
      });
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.currentOffset = event.pageIndex * event.pageSize;
    this.loadData();
  }

  onSortChange(sortState: Sort): void {
    if (sortState.direction) {
      this.currentSort = `${sortState.active} ${sortState.direction.toUpperCase()}`;
    } else {
      this.currentSort = undefined;
    }
    this.pageIndex = 0;
    this.currentOffset = 0;
    this.loadData();
  }

  formatCellValue(value: any): string {
    if (value === null || value === undefined) return 'NULL';
    if (typeof value === 'object') return JSON.stringify(value);
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    const str = String(value);
    return str.length > 200 ? str.substring(0, 200) + '...' : str;
  }
}
