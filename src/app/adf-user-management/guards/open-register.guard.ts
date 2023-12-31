import { inject } from '@angular/core';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ROUTES } from '../../shared/types/routes';
import { DfSystemConfigDataService } from '../../shared/services/df-system-config-data.service';

export const openRegisterGuard = () => {
  const systemConfigService = inject(DfSystemConfigDataService);
  const router = inject(Router);
  return systemConfigService.environment$.pipe(
    map(environment => {
      if (!environment.authentication.allowOpenRegistration) {
        router.navigate([ROUTES.AUTH]);
        return false;
      }
      return true;
    })
  );
};
