import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfUserDetailsBaseComponent } from './df-user-details-base.component';
import { ActivatedRoute, Data } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import {
  ReactiveFormsModule,
  FormsModule,
  FormGroupDirective,
  FormArray,
} from '@angular/forms';
import { DfBreakpointService } from 'src/app/shared/services/df-breakpoint.service';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { UntilDestroy } from '@ngneat/until-destroy';
import { ROUTES } from '../../types/routes';
import { BehaviorSubject } from 'rxjs';

@UntilDestroy({ checkProperties: true })
class MockUserDetailsComponent extends DfUserDetailsBaseComponent<any> {
  userType: 'admins' | 'users' = 'admins';

  sendInvite(): void {
    // Implement your mock behavior here if needed
  }

  save(): void {
    // Implement your mock behavior here if needed
  }
}

describe('DfUserDetailsBaseComponent', () => {
  let component: MockUserDetailsComponent;
  let fixture: ComponentFixture<MockUserDetailsComponent>;

  const mockData: Data = {
    type: 'edit',
    data: {},
    apps: [],
    roles: [],
  };

  const mockActivatedRoute = {
    data: new BehaviorSubject(mockData),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MockUserDetailsComponent],
      imports: [
        FormsModule,
        ReactiveFormsModule,
        HttpClientTestingModule,
        NoopAnimationsModule,
      ],
      providers: [
        FormGroupDirective,
        {
          provide: ActivatedRoute,
          useValue: mockActivatedRoute,
        },
        {
          provide: DfBreakpointService,
          useValue: {
            isSmallScreen: jest.fn(),
          },
        },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MockUserDetailsComponent);
    component = fixture.componentInstance;
    component.userType = 'admins';
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
    component.userForm.reset();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should construct the cancelRoute correctly for admins', () => {
    component.userType = 'admins';
    const expectedRoute = `/${ROUTES.ADMIN_SETTINGS}/${ROUTES.ADMINS}`;
    expect(component.cancelRoute).toEqual(expectedRoute);
  });

  it('should construct the cancelRoute correctly for users', () => {
    component.userType = 'users';
    const expectedRoute = `/${ROUTES.ADMIN_SETTINGS}/${ROUTES.USERS}`;
    expect(component.cancelRoute).toEqual(expectedRoute);
  });

  it('should add password controls', () => {
    component.addPasswordControls();
    const passwordControl = component.userForm.get('password');
    const confirmPasswordControl = component.userForm.get('confirmPassword');
    expect(passwordControl).toBeTruthy();
    expect(confirmPasswordControl).toBeTruthy();
  });

  it('should remove password controls', () => {
    component.addPasswordControls();
    component.removePasswordControls();
    const passwordControl = component.userForm.get('password');
    const confirmPasswordControl = component.userForm.get('confirmPassword');
    expect(passwordControl).toBeNull();
    expect(confirmPasswordControl).toBeNull();
  });

  it('should add password controls when setPassword is true', () => {
    const addPasswordControlsSpy = jest.spyOn(component, 'addPasswordControls');
    component.userForm.controls['setPassword'].setValue(true);
    expect(addPasswordControlsSpy).toHaveBeenCalled();

    const passwordControl = component.userForm.get('password');
    const confirmPasswordControl = component.userForm.get('confirmPassword');
    expect(passwordControl).toBeTruthy();
    expect(confirmPasswordControl).toBeTruthy();
  });

  it('should remove password controls when setPassword is false', () => {
    const removePasswordControlsSpy = jest.spyOn(
      component,
      'removePasswordControls'
    );
    component.userForm.controls['setPassword'].setValue(true);
    component.userForm.controls['setPassword'].setValue(false);
    expect(removePasswordControlsSpy).toHaveBeenCalled();

    const passwordControl = component.userForm.get('password');
    const confirmPasswordControl = component.userForm.get('confirmPassword');
    expect(passwordControl).toBeNull();
    expect(confirmPasswordControl).toBeNull();
  });

  it('should return tabs as FormArray', () => {
    const tabs = component.tabs;
    expect(tabs).toBeInstanceOf(FormArray);
  });

  it('should select all tabs', () => {
    const mockChangeEvent = { checked: true } as MatCheckboxChange;
    component.selectAllTabs(mockChangeEvent);
    const allTabsSelected = component.allTabsSelected;
    expect(allTabsSelected).toBe(true);
  });

  it('should change all tabs', () => {
    component.changeAllTabs(true);
    const allTabsSelected = component.allTabsSelected;
    expect(allTabsSelected).toBe(true);
  });

  it('should return false for allTabsSelected if not all tabs are checked', () => {
    component.tabs.controls.forEach(control =>
      control.patchValue({ checked: false })
    );
    const allTabsSelected = component.allTabsSelected;
    expect(allTabsSelected).toBe(false);
  });

  it('should trigger an alert', () => {
    component.triggerAlert('success', 'Success message');
    expect(component.alertType).toBe('success');
    expect(component.alertMsg).toBe('Success message');
    expect(component.showAlert).toBe(true);
  });

  it('should set component properties based on ActivatedRoute data', () => {
    expect(component.type).toBe('edit');
  });

  it('should handle data changes in ActivatedRoute', () => {
    const newData: Data = {
      type: 'create',
      data: {},
      apps: [],
      roles: [],
    };
    mockActivatedRoute.data.next(newData);

    expect(component.type).toBe('create');
  });

  it('should remove tabs control if userType is admins and isRootAdmin is true', () => {
    component.userType = 'admins';

    const activatedRoute = TestBed.inject(ActivatedRoute) as any;
    activatedRoute.data = new BehaviorSubject({
      type: 'edit',
      data: {
        isRootAdmin: true,
      },
      apps: [],
      roles: [],
    });

    component.ngOnInit();
    expect(component.userForm.get('tabs')).toBeNull();
  });

  it('should update tab controls if userType is admins and userToAppToRoleByUserId has data', () => {
    const changeAllTabsSpy = jest.spyOn(component, 'changeAllTabs');
    component.userType = 'admins';
    const activatedRoute = TestBed.inject(ActivatedRoute) as any;
    activatedRoute.data = new BehaviorSubject({
      type: 'edit',
      data: {
        userToAppToRoleByUserId: [{ app: 'App1', role: 'Role1' }],
      },
      apps: [],
      roles: [],
    });

    component.ngOnInit();

    expect(changeAllTabsSpy).toHaveBeenCalledWith(false);
  });

  it('should add appRoles controls if userType is users and userToAppToRoleByUserId and lookupByUserId has data', () => {
    component.userType = 'users';

    const activatedRoute = TestBed.inject(ActivatedRoute) as any;
    activatedRoute.data = new BehaviorSubject({
      type: 'edit',
      data: {
        userToAppToRoleByUserId: [
          {
            appId: 1,
            roleId: 'Role1',
          },
        ],
        lookupByUserId: [
          {
            id: 6,
            name: 'testuserkey',
            value: '**********',
            private: true,
          },
        ],
      },
      apps: {
        resource: [
          {
            id: 1,
            name: 'App1',
          },
        ],
      },
      roles: {
        resource: [
          {
            id: 1,
            name: 'Role1',
          },
        ],
      },
    });

    component.ngOnInit();

    const appRolesControl = component.userForm.get('appRoles') as FormArray;
    expect(appRolesControl.length).toBe(1);

    const lookupKeysControl = component.userForm.get('lookupKeys') as FormArray;
    expect(lookupKeysControl.length).toBe(1);
  });
});
