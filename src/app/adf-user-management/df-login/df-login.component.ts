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
import { ROUTES } from '../../shared/constants/routes';
import { getIcon, iconExist } from '../../shared/utilities/icons';
import { LoginCredentials } from '../types';

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
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-user-login',
  templateUrl: './df-login.component.html',
  styleUrls: ['../adf-user-management.scss'],
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
  ],
})
export class DfLoginComponent implements OnInit {
  alertMsg = '';
  showAlert = false;
  alertType: AlertType = 'error';
  envloginAttribute = 'email';
  loginAttribute = 'email';
  ldapServices: LdapService[] = [];
  oauthServices: AuthService[] = [];
  samlServices: AuthService[] = [];

  fpRoute = `/${ROUTES.AUTH}/${ROUTES.FORGOT_PASSWORD}`;

  loginForm: FormGroup;
  constructor(
    private fb: FormBuilder,
    private systemConfigDataService: DfSystemConfigDataService,
    private authService: DfAuthService,
    private router: Router
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
          this.alertMsg = err.error.error.message;
          this.showAlert = true;
          return throwError(() => new Error(err));
        })
      )
      .subscribe(() => {
        this.showAlert = false;
        this.router.navigate(['/']);
      });
  }
}
