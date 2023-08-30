import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { DfSystemConfigDataService } from 'src/app/core/services/df-system-config-data.service';
export const systemInfoResolver: ResolveFn<any> = () => {
  const systemService = inject(DfSystemConfigDataService);
  return systemService.environment;
};
