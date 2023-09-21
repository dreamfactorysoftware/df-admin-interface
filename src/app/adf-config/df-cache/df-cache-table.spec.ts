import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfCacheTableComponent } from './df-cache-table.component';
import { TranslocoService, provideTransloco } from '@ngneat/transloco';
import { TranslocoHttpLoader } from '../../../transloco-loader';
import { ActivatedRoute } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CACHE_SERVICE_PROVIDERS } from 'src/app/core/constants/providers';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DfBaseCrudService } from '../../core/services/df-base-crud.service';

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

describe('DfCacheTableComponent', () => {
  let component: DfCacheTableComponent;
  let fixture: ComponentFixture<DfCacheTableComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        DfCacheTableComponent,
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
        ...CACHE_SERVICE_PROVIDERS,
      ],
    });
    fixture = TestBed.createComponent(DfCacheTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should flush system cache', () => {
    const crudServiceSpy = jest.spyOn(DfBaseCrudService.prototype, 'delete');
    component.clearCache({ name: 'system', label: 'System Management' });
    expect(crudServiceSpy).toHaveBeenCalled();
  });
});
