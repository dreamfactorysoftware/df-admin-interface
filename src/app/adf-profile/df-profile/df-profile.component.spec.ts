import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { provideTransloco, TranslocoService } from '@ngneat/transloco';
import { USER_SERVICE_PROVIDERS } from '../../core/constants/providers';
import { DfBreakpointService } from '../../core/services/df-breakpoint.service';
import { DfSystemConfigDataService } from '../../core/services/df-system-config-data.service';
import { TranslocoHttpLoader } from '../../../transloco-loader';
import { DfProfileComponent } from './df-profile.component';
import { DfProfileService } from '../services/df-profile.service';
import { UserProfile } from 'src/app/shared/types/user';

const mockProfile: Partial<UserProfile> = {
  username: 'whenlin',
  firstName: 'dev',
  lastName: 'guy',
  name: 'test-user',
  email: 'test@test.com',
  phone: '1212121313',
  securityQuestion: '',
  defaultAppId: 1,
  oauthProvider: '',
  adldap: '',
};

const fakeActivatedRoute = () => {
  return {
    data: {
      pipe: () => {
        return {
          subscribe: (fn: (value: any) => void) =>
            fn({
              data: { ...mockProfile },
            }),
        };
      },
    },
  };
};

describe('DfProfileComponent', () => {
  let component: DfProfileComponent;
  let fixture: ComponentFixture<DfProfileComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        DfProfileComponent,
        HttpClientTestingModule,
        NoopAnimationsModule,
      ],
      declarations: [],
      providers: [
        provideTransloco({
          config: {
            availableLangs: ['en'],
            defaultLang: 'en',
          },
          loader: TranslocoHttpLoader,
        }),
        ...USER_SERVICE_PROVIDERS,
        DfSystemConfigDataService,
        DfBreakpointService,
        DfProfileService,
        TranslocoService,
        {
          provide: ActivatedRoute,
          useValue: fakeActivatedRoute(),
        },
      ],
    });
    fixture = TestBed.createComponent(DfProfileComponent);
    component = fixture.componentInstance;
    component.ngOnInit();
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
    component.ngOnDestroy();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('user profile is updated given the form input is valid and the save button was clicked', () => {
    const profileSpy = jest.spyOn(DfProfileService.prototype, 'saveProfile');

    component.profileForm.patchValue({
      profileDetailsGroup: {
        name: 'asparagus',
      },
    });

    component.profileForm.markAsDirty();

    component.updateProfile();

    expect(profileSpy).toHaveBeenCalled();
  });

  it('user profile is not updated given the form input is invalid and the save button was clicked', () => {
    const profileSpy = jest.spyOn(DfProfileService.prototype, 'saveProfile');

    component.profileForm.patchValue({
      profileDetailsGroup: {
        name: '',
        email: '',
      },
    });

    component.profileForm.markAsDirty();

    component.updateProfile();

    expect(profileSpy).not.toHaveBeenCalled();
  });

  it('The current password input is not visible by default', () => {
    expect(component.profileForm.get('currentPassword')).toBeFalsy();
  });

  it('The current password input is visible when the email is changed', () => {
    component.profileForm.patchValue({
      profileDetailsGroup: {
        email: '',
      },
    });

    expect(component.profileForm.get('currentPassword')).toBeTruthy();
  });

  // TODO: add tests for sequrity question form and change password form
});
