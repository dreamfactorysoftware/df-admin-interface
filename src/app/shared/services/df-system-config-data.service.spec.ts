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
          rootAdminExists: true,
        },
        server: {
          host: 'localhost',
        },
      };

      service.fetchEnvironmentData().subscribe(data => {
        expect(data).toEqual(mockEnvironmentData);
      });

      const req = httpMock.expectOne(URLS.ENVIRONMENT);
      expect(req.request.method).toBe('GET');
      req.flush(mockEnvironmentData);
    });

    // TODO fix test
    // it('should clear token and throw error when request fails', done => {
    // service.fetchEnvironmentData();

    // // const req = httpMock.expectOne('/api/v2/system/environment');
    // const req = httpMock.expectOne(URLS.ENVIRONMENT);
    // expect(req.request.method).toBe('GET');

    // req.flush(null, { status: 500, statusText: 'Internal Server Error' });

    // setTimeout(() => {
    //   // expect(authServiceSpy).toHaveBeenCalled();
    //   expect(userDataServiceMock).toHaveBeenCalled();

    //   done();
    // }, 1000);
    // });
  });
});
