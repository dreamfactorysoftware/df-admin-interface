import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfSystemInfoComponent } from './df-system-info.component';
import { of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import {
  TranslocoService,
  TranslocoTestingModule,
  provideTransloco,
} from '@ngneat/transloco';
import { DfSystemConfigDataService } from 'src/app/shared/services/df-system-config-data.service';
import { DfLicenseCheckService } from 'src/app/shared/services/df-license-check.service';
import { DfServerSettingsService } from 'src/app/shared/services/df-server-settings.service';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslocoHttpLoader } from 'src/transloco-loader';
import { HttpClientTestingModule } from '@angular/common/http/testing';

const platformMock = {
  version: '5.0.1',
  bitnami_demo: false,
  is_hosted: false,
  is_trial: false,
  license: 'GOLD',
  secured_package_export: true,
  license_key: 'test123',
  db_driver: 'mysql',
  install_path: '/opt/dreamfactory/',
  log_path: '/opt/dreamfactory/storage/logs/',
  app_debug: false,
  log_mode: 'stack',
  log_level: 'debug',
  cache_driver: 'redis',
  packages: [
    {
      name: 'test',
      version: 'v1.0',
    },
  ],
  root_admin_exists: true,
};
const serverMock = {
  server_os: 'linux',
  release: '5.15.49-linuxkit-pr',
  version: '#1 SMP Thu May 25 07:17:40 UTC 2023',
  host: '5cc7838e6ba1',
  machine: 'x86_64',
};
const clientMock = {
  user_agent:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
  ip_address: '192.168.0.1',
  locale: 'en',
};

describe('DfSystemInfoComponent', () => {
  let component: DfSystemInfoComponent;
  let fixture: ComponentFixture<DfSystemInfoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DfSystemInfoComponent, HttpClientTestingModule],
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
            data: of({
              data: {
                platform: platformMock,
                server: serverMock,
                client: clientMock,
                php: {
                  core: { phpVersion: '7.4.3' },
                  general: { serverApi: 'mockServerApi' },
                },
              },
            }),
          },
        },
      ],
    });
    fixture = TestBed.createComponent(DfSystemInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

describe('DfSystemInfoComponent license level label', () => {
  const trialBlock = {
    status: 'active',
    trialId: 'trl_test',
    email: 'qa@example.com',
    plan: 'gold-trial',
    startedAt: '2026-10-01T00:00:00Z',
    expiresAt: '2026-10-31T00:00:00Z',
    daysRemaining: 21,
    secondsRemaining: 21 * 86400,
    warnDays: 7,
    criticalDays: 1,
    contactEmail: 'sales@example.com',
    demoUrl: 'https://example.com/demo',
    portalUrl: 'https://example.com/portal',
    version: '0.1.2',
  };

  // canOpenServerSettings stands in for DfServerSettingsService.canOpen$, the
  // only thing the component reads from it. Stubbing it keeps this block free
  // of HttpClient, like the two services stubbed below.
  function render(
    platform: Record<string, unknown>,
    canOpenServerSettings = false
  ): HTMLElement {
    TestBed.configureTestingModule({
      imports: [
        DfSystemInfoComponent,
        RouterTestingModule,
        TranslocoTestingModule.forRoot({
          langs: {
            en: {
              systemInfo: {
                instance: {
                  licenseLevel: 'License Level',
                  licenseLevelTrial: 'Trial — all features',
                  trialStatus: 'Trial Status',
                  trialStatusValue: { active: 'Active' },
                  logLevel: 'Log Level',
                  logLevelChange: 'Change',
                },
              },
            },
          },
          translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
          preloadLangs: true,
        }),
      ],
      providers: [
        {
          provide: DfSystemConfigDataService,
          useValue: {
            environment: {
              authentication: {},
              platform,
              server: serverMock,
              client: clientMock,
            },
          },
        },
        {
          provide: DfLicenseCheckService,
          useValue: { licenseCheck$: of(null) },
        },
        {
          provide: DfServerSettingsService,
          useValue: { canOpen$: of(canOpenServerSettings) },
        },
      ],
    });
    const f = TestBed.createComponent(DfSystemInfoComponent);
    f.detectChanges();
    return f.nativeElement as HTMLElement;
  }

  function licenseText(el: HTMLElement): string {
    return (
      el
        .querySelector('[data-testid="system-info-license-level"]')
        ?.textContent?.replace(/\s+/g, ' ')
        .trim() ?? ''
    );
  }

  it('never shows the internal tier name on a trial instance', () => {
    const el = render({ ...platformMock, license: 'GOLD', trial: trialBlock });
    const text = licenseText(el);
    expect(text).toBe('License Level: Trial — all features');
    expect(el.textContent ?? '').not.toMatch(/gold/i);
  });

  it('keeps the license value as-is outside a trial', () => {
    const el = render({ ...platformMock, license: 'SILVER' });
    expect(licenseText(el)).toBe('License Level: SILVER');
  });

  describe('log level Change link', () => {
    const link = (el: HTMLElement) =>
      el.querySelector<HTMLAnchorElement>(
        '[data-testid="system-info-log-level-change"]'
      );

    it('is absent when Server Settings cannot be opened (old backend or no access)', () => {
      const el = render({ ...platformMock, logLevel: 'debug' }, false);
      expect(el.textContent).toContain('Log Level: debug');
      expect(link(el)).toBeNull();
    });

    it('links to Server Settings when it can be opened', () => {
      const el = render({ ...platformMock, logLevel: 'debug' }, true);
      expect(link(el)?.textContent?.trim()).toBe('Change');
      expect(link(el)?.getAttribute('href')).toBe(
        '/system-settings/config/server-settings'
      );
    });
  });
});
