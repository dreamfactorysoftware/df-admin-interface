import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { map, catchError } from 'rxjs/operators';
import { NotificationService } from '../services/notification.service';
import { LoggingService } from '../services/logging.service';

@Injectable({
  providedIn: 'root',
})
export class SamlAuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService,
    private loggingService: LoggingService
  ) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    this.loggingService.log(
      `SamlAuthGuard.canActivate called for URL: ${state.url}`
    );
    const fragmentParams = new URLSearchParams(window.location.hash.slice(1));
    const jwt = fragmentParams.get('jwt');
    this.loggingService.log(
      `JWT from fragment: ${jwt ? 'present' : 'not present'}`
    );

    if (jwt) {
      this.loggingService.log('JWT found, attempting to login');
      return this.authService.loginWithJwt(jwt).pipe(
        map(result => {
          this.loggingService.log(
            `loginWithJwt result: ${JSON.stringify(result)}`
          );
          if (result && result.session_token) {
            this.loggingService.log(
              'Authentication successful, navigating to /home'
            );
            this.router.navigate(['/home']);
            return false;
          } else {
            this.loggingService.log(
              'Authentication failed, navigating to /login'
            );
            this.router.navigate(['/login']);
            return false;
          }
        }),
        catchError(error => {
          this.loggingService.log(
            `SAML login failed: ${JSON.stringify(error)}`
          );
          this.notificationService.error(
            'Login Error',
            error.message || 'An error occurred during login.'
          );
          this.router.navigate(['/login']);
          return of(false);
        })
      );
    }

    this.loggingService.log('No JWT found, allowing navigation to proceed');
    return of(true);
  }
}
