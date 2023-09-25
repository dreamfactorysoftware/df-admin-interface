import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DfCacheComponent } from './df-cache.component';
import { TranslocoService, provideTransloco } from '@ngneat/transloco';
import { TranslocoHttpLoader } from '../../../transloco-loader';
import { ActivatedRoute } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DfBaseCrudService } from '../../shared/services/df-base-crud.service';

const ACTIVATED_ROUTE_DATA = {
  data: {
    resource: [
      {
        name: 'system',
        label: 'System Management',
        description: 'Service for managing system resources.',
        type: 'system',
      },
    ],
  },
};

describe('DfCacheComponent', () => {
  let component: DfCacheComponent;
  let fixture: ComponentFixture<DfCacheComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        DfCacheComponent,
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
      ],
    });
    fixture = TestBed.createComponent(DfCacheComponent);
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

  it('calls the service to clear cache', () => {
    const crudServiceSpy = jest.spyOn(DfBaseCrudService.prototype, 'delete');
    component.flushSystemCache();
    fixture.detectChanges();
    expect(crudServiceSpy).toHaveBeenCalled();
  });
});
