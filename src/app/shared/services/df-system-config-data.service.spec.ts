import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { DfSystemConfigDataService } from './df-system-config-data.service';
import { DfUserDataService } from './df-user-data.service';
import { Environment } from 'src/app/shared/types/system';
import { URLS } from '../constants/urls';

describe('DfSystemConfigDataService', () => {
  let service: DfSystemConfigDataService;
  let httpMock: HttpTestingController;
  let userDataServiceMock: jest.Mocked<DfUserDataService>;
  let authServiceSpy: jest.SpyInstance<void>;

  beforeEach(() => {
    userDataServiceMock = {
      clearToken: jest.fn(),
    } as any;

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        DfSystemConfigDataService,
        // DfAuthService,
        { provide: DfUserDataService, useValue: userDataServiceMock },
      ],
    });

    service = TestBed.inject(DfSystemConfigDataService);
    httpMock = TestBed.inject(HttpTestingController);
    // authServiceSpy = jest.spyOn(TestBed.inject(DfAuthService), 'clearToken');
  });

  afterEach(() => {
    userDataServiceMock.clearToken;
    // authServiceSpy.mockClear();
    // httpMock.verify(); // Verify that no unmatched requests are outstanding
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('fetchEnvironmentData', () => {
    it('should fetch environment data and update the subject', () => {
      const mockEnvironmentData: Environment = {
        authentication: {
          allowOpenRegistration: true,
          openRegEmailServiceId: 1,
          allowForeverSessions: false,
          loginAttribute: 'email',
          adldap: [],
          oauth: [],
          saml: [],
        },
        platform: {
          version: '5.0.1',
          bitnamiDemo: false,
          isHosted: false,
          isTrial: false,
          license: 'GOLD',
          securedPackageExport: true,
          licenseKey: '4bc5595cfd2777587e8b578e029198a7',
          dbDriver: 'mysql',
          installPath: '/opt/dreamfactory/',
          logPath: '/opt/dreamfactory/storage/logs/',
          appDebug: false,
          logMode: 'stack',
          logLevel: 'debug',
          cacheDriver: 'redis',
          packages: [
            {
              name: 'apple/apn-push',
              version: 'v3.1.6',
            },
            {
              name: 'aws/aws-crt-php',
              version: 'v1.2.1',
            },
          ],
          rootAdminExists: true,
          dfInstanceId: '0001',
        },
        server: {
          serverOs: 'linux',
          release: '5.15.49-linuxkit-pr',
          version: '#1 SMP Thu May 25 07:17:40 UTC 2023',
          host: 'localhost',
          machine: 'x86_64',
        },
      };

      service.fetchEnvironmentData().subscribe(data => {
        expect(data).toEqual(mockEnvironmentData);
      });

      const req = httpMock.expectOne(URLS.ENVIRONMENT);
      expect(req.request.method).toBe('GET');
      req.flush(mockEnvironmentData);
    });
  });
});
