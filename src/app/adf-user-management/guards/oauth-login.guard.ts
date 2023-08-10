import { inject } from '@angular/core';
import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { DfAuthService } from '../../core/services/df-auth.service';
import { catchError, map, of } from 'rxjs';
import { ROUTES } from '../../core/constants/routes';

export const oauthLoginGuard = (next: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const authService = inject(DfAuthService);
  const code = next.queryParams['code'];
  const state = next.queryParams['state'];
  const oauthToken = next.queryParams['oauth_token'];

  if ((code && state) || oauthToken) {
    return authService.oauthLogin(oauthToken, code, state).pipe(
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
