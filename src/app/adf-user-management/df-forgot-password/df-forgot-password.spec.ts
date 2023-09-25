import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfForgotPasswordComponent } from './df-forgot-password.component';
import { TranslocoService, provideTransloco } from '@ngneat/transloco';
import { TranslocoHttpLoader } from '../../../transloco-loader';
import { ActivatedRoute } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DfBaseCrudService } from '../../core/services/df-base-crud.service';
import { DfSystemConfigDataService } from 'src/app/core/services/df-system-config-data.service';
import { DfPasswordService } from '../services/df-password.service';

describe('DfForgotPasswordComponent - Username Reset', () => {
  let component: DfForgotPasswordComponent;
  let fixture: ComponentFixture<DfForgotPasswordComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        DfForgotPasswordComponent,
        HttpClientTestingModule,
        NoopAnimationsModule,
      ],
      providers: [
        provideTransloco({
          config: {
            defaultLang: 'en',
            availableLangs: ['en'],
          },
          loader: TranslocoHttpLoader,
        }),
        TranslocoService,
        {
          provide: DfSystemConfigDataService,
          useValue: {
            environment$: {
              pipe: () => {
                return {
                  subscribe: (fn: (value: any) => void) =>
                    fn({ authentication: { loginAttribute: 'username' } }),
                };
              },
            },
          },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            data: {
              pipe: () => {
                return {
                  subscribe: (fn: (value: any) => void) => fn({}),
                };
              },
            },
          },
        },
      ],
    });
    fixture = TestBed.createComponent(DfForgotPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
    component.forgetPasswordForm.reset();
    component.securityQuestionForm.reset();
    component.ngOnDestroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set validators for username based on loginAttribute', () => {
    expect(
      component.forgetPasswordForm.controls['username'].validator
    ).toBeTruthy();
    expect(
      component.forgetPasswordForm.controls['email'].validator
    ).toBeFalsy();
  });

  it('should not call password reset service if form is invalid', () => {
    const crudServiceSpy = jest.spyOn(DfBaseCrudService.prototype, 'create');
    component.requestReset();
    expect(component.forgetPasswordForm.valid).toBeFalsy();
    expect(crudServiceSpy).not.toHaveBeenCalled();
  });

  it('should call password reset service if form is valid', () => {
    const crudServiceSpy = jest.spyOn(
      DfPasswordService.prototype,
      'requestPasswordReset'
    );
    component.forgetPasswordForm.controls['username'].setValue('test');
    component.requestReset();
    expect(component.forgetPasswordForm.valid).toBeTruthy();
    expect(crudServiceSpy).toHaveBeenCalled();
  });

  it('should require security question answer if security question is enabled', () => {
    const crudServiceSpy = jest.spyOn(
      DfPasswordService.prototype,
      'requestPasswordReset'
    );
    component.hasSecurityQuestion = true;
    component.resetPassword();

    expect(component.securityQuestionForm.valid).toBeFalsy();
    expect(crudServiceSpy).not.toHaveBeenCalled();
  });

  it('should call resetPassword service if securityQuestionForm is valid', () => {
    const crudServiceSpy = jest.spyOn(
      DfPasswordService.prototype,
      'requestPasswordReset'
    );
    component.hasSecurityQuestion = true;

    component.securityQuestionForm.patchValue({
      securityAnswer: 'test',
      newPassword: 'test123456',
      confirmPassword: 'test123456',
    });

    component.resetPassword();

    expect(component.securityQuestionForm.valid).toBeTruthy();
    expect(crudServiceSpy).toHaveBeenCalled();
  });
});

describe('DfForgotPasswordComponent - Email Reset', () => {
  let component: DfForgotPasswordComponent;
  let fixture: ComponentFixture<DfForgotPasswordComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        DfForgotPasswordComponent,
        HttpClientTestingModule,
        NoopAnimationsModule,
      ],
      providers: [
        provideTransloco({
          config: {
            defaultLang: 'en',
            availableLangs: ['en'],
          },
          loader: TranslocoHttpLoader,
        }),
        TranslocoService,
        {
          provide: DfSystemConfigDataService,
          useValue: {
            environment$: {
              pipe: () => {
                return {
                  subscribe: (fn: (value: any) => void) =>
                    fn({ authentication: { loginAttribute: 'email' } }),
                };
              },
            },
          },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            data: {
              pipe: () => {
                return {
                  subscribe: (fn: (value: any) => void) => fn({}),
                };
              },
            },
          },
        },
      ],
    });
    fixture = TestBed.createComponent(DfForgotPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
  it('should set validators for email based on loginAttribute', () => {
    expect(
      component.forgetPasswordForm.controls['username'].validator
    ).toBeFalsy();
    expect(
      component.forgetPasswordForm.controls['email'].validator
    ).toBeTruthy();
  });
});
