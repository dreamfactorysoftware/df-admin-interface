import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { GenericListResponse } from 'src/app/shared/types/generic-http';
import { inject } from '@angular/core';
import { LimitType } from 'src/app/shared/types/limit';
import { LIMIT_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';

export const limitsResolver =
  (limit?: number): ResolveFn<GenericListResponse<LimitType> | LimitType> =>
  (route: ActivatedRouteSnapshot) => {
    const limitsService = inject(LIMIT_SERVICE_TOKEN);
    const id = route.paramMap.get('id');
    if (!id) {
      return limitsService.getAll({
        limit,
        sort: 'name',
        related: 'limit_cache_by_limit_id',
      });
    }
    return limitsService.get<LimitType>(id);
  };
