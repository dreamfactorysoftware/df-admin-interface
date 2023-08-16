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
import { Subject, takeUntil } from 'rxjs';

@Component({
  template: '',
})
export abstract class DFManageTableComponent<T>
  implements OnInit, AfterViewInit, OnDestroy
{
  destroyed$ = new Subject<void>();
  dataSource = new MatTableDataSource<T>();
  selection = new SelectionModel<T>(true, []);
  tableLength = 0;
  columns: Array<{
    columnDef: string;
    cell?: (element: T) => string;
    header?: string;
    sortActionDescription?: string;
  }> = [];
  @ViewChild(MatSort) sort: MatSort;
  _activatedRoute = this.activatedRoute;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private liveAnnouncer: LiveAnnouncer
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

  get displayedColumns() {
    return this.columns.map(c => c.columnDef);
  }

  abstract mapDataToTable(data: any): Array<T>;

  abstract refreshTable(limit?: number, offset?: number): void;

  changePage(event: PageEvent): void {
    if (event.previousPageIndex !== event.pageIndex) {
      this.refreshTable(event.pageSize, event.pageIndex * event.pageSize);
    } else {
      this.refreshTable(event.pageSize);
    }
  }

  editRow(row: T): void {
    this.router.navigate(['edit', (row as any).id], {
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
      return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${
      (row as any).id
    }`;
  }

  announceSortChange(sortState: any) {
    if (sortState.direction) {
      this.liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this.liveAnnouncer.announce('Sorting cleared');
    }
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
