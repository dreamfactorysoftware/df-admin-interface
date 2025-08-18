import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { ROUTES } from '../types/routes';
import { DfLicenseCheckService } from '../services/df-license-check.service';
import { of } from 'rxjs';

export const globalLicenseGuard: CanActivateFn = (route, state) => {
  const licenseCheckService = inject(DfLicenseCheckService);
  const router = inject(Router);

  // Get the current license check value without triggering new API calls
  const licenseCheck = licenseCheckService.currentLicenseCheck;

  // If disable_ui is true and we're not on the license-expired page, redirect
  if (
    licenseCheck?.disableUi === 'true' &&
    !state.url.includes(ROUTES.LICENSE_EXPIRED)
  ) {
    return of(router.createUrlTree([ROUTES.LICENSE_EXPIRED]));
  }

  return of(true);
};
