import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  HttpHeaders,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { errorInterceptor } from './error.interceptor';
import { DfUserDataService } from '../services/df-user-data.service';
import { DfSnackbarService } from '../services/df-snackbar.service';
import { SESSION_TOKEN_HEADER } from '../constants/http-headers';
import { silent } from '../utilities/http-contexts';

const ENV_URL = '/api/v2/system/environment';
const BLACKLISTED = {
  error: {
    code: 403,
    message:
      'The token has been blacklisted: Session terminated. Please re-login',
  },
};
const withToken = new HttpHeaders({ [SESSION_TOKEN_HEADER]: 'dead-token' });

describe('errorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let userData: { clearToken: jest.Mock };
  let router: { url: string; navigate: jest.Mock };
  let snackbar: { openError: jest.Mock; openSnackBar: jest.Mock };

  beforeEach(() => {
    userData = { clearToken: jest.fn() };
    router = { url: '/home', navigate: jest.fn().mockResolvedValue(true) };
    snackbar = { openError: jest.fn(), openSnackBar: jest.fn() };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: DfUserDataService, useValue: userData },
        { provide: Router, useValue: router },
        { provide: DfSnackbarService, useValue: snackbar },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('recovers a silent bootstrap call made with a blacklisted token', done => {
    // Regression: after a password change the dead token stayed in the cookie
    // and every load 403'd on /system/environment, so login never rendered.
    router.url = '/';
    http
      .get(ENV_URL, { headers: withToken, context: silent() })
      .subscribe(body => {
        expect(body).toEqual({ platform: {} });
        expect(userData.clearToken).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith(['auth', 'login'], {
          queryParams: undefined,
        });
        done();
      });
    httpMock
      .expectOne(r => r.url === ENV_URL && r.headers.has(SESSION_TOKEN_HEADER))
      .flush(BLACKLISTED, { status: 403, statusText: 'Forbidden' });
    const retry = httpMock.expectOne(ENV_URL);
    expect(retry.request.headers.has(SESSION_TOKEN_HEADER)).toBe(false);
    retry.flush({ platform: {} });
  });

  it('retries at most once', done => {
    http.get(ENV_URL, { headers: withToken }).subscribe({
      error: err => {
        expect(err.kind).toBe('auth');
        done();
      },
    });
    httpMock
      .expectOne(r => r.headers.has(SESSION_TOKEN_HEADER))
      .flush(BLACKLISTED, { status: 403, statusText: 'Forbidden' });
    // The retry has no token; even if it fails the same way it is not retried.
    httpMock
      .expectOne(r => !r.headers.has(SESSION_TOKEN_HEADER))
      .flush(BLACKLISTED, { status: 403, statusText: 'Forbidden' });
  });

  it('leaves a plain permission 403 alone', done => {
    http.get('/api/v2/system/role', { headers: withToken }).subscribe({
      error: err => {
        expect(err.kind).toBe('forbidden');
        expect(userData.clearToken).not.toHaveBeenCalled();
        expect(snackbar.openError).toHaveBeenCalled();
        done();
      },
    });
    httpMock
      .expectOne('/api/v2/system/role')
      .flush(
        { error: { code: 403, message: 'GET access to system/role denied.' } },
        { status: 403, statusText: 'Forbidden' }
      );
  });

  it('still clears the token and redirects on a plain 401', done => {
    http.get('/api/v2/system/service').subscribe({
      error: err => {
        expect(err.kind).toBe('auth');
        expect(userData.clearToken).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith(['auth', 'login'], {
          queryParams: { returnUrl: '/home' },
        });
        done();
      },
    });
    httpMock
      .expectOne('/api/v2/system/service')
      .flush(
        { error: { code: 401, message: 'Unauthorized.' } },
        { status: 401, statusText: 'Unauthorized' }
      );
  });

  it('does not redirect while already on the login page', done => {
    router.url = '/auth/login';
    http
      .get(ENV_URL, { headers: withToken, context: silent() })
      .subscribe(() => {
        expect(userData.clearToken).toHaveBeenCalled();
        expect(router.navigate).not.toHaveBeenCalled();
        done();
      });
    httpMock
      .expectOne(r => r.headers.has(SESSION_TOKEN_HEADER))
      .flush(BLACKLISTED, { status: 403, statusText: 'Forbidden' });
    httpMock.expectOne(r => !r.headers.has(SESSION_TOKEN_HEADER)).flush({});
  });
});
