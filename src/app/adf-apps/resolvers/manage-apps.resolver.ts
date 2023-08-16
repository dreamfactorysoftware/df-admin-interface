import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { AppType } from '../types/df-apps.types';
import { DfAppsService } from 'src/app/adf-apps/services/df-apps.service';
import { GenericListResponse } from 'src/app/shared/types/generic-http';

export const appsResolver: ResolveFn<
  GenericListResponse<Array<AppType>>
> = () => {
  const appsService = inject(DfAppsService);
  return appsService.getApps();
};
