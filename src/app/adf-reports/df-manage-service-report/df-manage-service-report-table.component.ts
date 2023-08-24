import { Component, Inject } from '@angular/core';
import { DfManageTableComponent } from 'src/app/shared/components/df-manage-table/df-manage-table.component';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { DfBreakpointService } from 'src/app/core/services/df-breakpoint.service';
import { takeUntil } from 'rxjs';
import { DF_REPORT_SERVICE_TOKEN } from 'src/app/core/constants/tokens';
import { DfBaseCrudService } from 'src/app/core/services/df-base-crud.service';
import { ServiceReportData } from 'src/app/core/constants/reports';

@Component({
  selector: 'df-manage-service-report-table',
  templateUrl:
    '../../shared/components/df-manage-table/df-manage-table.component.html',
  styleUrls: [
    '../../shared/components/df-manage-table/df-manage-table.component.scss',
  ],
})
export class DfManageServiceReportTableComponent extends DfManageTableComponent<ServiceReportData> {
  override allowCreate = false;
  constructor(
    @Inject(DF_REPORT_SERVICE_TOKEN)
    private service: DfBaseCrudService<ServiceReportData, any>,
    router: Router,
    activatedRoute: ActivatedRoute,
    liveAnnouncer: LiveAnnouncer,
    breakpointService: DfBreakpointService,
    translateService: TranslateService
  ) {
    super(
      router,
      activatedRoute,
      liveAnnouncer,
      breakpointService,
      translateService
    );
  }

  override columns = [
    {
      columnDef: 'id',
      cell: (row: ServiceReportData) => row.id,
      header: 'ID',
    },
    {
      columnDef: 'time',
      cell: (row: ServiceReportData) => row.lastModifiedDate,
      header: 'Time',
    },
    {
      columnDef: 'serviceId',
      cell: (row: ServiceReportData) => row.serviceId,
      header: 'Service Id',
    },
    {
      columnDef: 'serviceName',
      cell: (row: ServiceReportData) => row.serviceName,
      header: 'Service Name',
    },
    {
      columnDef: 'userEmail',
      cell: (row: ServiceReportData) => row.userEmail,
      header: 'User Email',
    },
    {
      columnDef: 'action',
      cell: (row: ServiceReportData) => row.action,
      header: 'Action',
    },
    {
      columnDef: 'request',
      cell: (row: ServiceReportData) => row.requestVerb,
      header: 'Request',
    },
  ];

  override mapDataToTable(data: ServiceReportData[]): ServiceReportData[] {
    return data;
  }

  override refreshTable(
    limit?: number,
    offset?: number,
    filter?: string
  ): void {
    this.service
      .getAll(limit, offset, filter)
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
