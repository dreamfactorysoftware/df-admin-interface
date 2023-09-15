import {
  HttpErrorResponse,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { DfUserDataService } from '../services/df-user-data.service';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { DfErrorService } from '../services/df-error.service';
import { Router } from '@angular/router';
import { ROUTES } from '../constants/routes';

export const errorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  if (req.url.startsWith('/api')) {
    const router = inject(Router);
    const userDataService = inject(DfUserDataService);
    const errorService = inject(DfErrorService);
    return next(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          userDataService.clearToken();
          router.navigate([ROUTES.AUTH, ROUTES.LOGIN]);
        }
        if (error.status === 403) {
          errorService.error = error.error.error.message;
          router.navigate([ROUTES.ERROR]);
        }
        return throwError(() => error);
      })
    );
  }
  return next(req);
};
