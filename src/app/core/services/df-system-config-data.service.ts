import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  catchError,
  delay,
  retry,
  throwError,
} from 'rxjs';
import { DfAuthService } from './df-auth.service';

@Injectable({
  providedIn: 'root',
})
export class DfSystemConfigDataService {
  private _environment$ = new BehaviorSubject<Environment>({
    authentication: {
      allowOpenRegistration: false,
      openRegEmailServiceId: 0,
      allowForeverSessions: false,
      loginAttribute: 'email',
    },
    platform: {
      rootAdminExists: false,
    },
  });

  private _system$ = new BehaviorSubject<System>({ resources: [] });

  constructor(
    private http: HttpClient,
    private authService: DfAuthService
  ) {}

  get environment(): Observable<Environment> {
    return this._environment$.asObservable();
  }

  private set environment(data: Environment) {
    this._environment$.next(data);
  }

  get system(): Observable<System> {
    return this._system$.asObservable();
  }

  private set system(data: System) {
    this._system$.next(data);
  }

  fetchEnvironmentData() {
    this.http
      .get<Environment>('/api/v2/system/environment')
      .pipe(
        catchError(err => {
          this.authService.clearToken();
          return throwError(() => new Error(err));
        }),
        retry(1)
      )
      .subscribe(data => (this.environment = data));
  }

  fetchSystemData() {
    this.http
      .get<System>('/api/v2/system')
      .subscribe(data => (this.system = data));
  }
}

// interface to be updated if other properties are needed
export interface Environment {
  authentication: {
    allowOpenRegistration: boolean;
    openRegEmailServiceId: number;
    allowForeverSessions: boolean;
    loginAttribute: string;
  };
  platform: {
    rootAdminExists: boolean;
  };
}

export interface System {
  resources: Array<{ name: string }>;
}
