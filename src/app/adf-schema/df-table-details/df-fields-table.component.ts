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
        this.tableName = data['data'].name;
      });

    this.dbName = this._activatedRoute.snapshot.params['name'];
  }

  //   TODO add header translations
  override columns = [
    {
      columnDef: 'name',
      header: 'Name',
      cell: (row: FieldsRow) => row.name,
    },
    {
      columnDef: 'alias',
      header: 'Alias',
      cell: (row: FieldsRow) => row.alias,
    },
    {
      columnDef: 'type',
      header: 'Type',
      cell: (row: FieldsRow) => row.type,
    },
    {
      columnDef: 'virtual',
      header: 'Virtual',
      cell: (row: FieldsRow) => row.isVirtual,
    },
    {
      columnDef: 'aggregate',
      header: 'Aggregate',
      cell: (row: FieldsRow) => row.isAggregate,
    },
    {
      columnDef: 'required',
      header: 'Required',
      cell: (row: FieldsRow) => row.required,
    },
    {
      columnDef: 'constraints',
      header: 'Constraints',
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
      return 'Primary Key';
    } else if (field.isForeignKey) {
      return 'Foreign Key';
    }

    return '';
  }

  filterQuery(value: string): string {
    return '';
  }

  override deleteRow(row: FieldsRow): void {
    this.crudService
      .delete(`${this.dbName}/_schema/${this.tableName}/_field/${row.name}`)
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => {
        console.log('DELETE');
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
