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
  // Skip case transformation for API docs endpoint - OpenAPI specs have specific
  // property names that must not be transformed or Swagger UI won't parse them correctly
  const isApiDocsRequest = req.url.includes('/api_docs');

  // Skip case transformation for /system/event responses. The response keys are
  // event names (e.g. "test_underscore._schema") that the backend uses verbatim
  // when matching scripts — transforming them to camelCase makes the UI show
  // bogus names and the script lookup drift from what the backend expects.
  const isSystemEventRequest = /\/system\/event(\?|$|\/)/.test(req.url);

  const skipResponseTransform = isApiDocsRequest || isSystemEventRequest;

  if (req.url.startsWith('/api') && !(req.body instanceof FormData)) {
    const transformedRequest = req.clone({
      body: isApiDocsRequest ? req.body : mapCamelToSnake(req.body),
    });
    return next(transformedRequest).pipe(
      map(event => {
        if (
          event instanceof HttpResponse &&
          event.headers.get('Content-Type')?.includes('application/json')
        ) {
          if (skipResponseTransform) {
            return event;
          }
          return event.clone({ body: mapSnakeToCamel(event.body) });
        }
        return event;
      })
    );
  }
  return next(req);
};
