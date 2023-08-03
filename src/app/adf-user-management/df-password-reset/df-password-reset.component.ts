import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Location } from '@angular/common';
// import { UserEventsService } from 'path/to/user-events.service'; TODO: add user events service
// import { SystemConfigDataService } from 'path/to/system-config-data.service'; TODO: add system config data service
import { Options, ResetFormData } from './types/df-password-reset.types.js';

@Component({
  selector: 'df-password-reset',
  templateUrl: './df-password-reset.component.html',
  styleUrls: ['./df-password-reset.component.scss'],
})
export class DFPasswordResetComponent implements OnInit {
  // If we don't provide an options object it defaults to showing the template.
  @Input() options: Options = { showTemplate: true, login: false };
  @Input() inErrorMsg?: any;
  resetForm: FormGroup;
  showTemplate: boolean = this.options?.showTemplate ?? true;
  // Holds value to for identical password check
  identical = true;
  successMsg = '';
  errorMsg = '';
  loginAttribute = 'email';
  resetByEmail = true;
  resetByUsername = false;
  resetWaiting = false;
  user: any = {}; //unsure of complete shape. gets url params
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
    private location: Location
  ) {}

  ngOnInit() {
    this.resetForm = this.fb.group(
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
        confirm_password: ['', [Validators.required, Validators.minLength(5)]],
      },
      {
        validator: this.handleMatchingPasswords(
          'new_password',
          'confirm_password'
        ),
      }
    );

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
      params.forEach(param => {
        const [key, value] = param.split('=');
        this.user[key] = value;
      });
    }
    this.isAdmin = this.user.admin === '1' ? true : false;
  }

  dismissError() {
    this.errorMsg = '';
  }

  dismissSuccess() {
    this.successMsg = '';
  }

  /**
   *  Test if our entered passwords are identical
   *  Called on keyup in template
   */
  handleMatchingPasswords(
    newPasswordControl: string,
    confirmPasswordControl: string
  ) {
    return (formGroup: FormGroup) => {
      const newPassword = formGroup.controls[newPasswordControl];
      const confirmPassword = formGroup.controls[confirmPasswordControl];

      if (newPassword.value !== confirmPassword.value) {
        confirmPassword.setErrors({ mustMatch: true });
      } else {
        confirmPassword.setErrors(null);
      }
    };
  }

  handleResetPassword() {
    if (!this.identical) {
      this.errorMsg = 'Passwords do not match.';
      return;
    }

    if (this.resetForm.invalid) {
      this.errorMsg = 'Please fill out all required fields.';
      return;
    }

    this.resetWaiting = true;

    const resetFormData: ResetFormData = {
      email: this.resetForm.value.email || '',
      username: this.resetForm.value.username || '',
      code: this.resetForm.value.code || '',
      new_password: this.resetForm.value.new_password || '',
    };

    const url = this.isAdmin ? '/system/admin/password' : '/user/password';
    const params = {
      login: this.options.login,
    };

    return this.http.post(url, resetFormData, { params }).subscribe(
      response => {
        this.es.passwordSetSuccess.next({
          email: this.resetForm.value.email || null,
          username: this.resetForm.value.username || null,
          password: this.resetForm.value.new_password || '',
        });
        this.dismissError();
        this.successMsg = 'Password successfully reset.';
        this.resetForm.reset();
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
