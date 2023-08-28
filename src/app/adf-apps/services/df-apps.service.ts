import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { URLS } from '../../core/constants/urls';
import { GenericListResponse } from 'src/app/shared/types/generic-http.type';
import { SHOW_LOADING_HEADER } from 'src/app/core/constants/http-headers';
import { AppType, EditAppPayload, AppPayload } from '../types/df-apps.types';

@Injectable()
export class DfAppsService {
  constructor(private http: HttpClient) {}

  getApps(limit = 100, offset = 0, filter = '') {
    return this.http.get<GenericListResponse<AppType>>(URLS.APP, {
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

  getApp(id: string | number) {
    return this.http.get<GenericListResponse<AppType>>(`${URLS.APP}/${id}`, {
      headers: SHOW_LOADING_HEADER,
      params: {
        fields: '*',
        related: 'role_by_role_id',
      },
    });
  }

  createApp(app: AppPayload) {
    this.http
      .post(
        URLS.APP,
        { resource: [{ ...app }] },
        {
          params: {
            fields: '*',
            related: 'role_by_role_id',
          },
        }
      )
      .subscribe(data => console.log('create response', data));
  }

  editApp(app: EditAppPayload) {
    this.http
      .put(`${URLS.APP}/${app.id}`, app, {
        params: {
          fields: '*',
          related: 'role_by_role_id',
        },
      })
      .subscribe(data => console.log(data));
  }

  deleteApp(id: string | number) {
    return this.http.delete(`${URLS.APP}/${id}`, {
      headers: SHOW_LOADING_HEADER,
      params: {
        delete_storage: false,
        fields: '*',
        related: 'role_by_role_id',
      },
    });
  }

  getRoles() {
    return this.http.get('/api/v2/system/role', {
      headers: SHOW_LOADING_HEADER,
      params: {
        include_count: true,
        limit: 10000,
        offset: 0,
        related: 'role_service_access_by_role_id,lookup_by_role_id',
      },
    });
  }

  importApp(
    import_url: string,
    storageService: number,
    storageFolder: string,
    file?: string
  ) {
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('storage_container', storageFolder);
      formData.append('storage_service_id', storageService.toString());

      // TODO figure out why formData is not being populated
      return this.http.post(URLS.APP, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        ...SHOW_LOADING_HEADER,
      });
    }

    return this.http.post(
      URLS.APP,
      {
        import_url,
        storage_container: storageFolder,
        storage_service_id: storageService,
      },
      {
        headers: SHOW_LOADING_HEADER,
      }
    );
  }

  deleteMultipleApps(ids: string[] | number[]) {
    return this.http.delete(URLS.APP, {
      headers: SHOW_LOADING_HEADER,
      params: {
        delete_storage: true,
        fields: '*',
        ids: ids.join(','),
      },
    });
  }
}
