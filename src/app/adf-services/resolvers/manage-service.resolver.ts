import { ResolveFn } from '@angular/router';

import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ServiceDataService,
  SystemServiceData,
} from '../services/service-data.service';
import { GenericListResponse } from 'src/app/shared/types/generic-http.type';

export const getSystemServiceDataResolver: ResolveFn<
  Observable<GenericListResponse<Array<SystemServiceData>>>
> = (route, state) => {
  return inject(ServiceDataService).getSystemServiceData();
};
