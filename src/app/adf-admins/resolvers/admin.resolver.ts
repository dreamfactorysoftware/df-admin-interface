import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { AdminType } from '../../shared/types/user';
import { DfAdminService } from '../services/df-admin.service';
import { GenericListResponse } from 'src/app/shared/types/generic-http.type';

export const adminResolver: ResolveFn<
  GenericListResponse<Array<AdminType>>
> = () => {
  const profileService = inject(DfAdminService);
  return profileService.getAdmins();
};
