import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfPasswordResetComponent } from './df-password-reset.component';
import { TranslocoService, provideTransloco } from '@ngneat/transloco';
import { TranslocoHttpLoader } from '../../../transloco-loader';
import { ActivatedRoute } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DfBaseCrudService } from '../../core/services/df-base-crud.service';
import { DfSystemConfigDataService } from 'src/app/core/services/df-system-config-data.service';
import { DfPasswordService } from '../services/df-password.service';
import { of } from 'rxjs';

describe('DfPasswordResetComponent - Username Reset', () => {
  let component: DfPasswordResetComponent;
  let fixture: ComponentFixture<DfPasswordResetComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        DfPasswordResetComponent,
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
                  subscribe: (fn: (value: any) => void) =>
                    fn({
                      type: 'reset',
                    }),
                };
              },
            },
            snapshot: {
              queryParams: {
                code: '123testcode',
                email: 'user@email.com',
                username: 'user@email.com',
                admin: '',
              },
            },
            queryParams: of({
              code: '123testcode',
              email: 'user@email.com',
              username: 'user@email.com',
              admin: '',
            }),
          },
        },
      ],
    });
    fixture = TestBed.createComponent(DfPasswordResetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
    // component.forgetPasswordForm.reset();
    // component.securityQuestionForm.reset();
    component.ngOnDestroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should populate passwordResetForm with URL params', () => {
    component.passwordResetForm.patchValue({
      newPassword: 'password',
      confirmPassword: 'password',
    });

    expect(component.passwordResetForm.value).toEqual({
      code: '123testcode',
      email: 'user@email.com',
      username: 'user@email.com',
      newPassword: 'password',
      confirmPassword: 'password',
    });
    expect(component.passwordResetForm.valid).toBeTruthy();
  });

  it('should call resetPassword() on submit with valid form', () => {
    const resetPasswordSpy = jest.spyOn(
      DfPasswordService.prototype,
      'resetPassword'
    );
    component.passwordResetForm.patchValue({
      code: '123testcode',
      email: 'user@email.com',
      username: 'user@email.com',
      newPassword: 'password',
      confirmPassword: 'password',
    });

    component.resetPassword();
    expect(resetPasswordSpy).toHaveBeenCalled();
  });
});

// http://localhost:4200/#/auth/reset-password?code=9AF80BE9OO6OPW4EONMH2RURJFRNO0WO&email=user@email.com&username=user@email.com&admin=
