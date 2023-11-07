import { ResolveFn } from '@angular/router';
import { GenericListResponse } from 'src/app/shared/types/generic-http';
import { inject } from '@angular/core';
import { LOOKUP_KEYS_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';
import { LookupKeyType } from '../../shared/types/global-lookup-keys';

export const DfGlobalLookupKeysResolver: ResolveFn<
  GenericListResponse<LookupKeyType>
> = () => {
  const lookupKeysService = inject(LOOKUP_KEYS_SERVICE_TOKEN);
  return lookupKeysService.getAll<GenericListResponse<LookupKeyType>>();
};
