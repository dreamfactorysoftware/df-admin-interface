import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
  TestRequest,
} from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { DfAiUsageComponent } from './df-ai-usage.component';

type Reply = { body: unknown } | { status: number };

const USAGE_URL = '/_internal/ai/usage';
const MCP_URL = '/_internal/ai/mcp-usage';

/**
 * A row exactly as df-ai's UsageAggregator returns it for the "Other"
 * bucket of series_by_user / series_by_app (captured from a running stack):
 * the Eloquent model is cast with `(array)`, so the row is the model's
 * internals and has no `date`, `bucket` or `cost_usd` of its own.
 */
const MALFORMED_OTHER_ROW = {
  '\u0000*\u0000connection': 'mysql',
  '\u0000*\u0000table': 'ai_usage_log',
  incrementing: true,
  exists: true,
  '\u0000*\u0000attributes': {
    date: '2026-11-03',
    requests: 143,
    input_tokens: '87334',
    output_tokens: '44961',
    cost_usd: '4.217400',
    bucket: '__other__',
  },
  timestamps: false,
};

const seriesRow = (date: string, bucket: string | number, cost: number) => ({
  date,
  bucket,
  requests: 10,
  input_tokens: 1000,
  output_tokens: 500,
  cost_usd: cost,
});

/** A populated week, with the malformed "Other" rows the backend emits. */
const POPULATED = {
  period: '7d',
  since: '2026-11-02T00:00:00+00:00',
  total_requests: 506,
  total_input_tokens: 291894,
  total_output_tokens: 140958,
  total_cost_usd: 13.73,
  errors: 17,
  partials: 0,
  avg_latency_ms: 14265,
  latency_p50_ms: 10378,
  latency_p95_ms: 34152,
  latency_p99_ms: 93012,
  by_service: [
    { service_id: 268, requests: 506, input_tokens: 291894, cost_usd: 13.73 },
  ],
  by_user: [
    { user_id: null, requests: 505 },
    { user_id: 1, requests: 1 },
  ],
  by_role: [{ role_id: 234, requests: 284 }],
  by_app: [{ app_id: 225, requests: 280 }],
  by_provider: [{ provider: 'openai_compatible', requests: 500 }],
  by_model: [
    {
      model: 'qwen3',
      provider: 'openai_compatible',
      requests: 500,
      input_tokens: 263747,
      output_tokens: 140958,
      cost_usd: 13.73,
      cost_per_1k_tokens: 0.0339,
    },
  ],
  by_resource: [{ resource: 'chat', requests: 22 }],
  by_error_class: [{ class: 'timeout', count: 17 }],
  series: [
    {
      date: '2026-11-03',
      requests: 143,
      input_tokens: 87334,
      output_tokens: 44961,
      cost_usd: 4.21,
      errors: '2',
    },
    {
      date: '2026-11-04',
      requests: 116,
      input_tokens: 60025,
      output_tokens: 38762,
      cost_usd: 3.52,
      errors: '0',
    },
  ],
  series_by_model: [
    seriesRow('2026-11-03', 'qwen3', 4.21),
    seriesRow('2026-11-04', 'qwen3', 3.52),
  ],
  series_by_provider: [
    seriesRow('2026-11-03', 'openai_compatible', 4.21),
    seriesRow('2026-11-04', 'openai_compatible', 3.52),
  ],
  series_by_user: [
    seriesRow('2026-11-06', 1, 0.00074),
    MALFORMED_OTHER_ROW,
    MALFORMED_OTHER_ROW,
  ],
  series_by_app: [
    seriesRow('2026-11-03', 225, 2.47),
    seriesRow('2026-11-04', 225, 1.15),
    MALFORMED_OTHER_ROW,
  ],
  most_expensive_calls: [
    {
      id: 3051,
      service_id: 268,
      user_id: null,
      role_id: 234,
      app_id: 225,
      provider: 'openai_compatible',
      model: 'qwen3',
      resource: 'openai_compat',
      input_tokens: 1129,
      output_tokens: 1437,
      cost_usd: 0.1088,
      latency_ms: 66155,
      status: 'success',
      created_at: '2026-11-04T09:45:19.000000Z',
    },
  ],
  filters: [],
  budgets: [],
  default_rates: {},
};

describe('DfAiUsageComponent data states', () => {
  let fixture: ComponentFixture<DfAiUsageComponent>;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        DfAiUsageComponent,
        HttpClientTestingModule,
        NoopAnimationsModule,
      ],
      providers: [provideRouter([])],
    });
    fixture = TestBed.createComponent(DfAiUsageComponent);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  const el = (): HTMLElement => fixture.nativeElement;
  const count = (selector: string) => el().querySelectorAll(selector).length;

  function answer(req: TestRequest, reply: Reply): void {
    if ('status' in reply) {
      req.flush(
        { error: { message: 'boom' } },
        {
          status: reply.status,
          statusText: 'Server Error',
        }
      );
    } else {
      req.flush(reply.body as object);
    }
  }

  /** First render, then answer the usage, MCP usage and lookup requests. */
  function load(usage: Reply, mcp: Reply = usage, lookups?: Reply): void {
    fixture.detectChanges();
    for (const req of http.match(r => r.url.startsWith('/api/v2/system/'))) {
      answer(req, lookups ?? { body: { resource: [] } });
    }
    answer(
      http.expectOne(r => r.url === USAGE_URL),
      usage
    );
    answer(
      http.expectOne(r => r.url === MCP_URL),
      mcp
    );
    fixture.detectChanges();
  }

  function expectEmptyState(): void {
    expect(count('.usage__loading')).toBe(0);
    expect(count('.usage__error')).toBe(0);
    expect(count('.usage__empty')).toBe(1);
    expect(el().textContent).toContain('No AI requests in this period');
    expect(count('df-cost-by-dimension')).toBe(0);
    expect(count('df-usage-stacked-area')).toBe(0);
    expect(el().textContent).not.toMatch(/NaN|undefined/);
  }

  it('shows the empty state when every request fails', () => {
    expect(() =>
      load({ status: 500 }, { status: 500 }, { status: 500 })
    ).not.toThrow();
    expectEmptyState();
  });

  // Regression: recomputeViews read r.by_provider[0] unguarded, so a
  // response without that list threw inside the subscriber and left the
  // page body blank (no data, no empty state, no error).
  it('shows the empty state for a response with no fields at all', () => {
    expect(() => load({ body: {} })).not.toThrow();
    expectEmptyState();
  });

  // Regression: the "Cost by user" chart threw "Cannot read properties of
  // undefined (reading 'slice')" on the undated Other rows. The throw came
  // out of change detection, so the panels below the chart never rendered.
  it('renders every panel when the series carry undated rows', () => {
    expect(() => load({ body: POPULATED })).not.toThrow();

    expect(count('.usage__empty')).toBe(0);
    const charts = el().querySelectorAll('df-cost-by-dimension');
    expect(charts).toHaveLength(4);
    // model, provider, user, app: each still draws its dated rows.
    charts.forEach(chart => {
      expect(chart.querySelectorAll('svg > path').length).toBeGreaterThan(0);
      expect(chart.querySelector('.cbd__empty')).toBeNull();
      expect(chart.textContent).not.toMatch(/NaN|undefined/);
    });
    // Panels after the chart that used to throw.
    expect(count('df-expensive-calls .exp__table tbody tr')).toBe(1);
    expect(count('df-usage-bars')).toBeGreaterThan(0);
    expect(count('df-cost-estimator')).toBe(1);
    expect(count('df-task-estimator')).toBe(1);
  });
});
