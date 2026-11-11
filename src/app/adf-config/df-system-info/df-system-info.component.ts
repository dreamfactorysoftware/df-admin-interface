import { AsyncPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { DfBreakpointService } from '../../shared/services/df-breakpoint.service';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@ngneat/transloco';
import { UntilDestroy } from '@ngneat/until-destroy';
import { DfSystemConfigDataService } from 'src/app/shared/services/df-system-config-data.service';
import { CheckResponse } from 'src/app/shared/types/check';
import { DfLicenseCheckService } from 'src/app/shared/services/df-license-check.service';
import { TrialInfo } from 'src/app/shared/types/trial';
import { trialFromEnvironment } from 'src/app/shared/utilities/trial';
import { DfServerSettingsService } from 'src/app/shared/services/df-server-settings.service';
import { ROUTES } from 'src/app/shared/types/routes';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-system-info',
  templateUrl: './df-system-info.component.html',
  styleUrls: ['./df-system-info.component.scss'],
  standalone: true,
  imports: [AsyncPipe, DatePipe, NgFor, RouterLink, TranslocoPipe, NgIf],
})
export class DfSystemInfoComponent implements OnInit {
  environment = this.systemConfigDataService.environment;
  status?: CheckResponse;

  constructor(
    public breakpointService: DfBreakpointService,
    private systemConfigDataService: DfSystemConfigDataService,
    private licenseCheckService: DfLicenseCheckService,
    private serverSettingsService: DfServerSettingsService
  ) {}

  serverSettingsLink = `/${ROUTES.SYSTEM_SETTINGS}/${ROUTES.CONFIG}/${ROUTES.SERVER_SETTINGS}`;

  // One boolean is all this page needs: may this user open Server Settings
  // on this backend. Same rule as the nav entry and the overview card.
  canEditServerSettings$ = this.serverSettingsService.canOpen$;

  /** Docker trial block (platform.trial, or top-level pre-login); null otherwise. */
  get trial(): TrialInfo | null {
    return trialFromEnvironment(this.environment);
  }

  ngOnInit() {
    // Use the existing license check result instead of triggering a new one
    this.licenseCheckService.licenseCheck$.subscribe(licenseCheck => {
      if (licenseCheck) {
        this.status = licenseCheck;
      } else {
        this.status = undefined;
      }
    });
  }
}
