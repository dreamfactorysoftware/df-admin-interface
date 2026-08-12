import { inject } from '@angular/core';
import { ResolveFn, ActivatedRouteSnapshot } from '@angular/router';
import { catchError, of } from 'rxjs';
import { CONFIG_CORS_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';
import { GenericListResponse } from 'src/app/shared/types/generic-http';
import { emptyListWithError } from 'src/app/shared/utilities/app-error';
import { CorsConfigData } from '../../shared/types/config';

export const corsConfigResolver: ResolveFn<
  GenericListResponse<CorsConfigData> | CorsConfigData
> = (route: ActivatedRouteSnapshot) => {
  const corsConfigService = inject(CONFIG_CORS_SERVICE_TOKEN);
  const id = route.paramMap.get('id');
  if (!id) {
    // List branch only: complete navigation on failure so the table shell
    // renders the error state with Retry. The detail branch below keeps its
    // own error contract; never return the list fallback shape from it.
    return corsConfigService
      .getAll<GenericListResponse<CorsConfigData>>({
        includeCount: true,
      })
      .pipe(catchError(err => of(emptyListWithError(err))));
  }
  return corsConfigService.get(id);
};
