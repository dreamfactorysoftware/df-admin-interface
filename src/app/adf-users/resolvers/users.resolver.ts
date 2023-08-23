import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { UserProfile } from '../../shared/types/user';
import { GenericListResponse } from 'src/app/shared/types/generic-http.type';
import { DfUserService } from '../services/df-user.service';

export const usersResolver: ResolveFn<
  GenericListResponse<Array<UserProfile>> | UserProfile
> = (route: ActivatedRouteSnapshot) => {
  const userService = inject(DfUserService);

  const id = route.paramMap.get('id');
  if (!id) {
    return userService.getAll();
  }
  return userService.get(id);
};
