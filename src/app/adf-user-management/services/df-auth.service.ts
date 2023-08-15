import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { URLS } from '../../core/constants/urls';
import {
  HTTP_OPTION_LOGIN_FALSE,
  SHOW_LOADING_HEADER,
} from '../../core/constants/http-headers';
import { ROUTES } from '../../core/constants/routes';
import {
  DfUserDataService,
  UserData,
} from '../../core/services/df-user-data.service';
import { GenericSuccessResponse } from 'src/app/shared/types/generic-http.type';
import { LoginCredentials, RegisterDetails } from '../types';

@Injectable({
  providedIn: 'root',
})
export class DfAuthService {
  constructor(
    private http: HttpClient,
    private router: Router,
    private userDataService: DfUserDataService
  ) {}

  register(data: RegisterDetails) {
    return this.http.post<GenericSuccessResponse>(
      URLS.REGISTER,
      data,
      HTTP_OPTION_LOGIN_FALSE
    );
  }

  login(credentials: LoginCredentials) {
    return this.http
      .post<UserData>(URLS.USER_SESSION, credentials, {
        headers: SHOW_LOADING_HEADER,
      })
      .pipe(
        map(userData => {
          this.userDataService.userData = userData;
          return userData;
        }),
        catchError(() => {
          return this.http
            .post<UserData>(URLS.ADMIN_SESSION, credentials, {})
            .pipe(
              map(userData => {
                this.userDataService.userData = userData;
                return userData;
              })
            );
        })
      );
  }

  checkSession() {
    if (this.userDataService.token) {
      return this.loginWithToken(this.userDataService.token).pipe(
        map(() => true),
        catchError(() => {
          this.userDataService.clearToken();
          return of(false);
        })
      );
    }
    return of(false);
  }

  loginWithToken(token: string) {
    return this.http
      .get<UserData>(URLS.USER_SESSION, {
        headers: SHOW_LOADING_HEADER,
        params: {
          session_token: token,
        },
      })
      .pipe(
        map(userData => {
          this.userDataService.userData = userData;
          return userData;
        })
      );
  }

  oauthLogin(oauthToken: string, code: string, state: string) {
    return this.http
      .post<UserData>(URLS.USER_SESSION, {
        headers: SHOW_LOADING_HEADER,
        params: {
          oauth_callback: true,
          oauth_token: oauthToken,
          code,
          state,
        },
      })
      .pipe(
        map(userData => {
          this.userDataService.userData = userData;
          return userData;
        })
      );
  }

  logout() {
    this.http
      .delete(
        this.userDataService.userData?.isSysAdmin
          ? URLS.ADMIN_SESSION
          : URLS.USER_SESSION
      )
      .subscribe(() => {
        this.userDataService.clearToken();
        this.userDataService.userData = null;
        this.router.navigate([`/${ROUTES.AUTH}/${ROUTES.LOGIN}`]);
      });
    this.userDataService.isLoggedIn = false;
  }
}
