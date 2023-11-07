import { Component, Inject } from '@angular/core';
import {
  DfManageTableComponent,
  DfManageTableModules,
} from '../../shared/components/df-manage-table/df-manage-table.component';
import { MatDialog } from '@angular/material/dialog';
import { TranslocoService } from '@ngneat/transloco';
import { DatabaseTableRowData } from '../../shared/types/schema';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Router, ActivatedRoute } from '@angular/router';
import { DfBaseCrudService } from 'src/app/shared/services/df-base-crud.service';
import { BASE_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';
import { getFilterQuery } from 'src/app/shared/utilities/filter-queries';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TableRow } from '../df-table-details/df-table-details.types';
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-manage-tables-table',
  templateUrl:
    '../../shared/components/df-manage-table/df-manage-table.component.html',
  styleUrls: [
    '../../shared/components/df-manage-table/df-manage-table.component.scss',
  ],
  standalone: true,
  imports: DfManageTableModules,
})
export class DfManageTablesTableComponent extends DfManageTableComponent<DatabaseTableRowData> {
  constructor(
    @Inject(BASE_SERVICE_TOKEN)
    private service: DfBaseCrudService,
    router: Router,
    activatedRoute: ActivatedRoute,
    liveAnnouncer: LiveAnnouncer,
    translateService: TranslocoService,
    dialog: MatDialog
  ) {
    super(router, activatedRoute, liveAnnouncer, translateService, dialog);
  }

  override allowFilter = false;

  override columns = [
    {
      columnDef: 'tableName',
      cell: (row: DatabaseTableRowData) => row.label,
      header: 'schema.tableName',
    },
    {
      columnDef: 'actions',
    },
  ];

  override deleteRow(row: TableRow): void {
    const dbName = this._activatedRoute.snapshot.paramMap.get('name');
    this.service.delete(`${dbName}/_schema/${row.id}`).subscribe(() => {
      this.refreshTable();
    });
  }

  mapDataToTable(data: any[]): DatabaseTableRowData[] {
    return data.map((item: any) => {
      return {
        label: item.label,
        name: item.name,
        id: item.name,
      };
    });
  }
  refreshTable(limit?: number, offset?: number, filter?: string): void {
    const dbName = this._activatedRoute.snapshot.paramMap.get('name');

    this.service
      .get(`${dbName}/_schema`, {
        fields: ['name', 'label'].join(','),
        limit,
        offset,
        filter,
      })
      .subscribe((data: any) => {
        this.dataSource.data = this.mapDataToTable(data.resource);
      });
  }

  filterQuery = getFilterQuery();
}
