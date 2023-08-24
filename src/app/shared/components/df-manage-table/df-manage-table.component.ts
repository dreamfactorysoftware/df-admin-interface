import { LiveAnnouncer } from '@angular/cdk/a11y';
import { SelectionModel } from '@angular/cdk/collections';
import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { ROUTES } from 'src/app/core/constants/routes';
import { DfBreakpointService } from 'src/app/core/services/df-breakpoint.service';
import {
  faCheckCircle,
  faXmarkCircle,
  faPlus,
  faEllipsisV,
} from '@fortawesome/free-solid-svg-icons';
import { faTrashCan, faPenToSquare } from '@fortawesome/free-regular-svg-icons';
import { IconProp } from '@fortawesome/fontawesome-svg-core';

@Component({
  selector: 'df-manage-table',
  template: '',
})
export abstract class DfManageTableComponent<T>
  implements OnInit, AfterViewInit, OnDestroy
{
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
  allowCreate = true;

  columns: Array<{
    columnDef: string;
    cell?: (element: T) => any;
    header?: string;
  }> = [];
  @ViewChild(MatSort) sort: MatSort;
  _activatedRoute = this.activatedRoute;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private liveAnnouncer: LiveAnnouncer,
    private breakpointService: DfBreakpointService,
    private translateService: TranslateService
  ) {}

  ngOnInit(): void {
    this.activatedRoute.data
      .pipe(takeUntil(this.destroyed$))
      .subscribe(({ data }) => {
        this.dataSource.data = this.mapDataToTable(data.resource);
        this.tableLength = data.meta.count;
      });
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

  abstract mapDataToTable(data: Array<T>): Array<T>;

  abstract refreshTable(limit?: number, offset?: number, filter?: string): void;

  abstract filterQuery(value: string): string;

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

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  toggleAllRows() {
    this.isAllSelected()
      ? this.selection.clear()
      : this.selection.select(...this.dataSource.data);
  }

  checkboxLabel(row?: T): string {
    if (!row) {
      return this.translateService.instant(
        this.isAllSelected() ? 'deselectAll' : 'selectAll'
      );
    }
    return this.translateService.instant(
      this.selection.isSelected(row) ? 'deselect' : 'select',
      { id: (row as any).id }
    );
  }

  deleteLabel(row: T): string {
    return this.translateService.instant('deleteRow', { id: (row as any).id });
  }

  editLabel(row: T): string {
    return this.translateService.instant('editRow', { id: (row as any).id });
  }

  announceSortChange(sortState: any) {
    if (sortState.direction) {
      this.liveAnnouncer.announce(
        this.translateService.instant(
          sortState.direction === 'asc' ? 'sortAsc' : 'sortDesc'
        )
      );
    } else {
      this.liveAnnouncer.announce(this.translateService.instant('sortCleared'));
    }
  }

  triggerSearch(event: Event) {
    const filter = (event.target as HTMLInputElement).value;
    filter
      ? this.refreshTable(this.currentPageSize, 0, this.filterQuery(filter))
      : this.refreshTable();
  }

  sortDescription(header: string) {
    return this.translateService.instant('sortDescription', { header });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
