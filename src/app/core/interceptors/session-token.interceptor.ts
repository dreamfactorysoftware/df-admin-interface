import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { DfAuthService } from '../services/df-auth.service';

@Injectable()
export class SessionTokenInterceptor implements HttpInterceptor {
  constructor(private authService: DfAuthService) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (req.url.startsWith('/api')) {
      const token = this.authService.token;
      if (token) {
        req = req.clone({
          setHeaders: {
            'X-Dreamfactory-Session-Token': token,
          },
        });
      }
      return next.handle(req);
    }
    return next.handle(req);
  }
}
