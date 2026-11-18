import {
  HttpClientTestingModule,
  HttpTestingController,
  TestRequest,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { URLS } from 'src/app/shared/constants/urls';
import { ApiKeyInfo } from 'src/app/shared/types/api-keys';
import { ApiKeysService } from './api-keys.service';

const SERVICE_ID = 10;
const OTHER_SERVICE_ID = 20;

// 300 roles: every third one is scoped to another service, the last one has
// no access rows at all. The other 200 can reach SERVICE_ID.
const roles = Array.from({ length: 300 }, (_, i) => {
  const id = i + 1;
  return {
    id,
    name: `role-${id}`,
    roleServiceAccessByRoleId:
      id === 300
        ? undefined
        : [{ serviceId: id % 3 === 0 ? OTHER_SERVICE_ID : SERVICE_ID }],
  };
});

// In app id order, which differs from role order on purpose.
const apps = [
  { name: 'admin', apiKey: 'k-admin', roleId: null },
  { name: 'r250-a', apiKey: 'k-250a', roleId: 250 },
  { name: 'r2-a', apiKey: 'k-2a', roleId: 2 },
  { name: 'r3-other-service', apiKey: 'k-3', roleId: 3 },
  { name: 'r250-b', apiKey: 'k-250b', roleId: 250 },
  { name: 'r2-no-key', apiKey: '', roleId: 2 },
  { name: 'r1-a', apiKey: 'k-1a', roleId: 1 },
  { name: 'r-unknown', apiKey: 'k-unknown', roleId: 999 },
];

// Grouped by role in role order, then app order within a role: the order the
// per-role requests produced.
const expectedKeys: ApiKeyInfo[] = [
  { name: 'r1-a', apiKey: 'k-1a' },
  { name: 'r2-a', apiKey: 'k-2a' },
  { name: 'r250-a', apiKey: 'k-250a' },
  { name: 'r250-b', apiKey: 'k-250b' },
];

describe('ApiKeysService', () => {
  let service: ApiKeysService;
  let httpMock: HttpTestingController;

  const roleRequests = () =>
    httpMock.match(req => req.url.startsWith(URLS.ROLES));
  const appRequests = () => httpMock.match(req => req.url.startsWith(URLS.APP));

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
      providers: [ApiKeysService],
    });
    service = TestBed.inject(ApiKeysService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads the apps of 200 relevant roles with one request', () => {
    let keys: ApiKeyInfo[] | undefined;
    service.getApiKeysForService(SERVICE_ID).subscribe(k => (keys = k));

    const roleReqs = roleRequests();
    expect(roleReqs.length).toBe(1);
    page(roleReqs[0], roles);

    const appReqs = appRequests();
    expect(appReqs.length).toBe(1);
    expect(appReqs[0].request.params.has('filter')).toBe(false);
    expect(appReqs[0].request.params.get('fields')).toBe(
      'name,api_key,role_id'
    );
    page(appReqs[0], apps);

    expect(keys).toEqual(expectedKeys);
  });

  it('pages past the server record cap without dropping keys', () => {
    let keys: ApiKeyInfo[] | undefined;
    service.getApiKeysForService(SERVICE_ID).subscribe(k => (keys = k));

    // Roles: 300 at 120 per request is 3 pages.
    for (let i = 0; i < 3; i++) {
      const reqs = roleRequests();
      expect(reqs.length).toBe(1);
      page(reqs[0], roles, 120);
    }
    expect(roleRequests().length).toBe(0);

    // Apps: 8 at 3 per request is 3 pages, however many roles there are.
    const offsets: (string | null)[] = [];
    for (let i = 0; i < 3; i++) {
      const reqs = appRequests();
      expect(reqs.length).toBe(1);
      offsets.push(reqs[0].request.params.get('offset'));
      page(reqs[0], apps, 3);
    }
    expect(appRequests().length).toBe(0);
    expect(offsets).toEqual([null, '3', '6']);

    expect(keys).toEqual(expectedKeys);
  });

  it('serves a second call for the same service from the cache', () => {
    service.getApiKeysForService(SERVICE_ID).subscribe();
    page(roleRequests()[0], roles);
    page(appRequests()[0], apps);

    let keys: ApiKeyInfo[] | undefined;
    service.getApiKeysForService(SERVICE_ID).subscribe(k => (keys = k));

    expect(roleRequests().length).toBe(0);
    expect(appRequests().length).toBe(0);
    expect(keys).toEqual(expectedKeys);
  });

  it('skips the app request when no role can reach the service', () => {
    let keys: ApiKeyInfo[] | undefined;
    service.getApiKeysForService(999).subscribe(k => (keys = k));

    page(roleRequests()[0], roles);

    expect(appRequests().length).toBe(0);
    expect(keys).toEqual([]);
  });
});
