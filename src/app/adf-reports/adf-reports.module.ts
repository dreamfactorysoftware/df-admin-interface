import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DfManageServiceReportComponent } from './df-manage-service-report/df-manage-service-report.component';
import { DfManageServiceReportTableComponent } from './df-manage-service-report/df-manage-service-report-table.component';
import { TranslateService } from '@ngx-translate/core';
import { AdfReportsRoutingModule } from './adf-reports-routing.module';
import { DfServiceReportService } from './services/service-report.service';
import { AdfManageTableModule } from '../shared/components/df-manage-table/adf-manage-table.module';

@NgModule({
  declarations: [
    DfManageServiceReportComponent,
    DfManageServiceReportTableComponent,
  ],
  imports: [CommonModule, AdfManageTableModule, AdfReportsRoutingModule],
  providers: [TranslateService, DfServiceReportService],
})
export class AdfReportsModule {}
