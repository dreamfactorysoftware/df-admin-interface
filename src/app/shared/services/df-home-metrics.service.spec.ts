import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { of } from 'rxjs';
import { caseInterceptor } from '../interceptors/case.interceptor';
import { DfHomeMetricsService, HomeMetrics } from './df-home-metrics.service';
import {
  DfScopeService,
  GovernancePosture,
  ServicePosture,
  ServiceScopePosture,
} from './df-scope.service';

// /system/service on a fresh 7.8 Gold install (none has a creator), plus a
// session-created service named after its own type.
const GOLD_FRESH_SERVICES = [
  { id: 1, name: 'api_builder', type: 'api_builder', created_by_id: null },
  { id: 2, name: 'agents', type: 'agents', created_by_id: null },
  { id: 3, name: 'system', type: 'system', created_by_id: null },
  { id: 5, name: 'files', type: 'local_file', created_by_id: null },
  { id: 7, name: 'db', type: 'sqlite', created_by_id: null },
  { id: 9, name: 'user', type: 'user', created_by_id: null },
];
const MYSQL = { id: 11, name: 'mysql', type: 'mysql', created_by_id: 1 };

function posture(
  serviceId: number,
  serviceName: string,
  p: ServicePosture
): ServiceScopePosture {
  return {
    serviceId,
    serviceName,
    serviceLabel: serviceName,
    posture: p,
    openRoles: p === 'open' ? ['qa'] : [],
    detailRoute: null,
  };
}

describe('DfHomeMetricsService', () => {
  let service: DfHomeMetricsService;
  let httpMock: HttpTestingController;
  let governance: GovernancePosture;

  beforeEach(() => {
    governance = {
      services: [posture(2, 'agents', 'open'), posture(11, 'mysql', 'open')],
      lockedCount: 0,
      scopedCount: 0,
      openCount: 2,
      reachableCount: 2,
    };
    // Wired as in main.ts: caseInterceptor camelCases every /api JSON
    // response, so service rows arrive with createdById.
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([caseInterceptor])),
        provideHttpClientTesting(),
        {
          provide: DfScopeService,
          useValue: { governancePosture: () => of(governance) },
        },
      ],
    });
    service = TestBed.inject(DfHomeMetricsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  async function load(services: unknown[]): Promise<HomeMetrics> {
    const metrics = service.getMetrics();
    httpMock
      .expectOne('/api/v2/system/service')
      .flush(
        { resource: services },
        { headers: { 'Content-Type': 'application/json' } }
      );
    httpMock
      .expectOne(r => r.url === '/_internal/ai/usage')
      .flush({ total_requests: 0, total_cost_usd: 0 });
    return metrics;
  }

  it('counts no APIs on a fresh Gold install', async () => {
    const metrics = await load(GOLD_FRESH_SERVICES);
    expect(metrics.totalApis.value).toBe(0);
    expect(metrics.openServices).toEqual([]);
  });

  it('counts a session-created service named after its type', async () => {
    const metrics = await load([...GOLD_FRESH_SERVICES, MYSQL]);
    expect(metrics.totalApis.value).toBe(1);
    expect(metrics.openServices.map(p => p.serviceName)).toEqual(['mysql']);
  });
});
