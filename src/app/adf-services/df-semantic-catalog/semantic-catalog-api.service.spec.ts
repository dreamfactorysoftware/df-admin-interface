import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { SemanticCatalogApiService } from './semantic-catalog-api.service';

describe('SemanticCatalogApiService', () => {
  let api: SemanticCatalogApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    api = TestBed.inject(SemanticCatalogApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('tables(): sorted names, or null (not []) when the list fails', () => {
    const got: unknown[] = [];
    api.tables('db').subscribe(t => got.push(t));
    http
      .expectOne(r => r.url.endsWith('/db/_schema'))
      .flush({ resource: [{ name: 'b' }, { name: 'a' }] });
    api.tables('db').subscribe(t => got.push(t));
    http
      .expectOne(r => r.url.endsWith('/db/_schema'))
      .flush({}, { status: 500, statusText: 'err' });
    expect(got).toEqual([['a', 'b'], null]);
  });

  it('aiConnections(): a 403 is "forbidden", not an empty list', () => {
    const got: unknown[] = [];
    api.aiConnections().subscribe(r => got.push(r));
    http
      .expectOne(r => r.url.endsWith('/system/service'))
      .flush({}, { status: 403, statusText: 'Forbidden' });
    api.aiConnections().subscribe(r => got.push(r));
    http
      .expectOne(r => r.url.endsWith('/system/service'))
      .flush({}, { status: 500, statusText: 'err' });
    api.aiConnections().subscribe(r => got.push(r));
    http
      .expectOne(r => r.url.endsWith('/system/service'))
      .flush({ resource: [{ id: 1, name: 'ai' }] });
    expect(got).toEqual([
      { rows: [], error: 'forbidden' },
      { rows: [], error: 'failed' },
      { rows: [{ id: 1, name: 'ai' }], error: null },
    ]);
  });
});
