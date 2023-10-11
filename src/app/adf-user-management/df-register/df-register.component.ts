import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { catchError, throwError } from 'rxjs';
import { DfSystemConfigDataService } from 'src/app/shared/services/df-system-config-data.service';
import { AlertType } from 'src/app/shared/components/df-alert/df-alert.component';
import { DfAuthService } from '../services/df-auth.service';
import { ROUTES } from 'src/app/shared/types/routes';

import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { DfProfileDetailsComponent } from '../../shared/components/df-profile-details/df-profile-details.component';
import { MatDividerModule } from '@angular/material/divider';
import { DfAlertComponent } from '../../shared/components/df-alert/df-alert.component';
import { MatCardModule } from '@angular/material/card';
import { NgIf } from '@angular/common';
import { TranslocoPipe } from '@ngneat/transloco';
import { UntilDestroy } from '@ngneat/until-destroy';
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-register',
  templateUrl: './df-register.component.html',
  styleUrls: ['../adf-user-management.scss'],
  standalone: true,
  imports: [
    NgIf,
    MatCardModule,
    DfAlertComponent,
    MatDividerModule,
    ReactiveFormsModule,
    DfProfileDetailsComponent,
    MatButtonModule,
    RouterLink,
    TranslocoPipe,
  ],
})
export class DfRegisterComponent implements OnInit {
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
    this.systemConfigDataService.environment$.subscribe(env => {
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
}
