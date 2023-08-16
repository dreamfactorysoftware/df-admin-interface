import { ResolveFn } from '@angular/router';

import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  SystemServiceDataResponse,
  ServiceDataService,
} from '../services/service-data.service';

export const getSystemServiceDataResolver: ResolveFn<
  Observable<SystemServiceDataResponse>
> = (route, state) => {
  return inject(ServiceDataService).getSystemServiceData();
};
