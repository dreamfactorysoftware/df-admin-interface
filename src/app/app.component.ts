import { Component, OnInit } from '@angular/core';
import { DfLoadingSpinnerService } from './shared/services/df-loading-spinner.service';
import { NgIf, AsyncPipe } from '@angular/common';
import {
  RouterOutlet,
  Router,
  ActivatedRoute,
  NavigationEnd,
} from '@angular/router';
import { DfSideNavComponent } from './shared/components/df-side-nav/df-side-nav.component';
import { DfLicenseCheckService } from './shared/services/df-license-check.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { AuthService } from './shared/services/auth.service';
import { LoggingService } from './shared/services/logging.service';
import { ErrorSharingService } from './shared/services/error-sharing.service';
import { LoginResponse } from './shared/types/auth.types';
import { ROUTES } from './shared/types/routes';
import { filter } from 'rxjs/operators';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [DfSideNavComponent, RouterOutlet, NgIf, AsyncPipe],
})
export class AppComponent implements OnInit {
  title = 'df-admin-interface';
  activeSpinner$ = this.loadingSpinnerService.active;
  licenseCheck$ = this.licenseCheckService.licenseCheck$;

  constructor(
    private loadingSpinnerService: DfLoadingSpinnerService,
    private licenseCheckService: DfLicenseCheckService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private loggingService: LoggingService,
    private errorSharingService: ErrorSharingService
  ) {}

  ngOnInit() {
    this.loggingService.log('AppComponent initialized');
    this.handleAuthentication();

    // Monitor license check changes and redirect when disable_ui is true
    this.licenseCheck$.pipe(untilDestroyed(this)).subscribe(licenseCheck => {
      if (licenseCheck?.disableUi === 'true') {
        // Force navigation to license-expired page
        if (!this.router.url.includes(ROUTES.LICENSE_EXPIRED)) {
          this.router.navigate([ROUTES.LICENSE_EXPIRED]);
        }
      }
    });
  }

  private handleAuthentication() {
    this.loggingService.log('Handling authentication');

    const fullUrl = window.location.href;
    this.loggingService.log(`Full URL: ${fullUrl}`);

    const jwtMatch = fullUrl.match(/[?&]jwt=([^&#]*)/);
    const jwt = jwtMatch ? jwtMatch[1] : null;

    const errorMatch = fullUrl.match(/[?&]error=([^&#]*)/);
    const error = errorMatch ? decodeURIComponent(errorMatch[1]) : null;

    if (error) {
      this.loggingService.log(`OAuth error found: ${error}`);

      // Set error in sharing service and navigate to auth/login
      this.errorSharingService.setError(error);
      this.router.navigate(['/auth/login']);
      return;
    } else if (jwt) {
      this.loggingService.log(`JWT found in URL: ${jwt.substring(0, 20)}...`);
      this.authService.loginWithJwt(jwt).subscribe(
        (user: LoginResponse) => {
          const isAuthenticated = !!(user.session_token || user.sessionToken);
          this.loggingService.log(
            `Login successful for user: ${
              isAuthenticated ? 'Authenticated' : 'Unknown'
            }`
          );
          window.location.href = '/dreamfactory/dist/#/home'; // Use window.location.href for hash-based routing
        },
        error => {
          this.loggingService.log(`Login failed: ${JSON.stringify(error)}`);
          window.location.href = '/dreamfactory/dist/#/auth/login';
        }
      );
    } else {
      this.loggingService.log('No JWT found in URL');
      if (!this.authService.isAuthenticated()) {
        this.loggingService.log(
          'User not logged in, redirecting to login page'
        );
      } else {
        this.loggingService.log('User is already logged in');
        window.location.href = '/dreamfactory/dist/#/home';
      }
    }
  }

  someMethod() {
    if (!this.authService.isAuthenticated()) {
      // Handle not logged in state
    }
  }
}
