import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { GenericListResponse } from 'src/app/shared/types/generic-http';
import { inject } from '@angular/core';
import { LimitType } from 'src/app/shared/types/limit';
import { LIMIT_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';
import { DfPaywallService } from 'src/app/shared/services/df-paywall.service';
import { of, switchMap } from 'rxjs';

export const limitsResolver =
  (
    limit?: number
  ): ResolveFn<GenericListResponse<LimitType> | LimitType | string> =>
  (route: ActivatedRouteSnapshot) => {
    const paywallService = inject(DfPaywallService);
    const limitsService = inject(LIMIT_SERVICE_TOKEN);
    return paywallService.activatePaywall('limit').pipe(
      switchMap(activated => {
        if (activated) {
          return of('paywall');
        } else {
          const id = route.paramMap.get('id');
          if (!id) {
            return limitsService.getAll<GenericListResponse<LimitType>>({
              limit,
              sort: 'name',
              related: 'limit_cache_by_limit_id',
            });
          }
          return limitsService.get<LimitType>(id);
        }
      })
    );
  };
