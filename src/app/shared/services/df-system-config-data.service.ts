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
import { Environment, System } from 'src/app/shared/types/system';

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
    server: {
      host: '',
      machine: '',
      release: '',
      serverOs: '',
      version: '',
    },
  });
  environment$: Observable<Environment> =
    this.environmentSubject.asObservable();

  private systemSubject = new BehaviorSubject<System>({ resource: [] });
  system$: Observable<System> = this.systemSubject.asObservable();

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

  get system(): System {
    return this.systemSubject.value;
  }

  private set system(data: System) {
    this.systemSubject.next(data);
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

  fetchSystemData() {
    return this.http.get<System>(URLS.SYSTEM).pipe(
      tap(system => {
        this.system = system;
      })
    );
  }
}
