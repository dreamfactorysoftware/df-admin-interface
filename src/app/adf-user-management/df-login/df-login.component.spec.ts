import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginComponent } from './df-login.component';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, HttpClientModule, CommonModule],
      declarations: [LoginComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('login form should be visible by default', () => {
    expect(component.loginFormTitle).toContain('Login');
  });

  it('login form errors should not be visible if input is valid', () => {
    component.loginFormGroup.setValue({
      selectedService: null,
      userID: 'test@test.com',
      password: 'testpw1231212',
      rememberMe: false,
    });

    fixture.detectChanges();

    const errorMsgs = fixture.debugElement.queryAll(
      By.css('.login-form-error-msg')
    );

    expect(errorMsgs).toHaveLength(0);
  });

  it('login form errors should be visible if input is invalid', () => {
    component.loginFormGroup.setValue({
      selectedService: null,
      userID: 'invalidemail',
      password: 'testpw',
      rememberMe: false,
    });

    fixture.detectChanges();

    const errorMsgs = fixture.debugElement.queryAll(
      By.css('.login-form-error-msg')
    );

    expect(errorMsgs).toHaveLength(2);
  });

  // TODO: add more tests when login service is implemented in the component
});
