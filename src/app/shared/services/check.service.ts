import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { URLS } from '../constants/urls';
import { DfSystemConfigDataService } from './df-system-config-data.service';
import { LICENSE_KEY_HEADER } from '../constants/http-headers';
import { CheckResponse } from '../types/check';
import { map } from 'rxjs';
import { mapSnakeToCamel } from '../utilities/case';

@Injectable({
  providedIn: 'root',
})
export class CheckService {
  constructor(
    private httpClient: HttpClient,
    private systemConfigDataService: DfSystemConfigDataService
  ) {}

  check() {
    return this.httpClient
      .get<CheckResponse>(URLS.SUBSCRIPTION_DATA, {
        headers: {
          [LICENSE_KEY_HEADER]:
            this.systemConfigDataService.environment.platform?.licenseKey ?? '',
        },
      })
      .pipe(map(response => mapSnakeToCamel(response)));
  }
}
