import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  HttpErrorResponse,
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
