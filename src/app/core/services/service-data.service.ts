import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { URLS } from '../constants/urls';

@Injectable({
  providedIn: 'root',
})
export class ServiceDataService {
  private systemServiceDataSubject =
    new BehaviorSubject<SystemServiceDataResponse | null>(null);
  systemServiceData$ = this.systemServiceDataSubject.asObservable();

  private serviceTypeDataSubject =
    new BehaviorSubject<ServiceTypeResponse | null>(null);
  serviceTypeData$ = this.serviceTypeDataSubject.asObservable();

  constructor(private http: HttpClient) {}

  getSystemServiceData() {
    return this.http
      .get<SystemServiceDataResponse>(URLS.SYSTEM_SERVICE, {
        params: {
          include_count: true,
          limit: 100,
          related: 'service_doc_by_service_id',
        },
      })
      .subscribe(data => {
        this.systemServiceData = data;
        return data;
      });
  }

  getServiceTypes() {
    return this.http
      .get<ServiceTypeResponse>(URLS.SERVICE_TYPE)
      .subscribe(data => {
        this.serviceTypeData = data;
        return data;
      });
  }

  get serviceTypeData(): ServiceTypeResponse | null {
    return this.serviceTypeDataSubject.value;
  }

  set serviceTypeData(serviceTypeData: ServiceTypeResponse | null) {
    this.serviceTypeDataSubject.next(serviceTypeData);
  }

  get systemServiceData(): SystemServiceDataResponse | null {
    return this.systemServiceDataSubject.value;
  }

  set systemServiceData(systemServiceData: SystemServiceDataResponse | null) {
    this.systemServiceDataSubject.next(systemServiceData);
  }
}

export interface ServiceTypeResponse {
  resource: ServiceType[];
}

export interface ServiceType {
  dependencies_required: null;
  description: string;
  group: string;
  label: string;
  name: string;
  service_definition_editable: boolean;
  singleton: boolean;
  subscription_required: string;
  config_schema: object[];
}

export interface SystemServiceDataResponse {
  meta: { count: number };
  resource: SystemServiceData[];
}

export interface SystemServiceData {
  id: number;
  name: string;
  label: string;
  description: string;
  is_active: boolean;
  type: string;
  mutable: boolean;
  deletable: boolean;
  created_date: string;
  last_modified_date: string;
  created_by_id: number | null;
  last_modified_by_id: number | null;
  config: object;
  service_doc_by_service_id: number | null;
}
