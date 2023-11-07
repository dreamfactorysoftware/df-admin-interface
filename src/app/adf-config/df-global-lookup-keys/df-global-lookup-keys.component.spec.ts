import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfGlobalLookupKeysComponent } from './df-global-lookup-keys.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { TranslocoService, provideTransloco } from '@ngneat/transloco';
import { TranslocoHttpLoader } from '../../../transloco-loader';
import { DfBaseCrudService } from 'src/app/shared/services/df-base-crud.service';
import { LookupKeyType } from '../../shared/types/global-lookup-keys';
import { FormArray, FormControl, FormGroup } from '@angular/forms';

describe('DfGlobalLookupKeysComponent', () => {
  let component: DfGlobalLookupKeysComponent;
  let fixture: ComponentFixture<DfGlobalLookupKeysComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DfGlobalLookupKeysComponent, HttpClientTestingModule],
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
            data: of({}),
          },
        },
      ],
    });
    fixture = TestBed.createComponent(DfGlobalLookupKeysComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should create new lookup keys', () => {
    const crudServiceSpy = jest.spyOn(DfBaseCrudService.prototype, 'create');
    const mockKeys: LookupKeyType[] = [
      {
        name: 'test1',
        value: 'Test 1',
        private: false,
      },
      {
        name: 'test2',
        value: 'Test 2',
        private: false,
      },
    ];

    const lookupKeysForm = component.lookupKeysForm;
    const lookupKeysArray = lookupKeysForm.get('lookupKeys') as FormArray;
    mockKeys.forEach(key => {
      const group = new FormGroup({
        id: new FormControl(key.id),
        key: new FormControl(key.name),
        value: new FormControl(key.value),
        private: new FormControl(key.private),
      });
      group.markAsDirty();
      lookupKeysArray.push(group);
    });

    expect(lookupKeysArray.length).toBe(mockKeys.length);
    component.lookupKeysForm.markAsDirty();
    component.save();

    expect(crudServiceSpy).toHaveBeenCalled();
  });

  it('should update existing lookup keys', () => {
    const crudServiceSpy = jest.spyOn(DfBaseCrudService.prototype, 'update');
    const mockKeys: LookupKeyType[] = [
      {
        id: 1,
        name: 'test1',
        value: 'Test 1',
        private: false,
      },
      {
        id: 2,
        name: 'test2',
        value: 'Test 2',
        private: false,
      },
    ];

    const lookupKeysForm = component.lookupKeysForm;
    const lookupKeysArray = lookupKeysForm.get('lookupKeys') as FormArray;
    mockKeys.forEach(key => {
      const group = new FormGroup({
        id: new FormControl(key.id),
        key: new FormControl(key.name),
        value: new FormControl(key.value),
        private: new FormControl(key.private),
      });
      group.markAsDirty();
      lookupKeysArray.push(group);
    });

    expect(lookupKeysArray.length).toBe(mockKeys.length);
    component.lookupKeysForm.markAsDirty();
    component.save();

    expect(crudServiceSpy).toHaveBeenCalled();
  });
});
