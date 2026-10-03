import {
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, from, mergeMap, tap, throwError } from 'rxjs';
import { DfUserDataService } from '../services/df-user-data.service';
import { DfSnackbarService } from '../services/df-snackbar.service';
import { DfTrialService } from '../services/df-trial.service';
import { normalizeError } from '../utilities/app-error';
import { ERROR_HANDLING, SUCCESS_TOAST } from '../utilities/http-contexts';
import { trialLockFromError } from '../utilities/trial';
import { ROUTES } from '../types/routes';

/**
 * Default-on error surfacing, severity-routed:
 * - trial lock (402 or 403 with context.reason TRIAL_EXPIRED |
 *   TRIAL_TOKEN_INVALID, from dreamfactory/df-trial) -> record the lock and
 *   navigate to trial-expired. Checked FIRST and even for 'silent' requests:
 *   it is never an auth failure (no token clear, no login redirect loop) and
 *   no toast - the full-screen page is the message.
 * - 401 -> clear token, redirect to login with returnUrl (never when already
 *   on auth/*, so background polls can't yank the login page around).
 * - validation (422 / 400-with-fields) -> rethrow only; forms consume via
 *   applyServerErrorsToForm.
 * - ERROR_HANDLING 'toast-off' -> rethrow only; the caller owns display.
 * - everything else -> error toast with Details action, then rethrow.
 * Always rethrows a normalized AppError for /api and /_internal requests;
 * other hosts (github etc.) pass their errors through untouched.
 * The /error page is reserved for route-resolution failures and is never
 * navigated to from here.
 */
export const errorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const successToast = req.context.get(SUCCESS_TOAST);
  const handling = req.context.get(ERROR_HANDLING);
  const inScope =
    req.url.startsWith('/api') || req.url.startsWith('/_internal');

  const router = inject(Router);
  const userDataService = inject(DfUserDataService);
  const snackbarService = inject(DfSnackbarService);
  const trialService = inject(DfTrialService);

  return next(req).pipe(
    tap(event => {
      // Success toasts are honored for ALL hosts (github import dialog posts
      // to api.github.com); only the error policy is /api + /_internal scoped.
      if (successToast && event instanceof HttpResponse) {
        snackbarService.openSnackBar(successToast, 'success');
      }
    }),
    catchError((error: unknown) => {
      if (!inScope) {
        return throwError(() => error);
      }
      const trialLock = trialLockFromError(error);
      if (trialLock) {
        trialService.markLocked(trialLock.reason, trialLock.context);
        // 'silent' callers get the raw error (their contract); everyone else
        // the normalized AppError, context preserved for the expired page.
        const rethrown =
          handling === 'silent'
            ? error
            : normalizeError(error, { url: req.url, method: req.method });
        if (!router.url.includes(ROUTES.TRIAL_EXPIRED)) {
          return from(router.navigate([ROUTES.TRIAL_EXPIRED])).pipe(
            mergeMap(() => throwError(() => rethrown))
          );
        }
        return throwError(() => rethrown);
      }
      if (handling === 'silent') {
        return throwError(() => error);
      }
      // normalizeError never throws; this interceptor can no longer crash on
      // non-JSON/HTML/empty bodies.
      const appError = normalizeError(error, {
        url: req.url,
        method: req.method,
      });
      if (appError.kind === 'auth') {
        if (!router.url.startsWith(`/${ROUTES.AUTH}`)) {
          userDataService.clearToken();
          const returnUrl = router.url;
          return from(
            router.navigate([ROUTES.AUTH, ROUTES.LOGIN], {
              queryParams:
                returnUrl && returnUrl !== '/' ? { returnUrl } : undefined,
            })
          ).pipe(mergeMap(() => throwError(() => appError)));
        }
        return throwError(() => appError);
      }
      if (appError.kind !== 'validation' && handling !== 'toast-off') {
        snackbarService.openError(appError);
      }
      return throwError(() => appError);
    })
  );
};
