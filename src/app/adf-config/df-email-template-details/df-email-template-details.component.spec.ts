import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfEmailTemplateDetailsComponent } from './df-email-template-details.component';
import { createTestBedConfig } from '../../shared/utilities/test';
import { EMAIL_TEMPLATES_SERVICE_PROVIDERS } from '../../core/constants/providers';
import { DfBaseCrudService } from '../../core/services/df-base-crud.service';

describe('DfEmailTemplateDetailsComponent - create email template flow', () => {
  let component: DfEmailTemplateDetailsComponent;
  let fixture: ComponentFixture<DfEmailTemplateDetailsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule(
      createTestBedConfig(
        DfEmailTemplateDetailsComponent,
        [EMAIL_TEMPLATES_SERVICE_PROVIDERS],
        {
          data: undefined,
          type: 'create',
        }
      )
    );
    fixture = TestBed.createComponent(DfEmailTemplateDetailsComponent);
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

  it('An email template is created given the form has valid input and the save button is clicked', () => {
    const crudServiceSpy = jest.spyOn(DfBaseCrudService.prototype, 'create');

    component.emailTemplateForm.patchValue({
      name: 'test',
      description: 'test',
    });

    component.onSubmit();

    expect(crudServiceSpy).toHaveBeenCalled();
  });

  it('An email template is not created given the form has invalid input and the save button is clicked', () => {
    const crudServiceSpy = jest.spyOn(DfBaseCrudService.prototype, 'create');

    component.onSubmit();

    expect(crudServiceSpy).not.toHaveBeenCalled();
  });
});

describe('DfEmailTemplateDetailsComponent - edit email template flow', () => {
  let component: DfEmailTemplateDetailsComponent;
  let fixture: ComponentFixture<DfEmailTemplateDetailsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule(
      createTestBedConfig(
        DfEmailTemplateDetailsComponent,
        [EMAIL_TEMPLATES_SERVICE_PROVIDERS],
        {
          data: {
            id: 1,
            name: 'test',
            description: 'test',
          },
          type: 'edit',
        }
      )
    );
    fixture = TestBed.createComponent(DfEmailTemplateDetailsComponent);
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

  it('An email template is updated given the form has valid input and the save button is clicked', () => {
    const crudServiceSpy = jest.spyOn(DfBaseCrudService.prototype, 'update');

    component.emailTemplateForm.patchValue({
      name: 'test',
      description: 'test',
    });

    component.onSubmit();

    expect(crudServiceSpy).toHaveBeenCalled();
  });

  it('An email template is not updated given the form has invalid input and the save button is clicked', () => {
    component.emailTemplateForm.reset();

    const crudServiceSpy = jest.spyOn(DfBaseCrudService.prototype, 'update');

    component.onSubmit();

    expect(crudServiceSpy).not.toHaveBeenCalled();
  });
});
