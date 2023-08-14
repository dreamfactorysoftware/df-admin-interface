import { ResolveFn } from '@angular/router';
import {
  ServiceDataService,
  SystemServiceDataResponse,
} from '../services/service-data.service';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';

export const getSystemServiceDataResolver: ResolveFn<
  Observable<SystemServiceDataResponse>
> = (route, state) => {
  return inject(ServiceDataService).getSystemServiceData();
};
