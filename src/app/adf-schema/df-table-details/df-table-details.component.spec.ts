import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfTableDetailsComponent } from './df-table-details.component';
import {
  createTestBedConfig,
  mockTableDetailsData,
} from 'src/app/shared/utilities/test';
import { DfBreakpointService } from 'src/app/core/services/df-breakpoint.service';
import { DfBaseCrudService } from 'src/app/core/services/df-base-crud.service';

describe('DfTableDetailsComponent - edit table details', () => {
  let component: DfTableDetailsComponent;
  let fixture: ComponentFixture<DfTableDetailsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule(
      createTestBedConfig(
        DfTableDetailsComponent,
        [DfBreakpointService],
        {
          data: { ...mockTableDetailsData },
          type: 'edit',
          system: false,
        },
        [],
        {
          name: 'test-table',
        }
      )
    );
    fixture = TestBed.createComponent(DfTableDetailsComponent);
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

  it('the name field should be disabled when editing table details', () => {
    expect(component.tableDetailsForm.get('name')?.disabled).toBeTruthy();
  });

  it('table fields should be populated with fetched table data', () => {
    expect(component.tableDetailsForm.get('label')?.value).toEqual(
      mockTableDetailsData.label
    );
    expect(component.tableDetailsForm.get('description')?.value).toEqual(
      mockTableDetailsData.description
    );
    expect(component.tableDetailsForm.get('alias')?.value).toEqual(
      mockTableDetailsData.alias
    );
    expect(component.tableDetailsForm.get('name')?.value).toEqual(
      mockTableDetailsData.name
    );
    expect(component.tableDetailsForm.get('plural')?.value).toEqual(
      mockTableDetailsData.plural
    );
  });

  it('table is updated given form has valid input and the update button is clicked', () => {
    const crudServiceSpy = jest.spyOn(DfBaseCrudService.prototype, 'patch');

    component.tableDetailsForm.get('label')?.setValue('new-label');

    component.save();

    expect(crudServiceSpy).toHaveBeenCalled();
  });
});

describe('DfTableDetailsComponent - create table details', () => {
  let component: DfTableDetailsComponent;
  let fixture: ComponentFixture<DfTableDetailsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule(
      createTestBedConfig(
        DfTableDetailsComponent,
        [DfBreakpointService],
        {
          data: undefined,
          type: 'create',
          system: false,
        },
        [],
        {
          name: 'test-table',
        }
      )
    );
    fixture = TestBed.createComponent(DfTableDetailsComponent);
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

  it('the name field should be enabled when creating table details', () => {
    expect(component.tableDetailsForm.get('name')?.enabled).toBeTruthy();
  });

  it('table is created given form has valid input and the update button is clicked', () => {
    const crudServiceSpy = jest.spyOn(DfBaseCrudService.prototype, 'create');

    component.tableDetailsForm.get('name')?.setValue('new-table-name');

    component.save();

    expect(crudServiceSpy).toHaveBeenCalled();
  });

  it('table is not created given form has invalid input and the update button is clicked', () => {
    const crudServiceSpy = jest.spyOn(DfBaseCrudService.prototype, 'create');

    component.tableDetailsForm.get('name')?.setValue('');

    component.save();

    expect(crudServiceSpy).not.toHaveBeenCalled();
  });
});
