import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { URLS } from '../../core/constants/urls';
import { GenericListResponse } from 'src/app/shared/types/generic-http';
import { SHOW_LOADING_HEADER } from 'src/app/core/constants/http-headers';
import { AppType } from '../types/df-apps.types';

@Injectable()
export class DfAppsService {
  constructor(private http: HttpClient) {}

  getApps(limit = 100, offset = 0, filter = '') {
    console.log('getApps');
    return this.http.get<GenericListResponse<Array<AppType>>>(URLS.APP, {
      headers: SHOW_LOADING_HEADER,
      params: {
        include_count: true,
        limit,
        offset,
        related: 'role_by_role_id',
        filter,
      },
    });
  }

  // endpoint?fields=*&related=role_by_role_id
  // createApp(app: NewApp) {
  // GET Roles
  //   const resource: NewApp[] = [{ ...app }];
  //   this.http.post(URLS.APP, resource).subscribe(data => console.log(data));
  // }

  // endpoint/${id}
  // editApp(app: App) {
  //  GET Roles
  //   this.http.put(URLS.APP + app.id, app).subscribe(data => console.log(data));
  // }

  deleteApp() {
    const endpoint =
      'http://localhost/api/v2/system/app/5?delete_storage=false&fields=*&related=role_by_role_id';
  }

  deleteMultipleApps() {
    // check if apps have storage
    // /api/v2/system/app?delete_storage=true&fields=*&ids=6,7
  }
}
