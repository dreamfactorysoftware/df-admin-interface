import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { UserProfile } from '../../shared/types/user';
import { GenericListResponse } from 'src/app/shared/types/generic-http.type';
import { DF_USER_SERVICE_TOKEN } from 'src/app/core/constants/tokens';

export const usersResolver: ResolveFn<
  GenericListResponse<Array<UserProfile>> | UserProfile
> = (route: ActivatedRouteSnapshot) => {
  const userService = inject(DF_USER_SERVICE_TOKEN);

  const id = route.paramMap.get('id');
  if (!id) {
    return userService.getAll();
  }
  return userService.get(id);
};

export const getUsersResolver: ResolveFn<
  GenericListResponse<Array<UserProfile>> | UserProfile
> = (route: ActivatedRouteSnapshot) => {
  const userService = inject(DF_USER_SERVICE_TOKEN);
  return userService.getAll();
};
