import { inject } from '@angular/core';
import { DfAuthService } from '../../adf-user-management/services/df-auth.service';
import { map, switchMap } from 'rxjs/operators';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { ROUTES } from '../types/routes';
import { of } from 'rxjs';
import { DfUserDataService } from '../services/df-user-data.service';
import { handleRedirectIfPresent } from '../utilities/url';

export const loggedInGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(DfAuthService);
  const userDataService = inject(DfUserDataService);
  const router = inject(Router);
  return userDataService.isLoggedIn$.pipe(
    switchMap(isLoggedIn => {
      if (!isLoggedIn) {
        return authService.checkSession().pipe(
          map(validSession => {
            if (!validSession) {
              // Preserve the destination so login can return the user to it.
              return router.createUrlTree([ROUTES.AUTH], {
                queryParams:
                  state.url && state.url !== '/'
                    ? { returnUrl: state.url }
                    : undefined,
              });
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
        return of(false); // Resolve guard so router doesn't stall; window.location.href handles the redirect
      }
      return of(true);
    })
  );
};
