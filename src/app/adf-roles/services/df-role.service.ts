import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { GenericListResponse } from 'src/app/shared/types/generic-http.type';
import { URLS } from 'src/app/core/constants/urls';
import { SHOW_LOADING_HEADER } from 'src/app/core/constants/http-headers';
import { RoleType } from 'src/app/shared/types/role';

@Injectable()
export class DfRoleService {
  constructor(private http: HttpClient) {}

  getRoles(limit = 100, offset = 0, filter = '') {
    return this.http.get<GenericListResponse<RoleType>>(URLS.ROLES, {
      headers: SHOW_LOADING_HEADER,
      params: {
        include_count: true,
        limit,
        offset,
        related: 'lookup_by_role_id',
        filter,
      },
    });
  }

  getRole(id: string | number, tabs = false) {
    return this.http.get<RoleType>(`${URLS.ROLES}/${id}`, {
      headers: SHOW_LOADING_HEADER,
      params: {
        related: 'lookup_by_role_id',
        accessible_tabs: tabs,
      },
    });
  }

  deleteRole(id: string | number) {
    return this.http.delete(`${URLS.ROLES}/${id}`, {
      headers: SHOW_LOADING_HEADER,
    });
  }
}
