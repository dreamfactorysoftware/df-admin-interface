import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { forkJoin, map, switchMap } from 'rxjs';
import {
  SERVICES_SERVICE_TOKEN,
  SERVICE_TYPE_SERVICE_TOKEN,
} from 'src/app/core/constants/tokens';
import {
  GenericListResponse,
  Meta,
} from 'src/app/shared/types/generic-http.type';
import { Service, ServiceType } from 'src/app/shared/types/service';

export const servicesResolver =
  (
    limit?: number,
    filter?: string
  ): ResolveFn<{
    resource: Array<Service>;
    meta?: Meta;
    serviceTypes?: Array<ServiceType>;
  }> =>
  (route: ActivatedRouteSnapshot) => {
    const serviceTypeService = inject(SERVICE_TYPE_SERVICE_TOKEN);
    const servicesService = inject(SERVICES_SERVICE_TOKEN);

    const system: boolean = route.data['system'];
    const groups: Array<string> = route.data['groups'];

    if (groups) {
      const filteredGroups = groups.map(grp =>
        serviceTypeService.getAll<GenericListResponse<ServiceType>>({
          fields: 'name',
          additionalParams: [
            {
              key: 'group',
              value: grp,
            },
          ],
        })
      );
      return forkJoin(filteredGroups).pipe(
        map(groups => groups.map(group => group.resource).flat()),
        switchMap(serviceTypes => {
          return servicesService
            .getAll<GenericListResponse<Service>>({
              limit,
              sort: 'name',
              filter: `(created_by_id is not null) and (type in ("${serviceTypes
                .map(src => src.name)
                .join('","')}"))${filter ? ` and ${filter}` : ''}`,
            })
            .pipe(
              map(services => ({
                ...services,
                serviceTypes,
              }))
            );
        })
      );
    }

    return servicesService
      .getAll<GenericListResponse<Service>>({
        limit,
        sort: 'name',
        filter: `${system ? '(created_by_id is null)' : ''}${
          filter ? filter : ''
        }`,
      })
      .pipe(map(services => ({ ...services })));
  };

export const serviceResolver: ResolveFn<Service | undefined> = (
  route: ActivatedRouteSnapshot
) => {
  const servicesService = inject(SERVICES_SERVICE_TOKEN);
  const id = route.paramMap.get('id');
  if (!id) {
    return;
  }
  return servicesService.get<Service>(id, {
    related: 'service_doc_by_service_id',
  });
};
