import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class CaseInterceptor implements HttpInterceptor {
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (req.url.startsWith('/api')) {
      const transformedRequest = req.clone({
        body: this.mapCamelToSnake(req.body),
      });
      return next.handle(transformedRequest).pipe(
        map(event => {
          if (event instanceof HttpResponse) {
            return event.clone({ body: this.mapSnakeToCamel(event.body) });
          }
          return event;
        })
      );
    }
    return next.handle(req);
  }
  private mapSnakeToCamel(obj: any): any {
    const convert = (str: string) =>
      str.replace(/([-_]\w)/g, g => g[1].toUpperCase());
    const newObj: any = {};
    for (const key in obj) {
      newObj[convert(key)] = obj[key];
    }
    return newObj;
  }

  private mapCamelToSnake(obj: any): any {
    const convert = (str: string) =>
      str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1_$2').toLowerCase();
    const newObj: any = {};
    for (const key in obj) {
      newObj[convert(key)] = obj[key];
    }
    return newObj;
  }
}
