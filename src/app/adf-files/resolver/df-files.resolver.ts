import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { Files } from '../../shared/types/files';
import { BASE_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';
import { catchError, of, switchMap } from 'rxjs';
import { emptyListWithError } from 'src/app/shared/utilities/app-error';
import { readAsText } from 'src/app/shared/utilities/file';

// Both list resolvers complete navigation on failure so the files table
// shell renders the error state with Retry.
export const entitiesResolver: ResolveFn<
  Files | ReturnType<typeof emptyListWithError>
> = (route: ActivatedRouteSnapshot) => {
  const type = route.data['type'];
  const crudService = inject(BASE_SERVICE_TOKEN);
  return crudService
    .get<Files>(type)
    .pipe(catchError(err => of(emptyListWithError(err))));
};

export const entityResolver: ResolveFn<any> = (
  route: ActivatedRouteSnapshot
) => {
  const entity = route.paramMap.get('entity') ?? '';
  const crudService = inject(BASE_SERVICE_TOKEN);
  const type = route.data['type'];
  return crudService
    .get(`${type}/${entity}`)
    .pipe(catchError(err => of(emptyListWithError(err))));
};

export const fileResolver: ResolveFn<any> = (route: ActivatedRouteSnapshot) => {
  const entity = route.paramMap.get('entity') ?? '';
  const crudService = inject(BASE_SERVICE_TOKEN);
  const type = route.data['type'];
  return crudService
    .downloadFile(`${type}/${entity}`)
    .pipe(switchMap(res => readAsText(res as Blob)));
};
