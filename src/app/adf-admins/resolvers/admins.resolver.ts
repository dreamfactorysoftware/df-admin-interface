import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { UserProfile } from '../../shared/types/user';
import { GenericListResponse } from 'src/app/shared/types/generic-http';
import { map, of, switchMap } from 'rxjs';
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
      return crudService.getAll<GenericListResponse<UserProfile>>({
        limit,
        sort: 'name',
      });
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
