import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { BASE_URL } from 'src/app/shared/constants/urls';
import { silent } from 'src/app/shared/utilities/http-contexts';
import type { TimeRange } from 'src/app/adf-ai-usage/services/usage.service';
import {
  DfScopeService,
  GovernancePosture,
  ServiceScopePosture,
} from 'src/app/shared/services/df-scope.service';

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
  | 'no-reachable' // services exist but no active role reaches any (all locked)
  | 'endpoint-unavailable'; // the source endpoint errored / is not mounted

/**
 * Home KPI grid (design spec 3.1, State B). Every field is derived
 * client-side from a REAL DreamFactory endpoint; a metric with no source on
 * the instance carries `value: null` so its tile is omitted.
 *
 * - totalApis      count of user services (system services excluded)
 * - scopedAccess   of the REACHABLE user services (scoped + open), the % that
 *                  are SCOPED (constrained). The honest deny-by-default
 *                  governance KPI: high = reach is tightly scoped, low = broad
 *                  read/write exposure. null when nothing is reachable (all
 *                  locked) so it never fabricates a percentage.
 * - deprecatedCount services flagged deprecated IF the schema carries a
 *                  lifecycle field; null otherwise (DF core has none)
 * - requestsToday  AI-gateway request volume for the window (trailing 24h)
 * - spendToday     AI-gateway spend (USD) for the window (trailing 24h)
 * - openServices   the user services classified OPEN (whole-service write via
 *                  some active role) - drives the exposure alert strip. Empty
 *                  array = nothing exposed; never a fabricated entry.
 */
export interface HomeMetrics {
  totalApis: HomeMetric;
  scopedAccess: HomeMetric;
  deprecatedCount: HomeMetric;
  requestsToday: HomeMetric;
  spendToday: HomeMetric;
  openServices: ServiceScopePosture[];
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
  private scope = inject(DfScopeService);

  /**
   * Resolve the Home KPI grid. Never throws and never fabricates: a metric
   * with no real source resolves to `{ value: null, reason }`.
   *
   * @param usageRange window for requestsToday / spendToday; the Home
   *                   time-range select passes this. Defaults to trailing 24h
   *                   ('today' at the AI-usage endpoint's granularity).
   */
  async getMetrics(usageRange: TimeRange = '24h'): Promise<HomeMetrics> {
    const [services, governance, usage] = await Promise.all([
      this.fetchUserServices(),
      this.fetchGovernance(),
      this.fetchUsage(usageRange),
    ]);

    // Restrict the estate-wide posture to this instance's user services (system
    // services are excluded from every Home number for one consistent model).
    const userIds = services
      ? new Set(services.map(s => s.id))
      : new Set<number>();
    const userPostures =
      governance && services
        ? governance.services.filter(p => userIds.has(p.serviceId))
        : [];

    return {
      totalApis: this.deriveTotalApis(services),
      scopedAccess: this.deriveScopedAccess(services, governance, userPostures),
      deprecatedCount: this.deriveDeprecated(services),
      requestsToday: this.deriveRequests(usage),
      spendToday: this.deriveSpend(usage),
      openServices: userPostures.filter(p => p.posture === 'open'),
    };
  }

  // --- totalApis -----------------------------------------------------------

  private deriveTotalApis(services: ServiceRow[] | null): HomeMetric {
    if (services === null) {
      return { value: null, reason: 'no-permission' };
    }
    return { value: services.length };
  }

  // --- scopedAccess --------------------------------------------------------
  // DreamFactory is deny-by-default: a service is only reachable if an ACTIVE
  // role grants a key access to it. Of the REACHABLE user services (scoped +
  // open), this is the share that are SCOPED - constrained to a named component
  // or read-only. High = reach is tightly governed; low = broad read/write is
  // common. A service NO role references is LOCKED, not counted here (it is the
  // secure default, not a risk). null when nothing is reachable (all locked, or
  // no user services) so we never fabricate a percentage.

  private deriveScopedAccess(
    services: ServiceRow[] | null,
    governance: GovernancePosture | null,
    userPostures: ServiceScopePosture[]
  ): HomeMetric {
    if (services === null || governance === null) {
      return { value: null, reason: 'no-permission' };
    }
    if (services.length === 0) {
      return { value: null, reason: 'no-services' };
    }
    const scoped = userPostures.filter(p => p.posture === 'scoped').length;
    const open = userPostures.filter(p => p.posture === 'open').length;
    const reachable = scoped + open;
    if (reachable === 0) {
      return { value: null, reason: 'no-reachable' };
    }
    return { value: Math.round((scoped / reachable) * 100) };
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
      s => 'deprecated' in s || 'lifecycle' in s || 'lifecycle_stage' in s
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
        this.http.get<{ resource: ServiceRow[] }>(
          `${BASE_URL}/system/service`,
          {
            // No fields filter: return the default columns so deriveDeprecated
            // can detect a lifecycle field if the instance's schema has one.
            context: silent(),
          }
        )
      );
      return (res?.resource ?? []).filter(
        s => s?.name && !SYSTEM_SERVICE_NAMES.has(s.name.toLowerCase())
      );
    } catch {
      return null;
    }
  }

  // Estate-wide deny-by-default posture (locked/scoped/open) derived from the
  // ACTIVE role graph by DfScopeService - the single parser of component +
  // verbMask, reused here rather than re-fetching/re-parsing grants. null when
  // the role graph is unreadable, so the governance KPI + alert are suppressed
  // rather than guessing.
  private async fetchGovernance(): Promise<GovernancePosture | null> {
    try {
      return await firstValueFrom(this.scope.governancePosture());
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
