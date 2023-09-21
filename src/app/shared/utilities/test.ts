import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { TranslocoService, provideTransloco } from '@ngneat/transloco';
import { TranslocoHttpLoader } from 'src/transloco-loader';

export function createMockActivatedRoute(routeData: any): any {
  return {
    data: {
      pipe: () => {
        return {
          subscribe: (fn: (value: any) => void) => fn(routeData),
        };
      },
    },
  };
}

export function createTestBedConfig(
  componentName: any,
  serviceProviders: any[],
  mockActivatedRoute: any
): any {
  return {
    imports: [componentName, HttpClientTestingModule, NoopAnimationsModule],
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
        useValue: mockActivatedRoute,
      },
      ...serviceProviders,
    ],
  };
}
