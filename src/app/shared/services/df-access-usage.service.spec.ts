import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {
  DfAccessUsageService,
  toAccessUsageResult,
} from './df-access-usage.service';
import { URLS } from '../constants/urls';
import { AccessUsageResult } from '../types/access-usage';
import { ERROR_HANDLING } from '../utilities/http-contexts';

const snakeBody = {
  resource: [
    {
      subject_type: 'app',
      subject_id: 4,
      name: 'reporting_app',
      is_active: true,
      last_used_at: '2026-09-10 16:08:12',
      last_denied_at: null,
      last_service: 'db',
      last_status: 200,
      never_used: false,
      stale: false,
      disabled_but_attempted: false,
      role_unreferenced: null,
      last_login_date: null,
      is_sys_admin: null,
      requests_30d: 57,
      top_services: [{ service: 'db', requests: 50 }],
    },
    {
      subject_type: 'app',
      subject_id: 7,
      name: 'old_key',
      is_active: false,
      last_used_at: null,
      last_denied_at: '2026-09-09 08:00:00',
      last_service: null,
      last_status: null,
      never_used: true,
      stale: false,
      disabled_but_attempted: true,
      role_unreferenced: null,
      last_login_date: null,
      is_sys_admin: null,
      requests_30d: null,
      top_services: null,
    },
  ],
  meta: {
    subject: 'app',
    stale_days: 90,
    generated_at: '2026-09-10 16:30:00',
    ledger_available: true,
    tracking_started_at: '2026-06-01 00:00:00',
  },
};

describe('DfAccessUsageService', () => {
  let service: DfAccessUsageService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(DfAccessUsageService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  const expectRequest = (subject: string) =>
    http.expectOne(
      req =>
        req.url === URLS.ACCESS_USAGE && req.params.get('subject') === subject
    );

  it('requests the subject with stale_days and include_never_used, silently', () => {
    service.load('role').subscribe();
    const req = expectRequest('role');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('stale_days')).toBe('90');
    expect(req.request.params.get('include_never_used')).toBe('true');
    expect(req.request.context.get(ERROR_HANDLING)).toBe('silent');
    req.flush({ resource: [] });
  });

  it('passes a custom stale window through', () => {
    service
      .load('user', { staleDays: 30, includeNeverUsed: false })
      .subscribe();
    const req = expectRequest('user');
    expect(req.request.params.get('stale_days')).toBe('30');
    expect(req.request.params.get('include_never_used')).toBe('false');
    req.flush({ resource: [] });
  });

  it('indexes rows by subject id', () => {
    let result: AccessUsageResult | undefined;
    service.load('app').subscribe(r => (result = r));
    expectRequest('app').flush(snakeBody);

    expect(result?.available).toBe(true);
    expect([...(result?.rows.keys() ?? [])]).toEqual([4, 7]);
    const used = result?.rows.get(4);
    expect(used?.lastUsedAt).toBe('2026-09-10 16:08:12');
    expect(used?.lastService).toBe('db');
    expect(used?.requests30d).toBe(57);
    expect(used?.topServices).toEqual([{ service: 'db', requests: 50 }]);
    expect(result?.rows.get(7)?.disabledButAttempted).toBe(true);
    expect(result?.meta).toEqual({
      subject: 'app',
      staleDays: 90,
      generatedAt: '2026-09-10 16:30:00',
      ledgerAvailable: true,
      trackingStartedAt: '2026-06-01 00:00:00',
    });
  });

  it('accepts a body the case interceptor already camelCased', () => {
    const result = toAccessUsageResult({
      resource: [{ subjectType: 'user', subjectId: '12', neverUsed: true }],
    });
    expect(result.available).toBe(true);
    expect(result.rows.get(12)?.neverUsed).toBe(true);
    expect(result.meta).toBeNull();
  });

  // 404: older DreamFactory; 401: non-admin; 403: restricted admin;
  // 400: invalid params.
  it.each([404, 401, 403, 400, 500])(
    'resolves HTTP %s to an unavailable, empty result',
    status => {
      let result: AccessUsageResult | undefined;
      service.load('app').subscribe(r => (result = r));
      expectRequest('app').flush(
        { error: { code: status } },
        { status, statusText: 'Error' }
      );
      expect(result).toEqual({ available: false, rows: new Map(), meta: null });
    }
  );

  it('resolves a network failure to unavailable', () => {
    let result: AccessUsageResult | undefined;
    service.load('role').subscribe(r => (result = r));
    expectRequest('role').error(new ProgressEvent('error'));
    expect(result?.available).toBe(false);
  });

  it('treats a 200 without a resource array as unavailable', () => {
    let result: AccessUsageResult | undefined;
    service.load('app').subscribe(r => (result = r));
    expectRequest('app').flush({ unexpected: true });
    expect(result?.available).toBe(false);
    expect(result?.rows.size).toBe(0);
  });
});
