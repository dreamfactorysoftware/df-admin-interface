import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DfSnackbarComponent } from 'src/app/shared/components/df-snackbar/df-snackbar.component';
import { AlertType } from 'src/app/shared/components/df-alert/df-alert.component';

@Injectable()
export class SnackbarInterceptor implements HttpInterceptor {
  constructor(private snackBar: MatSnackBar) {}

  openSnackBar(message: string, alertType: AlertType) {
    this.snackBar.openFromComponent(DfSnackbarComponent, {
      duration: 5000,
      horizontalPosition: 'left',
      verticalPosition: 'bottom',
      data: {
        message,
        alertType,
      },
    });
  }

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (
      req.headers.has('snackbar-success') ||
      req.headers.has('snackbar-error')
    ) {
      const success = req.headers.get('snackbar-success');
      const error = req.headers.get('snackbar-error');
      req = req.clone({
        headers: req.headers
          .delete('snackbar-success')
          .delete('snackbar-error'),
      });
      return next.handle(req).pipe(
        tap({
          next: evt => {
            if (evt instanceof HttpResponse && success) {
              this.openSnackBar(success, 'success');
            }
          },
          error: err => {
            if (err instanceof HttpErrorResponse && error) {
              this.openSnackBar(error, 'error');
            }
          },
        })
      );
    }
    return next.handle(req);
  }
}
