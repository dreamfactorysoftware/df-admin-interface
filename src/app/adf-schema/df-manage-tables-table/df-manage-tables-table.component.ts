import { Component, Inject } from '@angular/core';
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
import { DfBaseCrudService } from 'src/app/core/services/df-base-crud.service';
import { BASE_SERVICE_TOKEN } from 'src/app/core/constants/tokens';

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
    @Inject(BASE_SERVICE_TOKEN)
    private service: DfBaseCrudService,
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
  refreshTable(limit?: number, offset?: number, filter?: string): void {
    const dbName = this._activatedRoute.snapshot.paramMap.get('name');

    this.service
      .get(`${dbName}/_schema`, {
        fields: ['name', 'label'].join(','),
        limit,
        offset,
        filter,
      })
      .pipe(takeUntil(this.destroyed$))
      .subscribe((data: any) => {
        this.dataSource.data = this.mapDataToTable(data.data.resource);
        this.tableLength = data.data.meta.count;
      });
  }

  filterQuery(value: string): string {
    return '';
  }
}
