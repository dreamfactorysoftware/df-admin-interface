import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { DfUserDataService } from '../services/df-user-data.service';

@Injectable()
export class SessionTokenInterceptor implements HttpInterceptor {
  constructor(private userDataService: DfUserDataService) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (req.url.startsWith('/api')) {
      const token = this.userDataService.token;
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
