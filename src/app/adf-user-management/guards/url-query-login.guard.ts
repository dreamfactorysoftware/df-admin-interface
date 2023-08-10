import { inject } from '@angular/core';
import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { DfAuthService } from '../../core/services/df-auth.service';
import { catchError, of, switchMap, tap } from 'rxjs';
import { ROUTES } from '../../core/constants/routes';

export const urlQueryLoginGuard = (next: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const authService = inject(DfAuthService);
  const sessionToken = next.queryParams['session_token'];

  if (sessionToken) {
    return authService.loginWithToken(sessionToken).pipe(
      tap(() => {
        router.navigate(['/']);
      }),
      switchMap(() => of(false)),
      catchError(() => {
        router.navigate([`${ROUTES.AUTH}/${ROUTES.LOGIN}`]);
        return of(true);
      })
    );
  }
  return true;
};
