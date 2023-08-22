import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, catchError, takeUntil, throwError } from 'rxjs';
import { DfSystemConfigDataService } from 'src/app/core/services/df-system-config-data.service';
import { AlertType } from 'src/app/shared/components/df-alert/df-alert.component';
import { DfAuthService } from '../services/df-auth.service';
import { ROUTES } from 'src/app/core/constants/routes';

@Component({
  selector: 'df-register',
  templateUrl: './df-register.component.html',
  styleUrls: ['../adf-user-management.scss'],
})
export class DfRegisterComponent implements OnInit, OnDestroy {
  private destroyed$ = new Subject<void>();
  alertMsg = '';
  showAlert = false;
  alertType: AlertType = 'error';
  loginAttribute = 'email';
  registerForm: FormGroup;
  complete = false;
  loginRoute = `/${ROUTES.AUTH}/${ROUTES.LOGIN}`;
  constructor(
    private fb: FormBuilder,
    private systemConfigDataService: DfSystemConfigDataService,
    private authService: DfAuthService
  ) {
    this.registerForm = this.fb.group({
      profileDetailsGroup: this.fb.group({
        username: [''],
        email: ['', [Validators.email]],
        firstName: ['', [Validators.required]],
        lastName: ['', [Validators.required]],
        name: ['', [Validators.required]],
      }),
    });
  }

  ngOnInit() {
    this.systemConfigDataService.environment$
      .pipe(takeUntil(this.destroyed$))
      .subscribe(env => {
        this.loginAttribute = env.authentication.loginAttribute;
        if (this.loginAttribute === 'username') {
          this.registerForm
            .get('profileDetailsGroup.username')
            ?.setValidators([Validators.required]);
        } else {
          this.registerForm
            .get('profileDetailsGroup.email')
            ?.addValidators([Validators.required]);
        }
      });
  }

  register() {
    if (this.registerForm.invalid) {
      return;
    }
    this.authService
      .register(this.registerForm.controls['profileDetailsGroup'].value)
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
        this.complete = true;
      });
  }

  ngOnDestroy() {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
