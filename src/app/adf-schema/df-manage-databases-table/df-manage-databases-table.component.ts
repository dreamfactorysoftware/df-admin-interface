import { Component } from '@angular/core';
import {
  Actions,
  DfManageTableComponent,
  DfManageTableModules,
} from '../../shared/components/df-manage-table/df-manage-table.component';
import { MatDialog } from '@angular/material/dialog';
import { TranslocoService } from '@ngneat/transloco';
import { DatabaseRowData } from '../df-schema.types';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Router, ActivatedRoute } from '@angular/router';
import { Service } from '../../shared/types/service';
import { getFilterQuery } from 'src/app/shared/utilities/filter-queries';
import { UntilDestroy } from '@ngneat/until-destroy';
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
    return data.map(val => {
      return {
        id: val.id,
        name: val.name,
        description: val.description,
        label: val.label,
        type: val.type,
      };
    });
  }

  // TODO change refresh table

  refreshTable(): void {
    this._activatedRoute.data.subscribe(({ data }) => {
      this.dataSource.data = this.mapDataToTable(data.resource);
      this.tableLength = data.meta.count;
    });
  }

  filterQuery = getFilterQuery('services');
}
