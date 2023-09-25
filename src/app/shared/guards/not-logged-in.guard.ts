import { inject } from '@angular/core';
import { DfAuthService } from '../../adf-user-management/services/df-auth.service';
import { map, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ROUTES } from '../constants/routes';
import { of } from 'rxjs';
import { DfUserDataService } from '../services/df-user-data.service';

export const notLoggedInGuard = () => {
  const authService = inject(DfAuthService);
  const userDataService = inject(DfUserDataService);
  const router = inject(Router);
  return userDataService.isLoggedIn$.pipe(
    map(isLoggedIn => {
      if (isLoggedIn) {
        router.navigate([ROUTES.HOME]);
        return false;
      }
      return true;
    }),
    switchMap(checkSession => {
      if (checkSession) {
        return authService.checkSession().pipe(
          map(validSession => {
            if (validSession) {
              router.navigate([ROUTES.HOME]);
              return false;
            }
            return true;
          })
        );
      }
      return of(false);
    })
  );
};
