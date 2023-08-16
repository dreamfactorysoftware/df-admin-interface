import { SelectionModel } from '@angular/cdk/collections';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

import { DfAppsService } from '../services/df-apps.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { faTrash, faCheck, faPlus } from '@fortawesome/free-solid-svg-icons';
import { MatSort } from '@angular/material/sort';
import { TranslateService } from '@ngx-translate/core';
import { AppType, AppRow } from '../types/df-apps.types';

@Component({
  selector: 'df-df-manage-apps',
  templateUrl: './df-manage-apps.component.html',
  styleUrls: ['./df-manage-apps.component.scss'],
})
export class DfManageAppsComponent implements OnInit {
  private destroyed$ = new Subject<void>();

  displayedColumns: string[] = ['select', 'id', 'name', 'role', 'apiKey'];
  dataSource = new MatTableDataSource<AppRow>();
  data: AppRow[];
  selection = new SelectionModel<AppRow>(true, []);

  resultsLength = 0;
  pageIndex = 0;

  faTrash = faTrash;
  faCheck = faCheck;
  faPlus = faPlus;

  isGroupDeleteIconVisible: boolean;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private dfAppsService: DfAppsService,
    private activatedRoute: ActivatedRoute,
    private translateService: TranslateService
  ) {}

  ngOnInit(): void {
    /**
     * todo:
     * update pagniator length, pageIndex
     * paginator length = Response.meta.count
     * pageinator pageIndex = offset / limit
     */
    this.activatedRoute.data
      .pipe(takeUntil(this.destroyed$))
      .subscribe((data: any) => {
        console.log(data);
        this.resultsLength = data.data.meta.count;
        this.data = this.mapDataToTable(data.data.resource);
        this.dataSource = new MatTableDataSource(this.data);
        console.log('this.data', this.data);
      });
  }

  mapDataToTable(appTypes: AppType[]): AppRow[] {
    console.log('mapDataToTable', appTypes);
    return appTypes.map((appType: AppType) => {
      return {
        id: appType.id,
        name: appType.name,
        role: appType.roleByRoleId?.description || '',
        apiKey: appType.apiKey,
        description: appType.description,
        active: appType.isActive,
      };
    });
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  toggleAllRows() {
    console.log('toggleAllRows');
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }

    this.selection.select(...this.dataSource.data);
  }

  /** The label for the checkbox on the passed row */
  checkboxLabel(row?: AppRow): string {
    if (!row) {
      return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    }

    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${
      row.id + 1
    }`;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  changePage(event: PageEvent): void {
    console.log(event);
  }

  openCreateAppDialog() {
    // show create app screen
  }

  // POST /api/v2/system/app

  // DELETE /api/v1/apps/{id}
  // show confirmation dialog before deleting

  // edit view same as create view but with API key

  onMassDelete() {
    console.log('mass delete', this.selection.selected);
  }
}
