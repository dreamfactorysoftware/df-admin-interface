import {
  HttpErrorResponse,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DfSnackbarComponent } from 'src/app/shared/components/df-snackbar/df-snackbar.component';
import { AlertType } from 'src/app/shared/components/df-alert/df-alert.component';
import { inject } from '@angular/core';
import { tap } from 'rxjs';

export const snackbarInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  if (
    req.headers.has('snackbar-success') ||
    req.headers.has('snackbar-error')
  ) {
    const success = req.headers.get('snackbar-success');
    let error = req.headers.get('snackbar-error');
    req = req.clone({
      headers: req.headers.delete('snackbar-success').delete('snackbar-error'),
    });
    return next(req).pipe(
      tap({
        next: evt => {
          if (evt instanceof HttpResponse && success) {
            openSnackBar(success, 'success');
          }
        },
        error: err => {
          if (err instanceof HttpErrorResponse && error) {
            const serverError = err.error.error;
            if (error === 'server' && serverError) {
              error = serverError.message;
            }
            openSnackBar(error ?? 'defaultError', 'error');
          }
        },
      })
    );
  }
  return next(req);
};

function openSnackBar(message: string, alertType: AlertType) {
  const snackBar = inject(MatSnackBar);
  snackBar.openFromComponent(DfSnackbarComponent, {
    duration: 5000,
    horizontalPosition: 'left',
    verticalPosition: 'bottom',
    data: {
      message,
      alertType,
    },
  });
}
