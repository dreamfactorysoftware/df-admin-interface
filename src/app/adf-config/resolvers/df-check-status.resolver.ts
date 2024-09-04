// import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { of } from 'rxjs';
// import { DfLicenseCheckService } from 'src/app/shared/services/df-license-check.service';
// import { DfSystemConfigDataService } from 'src/app/shared/services/df-system-config-data.service';
import { CheckResponse } from 'src/app/shared/types/check';

export const checkStatusResolver: ResolveFn<CheckResponse | null> = () => {
  // const systemConfigDataService = inject(DfSystemConfigDataService);
  // const licenseCheckService = inject(DfLicenseCheckService);
  // return systemConfigDataService.environment$.pipe(
  //   switchMap(environment => {
  //     if (
  //       environment.platform?.license &&
  //       environment.platform?.license !== 'OPEN SOURCE' &&
  //       environment.platform?.licenseKey
  //     ) {
  //       return licenseCheckService.check(
  //         'environment.platform?.licenseKey as string'
  //       );
  //     }
  return of(null);
  //   })
  // );
};
