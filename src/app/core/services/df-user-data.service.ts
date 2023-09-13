import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { ROUTES } from '../constants/routes';
@Injectable({
  providedIn: 'root',
})
export class DfUserDataService {
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  isLoggedIn$ = this.isLoggedInSubject.asObservable();
  private userDataSubject = new BehaviorSubject<UserData | null>(null);
  userData$ = this.userDataSubject.asObservable();

  constructor(private router: Router) {}

  private TOKEN_KEY = 'session_token';
  clearToken() {
    document.cookie = `${this.TOKEN_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
    this.isLoggedIn = false;
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
    if (!isLoggedIn) {
      this.userData = null;
      this.router.navigate([`/${ROUTES.AUTH}/${ROUTES.LOGIN}`]);
    }
  }

  get token(): string | null {
    const name = `${this.TOKEN_KEY}=`;
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');

    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) === 0) {
        return c.substring(name.length, c.length);
      }
    }
    return null;
  }

  set token(token: string) {
    document.cookie = `${this.TOKEN_KEY}=${token};expires=Session;path=/;SameSite=Strict`;
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
  tokenExpiryDate: Date;
}
