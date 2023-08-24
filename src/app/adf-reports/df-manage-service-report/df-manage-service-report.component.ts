import { Component, ViewChild } from '@angular/core';
import { DfManageServiceReportTableComponent } from './df-manage-service-report-table.component';

@Component({
  selector: 'df-manage-service-report',
  templateUrl: './df-manage-service-report.component.html',
  styleUrls: ['./df-manage-service-report.component.scss'],
})
export class DfManageServiceReportComponent {
  @ViewChild(DfManageServiceReportTableComponent)
  manageServiceReportTableComponent!: DfManageServiceReportTableComponent;
}
