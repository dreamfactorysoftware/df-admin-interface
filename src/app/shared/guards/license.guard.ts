import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { ROUTES } from '../types/routes';
import { DfLicenseCheckService } from '../services/df-license-check.service';
import { catchError, map, of, switchMap } from 'rxjs';
import { DfSystemConfigDataService } from '../services/df-system-config-data.service';

export const licenseGuard = (route: ActivatedRouteSnapshot) => {
  const licenseCheckService = inject(DfLicenseCheckService);
  const router = inject(Router);
  const systemConfigDataService = inject(DfSystemConfigDataService);
  return systemConfigDataService.environment$.pipe(
    switchMap(environment => {
      if (!environment.platform?.license) {
        return systemConfigDataService.fetchEnvironmentData();
      }
      return of(environment);
    }),
    switchMap(environment => {
      if (environment.platform?.license === 'OPEN SOURCE') {
        return of(true);
      }
      if (environment.platform?.licenseKey !== undefined) {
        return licenseCheckService
          .check(`${environment.platform.licenseKey}`)
          .pipe(
            map(response => {
              if (
                response.disableUi === 'true' &&
                route?.routeConfig?.path !== ROUTES.LICENSE_EXPIRED
              ) {
                return router.createUrlTree([ROUTES.LICENSE_EXPIRED]);
              }
              if (
                response.disableUi === 'true' &&
                route?.routeConfig?.path === ROUTES.LICENSE_EXPIRED
              ) {
                return true;
              }
              if (route?.routeConfig?.path === ROUTES.LICENSE_EXPIRED) {
                return router.createUrlTree([ROUTES.HOME]);
              }
              return true;
            }),
            catchError(() => of(true))
          );
      }
      return of(false);
    })
  );
};
