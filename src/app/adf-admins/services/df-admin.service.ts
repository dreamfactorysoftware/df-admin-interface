import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { GenericListResponse } from 'src/app/shared/types/generic-http.type';
import { URLS } from 'src/app/core/constants/urls';
import { SHOW_LOADING_HEADER } from 'src/app/core/constants/http-headers';
import { AdminType } from 'src/app/shared/types/user';

@Injectable()
export class DfAdminService {
  constructor(private http: HttpClient) {}

  getAdmins(limit = 100) {
    return this.http.get<GenericListResponse<Array<AdminType>>>(
      URLS.SYSTEM_ADMIN,
      {
        headers: SHOW_LOADING_HEADER,
        params: {
          limit,
          include_count: true,
          related: 'lookup_by_user_id',
        },
      }
    );
  }
}
