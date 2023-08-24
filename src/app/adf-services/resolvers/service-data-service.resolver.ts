import { ResolveFn } from '@angular/router';

import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  DfServiceDataService,
  ServiceType,
  SystemServiceData,
} from '../services/service-data.service';
import { GenericListResponse } from 'src/app/shared/types/generic-http.type';

export const getSystemServiceDataResolver: ResolveFn<
  Observable<SystemServiceData>
> = (route, _state) => {
  const id = Number(route.paramMap.get('id'));
  return inject(DfServiceDataService).getSystemServiceData(id);
};

export const getSystemServiceDataListResolver: ResolveFn<
  Observable<GenericListResponse<Array<SystemServiceData>>>
> = (_route, _state) => {
  return inject(DfServiceDataService).getSystemServiceDataList();
};

export const getServiceTypeDataResolver: ResolveFn<
  Observable<GenericListResponse<Array<ServiceType>>>
> = (_route, _state) => {
  return inject(DfServiceDataService).getServiceTypes();
};
