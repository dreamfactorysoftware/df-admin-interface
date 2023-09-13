import { Component, Inject } from '@angular/core';
import { DfManageTableComponent } from '../../shared/components/df-manage-table/df-manage-table.component';
import { FieldsRow, TableField } from './df-table-details.types';
import { ActivatedRoute, Router } from '@angular/router';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { DfBreakpointService } from '../../core/services/df-breakpoint.service';
import { TranslocoPipe, TranslocoService } from '@ngneat/transloco';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { AsyncPipe, NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { DfBaseCrudService } from 'src/app/core/services/df-base-crud.service';
import { BASE_SERVICE_TOKEN } from 'src/app/core/constants/tokens';
import { takeUntil } from 'rxjs';
import { ROUTES } from 'src/app/core/constants/routes';

@Component({
  selector: 'df-fields-table',
  templateUrl:
    '../../shared/components/df-manage-table/df-manage-table.component.html',
  styleUrls: [
    '../../shared/components/df-manage-table/df-manage-table.component.scss',
  ],
  standalone: true,
  imports: [
    MatButtonModule,
    FontAwesomeModule,
    MatTableModule,
    MatPaginatorModule,
    TranslocoPipe,
    AsyncPipe,
    NgIf,
    NgFor,
    NgTemplateOutlet,
    MatMenuModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
  ],
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
    breakpointService: DfBreakpointService,
    translateService: TranslocoService,
    dialog: MatDialog
  ) {
    super(
      router,
      activatedRoute,
      liveAnnouncer,
      breakpointService,
      translateService,
      dialog
    );

    this._activatedRoute.data
      .pipe(takeUntil(this.destroyed$))
      .subscribe(data => {
        this.tableName =
          data['data'] && data['data'].name ? data['data'].name : '';
      });

    this.dbName = this._activatedRoute.snapshot.params['name'];
  }

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

  filterQuery(value: string): string {
    return '';
  }

  override createRow(): void {
    this.router.navigate([ROUTES.CREATE, 'field'], {
      relativeTo: this._activatedRoute,
    });
  }

  override editRow(row: FieldsRow): void {
    this.router.navigate([ROUTES.EDIT, row.name], {
      relativeTo: this._activatedRoute,
    });
  }

  override deleteRow(row: FieldsRow): void {
    this.crudService
      .delete(`${this.dbName}/_schema/${this.tableName}/_field/${row.name}`)
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => {
        this.refreshTable();
      });
    // TODO: implement error handling
    //  this.triggerAlert
  }

  refreshTable(limit?: number, offset?: number, filter?: string): void {
    this.crudService
      .get(`${this.dbName}/_schema/${this.tableName}/_field`)
      .pipe(takeUntil(this.destroyed$))
      .subscribe((data: any) => {
        this.dataSource.data = this.mapDataToTable(data.resource);
      });
  }
}
