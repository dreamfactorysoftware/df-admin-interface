import { AsyncPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { DfBreakpointService } from '../../shared/services/df-breakpoint.service';
import { TranslocoPipe } from '@ngneat/transloco';
import { UntilDestroy } from '@ngneat/until-destroy';
import { DfSystemConfigDataService } from 'src/app/shared/services/df-system-config-data.service';
import { CheckResponse } from 'src/app/shared/types/check';
import { DfLicenseCheckService } from 'src/app/shared/services/df-license-check.service';
import { TrialInfo } from 'src/app/shared/types/trial';
import { trialFromEnvironment } from 'src/app/shared/utilities/trial';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-system-info',
  templateUrl: './df-system-info.component.html',
  styleUrls: ['./df-system-info.component.scss'],
  standalone: true,
  imports: [AsyncPipe, DatePipe, NgFor, TranslocoPipe, NgIf],
})
export class DfSystemInfoComponent implements OnInit {
  environment = this.systemConfigDataService.environment;
  status?: CheckResponse;

  constructor(
    public breakpointService: DfBreakpointService,
    private systemConfigDataService: DfSystemConfigDataService,
    private licenseCheckService: DfLicenseCheckService
  ) {}

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
