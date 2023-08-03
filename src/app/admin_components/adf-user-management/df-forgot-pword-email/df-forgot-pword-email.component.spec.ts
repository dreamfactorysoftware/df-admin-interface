import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';

import { DFForgotPasswordByEmailComponent } from './df-forgot-pword-email.component';
import { HttpClientModule } from '@angular/common/http';
import { By } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DFWaitingComponent } from '../df-waiting/df-waiting.component';

describe('DFForgotPasswordByEmailComponent', () => {
  let component: DFForgotPasswordByEmailComponent;
  let fixture: ComponentFixture<DFForgotPasswordByEmailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, HttpClientModule, CommonModule],
      declarations: [DFForgotPasswordByEmailComponent, DFWaitingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DFForgotPasswordByEmailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('forgot password form with email should be visible by default', () => {
    expect(component).toBeTruthy();
    expect(component.emailForm).toBeTruthy();

    const formContainer = fixture.debugElement.query(
      By.css('.reset-password-form')
    );
    expect(formContainer).toBeTruthy();
  });

  it('email field on the forget password form should be visible by default', () => {
    expect(component).toBeTruthy();
    expect(component.emailForm).toBeTruthy();

    const emailField = fixture.debugElement.query(
      By.css('#reset-password-email')
    );
    expect(emailField).toBeTruthy();
  });

  it('username field on the forget password form should be visible when login attribute is username', () => {
    component.loginAttribute = 'username';
    component.resetByEmail = false;
    component.resetByUsername = true;

    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(component.emailForm).toBeTruthy();

    const usernameField = fixture.debugElement.query(
      By.css('#reset-password-username')
    );
    expect(usernameField).toBeTruthy();
  });

  it('Success message should be visible after successful password reset request when no security question is returned', fakeAsync(() => {
    const mockFn = jest
      .spyOn(component, 'resetPasswordRequest')
      .mockResolvedValue({
        data: {},
      });

    component.resetPasswordForm.setValue({
      email: 'user1@test.com',
      username: null,
    });

    component.requestPasswordReset();

    tick(500);

    expect(mockFn).toHaveBeenCalledTimes(1);

    fixture.detectChanges();

    const successMsgDiv = fixture.debugElement.query(By.css('#alert-success'));
    expect(successMsgDiv).toBeTruthy();

    expect(component.successMsg).toContain(
      "A password reset email has been sent to the user's email address."
    );
  }));

  it('Error message should be visible after error password reset request and no security question is returned', fakeAsync(() => {
    const mockErrResponse = {
      data: {
        error: {
          message: 'error',
        },
      },
    };
    const mockFn = jest
      .spyOn(component, 'resetPasswordRequest')
      .mockRejectedValue(mockErrResponse);

    component.resetPasswordForm.setValue({
      email: 'user1@test.com',
      username: null,
    });

    component.requestPasswordReset();

    tick(500);

    expect(mockFn).toHaveBeenCalledTimes(1);

    fixture.detectChanges();

    const errorMsgDiv = fixture.debugElement.query(By.css('#alert-danger'));
    expect(errorMsgDiv).toBeTruthy();

    expect(component.errorMsg).toContain(mockErrResponse.data.error.message);
  }));

  it('security question form should be visible if security question is sent back from reset password api', fakeAsync(() => {
    const mockFn = jest
      .spyOn(component, 'resetPasswordRequest')
      .mockResolvedValue({
        data: { security_question: '' },
      });

    component.resetPasswordForm.setValue({
      email: 'user1@test.com',
      username: null,
    });

    component.requestPasswordReset();

    tick(500);

    expect(mockFn).toHaveBeenCalledTimes(1);

    fixture.detectChanges();
    expect(component.securityQuestionForm).toBeTruthy();
    const securityFormContainer = fixture.debugElement.query(
      By.css('.security-question-form')
    );
    expect(securityFormContainer).toBeTruthy();
  }));
});
