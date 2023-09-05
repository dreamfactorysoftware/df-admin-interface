import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { API_DOCS_SERVICE_TOKEN } from 'src/app/core/constants/tokens';
import { GenericListResponse } from 'src/app/shared/types/generic-http.type';
import { SystemServiceData } from 'src/app/adf-services/services/service-data.service';
import { DfApiDocsService } from '../services/df-api-docs.service';

export const systemServiceDataResolver: ResolveFn<
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

export const apiDocsResolver: ResolveFn<any> = (
  route: ActivatedRouteSnapshot
) => {
  const serviceName = route.paramMap.get('name') as string;
  return inject(DfApiDocsService).getApiDocs(serviceName);
};
