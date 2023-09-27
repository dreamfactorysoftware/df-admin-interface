import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoService } from '@ngneat/transloco';
import { DfBreakpointService } from 'src/app/shared/services/df-breakpoint.service';
import { DfSystemConfigDataService } from 'src/app/shared/services/df-system-config-data.service';
import { DfProfileComponent } from './df-profile.component';
import { DfProfileService } from '../services/df-profile.service';
import { UserProfile } from 'src/app/shared/types/user';
import { DfPasswordService } from 'src/app/adf-user-management/services/df-password.service';
import { createTestBedConfig } from 'src/app/shared/utilities/test';

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

describe('DfProfileComponent', () => {
  let component: DfProfileComponent;
  let fixture: ComponentFixture<DfProfileComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule(
      createTestBedConfig(
        DfProfileComponent,
        [
          DfSystemConfigDataService,
          DfBreakpointService,
          DfProfileService,
          DfPasswordService,
          TranslocoService,
        ],
        {
          data: { ...mockProfile },
        }
      )
    );

    fixture = TestBed.createComponent(DfProfileComponent);
    component = fixture.componentInstance;
    component.ngOnInit();
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
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

  it('security question is updated given the form input is valid and the save button was clicked', () => {
    const profileSpy = jest.spyOn(DfProfileService.prototype, 'saveProfile');

    component.securityQuestionForm.patchValue({
      securityQuestion: 'What is your favorite drink?',
      securityAnswer: 'water',
    });

    component.securityQuestionForm.markAsDirty();

    component.updateSecurityQuestion();

    expect(profileSpy).toHaveBeenCalled();
  });

  it('password is updated given the form input is valid and the save button was clicked', () => {
    const passwordServiceSpy = jest.spyOn(
      DfPasswordService.prototype,
      'updatePassword'
    );

    component.updatePasswordForm.patchValue({
      oldPassword: 'password',
      newPassword: 'password1',
      confirmPassword: 'password1',
    });

    component.updatePasswordForm.markAsDirty();

    component.updatePassword();

    expect(passwordServiceSpy).toHaveBeenCalled();
  });

  it('password is not updated given the form input is invalid and the save button was clicked', () => {
    const passwordServiceSpy = jest.spyOn(
      DfPasswordService.prototype,
      'updatePassword'
    );
    component.updatePasswordForm.patchValue({
      oldPassword: 'password',
      newPassword: 'password1',
      confirmPassword: 'password2',
    });

    component.updatePasswordForm.markAsDirty();

    component.updatePassword();

    expect(passwordServiceSpy).not.toHaveBeenCalled();
  });
});
