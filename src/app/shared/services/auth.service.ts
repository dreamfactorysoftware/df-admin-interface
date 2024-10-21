import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { DfAuthService } from '../../adf-user-management/services/df-auth.service';
import { DfUserDataService } from './df-user-data.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(
    private dfAuthService: DfAuthService,
    private dfUserDataService: DfUserDataService
  ) {}

  loginWithJwt(jwt: string): Observable<any> {
    return this.dfAuthService
      .loginWithToken(jwt)
      .pipe(tap(user => (this.dfUserDataService.userData = user)));
  }

  setCurrentUser(user: any) {
    this.dfUserDataService.userData = user;
  }

  getCurrentUser(): any {
    return this.dfUserDataService.userData;
  }

  isAuthenticated(): boolean {
    return this.dfUserDataService.isLoggedIn;
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated();
  }

  logout() {
    this.dfAuthService.logout();
  }
}
