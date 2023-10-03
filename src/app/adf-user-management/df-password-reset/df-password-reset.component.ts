import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Location, NgIf } from '@angular/common';
import {
  UserParams,
  LoginCredentials,
} from '../../shared/types/user-management';
import { DfPasswordService } from '../services/df-password.service';
import { DfSystemConfigDataService } from '../../shared/services/df-system-config-data.service';
import { matchValidator } from '../../shared/validators/match.validator';
import { catchError, switchMap, throwError } from 'rxjs';
import {
  AlertType,
  DfAlertComponent,
} from '../../shared/components/df-alert/df-alert.component';
import { DfAuthService } from '../services/df-auth.service';
import { ActivatedRoute, Router } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { TranslocoPipe } from '@ngneat/transloco';
import { UntilDestroy } from '@ngneat/until-destroy';
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-password-reset',
  templateUrl: './df-password-reset.component.html',
  styleUrls: ['../adf-user-management.scss'],
  standalone: true,
  imports: [
    MatCardModule,
    DfAlertComponent,
    MatDividerModule,
    ReactiveFormsModule,
    NgIf,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    TranslocoPipe,
  ],
})
export class DfPasswordResetComponent implements OnInit {
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
    private passwordResetService: DfPasswordService,
    private systemConfigDataService: DfSystemConfigDataService,
    private authService: DfAuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.passwordResetForm = this.fb.group({
      username: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      code: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: [
        '',
        [Validators.required, matchValidator('newPassword')],
      ],
    });
  }

  ngOnInit() {
    if (this.route.queryParams) {
      this.route.queryParams.subscribe(params => {
        this.user = {
          code: params['code'],
          email: params['email'],
          username: params['username'],
          admin: params['admin'],
        };

        this.passwordResetForm.patchValue({
          email: this.user.email,
          username: this.user.username,
          code: this.user.code,
        });
      });
    }

    this.systemConfigDataService.environment$.subscribe(env => {
      this.loginAttribute = env.authentication.loginAttribute;
    });
    this.route.data.subscribe(data => {
      if ('type' in data) {
        this.type = data['type'];
      }
    });
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
