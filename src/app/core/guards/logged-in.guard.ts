import { inject } from '@angular/core';
import { DfAuthService } from '../../adf-user-management/services/df-auth.service';
import { map, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ROUTES } from '../constants/routes';
import { of } from 'rxjs';
import { DfUserDataService } from '../services/df-user-data.service';

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
              router.navigate([ROUTES.AUTH]);
              return false;
            }
            return true;
          })
        );
      }
      return of(true);
    })
  );
};
