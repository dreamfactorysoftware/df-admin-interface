import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faArrowsRotate,
  faChartLine,
  faMessage,
} from '@fortawesome/free-solid-svg-icons';
import { finalize } from 'rxjs/operators';
import {
  TimeRange,
  UsageBundle,
  UsageService,
  n,
} from './services/usage.service';
import { GroupRow, TimeBucket, UsageSummary } from './types/usage';
import { DfUsageStackedAreaComponent } from './components/df-usage-stacked-area/df-usage-stacked-area.component';
import { DfUsageBarsComponent } from './components/df-usage-bars/df-usage-bars.component';
import { DfUsageSummaryComponent } from './components/df-usage-summary/df-usage-summary.component';
import { DfCostEstimatorComponent } from './components/df-cost-estimator/df-cost-estimator.component';

@Component({
  selector: 'df-ai-usage',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatButtonToggleModule,
    MatProgressSpinnerModule,
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

  faArrowsRotate = faArrowsRotate;
  faChartLine = faChartLine;
  faMessage = faMessage;

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.loading = true;
    this.errorMessage = null;
    this.api
      .loadAll(this.range)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: bundle => (this.bundle = bundle),
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

  get summary(): UsageSummary {
    const r = this.bundle?.raw;
    if (!r) {
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
      };
    }
    const totalTokens = r.total_input_tokens + r.total_output_tokens;
    return {
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
    };
  }

  get series(): TimeBucket[] {
    return (this.bundle?.raw.series ?? []).map(b => ({
      date: b.date,
      inputTokens: n(b.input_tokens),
      outputTokens: n(b.output_tokens),
      toolCalls: 0,
      sessions: n(b.requests),
    }));
  }

  get byUser(): GroupRow[] {
    return (this.bundle?.raw.by_user ?? []).map(r => {
      const id = r.user_id ?? 0;
      const label = id ? this.bundle?.users.get(id) ?? `user #${id}` : 'anonymous';
      return this.toRow(String(id), label, r);
    });
  }

  get byRole(): GroupRow[] {
    return (this.bundle?.raw.by_role ?? []).map(r => {
      const id = r.role_id ?? 0;
      const label = id
        ? this.bundle?.roles.get(id) ?? `role #${id}`
        : '— no role —';
      return this.toRow(String(id), label, r);
    });
  }

  get byService(): GroupRow[] {
    return (this.bundle?.raw.by_service ?? []).map(r => {
      const id = r.service_id ?? 0;
      const svc = this.bundle?.services.get(id);
      const label = svc?.label || svc?.name || `service #${id}`;
      return this.toRow(String(id), label, r);
    });
  }

  get byProvider(): GroupRow[] {
    return (this.bundle?.raw.by_provider ?? []).map(r =>
      this.toRow(r.provider ?? 'unknown', r.provider ?? 'unknown', r)
    );
  }

  get byResource(): GroupRow[] {
    return (this.bundle?.raw.by_resource ?? []).map(r => ({
      key: r.resource,
      label: r.resource,
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: n(r.requests),
      toolCalls: 0,
      sessions: n(r.requests),
    }));
  }

  /** ai_service_id -> provider name, for the cost estimator. */
  get connectionProviders(): Map<number, string> {
    const m = new Map<number, string>();
    const services = this.bundle?.services;
    const providers = this.bundle?.raw.by_service ?? [];
    if (!services) {
      return m;
    }
    for (const row of providers) {
      const svcId = row.service_id ?? 0;
      const svc = services.get(svcId);
      if (svc?.type === 'ai_connection') {
        // Provider isn't directly on by_service; fall back to looking up
        // any by_provider row.
        m.set(svcId, this.providerForService(svcId));
      }
    }
    return m;
  }

  private providerForService(serviceId: number): string {
    // Best-effort: use the first provider in the global list — most setups
    // have a 1:1 mapping. Could be improved with a join in the backend.
    return this.bundle?.raw.by_provider[0]?.provider ?? 'unknown';
  }

  private toRow(
    key: string,
    label: string,
    r: { requests: number | string; input_tokens?: number | string; output_tokens?: number | string }
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
    };
  }

  jumpToService(row: GroupRow): void {
    this.router.navigate(['/ai/connections', row.key]);
  }

  /** Pseudo-sessions for the cost estimator (which expects session rows). */
  get costInputSessions() {
    return (this.bundle?.raw.by_service ?? []).map(r => ({
      id: r.service_id ?? 0,
      service_id: r.service_id ?? 0,
      ai_service_id: r.service_id ?? 0,
      ai_role_id: 0,
      status: 'active' as const,
      service_name: '',
      total_input_tokens: n(r.input_tokens),
      total_output_tokens: n(r.output_tokens),
      tool_call_count: 0,
    }));
  }
}
