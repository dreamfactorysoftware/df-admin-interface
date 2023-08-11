import { TestBed } from '@angular/core/testing';
import { SessionTokenInterceptor } from './session-token.interceptor';
import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { DfAuthService } from '../../adf-user-management/services/df-auth.service';

describe('SessionTokenInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authService: DfAuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: HTTP_INTERCEPTORS,
          useClass: SessionTokenInterceptor,
          multi: true,
        },
        DfAuthService,
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(DfAuthService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should add session token header to API requests', done => {
    const testData = {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
    };

    const token = 'test-token';
    jest.spyOn(authService, 'token', 'get').mockReturnValue(token);

    http.get('/api/users/1').subscribe(data => {
      expect(data).toBeTruthy();
      expect(data).toEqual(testData);
      done();
    });

    const req = httpMock.expectOne('/api/users/1');
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('X-Dreamfactory-Session-Token')).toBe(token);

    req.flush(testData, { status: 200, statusText: 'OK' });
  });

  it('should not add session token header to non-API requests', done => {
    const testData = {
      message: 'Hello, world!',
    };

    http.get('/hello').subscribe(data => {
      expect(data).toBeTruthy();
      expect(data).toEqual(testData);
      done();
    });

    const req = httpMock.expectOne('/hello');
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('X-Dreamfactory-Session-Token')).toBeFalsy();

    req.flush(testData, { status: 200, statusText: 'OK' });
  });

  it('should not add session token header if token is not available', done => {
    const testData = {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
    };

    jest.spyOn(authService, 'token', 'get').mockReturnValue(null);

    http.get('/api/users/1').subscribe(data => {
      expect(data).toBeTruthy();
      expect(data).toEqual(testData);
      done();
    });

    const req = httpMock.expectOne('/api/users/1');
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('X-Dreamfactory-Session-Token')).toBeFalsy();

    req.flush(testData, { status: 200, statusText: 'OK' });
  });
});
