import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { ROUTES } from '../constants/routes';
import { DfLicenseCheckService } from '../services/df-license-check.service';
import { map } from 'rxjs';

export const licenseGuard = (route: ActivatedRouteSnapshot) => {
  const licenseCheckService = inject(DfLicenseCheckService);
  const router = inject(Router);
  return licenseCheckService.check().pipe(
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
    })
  );
};
