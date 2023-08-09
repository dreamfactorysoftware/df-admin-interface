import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DfAuthService {
  private isLoggedIn$ = new BehaviorSubject<boolean>(false);
  userData: UserData | null;
  private TOKEN_KEY = 'session_token';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  login(credentials: LoginCredentials) {
    return this.http
      .post<UserData>('/api/v2/user/session', credentials, {
        headers: {
          'show-loading': '',
        },
      })
      .pipe(
        map(userData => {
          this.setUserData(userData);
          return userData;
        }),
        catchError(() => {
          return this.http
            .post<UserData>('/api/v2/system/admin/session', credentials, {})
            .pipe(
              map(userData => {
                this.setUserData(userData);
                return userData;
              })
            );
        })
      );
  }

  logout() {
    this.http
      .delete(
        `/api/v2${this.userData?.isSysAdmin} ? '/system/admin/session' : '/user/session'`
      )
      .subscribe(() => {
        this.clearToken();
        this.userData = null;
        this.router.navigate(['/login']);
      });
    this.isLoggedIn$.next(false);
  }

  clearToken() {
    sessionStorage.removeItem(this.TOKEN_KEY);
  }

  setUserData(userData: UserData) {
    this.isLoggedIn$.next(true);
    this.token = userData.sessionToken;
    this.userData = userData;
  }

  get isLoggedIn() {
    return this.isLoggedIn$.asObservable();
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
