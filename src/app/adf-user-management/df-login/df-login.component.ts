import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { catchError, throwError } from 'rxjs';
import { DfAuthService } from '../services/df-auth.service';
import { DfSystemConfigDataService } from '../../shared/services/df-system-config-data.service';
import {
  AlertType,
  DfAlertComponent,
} from '../../shared/components/df-alert/df-alert.component';
import { Router, RouterLink } from '@angular/router';
import { ROUTES } from '../../shared/types/routes';
import { getIcon, iconExist } from '../../shared/utilities/icons';
import { LoginCredentials } from '../../shared/types/user-management';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { NgIf, NgFor, NgTemplateOutlet } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { TranslocoPipe } from '@ngneat/transloco';
import { AuthService, LdapService } from 'src/app/shared/types/service';
import { UntilDestroy } from '@ngneat/until-destroy';
import { DfThemeService } from 'src/app/shared/services/df-theme.service';
import { CommonModule } from '@angular/common';
import { DfSnackbarService } from 'src/app/shared/services/df-snackbar.service';
import { PopupOverlayService } from 'src/app/shared/components/df-popup/popup-overlay.service';
import { ErrorSharingService } from 'src/app/shared/services/error-sharing.service';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-user-login',
  templateUrl: './df-login.component.html',
  styleUrls: ['../adf-user-management.scss', './df-login.component.scss'],
  standalone: true,
  imports: [
    MatCardModule,
    DfAlertComponent,
    MatDividerModule,
    ReactiveFormsModule,
    NgIf,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    NgFor,
    MatInputModule,
    MatButtonModule,
    NgTemplateOutlet,
    RouterLink,
    FontAwesomeModule,
    TranslocoPipe,
    CommonModule,
  ],
})
export class DfLoginComponent implements OnInit {
  private readonly MINIMUM_PASSWORD_LENGTH = 16;
  alertMsg = '';
  showAlert = false;
  alertType: AlertType = 'error';
  envloginAttribute = 'email';
  loginAttribute = 'email';
  ldapServices: LdapService[] = [];
  oauthServices: AuthService[] = [];
  samlServices: AuthService[] = [];

  fpRoute = `/${ROUTES.AUTH}/${ROUTES.FORGOT_PASSWORD}`;

  isDarkMode = this.themeService.darkMode$;

  loginForm: FormGroup;
  constructor(
    private fb: FormBuilder,
    private systemConfigDataService: DfSystemConfigDataService,
    private authService: DfAuthService,
    private router: Router,
    private themeService: DfThemeService,
    private snackbarService: DfSnackbarService,
    private popupOverlay: PopupOverlayService,
    private errorSharingService: ErrorSharingService
  ) {
    this.loginForm = this.fb.group({
      services: [''],
      username: [''],
      email: [''],
      password: ['', [Validators.required]],
    });
  }

  iconExist = iconExist;
  getIcon = getIcon;

  ngOnInit() {
    // Check for shared error first
    this.errorSharingService.error$.subscribe(sharedError => {
      if (sharedError) {
        // Decode the error message properly (remove URL encoding)
        const decodedError = decodeURIComponent(
          sharedError.replace(/\+/g, ' ')
        );

        // Set the alert message for the built-in alert display
        this.alertMsg = decodedError;
        this.showAlert = true;
        this.alertType = 'error';

        // Clear the error after displaying it
        this.errorSharingService.clearError();
      }
    });

    this.systemConfigDataService.environment$.subscribe(env => {
      this.envloginAttribute = env.authentication.loginAttribute;
      this.setLoginAttribute(env.authentication.loginAttribute);
      this.ldapServices = env.authentication.adldap;
      this.oauthServices = env.authentication.oauth;
      this.samlServices = env.authentication.saml;
    });

    this.loginForm.controls['services'].valueChanges.subscribe(
      (value: string) => {
        if (value) {
          this.setLoginAttribute('username');
        } else {
          this.setLoginAttribute(this.envloginAttribute);
        }
      }
    );
    this.snackbarService.setSnackbarLastEle('', false);
  }

  setLoginAttribute(attribute: string) {
    this.loginAttribute = attribute;
    if (attribute === 'username') {
      this.loginForm.controls['username'].addValidators(Validators.required);
      this.loginForm.controls['email'].clearValidators();
    } else {
      this.loginForm.controls['email'].addValidators([
        Validators.required,
        Validators.email,
      ]);
      this.loginForm.controls['username'].clearValidators();
    }
    this.loginForm.controls['username'].updateValueAndValidity();
    this.loginForm.controls['email'].updateValueAndValidity();
  }

  login() {
    if (this.loginForm.invalid) {
      return;
    }

    const isPasswordTooShort =
      this.loginForm.value.password.length < this.MINIMUM_PASSWORD_LENGTH;
    const credentials: LoginCredentials = {
      password: this.loginForm.value.password,
    };
    if (this.ldapServices.length && this.loginForm.value.services !== '') {
      credentials.service = this.loginForm.value.services;
    }
    if (this.loginAttribute === 'username') {
      credentials.username = credentials.email = this.loginForm.value.username;
    } else {
      credentials.email = this.loginForm.value.email;
    }

    this.authService
      .login(credentials)
      .pipe(
        catchError(err => {
          if (err.status === 401 && isPasswordTooShort) {
            this.popupOverlay.open({
              message: `It looks like your password is too short. Our new system requires at least ${this.MINIMUM_PASSWORD_LENGTH} characters. Please reset your password to continue.`,
              showRemindMeLater: false,
            });
          } else {
            this.alertMsg = err.error?.error?.message || 'Login failed';
            this.showAlert = true;
          }
          return throwError(() => new Error(err));
        })
      )
      .subscribe(() => {
        this.showAlert = false;
        if (isPasswordTooShort) {
          this.popupOverlay.open({
            message: `Your current password is shorter than recommended (less than ${this.MINIMUM_PASSWORD_LENGTH} characters). For better security, we recommend updating your password to a longer one.`,
            showRemindMeLater: true,
          });
        }
        this.router.navigate([ROUTES.HOME]);
      });
  }
}
