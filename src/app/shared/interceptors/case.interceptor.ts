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
  // Exclude API docs endpoints from case transformation
  // OpenAPI specs must preserve their exact property names
  const isApiDocs = req.url.includes('/api_docs');

  if (
    req.url.startsWith('/api') &&
    !(req.body instanceof FormData) &&
    !isApiDocs
  ) {
    const transformedRequest = req.clone({
      body: mapCamelToSnake(req.body),
    });
    return next(transformedRequest).pipe(
      map(event => {
        if (
          event instanceof HttpResponse &&
          event.headers.get('Content-Type') === 'application/json'
        ) {
          return event.clone({ body: mapSnakeToCamel(event.body) });
        }
        return event;
      })
    );
  }
  return next(req);
};
