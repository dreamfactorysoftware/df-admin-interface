import { Component, OnInit } from '@angular/core';
import { AuthService } from '../shared/services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { UserService } from '../shared/services/user.service';
import { DfSnackbarService } from '../shared/services/df-snackbar.service';
import { ErrorSharingService } from '../shared/services/error-sharing.service';

@Component({
  selector: 'df-app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute,
    private snackbarService: DfSnackbarService,
    private errorSharingService: ErrorSharingService
  ) {}

  ngOnInit() {
    console.log('LOGIN COMPONENT INIT - Setting up error subscription');
    console.log('Error sharing service:', this.errorSharingService);

    // Check for shared error first
    this.errorSharingService.error$.subscribe(sharedError => {
      console.log(
        'LOGIN COMPONENT - Error subscription triggered with:',
        sharedError
      );

      if (sharedError) {
        console.log('Login component received shared error:', sharedError);

        // Try multiple approaches to ensure error is visible
        const errorMessage = `OAuth Login Error: ${sharedError}`;

        // 1. Show browser alert for immediate feedback
        console.log('LOGIN COMPONENT - Showing alert');
        alert(errorMessage);

        // 2. Try snackbar service
        try {
          console.log('LOGIN COMPONENT - Calling snackbar service');
          this.snackbarService.openSnackBar(errorMessage, 'error');
          console.log('Snackbar service called successfully');
        } catch (snackbarError) {
          console.error('Snackbar service failed:', snackbarError);
        }

        // 3. Also log to console clearly
        console.error('OAUTH ERROR FOR USER:', errorMessage);

        // Clear the error after displaying it
        console.log('LOGIN COMPONENT - Clearing error from service');
        this.errorSharingService.clearError();
      } else {
        console.log('LOGIN COMPONENT - No error received (null/undefined)');
      }
    });

    // Also check query params for backward compatibility
    this.route.queryParams.subscribe(params => {
      console.log('Login component query params:', params);
      const jwt = params['jwt'];
      const error = params['error'];

      if (jwt) {
        console.log('JWT found, handling SAML login');
        this.handleSamlLogin(jwt);
      } else if (error) {
        console.log('Error found in query params:', error);
        this.snackbarService.openSnackBar(
          `OAuth Login Error: ${decodeURIComponent(error)}`,
          'error'
        );
      } else {
        console.log('No JWT or error found in query params');
      }
    });
  }

  handleSamlLogin(jwt: string) {
    this.authService.loginWithJwt(jwt).subscribe(
      result => {
        if (result && result.session_token) {
          this.router.navigate(['/home']);
        } else {
          this.snackbarService.openSnackBar(
            'Login Error: Invalid session token',
            'error'
          );
          this.router.navigate(['/login']);
        }
      },
      error => {
        console.error('SAML login failed', error);
        this.snackbarService.openSnackBar(
          `Login Error: ${error.message || 'An error occurred during login.'}`,
          'error'
        );
      }
    );
  }

  // ... other login methods ...
}
