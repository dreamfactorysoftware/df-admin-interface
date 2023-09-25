import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DfRelationshipDetailsComponent } from './df-relationship-details.component';
import { TranslocoService, provideTransloco } from '@ngneat/transloco';
import { TranslocoHttpLoader } from '../../../transloco-loader';
import { ActivatedRoute } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DfBaseCrudService } from '../../shared/services/df-base-crud.service';

const ROUTE_DATA = {
  alias: 'many alias',
  label: 'many label',
  description: 'many description',
  type: 'many_many',
  field: 'testfield',
  refServiceId: 5,
  refTable: 'testtable',
  refField: 'id',
  junctionServiceId: 5,
  junctionTable: 'testtable2',
  junctionField: 'name',
  junctionRefField: 'id',
  alwaysFetch: true,
};

const ROUTE_FIELDS = {
  resource: [
    {
      name: 'id',
      label: 'id',
    },
  ],
};

const ROUTE_SERVICES = {
  resource: [
    {
      id: 5,
      name: 'db',
      label: 'Local SQL Database',
    },
  ],
};

describe('DfRelationshipDetailsComponent - Create View', () => {
  let component: DfRelationshipDetailsComponent;
  let fixture: ComponentFixture<DfRelationshipDetailsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        DfRelationshipDetailsComponent,
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
                      fields: ROUTE_FIELDS,
                      services: ROUTE_SERVICES,
                      type: 'create',
                    }),
                };
              },
            },
            snapshot: {
              params: {
                id: 'testDb',
                name: 'testTable',
              },
            },
          },
        },
      ],
    });
    fixture = TestBed.createComponent(DfRelationshipDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should be invalid if form is missing required fields', () => {
    const crudServiceSpy = jest.spyOn(DfBaseCrudService.prototype, 'create');
    component.save();
    expect(component.relationshipForm.valid).toBeFalsy();
    expect(crudServiceSpy).not.toHaveBeenCalled();
  });

  it('should be valid if form has all required fields', () => {
    const crudServiceSpy = jest.spyOn(DfBaseCrudService.prototype, 'create');
    component.relationshipForm.patchValue({
      name: 'Test Name',
      type: 'belongs_to',
      field: 'testField',
      refServiceId: 1,
      refTable: 'testTable',
      refField: 'testField',
    });

    component.save();
    expect(component.relationshipForm.valid).toBeTruthy();
    expect(crudServiceSpy).toHaveBeenCalled();
  });

  it('should disable controls when type is set to "belongs_to"', () => {
    component.relationshipForm.controls['type'].setValue('belongs_to');
    expect(
      component.relationshipForm.controls['junctionServiceId'].enabled
    ).toBeFalsy();
    expect(
      component.relationshipForm.controls['junctionTable'].enabled
    ).toBeFalsy();
    expect(
      component.relationshipForm.controls['junctionField'].enabled
    ).toBeFalsy();
    expect(
      component.relationshipForm.controls['junctionRefField'].enabled
    ).toBeFalsy();
  });

  it('should enable controls when type is set to "many_many"', () => {
    component.relationshipForm.controls['type'].setValue('many_many');
    expect(
      component.relationshipForm.controls['junctionServiceId'].enabled
    ).toBeTruthy();
    expect(
      component.relationshipForm.controls['junctionTable'].enabled
    ).toBeTruthy();
    expect(
      component.relationshipForm.controls['junctionField'].enabled
    ).toBeTruthy();
    expect(
      component.relationshipForm.controls['junctionRefField'].enabled
    ).toBeTruthy();
  });
});

describe('DfRelationshipDetailsComponent - Edit View', () => {
  let component: DfRelationshipDetailsComponent;
  let fixture: ComponentFixture<DfRelationshipDetailsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        DfRelationshipDetailsComponent,
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
                      data: ROUTE_DATA,
                      fields: ROUTE_FIELDS,
                      services: ROUTE_SERVICES,
                      type: 'edit',
                    }),
                };
              },
            },
            snapshot: {
              params: {
                id: 'testDb',
                name: 'testTable',
              },
            },
          },
        },
      ],
    });
    fixture = TestBed.createComponent(DfRelationshipDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should populate form with edit data', () => {
    expect(component.relationshipForm.value).toEqual(ROUTE_DATA);
  });
});
