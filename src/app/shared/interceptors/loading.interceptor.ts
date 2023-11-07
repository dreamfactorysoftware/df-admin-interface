import {
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { DfLoadingSpinnerService } from '../services/df-loading-spinner.service';
import { finalize } from 'rxjs';

export const loadingInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  if (req.headers.has('show-loading')) {
    const loadingSpinnerService = inject(DfLoadingSpinnerService);
    loadingSpinnerService.active = true;
    req = req.clone({ headers: req.headers.delete('show-loading') });
    return next(req).pipe(
      finalize(() => {
        loadingSpinnerService.active = false;
      })
    );
  }
  return next(req);
};
