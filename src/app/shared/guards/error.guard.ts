import { inject } from '@angular/core';
import { DfErrorService } from '../services/df-error.service';
import { Router } from '@angular/router';

export const errorGaurd = () => {
  const errorService = inject(DfErrorService);
  const router = inject(Router);
  if (!errorService.hasError) {
    return router.createUrlTree(['/']);
  }
  return true;
};
