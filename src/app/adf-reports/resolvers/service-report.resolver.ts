import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { GenericListResponse } from 'src/app/shared/types/generic-http.type';

import { DF_REPORT_SERVICE_TOKEN } from 'src/app/core/constants/tokens';
import { ServiceReportData } from 'src/app/core/constants/reports';

export const serviceReportsResolver: ResolveFn<
  GenericListResponse<ServiceReportData>
> = () => {
  return inject(DF_REPORT_SERVICE_TOKEN).getAll();
};
