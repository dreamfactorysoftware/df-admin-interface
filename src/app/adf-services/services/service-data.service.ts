import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { URLS } from 'src/app/core/constants/urls';
import { GenericListResponse } from 'src/app/shared/types/generic-http.type';

@Injectable()
export class DfServiceDataService {
  constructor(private http: HttpClient) {}

  getSystemServiceData(id: number) {
    const url = URLS.SYSTEM_SERVICE + `/${id}`;
    return this.http.get<SystemServiceData>(url);
  }

  getSystemServiceDataList(limit = 10, offset = 0, filter = '') {
    return this.http.get<GenericListResponse<SystemServiceData>>(
      URLS.SYSTEM_SERVICE,
      {
        params: {
          limit,
          offset,
          filter,
          include_count: true,
          related: 'service_doc_by_service_id',
        },
      }
    );
  }

  getServiceTypes() {
    return this.http.get<GenericListResponse<ServiceType>>(URLS.SERVICE_TYPE);
  }

  createService(newService: Partial<SystemServiceData>) {
    const body = {
      resource: [newService],
    };

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

// TODO: remove and refactor components that use this
export interface ServiceType {
  dependenciesRequired: null;
  description: string;
  group: string;
  label: string;
  name: string;
  serviceDefinitionEditable: boolean;
  singleton: boolean;
  subscriptionRequired: string;
  configSchema: any[];
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
  createdDate: string;
  lastModifiedDate: string;
  createdById: number | null;
  lastModifiedById: number | null;
  config: any;
  serviceDocByServiceId: number | null;
}
