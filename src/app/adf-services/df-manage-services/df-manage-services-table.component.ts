import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Component, Inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoService } from '@ngneat/transloco';
import { SERVICES_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';
import { DfBaseCrudService } from 'src/app/shared/services/df-base-crud.service';
import {
  DfManageTableComponent,
  DfManageTableModules,
} from 'src/app/shared/components/df-manage-table/df-manage-table.component';
import { GenericListResponse } from 'src/app/shared/types/generic-http.type';
import { Service, ServiceRow, ServiceType } from 'src/app/shared/types/service';
import { getFilterQuery } from 'src/app/shared/utilities/filter-queries';
import { UntilDestroy } from '@ngneat/until-destroy';
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-manage-services-table',
  templateUrl:
    '../../shared/components/df-manage-table/df-manage-table.component.html',
  styleUrls: [
    '../../shared/components/df-manage-table/df-manage-table.component.scss',
  ],
  standalone: true,
  imports: DfManageTableModules,
})
export class DfManageServicesTableComponent extends DfManageTableComponent<ServiceRow> {
  serviceTypes: Array<ServiceType> = [];
  system = false;
  constructor(
    router: Router,
    activatedRoute: ActivatedRoute,
    liveAnnouncer: LiveAnnouncer,
    translateService: TranslocoService,
    @Inject(SERVICES_SERVICE_TOKEN)
    private serviceService: DfBaseCrudService,
    dialog: MatDialog
  ) {
    super(router, activatedRoute, liveAnnouncer, translateService, dialog);
    this._activatedRoute.data.subscribe(({ system, data }) => {
      this.serviceTypes = data.serviceTypes;
      this.system = system;
      this.allowCreate = !system;
      if (system) {
        this.actions = {
          default: this.actions.default,
          additional:
            this.actions.additional?.filter(
              action => action.label !== 'delete'
            ) ?? null,
        };
      }
    });
  }
  override columns = [
    {
      columnDef: 'active',
      cell: (row: ServiceRow) => row.active,
      header: 'active',
    },
    {
      columnDef: 'name',
      cell: (row: ServiceRow) => row.name,
      header: 'name',
    },
    {
      columnDef: 'label',
      cell: (row: ServiceRow) => row.label,
      header: 'label',
    },
    {
      columnDef: 'description',
      cell: (row: ServiceRow) => row.description,
      header: 'description',
    },
    {
      columnDef: 'actions',
    },
  ];

  override mapDataToTable(data: any[]): ServiceRow[] {
    return data.map(service => {
      return {
        id: service.id,
        name: service.name,
        label: service.label,
        description: service.description,
        active: service.isActive,
        deletable: service.deletable,
        type: service.type,
      };
    });
  }

  filterQuery = getFilterQuery('services');

  override deleteRow(row: ServiceRow): void {
    this.serviceService
      .delete(row.id, { snackbarSuccess: 'admins.alerts.deleteSuccess' })
      .subscribe(() => {
        this.refreshTable();
      });
  }

  refreshTable(
    limit?: number | undefined,
    offset?: number | undefined,
    filter?: string | undefined
  ): void {
    if (this.serviceTypes && this.serviceTypes.length !== 0) {
      filter = `${filter ? `${filter} and ` : ''}(type in ("${this.serviceTypes
        .map(src => src.name)
        .join('","')}"))`;
    }
    filter = `${filter ? `${filter} and ` : ''}(created_by_id is${
      !this.system ? ' not ' : ' '
    }null)`;

    this.serviceService
      .getAll<GenericListResponse<Service>>({
        limit,
        offset,
        filter,
      })
      .subscribe(data => {
        this.dataSource.data = this.mapDataToTable(data.resource);
        this.tableLength = data.meta.count;
      });
  }
}
