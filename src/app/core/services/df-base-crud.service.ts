import { HttpClient } from '@angular/common/http';
import { RequestOptions } from 'src/app/shared/types/generic-http.type';
import { readAsText } from 'src/app/shared/utilities/file';
import { switchMap } from 'rxjs';
import { Inject, Injectable } from '@angular/core';
import { URL_TOKEN } from '../constants/tokens';

export function dfBaseCrudServiceFactory(url: string, http: HttpClient) {
  return new DfBaseCrudService(url, http);
}

@Injectable()
export class DfBaseCrudService {
  constructor(
    @Inject(URL_TOKEN) private url: string,
    private http: HttpClient
  ) {}

  getAll<T>(options?: Partial<RequestOptions>) {
    return this.http.get<T>(
      this.url,
      this.getOptions({
        limit: 10,
        offset: 0,
        includeCount: true,
        ...options,
      })
    );
  }

  get<T>(id: string | number, options?: Partial<RequestOptions>) {
    return this.http.get<T>(
      `${this.url}/${id}`,
      this.getOptions({ snackbarError: 'server', ...options })
    );
  }

  getText(id: string | number, options?: Partial<RequestOptions>) {
    return this.http.get(`${this.url}/${id}`, {
      responseType: 'text',
      ...this.getOptions({ contentType: 'text/plain', ...options }),
    });
  }

  create<T, S>(
    data: {
      resource: Array<S>;
    },
    options?: Partial<RequestOptions>,
    endpoint?: string
  ) {
    return this.http.post<T>(
      `${this.url}${endpoint ? `/${endpoint}` : ''}`,
      data,
      this.getOptions({ ...options })
    );
  }

  update<T, S>(
    id: string | number,
    data: S,
    options?: Partial<RequestOptions>
  ) {
    return this.http.put<T>(
      `${this.url}/${id}`,
      data,
      this.getOptions({ ...options })
    );
  }

  delete(
    id: string | number | Array<string | number>,
    options?: Partial<RequestOptions>
  ) {
    const url = Array.isArray(id)
      ? `${this.url}?ids=${id.join(',')}`
      : `${this.url}/${id}`;
    return this.http.delete(
      url,
      this.getOptions({ snackbarError: 'server', ...options })
    );
  }

  patch<T, S>(id: string | number, data: S, options?: Partial<RequestOptions>) {
    return this.http.patch<T>(
      `${this.url}/${id}`,
      data,
      this.getOptions({ snackbarError: 'server', ...options })
    );
  }

  uploadFile(file: File, options?: Partial<RequestOptions>) {
    return readAsText(file).pipe(
      switchMap(data =>
        this.http.post(
          this.url,
          data,
          this.getOptions({
            snackbarError: 'server',
            contentType: file.type,
            ...options,
          })
        )
      )
    );
  }

  exportList(type: string, options?: Partial<RequestOptions>) {
    return this.http.get(
      this.url,
      this.getOptions({
        snackbarError: 'server',
        additionalParams: [{ key: 'file', value: `list.${type}` }],
        ...options,
      })
    );
  }

  downloadFile(path: string, options?: Partial<RequestOptions>) {
    return this.http.get(
      this.url + '/' + path,
      this.getOptions({
        snackbarError: 'server',
        ...options,
      })
    );
  }

  getOptions(options: Partial<RequestOptions>) {
    const headers: any = {};
    const params: any = {};
    if (options.showSpinner !== false) {
      headers['show-loading'] = '';
    }
    if (options.snackbarSuccess) {
      headers['snackbar-success'] = options.snackbarSuccess;
    }
    if (options.snackbarError) {
      headers['snackbar-error'] = options.snackbarError;
    }
    if (options.contentType) {
      headers['Content-type'] = options.contentType;
    }
    if (options.additionalHeaders) {
      options.additionalHeaders.forEach(header => {
        headers[header.key] = header.value;
      });
    }
    if (options.filter) {
      params.filter = options.filter;
    }
    if (options.sort) {
      params.sort = options.sort;
    }
    if (options.fields) {
      params.fields = options.fields;
    }
    if (options.related) {
      params.related = options.related;
    }
    if (options.limit) {
      params.limit = options.limit;
    }
    if (options.offset) {
      params.offset = options.offset;
    }
    if (options.includeCount) {
      params.include_count = options.includeCount;
    }

    if (options.additionalParams) {
      options.additionalParams.forEach(param => {
        params[param.key] = param.value;
      });
    }
    return { headers, params };
  }
}
