import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
              <mat-option *ngFor="let r of roles" [value]="r.id">{{
                r.name
              }}</mat-option>
            </mat-select></mat-form-field
          >
          <mat-form-field appearance="outline" *ngIf="users.length"
            ><mat-label>Owner</mat-label>
            <mat-select [(ngModel)]="newAgent.ownerId">
              <mat-option *ngFor="let u of users" [value]="u.id">{{
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
        <div class="row" *ngFor="let a of agents">
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
              <mat-option *ngFor="let r of roles" [value]="r.id">{{
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
        <div class="row" *ngFor="let q of pendingRequests">
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
            <tr *ngFor="let a of agents">
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
            <tr *ngFor="let l of agentLog">
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
      .agents-page {
        padding: 24px;
        max-width: 1080px;
      }
      .agents-head {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
      }
      h1 {
        margin: 0;
      }
      .sub {
        color: rgba(0, 0, 0, 0.6);
        margin: 4px 0 16px;
        max-width: 720px;
      }
      .sub2 {
        margin: 18px 0 6px;
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
      }
      .new-form {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        align-items: center;
        padding: 12px 0 4px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        margin-bottom: 8px;
      }
      .new-form.edit {
        background: rgba(0, 0, 0, 0.02);
        border-radius: 6px;
        padding: 12px;
        border-bottom: 0;
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
        padding: 8px 10px;
        border-top: 1px solid rgba(0, 0, 0, 0.06);
      }
      .row:first-of-type {
        border-top: 0;
      }
      .spacer {
        flex: 1;
      }
      .muted {
        color: rgba(0, 0, 0, 0.55);
      }
      .note {
        font-style: italic;
      }
      .ttl,
      .key {
        font-size: 0.85em;
      }
      .key {
        background: rgba(0, 0, 0, 0.05);
        padding: 2px 8px;
        border-radius: 6px;
      }
      .hand {
        color: #e0a341;
      }
      .tag {
        background: #eef;
        color: #336;
        padding: 2px 10px;
        border-radius: 12px;
      }
      .sev-warning {
        background: #fde8c8;
        color: #8a5a00;
      }
      .badge {
        background: #e0e0e0;
        color: #555;
        padding: 2px 10px;
        border-radius: 12px;
        font-size: 0.85em;
      }
      .badge.on,
      .status-sent {
        background: #d7f0d7;
        color: #1a7f1a;
      }
      .status-failed {
        background: #fcd6d6;
        color: #a11;
      }
      .status-throttled,
      .status-skipped {
        background: #fdebc8;
        color: #8a5a00;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th,
      td {
        text-align: left;
        padding: 10px 8px;
        border-top: 1px solid rgba(0, 0, 0, 0.06);
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

  get pendingRequests(): AccessRequest[] {
    return this.requests.filter(r => r.status === 'pending');
  }

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
    // caseInterceptor leaves these snake_case. Optional dependency — ignore errors.
    this.http
      .get<{ resource: AgentLogRow[] }>('/_internal/alerts/log')
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
    return this.roles.find(r => r.id === id)?.name ?? (id ? 'role ' + id : '—');
  }
  agentName(id: number): string {
    return this.agents.find(a => a.id === id)?.name ?? 'agent ' + id;
  }
  requestCount(agentId: number): number {
    return this.requests.filter(r => r.agentId === agentId).length;
  }
  maskKey(key: string): string {
    return key ? key.slice(0, 6) + '…' + key.slice(-4) : '—';
  }
  expired(a: Agent): boolean {
    if (!a.keyIssuedAt) return false;
    const expiresAt =
      new Date(a.keyIssuedAt).getTime() + a.keyTtlHours * 3600_000;
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
