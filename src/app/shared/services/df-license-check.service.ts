import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { URLS } from '../constants/urls';
import { DfSystemConfigDataService } from './df-system-config-data.service';
import { LICENSE_KEY_HEADER } from '../constants/http-headers';
import { CheckResponse } from '../types/check';
import { BehaviorSubject, map, tap } from 'rxjs';
import { mapSnakeToCamel } from '../utilities/case';

@Injectable({
  providedIn: 'root',
})
export class DfLicenseCheckService {
  private licenseCheckSubject = new BehaviorSubject<CheckResponse | null>(null);
  licenseCheck$ = this.licenseCheckSubject.asObservable();

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
      .pipe(
        map(response => mapSnakeToCamel(response)),
        tap(response => this.licenseCheckSubject.next(response))
      );
  }
}
