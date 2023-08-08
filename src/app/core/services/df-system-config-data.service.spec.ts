import { TestBed } from '@angular/core/testing';

import {
  DfSystemConfigDataService,
  Environment,
  System,
} from './df-system-config-data.service';
import { DfAuthService } from './df-auth.service';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';

describe('DfSystemConfigDataService', () => {
  let service: DfSystemConfigDataService;
  let httpMock: HttpTestingController;
  let authServiceSpy: jest.SpyInstance<void>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DfSystemConfigDataService, DfAuthService],
    });

    service = TestBed.inject(DfSystemConfigDataService);
    httpMock = TestBed.inject(HttpTestingController);
    authServiceSpy = jest.spyOn(TestBed.inject(DfAuthService), 'clearToken');
  });

  afterEach(() => {
    authServiceSpy.mockClear();
  });

  describe('fetchEnvironmentData', () => {
    it('should fetch environment data', done => {
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

      setTimeout(() => {
        expect(service.environment).toBeTruthy();
        service.environment.subscribe(data => {
          expect(data).toEqual(testData);
        });

        expect(authServiceSpy).not.toHaveBeenCalled();

        done();
      }, 1000);
    });

    it('should clear token and rethrow error if HTTP call fails', done => {
      service.fetchEnvironmentData();

      const req = httpMock.expectOne('/api/v2/system/environment');
      expect(req.request.method).toBe('GET');

      req.flush(null, { status: 500, statusText: 'Internal Server Error' });

      setTimeout(() => {
        expect(authServiceSpy).toHaveBeenCalled();

        done();
      }, 1000);
    });
  });

  describe('fetchSystemData', () => {
    it('should fetch system data', done => {
      const testData: System = {
        resources: [],
      };

      service.fetchSystemData();

      const req = httpMock.expectOne('/api/v2/system');
      expect(req.request.method).toBe('GET');

      req.flush(testData);

      setTimeout(() => {
        expect(service.system).toBeTruthy();
        service.system.subscribe(data => {
          expect(data).toEqual(testData);
        });

        done();
      }, 1000);
    });
  });
});
