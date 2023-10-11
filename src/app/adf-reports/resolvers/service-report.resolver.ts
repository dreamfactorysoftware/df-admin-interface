import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { GenericListResponse } from 'src/app/shared/types/generic-http';

import { REPORT_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';
import { ServiceReportData } from 'src/app/shared/types/reports';
import { DfPaywallService } from 'src/app/shared/services/df-paywall.service';
import { of, switchMap } from 'rxjs';

export const serviceReportsResolver: ResolveFn<
  GenericListResponse<ServiceReportData> | string
> = () => {
  const paywallService = inject(DfPaywallService);
  const reportService = inject(REPORT_SERVICE_TOKEN);
  return paywallService.activatePaywall('service_report').pipe(
    switchMap(activated => {
      if (activated) {
        return of('paywall');
      }
      return reportService.getAll<GenericListResponse<ServiceReportData>>();
    })
  );
};
