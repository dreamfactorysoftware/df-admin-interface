import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subject, catchError, map, takeUntil, tap, throwError } from 'rxjs';
import {
  GroupDeleteServiceResponse,
  ServiceDataService,
  SystemServiceDataResponse,
} from 'src/app/core/services/service-data.service';
import { faTrash, faCheck } from '@fortawesome/free-solid-svg-icons';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { SelectionModel } from '@angular/cdk/collections';
import { ActivatedRoute } from '@angular/router';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { AlertType } from 'src/app/shared/components/df-alert/df-alert.component';

type ServiceTableData = {
  id: number;
  name: string;
  label: string;
  description: string;
  type: string;
  active: boolean;
  deletable: boolean;
};

@Component({
  selector: 'df-manage-services',
  templateUrl: './manage-services.component.html',
  styleUrls: ['./manage-services.component.scss'],
})
export class DfManageServicesComponent implements OnInit, OnDestroy {
  private destroyed$ = new Subject<void>();

  displayedColumns: string[] = [
    'select',
    'id',
    'name',
    'label',
    'description',
    'type',
    'active',
    'deletable',
  ];
  dataSource: MatTableDataSource<ServiceTableData>;
  data: ServiceTableData[];
  selection = new SelectionModel<ServiceTableData>(true, []);

  systemServiceData: SystemServiceDataResponse | null;

  faTrash = faTrash;
  faCheck = faCheck;

  alertMsg: string;
  showAlert: boolean;
  alertType: AlertType = 'success';

  isGroupDeleteIconVisible: boolean;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private serviceDataService: ServiceDataService,
    private activatedRoute: ActivatedRoute
  ) {
    this.alertMsg = '';
    this.showAlert = false;
  }

  ngOnInit(): void {
    // TODO: change all network calls in this component to have activated route
    //this.activatedRoute.data
    this.serviceDataService.systemServiceData$
      .pipe(takeUntil(this.destroyed$))
      .subscribe(data => {
        this.systemServiceData = data as SystemServiceDataResponse;
        this.data = this.systemServiceData.resource.map(val => {
          return {
            id: val.id,
            name: val.name,
            label: val.label,
            description: val.description,
            type: val.type,
            active: val.isActive,
            deletable: val.deletable,
          };
        });
        this.dataSource = new MatTableDataSource(this.data);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    if (!this.dataSource) return false;
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  toggleAllRows() {
    if (this.isAllSelected()) {
      this.isGroupDeleteIconVisible = false;
      this.selection.clear();
      return;
    }

    this.isGroupDeleteIconVisible = true;
    this.selection.select(...this.dataSource.data);
  }

  onCheckboxSelect(event: MatCheckboxChange, row: ServiceTableData) {
    if (event) {
      const toggle = this.selection.toggle(row);
      this.isGroupDeleteIconVisible = this.selection.selected.length > 1;
      return toggle;
    }

    return null;
  }

  /** The label for the checkbox on the passed row */
  checkboxLabel(row?: ServiceTableData): string {
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

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  onRowClick(row: ServiceTableData): void {
    row;
  }

  onDelete(row: number) {
    return this.serviceDataService
      .deleteServiceData(row)
      .pipe(
        catchError(err => {
          this.alertMsg = 'Error occurred with delete service';
          return throwError(() => new Error(err));
        })
      )
      .subscribe(data => {
        if (data.id) {
          this.alertMsg = 'Service successfully deleted';
          this.showAlert = true;
        }
      });
  }

  onMassDelete() {
    const rows = this.selection.selected
      .filter(val => {
        return val.deletable;
      })
      .map(val => val.id);

    return this.serviceDataService
      .deleteMultipleServiceData(rows)
      .pipe(
        catchError(err => {
          this.alertMsg = 'Error occurred with delete service';
          this.alertType = 'error';
          this.showAlert = true;
          return throwError(() => new Error(err));
        })
      )
      .subscribe((data: GroupDeleteServiceResponse) => {
        if (data.resource.length) {
          this.alertMsg = 'Service successfully deleted';
          this.showAlert = true;
          this.alertType = 'success';
        }
      });
  }
}
