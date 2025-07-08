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
import { GenericListResponse } from 'src/app/shared/types/generic-http';
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
      columnDef: 'type',
      cell: (row: ServiceRow) => row.type,
      header: 'type',
    },
    {
      columnDef: 'scripting',
      cell: (row: ServiceRow) => row.scripting,
      header: 'Scripting',
    },
    {
      columnDef: 'actions',
    },
  ];

  override mapDataToTable(data: any[]): ServiceRow[] {
    // Skip event scripts request if we're only looking at API Types
    const isApiTypesOnly =
      this.serviceTypes.length === 1 &&
      this.serviceTypes[0].name === 'api_type';

    // Map the data without checking event scripts for API Types
    return data.map(service => ({
      id: service.id,
      name: service.name,
      label: service.label,
      description: service.description,
      scripting: 'not', // Always set a default value
      active: service.isActive,
      deletable: service.deletable,
      type: service.type,
    }));
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
    filter?: string | undefined,
    refresh?: true
  ): void {
    if (this.serviceTypes && this.serviceTypes.length !== 0) {
      filter = `${
        filter ? `(${filter}) and ` : ''
      }(type in ("${this.serviceTypes.map(src => src.name).join('","')}"))`;
    }

    this.serviceService
      .getAll<GenericListResponse<Service>>({
        limit,
        offset,
        filter,
        refresh,
      })
      .subscribe(data => {
        const mappedData = this.mapDataToTable(data.resource);

        // Only make event scripts request if not viewing API Types
        const isApiTypesOnly =
          this.serviceTypes.length === 1 &&
          this.serviceTypes[0].name === 'api_type';

        if (!isApiTypesOnly) {
          this.serviceService
            .getEventScripts<GenericListResponse<Service>>()
            .subscribe(scriptsData => {
              const scripts = scriptsData.resource;
              mappedData.forEach(service => {
                const match = scripts.find(script =>
                  script.name.includes(service.name)
                );
                service.scripting = match ? match.name : 'not';
              });
              this.dataSource.data = mappedData;
            });
        } else {
          this.dataSource.data = mappedData;
        }
        this.tableLength = data.meta.count;
      });
  }
}
