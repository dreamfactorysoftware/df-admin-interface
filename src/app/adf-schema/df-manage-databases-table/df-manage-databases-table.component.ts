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
import { DatabaseRowData } from '../df-schema.types';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Router, ActivatedRoute } from '@angular/router';
import { DfBreakpointService } from 'src/app/core/services/df-breakpoint.service';
import { takeUntil } from 'rxjs';
import {
  ServiceType,
  SystemServiceData,
} from '../../adf-services/services.types';

@Component({
  selector: 'df-manage-databases-table',
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
export class DfManageDatabasesTableComponent extends DfManageTableComponent<DatabaseRowData> {
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

    this._activatedRoute.data
      .pipe(takeUntil(this.destroyed$))
      .subscribe(data => {
        this.services = data['data'].resource;
        this.serviceTypes = data['serviceTypes'].resource;
      });
  }

  services: Partial<SystemServiceData>[];
  serviceTypes: Partial<ServiceType>[];

  override readOnly = true;
  override allowCreate = false;
  override allowFilter = false;

  // TODO: update the header names with translation below
  override columns = [
    {
      columnDef: 'ID',
      cell: (row: DatabaseRowData) => row.id,
      header: 'ID',
    },
    {
      columnDef: 'name',
      cell: (row: DatabaseRowData) => row.name,
      header: 'Name',
    },
    {
      columnDef: 'description',
      cell: (row: DatabaseRowData) => row.description,
      header: 'Description',
    },
    {
      columnDef: 'label',
      cell: (row: DatabaseRowData) => row.label,
      header: 'Label',
    },
    {
      columnDef: 'type',
      cell: (row: DatabaseRowData) => row.type,
      header: 'Type',
    },
    {
      columnDef: 'actions',
    },
  ];

  mapDataToTable(data: any[]): DatabaseRowData[] {
    const databaseServices = this.serviceTypes.filter(val => {
      return val.group?.toLowerCase() === 'database';
    });

    return data.filter(val => {
      return databaseServices.some(databaseService => {
        return databaseService.name === val.type;
      });
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
