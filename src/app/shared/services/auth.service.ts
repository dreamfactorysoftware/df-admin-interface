import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap, switchMap, map } from 'rxjs/operators';
import { DfAuthService } from '../../adf-user-management/services/df-auth.service';
import { DfUserDataService } from './df-user-data.service';
import { DfRoleRedirectService } from './df-role-redirect.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(
    private dfAuthService: DfAuthService,
    private dfUserDataService: DfUserDataService,
    private roleRedirectService: DfRoleRedirectService
  ) {}

  loginWithJwt(jwt: string): Observable<any> {
    return this.dfAuthService
      .loginWithToken(jwt)
      .pipe(tap(user => (this.dfUserDataService.userData = user)));
  }

  /**
   * Login with JWT and get role-based redirect URL
   * @param jwt JWT token
   * @param returnUrl Optional return URL
   * @returns Observable<{ user: any, redirectUrl: string }>
   */
  loginWithJwtAndRedirect(jwt: string, returnUrl?: string): Observable<{ user: any, redirectUrl: string }> {
    console.log('AuthService: loginWithJwtAndRedirect called with returnUrl:', returnUrl);

    return this.loginWithJwt(jwt).pipe(
      switchMap(user => {
        console.log('AuthService: Login successful, user object:', user);

        return this.roleRedirectService.getLoginRedirectUrl(user, returnUrl).pipe(
          map(redirectUrl => {
            console.log('AuthService: Final redirect URL determined:', redirectUrl);
            return { user, redirectUrl };
          })
        );
      })
    );
  }

  /**
   * Get role-based redirect URL for current user
   * @param returnUrl Optional return URL
   * @returns Observable<string> The redirect URL
   */
  getRoleRedirectUrl(returnUrl?: string): Observable<string> {
    const userData = this.getCurrentUser();
    if (!userData) {
      return this.roleRedirectService.getLoginRedirectUrl({} as any, returnUrl);
    }
    return this.roleRedirectService.getLoginRedirectUrl(userData, returnUrl);
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
