import { ResolveFn } from '@angular/router';

import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  DfServiceDataService,
  ServiceType,
  SystemServiceData,
} from '../services/service-data.service';
import { GenericListResponse } from 'src/app/shared/types/generic-http.type';

// TODO: refactor the service data service to extend the base crud service factory

export const getSystemServiceDataResolver: ResolveFn<
  Observable<SystemServiceData>
> = route => {
  const id = Number(route.paramMap.get('id'));
  return inject(DfServiceDataService).getSystemServiceData(id);
};

export const getSystemServiceDataListResolver: ResolveFn<
  GenericListResponse<SystemServiceData>
> = () => {
  return inject(DfServiceDataService).getSystemServiceDataList();
};

export const getServiceTypeDataResolver: ResolveFn<
  GenericListResponse<ServiceType>
> = () => {
  return inject(DfServiceDataService).getServiceTypes();
};
