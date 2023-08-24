import { HttpClient } from '@angular/common/http';
import { GenericListResponse } from 'src/app/shared/types/generic-http.type';
import { SHOW_LOADING_HEADER } from 'src/app/core/constants/http-headers';
import { readAsText } from 'src/app/shared/utilities/file';
import { switchMap } from 'rxjs';

export abstract class DfBaseUserService<T, C> {
  abstract url: string;
  abstract related: string;
  abstract messagePrefix: string;

  constructor(private http: HttpClient) {}

  getAll(limit = 10, offset = 0, filter = '') {
    return this.http.get<GenericListResponse<Array<T>>>(this.url, {
      headers: SHOW_LOADING_HEADER,
      params: {
        filter,
        limit,
        offset,
        include_count: true,
      },
    });
  }

  get(id: string | number) {
    return this.http.get<T>(`${this.url}/${id}`, {
      headers: SHOW_LOADING_HEADER,
      params: {
        related: this.related,
      },
    });
  }

  create(
    data: {
      resource: Array<C>;
    },
    sendInvite = false
  ) {
    return this.http.post<T>(this.url, data, {
      headers: {
        ...SHOW_LOADING_HEADER,
        'snackbar-success': `${this.messagePrefix}.alerts.createdSuccess`,
      },
      params: {
        fields: '*',
        related: this.related,
        send_invite: sendInvite,
      },
    });
  }

  update(id: string | number, data: Partial<C>) {
    return this.http.put<T>(`${this.url}/${id}`, data, {
      headers: {
        ...SHOW_LOADING_HEADER,
        'snackbar-success': `${this.messagePrefix}.alerts.updateSuccess`,
      },
      params: {
        fields: '*',
        related: this.related,
      },
    });
  }

  delete(id: string | number) {
    return this.http.delete(`${this.url}/${id}`, {
      headers: {
        ...SHOW_LOADING_HEADER,
        'snackbar-success': `${this.messagePrefix}.alerts.deleteSuccess`,
        'snackbar-error': 'server',
      },
    });
  }

  sendInvite(id: string | number) {
    return this.http.patch(`${this.url}/${id}`, null, {
      headers: {
        ...SHOW_LOADING_HEADER,
        'snackbar-success': `${this.messagePrefix}.alerts.inviteSent`,
        'snackbar-error': 'server',
      },
      params: {
        send_invite: true,
      },
    });
  }

  uploadList(file: File) {
    return readAsText(file).pipe(
      switchMap(data =>
        this.http.post(this.url, data, {
          headers: {
            ...SHOW_LOADING_HEADER,
            'snackbar-success': `${this.messagePrefix}.alerts.importSuccess`,
            'snackbar-error': 'server',
            'Content-Type': file.type,
          },
        })
      )
    );
  }

  downloadlist(type: string) {
    return this.http.get(this.url, {
      headers: {
        ...SHOW_LOADING_HEADER,
        'snackbar-success': `${this.messagePrefix}.alerts.exportSuccess`,
        'snackbar-error': 'server',
      },
      params: {
        file: `admin.${type}`,
      },
      responseType: (type === 'json' ? 'json' : 'text') as any,
    });
  }
}
