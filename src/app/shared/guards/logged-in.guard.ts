import { inject } from '@angular/core';
import { DfAuthService } from '../../adf-user-management/services/df-auth.service';
import { map, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ROUTES } from '../types/routes';
import { EMPTY, of } from 'rxjs';
import { DfUserDataService } from '../services/df-user-data.service';
import { handleRedirectIfPresent } from '../utilities/url';

export const loggedInGuard = () => {
  const authService = inject(DfAuthService);
  const userDataService = inject(DfUserDataService);
  const router = inject(Router);
  return userDataService.isLoggedIn$.pipe(
    switchMap(isLoggedIn => {
      if (!isLoggedIn) {
        return authService.checkSession().pipe(
          map(validSession => {
            if (!validSession) {
              return router.createUrlTree([ROUTES.AUTH]);
            }
            // Session is valid, check for redirect
            if (handleRedirectIfPresent(userDataService.token)) {
              return false; // Prevent Angular navigation, external redirect in progress
            }
            return true;
          })
        );
      }
      // Already logged in, check for redirect
      if (handleRedirectIfPresent(userDataService.token)) {
        return EMPTY; // Don't emit, external redirect in progress
      }
      return of(true);
    })
  );
};
