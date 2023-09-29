import { HttpClientTestingModule } from '@angular/common/http/testing';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { provideTransloco, TranslocoService } from '@ngneat/transloco';
import { DfBreakpointService } from '../../shared/services/df-breakpoint.service';
import { DfSystemConfigDataService } from '../../shared/services/df-system-config-data.service';
import { TranslocoHttpLoader } from '../../../transloco-loader';
import { DfAdminDetailsComponent } from './df-admin-details.component';
import { UserProfile } from '../../shared/types/user';
import { DfBaseCrudService } from '../../shared/services/df-base-crud.service';
import { MatRadioButtonHarness } from '@angular/material/radio/testing';
import { MatInputHarness } from '@angular/material/input/testing';

const fakeActivatedRoute = (isEdit = false) => {
  return {
    data: {
      subscribe: (fn: (value: any) => void) =>
        fn({
          data: isEdit ? mockAdminUserProfile : undefined,
          type: isEdit ? 'edit' : 'create',
          apps: {
            resource: [],
          },
          roles: {
            resource: [],
          },
        }),
    },
  };
};

const mockAdminUserProfile = {
  adldap: '',
  defaultAppId: 1,
  email: 'jappleseed@apple.com',
  firstName: 'John',
  lastName: 'Appleseed',
  name: 'John Appleseed',
  oauthProvider: '',
  phone: '',
  username: 'jappleseed@apple.com',
  securityQuestion: '',
  securityAnswer: '',
  currentPassword: 'password',
  id: 5,
  confirmed: true,
  createdById: undefined,
  createdDate: '2023-09-19T15:15:54.000000Z',
  expired: false,
  isActive: true,
  isRootAdmin: 0,
  lastLoginDate: '2023-09-20 20:05:16',
  lastModifiedDate: '2023-09-19T15:15:54.000000Z',
  lastModifiedById: 5,
  ldapUsername: '',
  lookupByUserId: [],
  saml: '',
  userToAppToRoleByUserId: [],
  role: undefined,
  password: 'password',
} as UserProfile;

describe('DfAdminDetailsComponent - create', () => {
  let component: DfAdminDetailsComponent;
  let fixture: ComponentFixture<DfAdminDetailsComponent>;
  let loader: HarnessLoader;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        DfAdminDetailsComponent,
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
        DfSystemConfigDataService,
        DfBreakpointService,
        TranslocoService,
        {
          provide: ActivatedRoute,
          useValue: fakeActivatedRoute(),
        },
      ],
    });
    fixture = TestBed.createComponent(DfAdminDetailsComponent);
    loader = TestbedHarnessEnvironment.loader(fixture);

    component = fixture.componentInstance;
    component.apps = [];
    component.roles = [];
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
    component.userForm.reset();
    fixture.detectChanges();
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('a user is successfully created when the form is valid and send email invite option is selected', async () => {
    fixture.detectChanges();

    const crudServiceSpy = jest.spyOn(DfBaseCrudService.prototype, 'create');

    component.userForm.patchValue({
      profileDetailsGroup: {
        email: 'jdoe@fake.com',
        firstName: 'John',
        lastName: 'Doe',
        name: 'John Doe',
      },
      isActive: false,
    });

    const sendEmailInviteRadioBtn =
      await loader.getHarness<MatRadioButtonHarness>(MatRadioButtonHarness);

    expect(sendEmailInviteRadioBtn).toBeTruthy();

    await sendEmailInviteRadioBtn.check();

    component.save();

    expect(crudServiceSpy).toHaveBeenCalled();
  });

  it('a user is successfully created when the form is valid and set password option is selected', async () => {
    const crudServiceSpy = jest.spyOn(DfBaseCrudService.prototype, 'create');

    component.userForm.patchValue({
      profileDetailsGroup: {
        email: 'jdoe@test.com',
        firstName: 'John',
        lastName: 'Doe',
        name: 'John Doe',
      },
      isActive: true,
    });

    const setPasswordRadioBtn = await loader.getHarness<MatRadioButtonHarness>(
      MatRadioButtonHarness.with({ selector: '.userform-password-radio-btn' })
    );

    await setPasswordRadioBtn.check();

    const isChecked = await setPasswordRadioBtn.isChecked();

    expect(isChecked).toBeTruthy();

    component.userForm.patchValue({
      password: 'password',
      confirmPassword: 'password',
    });

    component.save();
    expect(crudServiceSpy).toHaveBeenCalled();
  });

  it('a user is not created when the form input is invalid and save button is clicked', () => {
    const crudServiceSpy = jest.spyOn(DfBaseCrudService.prototype, 'create');

    component.userForm.patchValue({
      profileDetailsGroup: {
        email: '',
        firstName: 'John',
        lastName: 'Doe',
        name: '',
      },
      isActive: false,
    });

    component.save();

    expect(crudServiceSpy).not.toHaveBeenCalled();
  });
});

describe('DfAdminDetailsComponent - edit', () => {
  let component: DfAdminDetailsComponent;
  let fixture: ComponentFixture<DfAdminDetailsComponent>;
  let loader: HarnessLoader;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        DfAdminDetailsComponent,
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
        DfSystemConfigDataService,
        DfBreakpointService,
        TranslocoService,
        {
          provide: ActivatedRoute,
          useValue: fakeActivatedRoute(true),
        },
      ],
    });
    fixture = TestBed.createComponent(DfAdminDetailsComponent);
    loader = TestbedHarnessEnvironment.loader(fixture);

    component = fixture.componentInstance;
    component.apps = [];
    component.roles = [];
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
    fixture.detectChanges();
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('edit admin form has valid input and successfully updates', async () => {
    const crudServiceSpy = jest.spyOn(DfBaseCrudService.prototype, 'update');

    const inputs = await loader.getAllHarnesses(MatInputHarness);

    // 3rd index is the last name form control, used this method to set input value as formGroup pristine value is not toggled when set programmatically
    await inputs[3].setValue('Red');
    await inputs[3].blur();

    component.save();

    expect(crudServiceSpy).toHaveBeenCalled();
  });

  it('edit admin form has invalid input and does not update', () => {
    const crudServiceSpy = jest.spyOn(DfBaseCrudService.prototype, 'update');

    component.userForm.patchValue({
      profileDetailsGroup: {
        email: '',
        firstName: 'John',
        lastName: 'Doe',
        name: '',
      },
      isActive: true,
    });

    component.save();

    expect(crudServiceSpy).not.toHaveBeenCalled();
  });
});
