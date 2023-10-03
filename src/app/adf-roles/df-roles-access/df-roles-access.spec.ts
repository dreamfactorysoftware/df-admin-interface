import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfRolesAccessComponent } from './df-roles-access.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslocoService, provideTransloco } from '@ngneat/transloco';
import { TranslocoHttpLoader } from 'src/transloco-loader';
import { of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import {
  FormArray,
  FormControl,
  FormGroup,
  FormGroupDirective,
  ReactiveFormsModule,
} from '@angular/forms';
import { EventEmitter } from '@angular/core';
import { DfBaseCrudService } from 'src/app/shared/services/df-base-crud.service';

const rootForm = new FormGroup({
  serviceAccess: new FormArray([
    // Add FormControl or FormGroup instances to match your actual control structure
    new FormGroup({
      service: new FormControl(null),
      component: new FormControl(null),
      access: new FormControl([]),
      requester: new FormControl([]),
      advancedFilters: new FormControl([]),
      id: new FormControl(null),
    }),
  ]),
});

const mockData = [
  {
    id: 11,
    roleId: 4,
    serviceId: 3,
    component: 'AddressBookForAngularJS/',
    verbMask: 31,
    requestorMask: 2,
    filters: [],
    filterOp: 'AND',
  },
  {
    id: 12,
    roleId: 4,
    serviceId: 5,
    component: '_schema/',
    verbIask: 1,
    requestorMask: 1,
    filters: [],
    filterOp: 'AND',
  },
];

class MockFormGroupDirective {
  control = rootForm;
  ngSubmit = new EventEmitter();
}

describe('DfRolesAccessComponent', () => {
  let component: DfRolesAccessComponent;
  let fixture: ComponentFixture<DfRolesAccessComponent>;
  let activatedRouteMock: any;

  beforeEach(() => {
    activatedRouteMock = [
      {
        id: 2,
        name: 'api_docs',
        label: 'Live API Docs',
        description: 'API documenting and testing service.',
        is_active: true,
        type: 'swagger',
        mutable: false,
        deletable: false,
        config: [],
      },
      {
        id: 5,
        name: 'db',
        label: 'Local SQL Database',
        description: 'Service for accessing local SQLite database.',
        is_active: true,
        type: 'sqlite',
        mutable: true,
        deletable: true,
        config: {
          service_id: 5,
          options: null,
          attributes: null,
          statements: null,
          database: 'db.sqlite',
          cache_enabled: false,
          cache_ttl: 0,
          allow_upsert: false,
          max_records: false,
        },
      },
      {
        id: 6,
        name: 'email',
        label: 'Local Email Service',
        description:
          'Email service used for sending user invites and/or password reset confirmation.',
        is_active: true,
        type: 'local_email',
        mutable: true,
        deletable: true,
        config: {
          parameters: [],
        },
      },
    ];

    TestBed.configureTestingModule({
      imports: [
        DfRolesAccessComponent,
        HttpClientTestingModule,
        NoopAnimationsModule,
        ReactiveFormsModule,
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
            data: of({
              data: {
                roleServiceAccessByRoleId: mockData,
              },
              services: { resource: activatedRouteMock },
            }),
          },
        },
        { provide: FormGroupDirective, useClass: MockFormGroupDirective },
      ],
    });
    fixture = TestBed.createComponent(DfRolesAccessComponent);
    component = fixture.componentInstance;
    component.rootForm = rootForm;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should add a new row', () => {
    expect(component.serviceAccess.length).toBe(1);
    component.add();
    expect(component.serviceAccess.length).toBe(2);
  });

  it('should call getComponents() but not baseCrudService()', () => {
    const getComponentsSpy = jest.spyOn(component, 'getComponents');
    const getCrudSpy = jest.spyOn(DfBaseCrudService.prototype, 'get');

    component.serviceAccess.controls[0].get('service')?.setValue(6);
    component.getComponents(0);

    expect(getComponentsSpy).toHaveBeenCalled();
    expect(getCrudSpy).not.toHaveBeenCalled();
    expect(component.componentOptions.length).toBe(2);
  });

  it('should call getComponents() and baseCrudService()', () => {
    const getComponentsSpy = jest.spyOn(component, 'getComponents');
    const getCrudSpy = jest.spyOn(DfBaseCrudService.prototype, 'get');

    component.serviceAccess.controls[0].get('service')?.setValue(2);
    component.getComponents(0);

    expect(getComponentsSpy).toHaveBeenCalled();
    expect(getCrudSpy).toHaveBeenCalled();
  });
});

describe('DfRolesAccessComponent - Edit Data', () => {
  let component: DfRolesAccessComponent;
  let fixture: ComponentFixture<DfRolesAccessComponent>;
  let activatedRouteMock: any;

  beforeEach(() => {
    activatedRouteMock = [
      {
        id: 2,
        name: 'api_docs',
        label: 'Live API Docs',
        description: 'API documenting and testing service.',
        is_active: true,
        type: 'swagger',
        mutable: false,
        deletable: false,
        config: [],
      },
      {
        id: 5,
        name: 'db',
        label: 'Local SQL Database',
        description: 'Service for accessing local SQLite database.',
        is_active: true,
        type: 'sqlite',
        mutable: true,
        deletable: true,
        config: {
          service_id: 5,
          options: null,
          attributes: null,
          statements: null,
          database: 'db.sqlite',
          cache_enabled: false,
          cache_ttl: 0,
          allow_upsert: false,
          max_records: false,
        },
      },
    ];

    TestBed.configureTestingModule({
      imports: [
        DfRolesAccessComponent,
        HttpClientTestingModule,
        NoopAnimationsModule,
        ReactiveFormsModule,
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
            data: of({
              type: 'edit',
              data: {
                roleServiceAccessByRoleId: mockData,
              },
              services: { resource: activatedRouteMock },
            }),
          },
        },
        { provide: FormGroupDirective, useClass: MockFormGroupDirective },
      ],
    });
    fixture = TestBed.createComponent(DfRolesAccessComponent);
    component = fixture.componentInstance;
    component.rootForm = rootForm;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
