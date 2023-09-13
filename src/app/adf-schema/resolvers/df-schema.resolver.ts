import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { GenericListResponse } from 'src/app/shared/types/generic-http.type';
import { inject } from '@angular/core';
import {
  BASE_SERVICE_TOKEN,
  SERVICES_SERVICE_TOKEN,
  SERVICE_TYPES_SERVICE_TOKEN,
} from '../../core/constants/tokens';
import { ServiceType } from 'src/app/shared/types/service';
import { Service } from 'bonjour';
import { TableDetailsType } from '../df-table-details/df-table-details.types';

export const schemaServiceTypeResolver: ResolveFn<
  GenericListResponse<Array<ServiceType>>
> = () => {
  return inject(SERVICE_TYPES_SERVICE_TOKEN).getAll();
};

export const schemaServiceResolver: ResolveFn<
  GenericListResponse<Array<Service>>
> = () => {
  return inject(SERVICES_SERVICE_TOKEN).getAll();
};

export const schemaResolver: ResolveFn<
  GenericListResponse<Array<{ name: string; label: string }>>
> = (route: ActivatedRouteSnapshot) => {
  const dbName = route.paramMap.get('name') as string;
  return inject(BASE_SERVICE_TOKEN).get(`${dbName}/_schema`, {
    fields: ['name', 'label'].join(','),
  });
};

export const DfTableDetailsResolver: ResolveFn<TableDetailsType> = (
  route: ActivatedRouteSnapshot
) => {
  const name = route.paramMap.get('name') ?? '';
  const id = route.paramMap.get('id') ?? '';
  const crudService = inject(BASE_SERVICE_TOKEN);
  return crudService.get<TableDetailsType>(
    `${name}/_schema/${id}?refresh=true`,
    {}
  );
};
