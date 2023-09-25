import { ResolveFn } from '@angular/router';
import { GenericListResponse } from 'src/app/shared/types/generic-http.type';
import { inject } from '@angular/core';
import { LOOKUP_KEYS_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';
import { LookupKeyType } from '../df-global-lookup-keys/df-global-lookup-keys.types';

export const DfGlobalLookupKeysResolver: ResolveFn<
  GenericListResponse<LookupKeyType>
> = () => {
  const lookupKeysService = inject(LOOKUP_KEYS_SERVICE_TOKEN);
  return lookupKeysService.getAll<GenericListResponse<LookupKeyType>>();
};
