import { inject } from '@angular/core';
import { ResolveFn, ActivatedRouteSnapshot } from '@angular/router';
import { CONFIG_CORS_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';
import { GenericListResponse } from 'src/app/shared/types/generic-http.type';
import { CorsConfigData } from '../types';

export const corsConfigResolver: ResolveFn<
  GenericListResponse<CorsConfigData> | CorsConfigData
> = (route: ActivatedRouteSnapshot) => {
  const corsConfigService = inject(CONFIG_CORS_SERVICE_TOKEN);
  const id = route.paramMap.get('id');
  if (!id) {
    return corsConfigService.getAll({
      includeCount: true,
    });
  }
  return corsConfigService.get(id);
};
