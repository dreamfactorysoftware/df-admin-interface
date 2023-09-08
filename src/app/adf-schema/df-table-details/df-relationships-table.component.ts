import { Component } from '@angular/core';
import { DfManageTableComponent } from '../../shared/components/df-manage-table/df-manage-table.component';
import { RelationshipsRow } from './df-table-details.types';
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
  selector: 'df-relationships-table',
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
export class DfRelationshipsTableComponent extends DfManageTableComponent<RelationshipsRow> {
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
      cell: (row: RelationshipsRow) => row.name,
    },
    {
      columnDef: 'alias',
      header: 'Alias',
      cell: (row: RelationshipsRow) => row.alias,
    },
    {
      columnDef: 'type',
      header: 'Type',
      cell: (row: RelationshipsRow) => row.type,
    },
    {
      columnDef: 'virtual',
      header: 'Virtual',
      cell: (row: RelationshipsRow) => row.isVirtual,
    },
  ];

  mapDataToTable(data: any): RelationshipsRow[] {
    return data.map((app: any) => {
      // TODO fix above type
      return {
        name: app.name,
        alias: app.alias,
        type: app.type,
        isVirtual: app.isVirtual,
      };
    });
  }

  filterQuery(value: string): string {
    return '';
  }

  override deleteRow(row: RelationshipsRow): void {
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
