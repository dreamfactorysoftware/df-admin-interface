import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { AppType } from '../types/df-apps.types';
import { DF_APPS_SERVICE_TOKEN } from 'src/app/core/constants/tokens';

export const editAppResolver: ResolveFn<AppType> = (
  route: ActivatedRouteSnapshot
) => {
  const id = route.paramMap.get('id') ?? 0;
  const appsService = inject(DF_APPS_SERVICE_TOKEN);
  return appsService.get<AppType>(id, {
    related: 'role_by_role_id',
    fields: '*',
  });
};
