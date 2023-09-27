import { Component, Inject } from '@angular/core';
import {
  Actions,
  DfManageTableComponent,
  DfManageTableModules,
} from '../../shared/components/df-manage-table/df-manage-table.component';
import { RelationshipsRow, TableRelated } from './df-table-details.types';
import { ActivatedRoute, Router } from '@angular/router';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { TranslocoService } from '@ngneat/transloco';
import { MatDialog } from '@angular/material/dialog';
import { BASE_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';
import { DfBaseCrudService } from 'src/app/shared/services/df-base-crud.service';
import { ROUTES } from 'src/app/shared/constants/routes';
import { getFilterQuery } from 'src/app/shared/utilities/filter-queries';
import { UntilDestroy } from '@ngneat/until-destroy';
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-relationships-table',
  templateUrl:
    '../../shared/components/df-manage-table/df-manage-table.component.html',
  styleUrls: [
    '../../shared/components/df-manage-table/df-manage-table.component.scss',
  ],
  standalone: true,
  imports: DfManageTableModules,
})
export class DfRelationshipsTableComponent extends DfManageTableComponent<RelationshipsRow> {
  dbName: string;
  tableName: string;

  constructor(
    @Inject(BASE_SERVICE_TOKEN)
    private crudService: DfBaseCrudService,
    router: Router,
    activatedRoute: ActivatedRoute,
    liveAnnouncer: LiveAnnouncer,
    translateService: TranslocoService,
    dialog: MatDialog
  ) {
    super(router, activatedRoute, liveAnnouncer, translateService, dialog);

    this._activatedRoute.data.subscribe(data => {
      this.tableName =
        data['data'] && data['data'].name ? data['data'].name : '';
    });

    this.dbName = this._activatedRoute.snapshot.params['name'];
  }

  override actions: Actions<RelationshipsRow> = {
    default: {
      label: 'view',
      function: (row: RelationshipsRow) => {
        this.router.navigate([ROUTES.RELATIONSHIPS, row.name], {
          relativeTo: this._activatedRoute,
        });
      },
      ariaLabel: {
        key: 'view',
      },
    },
    additional: this.actions.additional,
  };

  override columns = [
    {
      columnDef: 'name',
      header: 'schema.name',
      cell: (row: RelationshipsRow) => row.name,
    },
    {
      columnDef: 'alias',
      header: 'schema.alias',
      cell: (row: RelationshipsRow) => row.alias,
    },
    {
      columnDef: 'type',
      header: 'schema.type',
      cell: (row: RelationshipsRow) => row.type,
    },
    {
      columnDef: 'virtual',
      header: 'schema.virtual',
      cell: (row: RelationshipsRow) => row.isVirtual,
    },
    {
      columnDef: 'actions',
    },
  ];

  mapDataToTable(data: any): RelationshipsRow[] {
    return data.map((app: TableRelated) => {
      return {
        name: app.name,
        alias: app.alias,
        type: app.type,
        isVirtual: app.isVirtual,
      };
    });
  }

  filterQuery = getFilterQuery();

  override createRow(): void {
    this.router.navigate([ROUTES.RELATIONSHIPS], {
      relativeTo: this._activatedRoute,
    });
  }

  override deleteRow(row: RelationshipsRow): void {
    this.crudService
      .delete(`${this.dbName}/_schema/${this.tableName}/_related/${row.name}`)
      .subscribe(() => {
        this.refreshTable();
      });
    // TODO: implement error handling
  }

  refreshTable(): void {
    this.crudService
      .get(`${this.dbName}/_schema/${this.tableName}/_related`)
      .subscribe((data: any) => {
        this.dataSource.data = this.mapDataToTable(data.resource);
      });
  }
}
