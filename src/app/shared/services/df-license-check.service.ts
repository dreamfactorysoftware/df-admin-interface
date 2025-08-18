import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { URLS } from '../constants/urls';
import { LICENSE_KEY_HEADER } from '../constants/http-headers';
import { CheckResponse } from '../types/check';
import { BehaviorSubject, catchError, map, tap, throwError } from 'rxjs';
import { mapSnakeToCamel } from '../utilities/case';

@Injectable({
  providedIn: 'root',
})
export class DfLicenseCheckService {
  private licenseCheckSubject = new BehaviorSubject<CheckResponse | null>(null);
  licenseCheck$ = this.licenseCheckSubject.asObservable();

  get currentLicenseCheck(): CheckResponse | null {
    return this.licenseCheckSubject.value;
  }

  constructor(private httpClient: HttpClient) {}

  check(licenseKey: string) {
    return this.httpClient
      .get<CheckResponse>(URLS.SUBSCRIPTION_DATA, {
        headers: {
          [LICENSE_KEY_HEADER]: licenseKey,
        },
      })
      .pipe(
        map(response => mapSnakeToCamel(response)),
        tap(response => this.licenseCheckSubject.next(response)),
        catchError(e => {
          const errorResponse = mapSnakeToCamel(e.error);
          this.licenseCheckSubject.next(errorResponse);
          return throwError(() => new Error(e));
        })
      );
  }
}
