import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {
  DfComplianceApiService,
  SECURITY_BASELINE_URL,
} from './compliance-api.service';
import { ERROR_HANDLING } from 'src/app/shared/utilities/http-contexts';

describe('DfComplianceApiService', () => {
  let api: DfComplianceApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    api = TestBed.inject(DfComplianceApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists baselines from the system resource and unwraps resource', done => {
    expect(SECURITY_BASELINE_URL).toBe('/api/v2/system/security_baseline');
    api.list().subscribe(list => {
      expect(list.map(b => b.id)).toEqual(['hipaa']);
      done();
    });
    const req = http.expectOne(SECURITY_BASELINE_URL);
    expect(req.request.method).toBe('GET');
    req.flush({ resource: [{ id: 'hipaa' }] });
  });

  it('reads one baseline by (encoded) id', () => {
    api.get('pci_dss').subscribe();
    http.expectOne(`${SECURITY_BASELINE_URL}/pci_dss`).flush({});
    api.get('a b').subscribe();
    http.expectOne(`${SECURITY_BASELINE_URL}/a%20b`).flush({});
  });

  it('reads what Apply with masking on would change, quietly', done => {
    api.changesWithModeOn('hipaa').subscribe(changes => {
      expect(changes).toEqual([{ id: 'mode', text: 'Turn masking on.' }]);
      done();
    });
    const req = http.expectOne(
      r => r.url === `${SECURITY_BASELINE_URL}/hipaa` && r.method === 'GET'
    );
    expect(req.request.params.get('mode')).toBe('on');
    expect(req.request.context.get(ERROR_HANDLING)).toBe('silent');
    req.flush({ changes: [{ id: 'mode', text: 'Turn masking on.' }] });
  });

  it('applies with an empty body, or mode on when asked; toast-off', () => {
    api.apply('hipaa').subscribe();
    let req = http.expectOne(`${SECURITY_BASELINE_URL}/hipaa/apply`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    expect(req.request.context.get(ERROR_HANDLING)).toBe('toast-off');
    req.flush({});
    api.apply('hipaa', true).subscribe();
    req = http.expectOne(`${SECURITY_BASELINE_URL}/hipaa/apply`);
    expect(req.request.body).toEqual({ mode: 'on' });
    req.flush({});
  });

  it('stops tracking with DELETE', () => {
    api.stopTracking('gdpr').subscribe();
    const req = http.expectOne(`${SECURITY_BASELINE_URL}/gdpr`);
    expect(req.request.method).toBe('DELETE');
    expect(req.request.context.get(ERROR_HANDLING)).toBe('toast-off');
    req.flush({});
  });

  it.each([
    ['json', 'application/json', '{"baseline":{"id":"soc2"}}'],
    ['csv', 'text/csv', 'control,status\nmasking.mode,pass\n'],
  ] as const)(
    'downloads the %s report verbatim as text',
    (format, accept, body) => {
      let got: string | undefined;
      api.report('soc2', format).subscribe(text => (got = text));
      const req = http.expectOne(
        r => r.url === `${SECURITY_BASELINE_URL}/soc2/report`
      );
      expect(req.request.params.get('format')).toBe(format);
      expect(req.request.responseType).toBe('text');
      expect(req.request.headers.get('Accept')).toBe(accept);
      expect(req.request.context.get(ERROR_HANDLING)).toBe('toast-off');
      req.flush(body);
      // Never camelCased or parsed: what the server sent is what is saved.
      expect(got).toBe(body);
    }
  );
});
