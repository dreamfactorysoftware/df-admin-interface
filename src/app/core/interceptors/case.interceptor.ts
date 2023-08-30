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
    if (req.url.startsWith('/api') && !(req.body instanceof FormData)) {
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

    if (Array.isArray(obj)) {
      return obj.map(item => this.mapSnakeToCamel(item));
    } else if (typeof obj === 'object' && obj !== null) {
      const newObj: any = {};
      for (const key in obj) {
        newObj[convert(key)] = this.mapSnakeToCamel(obj[key]);
      }
      return newObj;
    } else {
      return obj;
    }
  }

  private mapCamelToSnake(obj: any): any {
    const convert = (str: string) =>
      str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1_$2').toLowerCase();

    if (Array.isArray(obj)) {
      return obj.map(item => this.mapCamelToSnake(item));
    } else if (typeof obj === 'object' && obj !== null) {
      const newObj: any = {};
      for (const key in obj) {
        newObj[convert(key)] = this.mapCamelToSnake(obj[key]);
      }
      return newObj;
    } else {
      return obj;
    }
  }
}
