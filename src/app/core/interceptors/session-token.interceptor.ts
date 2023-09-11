import {
  HttpErrorResponse,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { DfUserDataService } from '../services/df-user-data.service';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

export const sessionTokenInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  if (req.url.startsWith('/api')) {
    const userDataService = inject(DfUserDataService);
    const token = userDataService.token;
    if (token) {
      req = req.clone({
        setHeaders: {
          'X-Dreamfactory-Session-Token': token,
        },
      });
    }
    return next(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          userDataService.clearToken();
        }
        return throwError(() => new Error(error.error.message));
      })
    );
  }
  return next(req);
};
