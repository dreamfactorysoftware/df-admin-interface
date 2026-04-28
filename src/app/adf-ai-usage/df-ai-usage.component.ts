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
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faArrowsRotate,
  faChartLine,
  faMessage,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { finalize } from 'rxjs/operators';
import {
  EMPTY_FILTERS,
  TimeRange,
  UsageBundle,
  UsageFilters,
  UsageService,
  n,
} from './services/usage.service';
import { GroupRow, TimeBucket, UsageSummary } from './types/usage';
import { DfUsageStackedAreaComponent } from './components/df-usage-stacked-area/df-usage-stacked-area.component';
import { DfUsageBarsComponent } from './components/df-usage-bars/df-usage-bars.component';
import { DfUsageSummaryComponent } from './components/df-usage-summary/df-usage-summary.component';
import { DfCostEstimatorComponent } from './components/df-cost-estimator/df-cost-estimator.component';

interface ActiveFilterChip {
  dimension: keyof UsageFilters;
  value: string | number;
  label: string;
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
    FontAwesomeModule,
    DfUsageStackedAreaComponent,
    DfUsageBarsComponent,
    DfUsageSummaryComponent,
    DfCostEstimatorComponent,
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

  // Filter state. Mutated in place via addFilter/removeFilter; refresh() is
  // called once after mutation. Sent as-is to the backend.
  filters: UsageFilters = { ...EMPTY_FILTERS };

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
  activeChips: ActiveFilterChip[] = [];

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

  faArrowsRotate = faArrowsRotate;
  faChartLine = faChartLine;
  faMessage = faMessage;
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
          this.errorMessage =
            err?.error?.error?.message ??
            err?.message ??
            'Failed to load usage.';
        },
      });
  }

  setRange(range: TimeRange): void {
    this.range = range;
    this.refresh();
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

  toggleFilter<K extends keyof UsageFilters>(
    key: K,
    value: UsageFilters[K][number]
  ): void {
    const list = this.filters[key] as (string | number)[];
    const idx = list.indexOf(value as string | number);
    if (idx >= 0) {
      list.splice(idx, 1);
    } else {
      list.push(value as string | number);
    }
    this.refresh();
  }

  removeChip(chip: ActiveFilterChip): void {
    this.toggleFilter(chip.dimension, chip.value as never);
  }

  clearFilters(): void {
    this.filters = { ...EMPTY_FILTERS };
    Object.keys(this.filters).forEach(k => {
      (this.filters[k as keyof UsageFilters] as unknown[]).length = 0;
    });
    // Re-init properly so each array is its own (the spread above shares refs).
    this.filters = {
      provider: [],
      service_id: [],
      model: [],
      user_id: [],
      role_id: [],
      app_id: [],
      resource: [],
      status: [],
    };
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
      this.connectionProviders = new Map();
      this.costInputSessions = [];
      this.activeChips = [];
      return;
    }

    const totalTokens = r.total_input_tokens + r.total_output_tokens;
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
      avgLatencyMs: r.avg_latency_ms,
      totalCostUsd: r.total_cost_usd,
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
        : '— no role —';
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
        : '— no app —';
      return this.toRow(String(id), label, row);
    });

    this.byProvider = (r.by_provider ?? []).map(row =>
      this.toRow(row.provider ?? 'unknown', row.provider ?? 'unknown', row)
    );

    this.byModel = (r.by_model ?? []).map(row =>
      this.toRow(row.model, `${row.model} (${row.provider})`, row)
    );

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
        : '— no app —';
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
      avgLatencyMs: 0,
      totalCostUsd: 0,
    };
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
}
