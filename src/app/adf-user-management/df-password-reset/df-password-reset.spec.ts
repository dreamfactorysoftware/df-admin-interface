import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfPasswordResetComponent } from './df-password-reset.component';
import { TranslocoService, provideTransloco } from '@ngneat/transloco';
import { TranslocoHttpLoader } from '../../../transloco-loader';
import { ActivatedRoute } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DfSystemConfigDataService } from 'src/app/shared/services/df-system-config-data.service';
import { DfPasswordService } from '../services/df-password.service';
import { of } from 'rxjs';

let systemConfigDataServiceMock = {
  environment$: of({
    authentication: { loginAttribute: 'username' },
  }),
};

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
          useValue: systemConfigDataServiceMock,
        },
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({ type: 'reset' }),
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

  it('should not call resetPassword() on submit with invalid form', () => {
    const resetPasswordSpy = jest.spyOn(
      DfPasswordService.prototype,
      'resetPassword'
    );

    component.resetPassword();
    expect(resetPasswordSpy).not.toHaveBeenCalled();
  });

  it('should call resetPassword() on submit with valid form', () => {
    systemConfigDataServiceMock = {
      environment$: of({
        authentication: { loginAttribute: 'email' },
      }),
    };

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
