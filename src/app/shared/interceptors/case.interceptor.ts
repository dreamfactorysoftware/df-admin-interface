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

  // Skip response transform for the API Builder preview/test runner. Its response
  // is live data from the user's endpoint, whose keys are real source columns or
  // user-defined output aliases (which may be snake_case on purpose) — camelCasing
  // them would misrepresent what the actual /api/v2/{api}/{endpoint} returns.
  const isApiBuilderTest = /\/api_builder\/test(\?|$|\/)/.test(req.url);

  // Skip response transform for AI chat session endpoints (/api/v2/{service}/session
  // and /session/{id}). The entire adf-ai-chat module — its ChatSession/ChatMessage
  // types, templates, and getters — reads the backend's snake_case verbatim
  // (input_tokens, latency_ms, tool_calls, updated_at, total_input_tokens). Deep
  // camelCasing these drops the per-message metering (the tokens/cost/latency chip
  // row goes dead) and the timestamps, so honest metered data never renders. The
  // pattern anchors to a single service segment so it never matches /_table/session
  // data rows, and /user/session (auth login) is explicitly excluded.
  const isChatSession =
    /^\/api\/v2\/[^/]+\/session(\/\d+)?(\?|$)/.test(req.url) &&
    !/^\/api\/v2\/user\/session/.test(req.url);

  // Skip both directions for the semantic catalog (/system/semantic). Its
  // definitions are the verbatim arguments agents receive (maps_to, group_by,
  // verified_queries, run_with.arguments.table_name), so the editor reads and
  // writes them in the backend's snake_case and the preview shows exactly
  // what an agent sees.
  const isSemanticCatalog = /^\/api\/v2\/system\/semantic(\/|\?|$)/.test(
    req.url
  );

  const skipResponseTransform =
    isSemanticCatalog ||
    isApiDocsRequest ||
    isSystemEventRequest ||
    isApiBuilderTest ||
    isChatSession;

  if (req.url.startsWith('/api') && !(req.body instanceof FormData)) {
    const transformedRequest = req.clone({
      body:
        isApiDocsRequest || isSemanticCatalog
          ? req.body
          : mapCamelToSnake(req.body),
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
