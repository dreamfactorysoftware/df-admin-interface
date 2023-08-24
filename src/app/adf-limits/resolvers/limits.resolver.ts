import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { GenericListResponse } from 'src/app/shared/types/generic-http.type';
import { DfLimitsService } from '../services/df-limits.service';
import { inject } from '@angular/core';
import { LimitType } from 'src/app/shared/types/limit';

export const limitsResolver: ResolveFn<
  GenericListResponse<Array<LimitType>> | LimitType
> = (route: ActivatedRouteSnapshot) => {
  const limitsService = inject(DfLimitsService);
  const id = route.paramMap.get('id');
  if (!id) {
    return limitsService.getLimits();
  }
  return limitsService.getLimit(id);
};
