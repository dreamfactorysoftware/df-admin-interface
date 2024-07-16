import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { DfPaywallComponent } from 'src/app/shared/components/df-paywall/df-paywall.component';
import { UntilDestroy } from '@ngneat/until-destroy';
import { DfManageScriptsTableComponent } from './df-manage-scripts-table.component';
import { DfSnackbarService } from 'src/app/shared/services/df-snackbar.service';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-manage-scripts',
  templateUrl: './df-manage-scripts.component.html',
  standalone: true,
  imports: [DfPaywallComponent, NgIf, DfManageScriptsTableComponent],
})
export class DfManageScriptsComponent {
  paywall = false;
  constructor(
    private activatedRoute: ActivatedRoute,
    private snackbarService: DfSnackbarService
  ) {
    this.activatedRoute.data.subscribe(({ data }) => {
      if (data === 'paywall') {
        this.paywall = true;
      }
    });
    this.snackbarService.setSnackbarLastEle('', false);
  }
}
