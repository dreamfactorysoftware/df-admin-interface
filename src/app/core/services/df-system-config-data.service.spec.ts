import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
  DfSystemConfigDataService,
  Environment,
  System,
} from './df-system-config-data.service';

describe('DfSystemConfigDataService', () => {
  let service: DfSystemConfigDataService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DfSystemConfigDataService],
    });

    service = TestBed.inject(DfSystemConfigDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch environment data', () => {
    const testData: Environment = {
      authentication: {
        allowOpenRegistration: true,
        openRegEmailServiceId: 1,
        allowForeverSessions: false,
        loginAttribute: 'email',
      },
      platform: {
        rootAdminExists: true,
      },
    };

    service.fetchEnvironmentData();

    const req = httpMock.expectOne('/api/v2/system/environment');
    expect(req.request.method).toBe('GET');
    req.flush(testData);

    service.environment.subscribe(data => {
      expect(data).toEqual(testData);
    });
  });

  it('should fetch system data', () => {
    const testData: System = {
      resources: [{ name: 'resource1' }, { name: 'resource2' }],
    };

    service.fetchSystemData();

    const req = httpMock.expectOne('/api/v2/system');
    expect(req.request.method).toBe('GET');
    req.flush(testData);

    service.system.subscribe(data => {
      expect(data).toEqual(testData);
    });
  });
});
