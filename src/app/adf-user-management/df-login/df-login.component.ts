/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, catchError, takeUntil, throwError } from 'rxjs';
import {
  DfAuthService,
  LoginCredentials,
} from '../../core/services/df-auth.service';
import { DfSystemConfigDataService } from '../../core/services/df-system-config-data.service';
import { AlertType } from '../../shared/components/df-alert/df-alert.component';
import { Router } from '@angular/router';

@Component({
  selector: 'df-user-login',
  templateUrl: './df-login.component.html',
})
export class DfLoginComponent implements OnInit, OnDestroy {
  private destroyed$ = new Subject<void>();
  alertMsg = '';
  showAlert = false;
  alertType: AlertType = 'error';
  loginAttribute = 'email';

  loginForm: FormGroup;
  constructor(
    private fb: FormBuilder,
    private systemConfigDataService: DfSystemConfigDataService,
    private authService: DfAuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  ngOnInit() {
    this.systemConfigDataService.environment$
      .pipe(takeUntil(this.destroyed$))
      .subscribe(env => {
        this.loginAttribute = env.authentication.loginAttribute;
      });
  }

  ngOnDestroy() {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  login() {
    if (this.loginForm.invalid) {
      return;
    }
    const credentials: LoginCredentials = {
      password: this.loginForm.value.newPassword,
    };
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
