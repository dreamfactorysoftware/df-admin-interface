import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, map, of } from 'rxjs';
import { URLS } from '../constants/urls';
import { SHOW_LOADING_HEADER } from '../constants/http-headers';
import { ROUTES } from '../constants/routes';

@Injectable({
  providedIn: 'root',
})
export class DfAuthService {
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  isLoggedIn$ = this.isLoggedInSubject.asObservable();
  private userDataSubject = new BehaviorSubject<UserData | null>(null);
  userData$ = this.userDataSubject.asObservable();

  private TOKEN_KEY = 'session_token';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  login(credentials: LoginCredentials) {
    return this.http
      .post<UserData>(URLS.USER_SESSION, credentials, {
        headers: SHOW_LOADING_HEADER,
      })
      .pipe(
        map(userData => {
          this.userData = userData;
          return userData;
        }),
        catchError(() => {
          return this.http
            .post<UserData>(URLS.ADMIN_SESSION, credentials, {})
            .pipe(
              map(userData => {
                this.userData = userData;
                return userData;
              })
            );
        })
      );
  }

  checkSession() {
    if (this.token) {
      return this.loginWithToken(this.token).pipe(
        map(() => true),
        catchError(() => {
          this.clearToken();
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
          this.userData = userData;
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
          this.userData = userData;
          return userData;
        })
      );
  }

  logout() {
    this.http
      .delete(
        this.userData?.isSysAdmin ? URLS.ADMIN_SESSION : URLS.USER_SESSION
      )
      .subscribe(() => {
        this.clearToken();
        this.userData = null;
        this.router.navigate([`/${ROUTES.AUTH}/${ROUTES.LOGIN}`]);
      });
    this.isLoggedIn = false;
  }

  clearToken() {
    sessionStorage.removeItem(this.TOKEN_KEY);
  }

  get userData(): UserData | null {
    return this.userDataSubject.value;
  }

  set userData(userData: UserData | null) {
    this.userDataSubject.next(userData);
    if (userData) {
      this.token = userData.sessionToken;
      this.isLoggedIn = true;
    }
  }

  set isLoggedIn(isLoggedIn: boolean) {
    this.isLoggedInSubject.next(isLoggedIn);
  }

  get token(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  set token(token: string) {
    sessionStorage.setItem(this.TOKEN_KEY, token);
  }
}

export interface LoginCredentials {
  username?: string;
  email?: string;
  password: string;
  rememberMe?: boolean;
  service?: string;
}

export interface UserData {
  email: string;
  firstName: string;
  host: string;
  id: number;
  isRootAdmin: boolean;
  isSysAdmin: boolean;
  lastLoginDate: string;
  lastName: string;
  name: string;
  sessionId: string;
  sessionToken: string;
  tokenExpiryDate: string;
}
