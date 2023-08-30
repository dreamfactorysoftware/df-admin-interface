import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { AppType } from '../types/df-apps.types';
import { GenericListResponse } from 'src/app/shared/types/generic-http.type';
import { DF_APPS_SERVICE_TOKEN } from 'src/app/core/constants/tokens';

export const appsResolver: ResolveFn<GenericListResponse<AppType>> = () => {
  const appsService = inject(DF_APPS_SERVICE_TOKEN);
  return appsService.getAll<GenericListResponse<AppType>>({
    related: 'role_by_role_id',
    fields: '*',
  });
};
