import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, catchError, takeUntil, throwError } from 'rxjs';
import { DfAuthService, LoginCredentials } from '../services/df-auth.service';
import {
  DfSystemConfigDataService,
  LdapService,
} from '../../core/services/df-system-config-data.service';
import { AlertType } from '../../shared/components/df-alert/df-alert.component';
import { Router } from '@angular/router';
import { ROUTES } from '../../core/constants/routes';

@Component({
  selector: 'df-user-login',
  templateUrl: './df-login.component.html',
})
export class DfLoginComponent implements OnInit, OnDestroy {
  private destroyed$ = new Subject<void>();
  alertMsg = '';
  showAlert = false;
  alertType: AlertType = 'error';
  envloginAttribute = 'email';
  loginAttribute = 'email';
  ldapAvailable = false;
  ldapServices: LdapService[] = [];

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

  ngOnInit() {
    this.systemConfigDataService.environment$
      .pipe(takeUntil(this.destroyed$))
      .subscribe(env => {
        this.envloginAttribute = env.authentication.loginAttribute;
        this.setLoginAttribute(env.authentication.loginAttribute);
        this.ldapAvailable = env.authentication.adldap.length > 0;
        this.ldapServices = env.authentication.adldap;
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

  ngOnDestroy() {
    this.destroyed$.next();
    this.destroyed$.complete();
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
    if (this.ldapAvailable && this.loginForm.value.services !== '') {
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
        takeUntil(this.destroyed$),
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
