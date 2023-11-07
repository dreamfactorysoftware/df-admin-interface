import {
  HttpErrorResponse,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { tap } from 'rxjs';
import { DfSnackbarService } from '../services/df-snackbar.service';

export const snackbarInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  if (
    req.headers.has('snackbar-success') ||
    req.headers.has('snackbar-error')
  ) {
    const snackbarService = inject(DfSnackbarService);
    const success = req.headers.get('snackbar-success');
    let error = req.headers.get('snackbar-error');
    req = req.clone({
      headers: req.headers.delete('snackbar-success').delete('snackbar-error'),
    });
    return next(req).pipe(
      tap({
        next: evt => {
          if (evt instanceof HttpResponse && success) {
            snackbarService.openSnackBar(success, 'success');
          }
        },
        error: err => {
          if (err instanceof HttpErrorResponse && error) {
            const serverError = err.error.error;
            if (error === 'server' && serverError) {
              error = serverError.message;
            }
            snackbarService.openSnackBar(error ?? 'defaultError', 'error');
          }
        },
      })
    );
  }
  return next(req);
};
