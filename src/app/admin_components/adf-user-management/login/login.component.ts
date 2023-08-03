import { HttpClient } from '@angular/common/http';
import {
  Component,
  OnChanges,
  OnInit,
  SimpleChanges,
  ChangeDetectorRef,
} from '@angular/core';
import { SystemConfigDataService } from 'src/app/services/system-config-data.service';
import { Router } from '@angular/router';
import { UserDataService } from 'src/app/services/user-data-service.service';
import { UserEventsService } from 'src/app/services/user-events-service.service';
import { lastValueFrom } from 'rxjs';
import { FormControl, FormGroup } from '@angular/forms';

// TODO: update when necessary
const INSTANCE_URL = { url: '' };

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
  selector: 'app-df-user-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit, OnChanges {
  errorMsg: string;
  successMsg: string;
  loginFormTitle: string;
  adldapAvailable: boolean;
  loginAttribute: string;
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
    email: new FormControl(''),
    password: new FormControl(''),
    rememberMe: new FormControl(false),
  });

  constructor(
    private systemConfigDataService: SystemConfigDataService,
    private userDataService: UserDataService,
    private userEventService: UserEventsService,
    private http: HttpClient,
    private router: Router,
    private cdRef: ChangeDetectorRef
  ) {
    this.errorMsg = '';
    this.successMsg = '';
    this.loginFormTitle = 'Login';
    this.adldapAvailable = false;
    this.loginActive = true;
    this.loginAttribute = 'email';
    this.loginDirect = false;
    this.loginWaiting = false;
    this.rememberMe = false;
    this.resetPasswordActive = false;
    this.showOAuth = true;
    this.allowForeverSessions = false;
    this.emailError = false;
    this.showTemplate = true;
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

    const token = this.getQueryParameter('session_token');
    const oauth_code = this.getQueryParameter('code');
    const oauth_state = this.getQueryParameter('state');
    const oauth_token = this.getQueryParameter('oauth_token');
    const uri = window.location.href.split('?');
    const baseUrl = uri[0];

    if (token !== '') {
      this.loginWaiting = true;
      this.showOAuth = false;
      this.loginDirect = true;
      lastValueFrom(
        this.http.get(INSTANCE_URL.url + '/user/session?session_token=' + token)
      )
        .then(
          // success method
          (result: any) => {
            // Set the current user in the UserDataService service
            this.userDataService.setCurrentUser(result.data);

            // Emit a success message so we can hook in
            //this.$emit(this.es.loginSuccess, result.data);

            this.loginDirect = false;
          }
        )
        .catch(result => {
          // Reload the admin app to remove session_token param from url and show the login prompt.
          window.location.href = baseUrl + '#/login';
          this.loginDirect = false;
        });
    } else if ((oauth_code && oauth_state) || oauth_token) {
      this.loginWaiting = true;
      this.showOAuth = false;
      lastValueFrom(
        this.http.post(
          INSTANCE_URL.url +
            '/user/session?oauth_callback=true&' +
            location.search.substring(1),
          {}
        )
      ).then(
        // success method
        (result: any) => {
          // Set the current user in the UserDataService service
          this.userDataService.setCurrentUser(result.data);

          // Emit a success message so we can hook in
          //this.$emit(this.es.loginSuccess, result.data);
        }
      );
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['options'] && changes['options'].currentValue) {
      this.handleOptionsChange(changes['options'].currentValue);
    }
  }

  private handleOptionsChange(newValue: any) {
    if (Object.hasOwn(newValue, 'showTemplate')) {
      this.showTemplate = newValue.showTemplate;
      this.cdRef.detectChanges(); // Detect changes manually if needed
    }
  }

  dismissError() {
    this.errorMsg = '';
  }

  dismissSuccess() {
    this.successMsg = '';
  }

  showLoginForm() {
    this.toggleFormsState();
  }

  forgotPassword() {
    // this.$broadcast(this.userEventsService.password.passwordResetRequest, {
    //   email: this.creds.email,
    // });
  }

  rememberLogin(checked: boolean) {
    this.rememberMe = checked;
  }

  skipLogin() {
    //window.location.href = '/services';
    this.router.navigate(['/services']);
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

  getQueryParameter(key: any) {
    key = key.replace(/[*+?^$.[\]{}()|\\/]/g, '\\$&');
    const match = window.location.search.match(
      new RegExp('[?&]' + key + '=([^&]+)(&|$)')
    );
    const result = match && decodeURIComponent(match[1].replace(/\+/g, ' '));
    return result ?? '';
  }

  login(credsDataObj: UserCredObj) {
    // check if the user has entered creds or if
    // they were supplied through a browser mechanism
    credsDataObj.password = this.loginFormGroup.value.password as string;
    if (this.selectedService) {
      credsDataObj.username = this.loginFormGroup.value.email as string;
      credsDataObj.service = this.loginFormGroup.value
        .selectedService as string;
    } else if (this.loginAttribute === 'username') {
      credsDataObj.username = this.loginFormGroup.value.email as string;
    } else if (credsDataObj.email === '' || credsDataObj.password === '') {
      // They were either supplied by a browser mechanism or
      // they weren't entered.  We use jQuery to grab the vals
      // If they are still empty the error handler will take care of
      // it for us.
      credsDataObj.email = this.loginFormGroup.value.email as string;
    }

    credsDataObj.remember_me = this.loginFormGroup.value.rememberMe as boolean;
  }

  _login(credsDataObj: UserCredObj) {
    // fire up waiting directive
    this.loginWaiting = true;

    // call private login request function with a credentials object
    lastValueFrom(this.loginRequest(credsDataObj, false))
      .then(
        // success method
        (result: any) => {
          // Set the current user in the UserDataService service
          this.userDataService.setCurrentUser(result.data);

          // Emit a success message so we can hook in
          // this.$emit(this.es.loginSuccess, result.data);
          // this.$root.$emit(this.es.loginSuccess, result.data);
        }
      )
      .catch(
        // Error method
        (reject: any) => {
          if (
            (reject.status == '401' || reject.status == '404') &&
            !this.selectedService
          ) {
            this.loginWaiting = true;
            lastValueFrom(this.loginRequest(credsDataObj, true))
              .then(
                // success method
                (result: any) => {
                  // Set the current user in the UserDataService service
                  this.userDataService.setCurrentUser(result.data);

                  // Emit a success message so we can hook in
                  // this.$emit(this.es.loginSuccess, result.data);
                  // this.$root.$emit(this.es.loginSuccess, result.data);
                }
              )
              .catch(
                // Error method
                reject => {
                  // Handle Login error with template error message
                  this.errorMsg = reject.data.error.message;
                  // this.$emit(this.es.loginError, reject);
                }
              )
              .finally(() => {
                // shutdown waiting directive
                this.loginWaiting = false;
              });
          } else {
            // Handle Login error with template error message
            this.errorMsg = reject.data.error.message;
            //this.$emit(this.es.loginError, reject);
          }
        }
      )
      .finally(() => {
        // shutdown waiting directive
        this.loginWaiting = false;
      });
  }

  loginRequest(credsDataObj: UserCredObj, admin = false) {
    if (!admin) {
      // Return the posted request data as a promise
      return this.http.post(INSTANCE_URL.url + '/user/session', credsDataObj);
    } else {
      return this.http.post(
        INSTANCE_URL.url + '/system/admin/session',
        credsDataObj
      );
    }
  }

  toggleFormsState() {
    this.loginActive = !this.loginActive;
    this.resetPasswordActive = !this.resetPasswordActive;
  }
}
