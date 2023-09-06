import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { URLS } from 'src/app/core/constants/urls';

@Injectable()
export class DfApiDocsService {
  constructor(private http: HttpClient) {}

  getApiDocs(serviceName: string) {
    return this.http.get(`${URLS.API_DOCS}/${serviceName}`);
  }
}
