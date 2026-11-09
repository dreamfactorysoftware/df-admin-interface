import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { DfServerSettingsService } from './df-server-settings.service';
import { DfSystemConfigDataService } from './df-system-config-data.service';
import { DfUserDataService } from './df-user-data.service';
import { SESSION_TOKEN_HEADER } from '../constants/http-headers';
import { URLS } from '../constants/urls';
import { UserSession } from '../types/user';

const user = (u: Partial<UserSession>) => u as UserSession;

describe('DfServerSettingsService', () => {
  let service: DfServerSettingsService;
  let http: HttpTestingController;
  const config = { fetchEnvironmentData: jest.fn(() => of({})) };

  beforeEach(() => {
    config.fetchEnvironmentData.mockReset().mockReturnValue(of({}));
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: DfSystemConfigDataService, useValue: config }],
    });
    service = TestBed.inject(DfServerSettingsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getAll reads the resource list', () => {
    let rows: unknown;
    service.getAll().subscribe(r => (rows = r));
    const req = http.expectOne(URLS.SERVER_SETTING);
    expect(req.request.method).toBe('GET');
    req.flush({ resource: [{ name: 'log_level', source: 'env' }] });
    expect(rows).toEqual([{ name: 'log_level', source: 'env' }]);
  });

  it('update PATCHes the named setting and refreshes the environment', () => {
    let result: unknown;
    service.update('log_level', 'error').subscribe(r => (result = r));
    const req = http.expectOne(`${URLS.SERVER_SETTING}/log_level`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ value: 'error' });
    const row = { name: 'log_level', value: 'error', source: 'override' };
    req.flush(row);
    expect(config.fetchEnvironmentData).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ setting: row, environmentRefreshed: true });
  });

  it('reset DELETEs the named setting and refreshes the environment', () => {
    let result: unknown;
    service.reset('log_level').subscribe(r => (result = r));
    const req = http.expectOne(`${URLS.SERVER_SETTING}/log_level`);
    expect(req.request.method).toBe('DELETE');
    const row = { name: 'log_level', source: 'env' };
    req.flush(row);
    expect(config.fetchEnvironmentData).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ setting: row, environmentRefreshed: true });
  });

  // Regression: a failed environment refresh used to surface as a failed
  // save although the PATCH/DELETE had already succeeded.
  describe('save and refresh are separate outcomes', () => {
    const refreshFails = () =>
      config.fetchEnvironmentData.mockReturnValue(
        throwError(() => new Error('environment 500')) as never
      );

    it('update: saved row comes back when only the refresh fails', () => {
      refreshFails();
      const results: unknown[] = [];
      const errors: unknown[] = [];
      service.update('log_level', 'error').subscribe({
        next: r => results.push(r),
        error: e => errors.push(e),
      });
      const row = { name: 'log_level', value: 'error', source: 'override' };
      http.expectOne(`${URLS.SERVER_SETTING}/log_level`).flush(row);

      expect(errors).toEqual([]);
      expect(results).toEqual([{ setting: row, environmentRefreshed: false }]);
    });

    it('reset: saved row comes back when only the refresh fails', () => {
      refreshFails();
      const results: unknown[] = [];
      const errors: unknown[] = [];
      service.reset('log_level').subscribe({
        next: r => results.push(r),
        error: e => errors.push(e),
      });
      const row = { name: 'log_level', value: 'info', source: 'env' };
      http.expectOne(`${URLS.SERVER_SETTING}/log_level`).flush(row);

      expect(errors).toEqual([]);
      expect(results).toEqual([{ setting: row, environmentRefreshed: false }]);
    });

    it('update: a failed PATCH is an error and never refreshes', () => {
      const results: unknown[] = [];
      const errors: unknown[] = [];
      service.update('log_level', 'loud').subscribe({
        next: r => results.push(r),
        error: e => errors.push(e),
      });
      http
        .expectOne(`${URLS.SERVER_SETTING}/log_level`)
        .flush({ error: {} }, { status: 400, statusText: 'Bad Request' });

      expect(results).toEqual([]);
      expect(errors).toHaveLength(1);
      expect(config.fetchEnvironmentData).not.toHaveBeenCalled();
    });

    it('reset: a failed DELETE is an error and never refreshes', () => {
      const errors: unknown[] = [];
      service.reset('log_level').subscribe({ error: e => errors.push(e) });
      http
        .expectOne(`${URLS.SERVER_SETTING}/log_level`)
        .flush({ error: {} }, { status: 500, statusText: 'Server Error' });

      expect(errors).toHaveLength(1);
      expect(config.fetchEnvironmentData).not.toHaveBeenCalled();
    });
  });
});

// Backend support comes from the system resource list (GET /api/v2/system),
// the same list the paywall checks use. These run against the real
// DfSystemConfigDataService so the caching is the real one.
describe('DfServerSettingsService backend support', () => {
  let service: DfServerSettingsService;
  let http: HttpTestingController;
  const userData$ = new BehaviorSubject<UserSession | null>(null);
  const accessibleTabs = jest.fn(
    (): Observable<Array<string>> => of([] as Array<string>)
  );

  const oldBackend = { resource: [{ name: 'admin' }, { name: 'cache' }] };
  const newBackend = {
    resource: [{ name: 'admin' }, { name: 'server_setting' }],
  };

  const collect = <T>(source: Observable<T>) => {
    const seen: T[] = [];
    source.subscribe(v => seen.push(v));
    return seen;
  };

  beforeEach(() => {
    userData$.next(null);
    accessibleTabs.mockReset().mockReturnValue(of([]));
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: DfUserDataService, useValue: { userData$, accessibleTabs } },
      ],
    });
    service = TestBed.inject(DfServerSettingsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  describe('supported()', () => {
    it('is true when the system resource list has server_setting', () => {
      const seen = collect(service.supported());
      http.expectOne(URLS.SYSTEM).flush(newBackend);
      expect(seen).toEqual([true]);
    });

    it('is false on a backend without the resource', () => {
      const seen = collect(service.supported());
      http.expectOne(URLS.SYSTEM).flush(oldBackend);
      expect(seen).toEqual([false]);
    });

    it('is false when the resource list cannot be read', () => {
      const seen = collect(service.supported());
      http
        .expectOne(URLS.SYSTEM)
        .flush('no', { status: 500, statusText: 'Server Error' });
      expect(seen).toEqual([false]);
    });

    it('looks the list up in the background: no loading spinner header', () => {
      service.supported().subscribe();
      const req = http.expectOne(URLS.SYSTEM);
      expect(req.request.headers.has('show-loading')).toBe(false);
      req.flush(newBackend);
    });

    it('shares one request between concurrent callers and then uses the cache', () => {
      const a = collect(service.supported());
      const b = collect(service.supported());
      http.expectOne(URLS.SYSTEM).flush(newBackend);
      expect(a).toEqual([true]);
      expect(b).toEqual([true]);

      expect(collect(service.supported())).toEqual([true]);
      http.expectNone(URLS.SYSTEM);
    });

    it('reuses a list something else already loaded: no request at all', () => {
      TestBed.inject(DfSystemConfigDataService).fetchSystemData().subscribe();
      http.expectOne(URLS.SYSTEM).flush(newBackend);

      expect(collect(service.supported())).toEqual([true]);
      http.expectNone(URLS.SYSTEM);
    });

    it('asks again after a failed lookup', () => {
      collect(service.supported());
      http
        .expectOne(URLS.SYSTEM)
        .flush('no', { status: 500, statusText: 'Server Error' });

      const seen = collect(service.supported());
      http.expectOne(URLS.SYSTEM).flush(newBackend);
      expect(seen).toEqual([true]);
    });
  });

  describe('load()', () => {
    it('answers null on an old backend without calling server_setting', () => {
      const seen = collect(service.load());
      http.expectOne(URLS.SYSTEM).flush(oldBackend);
      http.expectNone(URLS.SERVER_SETTING);
      expect(seen).toEqual([null]);
    });

    it('reads the settings when the backend has the resource', () => {
      const seen = collect(service.load());
      http.expectOne(URLS.SYSTEM).flush(newBackend);
      http
        .expectOne(URLS.SERVER_SETTING)
        .flush({ resource: [{ name: 'log_level' }] });
      expect(seen).toEqual([[{ name: 'log_level' }]]);
    });

    it('falls back to the resource itself when the list cannot be read: 404 is null', () => {
      const seen = collect(service.load());
      http
        .expectOne(URLS.SYSTEM)
        .flush('no', { status: 500, statusText: 'Server Error' });
      http
        .expectOne(URLS.SERVER_SETTING)
        .flush({ error: {} }, { status: 404, statusText: 'Not Found' });
      expect(seen).toEqual([null]);
    });

    it('passes other load failures on as errors', () => {
      const errors: Array<{ status: number }> = [];
      service.load().subscribe({ error: e => errors.push(e) });
      http.expectOne(URLS.SYSTEM).flush(newBackend);
      http
        .expectOne(URLS.SERVER_SETTING)
        .flush({ error: {} }, { status: 403, statusText: 'Forbidden' });
      expect(errors.map(e => e.status)).toEqual([403]);
    });
  });

  describe('canOpen$', () => {
    it('is false while signed out, with no request', () => {
      expect(collect(service.canOpen$)).toEqual([false]);
      http.expectNone(URLS.SYSTEM);
    });

    it('root admin on a backend with the resource: false, then true', () => {
      userData$.next(user({ isSysAdmin: true, isRootAdmin: true }));
      const seen = collect(service.canOpen$);
      expect(seen).toEqual([false]);
      http.expectOne(URLS.SYSTEM).flush(newBackend);
      expect(seen).toEqual([false, true]);
    });

    it('root admin on an old backend: stays false', () => {
      userData$.next(user({ isSysAdmin: true, isRootAdmin: true }));
      const seen = collect(service.canOpen$);
      http.expectOne(URLS.SYSTEM).flush(oldBackend);
      expect(seen).toEqual([false]);
    });

    it('restricted admin with the Config tab: true once tabs and list are in', () => {
      const restricted = user({ isSysAdmin: true, roleId: 3 });
      accessibleTabs.mockReturnValue(of(['apps', 'config']));
      userData$.next(restricted);
      const seen = collect(service.canOpen$);
      expect(accessibleTabs).toHaveBeenCalledWith(restricted);
      http.expectOne(URLS.SYSTEM).flush(newBackend);
      expect(seen).toEqual([false, true]);
    });

    it('restricted admin without the Config tab: false, and the list is never fetched', () => {
      accessibleTabs.mockReturnValue(of(['apps']));
      userData$.next(user({ isSysAdmin: true, roleId: 3 }));
      expect(collect(service.canOpen$)).toEqual([false]);
      http.expectNone(URLS.SYSTEM);
    });

    it('restricted admin whose tabs cannot be loaded: false', () => {
      accessibleTabs.mockReturnValue(throwError(() => new Error('403')));
      userData$.next(user({ isSysAdmin: true, roleId: 3 }));
      expect(collect(service.canOpen$)).toEqual([false]);
      http.expectNone(URLS.SYSTEM);
    });

    it('non-admin user: false, no tabs lookup, no list request', () => {
      userData$.next(user({ isSysAdmin: false, roleId: 3 }));
      expect(collect(service.canOpen$)).toEqual([false]);
      expect(accessibleTabs).not.toHaveBeenCalled();
      http.expectNone(URLS.SYSTEM);
    });

    // Regression: userData$ emits before the session token is in the cookie
    // the interceptor reads, so a lookup without its own token went out
    // unauthenticated (400 on a real backend) and the entry never appeared.
    it('sends the session token of the session in hand with the lookup', () => {
      userData$.next(
        user({ isSysAdmin: true, isRootAdmin: true, sessionToken: 'tok-1' })
      );
      collect(service.canOpen$);
      const req = http.expectOne(URLS.SYSTEM);
      expect(req.request.headers.get(SESSION_TOKEN_HEADER)).toBe('tok-1');
      req.flush(newBackend);
    });

    it('gives every subscriber the same answer from one lookup', () => {
      userData$.next(user({ isSysAdmin: true, isRootAdmin: true }));
      const nav = collect(service.canOpen$);
      http.expectOne(URLS.SYSTEM).flush(newBackend);

      // a page opened later (overview card, System Info link)
      const later = collect(service.canOpen$);
      http.expectNone(URLS.SYSTEM);
      expect(nav).toEqual([false, true]);
      expect(later).toEqual([true]);
    });

    it('keeps every subscriber on false after a failed lookup', () => {
      userData$.next(user({ isSysAdmin: true, isRootAdmin: true }));
      const nav = collect(service.canOpen$);
      http
        .expectOne(URLS.SYSTEM)
        .flush('no', { status: 500, statusText: 'Server Error' });

      const later = collect(service.canOpen$);
      http.expectNone(URLS.SYSTEM);
      expect(nav).toEqual([false]);
      expect(later).toEqual([false]);
    });

    it('drops back to false when the session ends', () => {
      userData$.next(user({ isSysAdmin: true, isRootAdmin: true }));
      const seen = collect(service.canOpen$);
      http.expectOne(URLS.SYSTEM).flush(newBackend);
      userData$.next(null);
      expect(seen).toEqual([false, true, false]);
    });
  });
});
