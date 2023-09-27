import { Component, Inject } from '@angular/core';
import {
  Actions,
  DfManageTableComponent,
  DfManageTableModules,
} from '../../shared/components/df-manage-table/df-manage-table.component';
import { FieldsRow, TableField } from './df-table-details.types';
import { ActivatedRoute, Router } from '@angular/router';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { TranslocoService } from '@ngneat/transloco';
import { MatDialog } from '@angular/material/dialog';
import { DfBaseCrudService } from 'src/app/shared/services/df-base-crud.service';
import { BASE_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';
import { ROUTES } from 'src/app/shared/constants/routes';
import { getFilterQuery } from 'src/app/shared/utilities/filter-queries';
import { UntilDestroy } from '@ngneat/until-destroy';
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-fields-table',
  templateUrl:
    '../../shared/components/df-manage-table/df-manage-table.component.html',
  styleUrls: [
    '../../shared/components/df-manage-table/df-manage-table.component.scss',
  ],
  standalone: true,
  imports: DfManageTableModules,
})
export class DfFieldsTableComponent extends DfManageTableComponent<FieldsRow> {
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

  override actions: Actions<FieldsRow> = {
    default: {
      label: 'view',
      function: (row: FieldsRow) => {
        this.router.navigate([row.name], {
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
      cell: (row: FieldsRow) => row.name,
    },
    {
      columnDef: 'alias',
      header: 'schema.alias',
      cell: (row: FieldsRow) => row.alias,
    },
    {
      columnDef: 'type',
      header: 'schema.type',
      cell: (row: FieldsRow) => row.type,
    },
    {
      columnDef: 'virtual',
      header: 'schema.virtual',
      cell: (row: FieldsRow) => row.isVirtual,
    },
    {
      columnDef: 'aggregate',
      header: 'schema.aggregate',
      cell: (row: FieldsRow) => row.isAggregate,
    },
    {
      columnDef: 'required',
      header: 'schema.required',
      cell: (row: FieldsRow) => row.required,
    },
    {
      columnDef: 'constraints',
      header: 'schema.constraints',
      cell: (row: FieldsRow) => row.constraints,
    },
    {
      columnDef: 'actions',
    },
  ];

  mapDataToTable(data: any): FieldsRow[] {
    return data.map((app: TableField) => {
      return {
        name: app.name,
        alias: app.alias,
        type: app.type,
        isVirtual: app.isVirtual,
        isAggregate: app.isAggregate,
        required: app.required,
        constraints: this.getFieldConstraints(app),
      };
    });
  }

  getFieldConstraints(field: TableField) {
    if (field.isPrimaryKey) {
      return 'schema.primaryKey';
    } else if (field.isForeignKey) {
      return 'schema.foreignKey';
    }

    return '';
  }

  filterQuery = getFilterQuery();

  override createRow(): void {
    this.router.navigate([ROUTES.CREATE, 'field'], {
      relativeTo: this._activatedRoute,
    });
  }

  override deleteRow(row: FieldsRow): void {
    this.crudService
      .delete(`${this.dbName}/_schema/${this.tableName}/_field/${row.name}`)
      .subscribe(() => {
        this.refreshTable();
      });
    // TODO: implement error handling
    //  this.triggerAlert
  }

  refreshTable(limit?: number, offset?: number, filter?: string): void {
    this.crudService
      .get(`${this.dbName}/_schema/${this.tableName}/_field`)
      .subscribe((data: any) => {
        this.dataSource.data = this.mapDataToTable(data.resource);
      });
  }
}
