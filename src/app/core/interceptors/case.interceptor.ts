import {
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { map } from 'rxjs';
import {
  mapCamelToSnake,
  mapSnakeToCamel,
} from 'src/app/shared/utilities/case';

export const caseInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  if (req.url.startsWith('/api') && !(req.body instanceof FormData)) {
    const transformedRequest = req.clone({
      body: mapCamelToSnake(req.body),
    });
    return next(transformedRequest).pipe(
      map(event => {
        if (
          event instanceof HttpResponse &&
          event.headers.get('Content-type') === 'application/json'
        ) {
          return event.clone({ body: mapSnakeToCamel(event.body) });
        }
        return event;
      })
    );
  }
  return next(req);
};
