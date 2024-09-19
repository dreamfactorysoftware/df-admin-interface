import { Component, Inject } from '@angular/core';
import {
  DfManageTableComponent,
  DfManageTableModules,
} from '../../shared/components/df-manage-table/df-manage-table.component';
import { MatDialog } from '@angular/material/dialog';
import { TranslocoService } from '@ngneat/transloco';
import { DatabaseRowData } from '../../shared/types/schema';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Router, ActivatedRoute } from '@angular/router';
import { Service, ServiceType } from '../../shared/types/service';
import { getFilterQuery } from 'src/app/shared/utilities/filter-queries';
import { UntilDestroy } from '@ngneat/until-destroy';
import {
  BASE_SERVICE_TOKEN,
  SERVICES_SERVICE_TOKEN,
  SERVICE_TYPE_SERVICE_TOKEN,
} from 'src/app/shared/constants/tokens';
import { DfBaseCrudService } from 'src/app/shared/services/df-base-crud.service';
import { GenericListResponse } from 'src/app/shared/types/generic-http';
import { forkJoin, map, switchMap } from 'rxjs';
import { Actions } from 'src/app/shared/types/table';
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-manage-databases-table',
  templateUrl:
    '../../shared/components/df-manage-table/df-manage-table.component.html',
  styleUrls: [
    '../../shared/components/df-manage-table/df-manage-table.component.scss',
  ],
  standalone: true,
  imports: DfManageTableModules,
})
export class DfManageDatabasesTableComponent extends DfManageTableComponent<DatabaseRowData> {
  constructor(
    @Inject(BASE_SERVICE_TOKEN)
    private service: DfBaseCrudService,
    @Inject(SERVICE_TYPE_SERVICE_TOKEN)
    private serviceTypeService: DfBaseCrudService,
    @Inject(SERVICES_SERVICE_TOKEN)
    private servicesService: DfBaseCrudService,
    router: Router,
    activatedRoute: ActivatedRoute,
    liveAnnouncer: LiveAnnouncer,
    translateService: TranslocoService,
    dialog: MatDialog
  ) {
    super(router, activatedRoute, liveAnnouncer, translateService, dialog);

    this._activatedRoute.data.subscribe(({ data }) => {
      this.services = data.resource;
    });
  }

  services: Partial<Service>[];

  override allowCreate = false;
  override allowFilter = false;
  override actions: Actions<DatabaseRowData> = {
    default: {
      label: 'view',
      function: (row: DatabaseRowData) => {
        this.router.navigate([row.name], {
          relativeTo: this._activatedRoute,
        });
      },
      ariaLabel: {
        key: 'view',
      },
    },
    additional: null,
  };

  override columns = [
    {
      columnDef: 'name',
      cell: (row: DatabaseRowData) => row.name,
      header: 'name',
    },
    {
      columnDef: 'description',
      cell: (row: DatabaseRowData) => row.description,
      header: 'description',
    },
    {
      columnDef: 'label',
      cell: (row: DatabaseRowData) => row.label,
      header: 'label',
    },
    {
      columnDef: 'type',
      cell: (row: DatabaseRowData) => row.type,
      header: 'type',
    },
    {
      columnDef: 'actions',
    },
  ];

  mapDataToTable(data: any[]): DatabaseRowData[] {
    const filteredData = data.filter(val => val.isActive === true);
    return filteredData.map(val => {
      return {
        id: val.id,
        name: val.name,
        description: val.description,
        label: val.label,
        type: val.type,
      };
    });
  }

  refreshTable(limit?: number, offset?: number, filter?: string): void {
    const system = this._activatedRoute.snapshot.data['system'];

    const groups = ['Database'];
    const filteredDbGroups = groups.map(grp =>
      this.serviceTypeService.getAll<GenericListResponse<ServiceType>>({
        fields: 'name',
        additionalParams: [
          {
            key: 'group',
            value: grp,
          },
        ],
      })
    );

    forkJoin(filteredDbGroups)
      .pipe(
        map(groups => groups.map(group => group.resource).flat()),
        switchMap(serviceTypes => {
          return this.servicesService
            .getAll<GenericListResponse<Service>>({
              limit,
              sort: 'name',
              filter: `${
                system ? '(created_by_id is not null) and ' : ''
              }(type in ("${serviceTypes.map(src => src.name).join('","')}"))${
                filter ? ` and ${filter}` : ''
              }`,
            })
            .pipe(
              map(services => ({
                ...services,
                serviceTypes,
              }))
            );
        })
      )
      .subscribe(data => {
        this.dataSource.data = this.mapDataToTable(data.resource);
        this.tableLength = data.meta.count;
      });
  }

  filterQuery = getFilterQuery('services');
}
