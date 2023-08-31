import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { URLS } from 'src/app/core/constants/urls';

@Injectable()
export class DfLimitCacheService {
  constructor(private http: HttpClient) {}

  resetLimitCacheCounter(ids: string[]) {
    const idParams = ids.length > 1 ? ids.join(',') : ids[0];
    return this.http.delete(URLS.LIMIT_CACHE, {
      params: {
        ids: idParams,
      },
    });
  }
}
