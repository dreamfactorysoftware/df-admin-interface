import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { DfSystemConfigDataService } from 'src/app/shared/services/df-system-config-data.service';
export const DfSystemInfoResolver: ResolveFn<any> = () => {
  const systemService = inject(DfSystemConfigDataService);
  return systemService.environment;
};
