import { Component } from '@angular/core';
import { DfLoadingSpinnerService } from './shared/services/df-loading-spinner.service';
import { NgIf, AsyncPipe } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { DfSideNavComponent } from './shared/components/df-side-nav/df-side-nav.component';
import { DfLicenseCheckService } from './shared/services/df-license-check.service';
import { DfUserDataService } from './shared/services/df-user-data.service';
import { UntilDestroy } from '@ngneat/until-destroy';
import { DfSystemConfigDataService } from './shared/services/df-system-config-data.service';
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [DfSideNavComponent, RouterOutlet, NgIf, AsyncPipe],
})
export class AppComponent {
  title = 'df-admin-interface';
  activeSpinner$ = this.loadingSpinnerService.active;
  licenseCheck$ = this.licenseCheckService.licenseCheck$;
  constructor(
    private loadingSpinnerService: DfLoadingSpinnerService,
    private userDataService: DfUserDataService,
    private systemConfigDataService: DfSystemConfigDataService,
    private licenseCheckService: DfLicenseCheckService
  ) {
    this.userDataService.userData$.subscribe(userData => {
      if (userData) {
        this.systemConfigDataService.fetchEnvironmentData();
        if (userData.isRootAdmin || userData.isSysAdmin || userData.roleId) {
          this.systemConfigDataService.fetchSystemData();
        }
      }
    });
  }
}
