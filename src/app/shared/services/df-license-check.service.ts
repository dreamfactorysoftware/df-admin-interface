import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { URLS } from '../constants/urls';
import { DfSystemConfigDataService } from './df-system-config-data.service';
import { LICENSE_KEY_HEADER } from '../constants/http-headers';
import { CheckResponse } from '../types/check';
import { BehaviorSubject, map, of, switchMap, tap } from 'rxjs';
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
    return this.systemConfigDataService.environment$.pipe(
      switchMap(environment => {
        if (!environment.platform?.licenseKey) {
          return this.systemConfigDataService.fetchEnvironmentData();
        }
        return of(environment);
      }),
      switchMap(environment =>
        this.httpClient
          .get<CheckResponse>(URLS.SUBSCRIPTION_DATA, {
            headers: {
              [LICENSE_KEY_HEADER]: environment.platform?.licenseKey ?? '',
            },
          })
          .pipe(
            map(response => mapSnakeToCamel(response)),
            tap(response => this.licenseCheckSubject.next(response))
          )
      )
    );
  }
}
