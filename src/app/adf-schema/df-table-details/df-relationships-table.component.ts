import { Component, Inject } from '@angular/core';
import {
  DfManageTableComponent,
  DfManageTableModules,
} from '../../shared/components/df-manage-table/df-manage-table.component';
import { RelationshipsRow, TableRelated } from './df-table-details.types';
import { ActivatedRoute, Router } from '@angular/router';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { TranslocoService } from '@ngneat/transloco';
import { MatDialog } from '@angular/material/dialog';
import { BASE_SERVICE_TOKEN } from 'src/app/core/constants/tokens';
import { DfBaseCrudService } from 'src/app/core/services/df-base-crud.service';
import { takeUntil } from 'rxjs';
import { ROUTES } from 'src/app/core/constants/routes';
import { getFilterQuery } from 'src/app/shared/utilities/filter-queries';

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

    this._activatedRoute.data
      .pipe(takeUntil(this.destroyed$))
      .subscribe(data => {
        this.tableName =
          data['data'] && data['data'].name ? data['data'].name : '';
      });

    this.dbName = this._activatedRoute.snapshot.params['name'];
  }

  //   TODO add header translations
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
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => {
        this.refreshTable();
      });
    // TODO: implement error handling
  }

  refreshTable(limit?: number, offset?: number, filter?: string): void {
    this.crudService
      .get(`${this.dbName}/_schema/${this.tableName}/_related`)
      .pipe(takeUntil(this.destroyed$))
      .subscribe((data: any) => {
        this.dataSource.data = this.mapDataToTable(data.resource);
      });
  }
}
