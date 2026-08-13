import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { UserProfile } from '../../shared/types/user';
import { GenericListResponse } from 'src/app/shared/types/generic-http';
import { catchError, map, of, switchMap } from 'rxjs';
import { emptyListWithError } from 'src/app/shared/utilities/app-error';
import {
  ADMIN_SERVICE_TOKEN,
  ROLE_SERVICE_TOKEN,
} from 'src/app/shared/constants/tokens';
import { RoleType } from 'src/app/shared/types/role';

export const adminsResolver =
  (limit?: number): ResolveFn<GenericListResponse<UserProfile> | UserProfile> =>
  (route: ActivatedRouteSnapshot) => {
    const crudService = inject(ADMIN_SERVICE_TOKEN);
    const roleService = inject(ROLE_SERVICE_TOKEN);

    const id = route.paramMap.get('id');
    if (!id) {
      // List branch only: complete navigation on failure so the table shell
      // renders the error state with Retry (a throwing resolver cancels
      // navigation with zero feedback). The detail branch below keeps its
      // own error contract; do not blanket-catch it with a list shape.
      return crudService
        .getAll<GenericListResponse<UserProfile>>({
          limit,
          sort: 'name',
        })
        .pipe(catchError(err => of(emptyListWithError(err))));
    }
    return crudService
      .get<UserProfile>(id, {
        related: 'user_to_app_to_role_by_user_id,lookup_by_user_id',
      })
      .pipe(
        switchMap(admin => {
          if (admin.userToAppToRoleByUserId.length > 0) {
            return roleService
              .get<RoleType>(admin.userToAppToRoleByUserId[0].roleId, {
                related: 'lookup_by_role_id',
                additionalParams: [
                  {
                    key: 'accessible_tabs',
                    value: true,
                  },
                ],
              })
              .pipe(
                map(role => {
                  admin.role = role;
                  return admin;
                })
              );
          } else {
            return of(admin);
          }
        })
      );
  };
