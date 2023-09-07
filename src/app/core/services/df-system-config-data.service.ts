import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  catchError,
  retry,
  tap,
  throwError,
} from 'rxjs';
import { URLS } from '../constants/urls';
import { SHOW_LOADING_HEADER } from '../constants/http-headers';
import { DfUserDataService } from './df-user-data.service';
import { Environment } from 'src/app/shared/types/system';

@Injectable({
  providedIn: 'root',
})
export class DfSystemConfigDataService {
  private environmentSubject = new BehaviorSubject<Environment>({
    authentication: {
      allowOpenRegistration: false,
      openRegEmailServiceId: 0,
      allowForeverSessions: false,
      loginAttribute: 'email',
      adldap: [],
      oauth: [],
      saml: [],
    },
    platform: {
      rootAdminExists: false,
    },
  });
  environment$: Observable<Environment> =
    this.environmentSubject.asObservable();

  constructor(
    private http: HttpClient,
    private userDataService: DfUserDataService
  ) {}

  get environment(): Environment {
    return this.environmentSubject.value;
  }

  private set environment(data: Environment) {
    this.environmentSubject.next(data);
  }

  fetchEnvironmentData() {
    return this.http
      .get<Environment>(URLS.ENVIRONMENT, {
        headers: SHOW_LOADING_HEADER,
      })
      .pipe(
        tap(environment => (this.environment = environment)),
        catchError(err => {
          this.userDataService.clearToken();
          return throwError(() => new Error(err));
        }),
        retry(1)
      );
  }
}
