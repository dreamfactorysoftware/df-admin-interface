import { inject } from '@angular/core';
import { DfErrorService } from '../services/df-error.service';
import { Router } from '@angular/router';
import { map } from 'rxjs';
import { isAppError } from '../utilities/app-error';

export const errorGuard = () => {
  const errorService = inject(DfErrorService);
  const router = inject(Router);
  const stateError =
    router.getCurrentNavigation()?.extras?.state?.['appError'] ??
    (typeof history !== 'undefined' ? history.state?.['appError'] : null);
  return errorService.hasError$.pipe(
    map(hasError => {
      // Allow the route when the service holds an error or the navigation
      // (or a refresh via history.state) carries one.
      if (hasError || isAppError(stateError)) {
        return true;
      }
      return router.createUrlTree(['/']);
    })
  );
};
