import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { GenericListResponse } from 'src/app/shared/types/generic-http.type';
import { DfRoleService } from '../services/df-role.service';
import { RoleType } from 'src/app/shared/types/role';

export const roleResolver: ResolveFn<
  GenericListResponse<Array<RoleType>> | RoleType
> = (route: ActivatedRouteSnapshot) => {
  const roleService = inject(DfRoleService);
  const id = route.paramMap.get('id');
  if (!id) {
    return roleService.getRoles();
  }
  return roleService.getRole(id);
};

export const getRolesResolver: ResolveFn<
  GenericListResponse<Array<RoleType>>
> = () => {
  const roleService = inject(DfRoleService);
  return roleService.getRoles();
};
