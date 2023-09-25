import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfLimitComponent } from './df-limit.component';
import { TranslocoService, provideTransloco } from '@ngneat/transloco';
import { TranslocoHttpLoader } from '../../../transloco-loader';
import { ActivatedRoute } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DfBaseCrudService } from '../../shared/services/df-base-crud.service';

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

describe('DfLimitComponent - Create View', () => {
  let component: DfLimitComponent;
  let fixture: ComponentFixture<DfLimitComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        DfLimitComponent,
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
                  subscribe: (fn: (value: any) => void) =>
                    fn({
                      services: {
                        resource: SERVICE,
                      },
                      users: {
                        resource: USER,
                      },
                      roles: {
                        resource: ROLE,
                      },
                    }),
                };
              },
            },
          },
        },
      ],
    });
    fixture = TestBed.createComponent(DfLimitComponent);
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
      active: [true],
    });
    component.onSubmit();
    expect(component.formGroup.valid).toBeTruthy();
    expect(crudServiceSpy).toHaveBeenCalled();
  });
});

describe('DfLimitComponent - Edit View', () => {
  let component: DfLimitComponent;
  let fixture: ComponentFixture<DfLimitComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        DfLimitComponent,
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
                  subscribe: (fn: (value: any) => void) =>
                    fn({
                      data: {
                        name: 'test',
                        description: 'test',
                        type: 'test',
                        rate: 2,
                        period: 'hour',
                        verb: 'GET',
                        isActive: true,
                        id: 2,
                      },
                      services: {
                        resource: SERVICE,
                      },
                      users: {
                        resource: USER,
                      },
                      roles: {
                        resource: ROLE,
                      },
                    }),
                };
              },
            },
          },
        },
      ],
    });
    fixture = TestBed.createComponent(DfLimitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
    component.formGroup.reset();
    // fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should populate the form with edit data', () => {
    console.log('FORM VALS', component.formGroup.value);
    console.log('limitTypeToEdit', component.limitTypeToEdit);
    expect(component.formGroup.value).toEqual({
      limitName: 'test',
      description: 'test',
      limitType: 'test',
      limitRate: 2,
      limitPeriod: 'hour',
      verb: 'GET',
      active: true,
    });
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
