import { Component, Input, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Location } from '@angular/common';
// import { UserEventsService } from 'path/to/user-events.service'; TODO: add user events service
// import { SystemConfigDataService } from 'path/to/system-config-data.service'; TODO: add system config data service
import {
  Options,
  ResetFormData,
  UserParams,
} from './types/df-password-reset.types';
import { PasswordResetService } from '../services/df-password-reset.service';

@Component({
  selector: 'df-password-reset',
  templateUrl: './df-password-reset.component.html',
  styleUrls: ['./df-password-reset.component.scss'],
})
export class DFPasswordResetComponent implements OnInit {
  // If we don't provide an options object it defaults to showing the template.
  @Input() options: Options = { showTemplate: true, login: false };
  @Input() inErrorMsg?: string;
  passwordResetForm: FormGroup;
  showTemplate: boolean = this.options?.showTemplate ?? true;
  // Holds value to for identical password check
  identical = true;
  successMsg = '';
  errorMsg = '';
  loginAttribute = 'email';
  resetByEmail = true;
  resetByUsername = false;
  resetWaiting = false;
  user: UserParams = { email: '', username: '', code: '', admin: '' };
  isAdmin = false;

  // WATCHERS AND INIT
  // unsure of shape
  es: any;
  systemConfig: any;

  // private userEventsService: UserEventsService, TODO: add user events service
  // private systemConfigDataService: SystemConfigDataService TODO: add system config data service
  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private location: Location,
    private passwordResetService: PasswordResetService
  ) {
    this.passwordResetForm = this.fb.group(
      {
        email: [
          '',
          [
            this.resetByEmail ? Validators.required : Validators.nullValidator,
            Validators.email,
          ],
        ],
        username: [
          '',
          [
            this.resetByUsername
              ? Validators.required
              : Validators.nullValidator,
          ],
        ],
        code: ['', [Validators.required]],
        new_password: ['', [Validators.required, Validators.minLength(5)]],
        confirm_password: [
          '',
          [
            Validators.required,
            // Validators.minLength(5),
            // this.passwordMatchValidator,
          ],
          // { validator: this.passwordMatchValidator },
        ],
      },
      {
        validator: this.passwordMatchValidator,
      }
    );
  }

  ngOnInit() {
    // CREATE SHORT NAMES
    // this.es = this.userEventsService.password; TODO: add user events service

    // this.systemConfig = this.systemConfigDataService.getSystemConfig(); TODO: add system config data service
    if (
      this.systemConfig &&
      this.systemConfig.authentication
      // && this.systemConfig.authentication.hasOwnProperty('login_attribute')
    ) {
      this.loginAttribute = this.systemConfig.authentication.login_attribute;
    }

    if (this.loginAttribute === 'username') {
      this.resetByEmail = false;
      this.resetByUsername = true;
    }

    const UrlParams = this.location.path().split('?')[1];
    if (UrlParams) {
      const params = UrlParams.split('&');
      params.forEach((param: string) => {
        const [key, value] = param.split('=');
        this.user[key as keyof UserParams] = value;
      });
    }
    console.log('Params', this.user.code);
    // update username, email, and code fields with param values
    this.passwordResetForm.patchValue({
      email: this.user.email,
      username: this.user.username,
      code: this.user.code,
    });
    this.isAdmin = this.user.admin === '1' ? true : false;
  }

  dismissError() {
    this.errorMsg = '';
  }

  dismissSuccess() {
    this.successMsg = '';
  }

  passwordMatchValidator: ValidatorFn = (
    control: AbstractControl
  ): ValidationErrors | null => {
    const newPassword = control.get('new_password');
    const confirmPassword = control.get('confirm_password');
    console.log(
      'VAlIdAtE',
      newPassword?.value === confirmPassword?.value
        ? null
        : { notmatched: true }
    );

    return newPassword?.value === confirmPassword?.value
      ? null
      : { notmatched: true };
  };

  resetPassword() {
    if (!this.identical) {
      this.errorMsg = 'Passwords do not match.';
      return;
    }

    if (this.passwordResetForm.invalid) {
      this.errorMsg = 'Please fill out all required fields.';
      return;
    }

    this.resetWaiting = true;

    const resetFormData: ResetFormData = {
      email: this.passwordResetForm.value.email || '',
      username: this.passwordResetForm.value.username || '',
      code: this.passwordResetForm.value.code || '',
      new_password: this.passwordResetForm.value.new_password || '',
    };

    const url = this.isAdmin ? '/system/admin/password' : '/user/password';
    const params = new HttpParams().set('login', this.options.login);

    this.passwordResetService
      .resetPassword(url, resetFormData, params)
      .subscribe(
        response => {
          this.es.passwordSetSuccess.next({
            email: this.passwordResetForm.value.email || null,
            username: this.passwordResetForm.value.username || null,
            password: this.passwordResetForm.value.new_password || '',
          });
          this.dismissError();
          this.successMsg = 'Password successfully reset.';
          this.passwordResetForm.reset();
          this.resetWaiting = false;
          this.showTemplate = false;
        },
        error => {
          this.errorMsg = error.error.message;
          this.resetWaiting = false;
        }
      );
  }
}
