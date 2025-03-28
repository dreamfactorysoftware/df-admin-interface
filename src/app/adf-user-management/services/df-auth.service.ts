import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { URLS } from '../../shared/constants/urls';
import {
  HTTP_OPTION_LOGIN_FALSE,
  SHOW_LOADING_HEADER,
} from '../../shared/constants/http-headers';
import { ROUTES } from '../../shared/types/routes';
import { DfUserDataService } from '../../shared/services/df-user-data.service';
import { GenericSuccessResponse } from 'src/app/shared/types/generic-http';
import {
  LoginCredentials,
  RegisterDetails,
} from '../../shared/types/user-management';
import { UserSession } from 'src/app/shared/types/user';
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
      .post<UserSession>(URLS.USER_SESSION, credentials, {
        headers: SHOW_LOADING_HEADER,
      })
      .pipe(
        map(userData => {
          this.userDataService.userData = userData;
          return userData;
        }),
        catchError(() => {
          return this.http
            .post<UserSession>(URLS.ADMIN_SESSION, credentials, {})
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
      return this.loginWithToken().pipe(
        map(() => true),
        catchError(() => {
          this.userDataService.clearToken();
          return of(false);
        })
      );
    }
    return of(false);
  }

  loginWithToken(jwt?: string) {
    return this.http
      .get<UserSession>(URLS.USER_SESSION, {
        headers: {
          ...SHOW_LOADING_HEADER,
          Authorization: jwt ? `Bearer ${jwt}` : '',
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
      .post<UserSession>(URLS.USER_SESSION, {
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
        this.router.navigate([ROUTES.AUTH, ROUTES.LOGIN]);
      });
  }
}
