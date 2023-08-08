/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, OnInit } from '@angular/core';
import { SystemConfigDataService } from '../../services/system-config-data.service';
import { UserDataService } from '../../services/user-data-service.service';
import { UserEventsService } from '../../services/user-events-service.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';

// TODO: update when necessary
//const INSTANCE_URL = { url: '' };

type UserCredObj = {
  username?: string;
  email?: string;
  password: string;
  service?: string;
  remember_me?: boolean;
};

type UserField = {
  icon: string;
  text: string;
  type: string;
};

@Component({
  selector: 'df-user-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  errorMsg: string;
  successMsg: string;
  loginFormTitle: string;
  adldapAvailable: boolean;
  loginAttribute = 'email';
  loginActive: boolean;
  loginDirect: boolean;
  loginWaiting: boolean;
  rememberMe: boolean;
  resetPasswordActive: boolean;
  showOAuth: boolean;
  allowForeverSessions: boolean;
  emailError: boolean;
  showTemplate: boolean;
  hidePasswordField: boolean;
  systemConfig: any;
  creds: UserCredObj;
  adldap: any[];
  selectedService: any;
  userField: UserField;

  loginFormGroup = new FormGroup({
    selectedService: new FormControl(),
    userID: new FormControl('', [
      //this can be email or username based on the loginAttribute variable
      Validators.required,
      this.loginAttribute === 'email'
        ? Validators.email
        : Validators.minLength(3) && Validators.maxLength(256),
    ]),
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(8),
    ]),
    rememberMe: new FormControl(false),
  });

  constructor(private systemConfigDataService: SystemConfigDataService) {
    this.errorMsg = '';
    this.successMsg = '';
    this.loginFormTitle = 'Login';
    this.adldapAvailable = false;
    this.loginWaiting = false;
    this.rememberMe = false;
    this.resetPasswordActive = false;
    this.showOAuth = true;
    this.allowForeverSessions = false;
    this.emailError = false;
    this.hidePasswordField = false;
    this.adldap = [];
    this.creds = {
      email: '',
      password: '',
    };
    this.userField = {
      icon: 'fa-envelope',
      text: 'Enter Email',
      type: 'email',
    };
  }

  ngOnInit(): void {
    this.systemConfig = this.systemConfigDataService.getSystemConfig();
    if (this.systemConfig && this.systemConfig.authentication) {
      if (Object.hasOwn(this.systemConfig.authentication, 'adldap')) {
        this.adldap = this.systemConfig.authentication.adldap;
      }
      if (Object.hasOwn(this.systemConfig.authentication, 'login_attribute')) {
        this.loginAttribute = this.systemConfig.authentication.login_attribute;
      }
    }

    if (this.loginAttribute === 'username') {
      this.userField = {
        icon: 'fa-user',
        text: 'Enter Username',
        type: 'text',
      };
    }

    this.adldapAvailable = this.adldap.length > 0;
    this.selectedService = null;
    this.rememberMe = false;

    //TODO: could be needed for oauth
    // const token = this.getQueryParameter('session_token');
    // const oauth_code = this.getQueryParameter('code');
    // const oauth_state = this.getQueryParameter('state');
    // const oauth_token = this.getQueryParameter('oauth_token');
    // const uri = window.location.href.split('?');
    // const baseUrl = uri[0];
  }

  dismissError() {
    this.errorMsg = '';
  }

  dismissSuccess() {
    this.successMsg = '';
  }

  getUserIDErrorMessage() {
    if (this.loginFormGroup.controls.userID.hasError('required')) {
      return 'You must enter a value';
    }

    return this.loginFormGroup.controls.userID.hasError('email')
      ? 'Not a valid email'
      : '';
  }

  showLoginForm() {
    this.toggleFormsState();
  }

  forgotPassword() {
    console.log('Forgot password clicked!');
  }

  rememberLogin(checked: boolean) {
    this.rememberMe = checked;
  }

  useAdLdapService(service: any) {
    this.selectedService = service;

    this.userField = {
      icon: 'fa-user',
      text: 'Enter Username',
      type: 'text',
    };

    this.creds = {
      username: '',
      password: '',
    };

    if (service) {
      this.creds.service = service;
    } else {
      this.userField = {
        icon: 'fa-envelope',
        text: 'Enter Email',
        type: 'email',
      };

      this.creds.email = '';
    }
  }

  getQueryParameter(key: string) {
    key = key.replace(/[*+?^$.[\]{}()|\\/]/g, '\\$&');
    const match = window.location.search.match(
      new RegExp('[?&]' + key + '=([^&]+)(&|$)')
    );
    const result = match && decodeURIComponent(match[1].replace(/\+/g, ' '));
    return result ?? '';
  }

  login() {
    console.log('Login clicked!');
    if (this.isFormValid()) {
      this.loginWaiting = true;
      // TODO: add login request logic here
    }
    this.loginWaiting = false;
  }

  isFormValid() {
    return this.loginFormGroup.valid;
  }

  toggleFormsState() {
    this.loginActive = !this.loginActive;
    this.resetPasswordActive = !this.resetPasswordActive;
  }
}
