import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../shared/services/auth.service';
import { LoggingService } from '../shared/services/logging.service';

@Component({
  template: '<p>Processing SAML login...</p>',
})
export class SamlCallbackComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private loggingService: LoggingService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const jwt = params['jwt'];
      if (jwt) {
        this.handleSamlLogin(jwt);
      } else {
        this.loggingService.log('No JWT found in SAML callback');
        this.router.navigate(['/login']);
      }
    });
  }

  private handleSamlLogin(jwt: string) {
    this.authService.loginWithJwtAndRedirect(jwt).subscribe(
      ({ user, redirectUrl }: { user: any; redirectUrl: string }) => {
        if (user && (user.session_token || user.sessionToken)) {
          this.loggingService.log('SAML login successful');
          this.loggingService.log(`Redirecting to: ${redirectUrl}`);
          this.router.navigateByUrl(redirectUrl);
        } else {
          this.loggingService.log('Invalid session token received');
          this.router.navigate(['/login']);
        }
      },
      error => {
        this.loggingService.log(`SAML login failed: ${JSON.stringify(error)}`);
        this.router.navigate(['/login']);
      }
    );
  }
}
