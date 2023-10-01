import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfSystemInfoComponent } from './df-system-info.component';
import { of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { TranslocoService, provideTransloco } from '@ngneat/transloco';
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
    component.platform.license = 'GOLD';
    expect(component).toBeTruthy();
  });

  it('should initialize with data from ActivatedRoute', () => {
    fixture.detectChanges();

    expect(component.platform).toEqual(platformMock);
    expect(component.server).toEqual(serverMock);
    expect(component.client).toEqual(clientMock);
    expect(component.php.phpVersion).toEqual('7.4.3');
    expect(component.php.serverApi).toEqual('mockServerApi');
  });
});
