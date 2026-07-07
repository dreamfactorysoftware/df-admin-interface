import { ResolveFn } from '@angular/router';
import { catchError, of } from 'rxjs';
import { GenericListResponse } from 'src/app/shared/types/generic-http';
import { CacheType } from '../../shared/types/df-cache';
import { emptyListWithError } from 'src/app/shared/utilities/app-error';
import { inject } from '@angular/core';
import { CACHE_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';

export const DfCacheResolver: ResolveFn<
  GenericListResponse<CacheType>
> = () => {
  const cacheService = inject(CACHE_SERVICE_TOKEN);
  return cacheService
    .getAll<GenericListResponse<CacheType>>({
      fields: '*',
    })
    .pipe(catchError(err => of(emptyListWithError(err))));
};
