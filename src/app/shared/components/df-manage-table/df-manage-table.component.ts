import { LiveAnnouncer } from '@angular/cdk/a11y';
import {
  AfterViewInit,
  Component,
  inject,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  MatPaginator,
  MatPaginatorModule,
  PageEvent,
} from '@angular/material/paginator';
import { MatSort, Sort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  EMPTY,
  Observable,
  switchMap,
  map,
} from 'rxjs';
import { ROUTES } from 'src/app/shared/types/routes';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import {
  faTrashCan,
  faPenToSquare,
  faPlus,
  faEllipsisV,
  faTriangleExclamation,
  faCheckCircle,
  faXmarkCircle,
  faRefresh,
} from '@fortawesome/free-solid-svg-icons';
import { TranslocoPipe, TranslocoService } from '@ngneat/transloco';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DfConfirmDialogComponent } from '../df-confirm-dialog/df-confirm-dialog.component';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Actions, AdditonalAction, Column } from 'src/app/shared/types/table';
import { DfThemeService } from 'src/app/shared/services/df-theme.service';
import { DfSystemConfigDataService } from 'src/app/shared/services/df-system-config-data.service';
import { DfBaseCrudService } from 'src/app/shared/services/df-base-crud.service';
import {
  GenericListResponse,
  RequestOptions,
} from 'src/app/shared/types/generic-http';
import { AppError, normalizeError } from 'src/app/shared/utilities/app-error';
import { DfErrorDetailComponent } from '../df-error-detail/df-error-detail.component';
import { DfBadgeComponent } from '../df-badge/df-badge.component';

// Re-export: subclasses consume these through the DfManageTableModules
// array, so they must be exported from this module (NG3004).
export { DfErrorDetailComponent };
export { DfBadgeComponent };

export type TableState = 'loading' | 'loaded' | 'empty' | 'error';

export const DfManageTableModules = [
  NgIf,
  MatButtonModule,
  FontAwesomeModule,
  MatTableModule,
  NgFor,
  MatMenuModule,
  ReactiveFormsModule,
  TranslocoPipe,
  AsyncPipe,
  MatDialogModule,
  MatPaginatorModule,
  MatFormFieldModule,
  MatInputModule,
  MatSortModule,
  MatProgressBarModule,
  DfErrorDetailComponent,
  DfBadgeComponent,
  RouterLink,
];

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-manage-table',
  template: '',
})
export abstract class DfManageTableComponent<T>
  implements OnInit, AfterViewInit
{
  @Input() tableData?: Array<T>;
  dataSource = new MatTableDataSource<T>();
  tableLength = 0;
  pageSizes = [10, 50, 100];
  faTrashCan = faTrashCan;
  faPenToSquare = faPenToSquare;
  faPlus = faPlus;
  faEllipsisV = faEllipsisV;
  faTriangleExclamation = faTriangleExclamation;
  faRefresh = faRefresh;
  allowCreate = true;
  allowFilter = true;
  /**
   * Teaching empty state (punch 15a). When a subclass sets these i18n keys,
   * an empty table renders one line of what-this-is plus a primary CTA
   * instead of the bare "No entries" text. Resolved by the shared template's
   * global transloco scope, so the copy lives in the root en.json under
   * emptyState.<entity>. Left unset, the generic fallback still applies.
   */
  @Input() emptyStateMessage?: string;
  @Input() emptyStateActionLabel?: string;
  currentFilter = new FormControl('');
  schema = false;
  /** Failed fetches render distinctly from "no data" (error panel + Retry). */
  tableState: TableState = 'loaded';
  tableError: AppError | null = null;
  protected currentPageSize = 10;
  private lastFetch: {
    service: DfBaseCrudService;
    options: Partial<RequestOptions>;
  } | null = null;

  abstract columns: Array<Column<T>>;

  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  _activatedRoute = this.activatedRoute;
  _translateService = this.translateService;

  actions: Actions<T> = {
    default: {
      label: 'view',
      function: row => this.viewRow(row),
      ariaLabel: {
        key: 'viewRow',
        param: 'id',
      },
    },
    additional: [
      {
        label: 'delete',
        function: row => this.confirmDelete(row),
        ariaLabel: {
          key: 'deleteRow',
          param: 'id',
        },
        icon: faTrashCan,
      },
    ],
  };
  cacheService: any;

  constructor(
    protected router: Router,
    private activatedRoute: ActivatedRoute,
    private liveAnnouncer: LiveAnnouncer,
    private translateService: TranslocoService,
    public dialog: MatDialog
  ) {}
  themeService = inject(DfThemeService);
  systemConfigDataService = inject(DfSystemConfigDataService);
  isDarkMode = this.themeService.darkMode$;
  isDatabase = false;
  currentPageSize$ = this.themeService.currentTableRowNum$;
  ngOnInit(): void {
    if (!this.tableData) {
      this.activatedRoute.data.subscribe(({ data }) => {
        this.schema = this.router.url.includes('schema');
        if (data && data['__error']) {
          // List resolver failed but completed navigation (emptyListWithError);
          // render the in-table error state instead of a blank shell.
          this.tableError = data['__error'];
          this.tableState = 'error';
          this.dataSource.data = [];
          this.tableLength = 0;
          return;
        }
        if (data && data.resource) {
          this.dataSource.data = this.mapDataToTable(data.resource);
          this.dataSource.paginator = this.paginator;
        }
        if (data && data.meta) {
          this.tableLength = data.meta.count;
        }
        this.tableError = null;
        this.tableState = this.dataSource.data.length ? 'loaded' : 'empty';
      });
    } else {
      this.allowFilter = false;
      this.dataSource.data = this.mapDataToTable(this.tableData);
      this.tableState = this.dataSource.data.length ? 'loaded' : 'empty';
    }
    this.currentPageSize$.subscribe(currentPageSize => {
      this.currentPageSize = currentPageSize;
    });
    // Single subscription: this used to be nested inside currentPageSize$,
    // which multiplied fetches (and error states) per page-size emission.
    this.currentFilter.valueChanges
      .pipe(debounceTime(1000), distinctUntilChanged())
      .subscribe(filter => {
        filter
          ? this.refreshTable(this.currentPageSize, 0, this.filterQuery(filter))
          : this.refreshTable();
      });

    this.systemConfigDataService.environment$
      .pipe(
        switchMap(env =>
          this.activatedRoute.data.pipe(map(route => ({ env, route })))
        )
      )
      .subscribe(({ env, route }) => {
        if (route['groups'] && route['groups'][0] === 'Database') {
          this.isDatabase = true;
        }
      });
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  activeIcon(active: boolean): IconProp {
    return active ? faCheckCircle : faXmarkCircle;
  }

  // Presentational only (Meridian table spec 1.7): flags id / foreign-key /
  // hash / count columns so the template can apply the global .df-numeric
  // utility (tabular figures) and right-align them. No behavior change; pure
  // class binding keyed off the column name.
  private static readonly NUMERIC_COLUMNS = new Set([
    'id',
    'apiKey',
    'maxAge',
    'rate',
    'counter',
  ]);
  isNumericColumn(columnDef: string): boolean {
    return (
      DfManageTableComponent.NUMERIC_COLUMNS.has(columnDef) ||
      columnDef.endsWith('Id')
    );
  }

  isCellActive(
    cellValue: string | number | boolean | null | undefined
  ): boolean {
    if (typeof cellValue === 'boolean') {
      return cellValue;
    }
    if (typeof cellValue === 'string') {
      return cellValue.toLowerCase() === 'true';
    }
    return !!cellValue;
  }

  // Memoized on the columns array reference: mat-table re-diffs its column
  // defs whenever *matHeaderRowDef receives a new array, so returning a fresh
  // .map() per CD cycle forced a re-diff on every tick of every list screen.
  private _displayedColumns: string[] = [];
  private _displayedColumnsSource?: Array<Column<T>>;
  get displayedColumns() {
    if (this._displayedColumnsSource !== this.columns) {
      this._displayedColumnsSource = this.columns;
      this._displayedColumns = this.columns.map(c => c.columnDef);
    }
    return this._displayedColumns;
  }

  // get defaultPageSize() {
  //   let currentPageSize = 10;
  //   this.storageService.setCurrentPage$.subscribe(num => {
  //     currentPageSize = num;
  //   });
  //   return currentPageSize;
  //   // return this.pageSizes[0];
  // }

  goEventScriptsPage(url: string) {
    if (url !== 'not') {
      this.router.navigate([
        ROUTES.API_CONNECTIONS + '/' + ROUTES.EVENT_SCRIPTS + '/' + url,
      ]);
    }
  }

  isActionDisabled(action: AdditonalAction<T>, row: T): boolean {
    if (!action.disabled) {
      return false;
    }
    return typeof action.disabled === 'function'
      ? action.disabled(row)
      : action.disabled;
  }

  handleKeyDown(event: KeyboardEvent, row: T) {
    if (event.key === 'Enter') {
      this.callDefaultAction(row);
    }
  }

  callDefaultAction(row: T) {
    if (
      this.actions.default &&
      (!this.actions.default.disabled ||
        (this.actions.default.disabled && !this.actions.default.disabled(row)))
    ) {
      this.actions.default.function(row);
    }
  }

  abstract mapDataToTable(data: Array<any>): Array<T>;

  abstract refreshTable(
    limit?: number,
    offset?: number,
    filter?: string,
    refresh?: true
  ): void;

  abstract filterQuery(value: string): string;

  /**
   * Single fetch path with the loading/loaded/empty/error state machine.
   * Subclass refreshTable() implementations become one call to this:
   *   this.fetchTable(this.service, { limit, offset, filter });
   * In-table state only: no global spinner, no toast (toast-off); a failure
   * renders the error panel with Retry instead.
   */
  protected fetchTable(
    service: DfBaseCrudService,
    options: Partial<RequestOptions> = {}
  ): void {
    this.lastFetch = { service, options };
    this.tableState = 'loading';
    this.tableError = null;
    service
      .getAll<GenericListResponse<any>>({
        showSpinner: false,
        errorHandling: 'toast-off',
        ...options,
      })
      .pipe(
        catchError(err => {
          this.tableError = normalizeError(err);
          this.tableState = 'error';
          return EMPTY;
        })
      )
      .subscribe(data => {
        this.dataSource.data = this.mapDataToTable(data.resource ?? []);
        this.tableLength = data.meta?.count ?? this.dataSource.data.length;
        this.tableState = this.dataSource.data.length ? 'loaded' : 'empty';
      });
  }

  retryLastFetch(): void {
    if (this.lastFetch) {
      this.fetchTable(this.lastFetch.service, this.lastFetch.options);
      return;
    }
    // ponytail: subclasses not yet migrated onto fetchTable() refresh without
    // reporting state back; clear the panel optimistically so a successful
    // retry doesn't leave a stale error. The sweep migrates every subclass
    // refreshTable onto fetchTable, then this fallback tightens up.
    this.tableError = null;
    this.tableState = 'loaded';
    this.refreshTable();
  }

  clearFilter(): void {
    this.currentFilter.setValue('');
  }

  confirmDelete(row: T): void {
    const dialogRef = this.dialog.open(DfConfirmDialogComponent, {
      data: {
        title: 'confirm',
        message: 'confirmDelete',
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteRow(row);
      }
    });
  }

  deleteRow(row: T): void {
    //intentionally left blank
  }

  changePage(event: PageEvent): void {
    this.themeService.setCurrentTableRowNum(event.pageSize);
    // if (event.previousPageIndex !== event.pageIndex) {
    //   this.refreshTable(undefined, event.pageIndex * event.pageSize);
    // } else {
    //   this.currentPageSize = event.pageSize;
    //   this.refreshTable(event.pageSize);
    // }
  }

  createRow(): void {
    this.router.navigate([ROUTES.CREATE], { relativeTo: this._activatedRoute });
  }

  viewRow(row: T): void {
    this.router.navigate([(row as any).id], {
      relativeTo: this._activatedRoute,
    });
  }

  announceSortChange(sortState: any) {
    if (sortState.direction) {
      this.liveAnnouncer.announce(
        this.translateService.translate(
          `${sortState.direction === 'asc' ? 'sortAsc' : 'sortDesc'}`
        )
      );
    } else {
      this.liveAnnouncer.announce(
        this.translateService.translate('sortCleared')
      );
    }
  }

  // Cached per header: returning a new selectTranslate observable each CD
  // cycle made the async pipe unsubscribe/resubscribe every tick, and each
  // re-emission scheduled another CD pass (subscription-in-getter pattern).
  private sortDescriptions = new Map<string, Observable<string>>();
  sortDescription(header: string) {
    let description$ = this.sortDescriptions.get(header);
    if (!description$) {
      description$ = this.translateService.selectTranslate('sortDescription', {
        header,
      });
      this.sortDescriptions.set(header, description$);
    }
    return description$;
  }

  isClickable(row: T) {
    return (
      this.actions.default &&
      ((this.actions.default.disabled && !this.actions.default.disabled(row)) ||
        !this.actions.default.disabled)
    );
  }

  refreshSchema() {
    this.refreshTable(undefined, undefined, undefined, true);
  }
}
