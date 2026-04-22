import { EVENTS_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';
import { inject } from '@angular/core';
import { GenericListResponse } from 'src/app/shared/types/generic-http';
import { ResolveFn } from '@angular/router';

export const eventsResolver: ResolveFn<GenericListResponse<string>> = () => {
  const eventService = inject(EVENTS_SERVICE_TOKEN);

  return eventService.getAll<GenericListResponse<string>>({
    additionalParams: [
      {
        key: 'services_only',
        value: true,
      },
    ],
    limit: 0,
    includeCount: false,
  });
};
