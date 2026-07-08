import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { silent } from '../shared/utilities/http-contexts';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoModule } from '@ngneat/transloco';
import { DfPageHeaderComponent } from '../shared/components/df-page-header/df-page-header.component';
import { DfBadgeComponent } from '../shared/components/df-badge/df-badge.component';
import { DfEmptyStateComponent } from '../shared/components/df-empty-state/df-empty-state.component';
import { DfScopeMapComponent } from '../shared/components/df-scope-map/df-scope-map.component';
import {
  ExpensiveCallRowRaw,
  TimeRange,
  UsageBundle,
  UsageService,
  n,
} from '../adf-ai-usage/services/usage.service';
import { formatUSD } from '../adf-ai-usage/utils/cost';

// NOTE: the global caseInterceptor converts /api responses snake->camel (and
// request bodies camel->snake), so everything from /api/v2 is camelCase here.
// The /_internal/alerts/log endpoint is NOT under /api, so AgentLogRow stays
// snake_case (matches the df-alerts admin component).
type Agent = {
  id: number;
  name: string;
  description: string | null;
  ownerId: number | null;
  roleId: number | null;
  apiKey: string;
  keyTtlHours: number;
  keyIssuedAt: string | null;
  lastActiveAt: string | null;
  isActive: boolean;
};
type AccessRequest = {
  id: number;
  agentId: number;
  requestedServices: string[];
  requestedOperations: string[];
  note: string | null;
  status: string;
  resolvedAt: string | null;
};
type Named = { id: number; name: string };
type AgentLogRow = {
  id: number;
  event_name: string;
  status: string;
  created_at: string;
};

/**
 * One row in the gateway request log. Derived 1:1 from a real
 * `most_expensive_calls` record served by /_internal/ai/usage — every figure
 * here is a metered fact, never fabricated. The endpoint returns the top calls
 * by cost in the window (there is no full per-call stream endpoint yet), so the
 * log is honestly labelled as such. Fields the endpoint does not carry (a
 * "cached" flag, prompt/response bodies) are omitted, not invented.
 */
type CallRow = {
  id: number;
  provider: string;
  model: string;
  resource: string;
  serviceLabel: string;
  userLabel: string;
  roleId: number | null;
  roleLabel: string | null;
  appLabel: string | null;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  latencyMs: number;
  status: string;
  createdAt: string;
  ok: boolean;
};

/**
 * Agents = the AI gateway watching itself (spec 3.4). Hero is a Cloudflare-style
 * request log built from real metered calls, with a detail drawer and the
 * guardrail chips DreamFactory can actually enforce (call outcome + RBAC scope);
 * no faked PII/injection set. Below it: agent identities (scoped role + short
 * TTL keys) that expand into a resolved scope map, the pending-access queue, and
 * an activity view. Every empty state teaches; activity auto-polls.
 */
@Component({
  selector: 'df-agents',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslocoModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTooltipModule,
    DfPageHeaderComponent,
    DfBadgeComponent,
    DfEmptyStateComponent,
    DfScopeMapComponent,
  ],
  template: `
    <ng-container *transloco="let t; read: 'agents'">
      <div class="agents-page">
        <df-page-header
          eyebrow="AI Gateway"
          title="Agents"
          [description]="t('subtitle')">
          <div pageHeaderActions class="head-actions">
            <span
              class="live"
              *ngIf="polling"
              matTooltip="{{ t('liveTip') }}"
              aria-hidden="true">
              <span class="live-dot"></span> {{ t('live') }}
            </span>
            <button
              mat-icon-button
              class="refresh-icon"
              (click)="refreshAll()"
              [attr.aria-label]="t('refresh')"
              matTooltip="{{ t('refresh') }}">
              <mat-icon>refresh</mat-icon>
            </button>
            <button
              mat-flat-button
              color="primary"
              (click)="showNew = !showNew">
              <mat-icon>add</mat-icon> {{ t('newAgent') }}
            </button>
          </div>
        </df-page-header>

        <!-- ============ GATEWAY REQUEST LOG (hero) ============ -->
        <mat-card class="card">
          <div class="card-head">
            <div>
              <h2>{{ t('log.title') }}</h2>
              <p class="sub tight">{{ t('log.subtitle') }}</p>
            </div>
            <div class="log-controls">
              <mat-form-field appearance="outline" class="ctl">
                <mat-label>{{ t('log.status') }}</mat-label>
                <mat-select
                  [(ngModel)]="statusFilter"
                  (ngModelChange)="applyCallFilter()">
                  <mat-option value="all">{{
                    t('log.allStatuses')
                  }}</mat-option>
                  <mat-option value="ok">{{ t('log.ok') }}</mat-option>
                  <mat-option value="error">{{ t('log.error') }}</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" class="ctl">
                <mat-label>{{ t('log.range') }}</mat-label>
                <mat-select [(ngModel)]="range" (ngModelChange)="reloadUsage()">
                  <mat-option value="24h">{{ t('log.range24h') }}</mat-option>
                  <mat-option value="7d">{{ t('log.range7d') }}</mat-option>
                  <mat-option value="30d">{{ t('log.range30d') }}</mat-option>
                  <mat-option value="all">{{ t('log.rangeAll') }}</mat-option>
                </mat-select>
              </mat-form-field>
            </div>
          </div>

          <df-empty-state
            *ngIf="!callsLoading && !calls.length"
            icon="query_stats"
            [title]="t('log.empty.title')"
            [description]="t('log.empty.message')">
          </df-empty-state>

          <df-empty-state
            *ngIf="!callsLoading && calls.length && !filteredCalls.length"
            icon="filter_alt_off"
            [title]="t('log.noMatch.title')"
            [description]="t('log.noMatch.message')">
          </df-empty-state>

          <div class="log-scroll" *ngIf="callsLoading || filteredCalls.length">
            <table class="log" *ngIf="filteredCalls.length">
              <thead>
                <tr>
                  <th>{{ t('col.time') }}</th>
                  <th>{{ t('col.provider') }}</th>
                  <th>{{ t('col.model') }}</th>
                  <th>{{ t('col.status') }}</th>
                  <th class="num">{{ t('col.tokens') }}</th>
                  <th class="num">{{ t('col.cost') }}</th>
                  <th class="num">{{ t('col.latency') }}</th>
                  <th class="scope-col">{{ t('col.scope') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  *ngFor="let c of filteredCalls; trackBy: trackById"
                  class="log-row"
                  [class.active]="selected?.id === c.id"
                  tabindex="0"
                  (click)="openCall(c)"
                  (keydown.enter)="openCall(c)">
                  <td class="muted nowrap">
                    {{ c.createdAt | date: 'MMM d, HH:mm' }}
                  </td>
                  <td>{{ c.provider }}</td>
                  <td class="mono">{{ c.model }}</td>
                  <td>
                    <df-badge
                      [variant]="c.ok ? 'success' : 'danger'"
                      [label]="c.ok ? t('log.completed') : t('log.failed')">
                    </df-badge>
                  </td>
                  <td class="num df-numeric">
                    {{ c.inputTokens | number }}
                    <span class="arrow">&rarr;</span>
                    {{ c.outputTokens | number }}
                  </td>
                  <td class="num df-numeric">{{ usd(c.costUsd) }}</td>
                  <td class="num df-numeric">{{ c.latencyMs | number }} ms</td>
                  <td class="scope-col">
                    <df-badge
                      [variant]="c.roleId != null ? 'success' : 'warning'"
                      [dot]="false"
                      [label]="
                        c.roleId != null ? t('log.scoped') : t('log.unscoped')
                      ">
                    </df-badge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </mat-card>

        <!-- ============ AGENTS ============ -->
        <mat-card class="card">
          <div class="card-head">
            <h2>{{ t('agentsTitle') }}</h2>
          </div>

          <div class="new-form" *ngIf="showNew">
            <mat-form-field appearance="outline"
              ><mat-label>Name</mat-label>
              <input
                matInput
                [(ngModel)]="newAgent.name"
                placeholder="sales-report-bot"
            /></mat-form-field>
            <mat-form-field appearance="outline" class="grow"
              ><mat-label>Description</mat-label>
              <input matInput [(ngModel)]="newAgent.description"
            /></mat-form-field>
            <mat-form-field appearance="outline"
              ><mat-label>Role</mat-label>
              <mat-select [(ngModel)]="newAgent.roleId">
                <mat-option
                  *ngFor="let r of roles; trackBy: trackById"
                  [value]="r.id"
                  >{{ r.name }}</mat-option
                >
              </mat-select></mat-form-field
            >
            <mat-form-field appearance="outline" *ngIf="users.length"
              ><mat-label>Owner</mat-label>
              <mat-select [(ngModel)]="newAgent.ownerId">
                <mat-option
                  *ngFor="let u of users; trackBy: trackById"
                  [value]="u.id"
                  >{{ u.name }}</mat-option
                >
              </mat-select></mat-form-field
            >
            <mat-form-field appearance="outline" class="narrow"
              ><mat-label>Key TTL (h)</mat-label>
              <input
                matInput
                type="number"
                min="1"
                max="24"
                [(ngModel)]="newAgent.keyTtlHours"
                matTooltip="1-24 hours"
            /></mat-form-field>
            <button
              mat-flat-button
              color="primary"
              [disabled]="saving || !newAgent.name || !newAgent.roleId"
              (click)="createAgent()">
              Create
            </button>
          </div>

          <df-empty-state
            *ngIf="!agents.length"
            icon="smart_toy"
            [title]="t('empty.title')"
            [description]="t('empty.message')"
            [actionLabel]="t('newAgent')"
            actionIcon="add"
            (action)="showNew = true">
          </df-empty-state>

          <div class="agent-block" *ngFor="let a of agents; trackBy: trackById">
            <div class="row">
              <button
                mat-icon-button
                class="chevron"
                (click)="toggleExpand(a.id)"
                [attr.aria-label]="t('viewScope')"
                matTooltip="{{ t('viewScope') }}">
                <mat-icon>{{
                  expandedId === a.id ? 'expand_less' : 'expand_more'
                }}</mat-icon>
              </button>
              <df-badge
                [variant]="
                  !a.isActive ? 'danger' : expired(a) ? 'warning' : 'success'
                "
                [label]="
                  !a.isActive
                    ? t('state.revoked')
                    : expired(a)
                      ? t('state.expired')
                      : t('state.active')
                ">
              </df-badge>
              <strong>{{ a.name }}</strong>
              <span class="tag">{{ roleName(a.roleId) }}</span>
              <span class="muted" *ngIf="a.description">{{
                a.description
              }}</span>
              <span class="spacer"></span>
              <code class="key" matTooltip="Agent API key">{{
                maskKey(a.apiKey)
              }}</code>
              <span class="muted ttl">TTL {{ a.keyTtlHours }}h</span>
              <mat-slide-toggle
                [checked]="a.isActive"
                (change)="toggleActive(a, $event.checked)"
                matTooltip="Revoke / restore key"></mat-slide-toggle>
              <button mat-icon-button (click)="startEdit(a)" matTooltip="Edit">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button (click)="remove(a)" matTooltip="Delete">
                <mat-icon>delete</mat-icon>
              </button>
            </div>

            <div class="expand" *ngIf="expandedId === a.id">
              <div class="expand-meta">
                <span class="df-eyebrow">{{ t('reach') }}</span>
                <span class="muted">{{ t('reachHint') }}</span>
              </div>
              <df-scope-map [roleId]="a.roleId"></df-scope-map>
            </div>
          </div>

          <div class="new-form edit" *ngIf="editId !== null">
            <mat-form-field appearance="outline"
              ><mat-label>Name</mat-label>
              <input matInput [(ngModel)]="editAgent.name"
            /></mat-form-field>
            <mat-form-field appearance="outline" class="grow"
              ><mat-label>Description</mat-label>
              <input matInput [(ngModel)]="editAgent.description"
            /></mat-form-field>
            <mat-form-field appearance="outline"
              ><mat-label>Role</mat-label>
              <mat-select [(ngModel)]="editAgent.roleId">
                <mat-option
                  *ngFor="let r of roles; trackBy: trackById"
                  [value]="r.id"
                  >{{ r.name }}</mat-option
                >
              </mat-select></mat-form-field
            >
            <mat-form-field appearance="outline" class="narrow"
              ><mat-label>Key TTL (h)</mat-label>
              <input
                matInput
                type="number"
                min="1"
                max="24"
                [(ngModel)]="editAgent.keyTtlHours"
            /></mat-form-field>
            <button
              mat-flat-button
              color="primary"
              [disabled]="saving"
              (click)="saveEdit()">
              Save
            </button>
            <button mat-button (click)="editId = null">Cancel</button>
          </div>
        </mat-card>

        <!-- ============ PENDING ACCESS REQUESTS ============ -->
        <mat-card class="card">
          <div class="card-head">
            <h2>
              {{ t('pending.title') }}
              <span class="muted" *ngIf="pendingRequests.length"
                >({{ pendingRequests.length }})</span
              >
            </h2>
          </div>
          <df-empty-state
            *ngIf="!pendingRequests.length"
            icon="inbox"
            [title]="t('pending.empty.title')"
            [description]="t('pending.empty.message')">
          </df-empty-state>
          <div
            class="row"
            *ngFor="let q of pendingRequests; trackBy: trackById">
            <mat-icon class="hand">pan_tool</mat-icon>
            <strong>{{ agentName(q.agentId) }}</strong>
            <span class="muted">requests</span>
            <df-badge
              variant="warning"
              [dot]="false"
              [label]="(q.requestedOperations || []).join(', ') || 'any'">
            </df-badge>
            <span class="muted">on</span>
            <span class="tag">{{
              (q.requestedServices || []).join(', ') || 'unspecified'
            }}</span>
            <span class="muted note" *ngIf="q.note">"{{ q.note }}"</span>
            <span class="spacer"></span>
            <button
              mat-flat-button
              color="primary"
              [disabled]="saving"
              (click)="resolve(q, 'approved')">
              <mat-icon>check</mat-icon> Approve
            </button>
            <button
              mat-stroked-button
              [disabled]="saving"
              (click)="resolve(q, 'denied')">
              <mat-icon>close</mat-icon> Deny
            </button>
          </div>
        </mat-card>

        <!-- ============ ACTIVITY ============ -->
        <mat-card class="card">
          <div class="card-head">
            <h2>{{ t('activity.title') }}</h2>
          </div>
          <div class="log-scroll" *ngIf="agents.length">
            <table>
              <thead>
                <tr>
                  <th>Agent</th>
                  <th>Role</th>
                  <th>Key</th>
                  <th>Last active</th>
                  <th class="num">Requests</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let a of agents; trackBy: trackById">
                  <td>
                    <strong>{{ a.name }}</strong>
                  </td>
                  <td class="muted">{{ roleName(a.roleId) }}</td>
                  <td>
                    <df-badge
                      [variant]="
                        !a.isActive
                          ? 'danger'
                          : expired(a)
                            ? 'warning'
                            : 'success'
                      "
                      [dot]="false"
                      [label]="
                        !a.isActive
                          ? t('state.revoked')
                          : expired(a)
                            ? t('state.expired')
                            : t('state.active')
                      ">
                    </df-badge>
                  </td>
                  <td class="muted">
                    {{
                      a.lastActiveAt
                        ? (a.lastActiveAt | date: 'short')
                        : 'never'
                    }}
                  </td>
                  <td class="num df-numeric">{{ requestCount(a.id) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 class="sub2">{{ t('activity.alerts') }}</h3>
          <df-empty-state
            *ngIf="!agentLog.length"
            icon="notifications_off"
            [title]="t('activity.emptyAlerts.title')"
            [description]="t('activity.emptyAlerts.message')">
          </df-empty-state>
          <div class="log-scroll" *ngIf="agentLog.length">
            <table>
              <thead>
                <tr>
                  <th>When</th>
                  <th>Event</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let l of agentLog; trackBy: trackById">
                  <td class="muted">{{ l.created_at | date: 'short' }}</td>
                  <td>{{ l.event_name }}</td>
                  <td>
                    <df-badge
                      [variant]="alertVariant(l.status)"
                      [label]="l.status">
                    </df-badge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </mat-card>
      </div>

      <!-- ============ CALL DETAIL DRAWER ============ -->
      <div class="drawer-scrim" *ngIf="selected" (click)="closeCall()"></div>
      <aside class="drawer" *ngIf="selected" role="dialog" aria-modal="true">
        <div class="drawer-head">
          <div>
            <span class="df-eyebrow">{{ t('drawer.title') }}</span>
            <h3 class="mono">{{ selected.model }}</h3>
          </div>
          <button
            mat-icon-button
            (click)="closeCall()"
            [attr.aria-label]="t('drawer.close')">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <div class="drawer-section">
          <span class="df-eyebrow">{{ t('drawer.guardrails') }}</span>
          <div class="chips">
            <df-badge
              [variant]="selected.ok ? 'success' : 'danger'"
              [label]="
                selected.ok ? t('drawer.completed') : t('drawer.failed')
              ">
            </df-badge>
            <df-badge
              [variant]="selected.roleId != null ? 'success' : 'warning'"
              [label]="
                selected.roleId != null
                  ? t('drawer.scopeEnforced')
                  : t('drawer.unscoped')
              ">
            </df-badge>
          </div>
          <p class="hint">{{ t('drawer.guardrailHint') }}</p>
        </div>

        <div class="drawer-section">
          <span class="df-eyebrow">{{ t('drawer.attribution') }}</span>
          <dl class="kv">
            <dt>{{ t('drawer.service') }}</dt>
            <dd>{{ selected.serviceLabel }}</dd>
            <dt>{{ t('drawer.resource') }}</dt>
            <dd>{{ selected.resource }}</dd>
            <dt>{{ t('drawer.provider') }}</dt>
            <dd>{{ selected.provider }}</dd>
            <dt>{{ t('drawer.role') }}</dt>
            <dd>{{ selected.roleLabel || t('drawer.none') }}</dd>
            <dt>{{ t('drawer.user') }}</dt>
            <dd>{{ selected.userLabel }}</dd>
            <dt>{{ t('drawer.app') }}</dt>
            <dd>{{ selected.appLabel || t('drawer.none') }}</dd>
            <dt>{{ t('drawer.when') }}</dt>
            <dd>{{ selected.createdAt | date: 'medium' }}</dd>
          </dl>
        </div>

        <div class="drawer-section">
          <span class="df-eyebrow">{{ t('drawer.metrics') }}</span>
          <dl class="kv">
            <dt>{{ t('drawer.tokensIn') }}</dt>
            <dd class="df-numeric">{{ selected.inputTokens | number }}</dd>
            <dt>{{ t('drawer.tokensOut') }}</dt>
            <dd class="df-numeric">{{ selected.outputTokens | number }}</dd>
            <dt>{{ t('drawer.cost') }}</dt>
            <dd class="df-numeric">{{ usd(selected.costUsd) }}</dd>
            <dt>{{ t('drawer.latency') }}</dt>
            <dd class="df-numeric">{{ selected.latencyMs | number }} ms</dd>
          </dl>
        </div>

        <div class="drawer-section">
          <span class="df-eyebrow">{{ t('drawer.body') }}</span>
          <p class="hint">{{ t('drawer.bodyNote') }}</p>
        </div>
      </aside>
    </ng-container>
  `,
  styles: [
    `
      /* Token-only chrome (light/dark/phosphor come free), hairline
         separators, dense Meridian tables (no zebra, muted sticky headers,
         .df-numeric right-aligned). Warning amber is aliased locally per
         theme where no global --df-warning exists in light/dark. */
      .agents-page {
        --page-warning: #9a5b00;
        color: var(--df-text);
      }
      :host-context(.dark-theme) .agents-page {
        --page-warning: #ffb74d;
      }
      .head-actions {
        display: flex;
        align-items: center;
        gap: var(--df-space-2, 8px);
      }
      .live {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: var(--df-font-size-xs, 12px);
        color: var(--df-success);
        text-transform: uppercase;
        letter-spacing: var(--df-tracking-eyebrow, 0.04em);
      }
      .live-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: var(--df-success);
        box-shadow: 0 0 0 0 var(--df-success);
        animation: live-pulse 2s ease-out infinite;
      }
      @keyframes live-pulse {
        0% {
          box-shadow: 0 0 0 0
            color-mix(in srgb, var(--df-success) 60%, transparent);
        }
        70% {
          box-shadow: 0 0 0 5px transparent;
        }
        100% {
          box-shadow: 0 0 0 0 transparent;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .live-dot {
          animation: none;
        }
      }
      .refresh-icon {
        color: var(--df-text-muted);
      }
      .sub {
        color: var(--df-text-2);
        margin: 4px 0 16px;
        max-width: 720px;
      }
      .sub.tight {
        margin: 2px 0 0;
        font-size: var(--df-font-size-sm, 13px);
      }
      .sub2 {
        margin: 18px 0 6px;
        font-size: 1.5rem;
        font-weight: 600;
        letter-spacing: -0.01em;
      }
      .card {
        margin: 0 auto 16px;
        max-width: var(--df-content-max, 1120px);
        padding: 16px;
      }
      .card-head {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 12px;
        gap: 16px;
      }
      h2 {
        margin: 0;
        font-size: 1.6rem;
        font-weight: 600;
        letter-spacing: -0.01em;
      }
      .log-controls {
        display: flex;
        gap: var(--df-space-2, 8px);
        flex-shrink: 0;
      }
      .ctl {
        width: 140px;
      }
      .new-form {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        align-items: center;
        padding: 12px 0 4px;
        border-bottom: 1px solid var(--df-border-2);
        margin-bottom: 8px;
      }
      .new-form.edit {
        background: var(--df-surface-2);
        border: 1px solid var(--df-border-2);
        border-radius: var(--df-radius-sm);
        padding: 12px;
        border-bottom-width: 1px;
      }
      .new-form mat-form-field {
        min-width: 150px;
      }
      .new-form .grow {
        flex: 1;
        min-width: 200px;
      }
      .new-form .narrow {
        min-width: 110px;
        max-width: 130px;
      }
      .agent-block {
        border-top: 1px solid var(--df-border-2);
      }
      .agent-block:first-of-type {
        border-top: 0;
      }
      .row {
        display: flex;
        align-items: center;
        gap: 10px;
        min-height: 44px;
        padding: 4px 10px;
      }
      .row:hover {
        background: var(--df-hover);
      }
      .chevron {
        color: var(--df-text-muted);
      }
      .expand {
        padding: 4px 12px 16px 48px;
        background: var(--df-surface-2);
        border-top: 1px solid var(--df-border-2);
      }
      .expand-meta {
        display: flex;
        align-items: baseline;
        gap: 10px;
        margin: 10px 0 6px;
      }
      .spacer {
        flex: 1;
      }
      .muted {
        color: var(--df-text-muted);
      }
      .nowrap {
        white-space: nowrap;
      }
      .note {
        font-style: italic;
      }
      .df-eyebrow {
        font-size: var(--df-font-size-xs, 12px);
        font-weight: var(--df-font-weight-medium, 500);
        text-transform: uppercase;
        letter-spacing: var(--df-tracking-eyebrow, 0.04em);
        color: var(--df-text-muted);
      }
      .ttl,
      .key {
        font-size: 1.2rem;
      }
      .mono {
        font-family: var(--df-font-mono, 'SFMono-Regular', Menlo, monospace);
      }
      .key {
        background: var(--df-surface-2);
        border: 1px solid var(--df-border-2);
        padding: 2px 8px;
        border-radius: var(--df-radius-sm);
        font-family: var(--df-font-mono, 'SFMono-Regular', Menlo, monospace);
      }
      .hand {
        color: var(--df-warning, var(--page-warning));
      }
      .tag {
        background: var(--df-tint-ai-bg);
        color: var(--df-tint-ai-fg);
        padding: 2px 10px;
        border-radius: var(--df-radius-sm);
        font-size: 1.2rem;
      }
      /* ---- tables (Meridian: no zebra, muted sticky headers) ---- */
      .log-scroll {
        overflow-x: auto;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th,
      td {
        text-align: left;
        padding: 10px 8px;
        border-top: 1px solid var(--df-border-2);
      }
      th {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--df-text-muted);
        border-top: 0;
        border-bottom: 1px solid var(--df-border);
        position: sticky;
        top: 0;
        background: var(--df-surface);
        z-index: 1;
      }
      th.num,
      td.num {
        text-align: right;
      }
      .df-numeric {
        font-variant-numeric: tabular-nums;
        font-feature-settings: 'zero' 1;
      }
      .arrow {
        color: var(--df-text-muted);
      }
      tbody tr {
        height: 44px;
      }
      tbody tr:hover {
        background: var(--df-hover);
      }
      .log-row {
        cursor: pointer;
      }
      .log-row.active {
        background: var(--df-hover);
      }
      .log-row:focus-visible {
        outline: 2px solid var(--df-accent);
        outline-offset: -2px;
      }
      table.log td.mono {
        font-family: var(--df-font-mono, 'SFMono-Regular', Menlo, monospace);
        font-size: 1.25rem;
      }
      /* ---- detail drawer ---- */
      .drawer-scrim {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.32);
        z-index: 40;
      }
      .drawer {
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        width: min(420px, 92vw);
        background: var(--df-surface);
        border-left: 1px solid var(--df-border);
        box-shadow: var(--df-shadow-overlay, 0 8px 24px rgba(0, 0, 0, 0.18));
        z-index: 41;
        overflow-y: auto;
        padding: 16px 20px 32px;
        animation: drawer-in var(--df-duration-fast, 120ms)
          var(--df-ease-standard, ease) both;
      }
      @keyframes drawer-in {
        from {
          transform: translateX(8px);
          opacity: 0.6;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .drawer {
          animation: none;
        }
      }
      .drawer-head {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
        margin-bottom: 8px;
      }
      .drawer-head h3 {
        margin: 4px 0 0;
        font-size: 1.5rem;
        font-weight: 600;
      }
      .drawer-section {
        padding: 14px 0;
        border-top: 1px solid var(--df-border-2);
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin: 8px 0 6px;
      }
      .hint {
        color: var(--df-text-muted);
        font-size: var(--df-font-size-xs, 12px);
        margin: 6px 0 0;
      }
      dl.kv {
        display: grid;
        grid-template-columns: 40% 60%;
        gap: 6px 12px;
        margin: 10px 0 0;
      }
      dl.kv dt {
        color: var(--df-text-muted);
        font-size: var(--df-font-size-xs, 12px);
      }
      dl.kv dd {
        margin: 0;
        font-size: var(--df-font-size-sm, 13px);
        word-break: break-word;
      }
    `,
  ],
})
export class DfAgentsComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private usage = inject(UsageService);

  agents: Agent[] = [];
  requests: AccessRequest[] = [];
  roles: Named[] = [];
  users: Named[] = [];
  agentLog: AgentLogRow[] = [];
  saving = false;

  // request log (from real most_expensive_calls)
  calls: CallRow[] = [];
  filteredCalls: CallRow[] = [];
  callsLoading = true;
  statusFilter: 'all' | 'ok' | 'error' = 'all';
  range: TimeRange = '30d';
  selected: CallRow | null = null;

  // auto-poll
  polling = true;
  private pollHandle: ReturnType<typeof setInterval> | null = null;
  private readonly pollMs = 20000;

  expandedId: number | null = null;

  showNew = false;
  newAgent = {
    name: '',
    description: '',
    roleId: null as number | null,
    ownerId: null as number | null,
    keyTtlHours: 4,
  };

  editId: number | null = null;
  editAgent = {
    name: '',
    description: '',
    roleId: null as number | null,
    keyTtlHours: 4,
  };

  // pendingRequests / requestCount are bound in the template, so they run on
  // every change-detection pass. Derive both from `requests` once per data
  // load (the array ref only changes in refresh()) instead of re-filtering
  // per evaluation.
  private memoRequests: AccessRequest[] | null = null;
  private memoPendingRequests: AccessRequest[] = [];
  private memoRequestCounts = new Map<number, number>();

  private syncRequestViews(): void {
    if (this.memoRequests === this.requests) return;
    this.memoRequests = this.requests;
    this.memoPendingRequests = this.requests.filter(
      r => r.status === 'pending'
    );
    const counts = new Map<number, number>();
    for (const r of this.requests) {
      counts.set(r.agentId, (counts.get(r.agentId) ?? 0) + 1);
    }
    this.memoRequestCounts = counts;
  }

  get pendingRequests(): AccessRequest[] {
    this.syncRequestViews();
    return this.memoPendingRequests;
  }

  trackById = (_: number, item: { id: number }): number => item.id;

  ngOnInit(): void {
    this.http
      .get<{ resource: Named[] }>('/api/v2/system/role?fields=id,name')
      .subscribe(r => (this.roles = r.resource ?? []));
    this.http
      .get<{ resource: Named[] }>('/api/v2/system/user?fields=id,name')
      .subscribe(r => (this.users = r.resource ?? []));
    this.refresh();
    this.reloadUsage();
    this.pollHandle = setInterval(() => {
      this.refresh();
      this.reloadUsage();
    }, this.pollMs);
  }

  ngOnDestroy(): void {
    if (this.pollHandle) clearInterval(this.pollHandle);
  }

  refreshAll(): void {
    this.refresh();
    this.reloadUsage();
  }

  refresh(): void {
    this.http
      .get<{ resource: Agent[] }>('/api/v2/agents/agents?fields=*')
      .subscribe(r => (this.agents = r.resource ?? []));
    this.http
      .get<{ resource: AccessRequest[] }>('/api/v2/agents/requests?fields=*')
      .subscribe(r => (this.requests = r.resource ?? []));
    // The real per-action agent audit trail is the df-alerts log (agent
    // actions fire alerts by agent name). /_internal is NOT under /api, so the
    // caseInterceptor leaves these snake_case. Optional dependency: silent()
    // by design, the panel just renders empty when df-alerts is absent.
    this.http
      .get<{ resource: AgentLogRow[] }>('/_internal/alerts/log', {
        context: silent(),
      })
      .subscribe({
        next: r =>
          (this.agentLog = (r.resource ?? []).filter(l =>
            (l.event_name ?? '').startsWith('system.agent')
          )),
        error: () => (this.agentLog = []),
      });
  }

  // ---- request log -------------------------------------------------------
  // Every row is a real metered call from most_expensive_calls; the endpoint
  // has no fabricated data. Names are resolved from the same lookups the usage
  // dashboard uses; unknown ids fall back to "#N", never a made-up label.
  reloadUsage(): void {
    this.callsLoading = true;
    this.usage.loadAll(this.range).subscribe(bundle => {
      const raw: ExpensiveCallRowRaw[] = bundle.raw.most_expensive_calls ?? [];
      this.calls = raw.map(c => this.toCallRow(c, bundle));
      this.callsLoading = false;
      this.applyCallFilter();
    });
  }

  private toCallRow(c: ExpensiveCallRowRaw, bundle: UsageBundle): CallRow {
    const svc =
      c.service_id != null ? bundle.services.get(c.service_id) : undefined;
    return {
      id: c.id,
      provider: c.provider || '-',
      model: c.model || '-',
      resource: c.resource || '-',
      serviceLabel:
        svc?.label ||
        svc?.name ||
        (c.service_id != null ? `service #${c.service_id}` : '-'),
      userLabel:
        c.user_id != null
          ? (bundle.users.get(c.user_id) ?? `user #${c.user_id}`)
          : '-',
      roleId: c.role_id ?? null,
      roleLabel:
        c.role_id != null
          ? (bundle.roles.get(c.role_id) ?? `role #${c.role_id}`)
          : null,
      appLabel:
        c.app_id != null
          ? (bundle.apps.get(c.app_id) ?? `app #${c.app_id}`)
          : null,
      inputTokens: n(c.input_tokens),
      outputTokens: n(c.output_tokens),
      costUsd: n(c.cost_usd),
      latencyMs: n(c.latency_ms),
      status: c.status || 'ok',
      createdAt: c.created_at,
      ok: (c.status || 'ok').toLowerCase() === 'ok',
    };
  }

  applyCallFilter(): void {
    this.filteredCalls =
      this.statusFilter === 'all'
        ? this.calls
        : this.calls.filter(c => (this.statusFilter === 'ok' ? c.ok : !c.ok));
  }

  openCall(c: CallRow): void {
    this.selected = c;
  }
  closeCall(): void {
    this.selected = null;
  }

  usd(v: number): string {
    return formatUSD(v);
  }

  alertVariant(status: string): 'success' | 'danger' | 'warning' | 'neutral' {
    if (status === 'sent') return 'success';
    if (status === 'failed') return 'danger';
    if (status === 'throttled' || status === 'skipped') return 'warning';
    return 'neutral';
  }

  toggleExpand(id: number): void {
    this.expandedId = this.expandedId === id ? null : id;
  }

  // ---- lookups -----------------------------------------------------------
  roleName(id: number | null): string {
    return this.roles.find(r => r.id === id)?.name ?? (id ? 'role ' + id : '-');
  }
  agentName(id: number): string {
    return this.agents.find(a => a.id === id)?.name ?? 'agent ' + id;
  }
  requestCount(agentId: number): number {
    this.syncRequestViews();
    return this.memoRequestCounts.get(agentId) ?? 0;
  }
  maskKey(key: string): string {
    return key ? key.slice(0, 6) + '…' + key.slice(-4) : '-';
  }
  // Called per agent row per change-detection pass; cache the parsed expiry
  // timestamp per data load instead of allocating a Date on every call. The
  // Date.now() comparison stays live so keys still flip to expired over time.
  private memoAgents: Agent[] | null = null;
  private memoExpiresAt = new Map<number, number>();

  expired(a: Agent): boolean {
    if (!a.keyIssuedAt) return false;
    if (this.memoAgents !== this.agents) {
      this.memoAgents = this.agents;
      this.memoExpiresAt.clear();
    }
    let expiresAt = this.memoExpiresAt.get(a.id);
    if (expiresAt === undefined) {
      expiresAt = new Date(a.keyIssuedAt).getTime() + a.keyTtlHours * 3600_000;
      this.memoExpiresAt.set(a.id, expiresAt);
    }
    return Date.now() > expiresAt;
  }

  // ---- agent CRUD --------------------------------------------------------
  createAgent(): void {
    this.saving = true;
    this.http
      .post('/api/v2/agents/agents', { resource: [this.newAgent] })
      .subscribe({
        next: () => {
          this.saving = false;
          this.showNew = false;
          this.newAgent = {
            name: '',
            description: '',
            roleId: null,
            ownerId: null,
            keyTtlHours: 4,
          };
          this.refresh();
        },
        error: () => (this.saving = false),
      });
  }

  startEdit(a: Agent): void {
    this.editId = a.id;
    this.editAgent = {
      name: a.name,
      description: a.description ?? '',
      roleId: a.roleId,
      keyTtlHours: a.keyTtlHours,
    };
  }

  saveEdit(): void {
    if (this.editId === null) return;
    this.saving = true;
    this.http
      .patch(`/api/v2/agents/agents/${this.editId}`, this.editAgent)
      .subscribe({
        next: () => {
          this.saving = false;
          this.editId = null;
          this.refresh();
        },
        error: () => (this.saving = false),
      });
  }

  // Revoke = deactivate the key (the backing app is deactivated in lock-step,
  // so the key is rejected on the next request). Restore by toggling back on.
  toggleActive(a: Agent, active: boolean): void {
    this.http
      .patch(`/api/v2/agents/agents/${a.id}`, { isActive: active })
      .subscribe({
        next: () => (a.isActive = active),
        error: () => this.refresh(), // revert the toggle to server truth
      });
  }

  remove(a: Agent): void {
    if (!confirm(`Delete agent "${a.name}" and revoke its key?`)) return;
    this.http
      .delete(`/api/v2/agents/agents/${a.id}`)
      .subscribe(() => this.refresh());
  }

  // ---- request approval --------------------------------------------------
  resolve(q: AccessRequest, status: 'approved' | 'denied'): void {
    this.saving = true;
    this.http.patch(`/api/v2/agents/requests/${q.id}`, { status }).subscribe({
      next: () => {
        this.saving = false;
        this.refresh();
      },
      error: () => (this.saving = false),
    });
  }
}
