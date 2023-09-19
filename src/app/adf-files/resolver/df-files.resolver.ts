import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { Files } from '../df-files.types';
import { BASE_SERVICE_TOKEN } from 'src/app/core/constants/tokens';
import { map } from 'rxjs';

export const entitiesResolver: ResolveFn<Files> = (
  route: ActivatedRouteSnapshot
) => {
  const type = route.data['type'];
  const crudService = inject(BASE_SERVICE_TOKEN);
  return crudService.get(type);
};

export const entityResolver: ResolveFn<any> = (
  route: ActivatedRouteSnapshot
) => {
  const entity = route.paramMap.get('entity') ?? '';
  console.log('entity', entity);
  const crudService = inject(BASE_SERVICE_TOKEN);
  const type = route.data['type'];
  return crudService.get(`${type}/${entity}`);
};
