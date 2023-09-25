import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { forkJoin, map } from 'rxjs';
import { SERVICE_TYPE_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';
import { GenericListResponse } from 'src/app/shared/types/generic-http.type';
import { ServiceType } from 'src/app/shared/types/service';

export const serviceTypesResolver: ResolveFn<Array<ServiceType>> = (
  route: ActivatedRouteSnapshot
) => {
  const serviceTypeService = inject(SERVICE_TYPE_SERVICE_TOKEN);
  const groups: Array<string> = route.data['groups'];
  if (groups) {
    const filteredGroups = groups.map(grp =>
      serviceTypeService.getAll<GenericListResponse<ServiceType>>({
        additionalParams: [
          {
            key: 'group',
            value: grp,
          },
        ],
      })
    );
    return forkJoin(filteredGroups).pipe(
      map(groups => groups.map(group => group.resource).flat())
    );
  }
  return serviceTypeService
    .getAll<GenericListResponse<ServiceType>>()
    .pipe(map(groups => groups.resource));
};
