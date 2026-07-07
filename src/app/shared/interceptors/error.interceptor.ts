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
import { normalizeError } from '../utilities/app-error';
import { ERROR_HANDLING, SUCCESS_TOAST } from '../utilities/http-contexts';
import { ROUTES } from '../types/routes';

/**
 * Default-on error surfacing, severity-routed:
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

  return next(req).pipe(
    tap(event => {
      // Success toasts are honored for ALL hosts (github import dialog posts
      // to api.github.com); only the error policy is /api + /_internal scoped.
      if (successToast && event instanceof HttpResponse) {
        snackbarService.openSnackBar(successToast, 'success');
      }
    }),
    catchError((error: unknown) => {
      if (!inScope || handling === 'silent') {
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
