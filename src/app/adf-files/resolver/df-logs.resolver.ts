import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { Files } from '../df-files.types';
import { LOGS_SERVICE_TOKEN } from 'src/app/core/constants/tokens';
import { map } from 'rxjs';

export const logsEntitiesResolver: ResolveFn<Files> = () => {
  const crudService = inject(LOGS_SERVICE_TOKEN);
  return crudService.getAll<Files>({ limit: 0 });
};

export const logsEntityResolver: ResolveFn<any> = (
  route: ActivatedRouteSnapshot
) => {
  const entity = route.paramMap.get('entity') ?? '';
  const crudService = inject(LOGS_SERVICE_TOKEN);
  const file = route.queryParams['file'];
  if (file === 'true') {
    return crudService.getText(`${entity}`).pipe(
      map((response: any) => {
        return {
          type: 'file',
          data: response,
        };
      })
    );
  }
  return crudService.get(entity, { limit: 0 }).pipe(
    map((response: any) => {
      return {
        type: 'folder',
        ...response,
      };
    })
  );
};
