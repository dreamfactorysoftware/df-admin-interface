import { inject } from '@angular/core';
import { DfErrorService } from '../services/df-error.service';
import { Router } from '@angular/router';
import { map } from 'rxjs';

export const errorGaurd = () => {
  const errorService = inject(DfErrorService);
  const router = inject(Router);
  return errorService.hasError$.pipe(
    map(hasError => {
      if (hasError) {
        return true;
      }
      return router.createUrlTree(['/']);
    })
  );
};
