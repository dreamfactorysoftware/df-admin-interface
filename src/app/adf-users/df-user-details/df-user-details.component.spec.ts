import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatRadioButtonHarness } from '@angular/material/radio/testing';
import { DfUserDetailsComponent } from './df-user-details.component';
import { DfBaseCrudService } from '../../shared/services/df-base-crud.service';
import { DfSystemConfigDataService } from '../../shared/services/df-system-config-data.service';
import { DfBreakpointService } from '../../shared/services/df-breakpoint.service';
import { ActivatedRoute } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslocoService, provideTransloco } from '@ngneat/transloco';
import { TranslocoHttpLoader } from '../../../transloco-loader';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { UserProfile } from 'src/app/shared/types/user';
import { of } from 'rxjs';

const fakeActivatedRoute = (isEdit = false) => {
  return {
    data: of({
      data: isEdit ? mockUserProfile : undefined,
      type: isEdit ? 'edit' : 'create',
      apps: {
        resource: [],
      },
      roles: {
        resource: [],
      },
    }),
  };
};

const mockUserProfile = {
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
  lastLoginDate: '',
  lastModifiedDate: '2023-09-19T15:15:54.000000Z',
  lastModifiedById: 5,
  ldapUsername: '',
  lookupByUserId: [],
  saml: '',
  userToAppToRoleByUserId: [],
  role: undefined,
  password: 'password',
} as UserProfile;

describe('DfUserDetailsComponent - create', () => {
  let component: DfUserDetailsComponent;
  let fixture: ComponentFixture<DfUserDetailsComponent>;
  let loader: HarnessLoader;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        DfUserDetailsComponent,
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
    fixture = TestBed.createComponent(DfUserDetailsComponent);
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
});

describe('DfUserDetailsComponent - edit', () => {
  let component: DfUserDetailsComponent;
  let fixture: ComponentFixture<DfUserDetailsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        DfUserDetailsComponent,
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
    fixture = TestBed.createComponent(DfUserDetailsComponent);

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

  it('edit form has valid input and successfully updates', () => {
    const crudServiceSpy = jest.spyOn(DfBaseCrudService.prototype, 'update');

    component.save();

    expect(crudServiceSpy).toHaveBeenCalled();
  });

  it('edit form has invalid input and does not update', () => {
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
