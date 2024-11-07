import { Component, OnInit } from '@angular/core';
import { DfPaywallComponent } from 'src/app/shared/components/df-paywall/df-paywall.component';
import { DfManageServicesTableComponent } from './df-manage-services-table.component';
import { ActivatedRoute } from '@angular/router';
import { NgIf } from '@angular/common';
import { DfSnackbarService } from 'src/app/shared/services/df-snackbar.service';

@Component({
  selector: 'df-manage-services',
  templateUrl: './df-manage-services.component.html',
  standalone: true,
  imports: [DfPaywallComponent, DfManageServicesTableComponent, NgIf],
})
export class DfManageServicesComponent implements OnInit {
  paywall = false;
  constructor(
    private activatedRoute: ActivatedRoute,
    private snackbarService: DfSnackbarService
  ) {}

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ data }) => {
      this.paywall = data.serviceTypes && data.serviceTypes.length === 0;
    });
    this.snackbarService.setSnackbarLastEle('', false);
  }
}
