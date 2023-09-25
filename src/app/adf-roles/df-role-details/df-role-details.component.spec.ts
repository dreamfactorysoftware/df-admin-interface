import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { DfRoleDetailsComponent } from './df-role-details.component';
import { ActivatedRoute } from '@angular/router';
import { provideTransloco, TranslocoService } from '@ngneat/transloco';
import { DfBreakpointService } from '../../core/services/df-breakpoint.service';
import { DfSystemConfigDataService } from '../../core/services/df-system-config-data.service';
import { TranslocoHttpLoader } from '../../../transloco-loader';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DfBaseCrudService } from '../../core/services/df-base-crud.service';

const fakeActivatedRoute = (isEdit = false) => {
  return {
    data: {
      pipe: () => {
        return {
          subscribe: (fn: (value: any) => void) =>
            fn({
              data: isEdit ? mockRole : undefined,
              type: isEdit ? 'edit' : 'create',
            }),
        };
      },
    },
  };
};

const mockRole = {
  id: 3,
  name: 'name',
  description: 'description',
  isActive: true,
  roleServiceAccessByRoleId: {
    id: 6,
    roleId: 3,
    serviceId: 7,
    component: 'profile/',
    verbMask: 1,
    requestorMask: 1,
    filters: [],
    filterOp: 'AND',
    createdDate: '2023-09-21T17:51:20.000000Z',
    lastModifiedDate: '2023-09-21T17:51:20.000000Z',
    createdById: null,
    lastModifiedById: null,
  },
  lookupByRoleId: [],
};

describe('DfRoleDetailsComponent - create', () => {
  let component: DfRoleDetailsComponent;
  let fixture: ComponentFixture<DfRoleDetailsComponent>;
  let loader: HarnessLoader;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        DfRoleDetailsComponent,
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
    fixture = TestBed.createComponent(DfRoleDetailsComponent);
    loader = TestbedHarnessEnvironment.loader(fixture);

    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
    component.roleForm.reset();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('Role is successfully created when the create button is clicked given the role based access form has valid input', () => {
    const crudServiceSpy = jest.spyOn(DfBaseCrudService.prototype, 'create');

    component.roleForm.patchValue({
      id: null,
      name: 'test',
      description: 'description',
      active: false,
    });

    component.onSubmit();

    expect(crudServiceSpy).toHaveBeenCalled();
  });

  it('Role is not created when the create button is clicked given the role based access form has invalid input', () => {
    const crudServiceSpy = jest.spyOn(DfBaseCrudService.prototype, 'create');

    component.roleForm.patchValue({
      id: null,
      name: null,
      description: 'description',
      active: true,
    });

    component.onSubmit();

    expect(crudServiceSpy).not.toHaveBeenCalled();
  });
});

describe('DfRoleDetailsComponent - edit', () => {
  let component: DfRoleDetailsComponent;
  let fixture: ComponentFixture<DfRoleDetailsComponent>;
  let loader: HarnessLoader;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        DfRoleDetailsComponent,
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
    fixture = TestBed.createComponent(DfRoleDetailsComponent);
    loader = TestbedHarnessEnvironment.loader(fixture);

    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
    fixture.detectChanges();
  });

  it('Role is successfully updated when the update button is clicked given the role based access form has valid input', () => {
    const crudServiceSpy = jest.spyOn(DfBaseCrudService.prototype, 'update');

    component.roleForm.patchValue({
      active: false,
    });

    component.onSubmit();

    expect(crudServiceSpy).toHaveBeenCalled();
  });

  it('Role is not updated when the update button is clicked given the role based access form has invalid input', () => {
    const crudServiceSpy = jest.spyOn(DfBaseCrudService.prototype, 'update');

    component.roleForm.patchValue({
      id: null,
      name: null,
      description: 'description',
      active: true,
    });

    component.onSubmit();

    expect(crudServiceSpy).not.toHaveBeenCalled();
  });
});
