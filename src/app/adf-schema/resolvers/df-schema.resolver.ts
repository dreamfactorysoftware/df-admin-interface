import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { GenericListResponse } from 'src/app/shared/types/generic-http.type';
import { inject } from '@angular/core';
import { BASE_SERVICE_TOKEN } from '../../shared/constants/tokens';

import {
  TableDetailsType,
  TableField,
} from '../df-table-details/df-table-details.types';

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

export const DfTableFieldResolver: ResolveFn<
  GenericListResponse<Array<TableField>>
> = (route: ActivatedRouteSnapshot) => {
  const name = route.paramMap.get('name') ?? '';
  const id = route.paramMap.get('id') ?? '';
  const crudService = inject(BASE_SERVICE_TOKEN);
  return crudService.get(`${name}/_schema/${id}/_field`, {});
};

export const DfTableRelationshipsEditResolver: ResolveFn<
  GenericListResponse<Array<TableField>>
> = (route: ActivatedRouteSnapshot) => {
  const name = route.paramMap.get('name') ?? '';
  const id = route.paramMap.get('id') ?? '';
  const relName = route.paramMap.get('relName') ?? '';
  const crudService = inject(BASE_SERVICE_TOKEN);
  return crudService.get(`${name}/_schema/${id}/_related/${relName}`, {});
};
