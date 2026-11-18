import {
  HttpClientTestingModule,
  HttpTestingController,
  TestRequest,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BASE_URL } from 'src/app/shared/constants/urls';
import { DfArtifactResolverService } from './df-artifact-resolver.service';

const SERVICE_ID = 10;
const ROLE_URL = `${BASE_URL}/system/role`;
const APP_URL = `${BASE_URL}/system/app`;
const TABLE_URL = `${BASE_URL}/clinic/_table`;

// 250 roles that can GET every table of the service.
const roles = Array.from({ length: 250 }, (_, i) => ({
  id: i + 1,
  isActive: true,
  roleServiceAccessByRoleId: [
    { serviceId: SERVICE_ID, component: '_table/*', verbMask: 1 },
  ],
}));

const apps = [
  { name: 'admin', apiKey: 'k-admin', roleId: null, isActive: true },
  { name: 'r240', apiKey: 'k-240', roleId: 240, isActive: true },
  { name: 'r7-inactive', apiKey: 'k-7x', roleId: 7, isActive: false },
  { name: 'r7', apiKey: 'k-7', roleId: 7, isActive: true },
  { name: 'r1', apiKey: 'k-1', roleId: 1, isActive: true },
];

describe('DfArtifactResolverService', () => {
  let service: DfArtifactResolverService;
  let httpMock: HttpTestingController;
  const originalFetch = globalThis.fetch;

  // The resolver awaits each step, so its next request shows up a few
  // microtasks after the previous one is flushed.
  const nextRequests = async (url: string): Promise<TestRequest[]> => {
    for (let i = 0; i < 50; i++) {
      const reqs = httpMock.match(req => req.url.startsWith(url));
      if (reqs.length) {
        return reqs;
      }
      await new Promise(resolve => setTimeout(resolve));
    }
    return [];
  };

  // Answers like a server that returns at most `cap` records per request.
  const page = <T>(req: TestRequest, rows: T[], cap = rows.length) => {
    const offset = Number(req.request.params.get('offset') ?? 0);
    req.flush({
      resource: rows.slice(offset, offset + cap),
      meta: { count: rows.length },
    });
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(DfArtifactResolverService);
    httpMock = TestBed.inject(HttpTestingController);
    // Every key probe returns 200.
    globalThis.fetch = jest.fn().mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    httpMock.verify();
  });

  it('loads the apps of 250 roles with one request and keeps every key', async () => {
    const result = service.resolveWorkingKeyAndTable(SERVICE_ID, 'clinic');

    (await nextRequests(TABLE_URL))[0].flush({
      resource: [{ name: 'visits' }],
    });

    // The server caps responses at 200 records here; the rest must be paged
    // in, not dropped.
    const firstRoles = await nextRequests(ROLE_URL);
    expect(firstRoles.length).toBe(1);
    page(firstRoles[0], roles, 200);
    const secondRoles = await nextRequests(ROLE_URL);
    expect(secondRoles.length).toBe(1);
    expect(secondRoles[0].request.params.get('offset')).toBe('200');
    page(secondRoles[0], roles, 200);

    const appReqs = await nextRequests(APP_URL);
    expect(appReqs.length).toBe(1);
    expect(appReqs[0].request.params.has('filter')).toBe(false);
    page(appReqs[0], apps);

    const res = await result;
    expect(httpMock.match(req => req.url.startsWith(APP_URL)).length).toBe(0);
    expect(res.keys).toEqual([
      { label: 'r1', apiKey: 'k-1', verified: true },
      { label: 'r7', apiKey: 'k-7', verified: true },
      { label: 'r240', apiKey: 'k-240', verified: true },
    ]);
    expect(res.apiKey).toBe('k-1');
    expect(res.sampleTable).toBe('visits');
  });
});
