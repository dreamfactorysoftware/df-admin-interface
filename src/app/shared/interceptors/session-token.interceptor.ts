import {
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { DfUserDataService } from '../services/df-user-data.service';
import { inject } from '@angular/core';
import { environment } from '../../../../environments/environment';

export const sessionTokenInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  if (req.url.startsWith('/api')) {
    req = req.clone({
      setHeaders: {
        'X-Dreamfactory-API-Key': environment.dfApiKey,
      },
    });
    const userDataService = inject(DfUserDataService);
    const token = userDataService.token;
    if (token) {
      req = req.clone({
        setHeaders: {
          'X-Dreamfactory-Session-Token': token,
        },
      });
    }
  }
  return next(req);
};
