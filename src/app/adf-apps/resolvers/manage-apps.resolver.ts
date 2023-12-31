import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { AppType } from '../../shared/types/apps';
import { GenericListResponse } from 'src/app/shared/types/generic-http';
import { APP_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';

export const appsResolver =
  (limit?: number): ResolveFn<GenericListResponse<AppType>> =>
  () => {
    const appsService = inject(APP_SERVICE_TOKEN);
    return appsService.getAll<GenericListResponse<AppType>>({
      related: 'role_by_role_id',
      fields: '*',
      limit,
      sort: 'name',
    });
  };
