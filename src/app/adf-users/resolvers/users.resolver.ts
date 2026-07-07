import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { UserProfile } from '../../shared/types/user';
import { GenericListResponse } from 'src/app/shared/types/generic-http';
import { USER_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';
import { catchError, of } from 'rxjs';
import { emptyListWithError } from 'src/app/shared/utilities/app-error';

export const userResolver: ResolveFn<UserProfile | undefined> = (
  route: ActivatedRouteSnapshot
) => {
  const userService = inject(USER_SERVICE_TOKEN);
  const id = route.paramMap.get('id');
  if (!id) {
    return;
  }
  return userService.get<UserProfile>(id, {
    related: 'lookup_by_user_id,user_to_app_to_role_by_user_id',
  });
};

export const usersResolver =
  (limit?: number): ResolveFn<GenericListResponse<UserProfile>> =>
  () => {
    const userService = inject(USER_SERVICE_TOKEN);
    // List resolver: complete navigation on failure so the table shell
    // renders the error state with Retry. userResolver above (detail) keeps
    // its own error contract.
    return userService
      .getAll<GenericListResponse<UserProfile>>({
        limit,
        sort: 'name',
      })
      .pipe(catchError(err => of(emptyListWithError(err))));
  };
