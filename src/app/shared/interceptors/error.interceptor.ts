import {
  HttpErrorResponse,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { DfUserDataService } from '../services/df-user-data.service';
import { inject } from '@angular/core';
import { catchError, from, mergeMap, throwError } from 'rxjs';
import { DfErrorService } from '../services/df-error.service';
import { Router } from '@angular/router';
import { ROUTES } from '../types/routes';

export const errorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const skipError = req.headers.get('skip-error');
  if (req.url.startsWith('/api') && !skipError) {
    const router = inject(Router);
    const userDataService = inject(DfUserDataService);
    const errorService = inject(DfErrorService);
    errorService.error = null;
    req = req.clone({ headers: req.headers.delete('skip-error') });
    return next(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          userDataService.clearToken();
          return from(router.navigate([ROUTES.AUTH, ROUTES.LOGIN])).pipe(
            mergeMap(() => throwError(() => error))
          );
        }
        if (error.status === 403 || error.status === 404) {
          errorService.error = error.error.error.message;
          return from(router.navigate([ROUTES.ERROR])).pipe(
            mergeMap(() => throwError(() => error))
          );
        }
        return throwError(() => error);
      })
    );
  }
  return next(req);
};
