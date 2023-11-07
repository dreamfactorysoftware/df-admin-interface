import { inject } from '@angular/core';
import { DfAuthService } from '../../adf-user-management/services/df-auth.service';
import { map, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ROUTES } from '../types/routes';
import { DfUserDataService } from '../services/df-user-data.service';
import { of } from 'rxjs';

export const notLoggedInGuard = () => {
  const authService = inject(DfAuthService);
  const userDataService = inject(DfUserDataService);
  const router = inject(Router);
  return userDataService.isLoggedIn$.pipe(
    switchMap(isLoggedIn => {
      if (!isLoggedIn) {
        return authService.checkSession().pipe(
          map(validSession => {
            if (validSession) {
              return router.createUrlTree([ROUTES.HOME]);
            }
            return true;
          })
        );
      }
      return of(router.createUrlTree([ROUTES.HOME]));
    })
  );
};
