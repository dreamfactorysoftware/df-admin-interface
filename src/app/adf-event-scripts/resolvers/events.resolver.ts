import { EVENTS_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';
import { ScriptObject } from '../../shared/types/scripts';
import { inject } from '@angular/core';
import { GenericListResponse } from 'src/app/shared/types/generic-http';
import { ResolveFn } from '@angular/router';

export const eventsResolver: ResolveFn<
  GenericListResponse<ScriptObject>
> = () => {
  return inject(EVENTS_SERVICE_TOKEN).getAll({
    additionalParams: [
      {
        key: 'scriptable',
        value: true,
      },
    ],
    limit: 0,
    includeCount: false,
  });
};
