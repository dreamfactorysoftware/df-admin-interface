import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { EVENTS_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';
import { GenericListResponse } from 'src/app/shared/types/generic-http';

export const systemEventsResolver: ResolveFn<
  GenericListResponse<string>
> = () => {
  const service = inject(EVENTS_SERVICE_TOKEN);
  return service.getAll<GenericListResponse<string>>({
    additionalParams: [
      {
        key: 'as_list',
        value: true,
      },
    ],
  });
};
