import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { AAUTH_URL, DfAauthApiService } from './aauth-api.service';
import { ERROR_HANDLING } from 'src/app/shared/utilities/http-contexts';

describe('DfAauthApiService', () => {
  let api: DfAauthApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    api = TestBed.inject(DfAauthApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('reads the overview from the system resource', () => {
    expect(AAUTH_URL).toBe('/api/v2/system/aauth');
    api.overview().subscribe();
    const req = http.expectOne(AAUTH_URL);
    expect(req.request.method).toBe('GET');
    expect(req.request.context.get(ERROR_HANDLING)).toBe('default');
    req.flush({});
  });

  it('patches enabled with toast-off error handling', () => {
    api.setEnabled(true).subscribe();
    const req = http.expectOne(AAUTH_URL);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ enabled: true });
    expect(req.request.context.get(ERROR_HANDLING)).toBe('toast-off');
    req.flush({});
  });

  it('unwraps resource lists', done => {
    api.scopes().subscribe(rows => {
      expect(rows.length).toBe(2);
      done();
    });
    http.expectOne(`${AAUTH_URL}/scopes`).flush({ resource: [{}, {}] });
  });

  it('treats a missing resource as an empty list', done => {
    api.agents(true).subscribe(rows => {
      expect(rows).toEqual([]);
      done();
    });
    const req = http.expectOne(`${AAUTH_URL}/agents`);
    expect(req.request.context.get(ERROR_HANDLING)).toBe('silent');
    req.flush({});
  });

  it('patches a scope by role id', () => {
    api.updateScope(7, { scope: 'sales.read' }).subscribe();
    const req = http.expectOne(`${AAUTH_URL}/scopes/7`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ scope: 'sales.read' });
    req.flush({});
  });

  it('adds, patches and deletes Person Servers', () => {
    api.addPersonServer('https://ps.example').subscribe();
    const add = http.expectOne(`${AAUTH_URL}/person_servers`);
    expect(add.request.method).toBe('POST');
    expect(add.request.body).toEqual({ issuer: 'https://ps.example' });
    add.flush({});

    api.updatePersonServer(3, { scopes: ['a'] }).subscribe();
    const patch = http.expectOne(`${AAUTH_URL}/person_servers/3`);
    expect(patch.request.method).toBe('PATCH');
    patch.flush({});

    api.deletePersonServer(3).subscribe();
    const del = http.expectOne(`${AAUTH_URL}/person_servers/3`);
    expect(del.request.method).toBe('DELETE');
    expect(del.request.context.get(ERROR_HANDLING)).toBe('toast-off');
    del.flush(null);
  });

  it('pages activity with limit and before_id, keeping has_more', () => {
    let page: unknown;
    api.activity(100, 42).subscribe(p => (page = p));
    const req = http.expectOne(r => r.url === `${AAUTH_URL}/activity`);
    expect(req.request.params.get('limit')).toBe('100');
    expect(req.request.params.get('before_id')).toBe('42');
    req.flush({ resource: [{ id: 1 }], hasMore: true });
    expect(page).toEqual({ rows: [{ id: 1 }], hasMore: true });
  });

  it('blocks agents and revokes grants', () => {
    api.setAgentStatus(5, 'blocked').subscribe();
    const a = http.expectOne(`${AAUTH_URL}/agents/5`);
    expect(a.request.body).toEqual({ status: 'blocked' });
    a.flush({});
    api.revokeGrant(9).subscribe();
    const g = http.expectOne(`${AAUTH_URL}/grants/9`);
    expect(g.request.method).toBe('DELETE');
    g.flush(null);
  });

  it('drives the playground: send, advance (silent) and reset', () => {
    api.playgroundSend({ method: 'GET', path: '/api/v2/x' }).subscribe();
    const send = http.expectOne(`${AAUTH_URL}/playground`);
    expect(send.request.body).toEqual({
      action: 'send',
      method: 'GET',
      path: '/api/v2/x',
    });
    send.flush({});

    api.playgroundAdvance('r1').subscribe();
    const adv = http.expectOne(`${AAUTH_URL}/playground`);
    expect(adv.request.body).toEqual({ action: 'advance', runId: 'r1' });
    expect(adv.request.context.get(ERROR_HANDLING)).toBe('silent');
    adv.flush({});

    api.playgroundReset().subscribe();
    const reset = http.expectOne(`${AAUTH_URL}/playground`);
    expect(reset.request.body).toEqual({ action: 'reset' });
    reset.flush({});
  });
});
