import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfSchedulerComponent } from './df-scheduler-details.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { provideTransloco, TranslocoService } from '@ngneat/transloco';
import { DfBreakpointService } from '../../shared/services/df-breakpoint.service';
import { DfSystemConfigDataService } from '../../shared/services/df-system-config-data.service';
import { TranslocoHttpLoader } from '../../../transloco-loader';
import { DfBaseCrudService } from '../../shared/services/df-base-crud.service';
import { Service } from 'src/app/shared/types/service';
import { SchedulerTaskData } from '../types/df-scheduler.types';

const fakeActivatedRoute = (isEdit = false) => {
  return {
    data: {
      pipe: () => {
        return {
          subscribe: (fn: (value: any) => void) =>
            fn({
              data: { resource: mockServices },
              schedulerObject: isEdit ? mockSchedulerTaskData : undefined,
              type: isEdit ? 'edit' : 'create',
            }),
        };
      },
    },
  };
};

const mockServices: Service[] = [
  {
    id: 2,
    name: 'api_docs',
    label: 'Live API Docs',
    description: 'API documenting and testing service.',
    isActive: true,
    type: 'swagger',
    mutable: false,
    deletable: false,
    createdDate: '2023-08-04T21:10:07.000000Z',
    lastModifiedDate: '2023-08-04T21:10:07.000000Z',
    createdById: null,
    lastModifiedById: null,
    config: [],
    serviceDocByServiceId: null,
  },
  {
    id: 5,
    name: 'db',
    label: 'Local SQL Database',
    description: 'Service for accessing local SQLite database.',
    isActive: true,
    type: 'sqlite',
    mutable: true,
    deletable: true,
    createdDate: '2023-08-04T21:10:07.000000Z',
    lastModifiedDate: '2023-08-21T13:46:25.000000Z',
    createdById: null,
    lastModifiedById: 1,
    config: {
      service_id: 5,
      options: [],
      attributes: null,
      statements: null,
      database: 'db.sqlite',
      allow_upsert: false,
      max_records: 1000,
      cache_enabled: false,
      cache_ttl: 0,
    },
    serviceDocByServiceId: null,
  },
  {
    id: 6,
    name: 'email',
    label: 'Local Email Service',
    description:
      'Email service used for sending user invites and/or password reset confirmation.',
    isActive: true,
    type: 'local_email',
    mutable: true,
    deletable: true,
    createdDate: '2023-08-04T21:10:07.000000Z',
    lastModifiedDate: '2023-08-04T21:10:07.000000Z',
    createdById: null,
    lastModifiedById: null,
    config: {
      parameters: [],
    },
    serviceDocByServiceId: null,
  },
];

const mockSchedulerTaskData: SchedulerTaskData = {
  id: 15,
  name: 'gaaa',
  description: 'pac',
  isActive: true,
  serviceId: 5,
  component: '*',
  verbMask: 1,
  frequency: 88,
  payload: null,
  createdDate: '2023-08-30T14:41:44.000000Z',
  lastModifiedDate: '2023-08-30T14:59:06.000000Z',
  createdById: 1,
  lastModifiedById: 1,
  verb: 'GET',
  serviceByServiceId: mockServices[1],
  taskLogByTaskId: {
    taskId: 15,
    statusCode: 404,
    content:
      "REST Exception #404 > Resource '*' not found for service 'name'. DreamFactory Core Utility ServiceResponse Object (    [statusCode:protected] => 404    [content:protected] => Array        ( [error] => Array                (                [code] => 404                    [context] => [message] => Resource '*' not found for service 'name'.   [status_code] => 404              )        )    [contentType:protected] =>    [dataFormat:protected] => 201   [headers:protected] => Array       (        ))REST Exception #404 > Resource '*' not found for service 'name'. Resource '*' not found for service 'name'. REST Exception #500 > Resource '*' not found for service 'name'. In Request.php line 71: Resource '*' not found for service 'name'.",
    createdDate: '2023-08-30T15:28:04.000000Z',
    lastModifiedDate: '2023-08-30T15:28:04.000000Z',
  },
};

describe('DfSchedulerComponent - create scheduler task flow', () => {
  let component: DfSchedulerComponent;
  let fixture: ComponentFixture<DfSchedulerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        DfSchedulerComponent,
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
    fixture = TestBed.createComponent(DfSchedulerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('scheduler task is successfully created given that form has valid input and save button is clicked', () => {
    const spy = jest.spyOn(DfBaseCrudService.prototype, 'create');
    component.formGroup.patchValue({
      name: 'test',
      description: 'test',
      active: false,
      serviceId: 1,
      component: 'test',
      method: 'GET',
      frequency: 600,
    });
    component.onSubmit();
    expect(spy).toHaveBeenCalled();
  });

  it('scheduler task is not created given that form has invalid input and save button is clicked ', () => {
    const spy = jest.spyOn(DfBaseCrudService.prototype, 'create');
    component.formGroup.patchValue({
      name: '',
      description: 'test',
      active: false,
      serviceId: 1,
      component: 'test',
      method: 'GET',
      frequency: 600,
    });
    component.onSubmit();
    expect(spy).not.toHaveBeenCalled();
  });

  it('the payload input is not visible by default', () => {
    expect(component.formGroup.get('payload')).toBeFalsy();
  });

  it('the payload input is not visible when the method input is GET', () => {
    component.formGroup.patchValue({
      method: 'GET',
    });

    expect(component.formGroup.get('payload')).toBeFalsy();
  });

  it('the payload input is visible when the method input is not GET', () => {
    component.formGroup.patchValue({
      method: 'POST',
    });

    expect(component.formGroup.get('payload')).toBeTruthy();
  });
});

describe('DfSchedulerComponent - edit scheduler task flow', () => {
  let component: DfSchedulerComponent;
  let fixture: ComponentFixture<DfSchedulerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        DfSchedulerComponent,
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
    fixture = TestBed.createComponent(DfSchedulerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
    fixture.detectChanges();
  });

  it('scheduler task is successfully updated given that form has valid input and save button is clicked', () => {
    const spy = jest.spyOn(DfBaseCrudService.prototype, 'update');

    component.formGroup.patchValue({
      name: 'new-name',
    });

    component.onSubmit();

    expect(spy).toHaveBeenCalled();
  });

  it('scheduler task is not updated given that form has invalid input and save button is clicked', () => {
    const spy = jest.spyOn(DfBaseCrudService.prototype, 'update');

    component.formGroup.patchValue({
      name: '',
    });

    component.onSubmit();

    expect(spy).not.toHaveBeenCalled();
  });
});
