import {
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { DfUserDataService } from '../services/df-user-data.service';
import { inject } from '@angular/core';

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
    return next(req);
  }
  return next(req);
};
