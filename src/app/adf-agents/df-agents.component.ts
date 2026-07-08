import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
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
 * Agents admin UI (AAN MVP): register/edit agents (role + key TTL, view/revoke
 * keys), approve or deny pending access requests, and an activity view (last
 * active + recent agent alerts). Mirrors the df-alerts self-contained pattern.
 */
@Component({
  selector: 'df-agents',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTooltipModule,
  ],
  template: `
    <div class="agents-page">
      <div class="agents-head">
        <div>
          <h1>Agents</h1>
          <p class="sub">
            AI agents with their own identity, a scoped role and short-lived API
            keys. The answer to "which agents have access to our data, and what
            are they doing with it?"
          </p>
        </div>
        <button mat-stroked-button (click)="refresh()">
          <mat-icon>refresh</mat-icon> Refresh
        </button>
      </div>

      <!-- ============ AGENTS ============ -->
      <mat-card class="card">
        <div class="card-head">
          <h2>Agents</h2>
          <button
            mat-stroked-button
            color="primary"
            (click)="showNew = !showNew">
            <mat-icon>add</mat-icon> New Agent
          </button>
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
                >{{
                r.name
              }}</mat-option>
            </mat-select></mat-form-field
          >
          <mat-form-field appearance="outline" *ngIf="users.length"
            ><mat-label>Owner</mat-label>
            <mat-select [(ngModel)]="newAgent.ownerId">
              <mat-option
                *ngFor="let u of users; trackBy: trackById"
                [value]="u.id"
                >{{
                u.name
              }}</mat-option>
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
              matTooltip="1–24 hours"
          /></mat-form-field>
          <button
            mat-flat-button
            color="primary"
            [disabled]="saving || !newAgent.name || !newAgent.roleId"
            (click)="createAgent()">
            Create
          </button>
        </div>

        <p class="muted" *ngIf="!agents.length">No agents yet.</p>
        <div class="row" *ngFor="let a of agents; trackBy: trackById">
          <span class="badge" [class.on]="a.isActive && !expired(a)">{{
            !a.isActive ? 'REVOKED' : expired(a) ? 'KEY EXPIRED' : 'ACTIVE'
          }}</span>
          <strong>{{ a.name }}</strong>
          <span class="tag">{{ roleName(a.roleId) }}</span>
          <span class="muted" *ngIf="a.description">{{ a.description }}</span>
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
                >{{
                r.name
              }}</mat-option>
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
            Pending access requests
            <span class="muted" *ngIf="pendingRequests.length"
              >({{ pendingRequests.length }})</span
            >
          </h2>
        </div>
        <p class="muted" *ngIf="!pendingRequests.length">
          No pending requests.
        </p>
        <div class="row" *ngFor="let q of pendingRequests; trackBy: trackById">
          <mat-icon class="hand">pan_tool</mat-icon>
          <strong>{{ agentName(q.agentId) }}</strong>
          <span class="muted">requests</span>
          <span class="tag sev-warning">{{
            (q.requestedOperations || []).join(', ') || 'any'
          }}</span>
          <span class="muted">on</span>
          <span class="tag">{{
            (q.requestedServices || []).join(', ') || 'unspecified'
          }}</span>
          <span class="muted note" *ngIf="q.note">“{{ q.note }}”</span>
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
          <h2>Agent activity</h2>
        </div>
        <table *ngIf="agents.length">
          <thead>
            <tr>
              <th>Agent</th>
              <th>Role</th>
              <th>Key</th>
              <th>Last active</th>
              <th>Requests</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let a of agents; trackBy: trackById">
              <td>
                <strong>{{ a.name }}</strong>
              </td>
              <td class="muted">{{ roleName(a.roleId) }}</td>
              <td>
                <span class="badge" [class.on]="a.isActive && !expired(a)">{{
                  !a.isActive ? 'revoked' : expired(a) ? 'expired' : 'active'
                }}</span>
              </td>
              <td class="muted">
                {{
                  a.lastActiveAt ? (a.lastActiveAt | date: 'short') : 'never'
                }}
              </td>
              <td class="muted">{{ requestCount(a.id) }}</td>
            </tr>
          </tbody>
        </table>

        <h3 class="sub2">Recent agent alerts</h3>
        <p class="muted" *ngIf="!agentLog.length">
          No agent alerts yet. (Requires df-alerts configured with a Slack
          channel.)
        </p>
        <table *ngIf="agentLog.length">
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
                <span class="badge status-{{ l.status }}">{{ l.status }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </mat-card>
    </div>
  `,
  styles: [
    `
      /* Departure treatment: token-only chrome (light/dark/phosphor come
         free), hairline separators, 6px corners, 11px uppercase table
         micro-headers, 44px rows. Warning amber is aliased locally per
         theme (no global --df-warning in light/dark); phosphor's token
         wins by construction. */
      .agents-page {
        --page-warning: #9a5b00;
        padding: 24px;
        max-width: 1080px;
        color: var(--df-text);
      }
      :host-context(.dark-theme) .agents-page {
        --page-warning: #ffb74d;
      }
      .agents-head {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
      }
      h1 {
        margin: 0;
        font-size: 2rem;
        font-weight: 600;
        letter-spacing: -0.02em;
      }
      .sub {
        color: var(--df-text-2);
        margin: 4px 0 16px;
        max-width: 720px;
      }
      .sub2 {
        margin: 18px 0 6px;
        font-size: 1.5rem;
        font-weight: 600;
        letter-spacing: -0.01em;
      }
      .card {
        margin-bottom: 16px;
        padding: 16px;
      }
      .card-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        gap: 16px;
      }
      h2 {
        margin: 0;
        font-size: 1.6rem;
        font-weight: 600;
        letter-spacing: -0.01em;
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
      .row {
        display: flex;
        align-items: center;
        gap: 10px;
        min-height: 44px;
        padding: 4px 10px;
        border-top: 1px solid var(--df-border-2);
      }
      .row:hover {
        background: var(--df-hover);
      }
      .row:first-of-type {
        border-top: 0;
      }
      .spacer {
        flex: 1;
      }
      .muted {
        color: var(--df-text-muted);
      }
      .note {
        font-style: italic;
      }
      .ttl,
      .key {
        font-size: 1.2rem;
      }
      .key {
        background: var(--df-surface-2);
        border: 1px solid var(--df-border-2);
        padding: 2px 8px;
        border-radius: var(--df-radius-sm);
        font-family: 'SFMono-Regular', Menlo, Consolas, monospace;
      }
      .hand {
        color: var(--df-warning, var(--page-warning));
      }
      .tag {
        background: var(--df-accent-soft);
        color: var(--df-accent-strong);
        padding: 2px 10px;
        border-radius: var(--df-radius-sm);
        font-size: 1.2rem;
      }
      .sev-warning {
        background: color-mix(
          in srgb,
          var(--df-warning, var(--page-warning)) 12%,
          transparent
        );
        color: var(--df-warning, var(--page-warning));
      }
      .badge {
        background: var(--df-surface-2);
        border: 1px solid var(--df-border-2);
        color: var(--df-text-2);
        padding: 2px 10px;
        border-radius: var(--df-radius-sm);
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }
      .badge.on,
      .status-sent {
        background: var(--df-success-soft);
        border-color: var(--df-success-border);
        color: var(--df-success);
      }
      .status-failed {
        background: var(--df-danger-soft);
        border-color: var(--df-danger-border);
        color: var(--df-danger);
      }
      .status-throttled,
      .status-skipped {
        background: color-mix(
          in srgb,
          var(--df-warning, var(--page-warning)) 12%,
          transparent
        );
        border-color: color-mix(
          in srgb,
          var(--df-warning, var(--page-warning)) 35%,
          transparent
        );
        color: var(--df-warning, var(--page-warning));
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
      }
      tbody tr {
        height: 44px;
      }
      tbody tr:hover {
        background: var(--df-hover);
      }
    `,
  ],
})
export class DfAgentsComponent implements OnInit {
  private http = inject(HttpClient);

  agents: Agent[] = [];
  requests: AccessRequest[] = [];
  roles: Named[] = [];
  users: Named[] = [];
  agentLog: AgentLogRow[] = [];
  saving = false;

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
