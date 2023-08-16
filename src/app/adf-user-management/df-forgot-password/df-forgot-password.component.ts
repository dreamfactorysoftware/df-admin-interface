import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, catchError, switchMap, takeUntil, throwError } from 'rxjs';
import { DfSystemConfigDataService } from '../../core/services/df-system-config-data.service';
import { AlertType } from '../../shared/components/df-alert/df-alert.component';
import { matchValidator } from '../../shared/validators/match.validator';
import { ROUTES } from '../../core/constants/routes';
import { DfPasswordService } from '../services/df-password.service';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { DfAuthService } from '../services/df-auth.service';
import { LoginCredentials } from '../types';

@Component({
  selector: 'df-forgot-password',
  templateUrl: './df-forgot-password.component.html',
  styleUrls: ['../adf-user-management.scss'],
})
export class DfForgotPasswordComponent implements OnInit, OnDestroy {
  private destroyed$ = new Subject<void>();
  alertMsg = '';
  showAlert = false;
  alertType: AlertType = 'error';
  loginAttribute = 'email';
  hasSecurityQuestion = false;
  forgetPasswordForm: FormGroup;
  securityQuestionForm: FormGroup;

  loginRoute = `/${ROUTES.AUTH}/${ROUTES.LOGIN}`;

  constructor(
    private fb: FormBuilder,
    private systemConfigDataService: DfSystemConfigDataService,
    private passwordService: DfPasswordService,
    private translateService: TranslateService,
    private router: Router,
    private authService: DfAuthService
  ) {
    this.forgetPasswordForm = this.fb.group({
      username: [''],
      email: [''],
    });
    this.securityQuestionForm = this.fb.group({
      securityQuestion: [''],
      securityAnswer: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(5)]],
      confirmPassword: ['', [matchValidator('newPassword')]],
    });
  }

  ngOnInit() {
    this.systemConfigDataService.environment$
      .pipe(takeUntil(this.destroyed$))
      .subscribe(env => {
        this.loginAttribute = env.authentication.loginAttribute;
        if (this.loginAttribute === 'username') {
          this.forgetPasswordForm.controls['username'].setValidators([
            Validators.required,
          ]);
        } else {
          this.forgetPasswordForm.controls['email'].setValidators([
            Validators.required,
            Validators.email,
          ]);
        }
      });
  }

  requestReset() {
    if (this.forgetPasswordForm.invalid) {
      return;
    }
    this.passwordService
      .requestPasswordReset(
        this.loginAttribute === 'username'
          ? { username: this.forgetPasswordForm.controls['username'].value }
          : { email: this.forgetPasswordForm.controls['email'].value }
      )
      .pipe(
        takeUntil(this.destroyed$),
        catchError(err => {
          this.alertMsg = err.error.error.message;
          this.showAlert = true;
          return throwError(() => new Error(err));
        })
      )
      .subscribe(res => {
        this.showAlert = false;
        if ('securityQuestion' in res) {
          this.hasSecurityQuestion = true;
          this.securityQuestionForm.controls['securityQuestion'].setValue(
            res.securityQuestion
          );
        } else {
          this.alertMsg = this.translateService.instant(
            'userManagement.alerts.resetEmailSent'
          );
          this.showAlert = true;
          this.alertType = 'success';
        }
      });
  }

  resetPassword() {
    if (this.securityQuestionForm.invalid) {
      return;
    }
    this.passwordService
      .requestPasswordReset(
        {
          ...this.forgetPasswordForm.value,
          ...this.securityQuestionForm.value,
        },
        true
      )
      .pipe(
        takeUntil(this.destroyed$),
        catchError(err => {
          this.alertMsg = err.error.error.message;
          this.showAlert = true;
          return throwError(() => new Error(err));
        }),
        switchMap(() => {
          const credentials: LoginCredentials = {
            password: this.securityQuestionForm.controls['newPassword'].value,
          };
          if (this.loginAttribute === 'username') {
            credentials['username'] =
              this.forgetPasswordForm.controls['username'].value;
          } else {
            credentials['email'] =
              this.forgetPasswordForm.controls['email'].value;
          }
          return this.authService.login(credentials);
        })
      )
      .subscribe(() => {
        this.showAlert = false;
        this.router.navigate([`/`]);
      });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
