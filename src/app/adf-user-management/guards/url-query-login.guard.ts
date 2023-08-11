import { inject } from '@angular/core';
import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { DfAuthService } from '../services/df-auth.service';
import { catchError, map, of } from 'rxjs';
import { ROUTES } from '../../core/constants/routes';

export const urlQueryLoginGuard = (next: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const authService = inject(DfAuthService);
  const sessionToken = next.queryParams['session_token'];

  if (sessionToken) {
    return authService.loginWithToken(sessionToken).pipe(
      map(() => {
        router.navigate([]);
        return false;
      }),
      catchError(() => {
        router.navigate([ROUTES.AUTH]);
        return of(true);
      })
    );
  }
  return true;
};
