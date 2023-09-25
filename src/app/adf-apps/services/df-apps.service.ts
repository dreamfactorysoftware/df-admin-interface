import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { URLS } from '../../shared/constants/urls';
import { SHOW_LOADING_HEADER } from 'src/app/shared/constants/http-headers';

@Injectable()
export class DfAppsService {
  constructor(private http: HttpClient) {}

  importFromUrl(
    importUrl: string,
    storageContainer: string,
    storageServiceId: number
  ) {
    return this.http.post(
      URLS.APP,
      {
        importUrl,
        storageContainer,
        storageServiceId,
      },
      {
        headers: SHOW_LOADING_HEADER,
      }
    );
  }

  importFromFile(
    file: Blob,
    storageContainer: string,
    storageServiceId: string
  ) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('storage_container', storageContainer);
    formData.append('storage_service_id', storageServiceId);
    return this.http.post(URLS.APP, formData, {
      headers: SHOW_LOADING_HEADER,
    });
  }
}
