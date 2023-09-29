import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DfFieldDetailsComponent } from './df-field-details.component';
import { TranslocoService } from '@ngneat/transloco';
import { createTestBedConfig } from 'src/app/shared/utilities/test';
import { DfBaseCrudService } from 'src/app/shared/services/df-base-crud.service';
import { of } from 'rxjs';

const MOCK_FORM_DATA = {
  alias: null,
  name: 'test field',
  label: 'Test Field',
  description: null,
  native: [],
  type: 'id',
  db_type: 'integer',
  length: '12',
  precision: null,
  scale: null,
  default: 1,
  required: false,
  allow_null: false,
  fixed_length: false,
  supports_multibyte: false,
  auto_increment: true,
  is_primary_key: true,
  is_unique: false,
  is_index: false,
  is_foreign_key: false,
  ref_table: null,
  ref_field: null,
  ref_on_update: null,
  ref_on_delete: null,
  picklist: null,
  validation: null,
  db_function: null,
  is_virtual: false,
  is_aggregate: false,
};

describe('DfFieldDetailsComponent - create field details', () => {
  let component: DfFieldDetailsComponent;
  let fixture: ComponentFixture<DfFieldDetailsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule(
      createTestBedConfig(
        DfFieldDetailsComponent,
        [TranslocoService],
        {
          type: 'create',
        },
        undefined,
        { name: 'dbName' }
      )
    );

    fixture = TestBed.createComponent(DfFieldDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should create field given form input is valid and create field button is clicked', () => {
    const crudServiceSpy = jest.spyOn(DfBaseCrudService.prototype, 'create');

    component.fieldDetailsForm.patchValue({
      name: 'test-field',
      type: 'string',
      length: 255,
    });

    component.onSubmit();

    expect(crudServiceSpy).toHaveBeenCalled();
  });

  it('should set isAggregate validation if isVirtual is true', () => {
    expect(component.fieldDetailsForm.controls['isAggregate'].enabled).toBe(
      false
    );

    component.fieldDetailsForm.controls['isVirtual'].setValue(true);

    expect(component.fieldDetailsForm.controls['isAggregate'].enabled).toBe(
      true
    );
    expect(component.fieldDetailsForm.controls['dbType'].enabled).toBe(false);
  });

  it('should enable form controls if type is "I will manually enter a type"', () => {
    component.fieldDetailsForm.controls['type'].setValue(
      'I will manually enter a type'
    );
    expect(component.fieldDetailsForm.controls['dbType'].enabled).toBe(true);
    expect(component.fieldDetailsForm.controls['length'].enabled).toBe(false);
    expect(component.fieldDetailsForm.controls['precision'].enabled).toBe(
      false
    );
    expect(component.fieldDetailsForm.controls['scale'].enabled).toBe(false);
  });

  it('should disable form controls if type is "id"', () => {
    component.fieldDetailsForm.controls['type'].setValue('id');
    expect(component.fieldDetailsForm.controls['dbType'].enabled).toBe(false);
    expect(component.fieldDetailsForm.controls['length'].enabled).toBe(false);
    expect(component.fieldDetailsForm.controls['precision'].enabled).toBe(
      false
    );
    expect(component.fieldDetailsForm.controls['scale'].enabled).toBe(false);
  });

  it('should disable form controls if type is "string"', () => {
    component.fieldDetailsForm.controls['type'].setValue('string');
    expect(component.fieldDetailsForm.controls['dbType'].enabled).toBe(false);
    expect(component.fieldDetailsForm.controls['length'].enabled).toBe(true);
    expect(component.fieldDetailsForm.controls['precision'].enabled).toBe(
      false
    );
    expect(component.fieldDetailsForm.controls['scale'].enabled).toBe(false);
    expect(component.fieldDetailsForm.controls['fixedLength'].enabled).toBe(
      true
    );
    expect(
      component.fieldDetailsForm.controls['supportsMultibyte'].enabled
    ).toBe(true);
  });

  it('should disable form controls if type is "integer"', () => {
    component.fieldDetailsForm.controls['type'].setValue('integer');
    expect(component.fieldDetailsForm.controls['dbType'].enabled).toBe(false);
    expect(component.fieldDetailsForm.controls['length'].enabled).toBe(true);
    expect(component.fieldDetailsForm.controls['precision'].enabled).toBe(
      false
    );
    expect(component.fieldDetailsForm.controls['scale'].enabled).toBe(false);
  });

  it('should disable form controls if type is "text"', () => {
    component.fieldDetailsForm.controls['type'].setValue('text');
    expect(component.fieldDetailsForm.controls['dbType'].enabled).toBe(false);
    expect(component.fieldDetailsForm.controls['length'].enabled).toBe(true);
    expect(component.fieldDetailsForm.controls['precision'].enabled).toBe(
      false
    );
    expect(component.fieldDetailsForm.controls['scale'].enabled).toBe(false);
  });

  it('should disable form controls if type is "boolean"', () => {
    component.fieldDetailsForm.controls['type'].setValue('boolean');
    expect(component.fieldDetailsForm.controls['dbType'].enabled).toBe(false);
    expect(component.fieldDetailsForm.controls['length'].enabled).toBe(false);
    expect(component.fieldDetailsForm.controls['precision'].enabled).toBe(
      false
    );
    expect(component.fieldDetailsForm.controls['scale'].enabled).toBe(false);
  });

  it('should disable form controls if type is "binary"', () => {
    component.fieldDetailsForm.controls['type'].setValue('binary');
    expect(component.fieldDetailsForm.controls['dbType'].enabled).toBe(false);
    expect(component.fieldDetailsForm.controls['length'].enabled).toBe(true);
    expect(component.fieldDetailsForm.controls['precision'].enabled).toBe(
      false
    );
    expect(component.fieldDetailsForm.controls['scale'].enabled).toBe(false);
  });

  it('should disable form controls if type is "float"', () => {
    component.fieldDetailsForm.controls['type'].setValue('float');
    expect(component.fieldDetailsForm.controls['dbType'].enabled).toBe(false);
    expect(component.fieldDetailsForm.controls['length'].enabled).toBe(false);
    expect(component.fieldDetailsForm.controls['precision'].enabled).toBe(true);
    expect(component.fieldDetailsForm.controls['scale'].enabled).toBe(true);
  });

  it('should disable form controls if type is "double"', () => {
    component.fieldDetailsForm.controls['type'].setValue('double');
    expect(component.fieldDetailsForm.controls['dbType'].enabled).toBe(false);
    expect(component.fieldDetailsForm.controls['length'].enabled).toBe(false);
    expect(component.fieldDetailsForm.controls['precision'].enabled).toBe(true);
    expect(component.fieldDetailsForm.controls['scale'].enabled).toBe(true);
  });

  it('should disable form controls if type is "decimal"', () => {
    component.fieldDetailsForm.controls['type'].setValue('decimal');
    expect(component.fieldDetailsForm.controls['dbType'].enabled).toBe(false);
    expect(component.fieldDetailsForm.controls['length'].enabled).toBe(false);
    expect(component.fieldDetailsForm.controls['precision'].enabled).toBe(true);
    expect(component.fieldDetailsForm.controls['scale'].enabled).toBe(true);
  });

  it('should disable form controls if type is "datetime"', () => {
    component.fieldDetailsForm.controls['type'].setValue('datetime');
    expect(component.fieldDetailsForm.controls['dbType'].enabled).toBe(false);
    expect(component.fieldDetailsForm.controls['length'].enabled).toBe(false);
    expect(component.fieldDetailsForm.controls['precision'].enabled).toBe(
      false
    );
    expect(component.fieldDetailsForm.controls['scale'].enabled).toBe(false);
  });

  it('should disable form controls if type is "date"', () => {
    component.fieldDetailsForm.controls['type'].setValue('date');
    expect(component.fieldDetailsForm.controls['dbType'].enabled).toBe(false);
    expect(component.fieldDetailsForm.controls['length'].enabled).toBe(false);
    expect(component.fieldDetailsForm.controls['precision'].enabled).toBe(
      false
    );
    expect(component.fieldDetailsForm.controls['scale'].enabled).toBe(false);
  });

  it('should disable form controls if type is "time"', () => {
    component.fieldDetailsForm.controls['type'].setValue('time');
    expect(component.fieldDetailsForm.controls['dbType'].enabled).toBe(false);
    expect(component.fieldDetailsForm.controls['length'].enabled).toBe(false);
    expect(component.fieldDetailsForm.controls['precision'].enabled).toBe(
      false
    );
    expect(component.fieldDetailsForm.controls['scale'].enabled).toBe(false);
  });

  it('should disable form controls if type is "reference"', () => {
    component.fieldDetailsForm.controls['type'].setValue('reference');
    expect(component.fieldDetailsForm.controls['dbType'].enabled).toBe(false);
    expect(component.fieldDetailsForm.controls['length'].enabled).toBe(false);
    expect(component.fieldDetailsForm.controls['precision'].enabled).toBe(
      false
    );
    expect(component.fieldDetailsForm.controls['scale'].enabled).toBe(false);
  });

  it('should disable form controls if type is "user_id"', () => {
    component.fieldDetailsForm.controls['type'].setValue('user_id');
    expect(component.fieldDetailsForm.controls['dbType'].enabled).toBe(false);
    expect(component.fieldDetailsForm.controls['length'].enabled).toBe(false);
    expect(component.fieldDetailsForm.controls['precision'].enabled).toBe(
      false
    );
    expect(component.fieldDetailsForm.controls['scale'].enabled).toBe(false);
  });

  it('should disable form controls if type is "user_id"', () => {
    component.fieldDetailsForm.controls['type'].setValue('user_id');
    expect(component.fieldDetailsForm.controls['dbType'].enabled).toBe(false);
    expect(component.fieldDetailsForm.controls['length'].enabled).toBe(false);
    expect(component.fieldDetailsForm.controls['precision'].enabled).toBe(
      false
    );
    expect(component.fieldDetailsForm.controls['scale'].enabled).toBe(false);
  });

  it('should disable form controls if type is "user_id_on_create"', () => {
    component.fieldDetailsForm.controls['type'].setValue('user_id_on_create');
    expect(component.fieldDetailsForm.controls['dbType'].enabled).toBe(false);
    expect(component.fieldDetailsForm.controls['length'].enabled).toBe(false);
    expect(component.fieldDetailsForm.controls['precision'].enabled).toBe(
      false
    );
    expect(component.fieldDetailsForm.controls['scale'].enabled).toBe(false);
  });

  it('should disable form controls if type is "user_id_on_update"', () => {
    component.fieldDetailsForm.controls['type'].setValue('user_id_on_update');
    expect(component.fieldDetailsForm.controls['dbType'].enabled).toBe(false);
    expect(component.fieldDetailsForm.controls['length'].enabled).toBe(false);
    expect(component.fieldDetailsForm.controls['precision'].enabled).toBe(
      false
    );
    expect(component.fieldDetailsForm.controls['scale'].enabled).toBe(false);
  });

  it('should disable form controls if type is "timestamp"', () => {
    component.fieldDetailsForm.controls['type'].setValue('timestamp');
    expect(component.fieldDetailsForm.controls['dbType'].enabled).toBe(false);
    expect(component.fieldDetailsForm.controls['length'].enabled).toBe(false);
    expect(component.fieldDetailsForm.controls['precision'].enabled).toBe(
      false
    );
    expect(component.fieldDetailsForm.controls['scale'].enabled).toBe(false);
  });

  it('should disable form controls if type is "timestamp_on_create"', () => {
    component.fieldDetailsForm.controls['type'].setValue('timestamp_on_create');
    expect(component.fieldDetailsForm.controls['dbType'].enabled).toBe(false);
    expect(component.fieldDetailsForm.controls['length'].enabled).toBe(false);
    expect(component.fieldDetailsForm.controls['precision'].enabled).toBe(
      false
    );
    expect(component.fieldDetailsForm.controls['scale'].enabled).toBe(false);
  });

  it('should disable form controls if type is "timestamp_on_update"', () => {
    component.fieldDetailsForm.controls['type'].setValue('timestamp_on_update');
    expect(component.fieldDetailsForm.controls['dbType'].enabled).toBe(false);
    expect(component.fieldDetailsForm.controls['length'].enabled).toBe(false);
    expect(component.fieldDetailsForm.controls['precision'].enabled).toBe(
      false
    );
    expect(component.fieldDetailsForm.controls['scale'].enabled).toBe(false);
  });
});

describe('DfFieldDetailsComponent - edit field details', () => {
  let component: DfFieldDetailsComponent;
  let fixture: ComponentFixture<DfFieldDetailsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule(
      createTestBedConfig(
        DfFieldDetailsComponent,
        [TranslocoService],
        { data: { ...MOCK_FORM_DATA }, type: 'edit' },
        undefined,
        { name: 'dbName', fieldName: 'field-name', tableName: 'table-name' }
      )
    );

    jest
      .spyOn(DfBaseCrudService.prototype, 'get')
      .mockReturnValue(of({ ...MOCK_FORM_DATA }));

    fixture = TestBed.createComponent(DfFieldDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should edit existing field given form input is valid and update field button is clicked', () => {
    const crudServiceSpy = jest.spyOn(DfBaseCrudService.prototype, 'update');

    component.fieldDetailsForm.patchValue({
      name: 'new-field-name',
    });

    component.onSubmit();

    expect(crudServiceSpy).toHaveBeenCalled();
  });
});
