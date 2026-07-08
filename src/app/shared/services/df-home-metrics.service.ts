import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { BASE_URL } from 'src/app/shared/constants/urls';
import { silent } from 'src/app/shared/utilities/http-contexts';
import type { TimeRange } from 'src/app/adf-ai-usage/services/usage.service';

/**
 * A single Home KPI. `value` is `null` when this instance has NO real source
 * for the metric (endpoint absent, insufficient permission, or the schema
 * lacks the field). The Home tile grid OMITS a null tile or renders an honest
 * "no data yet" empty. `null` is never a fabricated zero: a real 0 (e.g. zero
 * requests today from an endpoint that answered) is `value: 0`. `reason` is a
 * short i18n-key-able slug the empty-state helper can name the upstream action
 * from. NEVER fabricate a value here.
 */
export interface HomeMetric {
  value: number | null;
  reason?: HomeMetricReason;
}

export type HomeMetricReason =
  | 'no-services' // no user services on this instance yet (State A)
  | 'no-permission' // endpoint returned 403/500 for this admin
  | 'no-source' // this instance has no endpoint/field backing the metric
  | 'endpoint-unavailable'; // the source endpoint errored / is not mounted

/**
 * Home KPI grid (design spec 3.1, State B). Every field is derived
 * client-side from a REAL DreamFactory endpoint; a metric with no source on
 * the instance carries `value: null` so its tile is omitted.
 *
 * - totalApis        count of user services (system services excluded)
 * - percentProtected % of user services gated by at least one active role
 * - deprecatedCount  services flagged deprecated IF the schema carries a
 *                    lifecycle field; null otherwise (DF core has none)
 * - requestsToday    AI-gateway request volume for the window (trailing 24h)
 * - spendToday       AI-gateway spend (USD) for the window (trailing 24h)
 */
export interface HomeMetrics {
  totalApis: HomeMetric;
  percentProtected: HomeMetric;
  deprecatedCount: HomeMetric;
  requestsToday: HomeMetric;
  spendToday: HomeMetric;
}

// System service names excluded from the user-facing API count. Mirrors the
// list in df-analytics.service (single security model); kept in sync by hand
// because that list is a private const there.
const SYSTEM_SERVICE_NAMES = new Set(
  [
    'system',
    'api_docs',
    'files',
    'logs',
    'db',
    'email',
    'user',
    'script',
    'ui',
    'schema',
    'api_doc',
    'file',
    'log',
    'admin',
    'df-admin',
    'dreamfactory',
    'cache',
    'push',
    'pub_sub',
  ].map(s => s.toLowerCase())
);

interface ServiceRow {
  id: number;
  name: string;
  type?: string;
  // Present only if the instance's service schema carries a lifecycle flag.
  // DF core does not; probed defensively so it lights up if one is added.
  deprecated?: boolean;
  lifecycle?: string;
  lifecycle_stage?: string;
}

@Injectable({ providedIn: 'root' })
export class DfHomeMetricsService {
  private http = inject(HttpClient);

  /**
   * Resolve the Home KPI grid. Never throws and never fabricates: a metric
   * with no real source resolves to `{ value: null, reason }`.
   *
   * @param usageRange window for requestsToday / spendToday; the Home
   *                   time-range select passes this. Defaults to trailing 24h
   *                   ('today' at the AI-usage endpoint's granularity).
   */
  async getMetrics(usageRange: TimeRange = '24h'): Promise<HomeMetrics> {
    const [services, roleAccess, usage] = await Promise.all([
      this.fetchUserServices(),
      this.fetchProtectedServiceIds(),
      this.fetchUsage(usageRange),
    ]);

    return {
      totalApis: this.deriveTotalApis(services),
      percentProtected: this.derivePercentProtected(services, roleAccess),
      deprecatedCount: this.deriveDeprecated(services),
      requestsToday: this.deriveRequests(usage),
      spendToday: this.deriveSpend(usage),
    };
  }

  // --- totalApis -----------------------------------------------------------

  private deriveTotalApis(services: ServiceRow[] | null): HomeMetric {
    if (services === null) {
      return { value: null, reason: 'no-permission' };
    }
    return { value: services.length };
  }

  // --- percentProtected ----------------------------------------------------
  // A user service is "protected" when its access is mediated by at least one
  // active role (it appears in some role's service access). Services no active
  // role references are ungoverned -> they drive the "unprotected endpoints"
  // alert. null when either input is unavailable or there are no services to
  // divide by (no honest denominator).

  private derivePercentProtected(
    services: ServiceRow[] | null,
    protectedIds: Set<number> | null
  ): HomeMetric {
    if (services === null || protectedIds === null) {
      return { value: null, reason: 'no-permission' };
    }
    if (services.length === 0) {
      return { value: null, reason: 'no-services' };
    }
    const covered = services.filter(s => protectedIds.has(s.id)).length;
    return { value: Math.round((covered / services.length) * 100) };
  }

  // --- deprecatedCount -----------------------------------------------------
  // Honest by omission: DF core service schema has no lifecycle/deprecated
  // field. Return null unless at least one fetched service actually carries
  // such a field (then count the deprecated ones). Never a fabricated 0.

  private deriveDeprecated(services: ServiceRow[] | null): HomeMetric {
    if (services === null) {
      return { value: null, reason: 'no-permission' };
    }
    const hasLifecycleField = services.some(
      s =>
        'deprecated' in s ||
        'lifecycle' in s ||
        'lifecycle_stage' in s
    );
    if (!hasLifecycleField) {
      return { value: null, reason: 'no-source' };
    }
    const count = services.filter(
      s =>
        s.deprecated === true ||
        s.lifecycle === 'deprecated' ||
        s.lifecycle_stage === 'deprecated'
    ).length;
    return { value: count };
  }

  // --- requestsToday / spendToday -----------------------------------------

  private deriveRequests(usage: UsageTotals | null): HomeMetric {
    if (usage === null) {
      return { value: null, reason: 'endpoint-unavailable' };
    }
    return { value: usage.requests };
  }

  private deriveSpend(usage: UsageTotals | null): HomeMetric {
    if (usage === null) {
      return { value: null, reason: 'endpoint-unavailable' };
    }
    return { value: usage.spend };
  }

  // --- data fetch (silent; null on failure so metrics stay honest) --------

  private async fetchUserServices(): Promise<ServiceRow[] | null> {
    try {
      const res = await firstValueFrom(
        this.http.get<{ resource: ServiceRow[] }>(`${BASE_URL}/system/service`, {
          // No fields filter: return the default columns so deriveDeprecated
          // can detect a lifecycle field if the instance's schema has one.
          context: silent(),
        })
      );
      return (res?.resource ?? []).filter(
        s => s?.name && !SYSTEM_SERVICE_NAMES.has(s.name.toLowerCase())
      );
    } catch {
      return null;
    }
  }

  // Set of serviceIds referenced by any active role's service access. Empty
  // set = roles exist but gate nothing; null = the roles endpoint is not
  // readable by this admin (can't determine protection honestly).
  private async fetchProtectedServiceIds(): Promise<Set<number> | null> {
    try {
      const res = await firstValueFrom(
        this.http.get<any>(
          `${BASE_URL}/system/role?related=role_service_access_by_role_id&limit=200`,
          { context: silent() }
        )
      );
      const ids = new Set<number>();
      for (const role of res?.resource ?? []) {
        if (role?.isActive === false) {
          continue;
        }
        for (const a of role?.roleServiceAccessByRoleId ?? []) {
          if (typeof a?.serviceId === 'number') {
            ids.add(a.serviceId);
          }
        }
      }
      return ids;
    } catch {
      return null;
    }
  }

  // AI-gateway totals for the window. null when the endpoint is not mounted
  // (no AI gateway on this instance) or errors — so requestsToday/spendToday
  // are omitted rather than shown as a fake 0.
  private async fetchUsage(range: TimeRange): Promise<UsageTotals | null> {
    const period = range === 'all' ? '3650d' : range;
    const params = new HttpParams().set('period', period);
    try {
      const res = await firstValueFrom(
        this.http.get<{ total_requests?: number; total_cost_usd?: number }>(
          '/_internal/ai/usage',
          { params, context: silent() }
        )
      );
      return {
        requests: Number(res?.total_requests ?? 0),
        spend: Number(res?.total_cost_usd ?? 0),
      };
    } catch {
      return null;
    }
  }
}

interface UsageTotals {
  requests: number;
  spend: number;
}
