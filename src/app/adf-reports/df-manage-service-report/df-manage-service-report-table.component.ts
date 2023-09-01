import { Component, Inject } from '@angular/core';
import { DfManageTableComponent } from 'src/app/shared/components/df-manage-table/df-manage-table.component';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Router, ActivatedRoute } from '@angular/router';

import { DfBreakpointService } from 'src/app/core/services/df-breakpoint.service';
import { takeUntil } from 'rxjs';
import { REPORT_SERVICE_TOKEN } from 'src/app/core/constants/tokens';
import { DfBaseCrudService } from 'src/app/core/services/df-base-crud.service';
import { ServiceReportData } from 'src/app/shared/types/reports';
import { GenericListResponse } from 'src/app/shared/types/generic-http.type';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatButtonModule } from '@angular/material/button';
import { NgIf, NgFor, NgTemplateOutlet, AsyncPipe } from '@angular/common';
import { TranslocoPipe, TranslocoService } from '@ngneat/transloco';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'df-manage-service-report-table',
  templateUrl:
    '../../shared/components/df-manage-table/df-manage-table.component.html',
  styleUrls: [
    '../../shared/components/df-manage-table/df-manage-table.component.scss',
  ],
  standalone: true,
  imports: [
    NgIf,
    MatButtonModule,
    FontAwesomeModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    NgFor,
    MatMenuModule,
    NgTemplateOutlet,
    MatPaginatorModule,
    TranslocoPipe,
    AsyncPipe,
    MatDialogModule,
  ],
})
export class DfManageServiceReportTableComponent extends DfManageTableComponent<ServiceReportData> {
  override allowCreate = false;
  constructor(
    @Inject(REPORT_SERVICE_TOKEN)
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

  columns = [
    {
      columnDef: 'id',
      cell: (row: ServiceReportData) => row.id,
      header: 'id',
    },
    {
      columnDef: 'time',
      cell: (row: ServiceReportData) => row.lastModifiedDate,
      header: 'time',
    },
    {
      columnDef: 'serviceId',
      cell: (row: ServiceReportData) => row.serviceId,
      header: 'serviceId',
    },
    {
      columnDef: 'serviceName',
      cell: (row: ServiceReportData) => row.serviceName,
      header: 'serviceName',
    },
    {
      columnDef: 'userEmail',
      cell: (row: ServiceReportData) => row.userEmail,
      header: 'userEmail',
    },
    {
      columnDef: 'action',
      cell: (row: ServiceReportData) => row.action,
      header: 'action',
    },
    {
      columnDef: 'request',
      cell: (row: ServiceReportData) => row.requestVerb,
      header: 'request',
    },
  ];

  mapDataToTable(data: ServiceReportData[]): ServiceReportData[] {
    return data;
  }

  refreshTable(limit?: number, offset?: number, filter?: string): void {
    this.service
      .getAll<GenericListResponse<ServiceReportData>>({ limit, offset, filter })
      .pipe(takeUntil(this.destroyed$))
      .subscribe(data => {
        this.dataSource.data = this.mapDataToTable(data.resource);
        this.tableLength = data.meta.count;
      });
  }

  override filterQuery(value: string): string {
    return `(id like ${value}) or (service_id like ${value}) or (service_name like "%${value}%") or (user_email like "%${value}%") or (action like "%${value}%") or (request_verb like "%${value}%")`;
  }
}
