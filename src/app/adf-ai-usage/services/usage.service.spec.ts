import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
  TestRequest,
} from '@angular/common/http/testing';
import { UsageBundle, UsageService } from './usage.service';

const USAGE_URL = '/_internal/ai/usage';
const MCP_URL = '/_internal/ai/mcp-usage';

/**
 * loadAll() feeds the usage dashboard, the agents request log, app details
 * and the API key list, all of which read bundle.raw / bundle.mcp directly.
 */
describe('UsageService.loadAll response bodies', () => {
  let service: UsageService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(UsageService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  /** Load one bundle, answering both usage endpoints with `reply`. */
  function load(reply: (req: TestRequest) => void): UsageBundle {
    const bundles: UsageBundle[] = [];
    service.loadAll('7d').subscribe(b => bundles.push(b));
    for (const req of http.match(r => r.url.startsWith('/api/v2/system/'))) {
      req.flush({ resource: [] });
    }
    reply(http.expectOne(r => r.url === USAGE_URL));
    reply(http.expectOne(r => r.url === MCP_URL));
    expect(bundles).toHaveLength(1);
    return bundles[0];
  }

  const failed = (req: TestRequest) =>
    req.flush(null, { status: 500, statusText: 'Server Error' });

  /** The zeroed fallback, minus `since` (derived from the clock). */
  const zeroed = (shape: object) => ({ ...shape, since: expect.any(String) });

  // Angular's XHR backend parses a 200 with body '' or 'null' to null; the
  // others are 200s that still carry no usage object.
  it.each([
    ["'' or 'null' (parsed to null)", null],
    ['an unparsed empty string', ''],
    ['an empty JSON array', []],
    ['a bare number', 0],
  ])('zeroes a 200 whose body is %s', (_label, body) => {
    const fallback = load(failed);
    const bundle = load(req => req.flush(body as object));

    expect(bundle.raw).toEqual(zeroed(fallback.raw));
    expect(bundle.mcp).toEqual(zeroed(fallback.mcp));
    expect(bundle.raw).toEqual(
      expect.objectContaining({
        period: '7d',
        total_requests: 0,
        by_app: [],
        most_expensive_calls: [],
      })
    );
    expect(bundle.mcp).toEqual(
      expect.objectContaining({ period: '7d', total_requests: 0 })
    );
  });

  it('passes object bodies through untouched, missing fields included', () => {
    const raw = { total_requests: 4, by_app: [{ app_id: 7, requests: 4 }] };
    const mcp = {};
    const bundle = load(req =>
      req.flush(req.request.url === USAGE_URL ? raw : mcp)
    );

    expect(bundle.raw).toEqual(raw);
    expect(bundle.mcp).toEqual(mcp);
  });
});
