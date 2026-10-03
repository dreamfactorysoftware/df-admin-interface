import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ROUTES } from '../types/routes';
import { DfTrialService } from '../services/df-trial.service';

/**
 * Docker trial lockout (TRIAL-DESIGN.md section 5):
 * - locked (402 TRIAL_EXPIRED / 403 TRIAL_TOKEN_INVALID recorded) -> every
 *   route redirects to trial-expired, which itself is allowed;
 * - not locked -> trial-expired redirects home, everything else passes.
 *
 * Synchronous: it reads DfTrialService.isLocked (set by the APP_INITIALIZER
 * catch, errorInterceptor or a locked environment block) and never calls the
 * API, so it is safe as the FIRST guard on a route - a locked instance would
 * answer any session check with the lock anyway.
 */
export const trialGuard: CanActivateFn = (route, state) => {
  const trialService = inject(DfTrialService);
  const router = inject(Router);

  const onTrialExpiredPage =
    route?.routeConfig?.path === ROUTES.TRIAL_EXPIRED ||
    (state?.url ?? '').includes(ROUTES.TRIAL_EXPIRED);

  if (trialService.isLocked) {
    return onTrialExpiredPage
      ? true
      : router.createUrlTree([ROUTES.TRIAL_EXPIRED]);
  }
  if (onTrialExpiredPage) {
    return router.createUrlTree([ROUTES.HOME]);
  }
  return true;
};
