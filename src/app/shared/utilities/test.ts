import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { TranslocoService, provideTransloco } from '@ngneat/transloco';
import { TranslocoHttpLoader } from 'src/transloco-loader';

export function createTestBedConfig(
  componentName: any,
  serviceProviders: any[],
  mockActivatedRoute: any,
  declarations?: any[]
): any {
  return {
    imports: [componentName, HttpClientTestingModule, NoopAnimationsModule],
    declarations: [...declarations],
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
                subscribe: (fn: (value: any) => void) => fn(mockActivatedRoute),
              };
            },
          },
        },
      },
      ...serviceProviders,
    ],
  };
}
