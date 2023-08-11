import { HttpClient } from '@angular/common/http';
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

  constructor(private http: HttpClient) {}

  getSystemServiceData() {
    console.log('system service data invoked!'); // TODO: remove this line
    return this.http
      .get<SystemServiceDataResponse>(URLS.SYSTEM_SERVICE)
      .subscribe(data => {
        this.systemServiceData = data;
        console.log('data: ', data); // TODO: remove this line as well
        return data;
      });
  }

  get systemServiceData(): SystemServiceDataResponse | null {
    return this.systemServiceDataSubject.value;
  }

  set systemServiceData(systemServiceData: SystemServiceDataResponse | null) {
    this.systemServiceDataSubject.next(systemServiceData);
  }
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
