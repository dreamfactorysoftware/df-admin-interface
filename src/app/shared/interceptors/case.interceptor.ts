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
    if (req.body) {
      const body = req.body as { resource?: { type: string }[] };
      if (body.resource && body.resource.length > 0) {
        const resourceType = body.resource[0].type;
        if (resourceType === 'okta_saml') {
          const transformedRequest = req.clone({
            body: req.body,
          });
          return next(transformedRequest).pipe(
            map(event => {
              if (event instanceof HttpResponse) {
                const contentType = event.headers.get('Content-Type');
                if (
                  contentType &&
                  contentType.toLowerCase().includes('application/json')
                ) {
                  return event.clone({ body: mapSnakeToCamel(event.body) });
                }
              }
              return event;
            })
          );
        }
      }
    }

    const transformedRequest = req.clone({
      body: mapCamelToSnake(req.body),
    });
    return next(transformedRequest).pipe(
      map(event => {
        if (event instanceof HttpResponse) {
          const contentType = event.headers.get('Content-Type');
          if (
            contentType &&
            contentType.toLowerCase().includes('application/json')
          ) {
            return event.clone({ body: mapSnakeToCamel(event.body) });
          }
        }
        return event;
      })
    );
  }
  return next(req);
};
