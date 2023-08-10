import { inject } from '@angular/core';
import { DfAuthService } from '../services/df-auth.service';
import { map, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ROUTES } from '../constants/routes';
import { of } from 'rxjs';

export const notLoggedInGuard = () => {
  const authService = inject(DfAuthService);
  const router = inject(Router);
  return authService.isLoggedIn$.pipe(
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
