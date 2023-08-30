import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { GenericListResponse } from 'src/app/shared/types/generic-http.type';
import { inject } from '@angular/core';
import { LimitType } from 'src/app/shared/types/limit';
import { LIMIT_SERVICE_TOKEN } from 'src/app/core/constants/tokens';

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
    return limitsService.get<LimitType>(id, {
      related:
        'service_by_service_id,role_by_role_id,user_by_user_id,limit_cache_by_limit_id',
    });
  };
