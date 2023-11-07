import { Component } from '@angular/core';
import { DfLoadingSpinnerService } from './shared/services/df-loading-spinner.service';
import { NgIf, AsyncPipe } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { DfSideNavComponent } from './shared/components/df-side-nav/df-side-nav.component';
import { DfLicenseCheckService } from './shared/services/df-license-check.service';
import { UntilDestroy } from '@ngneat/until-destroy';
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
    private licenseCheckService: DfLicenseCheckService
  ) {}
}
