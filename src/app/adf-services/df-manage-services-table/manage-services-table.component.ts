import { DFManageTableComponent } from 'src/app/shared/components/df-manage-table/df-manage-table.component';
import { ServiceTableData } from '../df-manage-services/manage-services.component';
import { takeUntil } from 'rxjs';
import {
  ServiceDataService,
  SystemServiceData,
} from '../services/service-data.service';
import { ROUTES } from 'src/app/core/constants/routes';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { DfBreakpointService } from 'src/app/core/services/df-breakpoint.service';
import { Component } from '@angular/core';

@Component({
  selector: 'df-manage-services-table',
  templateUrl:
    '../../shared/components/df-manage-table/df-manage-table.component.html',
  styleUrls: [
    '../../shared/components/df-manage-table/df-manage-table.component.scss',
  ],
})
export class DfManageServicesTableComponent extends DFManageTableComponent<ServiceTableData> {
  override columns = [
    {
      columnDef: 'id',
      cell: (row: ServiceTableData) => row.id,
      header: 'ID',
    },
    {
      columnDef: 'name',
      cell: (row: ServiceTableData) => row.name,
      header: 'Name',
    },
    {
      columnDef: 'label',
      cell: (row: ServiceTableData) => row.label,
      header: 'Label',
    },
    {
      columnDef: 'description',
      cell: (row: ServiceTableData) => row.description,
      header: 'Description',
    },
    {
      columnDef: 'type',
      cell: (row: ServiceTableData) => row.type,
      header: 'Type',
    },
    {
      columnDef: 'active',
      cell: (row: ServiceTableData) => row.active,
      header: 'Active',
    },
    {
      columnDef: 'actions',
    },
  ];

  _router: Router;

  constructor(
    private serviceDataService: ServiceDataService,
    activatedRoute: ActivatedRoute,
    router: Router,
    breakpointService: DfBreakpointService,
    liveAnnouncer: LiveAnnouncer,
    translateService: TranslateService
  ) {
    super(
      router,
      activatedRoute,
      liveAnnouncer,
      breakpointService,
      translateService
    );

    this._router = router;
  }

  override filterQuery(value: string): string {
    return `(id like "%${value}%") or (name like "%${value}%") or (description like "%${value}%") or (label like "%${value}%") or (type like "%${value}%")`;
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

  refreshTable(limit?: number, offset?: number, filter?: string): void {
    this.serviceDataService
      .getSystemServiceDataList(limit, offset, filter)
      .pipe(takeUntil(this.destroyed$))
      .subscribe(data => {
        this.dataSource.data = this.mapDataToTable(data.resource);
        this.tableLength = data.meta.count;
      });
  }

  onRowClick(row: ServiceTableData): void {
    const url = ROUTES.EDIT_SERVICES + `/${row.id}`;
    this._router.navigate([url]);
  }

  onDelete() {
    this.deleteRow(this.selection.selected[0].id);
  }

  override deleteRow(row: any): void {
    this.serviceDataService
      .deleteServiceData(row)
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => {
        this.refreshTable();
      });
  }
}
