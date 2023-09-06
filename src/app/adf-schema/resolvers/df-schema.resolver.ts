import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { GenericListResponse } from 'src/app/shared/types/generic-http.type';
import {
  ServiceType,
  SystemServiceData,
} from '../../adf-services/services.types';
import { inject } from '@angular/core';
import {
  SERVICES_SERVICE_TOKEN,
  SERVICE_TYPES_SERVICE_TOKEN,
} from '../../core/constants/tokens';
import { DfDatabaseSchemaService } from '../services/df-database-schema.service';

export const schemaServiceTypeResolver: ResolveFn<
  GenericListResponse<Array<ServiceType>>
> = () => {
  return inject(SERVICE_TYPES_SERVICE_TOKEN).getAll();
};

export const schemaServiceResolver: ResolveFn<
  GenericListResponse<Array<SystemServiceData>>
> = () => {
  return inject(SERVICES_SERVICE_TOKEN).getAll();
};

// TODO: change type here from any to appropriate type
export const schemaResolver: ResolveFn<any> = (
  route: ActivatedRouteSnapshot
) => {
  const name = route.paramMap.get('name') as string;
  return inject(DfDatabaseSchemaService).getDatabaseSchemas(name);
};
