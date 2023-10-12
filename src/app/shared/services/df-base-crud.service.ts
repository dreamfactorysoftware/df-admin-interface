import { HttpClient } from '@angular/common/http';
import { RequestOptions } from 'src/app/shared/types/generic-http';
import { readAsText } from 'src/app/shared/utilities/file';
import { map, switchMap } from 'rxjs';
import { Inject, Injectable } from '@angular/core';
import { URL_TOKEN } from '../constants/tokens';

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

  create<T>(data: any, options?: Partial<RequestOptions>, endpoint?: string) {
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

  legacyDelete(endpoint: string, options?: Partial<RequestOptions>) {
    const { headers, params } = this.getOptions({
      snackbarError: 'server',
      ...options,
    });
    return this.http.post(`${this.url}/${endpoint}`, null, {
      headers: { ...headers, 'X-Http-Method': 'DELETE' },
      params,
    });
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

  importList(file: File, options?: Partial<RequestOptions>) {
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

  uploadFile(
    location: string,
    files: FileList,
    options?: Partial<RequestOptions>
  ) {
    const formData = new FormData();
    Object.keys(files).forEach((f, i) => formData.append('files', files[i]));
    return this.http.post(
      `${this.url}/${location}`,
      formData,
      this.getOptions({
        snackbarError: 'server',
        ...options,
      })
    );
  }

  downloadJson(path?: string, options?: Partial<RequestOptions>) {
    const url = `${this.url}${path ? `/${path}` : ''}`;
    return this.http
      .get(url, {
        ...this.getOptions({
          snackbarError: 'server',
          ...options,
        }),
      })
      .pipe(map(res => JSON.stringify(res)));
  }

  downloadFile(path?: string, options?: Partial<RequestOptions>) {
    const url = `${this.url}${path ? `/${path}` : ''}`;
    return this.http.get(url, {
      responseType: 'blob',
      ...this.getOptions({
        snackbarError: 'server',
        ...options,
      }),
    });
  }

  getOptions(options: Partial<RequestOptions>) {
    const headers: any = {};
    const params: any = {};
    headers['Cache-Control'] = 'no-cache, private';
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
    if (options.limit !== undefined) {
      params.limit = options.limit;
    }
    if (options.offset !== undefined) {
      params.offset = options.offset;
    }
    if (options.includeCount !== undefined) {
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
