import {
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { tap } from 'rxjs/operators';
import { DfSnowflakeUsageService } from '../services/df-snowflake-usage.service';

export const snowflakeUsageInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const usageService = inject(DfSnowflakeUsageService);

  return next(req).pipe(
    tap(event => {
      if (event instanceof HttpResponse) {
        // Check if response has Snowflake usage headers
        const limit = event.headers.get('X-DreamFactory-Snowflake-Limit');
        const remaining = event.headers.get('X-DreamFactory-Snowflake-Remaining');
        const reset = event.headers.get('X-DreamFactory-Snowflake-Reset');

        if (limit !== null && remaining !== null && reset !== null) {
          // Update usage instantly from response headers
          usageService.updateUsage({
            limit: parseInt(limit, 10),
            remaining: parseInt(remaining, 10),
            reset_at: reset,
          });
        }
      }
    })
  );
};
