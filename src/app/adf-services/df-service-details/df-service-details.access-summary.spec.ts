import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import {
  TRANSLOCO_LOADER,
  Translation,
  TranslocoLoader,
  TranslocoService,
  TranslocoTestingModule,
  provideTranslocoScope,
} from '@ngneat/transloco';
import { NEVER, Observable, Subject, of } from 'rxjs';
import { DfServiceHealthService } from 'src/app/adf-services/df-manage-services/df-service-health.service';
import { DfServiceProbeService } from 'src/app/adf-services/df-manage-services/df-service-probe.service';
import {
  APP_SERVICE_TOKEN,
  CACHE_SERVICE_TOKEN,
  LIMIT_SERVICE_TOKEN,
  SERVICES_SERVICE_TOKEN,
} from 'src/app/shared/constants/tokens';
import { DfAnalyticsService } from 'src/app/shared/services/df-analytics.service';
import { DfArtifactResolverService } from 'src/app/shared/services/df-artifact-resolver.service';
import {
  DfScopeService,
  ScopeMatrix,
} from 'src/app/shared/services/df-scope.service';
import { DfSnackbarService } from 'src/app/shared/services/df-snackbar.service';
import { DfSystemConfigDataService } from 'src/app/shared/services/df-system-config-data.service';
import { ServiceType } from 'src/app/shared/types/service';
import { mapSnakeToCamel } from 'src/app/shared/utilities/case';
import { DfServiceDetailsComponent } from './df-service-details.component';

// Same stand-in as df-service-details.backend-auth.spec.ts: df-array-field
// and df-dynamic-field import each other, which Jest's CommonJS loading
// cannot resolve.
jest.mock(
  'src/app/shared/components/df-field-array/df-array-field.component',
  () => {
    /* eslint-disable @typescript-eslint/no-var-requires */
    const core = require('@angular/core');
    const forms = require('@angular/forms');
    /* eslint-enable @typescript-eslint/no-var-requires */
    class DfArrayFieldComponent {
      schema: unknown;
      writeValue(): void {
        return;
      }
      registerOnChange(): void {
        return;
      }
      registerOnTouched(): void {
        return;
      }
    }
    core.Input()(DfArrayFieldComponent.prototype, 'schema');
    core.Component({
      selector: 'df-array-field',
      standalone: true,
      template: '',
      providers: [
        {
          provide: forms.NG_VALUE_ACCESSOR,
          useExisting: DfArrayFieldComponent,
          multi: true,
        },
      ],
    })(DfArrayFieldComponent);
    return { DfArrayFieldComponent };
  }
);

// eslint-disable-next-line @typescript-eslint/no-var-requires
const servicesEn = require('src/assets/i18n/services/en.json');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const rootEn = require('src/assets/i18n/en.json');

const MYSQL_TYPE = mapSnakeToCamel({
  name: 'mysql',
  label: 'MySQL',
  description: '',
  group: 'Database',
  // An empty schema would put up the paywall instead of the form.
  config_schema: [
    {
      name: 'host',
      label: 'Host',
      type: 'string',
      required: false,
      allow_null: false,
    },
  ],
}) as unknown as ServiceType;

const SERVICE = {
  id: 10,
  name: 'clinic',
  label: 'Clinic',
  description: '',
  isActive: true,
  type: 'mysql',
  mutable: true,
  deletable: true,
  config: {},
  serviceDocByServiceId: null,
};

// Two of the three roles reach the service.
const MATRIX: ScopeMatrix = {
  serviceId: SERVICE.id,
  roles: [
    {
      roleId: 1,
      roleName: 'reader',
      verbs: {
        GET: 'full',
        POST: 'none',
        PUT: 'none',
        PATCH: 'none',
        DELETE: 'none',
      },
    },
    {
      roleId: 2,
      roleName: 'filtered',
      verbs: {
        GET: 'filtered',
        POST: 'none',
        PUT: 'none',
        PATCH: 'none',
        DELETE: 'none',
      },
    },
    {
      roleId: 3,
      roleName: 'nobody',
      verbs: {
        GET: 'none',
        POST: 'none',
        PUT: 'none',
        PATCH: 'none',
        DELETE: 'none',
      },
    },
  ],
};

const RAW_KEY = 'services.access.summary';
const TRANSLATED = '2 of 3 roles can reach this service';

/**
 * Serves the root language at once and holds the lazily loaded "services"
 * scope until the test releases it, the way the real HTTP loader does on a
 * first visit while the role graph is already cached.
 */
class DelayedScopeLoader implements TranslocoLoader {
  readonly servicesScope = new Subject<Translation>();

  getTranslation(path: string): Observable<Translation> {
    return path === 'services/en' ? this.servicesScope : of(rootEn);
  }

  release(): void {
    this.servicesScope.next(servicesEn);
    this.servicesScope.complete();
  }
}

describe('DfServiceDetailsComponent Access summary', () => {
  let fixture: ComponentFixture<DfServiceDetailsComponent>;
  let loader: DelayedScopeLoader;
  let log: jest.SpyInstance;

  beforeAll(() => {
    // The form logs on every render.
    log = jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });
  afterAll(() => log.mockRestore());

  beforeEach(async () => {
    loader = new DelayedScopeLoader();
    const crud = { getAll: jest.fn(() => of({ resource: [] })) };

    await TestBed.configureTestingModule({
      imports: [
        DfServiceDetailsComponent,
        HttpClientTestingModule,
        NoopAnimationsModule,
        MatSnackBarModule,
        TranslocoTestingModule.forRoot({
          langs: { en: rootEn },
          translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
          preloadLangs: true,
        }),
      ],
      providers: [
        { provide: TRANSLOCO_LOADER, useValue: loader },
        // What the api-types routes provide.
        provideTranslocoScope('services'),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ id: String(SERVICE.id) }),
              parent: null,
              data: {},
            },
            data: of({
              groups: ['Database'],
              serviceTypes: [MYSQL_TYPE],
              data: SERVICE,
            }),
          },
        },
        {
          provide: Router,
          useValue: {
            url: '/api-connections/api-types/database/10',
            navigate: jest.fn(),
          },
        },
        // Role graph already cached: the matrix arrives synchronously.
        {
          provide: DfScopeService,
          useValue: { matrixForService: () => of(MATRIX) },
        },
        { provide: SERVICES_SERVICE_TOKEN, useValue: crud },
        // Keeps the pipeline strip loading: its step links need a real
        // router, and the strip is not under test.
        { provide: LIMIT_SERVICE_TOKEN, useValue: { getAll: () => NEVER } },
        { provide: APP_SERVICE_TOKEN, useValue: crud },
        { provide: CACHE_SERVICE_TOKEN, useValue: { delete: jest.fn() } },
        {
          provide: DfSystemConfigDataService,
          useValue: { environment$: of({ platform: { license: 'GOLD' } }) },
        },
        {
          provide: DfAnalyticsService,
          useValue: { getDashboardStats: () => of({ services: { total: 3 } }) },
        },
        {
          provide: DfSnackbarService,
          useValue: {
            openSnackBar: jest.fn(),
            setSnackbarLastEle: jest.fn(),
            setPageLabel: jest.fn(),
          },
        },
        {
          provide: DfServiceHealthService,
          useValue: { getContext: () => NEVER },
        },
        { provide: DfServiceProbeService, useValue: { probe: () => NEVER } },
        {
          provide: DfArtifactResolverService,
          useValue: {
            resolveWorkingKeyAndTable: () =>
              Promise.resolve({ keys: [], sampleTable: null }),
          },
        },
      ],
    }).compileComponents();
  });

  function create(): void {
    fixture = TestBed.createComponent(DfServiceDetailsComponent);
    fixture.detectChanges();
  }

  function accessSummary(): string | null {
    const access = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-testid="access-panel"]'
    );
    if (!access) {
      throw new Error('Access disclosure not rendered');
    }
    return (
      access.querySelector('.disclosure__summary')?.textContent?.trim() ?? null
    );
  }

  describe('first visit: roles cached, services scope still loading', () => {
    beforeEach(() => create());

    it('shows no summary, and not the raw key, while the scope loads', () => {
      expect(accessSummary()).not.toBe(RAW_KEY);
      expect(accessSummary()).toBeNull();
    });

    it('shows the translated counts once the scope arrives', () => {
      loader.release();
      fixture.detectChanges();
      expect(accessSummary()).toBe(TRANSLATED);
    });
  });

  it('shows the translated counts at once when the scope is loaded', () => {
    TestBed.inject(TranslocoService).load('services/en').subscribe();
    loader.release();
    create();
    expect(accessSummary()).toBe(TRANSLATED);
  });
});
