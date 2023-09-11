import { LiveAnnouncer } from '@angular/cdk/a11y';
import { SelectionModel } from '@angular/cdk/collections';
import {
  AfterViewInit,
  Component,
  ContentChild,
  Input,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ROUTES } from 'src/app/core/constants/routes';
import { DfBreakpointService } from 'src/app/core/services/df-breakpoint.service';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import {
  faTrashCan,
  faPenToSquare,
  faPlus,
  faEllipsisV,
  faTriangleExclamation,
  faCheckCircle,
  faXmarkCircle,
} from '@fortawesome/free-solid-svg-icons';
import { TranslocoService } from '@ngneat/transloco';
import { MatDialog } from '@angular/material/dialog';
import { DfConfirmDialogComponent } from '../df-confirm-dialog/df-confirm-dialog.component';

@Component({
  selector: 'df-manage-table',
  template: '',
})
export abstract class DfManageTableComponent<T>
  implements OnInit, AfterViewInit, OnDestroy
{
  @Input() tableData?: Array<T>;
  @ContentChild('itemActions') itemActions: TemplateRef<any>;
  destroyed$ = new Subject<void>();
  dataSource = new MatTableDataSource<T>();
  selection = new SelectionModel<T>(true, []);
  tableLength = 0;
  pageSizes = [10, 50, 100];
  currentPageSize = this.defaultPageSize;
  isSmallScreen = this.breakpointService.isSmallScreen;
  faTrashCan = faTrashCan;
  faPenToSquare = faPenToSquare;
  faPlus = faPlus;
  faEllipsisV = faEllipsisV;
  faTriangleExclamation = faTriangleExclamation;
  allowCreate = true;
  allowFilter = true;
  readOnly = false;
  allowDelete = true;

  abstract columns: Array<{
    columnDef: string;
    cell?: (element: T) => any;
    header?: string;
  }>;
  @ViewChild(MatSort) sort: MatSort;
  _activatedRoute = this.activatedRoute;
  _translateService = this.translateService;

  constructor(
    protected router: Router,
    private activatedRoute: ActivatedRoute,
    private liveAnnouncer: LiveAnnouncer,
    private breakpointService: DfBreakpointService,
    private translateService: TranslocoService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    if (!this.tableData) {
      this.activatedRoute.data
        .pipe(takeUntil(this.destroyed$))
        .subscribe(({ data }) => {
          if (data.resource) {
            this.dataSource.data = this.mapDataToTable(data.resource);
          }
          if (data.meta) {
            this.tableLength = data.meta.count;
          }
        });
    } else {
      this.allowFilter = false;
      this.dataSource.data = this.mapDataToTable(this.tableData);
    }
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
  }

  activeIcon(active: boolean): IconProp {
    return active ? faCheckCircle : faXmarkCircle;
  }

  get displayedColumns() {
    return this.columns.map(c => c.columnDef);
  }

  get defaultPageSize() {
    return this.pageSizes[0];
  }

  abstract mapDataToTable(data: Array<any>): Array<T>;

  abstract refreshTable(limit?: number, offset?: number, filter?: string): void;

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
    if (event.previousPageIndex !== event.pageIndex) {
      this.refreshTable(this.currentPageSize, event.pageIndex * event.pageSize);
    } else {
      this.currentPageSize = event.pageSize;
      this.refreshTable(event.pageSize);
    }
  }

  createRow(): void {
    this.router.navigate([ROUTES.CREATE], { relativeTo: this._activatedRoute });
  }

  editRow(row: T): void {
    this.router.navigate([ROUTES.EDIT, (row as any).id], {
      relativeTo: this._activatedRoute,
    });
  }

  viewRow(row: T): void {
    this.router.navigate([ROUTES.VIEW, (row as any).name], {
      relativeTo: this._activatedRoute,
    });
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  viewLabel(row: T) {
    return this.translateService.selectTranslate('viewRow', {
      id: (row as any).id,
    });
  }

  toggleAllRows() {
    this.isAllSelected()
      ? this.selection.clear()
      : this.selection.select(...this.dataSource.data);
  }

  checkboxLabel(row?: T) {
    if (!row) {
      return this.translateService.selectTranslate(
        `${this.isAllSelected() ? 'deselectAll' : 'selectAll'}`
      );
    }
    return this.translateService.selectTranslate(
      `${this.selection.isSelected(row) ? 'deselect' : 'select'}`,
      { id: (row as any).id }
    );
  }

  deleteLabel(row: T) {
    return this.translateService.selectTranslate('deleteRow', {
      id: (row as any).id,
    });
  }

  editLabel(row: T) {
    return this.translateService.selectTranslate('editRow', {
      id: (row as any).id,
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

  triggerSearch(event: Event) {
    const filter = (event.target as HTMLInputElement).value;
    filter
      ? this.refreshTable(this.currentPageSize, 0, this.filterQuery(filter))
      : this.refreshTable();
  }

  sortDescription(header: string) {
    return this.translateService.selectTranslate('sortDescription', {
      header,
    });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
