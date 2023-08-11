import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Location } from '@angular/common';
import { UserParams } from './types/df-password-reset.types';
import { DfPasswordResetService } from '../services/df-password.service';
import { DfSystemConfigDataService } from '../../core/services/df-system-config-data.service';
import { matchValidator } from '../../shared/validators/match.validator';
import { Subject, catchError, switchMap, takeUntil, throwError } from 'rxjs';
import { AlertType } from '../../shared/components/df-alert/df-alert.component';
import { DfAuthService, LoginCredentials } from '../services/df-auth.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'df-password-reset',
  templateUrl: './df-password-reset.component.html',
  providers: [DfPasswordResetService],
})
export class DfPasswordResetComponent implements OnInit, OnDestroy {
  private destroyed$ = new Subject<void>();
  passwordResetForm: FormGroup;
  user: UserParams = { email: '', username: '', code: '', admin: '' };
  alertMsg = '';
  showAlert = false;
  alertType: AlertType = 'error';
  loginAttribute = 'email';
  type = 'reset';

  constructor(
    private fb: FormBuilder,
    private location: Location,
    private passwordResetService: DfPasswordResetService,
    private systemConfigDataService: DfSystemConfigDataService,
    private authService: DfAuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.passwordResetForm = this.fb.group({
      username: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      code: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(5)]],
      confirmPassword: ['', [matchValidator('newPassword')]],
    });
  }

  ngOnInit() {
    const UrlParams = this.location.path().split('?')[1];
    if (UrlParams) {
      const params = UrlParams.split('&');
      params.forEach((param: string) => {
        const [key, value] = param.split('=');
        this.user[key as keyof UserParams] = value;
      });
    }
    this.systemConfigDataService.environment$
      .pipe(takeUntil(this.destroyed$))
      .subscribe(env => {
        this.loginAttribute = env.authentication.loginAttribute;
      });
    this.passwordResetForm.patchValue({
      email: this.user.email,
      username: this.user.username,
      code: this.user.code,
    });
    this.route.data.pipe(takeUntil(this.destroyed$)).subscribe(data => {
      if ('type' in data) {
        this.type = data['type'];
      }
    });
  }

  ngOnDestroy() {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  get isAdmin() {
    return this.user.admin === '1';
  }

  resetPassword() {
    if (this.passwordResetForm.invalid) {
      return;
    }
    const { confirmPassword, ...resetCred } = this.passwordResetForm.value;
    this.passwordResetService
      .resetPassword(resetCred, this.isAdmin)
      .pipe(
        takeUntil(this.destroyed$),
        switchMap(() => {
          const credentials: LoginCredentials = {
            password: resetCred.newPassword,
          };
          if (this.loginAttribute === 'email') {
            credentials.email = resetCred.email;
          } else {
            credentials.username = resetCred.username;
          }
          return this.authService.login(credentials);
        }),
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
