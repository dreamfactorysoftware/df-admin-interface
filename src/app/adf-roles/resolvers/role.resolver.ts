import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { GenericListResponse } from 'src/app/shared/types/generic-http';
import { RoleType } from 'src/app/shared/types/role';
import { ROLE_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';
import { catchError, of } from 'rxjs';
import { emptyListWithError } from 'src/app/shared/utilities/app-error';

export const roleResolver: ResolveFn<RoleType | undefined> = (
  route: ActivatedRouteSnapshot
) => {
  const roleService = inject(ROLE_SERVICE_TOKEN);
  const id = route.paramMap.get('id');
  if (!id) {
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
    // List resolver: complete navigation on failure so the table shell
    // renders the error state with Retry. roleResolver above (detail) keeps
    // its own error contract.
    return roleService
      .getAll<GenericListResponse<RoleType>>({
        related: 'lookup_by_role_id',
        limit,
        sort: 'name',
      })
      .pipe(catchError(err => of(emptyListWithError(err))));
  };
