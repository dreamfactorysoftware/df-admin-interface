import { Component, OnDestroy, OnInit } from '@angular/core';
import { DfProfileService } from '../services/df-profile.service';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject, catchError, takeUntil } from 'rxjs';
import { DfSystemConfigDataService } from '../../core/services/df-system-config-data.service';
import { matchValidator } from '../../shared/validators/match.validator';
import { DfBreakpointService } from '../../core/services/df-breakpoint.service';
import { AlertType } from '../../shared/components/df-alert/df-alert.component';
import { TranslateService } from '@ngx-translate/core';
import { DfPasswordService } from '../../adf-user-management/services/df-password.service';
import { UserProfile } from '../types';

@Component({
  selector: 'df-profile',
  templateUrl: './df-profile.component.html',
  styleUrls: ['./df-profile.component.scss'],
  providers: [DfProfileService, DfPasswordService],
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
    private translateService: TranslateService,
    private passwordService: DfPasswordService
  ) {
    this.profileForm = this.fb.group({
      userDetailsGroup: this.fb.group({
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
      newPassword: ['', [Validators.required, Validators.minLength(5)]],
      confirmPassword: [
        '',
        [Validators.required, matchValidator('newPassword')],
      ],
    });
  }

  ngOnInit() {
    this.activatedRoute.data
      .pipe(takeUntil(this.destroyed$))
      .subscribe(({ profile }) => {
        this.currentProfile = profile;
        this.profileForm.patchValue({
          userDetailsGroup: {
            username: profile.username,
            email: profile.email,
            firstName: profile.firstName,
            lastName: profile.lastName,
            name: profile.name,
            phone: profile.phone,
          },
        });
        this.securityQuestionForm.patchValue({
          securityQuestion: profile.securityQuestion,
        });
      });
    this.systemConfigDataService.environment$
      .pipe(takeUntil(this.destroyed$))
      .subscribe(env => {
        this.loginAttribute = env.authentication.loginAttribute;
        if (this.loginAttribute === 'username') {
          this.profileForm
            .get('userDetailsGroup.username')
            ?.addValidators([Validators.required]);
        } else {
          this.profileForm
            .get('userDetailsGroup.email')
            ?.addValidators([Validators.required]);
        }
      });
    this.profileForm
      .get('userDetailsGroup.email')
      ?.valueChanges.subscribe(val => {
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
    if (!this.profileForm.valid || this.profileForm.pristine) {
      return;
    }
    const body: UserProfile = {
      ...this.currentProfile,
      ...this.profileForm.controls['userDetailsGroup'].value,
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
          return err;
        })
      )
      .subscribe(() => {
        this.triggerAlert(
          'success',
          this.translateService.instant(
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
      !this.securityQuestionForm.valid ||
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
          return err;
        })
      )
      .subscribe(() => {
        this.triggerAlert(
          'success',
          this.translateService.instant(
            'userManagement.profile.alerts.securtyQuestionUpdated'
          )
        );
        this.securityQuestionForm.controls['securityAnswer'].setValue(null);
      });
  }

  updatePassword() {
    if (!this.updatePasswordForm.valid || this.updatePasswordForm.pristine) {
      return;
    }
    this.passwordService
      .updatePassword(this.updatePasswordForm.value)
      .pipe(
        takeUntil(this.destroyed$),
        catchError(err => {
          this.triggerAlert('error', err.error.error.message);
          return err;
        })
      )
      .subscribe(() => {
        this.triggerAlert(
          'success',
          this.translateService.instant(
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
