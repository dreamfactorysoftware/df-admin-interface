import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, map } from 'rxjs';

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
      .post<UserData>('/api/v2/user/session', credentials, {
        headers: {
          'show-loading': '',
        },
      })
      .pipe(
        map(userData => {
          this.userData = userData;
          return userData;
        }),
        catchError(() => {
          return this.http
            .post<UserData>('/api/v2/system/admin/session', credentials, {})
            .pipe(
              map(userData => {
                this.userData = userData;
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
    this.isLoggedInSubject.next(false);
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
