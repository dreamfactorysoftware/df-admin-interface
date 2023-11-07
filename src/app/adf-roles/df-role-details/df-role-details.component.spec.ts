import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { DfRoleDetailsComponent } from './df-role-details.component';
import { ActivatedRoute } from '@angular/router';
import { provideTransloco, TranslocoService } from '@ngneat/transloco';
import { DfBreakpointService } from '../../shared/services/df-breakpoint.service';
import { DfSystemConfigDataService } from '../../shared/services/df-system-config-data.service';
import { TranslocoHttpLoader } from '../../../transloco-loader';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DfBaseCrudService } from '../../shared/services/df-base-crud.service';
import { of } from 'rxjs';

const mockRole = {
  id: 3,
  name: 'name',
  description: 'description',
  isActive: true,
  roleServiceAccessByRoleId: [
    {
      id: 6,
      roleId: 3,
      serviceId: 7,
      component: 'profile/',
      verbMask: 16,
      requestorMask: 3,
      filters: [],
      filterOp: 'AND',
      createdDate: '2023-09-21T17:51:20.000000Z',
      lastModifiedDate: '2023-09-21T17:51:20.000000Z',
      createdById: null,
      lastModifiedById: null,
    },
  ],
  lookupByRoleId: [],
};

describe('DfRoleDetailsComponent - create', () => {
  let component: DfRoleDetailsComponent;
  let fixture: ComponentFixture<DfRoleDetailsComponent>;

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
          useValue: {
            data: of({
              type: 'create',
            }),
          },
        },
      ],
    });
    fixture = TestBed.createComponent(DfRoleDetailsComponent);
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
          useValue: {
            data: of({
              data: mockRole,
              type: 'edit',
            }),
          },
        },
      ],
    });
    fixture = TestBed.createComponent(DfRoleDetailsComponent);
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

  it('should convert requester value using handleRequesterValue', () => {
    const result = component.handleRequesterValue(1);
    expect(result).toEqual([1]);
    const result2 = component.handleRequesterValue(3);
    expect(result2).toEqual([1, 2]);
  });

  it('should convert access value using handleAccessValue', () => {
    const result = component.handleAccessValue(1);
    expect(result).toEqual([1]);
    const result2 = component.handleAccessValue(32);
    expect(result2).toEqual([16, 8, 4, 2, 1]);
  });
});
