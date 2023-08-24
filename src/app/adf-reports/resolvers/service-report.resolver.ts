import { inject } from '@angular/core';
import { ResolveFn, ActivatedRouteSnapshot } from '@angular/router';
import { GenericListResponse } from 'src/app/shared/types/generic-http.type';
import {
  ServiceReportData,
  DfServiceReportService,
} from '../services/service-report.service';

export const serviceReportsResolver: ResolveFn<
  GenericListResponse<Array<ServiceReportData>>
> = (route: ActivatedRouteSnapshot) => {
  return inject(DfServiceReportService).getServiceReports();
};
