import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DfSchedulerComponent } from './df-scheduler-details.component';
import { TranslocoService } from '@ngneat/transloco';
import { DfBreakpointService } from '../../shared/services/df-breakpoint.service';
import { DfSystemConfigDataService } from '../../shared/services/df-system-config-data.service';
import { DfBaseCrudService } from '../../shared/services/df-base-crud.service';
import { createTestBedConfig } from 'src/app/shared/utilities/test';
import { mockSchedulerTaskData, mockServices } from './test-mocks/mocks';

const editModeActivatedRoute = {
  data: { resource: mockServices },
  schedulerObject: mockSchedulerTaskData,
  type: 'edit',
};

const createModeActivatedRoute = {
  data: { resource: mockServices },
  schedulerObject: undefined,
  type: 'create',
};

describe('DfSchedulerComponent - create scheduler task flow', () => {
  let component: DfSchedulerComponent;
  let fixture: ComponentFixture<DfSchedulerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule(
      createTestBedConfig(
        DfSchedulerComponent,
        [DfBreakpointService, TranslocoService, DfSystemConfigDataService],
        { ...createModeActivatedRoute }
      )
    );

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
    component.formGroup.markAsDirty();

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

    component.formGroup.markAsDirty();

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
    TestBed.configureTestingModule(
      createTestBedConfig(
        DfSchedulerComponent,
        [DfBreakpointService, TranslocoService, DfSystemConfigDataService],
        { ...editModeActivatedRoute }
      )
    );

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

    component.formGroup.markAsDirty();

    component.onSubmit();

    expect(spy).toHaveBeenCalled();
  });

  it('scheduler task is not updated given that form has invalid input and save button is clicked', () => {
    const spy = jest.spyOn(DfBaseCrudService.prototype, 'update');

    component.formGroup.patchValue({
      name: '',
    });

    component.formGroup.markAsDirty();

    component.onSubmit();

    expect(spy).not.toHaveBeenCalled();
  });
});
