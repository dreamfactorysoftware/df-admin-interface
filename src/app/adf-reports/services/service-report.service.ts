import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { URLS } from 'src/app/core/constants/urls';
import { GenericListResponse } from 'src/app/shared/types/generic-http.type';

export type ServiceReportData = {
  id: number;
  serviceId: number | null;
  serviceName: string;
  userEmail: string;
  action: string;
  requestVerb: string;
  createdDate: string;
  lastModifiedDate: string;
};

@Injectable()
export class DfServiceReportService {
  constructor(private http: HttpClient) {}

  getServiceReports(limit = 100, offset = 0, filter = '') {
    return this.http.get<GenericListResponse<Array<ServiceReportData>>>(
      URLS.SERVICE_REPORT,
      {
        params: {
          include_count: true,
          limit,
          offset,
          filter,
        },
      }
    );
  }
}
