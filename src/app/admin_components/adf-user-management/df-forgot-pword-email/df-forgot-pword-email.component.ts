import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SystemConfigDataService } from 'src/app/services/system-config-data.service';
import { lastValueFrom } from 'rxjs';
import { FormControl, FormGroup } from '@angular/forms';

// TODO: update when necessary
const INSTANCE_URL = { url: '' };

type SecurityQuestionPayload = {
  email: string | null;
  username: string | null;
  security_question: string | null;
  security_answer: string | null;
  new_password: string | null;
  verify_password: string | null;
};

type ResetPasswordObj = {
  email: string | null;
  username: string | null;
  reset: boolean | null;
};

@Component({
  selector: 'app-df-forgot-pword-email',
  templateUrl: './df-forgot-pword-email.component.html',
  styleUrls: ['./df-forgot-pword-email.component.css'],
})
export class DFForgotPasswordByEmailComponent implements OnInit {
  emailForm: boolean;
  emailError: boolean;
  securityQuestionForm: boolean;
  hidePasswordField: boolean;

  allowForeverSessions: boolean;
  loginAttribute: string;
  systemConfig: any;
  resetByEmail: boolean;
  resetByUsername: boolean;
  sq: SecurityQuestionPayload;
  identical: boolean;
  requestWaiting: boolean;
  questionWaiting: boolean;

  successMsg: string;
  errorMsg: string;
  es: string;

  resetPasswordForm = new FormGroup({
    email: new FormControl(''),
    username: new FormControl(''),
  });

  securityQuestionFormGroup = new FormGroup({
    email: new FormControl(''),
    security_question: new FormControl(''),
    security_answer: new FormControl(''),
    new_password: new FormControl(''),
    verify_password: new FormControl(''),
  });

  constructor(
    private http: HttpClient,
    systemConfigDataService: SystemConfigDataService
  ) {
    // TODO: add usereventservice
    //this.es = userEventsService.password;
    this.es = '';

    this.emailForm = true;
    this.emailError = false;
    this.securityQuestionForm = false;
    this.hidePasswordField = false;

    this.allowForeverSessions = false;
    this.loginAttribute = 'email';
    this.resetByEmail = true;
    this.resetByUsername = false;
    this.systemConfig = systemConfigDataService.getSystemConfig();
    this.successMsg = '';
    this.errorMsg = '';

    this.sq = {
      email: null,
      username: null,
      security_question: null,
      security_answer: null,
      new_password: null,
      verify_password: null,
    };

    this.identical = true;
    this.requestWaiting = false;
    this.questionWaiting = false;
  }

  ngOnInit(): void {
    if (this.systemConfig && this.systemConfig.authentication) {
      if (
        Object.hasOwn(
          this.systemConfig.authentication,
          'allow_forever_sessions'
        )
      ) {
        this.allowForeverSessions =
          this.systemConfig.authentication.allow_forever_sessions;
      }
      if (Object.hasOwn(this.systemConfig.authentication, 'login_attribute')) {
        this.loginAttribute = this.systemConfig.authentication.login_attribute;
      }
    }

    if (this.loginAttribute === 'username') {
      this.resetByEmail = false;
      this.resetByUsername = true;
    }
  }

  showLoginForm() {
    throw new Error('Method not Implemented Yet!');
  }

  dismissSuccess() {
    throw new Error('Method not Implemented Yet!');
  }

  dismissError() {
    throw new Error('Method not Implemented Yet!');
  }

  // TODO: consider refactoring to add admin as a parameter
  private resetPasswordRequest(
    requestDataObj: ResetPasswordObj,
    admin = false
  ) {
    if (!admin) {
      // Post request for password change and return promise
      return this.http.post(
        INSTANCE_URL.url + '/user/password?reset=true',
        requestDataObj
      );
    } else {
      return this.http.post(
        INSTANCE_URL.url + '/system/admin/password?reset=true',
        requestDataObj
      );
    }
  }

  requestPasswordReset() {
    // Add property to the request data
    // this contains an object with the email address
    //requestDataObj['reset'] = true;

    const requestDataObj: ResetPasswordObj = {
      email: this.resetPasswordForm.value.email as string | null,
      username: this.resetPasswordForm.value.username as string | null,
      reset: true,
    };

    // Turn on waiting directive
    this.requestWaiting = true;

    lastValueFrom(this.resetPasswordRequest(requestDataObj))
      .then((result: any) => {
        if (Object.hasOwn(result.data, 'security_question')) {
          this.emailForm = false;
          this.securityQuestionForm = true;

          this.sq.email = requestDataObj.email;
          this.sq.username = requestDataObj.username
            ? requestDataObj.username
            : null;
          this.sq.security_question = result.data.security_question;
        } else {
          this.successMsg =
            "A password reset email has been sent to the user's email address.";

          // TODO: ADDRESS COMMENTS BELOW
          // Emit a confirm message indicating that is the next step
          //this.$emit(this.es.passwordResetRequestSuccess, requestDataObj.email);
        }
      })
      .catch(err => {
        if (err.status == '401' || err.status == '404') {
          lastValueFrom(this.resetPasswordRequest(requestDataObj, true))
            .then(
              // handle successful password reset
              (result: any) => {
                if (
                  Object.hasOwn(result.data.hasOwnProperty, 'security_question')
                ) {
                  this.emailForm = false;
                  this.securityQuestionForm = true;

                  this.sq.email = requestDataObj.email;
                  this.sq.security_question = result.data.security_question;
                } else {
                  this.successMsg =
                    "A password reset email has been sent to the user's email address.";

                  // TODO: ADDRESS COMMENTS BELOW
                  // Emit a confirm message indicating that is the next step
                  // this.$emit(
                  //   this.es.passwordResetRequestSuccess,
                  //   requestDataObj.email
                  // );
                }
              }
            )
            .catch(err => {
              // Message received from server
              this.errorMsg = err.data.error.message;
            })
            .finally(() => {
              // turn off waiting directive
              this.requestWaiting = false;
            });
        } else {
          // Message received from server
          this.errorMsg = err.data.error.message;
        }
      });
  }

  resetPasswordSQ(requestDataObj: SecurityQuestionPayload, admin = false) {
    if (!admin) {
      // Post request for password change and return promise
      return this.http.post(
        INSTANCE_URL.url + '/user/password?login=false',
        requestDataObj
      );
    } else {
      return this.http.post(
        INSTANCE_URL.url + '/system/admin/password?login=false',
        requestDataObj
      );
    }
  }

  verifyPassword(userDataObj: SecurityQuestionPayload) {
    this.identical = userDataObj.new_password === userDataObj.verify_password;
  }

  verifyPasswordLength(credsDataObj: SecurityQuestionPayload) {
    return credsDataObj.new_password && credsDataObj.new_password.length >= 5;
  }

  securityQuestionSubmit() {
    const sq: SecurityQuestionPayload = {
      email: this.securityQuestionFormGroup.value.email as string | null,
      username: null, // TODO: possibly add username field here
      security_question: this.securityQuestionFormGroup.value
        .security_question as string | null,
      security_answer: this.securityQuestionFormGroup.value.security_answer as
        | string
        | null,
      new_password: this.securityQuestionFormGroup.value.new_password as
        | string
        | null,
      verify_password: this.securityQuestionFormGroup.value.verify_password as
        | string
        | null,
    };

    if (!this.identical) {
      this.errorMsg = 'Passwords do not match.';
      return;
    }

    if (!this.verifyPasswordLength(sq)) {
      this.errorMsg = 'Password must be at least 5 characters.';
      return;
    }

    this.questionWaiting = true;

    lastValueFrom(this.resetPasswordSQ(sq))
      .then((result: any) => {
        const userCredsObj = {
          email: sq.email,
          username: sq.username ?? null,
          password: sq.new_password,
        };

        // TODO: ADDRESS COMMENTS BELOW
        //this.$emit(UserEventsService.password.passwordSetSuccess, userCredsObj);
      })
      .catch((reject: any) => {
        if (reject.status == '401' || reject.status == '404') {
          lastValueFrom(this.resetPasswordSQ(sq, true))
            .then(result => {
              const userCredsObj = {
                email: sq.email,
                password: sq.new_password,
              };

              // TODO: ADDRESS COMMENTS BELOW
              // this.$emit(
              //   UserEventsService.password.passwordSetSuccess,
              //   userCredsObj
              // );
            })
            .catch(reject => {
              this.questionWaiting = false;
              this.errorMsg = reject.data.error.message;
              // TODO: ADDRESS COMMENTS BELOW
              //this.$emit(UserEventsService.password.passwordSetError);
            });
        } else {
          this.questionWaiting = false;
          this.errorMsg = reject.data.error.message;
          // TODO: ADDRESS COMMENTS BELOW
          //this.$emit(UserEventsService.password.passwordSetError);
        }
      });
  }
}
