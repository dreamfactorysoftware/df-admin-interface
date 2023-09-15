import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { Files } from '../df-files.types';
import { FILE_SERVICE_TOKEN } from 'src/app/core/constants/tokens';
import { map } from 'rxjs';

export const entitiesResolver: ResolveFn<Files> = () => {
  const crudService = inject(FILE_SERVICE_TOKEN);
  return crudService.getAll<Files>();
};

export const entityResolver: ResolveFn<any> = (
  route: ActivatedRouteSnapshot
) => {
  const entity = route.paramMap.get('entity') ?? '';
  const crudService = inject(FILE_SERVICE_TOKEN);
  return crudService
    .get(`${entity}`, {
      limit: 0,
    })
    .pipe(
      map((response: any) => {
        const type = response.resource ? 'folder' : 'file';
        if (type === 'folder') {
          return {
            type,
            ...response,
          };
        }
        return {
          type,
          data: response,
        };
      })
    );
};
