import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { AppType } from '../../shared/types/apps';
import { APP_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';

export const editAppResolver: ResolveFn<AppType> = (
  route: ActivatedRouteSnapshot
) => {
  const id = route.paramMap.get('id') ?? 0;
  const appsService = inject(APP_SERVICE_TOKEN);
  return appsService.get<AppType>(id, {
    related: 'role_by_role_id',
    fields: '*',
  });
};
