import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfForgotPasswordComponent } from './df-forgot-password.component';
import { TranslocoService, provideTransloco } from '@ngneat/transloco';
import { TranslocoHttpLoader } from '../../../transloco-loader';
import { ActivatedRoute } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DfBaseCrudService } from '../../shared/services/df-base-crud.service';
import { DfSystemConfigDataService } from 'src/app/shared/services/df-system-config-data.service';
import { DfPasswordService } from '../services/df-password.service';
import { of, throwError } from 'rxjs';
import { DfAuthService } from '../services/df-auth.service';

const authServiceMock = {
  login: jest.fn(),
};

const passwordServiceMock = {
  requestPasswordReset: jest.fn().mockReturnValue(of({})),
};

const systemConfigDataServiceUsernameMock = {
  environment$: of({ authentication: { loginAttribute: 'username' } }),
};

const systemConfigDataServiceEmailMock = {
  environment$: of({ authentication: { loginAttribute: 'email' } }),
};

describe('DfForgotPasswordComponent - Username Reset', () => {
  let component: DfForgotPasswordComponent;
  let fixture: ComponentFixture<DfForgotPasswordComponent>;

  let authService: DfAuthService;
  let passwordService: DfPasswordService;
  let systemConfigDataService: DfSystemConfigDataService;

  beforeEach(() => {
    passwordService = {
      requestPasswordReset: jest.fn(),
    } as unknown as DfPasswordService;

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
        { provide: DfAuthService, useValue: authServiceMock },
        {
          provide: DfPasswordService,
          useValue: passwordServiceMock,
        },
        {
          provide: DfSystemConfigDataService,
          useValue: systemConfigDataServiceUsernameMock,
        },
      ],
    });

    authService = TestBed.inject(DfAuthService);
    passwordService = TestBed.inject(DfPasswordService);
    systemConfigDataService = TestBed.inject(DfSystemConfigDataService);
    fixture = TestBed.createComponent(DfForgotPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
    component.forgetPasswordForm.reset();
    component.securityQuestionForm.reset();
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

  it('should call requestPasswordReset and handle success', () => {
    const passwordServiceSpy = jest.spyOn(
      passwordService,
      'requestPasswordReset'
    );

    passwordServiceMock.requestPasswordReset.mockReturnValue(of({}));

    component.forgetPasswordForm.patchValue({ username: 'test' });
    component.requestReset();

    expect(component.forgetPasswordForm.valid).toBeTruthy();
    expect(passwordServiceSpy).toHaveBeenCalled();
  });

  it('should call requestPasswordReset and handle error', () => {
    const passwordServiceSpy = jest.spyOn(
      passwordService,
      'requestPasswordReset'
    );

    passwordServiceMock.requestPasswordReset.mockReturnValue(
      throwError({
        error: {
          error: {
            message: 'error',
          },
        },
      })
    );

    component.forgetPasswordForm.patchValue({ username: 'test' });
    component.requestReset();

    expect(component.forgetPasswordForm.valid).toBeTruthy();
    expect(passwordServiceSpy).toHaveBeenCalled();
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
    const passwordServiceSpy = jest.spyOn(
      passwordService,
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
    expect(passwordServiceSpy).toHaveBeenCalled();
  });
});

describe('DfForgotPasswordComponent - Email Reset', () => {
  let component: DfForgotPasswordComponent;
  let fixture: ComponentFixture<DfForgotPasswordComponent>;

  let authService: DfAuthService;
  let passwordService: DfPasswordService;
  let systemConfigDataService: DfSystemConfigDataService;

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
        // {
        //   provide: DfSystemConfigDataService,
        //   useValue: {
        //     environment$: {
        //       authentication: { loginAttribute: 'email' },
        //       //   pipe: () => {
        //       //     return {
        //       //       subscribe: (fn: (value: any) => void) =>
        //       //         fn({ authentication: { loginAttribute: 'email' } }),
        //       //     };
        //       //   },
        //     },
        //   },
        // },
        {
          provide: ActivatedRoute,
          useValue: {
            data: {},
          },
        },
        { provide: DfAuthService, useValue: authServiceMock },
        { provide: DfPasswordService, useValue: passwordServiceMock },
        {
          provide: DfSystemConfigDataService,
          useValue: systemConfigDataServiceEmailMock,
        },
      ],
    });
    authService = TestBed.inject(DfAuthService);
    passwordService = TestBed.inject(DfPasswordService);
    systemConfigDataService = TestBed.inject(DfSystemConfigDataService);
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
