import { Component, OnInit } from '@angular/core';
import { DfPaywallComponent } from 'src/app/shared/components/df-paywall/df-paywall.component';
import { DfManageServicesTableComponent } from './df-manage-services-table.component';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIf } from '@angular/common';
import { DfSnackbarService } from 'src/app/shared/services/df-snackbar.service';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'df-manage-services',
  templateUrl: './df-manage-services.component.html',
  standalone: true,
  imports: [
    DfPaywallComponent,
    DfManageServicesTableComponent,
    NgIf,
    MatCardModule,
    MatIconModule,
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
      this.paywall = data.serviceTypes && data.serviceTypes.length === 0;
    });
    this.snackbarService.setSnackbarLastEle('', false);
  }
}
