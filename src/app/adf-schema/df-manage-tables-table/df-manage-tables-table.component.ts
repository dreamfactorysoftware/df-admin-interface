import { Component } from '@angular/core';
import { DfManageTableComponent } from '../../shared/components/df-manage-table/df-manage-table.component';
import { AsyncPipe, NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslocoPipe, TranslocoService } from '@ngneat/transloco';
import { DatabaseTableRowData } from '../df-schema.types';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Router, ActivatedRoute } from '@angular/router';
import { DfBreakpointService } from '../../core/services/df-breakpoint.service';
import { takeUntil } from 'rxjs';
import { DfDatabaseSchemaService } from '../services/df-database-schema.service';

@Component({
  selector: 'df-manage-tables-table',
  templateUrl:
    '../../shared/components/df-manage-table/df-manage-table.component.html',
  styleUrls: [
    '../../shared/components/df-manage-table/df-manage-table.component.scss',
  ],
  standalone: true,
  imports: [
    AsyncPipe,
    NgFor,
    NgIf,
    NgTemplateOutlet,
    FontAwesomeModule,
    MatPaginatorModule,
    MatButtonModule,
    MatDialogModule,
    MatMenuModule,
    MatInputModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatTableModule,
    TranslocoPipe,
  ],
})
export class DfManageTablesTableComponent extends DfManageTableComponent<DatabaseTableRowData> {
  constructor(
    private service: DfDatabaseSchemaService,
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
  }

  // override allowDelete = false;
  // override allowCreate = false;
  override allowFilter = false;
  // override readOnly = true;

  // TODO: update the header names with translation below
  override columns = [
    {
      columnDef: 'tableName',
      cell: (row: DatabaseTableRowData) => row.label,
      header: 'Table Name',
    },
    {
      columnDef: 'actions',
    },
  ];

  mapDataToTable(data: any[]): DatabaseTableRowData[] {
    return data.map((item: any) => {
      return {
        label: item.label,
        name: item.name,
        id: item.name,
      };
    });
  }
  refreshTable(
    limit?: number | undefined,
    offset?: number | undefined,
    filter?: string | undefined
  ): void {
    this._activatedRoute.data
      .pipe(takeUntil(this.destroyed$))
      .subscribe(({ data }) => {
        this.dataSource.data = this.mapDataToTable(data.resource);
        this.tableLength = data.meta.count;
      });
  }

  filterQuery(value: string): string {
    return '';
  }
}
