import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
  AfterViewInit,
  ChangeDetectorRef,
} from '@angular/core';
import { NgIf, NgFor, NgClass, JsonPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort, Sort } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { TranslocoModule } from '@ngneat/transloco';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faTable, faLock, faFilter, faCode } from '@fortawesome/free-solid-svg-icons';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import {
  DataExplorerService,
  TableSchemaResponse,
  FieldInfo,
} from './services/data-explorer.service';
import { DfSchemaInfoComponent } from './df-schema-info.component';
import { DfRowDetailComponent } from './df-row-detail.component';

interface FilterOp {
  value: string;
  label: string;
}

interface ColumnFilter {
  op: string;
  value: string;
}

@Component({
  selector: 'df-data-grid',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    NgClass,
    JsonPipe,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatToolbarModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MatBadgeModule,
    MatMenuModule,
    MatCheckboxModule,
    MatSelectModule,
    TranslocoModule,
    FontAwesomeModule,
    DfSchemaInfoComponent,
    DfRowDetailComponent,
  ],
  template: `
    <div class="data-grid-container" *transloco="let t; scope: 'dataExplorer'">
      <div class="grid-main">
        <!-- Toolbar -->
        <div class="grid-toolbar">
          <div class="toolbar-left">
            <fa-icon [icon]="faTable" class="toolbar-icon"></fa-icon>
            <span class="table-title">{{ tableName }}</span>
            <mat-chip-set class="readonly-chip">
              <mat-chip disabled matTooltip="Data Explorer is currently read-only. Use the API call to build write operations.">
                <fa-icon [icon]="faLock" class="lock-icon"></fa-icon>
                {{ t('dataExplorer.readOnly') }}
              </mat-chip>
            </mat-chip-set>
          </div>
          <div class="toolbar-right">
            <!-- Quick search -->
            <div class="quick-search" *ngIf="!initialLoading && columns.length > 0"
              matTooltip="Search within the current page of results. Filters rows client-side across all visible columns.">
              <mat-icon class="search-icon">search</mat-icon>
              <input class="search-input"
                [placeholder]="t('dataExplorer.quickSearch')"
                [value]="quickSearchTerm"
                (input)="onQuickSearch($event)">
              <button *ngIf="quickSearchTerm" class="search-clear" (click)="clearQuickSearch()">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <!-- Filter count badge -->
            <button mat-icon-button
              *ngIf="activeFilterCount > 0"
              (click)="clearAllFilters()"
              [matTooltip]="t('dataExplorer.clearFilters')"
              class="clear-filters-btn">
              <mat-icon [matBadge]="activeFilterCount" matBadgeColor="accent" matBadgeSize="small">filter_list_off</mat-icon>
            </button>

            <!-- Show API call -->
            <button mat-icon-button
              (click)="showApiCall = !showApiCall"
              matTooltip="Show the DreamFactory REST API call that matches your current view. Copy it to use in your own apps."
              [class.active]="showApiCall">
              <mat-icon>code</mat-icon>
            </button>

            <!-- Column visibility -->
            <button mat-icon-button [matMenuTriggerFor]="columnMenu" matTooltip="Show or hide columns in the grid">
              <mat-icon>view_column</mat-icon>
            </button>
            <mat-menu #columnMenu="matMenu" class="column-menu">
              <div *ngFor="let col of allColumns" class="column-menu-item" (click)="$event.stopPropagation()">
                <mat-checkbox
                  [checked]="!hiddenColumns.has(col)"
                  (change)="toggleColumn(col)">
                  {{ col }}
                </mat-checkbox>
              </div>
            </mat-menu>

            <!-- Schema info toggle -->
            <button mat-icon-button
              (click)="toggleSchemaPanel()"
              matTooltip="View column types, primary keys, foreign keys, and table relationships"
              [class.active]="showSchemaPanel">
              <mat-icon>info_outline</mat-icon>
            </button>
          </div>
        </div>

        <!-- Navigation filter indicator -->
        <div class="nav-filter-bar" *ngIf="navigationFilter">
          <mat-icon class="nav-filter-icon">link</mat-icon>
          <span class="nav-filter-text">Filtered via foreign key: <code>{{ navigationFilter }}</code></span>
          <button mat-icon-button class="nav-filter-clear" (click)="clearNavigationFilter()" matTooltip="Remove navigation filter and show all records">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <!-- Top pagination bar -->
        <div class="top-pagination" *ngIf="!initialLoading && !error && columns.length > 0">
          <div class="top-pagination-left">
            <span class="page-info" *ngIf="totalRecords > 0"
              matTooltip="Records {{ currentOffset + 1 }} through {{ currentOffset + dataSource.data.length }} out of {{ totalRecords }} total. Use the per-column filters below the headers for server-side filtering.">
              {{ currentOffset + 1 }}–{{ currentOffset + dataSource.data.length }}
              of {{ totalRecords }} records
            </span>
          </div>
          <div class="top-pagination-right">
            <label class="page-size-label">Rows:
              <select class="page-size-select" [value]="pageSize" (change)="onPageSizeChange($event)">
                <option *ngFor="let size of pageSizeOptions" [value]="size">{{ size }}</option>
              </select>
            </label>
            <div class="page-nav">
              <button mat-icon-button (click)="goToFirstPage()" [disabled]="pageIndex === 0" matTooltip="First page">
                <mat-icon>first_page</mat-icon>
              </button>
              <button mat-icon-button (click)="goToPrevPage()" [disabled]="pageIndex === 0" matTooltip="Previous page">
                <mat-icon>chevron_left</mat-icon>
              </button>
              <span class="page-label">{{ pageIndex + 1 }} / {{ totalPages }}</span>
              <button mat-icon-button (click)="goToNextPage()" [disabled]="isLastPage()" matTooltip="Next page">
                <mat-icon>chevron_right</mat-icon>
              </button>
              <button mat-icon-button (click)="goToLastPage()" [disabled]="isLastPage()" matTooltip="Last page">
                <mat-icon>last_page</mat-icon>
              </button>
            </div>
          </div>
        </div>

        <!-- API Call bar -->
        <div class="api-call-bar" *ngIf="showApiCall && !initialLoading && columns.length > 0">
          <div class="api-call-desc">
            This is the DreamFactory REST API call equivalent to your current view.
            Any sorting or column filters you apply will update the URL in real time.
            Click the URL or the copy button to copy it to your clipboard.
          </div>
          <div class="api-call-top">
            <span class="api-method" matTooltip="HTTP method — GET retrieves records without modifying data">GET</span>
            <code class="api-url" (click)="copyApiUrl()" matTooltip="Click to copy this URL">{{ buildApiUrl() }}</code>
            <button mat-icon-button class="copy-btn" (click)="copyApiUrl()" matTooltip="Copy URL to clipboard">
              <mat-icon>{{ apiCopied ? 'check' : 'content_copy' }}</mat-icon>
            </button>
          </div>
          <div class="api-call-options">
            <span class="options-label">Include:</span>
            <label class="api-option" matTooltip="limit — Maximum number of records to return per request (currently {{ pageSize }})">
              <input type="checkbox" [checked]="apiIncludeLimit" (change)="apiIncludeLimit = !apiIncludeLimit">
              limit
            </label>
            <label class="api-option" matTooltip="offset — Number of records to skip, used for pagination (currently {{ currentOffset }})">
              <input type="checkbox" [checked]="apiIncludeOffset" (change)="apiIncludeOffset = !apiIncludeOffset">
              offset
            </label>
            <label class="api-option" matTooltip="include_count — Returns total record count in the response metadata">
              <input type="checkbox" [checked]="apiIncludeCount" (change)="apiIncludeCount = !apiIncludeCount">
              include_count
            </label>
          </div>
          <div class="api-call-related" *ngIf="cachedSchema?.related?.length">
            <span class="options-label">Related:</span>
            <label class="api-option" *ngFor="let rel of cachedSchema!.related"
              [matTooltip]="rel.type + ' — Include ' + rel.refTable + ' records linked via ' + rel.field + ' → ' + rel.refField">
              <input type="checkbox" [checked]="apiSelectedRelated[rel.name]"
                (change)="apiSelectedRelated[rel.name] = !apiSelectedRelated[rel.name]">
              {{ rel.name }}
            </label>
          </div>
        </div>

        <!-- Loading (initial only) -->
        <div class="loading-state" *ngIf="initialLoading">
          <mat-spinner diameter="40"></mat-spinner>
          <span>{{ t('dataExplorer.loadingData') }}</span>
        </div>

        <!-- Error -->
        <div class="error-state" *ngIf="error && !initialLoading">
          <mat-icon color="warn">error_outline</mat-icon>
          <span>{{ error }}</span>
          <button mat-stroked-button color="primary" (click)="loadData()">
            {{ t('dataExplorer.retry') }}
          </button>
        </div>

        <!-- Empty -->
        <div class="empty-state" *ngIf="!initialLoading && !error && dataSource.data.length === 0 && allColumns.length === 0">
          <mat-icon>inbox</mat-icon>
          <span>{{ t('dataExplorer.noData') }}</span>
          <small>{{ t('dataExplorer.noDataHint') }}</small>
        </div>

        <!-- Data Table -->
        <div class="table-wrapper" *ngIf="!initialLoading && !error && columns.length > 0" [class.is-loading]="loading">
          <div class="table-scroll">
            <table mat-table [dataSource]="dataSource" matSort (matSortChange)="onSortChange($event)" class="data-table">
              <ng-container *ngFor="let col of columns" [matColumnDef]="col">
                <th mat-header-cell *matHeaderCellDef mat-sort-header class="header-cell"
                  [style.width.px]="columnWidths[col]"
                  [style.min-width.px]="columnWidths[col]"
                  [style.max-width.px]="columnWidths[col]">
                  <mat-icon *ngIf="isPrimaryKey(col)" class="pk-icon" matTooltip="Primary Key">vpn_key</mat-icon>
                  {{ col }}
                  <span class="resize-handle" (mousedown)="onResizeStart($event, col)"></span>
                </th>
                <td mat-cell *matCellDef="let row" class="data-cell"
                  [style.width.px]="columnWidths[col]"
                  [style.min-width.px]="columnWidths[col]"
                  [style.max-width.px]="columnWidths[col]"
                  [class.null-cell]="row[col] === null || row[col] === undefined"
                  [class.fk-cell]="isForeignKey(col) && row[col] != null">
                  <span *ngIf="isForeignKey(col) && row[col] != null"
                    class="fk-link"
                    (click)="onFkClick($event, col, row[col])"
                    [matTooltip]="'Go to ' + getFkRefTable(col)">
                    {{ formatCellValue(row[col]) }}
                    <mat-icon class="fk-nav-icon">open_in_new</mat-icon>
                  </span>
                  <ng-container *ngIf="!(isForeignKey(col) && row[col] != null)">
                    {{ formatCellValue(row[col]) }}
                  </ng-container>
                </td>
              </ng-container>

              <!-- Filter row columns -->
              <ng-container *ngFor="let col of columns" [matColumnDef]="'filter_' + col">
                <th mat-header-cell *matHeaderCellDef class="filter-cell"
                  [style.width.px]="columnWidths[col]"
                  [style.min-width.px]="columnWidths[col]"
                  [style.max-width.px]="columnWidths[col]">
                  <div class="filter-group">
                    <select class="filter-op"
                      [value]="getFilterOp(col)"
                      (change)="onFilterOpChange(col, $event)">
                      <option *ngFor="let op of getOperatorsForColumn(col)" [value]="op.value">{{ op.label }}</option>
                    </select>
                    <input *ngIf="!isNullOp(getFilterOp(col))" class="filter-input"
                      [placeholder]="t('dataExplorer.filterPlaceholder')"
                      [value]="getFilterValue(col)"
                      (input)="onFilterInput(col, $event)">
                  </div>
                </th>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="columns; sticky: true"></tr>
              <tr mat-header-row *matHeaderRowDef="filterColumns; sticky: true" class="filter-row"></tr>
              <tr mat-row *matRowDef="let row; columns: columns;"
                (click)="onRowClick(row)"
                [class.selected-row]="row === selectedRow"
                class="clickable-row"
                matTooltip="Click to view full record details"
                [matTooltipShowDelay]="800"></tr>
            </table>
          </div>
        </div>

        <!-- Footer status bar -->
        <div class="grid-footer" *ngIf="!initialLoading && !error && columns.length > 0">
          <span class="footer-info" matTooltip="Total records matching current server-side filters">
            {{ totalRecords }} records
            <ng-container *ngIf="activeFilterCount > 0"> (filtered)</ng-container>
          </span>
          <span class="footer-info" matTooltip="Use the column visibility button to show/hide columns">{{ columns.length }} of {{ allColumns.length }} columns</span>
          <div class="footer-right">
            <span class="page-info-footer" *ngIf="totalRecords > 0">
              Page {{ pageIndex + 1 }} of {{ totalPages }}
            </span>
            <div class="page-nav-footer">
              <button mat-icon-button (click)="goToFirstPage()" [disabled]="pageIndex === 0" class="footer-btn">
                <mat-icon>first_page</mat-icon>
              </button>
              <button mat-icon-button (click)="goToPrevPage()" [disabled]="pageIndex === 0" class="footer-btn">
                <mat-icon>chevron_left</mat-icon>
              </button>
              <button mat-icon-button (click)="goToNextPage()" [disabled]="isLastPage()" class="footer-btn">
                <mat-icon>chevron_right</mat-icon>
              </button>
              <button mat-icon-button (click)="goToLastPage()" [disabled]="isLastPage()" class="footer-btn">
                <mat-icon>last_page</mat-icon>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Schema Info Side Panel -->
      <df-schema-info
        *ngIf="showSchemaPanel"
        [serviceName]="serviceName"
        [tableName]="tableName"
        (closeClicked)="showSchemaPanel = false"
        (navigateToTable)="tableNavigated.emit({ tableName: $event })">
      </df-schema-info>

      <!-- Record Detail Side Panel -->
      <df-row-detail
        *ngIf="selectedRow"
        [row]="selectedRow"
        [schema]="cachedSchema"
        (closeClicked)="selectedRow = null"
        (navigateToTable)="tableNavigated.emit({ tableName: $event })">
      </df-row-detail>
    </div>
  `,
  styles: [
    `
      :host {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .data-grid-container {
        flex: 1;
        display: flex;
        flex-direction: row;
        overflow: hidden;
      }

      .grid-main {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .grid-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 12px;
        height: 49px;
        box-sizing: border-box;
        border-bottom: 1px solid #e0e0e0;
        background: #fafafa;
        flex-shrink: 0;

        .toolbar-left {
          display: flex;
          align-items: center;
          gap: 10px;

          .toolbar-icon {
            color: #7b1fa2;
            font-size: 16px;
          }

          .table-title {
            font-size: 15px;
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
          display: flex;
          align-items: center;
          gap: 2px;

          button.active {
            color: #7b1fa2;
          }

          .clear-filters-btn {
            color: #ef6c00;
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
        .toolbar-right {
          button.active { color: #ce93d8; }
        }
      }

      /* Column visibility menu */
      .column-menu-item {
        padding: 4px 16px;
        font-size: 13px;
      }

      /* Top pagination bar */
      .top-pagination {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 2px 12px;
        border-bottom: 1px solid #e0e0e0;
        background: #fafafa;
        flex-shrink: 0;
        font-size: 12px;
        color: #757575;

        .top-pagination-left {
          .page-info { white-space: nowrap; }
        }

        .top-pagination-right {
          display: flex;
          align-items: center;
          gap: 8px;

          .page-size-label {
            font-size: 12px;
            display: flex;
            align-items: center;
            gap: 4px;

            .page-size-select {
              border: 1px solid #e0e0e0;
              border-radius: 4px;
              padding: 2px 4px;
              font-size: 12px;
              background: white;
              color: #424242;
              outline: none;
              cursor: pointer;
            }
          }

          .page-nav {
            display: flex;
            align-items: center;
            gap: 0;

            .page-label {
              font-size: 12px;
              padding: 0 6px;
              white-space: nowrap;
            }

            button {
              width: 28px;
              height: 28px;
              line-height: 28px;
              mat-icon { font-size: 18px; }
            }
          }
        }
      }

      :host-context(.dark-theme) .top-pagination {
        border-bottom-color: #424242;
        background: #303030;
        color: #9e9e9e;
        .page-size-select {
          background: #2c2c2c !important;
          border-color: #424242 !important;
          color: #e0e0e0 !important;
        }
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
        min-height: 0;
        overflow: hidden;
        position: relative;

        &.is-loading::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, transparent, #7b1fa2, transparent);
          animation: loading-bar 1s infinite;
          z-index: 10;
        }
      }

      @keyframes loading-bar {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }

      .table-scroll {
        height: 100%;
        overflow: scroll;

        /* Fat always-visible scrollbars */
        &::-webkit-scrollbar {
          width: 14px;
          height: 14px;
        }
        &::-webkit-scrollbar-track {
          background: #e8e8e8;
        }
        &::-webkit-scrollbar-thumb {
          background: #a0a0a0;
          border-radius: 7px;
          border: 2px solid #e8e8e8;
          &:hover {
            background: #808080;
          }
          &:active {
            background: #666;
          }
        }
        &::-webkit-scrollbar-corner {
          background: #e8e8e8;
        }

        scrollbar-width: auto;
        scrollbar-color: #a0a0a0 #e8e8e8;
      }

      :host-context(.dark-theme) .table-scroll {
        &::-webkit-scrollbar-track { background: #252525; }
        &::-webkit-scrollbar-thumb {
          background: #555;
          border-color: #252525;
          &:hover { background: #6a6a6a; }
          &:active { background: #7a7a7a; }
        }
        &::-webkit-scrollbar-corner { background: #252525; }
        scrollbar-color: #555 #252525;
      }

      .data-table {
        width: max-content;
        min-width: 100%;

        .header-cell {
          position: relative;
          flex: none;
          font-weight: 600;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #616161;
          background: #f5f5f5;
          white-space: nowrap;
          padding: 0 16px;
          border-right: 1px solid #e0e0e0;
          box-sizing: border-box;

          .resize-handle {
            position: absolute;
            right: -7px;
            top: 0;
            bottom: 0;
            width: 13px;
            cursor: col-resize;
            z-index: 10;
            // Thin visible line centered on column border
            &::after {
              content: '';
              position: absolute;
              left: 50%;
              transform: translateX(-50%);
              top: 20%;
              bottom: 20%;
              width: 2px;
              border-radius: 1px;
              background: transparent;
              transition: background 0.15s;
            }
            &:hover::after {
              background: #7b1fa2;
            }
            &:hover {
              background: rgba(123, 31, 162, 0.08);
            }
          }
        }

        .filter-cell {
          flex: none;
          padding: 4px 8px;
          background: #f5f5f5;
          border-right: 1px solid #e0e0e0;
          overflow: hidden;
          box-sizing: border-box;

          .filter-group {
            display: flex;
            gap: 4px;
            align-items: center;
          }

          .filter-op {
            flex-shrink: 0;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
            padding: 3px 4px;
            font-size: 11px;
            background: white;
            color: #424242;
            outline: none;
            cursor: pointer;
            max-width: 90px;

            &:focus {
              border-color: #7b1fa2;
            }
          }

          .filter-input {
            flex: 1;
            min-width: 0;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
            padding: 4px 8px;
            font-size: 12px;
            background: white;
            outline: none;
            box-sizing: border-box;

            &:focus {
              border-color: #7b1fa2;
            }

            &::placeholder {
              color: #bdbdbd;
              font-style: italic;
            }
          }
        }

        .data-cell {
          flex: none;
          font-size: 13px;
          padding: 0 16px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          border-right: 1px solid #f0f0f0;
          font-family: 'Roboto Mono', monospace;
          box-sizing: border-box;

          &.null-cell {
            color: #bdbdbd;
            font-style: italic;
          }
        }

        tr.mat-mdc-row:hover {
          background: rgba(123, 31, 162, 0.04);
        }

        tr.mat-mdc-row {
          height: 36px;
        }

        tr.clickable-row {
          cursor: pointer;
        }

        tr.selected-row {
          background: rgba(123, 31, 162, 0.08) !important;
        }

        tr.mat-mdc-header-row {
          height: 40px;
        }

        tr.filter-row {
          height: 36px;
        }
      }

      :host-context(.dark-theme) .data-table {
        .header-cell {
          color: #bdbdbd;
          background: #383838;
          border-right-color: #424242;

          .resize-handle:hover {
            background: rgba(206, 147, 216, 0.1);
          }
          .resize-handle:hover::after {
            background: #ce93d8;
          }
        }
        .filter-cell {
          background: #383838;
          border-right-color: #424242;

          .filter-op {
            background: #2c2c2c;
            border-color: #424242;
            color: #e0e0e0;
            &:focus { border-color: #ce93d8; }
          }

          .filter-input {
            background: #2c2c2c;
            border-color: #424242;
            color: #e0e0e0;
            &:focus { border-color: #ce93d8; }
            &::placeholder { color: #616161; }
          }
        }
        .data-cell {
          border-right-color: #383838;
          color: #e0e0e0;
          &.null-cell { color: #616161; }
        }
        tr.mat-mdc-row:hover {
          background: rgba(206, 147, 216, 0.06);
        }
        tr.selected-row {
          background: rgba(206, 147, 216, 0.12) !important;
        }
      }

      /* Footer status bar */
      .grid-footer {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 4px 12px;
        border-top: 1px solid #e0e0e0;
        background: #f5f5f5;
        flex-shrink: 0;
        font-size: 12px;
        color: #757575;

        .footer-info {
          white-space: nowrap;
        }

        .footer-right {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 8px;

          .page-info-footer {
            white-space: nowrap;
          }

          .page-nav-footer {
            display: flex;
            align-items: center;
            gap: 0;

            .footer-btn {
              width: 26px;
              height: 26px;
              line-height: 26px;
              mat-icon { font-size: 18px; }
            }
          }
        }
      }

      :host-context(.dark-theme) .grid-footer {
        border-top-color: #424242;
        background: #2c2c2c;
        color: #9e9e9e;
      }

      /* Quick search in toolbar */
      .quick-search {
        display: flex;
        align-items: center;
        background: #f5f5f5;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        padding: 0 6px;
        height: 28px;
        gap: 4px;

        .search-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
          color: #9e9e9e;
        }

        .search-input {
          border: none;
          outline: none;
          background: transparent;
          font-size: 12px;
          width: 140px;
          color: #424242;
          &::placeholder { color: #bdbdbd; }
        }

        .search-clear {
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          background: none;
          cursor: pointer;
          padding: 0;
          color: #9e9e9e;
          mat-icon { font-size: 14px; width: 14px; height: 14px; }
          &:hover { color: #616161; }
        }
      }

      :host-context(.dark-theme) .quick-search {
        background: #2c2c2c;
        border-color: #424242;
        .search-input {
          color: #e0e0e0;
          &::placeholder { color: #616161; }
        }
        .search-icon { color: #757575; }
        .search-clear {
          color: #757575;
          &:hover { color: #bdbdbd; }
        }
      }

      /* API call bar */
      .api-call-bar {
        display: flex;
        flex-direction: column;
        padding: 4px 12px;
        border-bottom: 1px solid #e0e0e0;
        background: #f0f4f8;
        flex-shrink: 0;
        font-size: 12px;
        overflow: hidden;
        gap: 2px;

        .api-call-desc {
          font-size: 11px;
          color: #607d8b;
          line-height: 1.4;
          padding: 2px 0;
        }

        .api-call-top {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .api-method {
          flex-shrink: 0;
          font-weight: 700;
          font-size: 11px;
          color: white;
          background: #43a047;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: 'Roboto Mono', monospace;
        }

        .api-url {
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-family: 'Roboto Mono', monospace;
          font-size: 12px;
          color: #37474f;
          cursor: pointer;
          &:hover { color: #1565c0; }
        }

        .copy-btn {
          flex-shrink: 0;
          width: 24px;
          height: 24px;
          line-height: 24px;
          mat-icon { font-size: 16px; }
        }

        .api-call-options,
        .api-call-related {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          padding-left: 2px;

          .options-label {
            font-size: 11px;
            color: #9e9e9e;
            font-weight: 500;
          }

          .api-option {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 11px;
            color: #616161;
            font-family: 'Roboto Mono', monospace;
            cursor: pointer;
            white-space: nowrap;

            input[type="checkbox"] {
              width: 12px;
              height: 12px;
              margin: 0;
              cursor: pointer;
              accent-color: #7b1fa2;
            }
          }
        }
      }

      :host-context(.dark-theme) .api-call-bar {
        background: #1a2332;
        border-bottom-color: #424242;
        .api-call-desc { color: #78909c; }
        .api-url {
          color: #b0bec5;
          &:hover { color: #64b5f6; }
        }
        .api-call-options,
        .api-call-related {
          .options-label { color: #616161; }
          .api-option {
            color: #9e9e9e;
            input[type="checkbox"] { accent-color: #ce93d8; }
          }
        }
      }

      /* PK icon in header */
      .pk-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
        color: #7b1fa2;
        margin-right: 2px;
        vertical-align: middle;
      }

      :host-context(.dark-theme) .pk-icon {
        color: #ce93d8;
      }

      /* FK link cells */
      .fk-cell {
        cursor: pointer !important;
      }

      .fk-link {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        color: #7b1fa2;
        text-decoration: none;
        cursor: pointer;
        transition: color 0.15s;

        &:hover {
          color: #4a148c;
          text-decoration: underline;
        }

        .fk-nav-icon {
          font-size: 12px;
          width: 12px;
          height: 12px;
          opacity: 0;
          transition: opacity 0.15s;
        }

        &:hover .fk-nav-icon {
          opacity: 0.7;
        }
      }

      :host-context(.dark-theme) .fk-link {
        color: #ce93d8;
        &:hover {
          color: #f3e5f5;
        }
      }

      /* Navigation filter bar */
      .nav-filter-bar {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 4px 12px;
        border-bottom: 1px solid #e0e0e0;
        background: #f3e5f5;
        flex-shrink: 0;
        font-size: 12px;
        color: #4a148c;

        .nav-filter-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
          color: #7b1fa2;
        }

        .nav-filter-text {
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;

          code {
            font-family: 'Roboto Mono', monospace;
            font-size: 11px;
            background: rgba(123, 31, 162, 0.1);
            padding: 1px 4px;
            border-radius: 3px;
          }
        }

        .nav-filter-clear {
          flex-shrink: 0;
          width: 24px;
          height: 24px;
          line-height: 24px;
          color: #7b1fa2;
          mat-icon { font-size: 16px; }
        }
      }

      :host-context(.dark-theme) .nav-filter-bar {
        background: #2d1b3d;
        border-bottom-color: #424242;
        color: #e1bee7;

        .nav-filter-icon { color: #ce93d8; }
        .nav-filter-text code {
          background: rgba(206, 147, 216, 0.15);
        }
        .nav-filter-clear { color: #ce93d8; }
      }

      /* Quick search highlight */
      .search-no-match {
        display: none !important;
      }
    `,
  ],
})
export class DfDataGridComponent implements OnChanges, OnDestroy, AfterViewInit {
  @Input() serviceName = '';
  @Input() tableName = '';
  @Input() initialFilter: string | undefined;
  @Output() tableNavigated = new EventEmitter<{ tableName: string; filter?: string }>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(DfSchemaInfoComponent) schemaInfoComponent?: DfSchemaInfoComponent;

  dataSource = new MatTableDataSource<any>([]);
  allColumns: string[] = [];
  columns: string[] = [];
  filterColumns: string[] = [];
  hiddenColumns = new Set<string>();
  totalRecords = 0;
  pageSize = 50;
  pageSizeOptions = [25, 50, 100, 250, 500];
  pageIndex = 0;
  currentOffset = 0;
  loading = false;
  initialLoading = false;
  error: string | null = null;
  currentSort: string | undefined;

  // Filter state
  columnFilters: Record<string, ColumnFilter> = {};
  activeFilterCount = 0;
  private filterSubject$ = new Subject<void>();

  // Column resize state
  columnWidths: Record<string, number> = {};
  private resizeRafId = 0;

  // Panel state
  showSchemaPanel = false;
  showApiCall = false;
  apiCopied = false;
  apiIncludeLimit = true;
  apiIncludeOffset = true;
  apiIncludeCount = true;
  apiSelectedRelated: Record<string, boolean> = {};
  selectedRow: Record<string, any> | null = null;
  cachedSchema: TableSchemaResponse | null = null;

  // Navigation filter (from FK click)
  navigationFilter: string | null = null;

  // Quick search
  quickSearchTerm = '';

  faTable = faTable;
  faLock = faLock;
  faFilter = faFilter;
  faCode = faCode;

  private destroy$ = new Subject<void>();

  // Operator sets by column type
  private readonly textOperators: FilterOp[] = [
    { value: 'contains', label: 'contains' },
    { value: 'eq', label: '=' },
    { value: 'neq', label: '≠' },
    { value: 'starts', label: 'starts with' },
    { value: 'ends', label: 'ends with' },
    { value: 'is_null', label: 'is null' },
    { value: 'is_not_null', label: 'is not null' },
  ];

  private readonly numericOperators: FilterOp[] = [
    { value: 'eq', label: '=' },
    { value: 'neq', label: '≠' },
    { value: 'gt', label: '>' },
    { value: 'lt', label: '<' },
    { value: 'gte', label: '≥' },
    { value: 'lte', label: '≤' },
    { value: 'is_null', label: 'is null' },
    { value: 'is_not_null', label: 'is not null' },
  ];

  private readonly dateOperators: FilterOp[] = [
    { value: 'eq', label: '=' },
    { value: 'neq', label: '≠' },
    { value: 'gt', label: 'after' },
    { value: 'lt', label: 'before' },
    { value: 'gte', label: 'on/after' },
    { value: 'lte', label: 'on/before' },
    { value: 'is_null', label: 'is null' },
    { value: 'is_not_null', label: 'is not null' },
  ];

  private readonly booleanOperators: FilterOp[] = [
    { value: 'eq', label: '=' },
    { value: 'is_null', label: 'is null' },
    { value: 'is_not_null', label: 'is not null' },
  ];

  constructor(
    private dataExplorerService: DataExplorerService,
    private cdr: ChangeDetectorRef
  ) {
    this.filterSubject$
      .pipe(debounceTime(500), takeUntil(this.destroy$))
      .subscribe(() => {
        this.pageIndex = 0;
        this.currentOffset = 0;
        this.loadData();
      });
  }

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
    cancelAnimationFrame(this.resizeRafId);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalRecords / this.pageSize));
  }

  resetAndLoad(): void {
    this.allColumns = [];
    this.columns = [];
    this.filterColumns = [];
    this.hiddenColumns = new Set<string>();
    this.dataSource.data = [];
    this.totalRecords = 0;
    this.pageIndex = 0;
    this.currentOffset = 0;
    this.currentSort = undefined;
    this.columnFilters = {};
    this.activeFilterCount = 0;
    this.selectedRow = null;
    this.cachedSchema = null;
    this.columnWidths = {};
    this.navigationFilter = this.initialFilter || null;
    this.initialLoading = true;
    this.loadData();
    this.loadSchemaForTable();
  }

  loadSchemaForTable(): void {
    if (!this.serviceName || !this.tableName) return;
    this.dataExplorerService
      .getTableSchema(this.serviceName, this.tableName)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: schema => {
          this.cachedSchema = schema;
          this.apiSelectedRelated = {};
          // Force mat-table to re-render cells so FK/PK indicators and type-aware filters appear
          this.dataSource.data = [...this.dataSource.data];
          this.cdr.detectChanges();
        },
        error: () => {},
      });
  }

  loadData(): void {
    if (!this.serviceName || !this.tableName) return;

    this.loading = true;
    this.error = null;

    const colFilter = this.buildFilterString();
    const filterParts = [this.navigationFilter, colFilter].filter(Boolean);
    const combinedFilter = filterParts.join(' AND ') || undefined;

    this.dataExplorerService
      .getTableData(
        this.serviceName,
        this.tableName,
        this.pageSize,
        this.currentOffset,
        this.currentSort,
        combinedFilter
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          const records = res.resource || [];
          if (records.length > 0 && this.allColumns.length === 0) {
            this.allColumns = Object.keys(records[0]);
            this.updateVisibleColumns();
            // Initialize default column widths
            for (const col of this.allColumns) {
              this.columnWidths[col] = 150;
            }
          }
          this.dataSource.data = records;
          this.totalRecords = res.meta?.count ?? records.length;
          this.loading = false;
          this.initialLoading = false;
        },
        error: err => {
          this.error =
            err?.error?.error?.message || 'Failed to load table data';
          this.loading = false;
          this.initialLoading = false;
        },
      });
  }

  // --- Column visibility ---

  toggleColumn(col: string): void {
    if (this.hiddenColumns.has(col)) {
      this.hiddenColumns.delete(col);
    } else {
      // Don't allow hiding all columns
      if (this.columns.length > 1) {
        this.hiddenColumns.add(col);
      }
    }
    this.updateVisibleColumns();
  }

  private updateVisibleColumns(): void {
    this.columns = this.allColumns.filter(c => !this.hiddenColumns.has(c));
    this.filterColumns = this.columns.map(c => 'filter_' + c);
  }

  // --- Pagination ---

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.currentOffset = event.pageIndex * event.pageSize;
    this.loadData();
  }

  onPageSizeChange(event: Event): void {
    this.pageSize = Number((event.target as HTMLSelectElement).value);
    this.pageIndex = 0;
    this.currentOffset = 0;
    this.loadData();
  }

  goToFirstPage(): void {
    this.pageIndex = 0;
    this.currentOffset = 0;
    this.loadData();
  }

  goToPrevPage(): void {
    if (this.pageIndex > 0) {
      this.pageIndex--;
      this.currentOffset = this.pageIndex * this.pageSize;
      this.loadData();
    }
  }

  goToNextPage(): void {
    if (!this.isLastPage()) {
      this.pageIndex++;
      this.currentOffset = this.pageIndex * this.pageSize;
      this.loadData();
    }
  }

  goToLastPage(): void {
    this.pageIndex = Math.max(0, Math.ceil(this.totalRecords / this.pageSize) - 1);
    this.currentOffset = this.pageIndex * this.pageSize;
    this.loadData();
  }

  isLastPage(): boolean {
    return this.currentOffset + this.pageSize >= this.totalRecords;
  }

  onSortChange(sortState: Sort): void {
    if (sortState.direction) {
      // The column ID from the JSON response may be camelCased, but the DB
      // needs the real column name. Use schema to map back if available.
      const dbCol = this.getDbColumnName(sortState.active);
      this.currentSort = `${dbCol} ${sortState.direction.toUpperCase()}`;
    } else {
      this.currentSort = undefined;
    }
    this.pageIndex = 0;
    this.currentOffset = 0;
    this.loadData();
  }

  /** Find schema FieldInfo for a JSON response key, handling camelCase vs snake_case */
  private getFieldInfo(jsonKey: string): FieldInfo | null {
    if (!this.cachedSchema?.field) return null;
    // Try exact match first
    const exact = this.cachedSchema.field.find(f => f.name === jsonKey);
    if (exact) return exact;
    // Try case-insensitive match (camelCase vs snake_case)
    const lower = jsonKey.toLowerCase();
    return this.cachedSchema.field.find(
      f => f.name.toLowerCase().replace(/_/g, '') === lower
    ) || null;
  }

  /** Map a JSON response key back to the actual DB column name via schema */
  private getDbColumnName(jsonKey: string): string {
    return this.getFieldInfo(jsonKey)?.name ?? jsonKey;
  }

  // --- Column resize ---

  onResizeStart(event: MouseEvent, col: string): void {
    event.stopPropagation();
    event.preventDefault();

    const startX = event.pageX;
    const startWidth = this.columnWidths[col] || 150;

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = (e: MouseEvent) => {
      cancelAnimationFrame(this.resizeRafId);
      this.resizeRafId = requestAnimationFrame(() => {
        const diff = e.pageX - startX;
        this.columnWidths[col] = Math.max(60, startWidth + diff);
        this.cdr.detectChanges();
      });
    };

    const onMouseUp = () => {
      cancelAnimationFrame(this.resizeRafId);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      this.cdr.detectChanges();
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  // --- Filter operator logic ---

  getOperatorsForColumn(col: string): FilterOp[] {
    const fieldInfo = this.getFieldInfo(col);
    if (!fieldInfo) return this.textOperators;
    const type = (fieldInfo.type || fieldInfo.dbType).toLowerCase();
    if (this.isNumericType(type)) return this.numericOperators;
    if (this.isDateType(type)) return this.dateOperators;
    if (this.isBooleanType(type)) return this.booleanOperators;
    return this.textOperators;
  }

  getFilterOp(col: string): string {
    return this.columnFilters[col]?.op || this.getDefaultOp(col);
  }

  getFilterValue(col: string): string {
    return this.columnFilters[col]?.value || '';
  }

  getDefaultOp(col: string): string {
    const ops = this.getOperatorsForColumn(col);
    return ops[0].value;
  }

  isNullOp(op: string): boolean {
    return op === 'is_null' || op === 'is_not_null';
  }

  onFilterOpChange(col: string, event: Event): void {
    const op = (event.target as HTMLSelectElement).value;
    const existingValue = this.columnFilters[col]?.value || '';
    this.columnFilters[col] = { op, value: existingValue };

    if (this.isNullOp(op)) {
      // Null ops are complete filters — trigger immediately
      this.columnFilters[col] = { op, value: '' };
      this.updateActiveFilterCount();
      this.filterSubject$.next();
    } else if (existingValue) {
      // Op changed with existing value — re-filter
      this.updateActiveFilterCount();
      this.filterSubject$.next();
    } else {
      // Op changed but no value yet — keep entry so op persists
      this.updateActiveFilterCount();
    }
  }

  onFilterInput(col: string, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    const currentOp = this.columnFilters[col]?.op || this.getDefaultOp(col);
    if (value) {
      this.columnFilters[col] = { op: currentOp, value };
    } else {
      // Keep the op selection even when value is cleared
      this.columnFilters[col] = { op: currentOp, value: '' };
    }
    this.updateActiveFilterCount();
    this.filterSubject$.next();
  }

  clearAllFilters(): void {
    this.columnFilters = {};
    this.activeFilterCount = 0;
    this.pageIndex = 0;
    this.currentOffset = 0;
    this.loadData();
  }

  private updateActiveFilterCount(): void {
    this.activeFilterCount = Object.keys(this.columnFilters).filter(k => {
      const f = this.columnFilters[k];
      return f.value || this.isNullOp(f.op);
    }).length;
  }

  buildFilterString(): string {
    const parts: string[] = [];
    for (const [col, filter] of Object.entries(this.columnFilters)) {
      const { op, value } = filter;
      // Skip entries that have no value and aren't null-type ops
      if (!value && !this.isNullOp(op)) continue;

      // Use the real DB column name for the API filter
      const dbCol = this.getDbColumnName(col);

      if (op === 'is_null') {
        parts.push(`(${dbCol} IS NULL)`);
        continue;
      }
      if (op === 'is_not_null') {
        parts.push(`(${dbCol} IS NOT NULL)`);
        continue;
      }
      if (!value) continue;

      if (op === 'contains') {
        const escaped = value.replace(/'/g, "''");
        parts.push(`(${dbCol} like '%${escaped}%')`);
      } else if (op === 'starts') {
        const escaped = value.replace(/'/g, "''");
        parts.push(`(${dbCol} like '${escaped}%')`);
      } else if (op === 'ends') {
        const escaped = value.replace(/'/g, "''");
        parts.push(`(${dbCol} like '%${escaped}')`);
      } else {
        const opMap: Record<string, string> = {
          eq: '=', neq: '!=', gt: '>', lt: '<', gte: '>=', lte: '<=',
        };
        const sqlOp = opMap[op] || '=';
        const fieldInfo = this.getFieldInfo(col);
        const type = (fieldInfo?.type || fieldInfo?.dbType || '').toLowerCase();
        if (this.isNumericType(type) && !isNaN(Number(value))) {
          parts.push(`(${dbCol} ${sqlOp} ${value})`);
        } else {
          const escaped = value.replace(/'/g, "''");
          parts.push(`(${dbCol} ${sqlOp} '${escaped}')`);
        }
      }
    }
    return parts.join(' AND ');
  }

  private isNumericType(type: string): boolean {
    const numericTypes = [
      'integer', 'int', 'smallint', 'bigint', 'tinyint',
      'float', 'double', 'decimal', 'numeric', 'real',
      'serial', 'bigserial', 'int2', 'int4', 'int8',
      'float4', 'float8', 'money',
    ];
    return numericTypes.some(t => type.toLowerCase().includes(t));
  }

  private isDateType(type: string): boolean {
    const dateTypes = [
      'date', 'datetime', 'timestamp', 'time',
      'timestamptz', 'timetz',
    ];
    return dateTypes.some(t => type.toLowerCase().includes(t));
  }

  private isBooleanType(type: string): boolean {
    const boolTypes = ['boolean', 'bool', 'bit'];
    return boolTypes.some(t => type.toLowerCase().includes(t));
  }

  onRowClick(row: Record<string, any>): void {
    if (this.selectedRow === row) {
      this.selectedRow = null;
    } else {
      this.selectedRow = row;
    }
  }

  toggleSchemaPanel(): void {
    this.showSchemaPanel = !this.showSchemaPanel;
  }

  // --- Primary key detection ---

  isPrimaryKey(col: string): boolean {
    const fi = this.getFieldInfo(col);
    return fi?.isPrimaryKey ?? false;
  }

  isForeignKey(col: string): boolean {
    const fi = this.getFieldInfo(col);
    return fi?.isForeignKey ?? false;
  }

  getFkRefTable(col: string): string {
    const fi = this.getFieldInfo(col);
    return fi?.refTable || '';
  }

  onFkClick(event: MouseEvent, col: string, value: any): void {
    event.stopPropagation(); // Don't trigger row click
    const fi = this.getFieldInfo(col);
    if (!fi?.refTable || !fi?.refField) return;

    const isNumeric = this.isNumericType((fi.type || fi.dbType).toLowerCase());
    const filterValue = isNumeric ? `(${fi.refField} = ${value})` : `(${fi.refField} = '${String(value).replace(/'/g, "''")}')`;

    this.tableNavigated.emit({
      tableName: fi.refTable,
      filter: filterValue,
    });
  }

  clearNavigationFilter(): void {
    this.navigationFilter = null;
    this.pageIndex = 0;
    this.currentOffset = 0;
    this.loadData();
  }

  // --- API URL builder ---

  buildApiUrl(): string {
    const base = `${window.location.origin}/api/v2/${this.serviceName}/_table/${this.tableName}`;
    const params = new URLSearchParams();
    if (this.apiIncludeLimit) {
      params.set('limit', this.pageSize.toString());
    }
    if (this.apiIncludeOffset) {
      params.set('offset', this.currentOffset.toString());
    }
    if (this.apiIncludeCount) {
      params.set('include_count', 'true');
    }
    if (this.currentSort) {
      params.set('order', this.currentSort);
    }
    const colFilter = this.buildFilterString();
    const apiFilterParts = [this.navigationFilter, colFilter].filter(Boolean);
    const apiFilter = apiFilterParts.join(' AND ');
    if (apiFilter) {
      params.set('filter', apiFilter);
    }
    const relatedNames = Object.entries(this.apiSelectedRelated)
      .filter(([_, v]) => v)
      .map(([k]) => k);
    if (relatedNames.length > 0) {
      params.set('related', relatedNames.join(','));
    }
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  }

  copyApiUrl(): void {
    const url = this.buildApiUrl();
    navigator.clipboard.writeText(url).then(() => {
      this.apiCopied = true;
      setTimeout(() => (this.apiCopied = false), 2000);
    });
  }

  // --- Quick search (client-side) ---

  onQuickSearch(event: Event): void {
    this.quickSearchTerm = (event.target as HTMLInputElement).value;
    this.applyQuickSearch();
  }

  clearQuickSearch(): void {
    this.quickSearchTerm = '';
    this.applyQuickSearch();
  }

  private applyQuickSearch(): void {
    if (!this.quickSearchTerm) {
      this.dataSource.filter = '';
    } else {
      this.dataSource.filter = this.quickSearchTerm.trim().toLowerCase();
    }
    this.dataSource.filterPredicate = (row: Record<string, any>, filter: string) => {
      return this.columns.some(col => {
        const val = row[col];
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(filter);
      });
    };
  }

  formatCellValue(value: any): string {
    if (value === null || value === undefined) return 'NULL';
    if (typeof value === 'object') return JSON.stringify(value);
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    const str = String(value);
    return str.length > 200 ? str.substring(0, 200) + '...' : str;
  }
}
