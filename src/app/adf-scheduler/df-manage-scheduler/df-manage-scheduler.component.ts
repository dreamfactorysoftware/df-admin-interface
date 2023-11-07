import { Component } from '@angular/core';
import { DfPaywallComponent } from 'src/app/shared/components/df-paywall/df-paywall.component';
import { DfManageSchedulerTableComponent } from './df-manage-scheduler-table.component';
import { NgIf } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'df-manage-scheduler',
  templateUrl: './df-manage-scheduler.component.html',
  standalone: true,
  imports: [DfPaywallComponent, NgIf, DfManageSchedulerTableComponent],
})
export class DfManageSchedulerComponent {
  paywall = false;
  constructor(private activatedRoute: ActivatedRoute) {
    this.activatedRoute.data.subscribe(({ data }) => {
      if (data === 'paywall') {
        this.paywall = true;
      }
    });
  }
}
