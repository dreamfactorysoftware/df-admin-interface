import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { AdminType } from '../../shared/types/user';
import { DfAdminService } from '../services/df-admin.service';
import { GenericListResponse } from 'src/app/shared/types/generic-http.type';

export const adminResolver: ResolveFn<
  GenericListResponse<Array<AdminType>> | AdminType
> = (route: ActivatedRouteSnapshot) => {
  const profileService = inject(DfAdminService);
  const id = route.paramMap.get('id');
  if (!id) {
    return profileService.getAdmins();
  }
  return profileService.getAdmin(id);
};
