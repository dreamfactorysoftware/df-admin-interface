import { Component, ViewChild } from '@angular/core';
import { DfManageLimitsTableComponent } from './df-manage-limits-table.component';
import { faArrowsRotate } from '@fortawesome/free-solid-svg-icons';
import { TranslocoPipe } from '@ngneat/transloco';
import { AsyncPipe, NgIf } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { ActivatedRoute } from '@angular/router';
import { DfPaywallComponent } from 'src/app/shared/components/df-paywall/df-paywall.component';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-manage-limits',
  templateUrl: './df-manage-limits.component.html',
  styleUrls: ['./df-manage-limits.component.scss'],
  standalone: true,
  imports: [
    DfManageLimitsTableComponent,
    AsyncPipe,
    TranslocoPipe,
    FontAwesomeModule,
    NgIf,
    MatButtonModule,
    MatMenuModule,
    DfPaywallComponent,
  ],
})
export class DfManageLimitsComponent {
  faArrowsRotate = faArrowsRotate;
  @ViewChild(DfManageLimitsTableComponent)
  manageLimitsTableComponent!: DfManageLimitsTableComponent;
  paywall = false;
  constructor(private activatedRoute: ActivatedRoute) {
    this.activatedRoute.data.subscribe(({ data }) => {
      if (data === 'paywall') {
        this.paywall = true;
      }
    });
  }

  refreshTable() {
    this.manageLimitsTableComponent.refreshTable();
  }
}
