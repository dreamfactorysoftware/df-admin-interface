import { ResolveFn } from '@angular/router';
import { GenericListResponse } from 'src/app/shared/types/generic-http.type';
import { CacheType } from '../df-cache/df-cache.types';
import { inject } from '@angular/core';
import { CACHE_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';

export const DfCacheResolver: ResolveFn<
  GenericListResponse<CacheType>
> = () => {
  const cacheService = inject(CACHE_SERVICE_TOKEN);
  return cacheService.getAll<GenericListResponse<CacheType>>({
    fields: '*',
  });
};
