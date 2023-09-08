import { Component } from '@angular/core';
import { DfManageTableComponent } from '../../shared/components/df-manage-table/df-manage-table.component';
import { FieldsRow } from './df-table-details.types';
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
  constructor(
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

  override allowFilter = false;

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
  ];

  mapDataToTable(data: any): FieldsRow[] {
    return data.map((app: any) => {
      // TODO fix above type
      return {
        name: app.name,
        alias: app.alias,
        type: app.type,
        isVirtual: app.isVirtual,
        isAggregate: app.isAggregate,
        required: app.required,
        constraints: app.constraints,
      };
    });
  }

  filterQuery(value: string): string {
    return '';
  }

  override deleteRow(row: FieldsRow): void {
    // TODO imeplement delete row
    return;
  }

  refreshTable(limit?: number, offset?: number, filter?: string): void {
    // this.cacheService
    //   .getAll<GenericListResponse<CacheType>>({
    //     limit,
    //     offset,
    //     filter,
    //     fields: '*',
    //   })
    //   .pipe(takeUntil(this.destroyed$))
    //   .subscribe(data => {
    //     this.dataSource.data = this.mapDataToTable(data.resource);
    //     this.tableLength = data.resource.length;
    //   });
  }
}
