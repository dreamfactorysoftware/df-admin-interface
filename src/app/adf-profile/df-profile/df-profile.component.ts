import { Component, OnDestroy, OnInit } from '@angular/core';
import { DfProfileService } from '../services/df-profile.service';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject, catchError, takeUntil, throwError } from 'rxjs';
import { DfSystemConfigDataService } from '../../core/services/df-system-config-data.service';
import { matchValidator } from '../../shared/validators/match.validator';
import { DfBreakpointService } from '../../core/services/df-breakpoint.service';
import {
  AlertType,
  DfAlertComponent,
} from '../../shared/components/df-alert/df-alert.component';

import { DfPasswordService } from '../../adf-user-management/services/df-password.service';
import { UserProfile } from '../../shared/types/user';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { NgIf, AsyncPipe } from '@angular/common';
import { DfProfileDetailsComponent } from '../../shared/components/df-profile-details/df-profile-details.component';
import { MatTabsModule } from '@angular/material/tabs';
import { TranslocoPipe, TranslocoService } from '@ngneat/transloco';

@Component({
  selector: 'df-profile',
  templateUrl: './df-profile.component.html',
  standalone: true,
  imports: [
    MatTabsModule,
    DfAlertComponent,
    ReactiveFormsModule,
    DfProfileDetailsComponent,
    NgIf,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    AsyncPipe,
    TranslocoPipe,
  ],
})
export class DfProfileComponent implements OnInit, OnDestroy {
  private destroyed$ = new Subject<void>();
  profileForm: FormGroup;
  securityQuestionForm: FormGroup;
  updatePasswordForm: FormGroup;
  loginAttribute = 'email';
  isSmallScreen = this.breakPointService.isSmallScreen;
  alertMsg = '';
  showAlert = false;
  alertType: AlertType = 'error';
  currentProfile: UserProfile;
  needPassword = false;

  constructor(
    private profileService: DfProfileService,
    private fb: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private systemConfigDataService: DfSystemConfigDataService,
    private breakPointService: DfBreakpointService,
    private translateService: TranslocoService,
    private passwordService: DfPasswordService
  ) {
    this.profileForm = this.fb.group({
      profileDetailsGroup: this.fb.group({
        username: [''],
        email: ['', Validators.email],
        firstName: [''],
        lastName: [''],
        name: ['', Validators.required],
        phone: [''],
      }),
    });
    this.securityQuestionForm = this.fb.group({
      securityQuestion: [''],
      securityAnswer: [''],
    });
    this.updatePasswordForm = this.fb.group({
      oldPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: [
        '',
        [Validators.required, matchValidator('newPassword')],
      ],
    });
  }

  ngOnInit() {
    this.activatedRoute.data
      .pipe(takeUntil(this.destroyed$))
      .subscribe(({ data }) => {
        this.currentProfile = data;
        this.profileForm.patchValue({
          profileDetailsGroup: {
            username: data.username,
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            name: data.name,
            phone: data.phone,
          },
        });
        this.securityQuestionForm.patchValue({
          securityQuestion: data.securityQuestion,
        });
      });
    this.systemConfigDataService.environment$
      .pipe(takeUntil(this.destroyed$))
      .subscribe(env => {
        this.loginAttribute = env.authentication.loginAttribute;
        if (this.loginAttribute === 'username') {
          this.profileForm
            .get('profileDetailsGroup.username')
            ?.addValidators([Validators.required]);
        } else {
          this.profileForm
            .get('profileDetailsGroup.email')
            ?.addValidators([Validators.required]);
        }
      });
    this.profileForm
      .get('profileDetailsGroup.email')
      ?.valueChanges.pipe(takeUntil(this.destroyed$))
      .subscribe(val => {
        if (this.currentProfile.email !== val) {
          this.needPassword = true;
          this.profileForm.addControl(
            'currentPassword',
            new FormControl('', Validators.required)
          );
        } else {
          this.needPassword = false;
          this.profileForm.removeControl('currentPassword');
        }
      });
  }

  updateProfile() {
    if (this.profileForm.invalid || this.profileForm.pristine) {
      return;
    }
    const body: UserProfile = {
      ...this.currentProfile,
      ...this.profileForm.controls['profileDetailsGroup'].value,
    };
    if (this.needPassword) {
      body.currentPassword = this.profileForm.controls['currentPassword'].value;
    }
    this.profileService
      .saveProfile(body)
      .pipe(
        takeUntil(this.destroyed$),
        catchError(err => {
          this.triggerAlert('error', err.error.error.message);
          return throwError(() => new Error(err));
        })
      )
      .subscribe(() => {
        this.triggerAlert(
          'success',
          this.translateService.translate(
            'userManagement.profile.alerts.detailsUpdated'
          )
        );
      });
  }

  triggerAlert(type: AlertType, msg: string) {
    this.alertType = type;
    this.alertMsg = msg;
    this.showAlert = true;
  }

  updateSecurityQuestion() {
    if (
      this.securityQuestionForm.invalid ||
      this.securityQuestionForm.pristine
    ) {
      return;
    }
    const body = { ...this.currentProfile, ...this.securityQuestionForm.value };
    this.profileService
      .saveProfile(body)
      .pipe(
        takeUntil(this.destroyed$),
        catchError(err => {
          this.triggerAlert('error', err.error.error.message);
          return throwError(() => new Error(err));
        })
      )
      .subscribe(() => {
        this.triggerAlert(
          'success',
          this.translateService.translate(
            'userManagement.profile.alerts.securtyQuestionUpdated'
          )
        );
        this.securityQuestionForm.controls['securityAnswer'].setValue(null);
      });
  }

  updatePassword() {
    if (this.updatePasswordForm.invalid || this.updatePasswordForm.pristine) {
      return;
    }
    this.passwordService
      .updatePassword(this.updatePasswordForm.value)
      .pipe(
        takeUntil(this.destroyed$),
        catchError(err => {
          this.triggerAlert('error', err.error.error.message);
          return throwError(() => new Error(err));
        })
      )
      .subscribe(() => {
        this.triggerAlert(
          'success',
          this.translateService.translate(
            'userManagement.profile.alerts.passwordUpdated'
          )
        );
        this.updatePasswordForm.reset();
      });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
