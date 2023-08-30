import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { GenericListResponse } from 'src/app/shared/types/generic-http.type';
import { RoleType } from 'src/app/shared/types/role';
import { DF_ROLE_SERVICE_TOKEN } from 'src/app/core/constants/tokens';
export const rolesResolver: ResolveFn<GenericListResponse<RoleType>> = () => {
  const appsService = inject(DF_ROLE_SERVICE_TOKEN);
  return appsService.getAll<GenericListResponse<RoleType>>({
    related: 'role_service_access_by_role_id,lookup_by_role_id',
    limit: 0,
  });
};
