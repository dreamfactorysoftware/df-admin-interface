import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { GenericListResponse } from 'src/app/shared/types/generic-http.type';
import { RoleType } from 'src/app/shared/types/role';
import { ROLE_SERVICE_TOKEN } from 'src/app/core/constants/tokens';

export const roleResolver: ResolveFn<RoleType | undefined> = (
  route: ActivatedRouteSnapshot
) => {
  const roleService = inject(ROLE_SERVICE_TOKEN);
  const id = route.paramMap.get('id');
  if (!id) {
    // TODO: add 404 page
    return;
  }
  return roleService.get<RoleType>(id, {
    related: 'role_service_access_by_role_id,lookup_by_role_id',
    additionalParams: [
      {
        key: 'accessible_tabs',
        value: true,
      },
    ],
  });
};

export const rolesResolver =
  (limit?: number): ResolveFn<GenericListResponse<RoleType>> =>
  () => {
    const roleService = inject(ROLE_SERVICE_TOKEN);
    return roleService.getAll<GenericListResponse<RoleType>>({
      related: 'lookup_by_role_id',
      limit,
      sort: 'name',
    });
  };
