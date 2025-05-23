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
import { ActivatedRoute, Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, switchMap, map } from 'rxjs';
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
import { UntilDestroy } from '@ngneat/until-destroy';
import { Actions, AdditonalAction, Column } from 'src/app/shared/types/table';
import { DfThemeService } from 'src/app/shared/services/df-theme.service';
import { DfSystemConfigDataService } from 'src/app/shared/services/df-system-config-data.service';

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
  currentFilter = new FormControl('');
  schema = false;

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
        if (data && data.resource) {
          this.dataSource.data = this.mapDataToTable(data.resource);
          this.dataSource.paginator = this.paginator;
        }
        if (data && data.meta) {
          this.tableLength = data.meta.count;
        }
      });
    } else {
      this.allowFilter = false;
      this.dataSource.data = this.mapDataToTable(this.tableData);
    }
    this.currentPageSize$.subscribe(currentPageSize => {
      this.currentFilter.valueChanges
        .pipe(debounceTime(1000), distinctUntilChanged())
        .subscribe(filter => {
          filter
            ? this.refreshTable(currentPageSize, 0, this.filterQuery(filter))
            : this.refreshTable();
        });
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

  get displayedColumns() {
    return this.columns.map(c => c.columnDef);
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

  sortDescription(header: string) {
    return this.translateService.selectTranslate('sortDescription', {
      header,
    });
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
