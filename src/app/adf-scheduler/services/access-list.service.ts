import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BASE_URL } from 'src/app/core/constants/urls';

@Injectable()
export class DfAccessListService {
  constructor(private http: HttpClient) {}

  getServiceAccessList(serviceName: string) {
    const url = `${BASE_URL}/${serviceName}`;
    return this.http.get<AccessListResponse>(url, {
      params: {
        as_access_list: true,
      },
    });
  }
}

type AccessListResponse = {
  resource: string[];
};
