import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { UserProfile } from '../../shared/types/user';
import { DfAdminService } from '../services/df-admin.service';
import { GenericListResponse } from 'src/app/shared/types/generic-http.type';
import { map, of, switchMap } from 'rxjs';
import { DfRoleService } from 'src/app/adf-roles/services/df-role.service';

export const adminsResolver: ResolveFn<
  GenericListResponse<Array<UserProfile>> | UserProfile
> = (route: ActivatedRouteSnapshot) => {
  const adminService = inject(DfAdminService);
  const roleService = inject(DfRoleService);

  const id = route.paramMap.get('id');
  if (!id) {
    return adminService.getAll();
  }
  return adminService.get(id).pipe(
    switchMap(admin => {
      if (admin.userToAppToRoleByUserId.length > 0) {
        return roleService
          .getRole(admin.userToAppToRoleByUserId[0].roleId, true)
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
