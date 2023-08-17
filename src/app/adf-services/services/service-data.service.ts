import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { URLS } from 'src/app/core/constants/urls';
import { GenericListResponse } from 'src/app/shared/types/generic-http.type';

@Injectable({
  providedIn: 'root',
})
export class ServiceDataService {
  constructor(private http: HttpClient) {}

  getSystemServiceData(limit = 10, offset = 0) {
    return this.http.get<GenericListResponse<Array<SystemServiceData>>>(
      URLS.SYSTEM_SERVICE,
      {
        params: {
          limit,
          offset,
          include_count: true,
          related: 'service_doc_by_service_id',
        },
      }
    );
  }

  getServiceTypes() {
    return this.http.get<GenericListResponse<Array<ServiceType>>>(
      URLS.SERVICE_TYPE
    );
  }

  createService(newService: SystemServiceData) {
    const body = JSON.stringify({
      resource: [newService],
    });

    return this.http.post<SystemServiceData>(URLS.SYSTEM_SERVICE, body, {
      params: { fields: '*', related: 'service_doc_by_service_id' },
    });
  }

  updateServiceData(updatedObject: SystemServiceData) {
    return this.http.put<SystemServiceData>(
      `${URLS.SYSTEM_SERVICE}/${updatedObject.id}`,
      updatedObject,
      {
        params: { fields: '*', related: 'service_doc_by_service_id' },
      }
    );
  }

  deleteServiceData(id: number) {
    return this.http.delete<DeleteServiceResponse>(
      `${URLS.SYSTEM_SERVICE}/${id}`
    );
  }

  deleteMultipleServiceData(ids: number[]) {
    return this.http.delete<GroupDeleteServiceResponse>(URLS.SYSTEM_SERVICE, {
      params: {
        ids: ids.join(','),
      },
    });
  }
}

export interface DeleteServiceResponse {
  id: number;
}

export interface GroupDeleteServiceResponse {
  resource: { id: number }[];
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

export interface SystemServiceData {
  id: number;
  name: string;
  label: string;
  description: string;
  isActive: boolean;
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
