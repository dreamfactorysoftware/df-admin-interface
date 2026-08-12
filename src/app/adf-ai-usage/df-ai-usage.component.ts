import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faArrowsRotate,
  faChartLine,
  faCircleInfo,
  faMessage,
  faTriangleExclamation,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { finalize } from 'rxjs/operators';
import { normalizeError } from 'src/app/shared/utilities/app-error';
import {
  DimensionSeriesRowRaw,
  ExpensiveCallRowRaw,
  TimeRange,
  UsageBundle,
  UsageFilters,
  UsageService,
  createEmptyFilters,
  n,
} from './services/usage.service';
import {
  GroupRow,
  ProviderRates,
  TimeBucket,
  UsageSummary,
} from './types/usage';
import { formatUSD, ratesFromBundle } from './utils/cost';
import { DfUsageStackedAreaComponent } from './components/df-usage-stacked-area/df-usage-stacked-area.component';
import { DfUsageBarsComponent } from './components/df-usage-bars/df-usage-bars.component';
import { DfUsageSummaryComponent } from './components/df-usage-summary/df-usage-summary.component';
import { DfCostEstimatorComponent } from './components/df-cost-estimator/df-cost-estimator.component';
import { DfTaskEstimatorComponent } from './components/df-task-estimator/df-task-estimator.component';
import {
  DfCostByDimensionComponent,
  DimensionSeriesPoint,
} from './components/df-cost-by-dimension/df-cost-by-dimension.component';
import {
  DfExpensiveCallsComponent,
  ExpensiveCallRow,
} from './components/df-expensive-calls/df-expensive-calls.component';
import {
  DfSpendBreakdownComponent,
  SpendSlice,
} from './components/df-spend-breakdown/df-spend-breakdown.component';

interface ActiveFilterChip {
  dimension: keyof UsageFilters;
  value: string | number;
  label: string;
}

/** The primary lens applied across every chart. Each maps to a real filter
 *  dimension the backend already aggregates by; picking a member narrows the
 *  whole dashboard through that identity. There is no `tag` scope because
 *  ai_usage_log has no tag column — inventing one would fabricate data. */
export type ScopeDim = 'none' | 'tenant' | 'role' | 'key';

/** Budget health, derived from spend-vs-cap ratios, driving the token color
 *  of the meter (ok = success, warning >= 0.8 or projected over, danger =
 *  already over cap). */
export type BudgetStatus = 'ok' | 'warning' | 'danger';

/** Budget row enriched with the resolved service label + computed ratios for
 *  cleaner template binding. */
export interface BudgetRow {
  serviceId: number;
  serviceLabel: string;
  budgetUsd: number;
  spentMonthUsd: number;
  projectedMonthEndUsd: number;
  spentRatio: number; // 0..1+ (>1 means already over)
  projectedRatio: number; // 0..1+ (>1 means projected to exceed)
  onTrack: boolean;
  daysIntoMonth: number;
  daysInMonth: number;
  status: BudgetStatus;
}

@Component({
  selector: 'df-ai-usage',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTooltipModule,
    FontAwesomeModule,
    DfUsageStackedAreaComponent,
    DfUsageBarsComponent,
    DfUsageSummaryComponent,
    DfCostEstimatorComponent,
    DfTaskEstimatorComponent,
    DfCostByDimensionComponent,
    DfExpensiveCallsComponent,
    DfSpendBreakdownComponent,
  ],
  templateUrl: './df-ai-usage.component.html',
  styleUrls: ['./df-ai-usage.component.scss'],
})
export class DfAiUsageComponent implements OnInit {
  private api = inject(UsageService);
  private router = inject(Router);

  loading = true;
  errorMessage: string | null = null;
  bundle: UsageBundle | null = null;
  range: TimeRange = '7d';

  // ─── Scope lens (tenant / role / key) ─────────────────────────────────
  // A single, promoted lens over the whole dashboard. Selecting a member
  // writes a single-value filter into `filters` on the mapped dimension, so
  // the backend re-aggregates and EVERY chart re-slices. It is the same
  // mechanism as the detailed Filters card, surfaced as one prominent
  // control. `tenant` = AI Connection (the budget/billing boundary),
  // `role` = RBAC role, `key` = App / API key.
  scopeDim: ScopeDim = 'none';
  scopeValue: number | null = null;
  private readonly scopeFilterKey: Record<
    Exclude<ScopeDim, 'none'>,
    keyof UsageFilters
  > = {
    tenant: 'service_id',
    role: 'role_id',
    key: 'app_id',
  };

  // Filter state. Mutated in place via toggleFilter / removeChip; refresh()
  // is called once after each mutation. Sent as-is to the backend.
  filters: UsageFilters = createEmptyFilters();

  // Derived views are cached here on each refresh. The template binds to these
  // as stable references, NOT recomputed on every change-detection tick —
  // otherwise every CD pass hands child components new array/Map refs and
  // forces ngOnChanges → rebuild loops that pin a CPU core.
  summary: UsageSummary = this.emptySummary();
  series: TimeBucket[] = [];
  byUser: GroupRow[] = [];
  byRole: GroupRow[] = [];
  byService: GroupRow[] = [];
  byApp: GroupRow[] = [];
  byProvider: GroupRow[] = [];
  byResource: GroupRow[] = [];
  byModel: GroupRow[] = [];
  byErrorClass: GroupRow[] = [];
  budgets: BudgetRow[] = [];
  visibleBudgets: BudgetRow[] = []; // budgets narrowed to the active scope
  budgetWarnings: BudgetRow[] = []; // those projected to exceed budget
  activeChips: ActiveFilterChip[] = [];

  // ─── New analytics views (the "where is my money going" surfaces) ─────
  // Multi-dim cost-over-time series, one DimensionSeriesPoint array per
  // dimension. Top N by cost + Other bucket, mapped to display labels here
  // so the chart component stays generic.
  costByModelSeries: DimensionSeriesPoint[] = [];
  costByUserSeries: DimensionSeriesPoint[] = [];
  costByAppSeries: DimensionSeriesPoint[] = [];
  costByProviderSeries: DimensionSeriesPoint[] = [];
  /** Top N most expensive single calls in the window. */
  expensiveCalls: ExpensiveCallRow[] = [];

  // ─── Categorical spend breakdowns (share of the bill) ─────────────────
  // "By model" is real (by_model carries cost_usd). "By tag" has NO backing:
  // ai_usage_log has no tag column and the aggregator exposes no tag
  // dimension, so per the data rule that breakdown is omitted, never faked.
  spendByModel: SpendSlice[] = [];
  /** True only when at least one model actually cost money — gates whether
   *  the by-model breakdown panel renders at all (omit, not empty). */
  hasModelSpend = false;

  // MCP-side views — distinct from the AI panels because MCP is INBOUND
  // traffic from external AI agents (Claude Desktop, Cursor). Token cost is
  // borne by the calling client, NOT by DreamFactory.
  mcpTotalRequests = 0;
  mcpBytesIn = 0;
  mcpBytesOut = 0;
  mcpAvgDurationMs = 0;
  mcpByClient: GroupRow[] = [];
  mcpByTool: GroupRow[] = [];
  mcpByUser: GroupRow[] = [];
  mcpByService: GroupRow[] = [];
  mcpByApp: GroupRow[] = [];
  mcpByMethod: GroupRow[] = [];

  // Filter dropdown option lists, populated from the bundle.
  providerOptions: string[] = [];
  modelOptions: string[] = [];
  serviceOptions: { id: number; label: string }[] = [];
  userOptions: { id: number; label: string }[] = [];
  roleOptions: { id: number; label: string }[] = [];
  appOptions: { id: number; label: string }[] = [];
  resourceOptions: string[] = [];
  readonly statusOptions: string[] = ['success', 'error'];

  connectionProviders: Map<number, string> = new Map();
  costInputSessions: ReturnType<DfAiUsageComponent['buildCostInputSessions']> =
    [];
  defaultRates: Record<string, ProviderRates> = {};

  faArrowsRotate = faArrowsRotate;
  faChartLine = faChartLine;
  faCircleInfo = faCircleInfo;
  faMessage = faMessage;
  faTriangleExclamation = faTriangleExclamation;
  faXmark = faXmark;

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.loading = true;
    this.errorMessage = null;
    this.api
      .loadAll(this.range, this.filters)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: bundle => {
          this.bundle = bundle;
          this.recomputeViews();
        },
        error: err => {
          // This dashboard renders plain English strings; keep the fallback
          // when normalizeError yields an errors.* i18n key.
          const message = normalizeError(err).message;
          this.errorMessage = message.startsWith('errors.')
            ? 'Failed to load usage.'
            : message;
        },
      });
  }

  setRange(range: TimeRange): void {
    this.range = range;
    this.refresh();
  }

  /** Switch the primary lens. Clears the previously-scoped dimension's
   *  filter, then waits for a member to be picked before re-querying. */
  setScopeDim(dim: ScopeDim): void {
    if (dim === this.scopeDim) return;
    const hadFilter = this.clearScopeFilter();
    this.scopeDim = dim;
    this.scopeValue = null;
    // Only re-query if clearing the old scope actually changed the filter
    // set; picking the new dimension alone doesn't narrow anything yet.
    if (hadFilter) {
      this.refresh();
    }
  }

  /** Pick a specific member within the active scope. Writes a single-value
   *  filter on the mapped dimension so every chart re-slices. */
  onScopeValueChange(value: number | null): void {
    this.scopeValue = value;
    if (this.scopeDim === 'none') return;
    const key = this.scopeFilterKey[this.scopeDim];
    this.filters = { ...this.filters, [key]: value == null ? [] : [value] };
    this.refresh();
  }

  /** Options for the scope member picker, drawn from the same lookups the
   *  detailed filters use. */
  scopeMemberOptions(): { id: number; label: string }[] {
    switch (this.scopeDim) {
      case 'tenant':
        return this.serviceOptions;
      case 'role':
        return this.roleOptions;
      case 'key':
        return this.appOptions;
      default:
        return [];
    }
  }

  scopeMemberLabel(): string {
    switch (this.scopeDim) {
      case 'tenant':
        return 'Connection';
      case 'role':
        return 'Role';
      case 'key':
        return 'API key';
      default:
        return '';
    }
  }

  /** Keep the scope member picker in sync with the underlying filter, so
   *  clearing the matching chip in the Filters card also resets the lens. */
  private syncScopeValue(): void {
    if (this.scopeDim === 'none') {
      this.scopeValue = null;
      return;
    }
    const list = this.filters[this.scopeFilterKey[this.scopeDim]] as number[];
    this.scopeValue = list.length === 1 ? list[0] : null;
  }

  /** Clear the filter bound to the current scope dimension. Returns whether
   *  anything was actually removed. */
  private clearScopeFilter(): boolean {
    if (this.scopeDim === 'none') return false;
    const key = this.scopeFilterKey[this.scopeDim];
    if ((this.filters[key] as Array<string | number>).length > 0) {
      this.filters = { ...this.filters, [key]: [] };
      return true;
    }
    return false;
  }

  jumpToService(row: GroupRow): void {
    this.router.navigate(['/ai/connections', row.key]);
  }

  /** Drill-down: clicking a bars row toggles the corresponding filter. */
  drillByProvider(row: GroupRow): void {
    this.toggleFilter('provider', row.key);
  }
  drillByUser(row: GroupRow): void {
    const id = Number(row.key);
    if (Number.isFinite(id) && id > 0) this.toggleFilter('user_id', id);
  }
  drillByRole(row: GroupRow): void {
    const id = Number(row.key);
    if (Number.isFinite(id) && id > 0) this.toggleFilter('role_id', id);
  }
  drillByApp(row: GroupRow): void {
    const id = Number(row.key);
    if (Number.isFinite(id) && id > 0) this.toggleFilter('app_id', id);
  }
  drillByService(row: GroupRow): void {
    const id = Number(row.key);
    if (Number.isFinite(id) && id > 0) this.toggleFilter('service_id', id);
  }

  /** Toggle a single (dimension, value) pair on the active filter set. */
  toggleFilter(dimension: keyof UsageFilters, value: string | number): void {
    const list = this.filters[dimension] as Array<string | number>;
    const idx = list.indexOf(value);
    if (idx >= 0) {
      list.splice(idx, 1);
    } else {
      list.push(value);
    }
    this.refresh();
  }

  removeChip(chip: ActiveFilterChip): void {
    this.toggleFilter(chip.dimension, chip.value);
  }

  clearFilters(): void {
    this.filters = createEmptyFilters();
    this.scopeDim = 'none';
    this.scopeValue = null;
    this.refresh();
  }

  hasActiveFilters(): boolean {
    return this.activeChips.length > 0;
  }

  /** ngModel hook for each select; mutates filters and refreshes. */
  onSelectChange<K extends keyof UsageFilters>(
    key: K,
    next: UsageFilters[K]
  ): void {
    this.filters = { ...this.filters, [key]: next };
    this.refresh();
  }

  private recomputeViews(): void {
    const r = this.bundle?.raw;
    if (!r) {
      this.summary = this.emptySummary();
      this.series = [];
      this.byUser = [];
      this.byRole = [];
      this.byService = [];
      this.byApp = [];
      this.byProvider = [];
      this.byResource = [];
      this.byModel = [];
      this.byErrorClass = [];
      this.budgets = [];
      this.visibleBudgets = [];
      this.budgetWarnings = [];
      this.connectionProviders = new Map();
      this.costInputSessions = [];
      this.activeChips = [];
      this.costByModelSeries = [];
      this.costByUserSeries = [];
      this.costByAppSeries = [];
      this.costByProviderSeries = [];
      this.expensiveCalls = [];
      this.spendByModel = [];
      this.hasModelSpend = false;
      return;
    }

    const totalTokens = r.total_input_tokens + r.total_output_tokens;
    const sparklines = this.buildSparklines(r);
    const deltas = this.buildDeltas(r);
    this.summary = {
      sessionCount: r.total_requests,
      inputTokens: r.total_input_tokens,
      outputTokens: r.total_output_tokens,
      totalTokens,
      toolCalls: 0,
      avgTokensPerSession: r.total_requests
        ? Math.round(totalTokens / r.total_requests)
        : 0,
      avgToolCallsPerSession: 0,
      errors: r.errors,
      partials: r.partials ?? 0,
      avgLatencyMs: r.avg_latency_ms,
      latencyP50Ms: r.latency_p50_ms,
      latencyP95Ms: r.latency_p95_ms,
      latencyP99Ms: r.latency_p99_ms,
      totalCostUsd: r.total_cost_usd,
      deltas,
      sparklines,
    };

    this.series = (r.series ?? []).map(b => ({
      date: b.date,
      inputTokens: n(b.input_tokens),
      outputTokens: n(b.output_tokens),
      toolCalls: 0,
      sessions: n(b.requests),
      costUsd: n(b.cost_usd),
    }));

    this.byUser = (r.by_user ?? []).map(row => {
      const id = row.user_id ?? 0;
      const label = id
        ? (this.bundle?.users.get(id) ?? `user #${id}`)
        : 'anonymous';
      return this.toRow(String(id), label, row);
    });

    this.byRole = (r.by_role ?? []).map(row => {
      const id = row.role_id ?? 0;
      const label = id
        ? (this.bundle?.roles.get(id) ?? `role #${id}`)
        : '(no role)';
      return this.toRow(String(id), label, row);
    });

    this.byService = (r.by_service ?? []).map(row => {
      const id = row.service_id ?? 0;
      const svc = this.bundle?.services.get(id);
      const label = svc?.label || svc?.name || `service #${id}`;
      return this.toRow(String(id), label, row);
    });

    this.byApp = (r.by_app ?? []).map(row => {
      const id = row.app_id ?? 0;
      const label = id
        ? (this.bundle?.apps.get(id) ?? `app #${id}`)
        : '(no app)';
      return this.toRow(String(id), label, row);
    });

    this.byProvider = (r.by_provider ?? []).map(row =>
      this.toRow(row.provider ?? 'unknown', row.provider ?? 'unknown', row)
    );

    this.byModel = (r.by_model ?? []).map(row => {
      const base = this.toRow(row.model, `${row.model} (${row.provider})`, row);
      base.costPer1kTokens = n(row.cost_per_1k_tokens);
      return base;
    });

    // Categorical "share of spend by model" — same real by_model rows, cast
    // to the breakdown's shape. Zero-cost members are dropped inside the
    // component; if nothing is priced the whole panel is omitted upstream.
    this.spendByModel = this.byModel.map(row => ({
      key: row.key,
      label: row.label,
      costUsd: row.costUsd,
    }));
    this.hasModelSpend = this.spendByModel.some(s => s.costUsd > 0);

    // Multi-dim cost-over-time series. Each one is mapped to display
    // labels HERE so the chart component stays generic / reusable.
    this.costByModelSeries = this.toDimensionSeries(r.series_by_model, bucket =>
      String(bucket)
    );
    this.costByProviderSeries = this.toDimensionSeries(
      r.series_by_provider,
      bucket => String(bucket)
    );
    this.costByUserSeries = this.toDimensionSeries(r.series_by_user, bucket => {
      const id = Number(bucket);
      if (!Number.isFinite(id) || id <= 0) return String(bucket);
      return this.bundle?.users.get(id) ?? `user #${id}`;
    });
    this.costByAppSeries = this.toDimensionSeries(r.series_by_app, bucket => {
      const id = Number(bucket);
      if (!Number.isFinite(id) || id <= 0) return String(bucket);
      return this.bundle?.apps.get(id) ?? `app #${id}`;
    });

    this.expensiveCalls = this.toExpensiveCalls(r.most_expensive_calls);

    this.byResource = (r.by_resource ?? []).map(row => ({
      key: row.resource,
      label: row.resource,
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: n(row.requests),
      toolCalls: 0,
      sessions: n(row.requests),
      costUsd: 0,
    }));

    this.byErrorClass = (r.by_error_class ?? []).map(row => ({
      key: row.class,
      label: this.errorClassLabel(row.class),
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: n(row.count),
      toolCalls: 0,
      sessions: n(row.count),
      costUsd: 0,
    }));

    this.budgets = (r.budgets ?? []).map(row => {
      const budget = n(row.monthly_budget_usd);
      const spent = n(row.spent_month_usd);
      const projected = n(row.projected_month_end_usd);
      const svc = this.bundle?.services.get(row.service_id);
      const spentRatio = budget > 0 ? spent / budget : 0;
      const projectedRatio = budget > 0 ? projected / budget : 0;
      return {
        serviceId: row.service_id,
        serviceLabel: svc?.label || svc?.name || `service #${row.service_id}`,
        budgetUsd: budget,
        spentMonthUsd: spent,
        projectedMonthEndUsd: projected,
        spentRatio,
        projectedRatio,
        onTrack: row.on_track,
        daysIntoMonth: row.days_into_month,
        daysInMonth: row.days_in_month,
        status: this.budgetStatus(spentRatio, projectedRatio, row.on_track),
      };
    });
    this.budgetWarnings = this.budgets.filter(b => !b.onTrack);
    // Budgets are per-connection (the aggregator ignores request filters), so
    // narrow the panel to the scoped connection when the tenant lens is set.
    this.visibleBudgets =
      this.scopeDim === 'tenant' && this.scopeValue != null
        ? this.budgets.filter(b => b.serviceId === this.scopeValue)
        : this.budgets;

    const services = this.bundle?.services;
    const providerFallback = r.by_provider[0]?.provider ?? 'unknown';
    const cp = new Map<number, string>();
    if (services) {
      for (const row of r.by_service ?? []) {
        const svcId = row.service_id ?? 0;
        const svc = services.get(svcId);
        if (svc?.type === 'ai_connection') {
          cp.set(svcId, providerFallback);
        }
      }
    }
    this.connectionProviders = cp;

    this.costInputSessions = this.buildCostInputSessions(r);

    this.defaultRates = ratesFromBundle(r.default_rates);

    this.providerOptions = (r.by_provider ?? [])
      .map(row => row.provider ?? '')
      .filter(p => p);
    this.modelOptions = (r.by_model ?? []).map(row => row.model);
    this.resourceOptions = (r.by_resource ?? []).map(row => row.resource);
    this.serviceOptions = Array.from(this.bundle?.services.values() ?? [])
      .map(s => ({ id: s.id, label: s.label || s.name }))
      .sort((a, b) => a.label.localeCompare(b.label));
    this.userOptions = Array.from(this.bundle?.users.entries() ?? [])
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
    this.roleOptions = Array.from(this.bundle?.roles.entries() ?? [])
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
    this.appOptions = Array.from(this.bundle?.apps.entries() ?? [])
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label));

    this.activeChips = this.buildActiveChips();
    this.syncScopeValue();

    this.recomputeMcpViews();
  }

  private recomputeMcpViews(): void {
    const m = this.bundle?.mcp;
    if (!m) {
      this.mcpTotalRequests = 0;
      this.mcpBytesIn = 0;
      this.mcpBytesOut = 0;
      this.mcpAvgDurationMs = 0;
      this.mcpByClient = [];
      this.mcpByTool = [];
      this.mcpByUser = [];
      this.mcpByService = [];
      this.mcpByApp = [];
      this.mcpByMethod = [];
      return;
    }

    this.mcpTotalRequests = m.total_requests;
    this.mcpBytesIn = m.total_bytes_in;
    this.mcpBytesOut = m.total_bytes_out;
    this.mcpAvgDurationMs = m.avg_duration_ms;

    this.mcpByClient = (m.by_client ?? []).map(row => ({
      key: row.client_id ?? 'unknown',
      label: row.client_name || row.client_id || 'unknown client',
      inputTokens: n(row.bytes_in),
      outputTokens: n(row.bytes_out),
      totalTokens: n(row.bytes_in) + n(row.bytes_out),
      toolCalls: 0,
      sessions: n(row.requests),
      costUsd: 0,
    }));

    this.mcpByTool = (m.by_tool ?? []).map(row => ({
      key: row.tool_name,
      label: row.tool_name,
      inputTokens: n(row.bytes_in),
      outputTokens: n(row.bytes_out),
      totalTokens: n(row.bytes_in) + n(row.bytes_out),
      toolCalls: n(row.requests),
      sessions: n(row.requests),
      costUsd: 0,
    }));

    this.mcpByUser = (m.by_user ?? []).map(row => {
      const id = row.user_id ?? 0;
      const label = id
        ? (this.bundle?.users.get(id) ?? `user #${id}`)
        : 'anonymous';
      return {
        key: String(id),
        label,
        inputTokens: n(row.bytes_in),
        outputTokens: n(row.bytes_out),
        totalTokens: n(row.bytes_in) + n(row.bytes_out),
        toolCalls: 0,
        sessions: n(row.requests),
        costUsd: 0,
      };
    });

    this.mcpByService = (m.by_service ?? []).map(row => {
      const id = row.service_id ?? 0;
      const svc = this.bundle?.services.get(id);
      return {
        key: String(id),
        label: svc?.label || svc?.name || `service #${id}`,
        inputTokens: n(row.bytes_in),
        outputTokens: n(row.bytes_out),
        totalTokens: n(row.bytes_in) + n(row.bytes_out),
        toolCalls: 0,
        sessions: n(row.requests),
        costUsd: 0,
      };
    });

    this.mcpByApp = (m.by_app ?? []).map(row => {
      const id = row.app_id ?? 0;
      const label = id
        ? (this.bundle?.apps.get(id) ?? `app #${id}`)
        : '(no app)';
      return {
        key: String(id),
        label,
        inputTokens: n(row.bytes_in),
        outputTokens: n(row.bytes_out),
        totalTokens: n(row.bytes_in) + n(row.bytes_out),
        toolCalls: 0,
        sessions: n(row.requests),
        costUsd: 0,
      };
    });

    this.mcpByMethod = (m.by_method ?? []).map(row => ({
      key: row.method,
      label: row.method,
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      toolCalls: 0,
      sessions: n(row.requests),
      costUsd: 0,
    }));
  }

  private buildActiveChips(): ActiveFilterChip[] {
    const chips: ActiveFilterChip[] = [];
    const labelFor = {
      provider: (v: string | number) => `provider: ${v}`,
      service_id: (v: string | number) => {
        const s = this.bundle?.services.get(Number(v));
        return `connection: ${s?.label || s?.name || `#${v}`}`;
      },
      model: (v: string | number) => `model: ${v}`,
      user_id: (v: string | number) =>
        `user: ${this.bundle?.users.get(Number(v)) ?? `#${v}`}`,
      role_id: (v: string | number) =>
        `role: ${this.bundle?.roles.get(Number(v)) ?? `#${v}`}`,
      app_id: (v: string | number) =>
        `app: ${this.bundle?.apps.get(Number(v)) ?? `#${v}`}`,
      resource: (v: string | number) => `endpoint: ${v}`,
      status: (v: string | number) => `status: ${v}`,
    } as const;

    (Object.keys(this.filters) as (keyof UsageFilters)[]).forEach(dim => {
      const list = this.filters[dim] as (string | number)[];
      list.forEach(value =>
        chips.push({ dimension: dim, value, label: labelFor[dim](value) })
      );
    });
    return chips;
  }

  private buildCostInputSessions(r: NonNullable<UsageBundle['raw']>) {
    return (r.by_service ?? []).map(row => ({
      id: row.service_id ?? 0,
      service_id: row.service_id ?? 0,
      ai_service_id: row.service_id ?? 0,
      ai_role_id: 0,
      status: 'active' as const,
      service_name: '',
      total_input_tokens: n(row.input_tokens),
      total_output_tokens: n(row.output_tokens),
      tool_call_count: 0,
    }));
  }

  private emptySummary(): UsageSummary {
    return {
      sessionCount: 0,
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      toolCalls: 0,
      avgTokensPerSession: 0,
      avgToolCallsPerSession: 0,
      errors: 0,
      partials: 0,
      avgLatencyMs: 0,
      latencyP50Ms: 0,
      latencyP95Ms: 0,
      latencyP99Ms: 0,
      totalCostUsd: 0,
    };
  }

  /** Compute period-over-period deltas as fractions (1.0 = +100%). Returns
   *  null for any metric where the previous period had zero baseline — we
   *  can't divide by zero, and "infinitely more" isn't a useful number. */
  private buildDeltas(
    r: NonNullable<UsageBundle['raw']>
  ): UsageSummary['deltas'] {
    const prev = r.previous;
    if (!prev) {
      return undefined;
    }
    const pct = (current: number, previous: number): number | null =>
      previous > 0 ? (current - previous) / previous : null;
    return {
      requests: pct(r.total_requests, prev.total_requests),
      inputTokens: pct(r.total_input_tokens, prev.total_input_tokens),
      outputTokens: pct(r.total_output_tokens, prev.total_output_tokens),
      totalTokens: pct(
        r.total_input_tokens + r.total_output_tokens,
        prev.total_input_tokens + prev.total_output_tokens
      ),
      errors: pct(r.errors, prev.errors),
      latency: pct(r.latency_p50_ms, prev.latency_p50_ms),
      cost: pct(r.total_cost_usd, prev.total_cost_usd),
    };
  }

  /** Per-day sparkline arrays straight from the time-series. */
  private buildSparklines(
    r: NonNullable<UsageBundle['raw']>
  ): UsageSummary['sparklines'] {
    const series = r.series ?? [];
    if (series.length === 0) {
      return undefined;
    }
    return {
      requests: series.map(b => n(b.requests)),
      inputTokens: series.map(b => n(b.input_tokens)),
      outputTokens: series.map(b => n(b.output_tokens)),
      totalTokens: series.map(b => n(b.input_tokens) + n(b.output_tokens)),
      errors: series.map(b => n(b.errors)),
      cost: series.map(b => n(b.cost_usd)),
    };
  }

  formatUsd(v: number): string {
    // Delegates to the shared, hoisted Intl formatters — this is called from
    // *ngFor rows in the template, i.e. rows × change-detection cycles.
    return formatUSD(v);
  }

  /** Classify a budget into ok / warning / danger for token-driven meter
   *  color. Already over cap = danger; projected to blow the cap or past 80%
   *  of it = warning; otherwise ok. */
  private budgetStatus(
    spentRatio: number,
    projectedRatio: number,
    onTrack: boolean
  ): BudgetStatus {
    if (spentRatio >= 1) return 'danger';
    if (!onTrack || projectedRatio >= 1 || spentRatio >= 0.8) return 'warning';
    return 'ok';
  }

  // trackBy helpers for the template's *ngFor loops — without them the
  // default differ tears down and rebuilds every row whenever the source
  // array is replaced (each fetch/filter change).
  trackBudget(_: number, b: BudgetRow): number {
    return b.serviceId;
  }

  trackChip(_: number, chip: ActiveFilterChip): string {
    return `${String(chip.dimension)}:${chip.value}`;
  }

  trackOptionId(_: number, o: { id: number }): number {
    return o.id;
  }

  /** Map raw error_class identifier into a human label for the bars panel. */
  private errorClassLabel(cls: string): string {
    const map: Record<string, string> = {
      timeout: 'Timeout',
      rate_limit: 'Rate-limited',
      auth: 'Auth failure',
      model_not_found: 'Model not found',
      context_overflow: 'Context too long',
      connectivity: 'Connectivity',
      provider_5xx: 'Provider 5xx',
      provider_4xx: 'Provider 4xx',
      other: 'Other',
      unknown: 'Unknown',
    };
    return map[cls] ?? cls;
  }

  private toRow(
    key: string,
    label: string,
    r: {
      requests: number | string;
      input_tokens?: number | string;
      output_tokens?: number | string;
      cost_usd?: number | string;
    }
  ): GroupRow {
    const inputTokens = n(r.input_tokens);
    const outputTokens = n(r.output_tokens);
    return {
      key,
      label,
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      toolCalls: 0,
      sessions: n(r.requests),
      costUsd: n(r.cost_usd),
    };
  }

  /** Flatten the backend's series_by_<dim> rows into the chart-friendly
   *  shape, preserving the __other__ sentinel for the chart's gray layer. */
  private toDimensionSeries(
    rows: DimensionSeriesRowRaw[] | undefined,
    labelFor: (bucket: string | number) => string
  ): DimensionSeriesPoint[] {
    if (!rows || rows.length === 0) return [];
    return rows.map(r => {
      const rawBucket = r.bucket;
      const isOther = rawBucket === '__other__';
      const key = isOther ? '__other__' : labelFor(rawBucket);
      return {
        date: r.date,
        bucket: key,
        cost: n(r.cost_usd),
        requests: n(r.requests),
      };
    });
  }

  /** Map most_expensive_calls rows to the table component's display shape,
   *  resolving user/app/service ids to labels via the bundle lookups. */
  private toExpensiveCalls(
    rows: ExpensiveCallRowRaw[] | undefined
  ): ExpensiveCallRow[] {
    if (!rows || rows.length === 0) return [];
    return rows.map(r => {
      const userId = r.user_id ?? 0;
      const appId = r.app_id ?? 0;
      const userLabel = userId
        ? (this.bundle?.users.get(userId) ?? `user #${userId}`)
        : '-';
      const appLabel = appId
        ? (this.bundle?.apps.get(appId) ?? `app #${appId}`)
        : '-';
      const svc = this.bundle?.services.get(r.service_id);
      const serviceLabel =
        svc?.label || svc?.name || `service #${r.service_id}`;
      return {
        id: r.id,
        provider: r.provider,
        model: r.model,
        resource: r.resource,
        userLabel,
        appLabel,
        serviceLabel,
        inputTokens: n(r.input_tokens),
        outputTokens: n(r.output_tokens),
        costUsd: n(r.cost_usd),
        latencyMs: n(r.latency_ms),
        status: r.status,
        createdAt: r.created_at,
      };
    });
  }
}
