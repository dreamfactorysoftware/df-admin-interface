import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { GenericListResponse } from 'src/app/shared/types/generic-http.type';
import { ServiceType } from 'src/app/shared/types/service';
import { URLS } from '../constants/urls';
import { SHOW_LOADING_HEADER } from '../constants/http-headers';

@Injectable({
  providedIn: 'root',
})
export class DfServiceTypesService {
  private serviceTypesSubject = new BehaviorSubject<Array<ServiceType>>([]);
  serviceTypes$: Observable<Array<ServiceType>> =
    this.serviceTypesSubject.asObservable();
  constructor(private http: HttpClient) {}

  get serviceTypes(): Array<ServiceType> {
    return this.serviceTypesSubject.value;
  }
  set serviceTypes(data: Array<ServiceType>) {
    this.serviceTypesSubject.next(data);
  }

  fetchServiceTypes() {
    return this.http
      .get<GenericListResponse<ServiceType>>(URLS.SERVICE_TYPE, {
        headers: SHOW_LOADING_HEADER,
      })
      .pipe(
        tap(({ resource }) => {
          this.serviceTypes = resource;
        })
      );
  }

  getServiceTypeByGroup(groups: Array<string>) {
    return this.serviceTypes.filter(({ group }) => groups.includes(group));
  }
}
