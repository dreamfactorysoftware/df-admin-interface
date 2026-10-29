import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {
  DATA_MASKING_URL,
  DfDataMaskingApiService,
} from './data-masking-api.service';
import { ERROR_HANDLING } from 'src/app/shared/utilities/http-contexts';

describe('DfDataMaskingApiService', () => {
  let api: DfDataMaskingApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    api = TestBed.inject(DfDataMaskingApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('reads the overview from the system resource', () => {
    api.overview().subscribe();
    const req = http.expectOne(DATA_MASKING_URL);
    expect(DATA_MASKING_URL).toBe('/api/v2/system/data_masking');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('can read the overview quietly (no error toast)', () => {
    api.overview(true).subscribe();
    const req = http.expectOne(DATA_MASKING_URL);
    expect(req.request.context.get(ERROR_HANDLING)).toBe('silent');
    req.flush({});
  });

  it('patches the mode with toast-off error handling', () => {
    api.setMode('on').subscribe();
    const req = http.expectOne(DATA_MASKING_URL);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ mode: 'on' });
    expect(req.request.context.get(ERROR_HANDLING)).toBe('toast-off');
    req.flush({});
  });

  it('lists columns per service and unwraps resource', done => {
    api.columns('crm').subscribe(cols => {
      expect(cols.length).toBe(1);
      done();
    });
    const req = http.expectOne(r => r.url === `${DATA_MASKING_URL}/column`);
    expect(req.request.params.get('service')).toBe('crm');
    req.flush({ resource: [{ id: 'crm.a.b' }] });
  });

  it('sends the column id in the body, so any column name works', () => {
    // A name a route segment cannot carry: slash, percent, non-Latin.
    const id = 'crm.survey/responses.e mail%ł';
    api.decide(id, null).subscribe();
    const req = http.expectOne(`${DATA_MASKING_URL}/column`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ id, class: null });
    expect(req.request.context.get(ERROR_HANDLING)).toBe('toast-off');
    req.flush({});
  });

  it('counts the tables a database lists, quietly', done => {
    api.tableCount('db').subscribe(n => {
      expect(n).toBe(0);
      done();
    });
    const req = http.expectOne(r => r.url.endsWith('/db/_table'));
    expect(req.request.params.get('as_list')).toBe('true');
    expect(req.request.context.get(ERROR_HANDLING)).toBe('silent');
    req.flush({ resource: [] });
  });

  it('tests a rule pattern for the live preview', () => {
    api.testRule({ match: 'name', pattern: '^ssn$' }).subscribe();
    const req = http.expectOne(`${DATA_MASKING_URL}/rule/test`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ match: 'name', pattern: '^ssn$' });
    req.flush({ matches: [] });
  });

  it('patches a mask format as a resource list', () => {
    api.setMask('email', 'initial').subscribe();
    const req = http.expectOne(`${DATA_MASKING_URL}/mask`);
    expect(req.request.body).toEqual({
      resource: [{ class: 'email', format: 'initial' }],
    });
    req.flush({ resource: [] });
  });

  it('starts a scan of everything, or of one service', () => {
    api.scan().subscribe();
    let req = http.expectOne(`${DATA_MASKING_URL}/scan`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush({});
    api.scan('hr').subscribe();
    req = http.expectOne(`${DATA_MASKING_URL}/scan`);
    expect(req.request.body).toEqual({ service: 'hr' });
    req.flush({});
  });

  it('saves access as the complete grant list (camelCase in, snake on the wire)', () => {
    api
      .updateAccess({ admins: { grants: [{ adminId: 2, duration: '1h' }] } })
      .subscribe();
    const req = http.expectOne(`${DATA_MASKING_URL}/access`);
    expect(req.request.method).toBe('PATCH');
    // The case interceptor (not under test here) snake_cases the body.
    expect(req.request.body).toEqual({
      admins: { grants: [{ adminId: 2, duration: '1h' }] },
    });
    req.flush({});
  });

  it('reads activity newest first as a resource list', done => {
    api.activity().subscribe(a => {
      expect(a.events.map(e => e.kind)).toEqual(['baseline', 'preview']);
      expect(a.hasMore).toBe(false);
      done();
    });
    http
      .expectOne(`${DATA_MASKING_URL}/activity`)
      .flush({ resource: [{ kind: 'baseline' }, { kind: 'preview' }] });
  });

  it('asks the server for kinds, a page size and older rows', done => {
    api
      .activity({ kinds: ['mode', 'rule'], limit: 200, before: 41 })
      .subscribe(a => {
        expect(a.hasMore).toBe(true);
        done();
      });
    const req = http.expectOne(r => r.url === `${DATA_MASKING_URL}/activity`);
    expect(req.request.params.get('kind')).toBe('mode,rule');
    expect(req.request.params.get('limit')).toBe('200');
    expect(req.request.params.get('before')).toBe('41');
    // The case interceptor (not under test) camelCases has_more.
    req.flush({ resource: [], hasMore: true });
  });

  it('deletes a rule by id', () => {
    api.deleteRule(7).subscribe();
    const req = http.expectOne(`${DATA_MASKING_URL}/rule/7`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });
});
