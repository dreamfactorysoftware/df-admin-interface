import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DfAppDetailsComponent } from './df-app-details.component';
import { TranslocoService, provideTransloco } from '@ngneat/transloco';
// import { TranslocoHttpLoader } from 'src/transloco-loader';
import { TranslocoHttpLoader } from '../../../transloco-loader';
import { ActivatedRoute } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
// import { APP_SERVICE_PROVIDERS } from 'src/app/core/constants/providers';
import { APP_SERVICE_PROVIDERS } from '../../core/constants/providers';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { Validators } from '@angular/forms';
import { DfBaseCrudService } from '../../core/services/df-base-crud.service';
import {
  ROLES,
  CREATE_ACTIVATED_ROUTE,
  EDIT_ACTIVATED_ROUTE,
} from './df-app-details.mock';

describe('DfAppDetailsComponent - Create', () => {
  let component: DfAppDetailsComponent;
  let fixture: ComponentFixture<DfAppDetailsComponent>;
  // let loader: HarnessLoader;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        DfAppDetailsComponent,
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
        ...APP_SERVICE_PROVIDERS,
        TranslocoService,
        {
          provide: ActivatedRoute,
          useValue: CREATE_ACTIVATED_ROUTE,
        },
      ],
    });
    fixture = TestBed.createComponent(DfAppDetailsComponent);
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

  it('should get error on invalid form', () => {
    const crudServiceSpy = jest.spyOn(DfBaseCrudService.prototype, 'create');
    component.appForm.controls['name'].setValue('');
    expect(component.appForm.valid).toBeFalsy();
    expect(crudServiceSpy).not.toHaveBeenCalled();
  });

  it('should return valid form', () => {
    component.appForm.controls['name'].setValue('test');
    expect(component.appForm.valid).toBeTruthy();
  });

  it('should update path control validity', () => {
    component.appForm.controls['appLocation'].setValue('3');

    expect(
      component.appForm.controls['path'].hasValidator(Validators.required)
    ).toEqual(true);
  });

  it('should update url control validity', () => {
    component.appForm.controls['appLocation'].setValue('2');

    expect(
      component.appForm.controls['url'].hasValidator(Validators.required)
    ).toEqual(true);
  });

  it('should successfully submit valid create form', () => {
    const crudServiceSpy = jest.spyOn(DfBaseCrudService.prototype, 'create');

    component.appForm.controls['name'].setValue('test');
    component.save();

    expect(component.appForm.valid).toBeTruthy();
    expect(crudServiceSpy).toHaveBeenCalled();
  });
});

describe('DfAppDetailsComponent - Edit', () => {
  let component: DfAppDetailsComponent;
  let fixture: ComponentFixture<DfAppDetailsComponent>;
  // let loader: HarnessLoader;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        DfAppDetailsComponent,
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
        ...APP_SERVICE_PROVIDERS,
        TranslocoService,
        {
          provide: ActivatedRoute,
          useValue: EDIT_ACTIVATED_ROUTE,
        },
      ],
    });
    fixture = TestBed.createComponent(DfAppDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
    fixture.detectChanges();
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should successfully submit valid create form', () => {
    const crudServiceSpy = jest.spyOn(DfBaseCrudService.prototype, 'update');

    component.appForm.controls['name'].setValue('test update');
    component.save();

    expect(component.appForm.valid).toBeTruthy();
    expect(crudServiceSpy).toHaveBeenCalled();
  });

  it('should error on invalid form', () => {
    const crudServiceSpy = jest.spyOn(DfBaseCrudService.prototype, 'update');

    component.appForm.controls['name'].setValue('');
    component.save();

    expect(component.appForm.valid).toBeFalsy();
    expect(crudServiceSpy).not.toHaveBeenCalled();
  });
});
