import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DfManageServiceReportTableComponent } from './df-manage-service-report/df-manage-service-report-table.component';
import { AdfReportsRoutingModule } from './adf-reports-routing.module';
import { AdfManageTableModule } from '../shared/components/df-manage-table/adf-manage-table.module';
import { DF_REPORT_SERVICE_TOKEN, URL_TOKEN } from '../core/constants/tokens';
import { URLS } from '../core/constants/urls';
import { DfBaseCrudServiceFactory } from '../core/services/df-base-crud.service';
import { HttpClient } from '@angular/common/http';

@NgModule({
  declarations: [DfManageServiceReportTableComponent],
  imports: [CommonModule, AdfManageTableModule, AdfReportsRoutingModule],
  providers: [
    { provide: URL_TOKEN, useValue: URLS.SERVICE_REPORT },
    {
      provide: DF_REPORT_SERVICE_TOKEN,
      useFactory: DfBaseCrudServiceFactory,
      deps: [URL_TOKEN, HttpClient],
    },
  ],
})
export class AdfReportsModule {}
