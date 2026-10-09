import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  HttpErrorResponse,
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
import { DfTrialService } from '../services/df-trial.service';
import { ROUTES } from '../types/routes';
import { AppError, isAppError } from '../utilities/app-error';
import { silent } from '../utilities/http-contexts';
import { SESSION_TOKEN_HEADER } from '../constants/http-headers';

const EXPIRED_BODY = {
  error: {
    code: 402,
    status_code: 402,
    context: {
      reason: 'TRIAL_EXPIRED',
      trial_id: 'trl_01TEST',
      expired_at: '2026-11-02T20:00:00+00:00',
      contact_email: 'sales@dreamfactory.com',
      demo_url: 'https://www.dreamfactory.com/demo',
      portal_url: 'https://portal.dreamfactory.com',
    },
    message:
      'This trial instance of DreamFactory has expired. To continue using the platform, contact us at sales@dreamfactory.com.',
  },
};

const INVALID_BODY = {
  error: {
    code: 403,
    status_code: 403,
    context: { reason: 'TRIAL_TOKEN_INVALID', detail: 'bad_signature' },
    message:
      'This DreamFactory trial instance needs a valid trial token. Copy DF_TRIAL_TOKEN from your dashboard at https://portal.dreamfactory.com or contact sales@dreamfactory.com.',
  },
};

describe('errorInterceptor - trial lock branch', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  const router = {
    url: '/home',
    navigate: jest.fn().mockResolvedValue(true),
  };
  const userDataService = { clearToken: jest.fn() };
  const snackbarService = { openError: jest.fn(), openSnackBar: jest.fn() };
  const trialService = { markLocked: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    router.url = '/home';
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: router },
        { provide: DfUserDataService, useValue: userDataService },
        { provide: DfSnackbarService, useValue: snackbarService },
        { provide: DfTrialService, useValue: trialService },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  function requestFailingWith(
    status: number,
    body: object,
    url = '/api/v2/system/service',
    context = undefined as ReturnType<typeof silent> | undefined
  ): Promise<unknown> {
    return new Promise(resolve => {
      http.get(url, { context }).subscribe({
        next: () => resolve('unexpected success'),
        error: err => resolve(err),
      });
      httpMock.expectOne(url).flush(body, {
        status,
        statusText: String(status),
      });
    });
  }

  it('402 TRIAL_EXPIRED: marks the lock, routes to trial-expired, is NOT an auth failure', async () => {
    const err = (await requestFailingWith(402, EXPIRED_BODY)) as AppError;

    expect(trialService.markLocked).toHaveBeenCalledWith(
      'TRIAL_EXPIRED',
      EXPIRED_BODY.error.context
    );
    expect(router.navigate).toHaveBeenCalledWith([ROUTES.TRIAL_EXPIRED]);
    expect(userDataService.clearToken).not.toHaveBeenCalled();
    expect(snackbarService.openError).not.toHaveBeenCalled();
    expect(isAppError(err)).toBe(true);
    expect(err.status).toBe(402);
    expect(err.context).toEqual(EXPIRED_BODY.error.context);
    expect(err.message).toBe(EXPIRED_BODY.error.message);
  });

  it('403 TRIAL_TOKEN_INVALID: same branch, never the forbidden toast', async () => {
    const err = (await requestFailingWith(403, INVALID_BODY)) as AppError;

    expect(trialService.markLocked).toHaveBeenCalledWith(
      'TRIAL_TOKEN_INVALID',
      INVALID_BODY.error.context
    );
    expect(router.navigate).toHaveBeenCalledWith([ROUTES.TRIAL_EXPIRED]);
    expect(userDataService.clearToken).not.toHaveBeenCalled();
    expect(snackbarService.openError).not.toHaveBeenCalled();
    expect(err.kind).toBe('forbidden');
    expect(err.context?.['reason']).toBe('TRIAL_TOKEN_INVALID');
  });

  it('does not navigate again when already on trial-expired (no loop)', async () => {
    router.url = '/trial-expired';
    await requestFailingWith(402, EXPIRED_BODY);
    expect(trialService.markLocked).toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('detects the lock even on silent requests and rethrows the raw error', async () => {
    const err = await requestFailingWith(
      402,
      EXPIRED_BODY,
      '/api/v2/system/service',
      silent()
    );
    expect(trialService.markLocked).toHaveBeenCalledWith(
      'TRIAL_EXPIRED',
      EXPIRED_BODY.error.context
    );
    expect(router.navigate).toHaveBeenCalledWith([ROUTES.TRIAL_EXPIRED]);
    expect(err).toBeInstanceOf(HttpErrorResponse);
    expect(snackbarService.openError).not.toHaveBeenCalled();
  });

  it('a plain 403 (role denied) still toasts and never locks', async () => {
    const body = {
      error: { code: 403, status_code: 403, message: 'Access denied.' },
    };
    const err = (await requestFailingWith(403, body)) as AppError;
    expect(trialService.markLocked).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
    expect(snackbarService.openError).toHaveBeenCalledTimes(1);
    expect(err.kind).toBe('forbidden');
  });

  it('401 keeps the auth path: clear token + login redirect, no trial lock', async () => {
    const body = {
      error: { code: 401, status_code: 401, message: 'Unauthorized' },
    };
    const err = (await requestFailingWith(401, body)) as AppError;
    expect(trialService.markLocked).not.toHaveBeenCalled();
    expect(userDataService.clearToken).toHaveBeenCalledTimes(1);
    expect(router.navigate).toHaveBeenCalledWith(
      [ROUTES.AUTH, ROUTES.LOGIN],
      expect.objectContaining({ queryParams: { returnUrl: '/home' } })
    );
    expect(err.kind).toBe('auth');
  });

  it('ignores out-of-scope hosts entirely', async () => {
    const err = await requestFailingWith(
      402,
      EXPIRED_BODY,
      'https://api.github.com/repos/x'
    );
    expect(trialService.markLocked).not.toHaveBeenCalled();
    expect(err).toBeInstanceOf(HttpErrorResponse);
  });
});

const ENV_URL = '/api/v2/system/environment';
const BLACKLISTED = {
  error: {
    code: 403,
    message:
      'The token has been blacklisted: Session terminated. Please re-login',
  },
};
const withToken = new HttpHeaders({ [SESSION_TOKEN_HEADER]: 'dead-token' });

describe('errorInterceptor - dead session recovery', () => {
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
        { provide: DfTrialService, useValue: { markLocked: jest.fn() } },
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
