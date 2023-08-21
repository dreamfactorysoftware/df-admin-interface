import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { GenericListResponse } from 'src/app/shared/types/generic-http.type';
import { URLS } from 'src/app/core/constants/urls';
import { SHOW_LOADING_HEADER } from 'src/app/core/constants/http-headers';
import { AdminType } from 'src/app/shared/types/user';
import { readAsText } from 'src/app/shared/utilities/file';
import { switchMap } from 'rxjs';

@Injectable()
export class DfAdminService {
  constructor(private http: HttpClient) {}

  getAdmins(limit = 10, offset = 0, filter = '') {
    return this.http.get<GenericListResponse<Array<AdminType>>>(
      URLS.SYSTEM_ADMIN,
      {
        headers: SHOW_LOADING_HEADER,
        params: {
          filter,
          limit,
          offset,
          include_count: true,
        },
      }
    );
  }

  getAdmin(id: string | number) {
    return this.http.get<AdminType>(`${URLS.SYSTEM_ADMIN}/${id}`, {
      headers: SHOW_LOADING_HEADER,
      params: {
        related: 'user_to_app_to_role_by_user_id',
      },
    });
  }

  deleteAdmin(id: string | number) {
    return this.http.delete(`${URLS.SYSTEM_ADMIN}/${id}`, {
      headers: SHOW_LOADING_HEADER,
    });
  }

  sendInvite(id: string | number) {
    return this.http.patch(`${URLS.SYSTEM_ADMIN}/${id}`, {
      headers: SHOW_LOADING_HEADER,
      params: {
        send_invite: true,
      },
    });
  }

  uploadAdminList(file: File) {
    return readAsText(file).pipe(
      switchMap(data =>
        this.http.post(URLS.SYSTEM_ADMIN, data, {
          headers: { ...SHOW_LOADING_HEADER, 'Content-Type': file.type },
        })
      )
    );
  }

  downloadAdminlist(type: string) {
    return this.http.get(URLS.SYSTEM_ADMIN, {
      headers: SHOW_LOADING_HEADER,
      params: {
        file: `admin.${type}`,
      },
      responseType: (type === 'json' ? 'json' : 'text') as any,
    });
  }
}
