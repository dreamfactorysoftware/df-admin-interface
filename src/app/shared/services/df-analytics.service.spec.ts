import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { caseInterceptor } from '../interceptors/case.interceptor';
import { DashboardStats, DfAnalyticsService } from './df-analytics.service';

// /system/service on a fresh 7.8 Gold install: the seeded services plus the
// api_builder and agents management services package migrations create. None
// has a creator.
const GOLD_FRESH_SERVICES = [
  { id: 1, name: 'api_builder', type: 'api_builder', created_by_id: null },
  { id: 2, name: 'agents', type: 'agents', created_by_id: null },
  { id: 3, name: 'system', type: 'system', created_by_id: null },
  { id: 4, name: 'api_docs', type: 'swagger', created_by_id: null },
  { id: 5, name: 'files', type: 'local_file', created_by_id: null },
  { id: 6, name: 'logs', type: 'local_file', created_by_id: null },
  { id: 7, name: 'db', type: 'sqlite', created_by_id: null },
  { id: 8, name: 'email', type: 'local_email', created_by_id: null },
  { id: 9, name: 'user', type: 'user', created_by_id: null },
];
const FIRST_USER_SERVICE = {
  id: 10,
  name: 'clinic',
  type: 'pgsql',
  created_by_id: 1,
};

describe('DfAnalyticsService', () => {
  let service: DfAnalyticsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    // Wired as in main.ts: caseInterceptor camelCases every /api JSON
    // response, so the service sees createdById, never created_by_id.
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([caseInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(DfAnalyticsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  const json = { headers: { 'Content-Type': 'application/json' } };

  function respond(services: unknown[]): void {
    httpMock
      .expectOne(r => r.url.startsWith('/api/v2/system/service?'))
      .flush({ resource: services }, json);
    httpMock
      .expectOne(r => r.url.startsWith('/api/v2/system/role?'))
      .flush({ resource: [] }, json);
    httpMock
      .expectOne(r => r.url.startsWith('/api/v2/system/app?'))
      .flush({ resource: [] }, json);
  }

  function load(services: unknown[]): DashboardStats | undefined {
    let stats: DashboardStats | undefined;
    service.getDashboardStats().subscribe(s => (stats = s));
    respond(services);
    return stats;
  }

  it('requests created_by_id with the service list', () => {
    service.getDashboardStats().subscribe();
    const req = httpMock.expectOne(r =>
      r.url.startsWith('/api/v2/system/service?')
    );
    expect(req.request.url).toContain('fields=id,name,type,created_by_id');
    req.flush({ resource: [] }, json);
    httpMock.match(() => true).forEach(r => r.flush({ resource: [] }, json));
  });

  it('counts zero services on a fresh Gold install (first-time user)', () => {
    expect(load(GOLD_FRESH_SERVICES)?.services.total).toBe(0);
  });

  it('counts the first service the user creates', () => {
    expect(
      load([...GOLD_FRESH_SERVICES, FIRST_USER_SERVICE])?.services.total
    ).toBe(1);
  });

  it('counts a session-created service named after its type or a seeded name', () => {
    // created_by_id reaches the service as createdById (caseInterceptor);
    // a creator must still win over the name rules.
    const mysql = { id: 11, name: 'mysql', type: 'mysql', created_by_id: 1 };
    const cache = { id: 12, name: 'cache', type: 'redis', created_by_id: 1 };
    expect(load([...GOLD_FRESH_SERVICES, mysql])?.services.total).toBe(1);

    service.clearCache();
    expect(load([...GOLD_FRESH_SERVICES, mysql, cache])?.services.total).toBe(
      2
    );
  });

  it('fetches again once the cache expires instead of replaying the first count', () => {
    expect(load(GOLD_FRESH_SERVICES)?.services.total).toBe(0);

    localStorage.removeItem('df_dashboard_stats'); // 30s cache expired

    expect(
      load([...GOLD_FRESH_SERVICES, FIRST_USER_SERVICE])?.services.total
    ).toBe(1);
  });

  it('refetches after clearCache() even within the 30s cache window', () => {
    expect(load(GOLD_FRESH_SERVICES)?.services.total).toBe(0);

    service.clearCache(); // the user just created a service

    expect(
      load([...GOLD_FRESH_SERVICES, FIRST_USER_SERVICE])?.services.total
    ).toBe(1);
  });
});
