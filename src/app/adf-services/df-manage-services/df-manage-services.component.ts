import { Component, OnInit } from '@angular/core';
import { DfPaywallComponent } from 'src/app/shared/components/df-paywall/df-paywall.component';
import { DfManageServicesTableComponent } from './df-manage-services-table.component';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIf } from '@angular/common';
import { DfSnackbarService } from 'src/app/shared/services/df-snackbar.service';

@Component({
  selector: 'df-manage-services',
  templateUrl: './df-manage-services.component.html',
  standalone: true,
  imports: [
    DfPaywallComponent,
    DfManageServicesTableComponent,
    NgIf,
  ],
})
export class DfManageServicesComponent implements OnInit {
  paywall = false;
  isNativeApp = true; // Hardcoded for Snowflake Native App
  isAiRoute = false;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private snackbarService: DfSnackbarService
  ) {}

  ngOnInit(): void {
    // Check if we're on the AI route
    this.isAiRoute = this.router.url.startsWith('/ai');

    this.activatedRoute.data.subscribe(({ data }) => {
      // In Native App mode on AI route, always show the "not available" message
      // regardless of whether MCP package is installed locally
      if (this.isNativeApp && this.isAiRoute) {
        this.paywall = true;
      } else {
        this.paywall = data.serviceTypes && data.serviceTypes.length === 0;
      }
    });
    this.snackbarService.setSnackbarLastEle('', false);
  }
}
