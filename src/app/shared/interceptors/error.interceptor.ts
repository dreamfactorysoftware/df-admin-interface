import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, from, mergeMap, tap, throwError } from 'rxjs';
import { DfUserDataService } from '../services/df-user-data.service';
import { DfSnackbarService } from '../services/df-snackbar.service';
import { DfTrialService } from '../services/df-trial.service';
import { isDeadSessionMessage, normalizeError } from '../utilities/app-error';
import {
  ERROR_HANDLING,
  SESSION_RETRY,
  SUCCESS_TOAST,
} from '../utilities/http-contexts';
import { SESSION_TOKEN_HEADER } from '../constants/http-headers';
import { trialLockFromError } from '../utilities/trial';
import { ROUTES } from '../types/routes';

/**
 * Default-on error surfacing, severity-routed:
 * - trial lock (402 or 403 with context.reason TRIAL_EXPIRED |
 *   TRIAL_TOKEN_INVALID, from dreamfactory/df-trial) -> record the lock and
 *   navigate to trial-expired. Checked FIRST and even for 'silent' requests:
 *   it is never an auth failure (no token clear, no login redirect loop) and
 *   no toast - the full-screen page is the message.
 * - dead session (401/403 saying the token was blacklisted, terminated or
 *   expired) on a request that carried a session token -> clear the token,
 *   send the user to login, and retry the request once without the token.
 *   Runs before the 'silent' opt-out: the bootstrap GET /system/environment
 *   is silent, and a dead token left in the cookie otherwise fails every page
 *   load, so the login page never renders.
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
  const router = inject(Router);
  const userDataService = inject(DfUserDataService);
  const snackbarService = inject(DfSnackbarService);
  const trialService = inject(DfTrialService);

  const toLogin = () => {
    const returnUrl = router.url;
    return router.navigate([ROUTES.AUTH, ROUTES.LOGIN], {
      queryParams: returnUrl && returnUrl !== '/' ? { returnUrl } : undefined,
    });
  };
  const onAuthPage = () => router.url.startsWith(`/${ROUTES.AUTH}`);

  // send() is re-entered for the dead-session retry, so the retried request
  // gets the same success/error handling without calling inject() again.
  const send = (r: HttpRequest<unknown>): Observable<HttpEvent<unknown>> => {
    const successToast = r.context.get(SUCCESS_TOAST);
    const handling = r.context.get(ERROR_HANDLING);
    const inScope = r.url.startsWith('/api') || r.url.startsWith('/_internal');

    return next(r).pipe(
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
              : normalizeError(error, { url: r.url, method: r.method });
          if (!router.url.includes(ROUTES.TRIAL_EXPIRED)) {
            return from(router.navigate([ROUTES.TRIAL_EXPIRED])).pipe(
              mergeMap(() => throwError(() => rethrown))
            );
          }
          return throwError(() => rethrown);
        }
        if (
          r.headers.has(SESSION_TOKEN_HEADER) &&
          !r.context.get(SESSION_RETRY) &&
          isDeadSession(error)
        ) {
          userDataService.clearToken();
          if (!onAuthPage()) {
            void toLogin();
          }
          // Public endpoints succeed without the token; protected ones come
          // back as a plain 401 and take the auth branch below.
          return send(
            r.clone({
              headers: r.headers.delete(SESSION_TOKEN_HEADER),
              context: r.context.set(SESSION_RETRY, true),
            })
          );
        }
        if (handling === 'silent') {
          return throwError(() => error);
        }
        // normalizeError never throws; this interceptor can no longer crash on
        // non-JSON/HTML/empty bodies.
        const appError = normalizeError(error, {
          url: r.url,
          method: r.method,
        });
        if (appError.kind === 'auth') {
          if (!onAuthPage()) {
            userDataService.clearToken();
            return from(toLogin()).pipe(
              mergeMap(() => throwError(() => appError))
            );
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

  return send(req);
};

function isDeadSession(error: unknown): boolean {
  if (
    !(error instanceof HttpErrorResponse) ||
    (error.status !== 401 && error.status !== 403)
  ) {
    return false;
  }
  return isDeadSessionMessage(normalizeError(error).message);
}
