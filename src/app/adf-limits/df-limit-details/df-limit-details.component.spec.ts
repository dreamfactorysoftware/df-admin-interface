import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfLimitDetailsComponent } from './df-limit-details.component';
import { TranslocoService } from '@ngneat/transloco';
import { DfBaseCrudService } from '../../shared/services/df-base-crud.service';
import { createTestBedConfig } from 'src/app/shared/utilities/testbed-config';

const LIMIT_DETAILS = {
  id: 17,
  type: 'instance.user.service.endpoint',
  keyText: 'instance.user:3.service:6.endpoint:foo.com/bar.verb:GET.day',
  rate: 2,
  period: 'hour',
  userId: 3,
  roleId: null,
  serviceId: 6,
  name: 'test',
  description: 'test',
  isActive: true,
  createdDate: '2023-08-23T19:37:13.000000Z',
  lastModifiedDate: '2023-08-24T20:25:45.000000Z',
  endpoint: 'foo.com/bar',
  verb: 'GET',
};

const SERVICE = {
  id: 2,
  name: 'api_docs',
  label: 'Live API Docs',
  description: 'API documenting and testing service.',
  is_active: true,
  type: 'swagger',
  mutable: false,
  deletable: false,
  config: [],
};

const USER = {
  id: 2,
  name: 'testUser',
  username: 'user@email.com',
  ldap_username: null,
  first_name: 'firsttest',
  last_name: 'last',
  last_login_date: null,
  email: 'user@email.com',
  is_active: true,
  phone: null,
  security_question: null,
  default_app_id: null,
  adldap: null,
  oauth_provider: null,
  saml: null,
  is_root_admin: 0,
  confirmed: true,
  expired: false,
};

const ROLE = {
  id: 3,
  name: 'abc role',
  description: null,
  is_active: true,
  lookup_by_role_id: [],
};

describe('DfLimitDetailsComponent - Create View', () => {
  let component: DfLimitDetailsComponent;
  let fixture: ComponentFixture<DfLimitDetailsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule(
      createTestBedConfig(DfLimitDetailsComponent, [TranslocoService], {
        data: undefined,
        type: 'create',
        services: {
          resource: [SERVICE],
        },
        users: {
          resource: [USER],
        },
        roles: {
          resource: [ROLE],
        },
      })
    );
    fixture = TestBed.createComponent(DfLimitDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should be invalid if form is missing required fields', () => {
    const crudServiceSpy = jest.spyOn(DfBaseCrudService.prototype, 'create');
    component.onSubmit();
    expect(component.formGroup.valid).toBeFalsy();
    expect(crudServiceSpy).not.toHaveBeenCalled();
  });

  it('should submit form if valid', () => {
    const crudServiceSpy = jest.spyOn(DfBaseCrudService.prototype, 'create');
    component.formGroup.patchValue({
      limitName: 'test',
      limitType: 'test',
      limitRate: 2,
      limitPeriod: 'hour',
      verb: 'GET',
      active: true,
    });
    component.onSubmit();
    expect(component.formGroup.valid).toBeTruthy();
    expect(crudServiceSpy).toHaveBeenCalled();
  });
});

describe('DfLimitDetailsComponent - Edit View', () => {
  let component: DfLimitDetailsComponent;
  let fixture: ComponentFixture<DfLimitDetailsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule(
      createTestBedConfig(DfLimitDetailsComponent, [TranslocoService], {
        data: LIMIT_DETAILS,
        type: 'edit',
        services: {
          resource: [SERVICE],
        },
        users: {
          resource: [USER],
        },
        roles: {
          resource: [ROLE],
        },
      })
    );

    fixture = TestBed.createComponent(DfLimitDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
    component.formGroup.reset();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should populate the form with edit data', () => {
    expect(component.formGroup.value).toEqual({
      limitName: 'test',
      description: 'test',
      limitType: 'instance.user.service.endpoint',
      serviceId: 6,
      userId: 3,
      endpoint: 'foo.com/bar',
      limitRate: 2,
      limitPeriod: 'hour',
      verb: 'GET',
      active: true,
    });
  });

  it('should submit form if valid', () => {
    const crudServiceSpy = jest.spyOn(DfBaseCrudService.prototype, 'update');
    component.formGroup.patchValue({
      active: false,
    });
    component.onSubmit();
    expect(component.formGroup.valid).toBeTruthy();
    expect(crudServiceSpy).toHaveBeenCalled();
  });

  it('should set formControl validators when limit type is instance', () => {
    component.formGroup.controls['limitType'].setValue('instance');
    expect(component.formGroup.get('limitRate')?.validator).toBeTruthy();
  });

  it('should set formControl validators when limit type is instance.user', () => {
    component.formGroup.controls['limitType'].setValue('instance.user');
    expect(component.formGroup.get('userId')?.validator).toBeTruthy();
  });

  it('should set formControl validators when limit type is instance.user.service', () => {
    component.formGroup.controls['limitType'].setValue('instance.user.service');
    expect(component.formGroup.get('userId')?.validator).toBeTruthy();
    expect(component.formGroup.get('serviceId')?.validator).toBeTruthy();
  });

  it('should set formControl validators when limit type is instance.each_user.service', () => {
    component.formGroup.controls['limitType'].setValue(
      'instance.each_user.service'
    );
    expect(component.formGroup.get('serviceId')?.validator).toBeTruthy();
  });

  it('should set formControl validators when limit type is instance.service', () => {
    component.formGroup.controls['limitType'].setValue('instance.service');
    expect(component.formGroup.get('serviceId')?.validator).toBeTruthy();
  });

  it('should set formControl validators when limit type is instance.role', () => {
    component.formGroup.controls['limitType'].setValue('instance.role');
    expect(component.formGroup.get('roleId')?.validator).toBeTruthy();
  });

  it('should set formControl validators when limit type is instance.user.service.endpoint', () => {
    component.formGroup.controls['limitType'].setValue(
      'instance.user.service.endpoint'
    );
    expect(component.formGroup.get('userId')?.validator).toBeTruthy();
    expect(component.formGroup.get('serviceId')?.validator).toBeTruthy();
    expect(component.formGroup.get('endpoint')?.validator).toBeTruthy();
  });

  it('should set formControl validators when limit type is instance.service.endpoint', () => {
    component.formGroup.controls['limitType'].setValue(
      'instance.service.endpoint'
    );
    expect(component.formGroup.get('serviceId')?.validator).toBeTruthy();
    expect(component.formGroup.get('endpoint')?.validator).toBeTruthy();
  });

  it('should set formControl validators when limit type is instance.each_user.service.endpoint', () => {
    component.formGroup.controls['limitType'].setValue(
      'instance.each_user.service.endpoint'
    );
    expect(component.formGroup.get('serviceId')?.validator).toBeTruthy();
    expect(component.formGroup.get('endpoint')?.validator).toBeTruthy();
  });
});
