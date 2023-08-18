import { Component } from '@angular/core';
import { takeUntil } from 'rxjs';
import { faTrash, faCheck } from '@fortawesome/free-solid-svg-icons';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { AlertType } from 'src/app/shared/components/df-alert/df-alert.component';
import { TranslateService } from '@ngx-translate/core';
import {
  ServiceDataService,
  SystemServiceData,
} from '../services/service-data.service';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { DFManageTableComponent } from 'src/app/shared/components/df-manage-table/df-manage-table.component';

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
export class DfManageServicesComponent extends DFManageTableComponent<ServiceTableData> {
  override columns = [
    {
      columnDef: 'select',
    },
    {
      columnDef: 'id',
      cell: (row: ServiceTableData) => `${row.id}`,
      header: 'id',
      sortActionDescription: 'id',
    },
    {
      columnDef: 'name',
      cell: (row: ServiceTableData) => `${row.name}`,
      header: 'name',
      sortActionDescription: 'name',
    },
    {
      columnDef: 'label',
      cell: (row: ServiceTableData) => `${row.label}`,
      header: 'label',
      sortActionDescription: 'label',
    },
    {
      columnDef: 'description',
      cell: (row: ServiceTableData) => `${row.description}`,
      header: 'description',
      sortActionDescription: 'description',
    },
    {
      columnDef: 'type',
      cell: (row: ServiceTableData) => `${row.type}`,
      header: 'type',
      sortActionDescription: 'type',
    },
    {
      columnDef: 'active',
      cell: (row: ServiceTableData) => `${row.active}`,
      header: 'active',
      sortActionDescription: 'active',
    },
    {
      columnDef: 'deletable',
      cell: (row: ServiceTableData) => `${row.deletable}`,
      header: 'deletable',
      sortActionDescription: 'deletable',
    },
  ];

  faTrash = faTrash;
  faCheck = faCheck;

  // TODO: marked for removal
  alertMsg: string;
  showAlert: boolean;
  alertType: AlertType = 'success';

  isGroupDeleteIconVisible: boolean;

  constructor(
    private serviceDataService: ServiceDataService,
    private translateService: TranslateService,
    activatedRoute: ActivatedRoute,
    router: Router,
    liveAnnouncer: LiveAnnouncer
  ) {
    super(router, activatedRoute, liveAnnouncer);
  }

  onCheckboxSelect(event: MatCheckboxChange, row: ServiceTableData) {
    if (event) {
      const toggle = this.selection.toggle(row);
      this.isGroupDeleteIconVisible = this.selection.selected.length > 1;
      return toggle;
    }

    return null;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  mapDataToTable(data: any): ServiceTableData[] {
    return data.map((val: SystemServiceData) => {
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
  }

  refreshTable(limit?: number, offset?: number): void {
    this.serviceDataService
      .getSystemServiceData(limit, offset)
      .pipe(takeUntil(this.destroyed$))
      .subscribe(data => {
        this.dataSource.data = this.mapDataToTable(data.resource);
        this.tableLength = data.meta.count;
      });
  }

  onRowClick(row: ServiceTableData): void {
    row;
  }

  deleteRow(row: any): void {
    this.serviceDataService
      .deleteServiceData(row)
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => {
        this.refreshTable();
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
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => {
        this.refreshTable();
      });
  }
}
