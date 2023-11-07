import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { catchError, switchMap, throwError } from 'rxjs';
import { DfSystemConfigDataService } from '../../shared/services/df-system-config-data.service';
import {
  AlertType,
  DfAlertComponent,
} from '../../shared/components/df-alert/df-alert.component';
import { matchValidator } from '../../shared/validators/match.validator';
import { ROUTES } from '../../shared/types/routes';
import { DfPasswordService } from '../services/df-password.service';

import { Router, RouterLink } from '@angular/router';
import { DfAuthService } from '../services/df-auth.service';
import { LoginCredentials } from '../../shared/types/user-management';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { NgIf } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { TranslocoPipe, TranslocoService } from '@ngneat/transloco';
import { UntilDestroy } from '@ngneat/until-destroy';
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-forgot-password',
  templateUrl: './df-forgot-password.component.html',
  styleUrls: ['../adf-user-management.scss'],
  standalone: true,
  imports: [
    MatCardModule,
    DfAlertComponent,
    MatDividerModule,
    NgIf,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    RouterLink,
    TranslocoPipe,
  ],
})
export class DfForgotPasswordComponent implements OnInit {
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
    private translateService: TranslocoService,
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
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: [
        '',
        [Validators.required, matchValidator('newPassword')],
      ],
    });
  }

  ngOnInit() {
    this.systemConfigDataService.environment$.subscribe(env => {
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
          this.alertMsg = this.translateService.translate(
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
}
