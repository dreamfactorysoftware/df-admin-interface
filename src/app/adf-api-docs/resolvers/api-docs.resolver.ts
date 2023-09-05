import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { API_DOCS_SERVICE_TOKEN } from 'src/app/core/constants/tokens';
import { GenericListResponse } from 'src/app/shared/types/generic-http.type';
import { SystemServiceData } from 'src/app/adf-services/services/service-data.service';

export const apiDocsResolver: ResolveFn<
  GenericListResponse<SystemServiceData>
> = () => {
  return inject(API_DOCS_SERVICE_TOKEN).getAll<
    GenericListResponse<SystemServiceData>
  >({
    includeCount: true,
    limit: 100,
    related: 'service_doc_by_service_id',
  });
};
