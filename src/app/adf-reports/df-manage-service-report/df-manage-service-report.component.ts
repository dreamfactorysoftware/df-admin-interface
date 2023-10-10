import { NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DfPaywallComponent } from 'src/app/shared/components/df-paywall/df-paywall.component';
import { DfManageServiceReportTableComponent } from './df-manage-service-report-table.component';

@Component({
  selector: 'df-manage-service-report',
  templateUrl: './df-manage-service-report.component.html',
  standalone: true,
  imports: [DfPaywallComponent, NgIf, DfManageServiceReportTableComponent],
})
export class DfManageServiceReportComponent {
  paywall = false;
  constructor(private activcatedRoute: ActivatedRoute) {
    this.activcatedRoute.data.subscribe(({ data }) => {
      if (data === 'paywall') {
        this.paywall = true;
      }
    });
  }
}
