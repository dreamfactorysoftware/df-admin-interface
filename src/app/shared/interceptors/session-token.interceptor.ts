import {
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { DfUserDataService } from '../services/df-user-data.service';
import { inject } from '@angular/core';
import { environment } from '../../../../environments/environment';
import {
  API_KEY_HEADER,
  SESSION_TOKEN_HEADER,
} from '../constants/http-headers';

export const sessionTokenInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  if (req.url.startsWith('/api')) {
    const isApiDocs = req.urlWithParams.includes('swagger') ||
                              req.url.includes('service_type') ||
                              req.url.includes('api_docs');
    req = req.clone({
      setHeaders: {
        [API_KEY_HEADER]: isApiDocs ? environment.dfApiDocsApiKey : environment.dfAdminApiKey,
      },
    });
    const userDataService = inject(DfUserDataService);
    const token = userDataService.token;
    if (token) {
      req = req.clone({
        setHeaders: {
          [SESSION_TOKEN_HEADER]: token,
        },
      });
    }
  }
  return next(req);
};
