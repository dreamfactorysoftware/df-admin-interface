import { ActivatedRouteSnapshot, ResolveFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { UserProfile } from '../../shared/types/user';
import { GenericListResponse } from 'src/app/shared/types/generic-http.type';
import {
  DF_APPS_SERVICE_TOKEN,
  DF_ROLE_SERVICE_TOKEN,
  DF_USER_SERVICE_TOKEN,
} from 'src/app/core/constants/tokens';
import { AppType } from 'src/app/adf-apps/types/df-apps.types';
import { RoleType } from 'src/app/shared/types/role';

export const userResolver: ResolveFn<UserProfile | undefined> = (
  route: ActivatedRouteSnapshot
) => {
  const userService = inject(DF_USER_SERVICE_TOKEN);
  const router = inject(Router);

  const id = route.paramMap.get('id');
  if (!id) {
    // TODO: add 404 page
    router.navigate(['/']);
    return;
  }
  return userService.get(id, {
    related: 'lookup_by_user_id,user_to_app_to_role_by_user_id',
  });
};

export const usersResolver: ResolveFn<
  GenericListResponse<UserProfile>
> = () => {
  const userService = inject(DF_USER_SERVICE_TOKEN);
  return userService.getAll();
};

export const userAppsResolver: ResolveFn<GenericListResponse<AppType>> = () => {
  const appService = inject(DF_APPS_SERVICE_TOKEN);
  return appService.getAll<GenericListResponse<AppType>>({
    limit: 0,
    sort: 'name',
  });
};

export const rolesResolver: ResolveFn<GenericListResponse<RoleType>> = () => {
  const roleService = inject(DF_ROLE_SERVICE_TOKEN);
  return roleService.getAll<GenericListResponse<RoleType>>({
    limit: 0,
    sort: 'name',
  });
};
