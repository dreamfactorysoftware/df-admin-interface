import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { caseInterceptor } from './case.interceptor';

describe('caseInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([caseInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('transforms snake_case response keys to camelCase for normal endpoints', done => {
    http.get('/api/v2/system/service').subscribe((body: any) => {
      expect(body.some_key).toBeUndefined();
      expect(body.someKey).toBe('v');
      done();
    });
    const req = httpMock.expectOne('/api/v2/system/service');
    req.flush(
      { some_key: 'v' },
      { headers: { 'Content-Type': 'application/json' } }
    );
  });

  it('passes /system/event responses through unchanged', done => {
    // Regression: event names are response keys and the backend matches
    // scripts by the raw string. Transforming to camelCase would break the
    // Script Type dropdown and corrupt saved script names for any service
    // whose name contains an underscore.
    const raw = {
      test_underscore: {
        'test_underscore._schema': { endpoints: ['a.b.c'] },
      },
    };
    http
      .get('/api/v2/system/event?services_only=true')
      .subscribe((body: any) => {
        expect(body).toEqual(raw);
        done();
      });
    const req = httpMock.expectOne('/api/v2/system/event?services_only=true');
    req.flush(raw, { headers: { 'Content-Type': 'application/json' } });
  });

  it('passes /api_docs responses through unchanged (OpenAPI keys must survive)', done => {
    const raw = { 'x-custom': 1, paths: { '/foo_bar': {} } };
    http.get('/api/v2/api_docs/swagger').subscribe((body: any) => {
      expect(body).toEqual(raw);
      done();
    });
    const req = httpMock.expectOne('/api/v2/api_docs/swagger');
    req.flush(raw, { headers: { 'Content-Type': 'application/json' } });
  });

  it('converts camelCase request bodies to snake_case', () => {
    http
      .post('/api/v2/system/service', { isActive: true, apiKey: 'x' })
      .subscribe();
    const req = httpMock.expectOne('/api/v2/system/service');
    expect(req.request.body).toEqual({ is_active: true, api_key: 'x' });
    req.flush({});
  });

  it('does not transform requests that fall outside /api', () => {
    http.get('/dreamfactory/dist/assets/i18n/en.json').subscribe();
    const req = httpMock.expectOne('/dreamfactory/dist/assets/i18n/en.json');
    req.flush(
      { some_key: 'v' },
      { headers: { 'Content-Type': 'application/json' } }
    );
    // no assertion besides: no error, no transform applied
  });
});
