import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DfAuthService {
  private isLoggedIn = new BehaviorSubject<boolean>(false);
  isLoggedIn$ = this.isLoggedIn.asObservable();
  private TOKEN_KEY = 'session_token';

  constructor(private http: HttpClient) {}

  login() {
    this.isLoggedIn.next(true);
    this.saveToken('token');
  }

  logout() {
    this.isLoggedIn.next(false);
  }

  getToken() {
    console.log(sessionStorage.getItem(this.TOKEN_KEY));
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  saveToken(token: string) {
    sessionStorage.setItem(this.TOKEN_KEY, token);
  }

  clearToken() {
    sessionStorage.removeItem(this.TOKEN_KEY);
  }
}
