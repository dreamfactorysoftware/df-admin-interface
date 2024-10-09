import { Component, OnInit } from '@angular/core';
import { DfLoadingSpinnerService } from './shared/services/df-loading-spinner.service';
import { NgIf, AsyncPipe } from '@angular/common';
import { RouterOutlet, Router, ActivatedRoute } from '@angular/router';
import { DfSideNavComponent } from './shared/components/df-side-nav/df-side-nav.component';
import { DfLicenseCheckService } from './shared/services/df-license-check.service';
import { UntilDestroy } from '@ngneat/until-destroy';
import { AuthService } from './shared/services/auth.service';
import { LoggingService } from './shared/services/logging.service';
import { LoginResponse } from './shared/types/auth.types';

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
    private loggingService: LoggingService
  ) {}

  ngOnInit() {
    this.loggingService.log('AppComponent initialized');
    this.handleAuthentication();
  }

  private handleAuthentication() {
    this.loggingService.log('Handling authentication');

    const fullUrl = window.location.href;
    this.loggingService.log(`Full URL: ${fullUrl}`);

    const jwtMatch = fullUrl.match(/[?&]jwt=([^&#]*)/);
    const jwt = jwtMatch ? jwtMatch[1] : null;

    if (jwt) {
      this.loggingService.log(`JWT found in URL: ${jwt.substring(0, 20)}...`);
      this.authService.loginWithJwt(jwt).subscribe(
        (user: LoginResponse) => {
          const isAuthenticated = !!(user.session_token || user.sessionToken);
          this.loggingService.log(
            `Login successful for user: ${
              isAuthenticated ? 'Authenticated' : 'Unknown'
            }`
          );
          window.location.href = '/#/home'; // Use window.location.href for hash-based routing
        },
        error => {
          this.loggingService.log(`Login failed: ${JSON.stringify(error)}`);
          window.location.href = '/#/auth/login';
        }
      );
    } else {
      this.loggingService.log('No JWT found in URL');
      if (!this.authService.isLoggedIn()) {
        this.loggingService.log(
          'User not logged in, redirecting to login page'
        );
        window.location.href = '/#/auth/login';
      } else {
        this.loggingService.log('User is already logged in');
        window.location.href = '/#/home';
      }
    }
  }
}
