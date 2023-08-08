import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DfLoadingSpinnerService } from '../services/df-loading-spinner.service';
import { Observable, finalize } from 'rxjs';

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  constructor(private loadingSpinnerService: DfLoadingSpinnerService) {}
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (req.headers.has('show-loading')) {
      this.loadingSpinnerService.active = true;
      req = req.clone({ headers: req.headers.delete('show-loading') });
      return next.handle(req).pipe(
        finalize(() => {
          this.loadingSpinnerService.active = false;
        })
      );
    }
    return next.handle(req);
  }
}
