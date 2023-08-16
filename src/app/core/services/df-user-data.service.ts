import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DfUserDataService {
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  isLoggedIn$ = this.isLoggedInSubject.asObservable();
  private userDataSubject = new BehaviorSubject<UserData | null>(null);
  userData$ = this.userDataSubject.asObservable();

  private TOKEN_KEY = 'session_token';

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
