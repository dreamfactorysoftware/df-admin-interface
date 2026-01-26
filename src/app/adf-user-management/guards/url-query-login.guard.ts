import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { DfAuthService } from '../services/df-auth.service';
import { catchError, map, of } from 'rxjs';
import { ROUTES } from '../../shared/types/routes';
import { getHashAwareQueryParams } from '../../shared/utilities/url';

export const urlQueryLoginGuard = () => {
  const router = inject(Router);
  const authService = inject(DfAuthService);

  const urlParams = getHashAwareQueryParams();
  const sessionToken = urlParams.get('session_token');

  if (sessionToken) {
    return authService.loginWithToken(sessionToken).pipe(
      map(() => {
        router.navigate([ROUTES.HOME]);
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
