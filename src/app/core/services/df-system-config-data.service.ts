import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  catchError,
  lastValueFrom,
  retry,
  throwError,
} from 'rxjs';
import { DfAuthService } from './df-auth.service';
import { URLS } from '../constants/urls';
import { SHOW_LOADING_HEADER } from '../constants/http-headers';

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
    },
    platform: {
      rootAdminExists: false,
    },
  });
  environment$: Observable<Environment> =
    this.environmentSubject.asObservable();

  private systemSubject = new BehaviorSubject<System>({ resources: [] });
  system$: Observable<System> = this.systemSubject.asObservable();
  constructor(
    private http: HttpClient,
    private authService: DfAuthService
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

  async fetchEnvironmentData() {
    this.environment = await lastValueFrom(
      this.http
        .get<Environment>(URLS.ENVIRONMENT, {
          headers: SHOW_LOADING_HEADER,
        })
        .pipe(
          catchError(err => {
            this.authService.clearToken();
            return throwError(() => new Error(err));
          }),
          retry(1)
        )
    );
  }

  fetchSystemData() {
    this.http.get<System>(URLS.SYSTEM).subscribe(data => (this.system = data));
  }
}

// interface to be updated if other properties are needed
export interface Environment {
  authentication: {
    allowOpenRegistration: boolean;
    openRegEmailServiceId: number;
    allowForeverSessions: boolean;
    loginAttribute: string;
    adldap: Array<LdapService>;
  };
  platform: {
    rootAdminExists: boolean;
    host?: string;
  };
}

export interface System {
  resources: Array<{ name: string }>;
}

export interface LdapService {
  name: string;
  label: string;
}
