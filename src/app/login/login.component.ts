import { Component, OnInit } from '@angular/core';
import { AuthService } from '../shared/services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { UserService } from '../shared/services/user.service';
import { NotificationService } from '../shared/services/notification.service';

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
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const jwt = params['jwt'];
      if (jwt) {
        this.handleSamlLogin(jwt);
      }
    });
  }

  handleSamlLogin(jwt: string) {
    this.authService.loginWithJwtAndRedirect(jwt).subscribe(
      ({ user, redirectUrl }: { user: any; redirectUrl: string }) => {
        if (user && (user.session_token || user.sessionToken)) {
          this.router.navigateByUrl(redirectUrl);
        } else {
          this.notificationService.error(
            'Login Error',
            'Invalid session token'
          );
          this.router.navigate(['/login']);
        }
      },
      error => {
        console.error('SAML login failed', error);
        this.notificationService.error(
          'Login Error',
          error.message || 'An error occurred during login.'
        );
      }
    );
  }

  // ... other login methods ...
}
