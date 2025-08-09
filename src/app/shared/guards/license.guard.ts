import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { ROUTES } from '../types/routes';
import { DfLicenseCheckService } from '../services/df-license-check.service';
import { catchError, map, of, switchMap, take } from 'rxjs';
import { DfSystemConfigDataService } from '../services/df-system-config-data.service';

export const licenseGuard = (route: ActivatedRouteSnapshot) => {
  const licenseCheckService = inject(DfLicenseCheckService);
  const router = inject(Router);
  const systemConfigDataService = inject(DfSystemConfigDataService);
  
  // First check if we already have a license check result
  const currentLicenseCheck = licenseCheckService.currentLicenseCheck;
  if (currentLicenseCheck) {
    if (
      currentLicenseCheck.disableUi === 'true' &&
      route?.routeConfig?.path !== ROUTES.LICENSE_EXPIRED
    ) {
      return of(router.createUrlTree([ROUTES.LICENSE_EXPIRED]));
    }
    if (
      currentLicenseCheck.disableUi === 'true' &&
      route?.routeConfig?.path === ROUTES.LICENSE_EXPIRED
    ) {
      return of(true);
    }
    if (
      currentLicenseCheck.disableUi !== 'true' &&
      route?.routeConfig?.path === ROUTES.LICENSE_EXPIRED
    ) {
      return of(router.createUrlTree([ROUTES.HOME]));
    }
  }
  
  return systemConfigDataService.environment$.pipe(
    take(1),
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
        // Only check if we don't already have a result
        if (!currentLicenseCheck) {
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
              catchError(error => {
                // The error response is already handled in the service
                // Check the current value after error
                const errorLicenseCheck = licenseCheckService.currentLicenseCheck;
                if (errorLicenseCheck?.disableUi === 'true') {
                  if (route?.routeConfig?.path !== ROUTES.LICENSE_EXPIRED) {
                    return of(router.createUrlTree([ROUTES.LICENSE_EXPIRED]));
                  }
                  return of(true);
                }
                return of(true);
              })
            );
        }
        return of(true);
      }
      return of(false);
    })
  );
};
