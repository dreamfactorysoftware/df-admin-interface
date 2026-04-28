import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { BASE_URL } from 'src/app/shared/constants/urls';

export type TimeRange = '24h' | '7d' | '30d' | 'all';

/**
 * Filter state for the Gateway dashboard. Each key is multi-valued; an
 * empty array means "no filter on this dimension." The same shape is sent
 * to the backend (one query param per key, repeated for multi-values).
 */
export interface UsageFilters {
  provider: string[];
  service_id: number[];
  model: string[];
  user_id: number[];
  role_id: number[];
  app_id: number[];
  resource: string[];
  status: string[];
}

/** Factory — NOT a const — because returning a singleton would let callers
 *  mutate the shared empty arrays. */
export function createEmptyFilters(): UsageFilters {
  return {
    provider: [],
    service_id: [],
    model: [],
    user_id: [],
    role_id: [],
    app_id: [],
    resource: [],
    status: [],
  };
}

export interface UsageResponse {
  period: string;
  since: string;
  total_requests: number;
  total_input_tokens: number;
  total_output_tokens: number;
  total_cost_usd: number;
  errors: number;
  avg_latency_ms: number;
  latency_p50_ms: number;
  latency_p95_ms: number;
  latency_p99_ms: number;
  by_service: GroupRowRaw[];
  by_user: GroupRowRaw[];
  by_role: GroupRowRaw[];
  by_app: GroupRowRaw[];
  by_provider: GroupRowRaw[];
  by_model: ModelRowRaw[];
  by_resource: ResourceRowRaw[];
  by_error_class: ErrorClassRowRaw[];
  series: SeriesRowRaw[];
  filters: Partial<Record<keyof UsageFilters, (string | number)[]>>;
  /** Per-service month-to-date spend vs configured budget. Calendar-month
   *  bound, NOT bound to the dashboard's period filter. */
  budgets: BudgetRowRaw[];
  /** Per-provider fallback rates from the backend's UsageRates::DEFAULT_RATES.
   *  Frontend reads from here so we don't have to maintain a duplicate
   *  hardcoded pricing table. */
  default_rates: Record<
    string,
    { input_per_1k: number; output_per_1k: number }
  >;
  /** Top-line totals for the immediately-preceding window of equal length.
   *  Only present when the request was made with compare=1. */
  previous?: PreviousSummaryRaw;
}

export interface BudgetRowRaw {
  service_id: number;
  monthly_budget_usd: number | string;
  spent_month_usd: number | string;
  projected_month_end_usd: number | string;
  days_into_month: number;
  days_in_month: number;
  on_track: boolean;
}

interface PreviousSummaryRaw {
  since: string;
  until: string | null;
  total_requests: number;
  total_input_tokens: number;
  total_output_tokens: number;
  total_cost_usd: number;
  errors: number;
  avg_latency_ms: number;
  latency_p50_ms: number;
  latency_p95_ms: number;
  latency_p99_ms: number;
}

interface ErrorClassRowRaw {
  class: string;
  count: number | string;
}

interface GroupRowRaw {
  service_id?: number;
  user_id?: number | null;
  role_id?: number | null;
  app_id?: number | null;
  provider?: string;
  requests: number | string;
  input_tokens: number | string;
  output_tokens: number | string;
  cost_usd?: number | string;
  avg_latency?: number | string;
  errors?: number | string;
}

interface ModelRowRaw {
  model: string;
  provider: string;
  requests: number | string;
  input_tokens: number | string;
  output_tokens: number | string;
  cost_usd?: number | string;
}

interface ResourceRowRaw {
  resource: string;
  requests: number | string;
}

interface SeriesRowRaw {
  date: string;
  requests: number | string;
  input_tokens: number | string;
  output_tokens: number | string;
  cost_usd?: number | string;
  errors: number | string;
}

interface ServiceLookupRow {
  id: number;
  name: string;
  label?: string;
  type: string;
}

interface RoleLookupRow {
  id: number;
  name: string;
}

interface UserLookupRow {
  id: number;
  name?: string;
  username?: string;
  email?: string;
}

interface AppLookupRow {
  id: number;
  name: string;
}

/** MCP audit-log aggregation. Distinct from ai_usage — MCP token cost is
 *  borne by the calling AI agent (Claude Desktop, Cursor, etc.), NOT by DF.
 *  The dashboard surfaces request volume / bytes / tool mix only. */
export interface McpUsageResponse {
  period: string;
  since: string;
  total_requests: number;
  total_bytes_in: number;
  total_bytes_out: number;
  errors: number;
  avg_duration_ms: number;
  by_service: McpGroupRowRaw[];
  by_user: McpGroupRowRaw[];
  by_role: McpGroupRowRaw[];
  by_app: McpGroupRowRaw[];
  by_client: McpClientRowRaw[];
  by_tool: McpToolRowRaw[];
  by_method: McpMethodRowRaw[];
  series: McpSeriesRowRaw[];
}

interface McpGroupRowRaw {
  service_id?: number;
  user_id?: number | null;
  role_id?: number | null;
  app_id?: number | null;
  requests: number | string;
  bytes_in: number | string;
  bytes_out: number | string;
}

interface McpClientRowRaw {
  client_id: string | null;
  client_name: string | null;
  requests: number | string;
  bytes_in: number | string;
  bytes_out: number | string;
}

interface McpToolRowRaw {
  tool_name: string;
  requests: number | string;
  bytes_in: number | string;
  bytes_out: number | string;
}

interface McpMethodRowRaw {
  method: string;
  requests: number | string;
}

interface McpSeriesRowRaw {
  date: string;
  requests: number | string;
  bytes_in: number | string;
  bytes_out: number | string;
  errors: number | string;
}

export interface UsageBundle {
  raw: UsageResponse;
  mcp: McpUsageResponse;
  services: Map<number, ServiceLookupRow>;
  users: Map<number, string>;
  roles: Map<number, string>;
  apps: Map<number, string>;
}

@Injectable({ providedIn: 'root' })
export class UsageService {
  private http = inject(HttpClient);

  loadAll(
    range: TimeRange,
    filters: UsageFilters = createEmptyFilters()
  ): Observable<UsageBundle> {
    const period = range === 'all' ? '3650d' : range;

    let params = new HttpParams().set('period', period).set('compare', '1');
    (Object.keys(filters) as (keyof UsageFilters)[]).forEach(key => {
      const values = filters[key] as (string | number)[];
      values.forEach(v => {
        params = params.append(key, String(v));
      });
    });

    return forkJoin({
      raw: this.http.get<UsageResponse>('/_internal/ai/usage', { params }).pipe(
        catchError(() =>
          of({
            period,
            since: new Date(Date.now() - 7 * 86400000).toISOString(),
            total_requests: 0,
            total_input_tokens: 0,
            total_output_tokens: 0,
            total_cost_usd: 0,
            errors: 0,
            avg_latency_ms: 0,
            latency_p50_ms: 0,
            latency_p95_ms: 0,
            latency_p99_ms: 0,
            by_service: [],
            by_user: [],
            by_role: [],
            by_app: [],
            by_provider: [],
            by_model: [],
            by_resource: [],
            by_error_class: [],
            series: [],
            filters: {},
            budgets: [],
            default_rates: {},
          } as UsageResponse)
        )
      ),
      mcp: this.http
        .get<McpUsageResponse>('/_internal/ai/mcp-usage', { params })
        .pipe(
          catchError(() =>
            of({
              period,
              since: new Date(Date.now() - 7 * 86400000).toISOString(),
              total_requests: 0,
              total_bytes_in: 0,
              total_bytes_out: 0,
              errors: 0,
              avg_duration_ms: 0,
              by_service: [],
              by_user: [],
              by_role: [],
              by_app: [],
              by_client: [],
              by_tool: [],
              by_method: [],
              series: [],
            } as McpUsageResponse)
          )
        ),
      services: this.listServices(),
      users: this.listUsers(),
      roles: this.listRoles(),
      apps: this.listApps(),
    }).pipe(map(b => b));
  }

  private listServices(): Observable<Map<number, ServiceLookupRow>> {
    return this.http
      .get<{ resource: ServiceLookupRow[] }>(`${BASE_URL}/system/service`, {
        params: {
          fields: 'id,name,label,type',
          filter:
            '(type = "ai_connection") or (type = "ai_chat") or (type = "mcp")',
        },
      })
      .pipe(
        map(res => {
          const m = new Map<number, ServiceLookupRow>();
          (res.resource ?? []).forEach(s => m.set(s.id, s));
          return m;
        }),
        catchError(() => of(new Map<number, ServiceLookupRow>()))
      );
  }

  private listUsers(): Observable<Map<number, string>> {
    // /api/v2/system/admin requires root-admin and is gated by df-compliance
    // (returns 500/403 for restricted admins). We only fetch /system/user
    // here — admin names not appearing in the dashboard is acceptable; the
    // by_user breakdown falls back to "user #N".
    return this.http
      .get<{ resource: UserLookupRow[] }>(`${BASE_URL}/system/user`, {
        params: { fields: 'id,name,username,email' },
      })
      .pipe(
        map(res => {
          const m = new Map<number, string>();
          (res.resource ?? []).forEach(u =>
            m.set(u.id, u.name || u.username || u.email || `user #${u.id}`)
          );
          return m;
        }),
        catchError(() => of(new Map<number, string>()))
      );
  }

  private listRoles(): Observable<Map<number, string>> {
    return this.http
      .get<{ resource: RoleLookupRow[] }>(`${BASE_URL}/system/role`, {
        params: { fields: 'id,name' },
      })
      .pipe(
        map(res => {
          const m = new Map<number, string>();
          (res.resource ?? []).forEach(r => m.set(r.id, r.name));
          return m;
        }),
        catchError(() => of(new Map<number, string>()))
      );
  }

  private listApps(): Observable<Map<number, string>> {
    return this.http
      .get<{ resource: AppLookupRow[] }>(`${BASE_URL}/system/app`, {
        params: { fields: 'id,name' },
      })
      .pipe(
        map(res => {
          const m = new Map<number, string>();
          (res.resource ?? []).forEach(a => m.set(a.id, a.name));
          return m;
        }),
        catchError(() => of(new Map<number, string>()))
      );
  }
}

/** Helpers used by the dashboard to render group rows. The backend may
 *  return numeric fields as strings (DB driver dependent) — coerce here. */
export function n(v: unknown): number {
  if (typeof v === 'number') {
    return v;
  }
  if (typeof v === 'string') {
    const x = Number(v);
    return Number.isFinite(x) ? x : 0;
  }
  return 0;
}
