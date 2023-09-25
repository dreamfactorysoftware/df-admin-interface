import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoService, provideTransloco } from '@ngneat/transloco';
import { TranslocoHttpLoader } from '../../../transloco-loader';
import { ActivatedRoute } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DfBaseCrudService } from '../../core/services/df-base-crud.service';
import { DfCorsConfigDetailsComponent } from './df-cors-config-details.component';
import { CORS_CONFIG_SERVICE_PROVIDERS } from 'src/app/core/constants/providers';

const FORM_DATA = {
  path: 'test',
  description: 'test',
  origins: 'test',
  headers: 'test',
  exposedHeaders: 'test',
  maxAge: 2,
  methods: ['GET'],
  credentials: true,
  enabled: true,
};

const ROUTE_DATA = {
  path: 'test',
  description: 'test',
  origin: 'test',
  header: 'test',
  exposedHeader: 'test',
  maxAge: 2,
  method: ['GET'],
  supportsCredentials: true,
  enabled: true,
  id: 1,
};

const ACTIVATED_ROUTE_DATA = {
  data: ROUTE_DATA,
};

describe('DfCorsConfigDetailsComponent - Create view', () => {
  let component: DfCorsConfigDetailsComponent;
  let fixture: ComponentFixture<DfCorsConfigDetailsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        DfCorsConfigDetailsComponent,
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
                  subscribe: (fn: (value: any) => void) => fn({}),
                };
              },
            },
          },
        },
        ...CORS_CONFIG_SERVICE_PROVIDERS,
      ],
    });
    fixture = TestBed.createComponent(DfCorsConfigDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
    component.corsForm.reset();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not submit invalid form', () => {
    const crudServiceSpy = jest.spyOn(DfBaseCrudService.prototype, 'create');

    component.onSubmit();

    expect(component.corsForm.valid).toBeFalsy();
    expect(crudServiceSpy).not.toHaveBeenCalled();
  });

  it('should submit with valid form', () => {
    const crudServiceSpy = jest.spyOn(DfBaseCrudService.prototype, 'create');

    component.corsForm.patchValue(FORM_DATA);
    component.onSubmit();

    expect(component.corsForm.valid).toBeTruthy();
    expect(crudServiceSpy).toHaveBeenCalled();
  });
});

describe('DfCorsConfigDetailsComponent - Edit view', () => {
  let component: DfCorsConfigDetailsComponent;
  let fixture: ComponentFixture<DfCorsConfigDetailsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        DfCorsConfigDetailsComponent,
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
                    fn(ACTIVATED_ROUTE_DATA),
                };
              },
            },
          },
        },
        ...CORS_CONFIG_SERVICE_PROVIDERS,
      ],
    });
    fixture = TestBed.createComponent(DfCorsConfigDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
    component.corsForm.reset();
    fixture.detectChanges();
  });

  it('should populate form with data', () => {
    expect(component.corsForm.value).toEqual(FORM_DATA);
    expect(component.corsForm.valid).toBeTruthy();
  });
});
