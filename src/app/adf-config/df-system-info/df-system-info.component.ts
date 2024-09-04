import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { DfBreakpointService } from '../../shared/services/df-breakpoint.service';
import { TranslocoPipe } from '@ngneat/transloco';
import { UntilDestroy } from '@ngneat/until-destroy';
import { DfSystemConfigDataService } from 'src/app/shared/services/df-system-config-data.service';
import { CheckResponse } from 'src/app/shared/types/check';
import { DfLicenseCheckService } from 'src/app/shared/services/df-license-check.service';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-system-info',
  templateUrl: './df-system-info.component.html',
  styleUrls: ['./df-system-info.component.scss'],
  standalone: true,
  imports: [AsyncPipe, NgFor, TranslocoPipe, NgIf],
})
export class DfSystemInfoComponent implements OnInit {
  environment = this.systemConfigDataService.environment;
  status?: CheckResponse;

  constructor(
    public breakpointService: DfBreakpointService,
    private systemConfigDataService: DfSystemConfigDataService,
    private licenseCheckService: DfLicenseCheckService
  ) {}

  ngOnInit() {
    this.systemConfigDataService.environment$.subscribe(environment => {
      if (
        environment.platform?.license &&
        environment.platform?.license !== 'OPEN SOURCE' &&
        environment.platform?.licenseKey
      ) {
        const data = this.licenseCheckService.check(
          environment.platform?.licenseKey as string
        );
        data.subscribe(data => {
          this.status = data;
        });
      } else {
        this.status = undefined;
      }
    });
  }
}
