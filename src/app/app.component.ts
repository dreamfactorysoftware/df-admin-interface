import { Component, OnInit } from '@angular/core';
import { DfLoadingSpinnerService } from './shared/services/df-loading-spinner.service';
import { NgIf, AsyncPipe } from '@angular/common';
import { RouterOutlet, Router, ActivatedRoute } from '@angular/router';
import { DfSideNavComponent } from './shared/components/df-side-nav/df-side-nav.component';
import { DfEngagementBannerComponent } from './shared/components/df-engagement-banner/df-engagement-banner.component';
import { DfLicenseCheckService } from './shared/services/df-license-check.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { AuthService } from './shared/services/auth.service';
import { LoggingService } from './shared/services/logging.service';
import { ErrorSharingService } from './shared/services/error-sharing.service';
import { LoginResponse } from './shared/types/auth.types';
import { ROUTES } from './shared/types/routes';
import { IntercomService } from './shared/services/intercom.service';
import { DfUserDataService } from './shared/services/df-user-data.service';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [
    DfSideNavComponent,
    DfEngagementBannerComponent,
    RouterOutlet,
    NgIf,
    AsyncPipe,
  ],
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
    private errorSharingService: ErrorSharingService,
    private intercomService: IntercomService,
    private dfUserDataService: DfUserDataService
  ) {}

  ngOnInit() {
    this.loggingService.log('AppComponent initialized');
    this.handleAuthentication();

    // Initialize Intercom after authentication
    this.initializeIntercom();

    // Watch for user data changes to update Intercom
    this.dfUserDataService.userData$
      .pipe(untilDestroyed(this))
      .subscribe(userData => {
        if (userData) {
          // Update Intercom with new user data
          this.intercomService.updateUser(userData);
        } else {
          // User logged out, shutdown Intercom
          this.intercomService.shutdownIntercom();
        }
      });

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
    const sessionTokenMatch = fullUrl.match(/[?&]session_token=([^&#]*)/);
    const sessionToken = sessionTokenMatch ? sessionTokenMatch[1] : null;

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
    } else if (sessionToken) {
      this.loggingService.log(`Session token found in URL`);
      this.authService.loginWithJwt(sessionToken).subscribe(
        (user: LoginResponse) => {
          const isAuthenticated = !!(user.session_token || user.sessionToken);
          this.loggingService.log(
            `OAuth login successful: ${
              isAuthenticated ? 'Authenticated' : 'Unknown'
            }`
          );
          window.location.href = '/#/home';
        },
        (error: unknown) => {
          this.loggingService.log(
            `OAuth login failed: ${JSON.stringify(error)}`
          );
          window.location.href = '/#/auth/login';
        }
      );
    } else {
      this.loggingService.log('No JWT or session token found in URL');
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

  private async initializeIntercom(): Promise<void> {
    try {
      // Wait a bit for authentication and environment data to complete
      setTimeout(async () => {
        // Ensure environment data is loaded
        await this.intercomService.initializeIntercom();
      }, 2000); // Increased delay to ensure environment data is loaded
    } catch (error) {
      this.loggingService.log(`Failed to initialize Intercom: ${error}`);
    }
  }

  someMethod() {
    if (!this.authService.isAuthenticated()) {
      // Handle not logged in state
    }
  }
}
