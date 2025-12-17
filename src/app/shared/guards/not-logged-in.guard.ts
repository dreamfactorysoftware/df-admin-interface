import { inject } from '@angular/core';
import { DfAuthService } from '../../adf-user-management/services/df-auth.service';
import { map, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ROUTES } from '../types/routes';
import { DfUserDataService } from '../services/df-user-data.service';
import { EMPTY, of } from 'rxjs';
import { captureRedirectUrl, handleRedirectIfPresent } from '../utilities/url';

export const notLoggedInGuard = () => {
  const authService = inject(DfAuthService);
  const userDataService = inject(DfUserDataService);
  const router = inject(Router);

  captureRedirectUrl();

  return userDataService.isLoggedIn$.pipe(
    switchMap(isLoggedIn => {
      if (!isLoggedIn) {
        return authService.checkSession().pipe(
          map(validSession => {
            if (validSession) {
              // User has valid session, check for redirect
              if (handleRedirectIfPresent(userDataService.token)) {
                return false; // External redirect in progress
              }
              return router.createUrlTree([ROUTES.HOME]);
            }
            return true;
          })
        );
      }
      // Already logged in, check for redirect
      if (handleRedirectIfPresent(userDataService.token)) {
        return EMPTY; // External redirect in progress
      }
      return of(router.createUrlTree([ROUTES.HOME]));
    })
  );
};
