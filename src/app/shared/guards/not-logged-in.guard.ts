import { inject } from '@angular/core';
import { DfAuthService } from '../../adf-user-management/services/df-auth.service';
import { map, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ROUTES } from '../types/routes';
import { of } from 'rxjs';
import { DfUserDataService } from '../services/df-user-data.service';

export const notLoggedInGuard = () => {
  const authService = inject(DfAuthService);
  const userDataService = inject(DfUserDataService);
  const router = inject(Router);
  return userDataService.isLoggedIn$.pipe(
    map(isLoggedIn => {
      if (isLoggedIn) {
        return router.createUrlTree([ROUTES.HOME]);
      }
      return true;
    }),
    switchMap(checkSession => {
      if (checkSession) {
        return authService.checkSession().pipe(
          map(validSession => {
            if (validSession) {
              return router.createUrlTree([ROUTES.HOME]);
            }
            return true;
          })
        );
      }
      return of(true);
    })
  );
};
