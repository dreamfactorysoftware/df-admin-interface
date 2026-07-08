import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toastOff } from '../shared/utilities/http-contexts';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';

type Channel = {
  id: number;
  name: string;
  type: string;
  is_active: boolean;
  target: string;
};
type Rule = {
  id: number;
  name: string;
  event_pattern: string;
  channel: string;
  channel_id: number;
  severity: string;
  rate_limit_seconds: number;
  template_message: string;
  is_active: boolean;
};
type LogRow = {
  id: number;
  event_name: string;
  status: string;
  response_code: number | null;
  created_at: string;
};
type EventOpt = { label: string; pattern: string };

const CUSTOM = '__custom__';

/**
 * df-alerts admin UI: channels (with test), rules (create / edit / delete /
 * enable-toggle, friendly event picker, rate limit), and a filterable log.
 */
@Component({
  selector: 'df-alerts',
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
    MatCheckboxModule,
    MatSlideToggleModule,
    MatTooltipModule,
  ],
  template: `
    <div class="alerts-page">
      <div class="alerts-head">
        <div>
          <h1>Alerts</h1>
          <p class="sub">
            Real-time notifications when your APIs change, break, or are
            accessed.
          </p>
        </div>
        <button mat-stroked-button (click)="refresh()">
          <mat-icon>refresh</mat-icon> Refresh
        </button>
      </div>

      <mat-card class="card">
        <div class="card-head">
          <h2>Channels</h2>
          <button
            mat-stroked-button
            color="primary"
            (click)="showNewChannel = !showNewChannel">
            <mat-icon>add</mat-icon> New Channel
          </button>
        </div>
        <div class="new-form" *ngIf="showNewChannel">
          <mat-form-field appearance="outline"
            ><mat-label>Name</mat-label>
            <input
              matInput
              [(ngModel)]="newChannel.name"
              placeholder="Ops Slack"
          /></mat-form-field>
          <mat-form-field appearance="outline"
            ><mat-label>Type</mat-label>
            <mat-select [(ngModel)]="newChannel.type">
              <mat-option value="slack">Slack</mat-option>
              <mat-option value="webhook">Webhook</mat-option>
              <mat-option value="teams">Teams</mat-option>
              <mat-option value="pagerduty">PagerDuty</mat-option>
            </mat-select></mat-form-field
          >
          <mat-form-field appearance="outline" class="grow"
            ><mat-label>Webhook URL</mat-label>
            <input
              matInput
              [(ngModel)]="newChannel.url"
              placeholder="https://hooks.slack.com/services/..."
          /></mat-form-field>
          <button
            mat-flat-button
            color="primary"
            [disabled]="saving"
            (click)="createChannel()">
            Create
          </button>
        </div>
        <p class="muted" *ngIf="!channels.length">No channels configured.</p>
        <div class="row" *ngFor="let c of channels; trackBy: trackById">
          <span class="badge" [class.on]="c.is_active">{{
            c.is_active ? 'ACTIVE' : 'OFF'
          }}</span>
          <strong>{{ c.name }}</strong
          ><span class="tag">{{ c.type }}</span>
          <span class="muted target">{{ c.target }}</span>
          <span class="spacer"></span>
          <span class="muted test-res" *ngIf="testResult[c.id]">{{
            testResult[c.id]
          }}</span>
          <button
            mat-stroked-button
            (click)="testChannel(c)"
            [disabled]="testing[c.id]">
            <mat-icon>send</mat-icon> Test
          </button>
        </div>
      </mat-card>

      <mat-card class="card">
        <div class="card-head">
          <h2>Rules</h2>
          <button
            mat-stroked-button
            color="primary"
            (click)="showNewRule = !showNewRule">
            <mat-icon>add</mat-icon> New Rule
          </button>
        </div>

        <div class="new-form" *ngIf="showNewRule">
          <mat-form-field appearance="outline"
            ><mat-label>Name</mat-label>
            <input matInput [(ngModel)]="newRule.name" placeholder="Role watch"
          /></mat-form-field>
          <mat-form-field appearance="outline"
            ><mat-label>When this happens</mat-label>
            <mat-select
              [ngModel]="newChoice"
              (ngModelChange)="onNewEvent($event)">
              <mat-option
                *ngFor="let e of events; trackBy: trackByPattern"
                [value]="e.pattern"
                >{{
                e.label
              }}</mat-option>
              <mat-option [value]="CUSTOM">Custom pattern…</mat-option>
            </mat-select></mat-form-field
          >
          <mat-form-field appearance="outline" *ngIf="newChoice === CUSTOM"
            ><mat-label>Custom pattern</mat-label>
            <input
              matInput
              [(ngModel)]="newRule.event_pattern"
              placeholder="system.*"
          /></mat-form-field>
          <mat-form-field appearance="outline"
            ><mat-label>Send to</mat-label>
            <mat-select [(ngModel)]="newRule.channel_id">
              <mat-option
                *ngFor="let c of channels; trackBy: trackById"
                [value]="c.id"
                >{{
                c.name
              }}</mat-option>
            </mat-select></mat-form-field
          >
          <mat-form-field appearance="outline"
            ><mat-label>Severity</mat-label>
            <mat-select [(ngModel)]="newRule.severity">
              <mat-option value="info">info</mat-option>
              <mat-option value="warning">warning</mat-option>
              <mat-option value="critical">critical</mat-option>
            </mat-select></mat-form-field
          >
          <mat-form-field appearance="outline" class="narrow"
            ><mat-label>Rate limit (s)</mat-label>
            <input
              matInput
              type="number"
              min="0"
              [(ngModel)]="newRule.rate_limit_seconds"
              matTooltip="0 = no limit"
          /></mat-form-field>
          <div class="tpl-wrap">
            <mat-form-field appearance="outline" class="grow"
              ><mat-label>Message template (optional)</mat-label>
              <textarea
                matInput
                rows="2"
                [(ngModel)]="newRule.template_message"
                placeholder="Blank = rich default message"></textarea>
            </mat-form-field>
            <div class="hint">
              Variables: <code>{{ '{{event}}' }}</code>
              <code>{{ '{{entity}}' }}</code> <code>{{ '{{detail}}' }}</code>
              <code>{{ '{{actor}}' }}</code> <code>{{ '{{severity}}' }}</code>
              <code>{{ '{{time}}' }}</code>
            </div>
          </div>
          <button
            mat-flat-button
            color="primary"
            [disabled]="saving"
            (click)="createRule()">
            Create
          </button>
        </div>

        <p class="muted" *ngIf="!rules.length">No rules configured.</p>
        <ng-container *ngFor="let r of rules; trackBy: trackById">
          <div class="row sevbar-{{ r.severity }}" *ngIf="editId !== r.id">
            <mat-slide-toggle
              [checked]="r.is_active"
              (change)="toggleRule(r, $event.checked)"
              matTooltip="Enable / disable"></mat-slide-toggle>
            <strong>{{ r.name }}</strong>
            <span class="evt">{{ eventLabel(r.event_pattern) }}</span>
            <span class="tag sev-{{ r.severity }}">{{ r.severity }}</span>
            <span class="muted">&rarr; {{ r.channel }}</span>
            <span class="muted rl" *ngIf="r.rate_limit_seconds > 0"
              >⏱ {{ r.rate_limit_seconds }}s</span
            >
            <span class="spacer"></span>
            <button mat-icon-button (click)="startEdit(r)" matTooltip="Edit">
              <mat-icon>edit</mat-icon>
            </button>
            <button mat-icon-button (click)="remove(r)" matTooltip="Delete">
              <mat-icon>delete</mat-icon>
            </button>
          </div>
          <div class="new-form edit" *ngIf="editId === r.id">
            <mat-form-field appearance="outline"
              ><mat-label>Name</mat-label>
              <input matInput [(ngModel)]="editRule.name"
            /></mat-form-field>
            <mat-form-field appearance="outline"
              ><mat-label>When this happens</mat-label>
              <mat-select
                [ngModel]="editChoice"
                (ngModelChange)="onEditEvent($event)">
                <mat-option
                  *ngFor="let e of events; trackBy: trackByPattern"
                  [value]="e.pattern"
                  >{{
                  e.label
                }}</mat-option>
                <mat-option [value]="CUSTOM">Custom pattern…</mat-option>
              </mat-select></mat-form-field
            >
            <mat-form-field appearance="outline" *ngIf="editChoice === CUSTOM"
              ><mat-label>Custom pattern</mat-label>
              <input matInput [(ngModel)]="editRule.event_pattern"
            /></mat-form-field>
            <mat-form-field appearance="outline"
              ><mat-label>Send to</mat-label>
              <mat-select [(ngModel)]="editRule.channel_id">
                <mat-option
                  *ngFor="let c of channels; trackBy: trackById"
                  [value]="c.id"
                  >{{
                  c.name
                }}</mat-option>
              </mat-select></mat-form-field
            >
            <mat-form-field appearance="outline"
              ><mat-label>Severity</mat-label>
              <mat-select [(ngModel)]="editRule.severity">
                <mat-option value="info">info</mat-option>
                <mat-option value="warning">warning</mat-option>
                <mat-option value="critical">critical</mat-option>
              </mat-select></mat-form-field
            >
            <mat-form-field appearance="outline" class="narrow"
              ><mat-label>Rate limit (s)</mat-label>
              <input
                matInput
                type="number"
                min="0"
                [(ngModel)]="editRule.rate_limit_seconds"
            /></mat-form-field>
            <div class="tpl-wrap">
              <mat-form-field appearance="outline" class="grow"
                ><mat-label>Message template (optional)</mat-label>
                <textarea
                  matInput
                  rows="2"
                  [(ngModel)]="editRule.template_message"
                  placeholder="Blank = rich default message"></textarea>
              </mat-form-field>
              <div class="hint">
                Variables: <code>{{ '{{event}}' }}</code>
                <code>{{ '{{entity}}' }}</code> <code>{{ '{{detail}}' }}</code>
                <code>{{ '{{actor}}' }}</code> <code>{{ '{{severity}}' }}</code>
                <code>{{ '{{time}}' }}</code>
              </div>
            </div>
            <button
              mat-flat-button
              color="primary"
              [disabled]="saving"
              (click)="saveEdit()">
              Save
            </button>
            <button mat-button (click)="cancelEdit()">Cancel</button>
          </div>
        </ng-container>
      </mat-card>

      <mat-card class="card">
        <div class="card-head">
          <h2>Recent alerts <span class="muted">(log)</span></h2>
          <div class="log-filters">
            <mat-form-field appearance="outline" class="narrow">
              <mat-label>Status</mat-label>
              <mat-select [(ngModel)]="filterStatus">
                <mat-option value="all">All</mat-option>
                <mat-option value="sent">sent</mat-option>
                <mat-option value="failed">failed</mat-option>
                <mat-option value="throttled">throttled</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Filter events</mat-label>
              <input
                matInput
                [(ngModel)]="filterText"
                placeholder="role, service, user…" />
            </mat-form-field>
          </div>
        </div>
        <p class="muted" *ngIf="!filteredLog.length && !loading">
          No matching alerts.
        </p>
        <table *ngIf="filteredLog.length">
          <thead>
            <tr>
              <th>When</th>
              <th>Event</th>
              <th>Status</th>
              <th>Code</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let l of filteredLog; trackBy: trackById">
              <td class="muted">{{ l.created_at | date: 'short' }}</td>
              <td>{{ eventLabel(l.event_name) }}</td>
              <td>
                <span class="badge status-{{ l.status }}">{{ l.status }}</span>
              </td>
              <td>{{ l.response_code }}</td>
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
      .alerts-page {
        --page-warning: #9a5b00;
        padding: 24px;
        max-width: 1080px;
        color: var(--df-text);
      }
      :host-context(.dark-theme) .alerts-page {
        --page-warning: #ffb74d;
      }
      .alerts-head {
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
      }
      .new-form mat-form-field {
        min-width: 160px;
      }
      .new-form .grow {
        flex: 1;
        min-width: 240px;
      }
      .new-form .narrow {
        min-width: 110px;
        max-width: 130px;
      }
      .tpl-wrap {
        flex-basis: 100%;
      }
      .tpl-wrap .grow {
        width: 100%;
      }
      .hint {
        color: var(--df-text-muted);
        font-size: 1.2rem;
        margin-top: -8px;
      }
      .hint code {
        background: var(--df-surface-2);
        border: 1px solid var(--df-border-2);
        padding: 1px 5px;
        border-radius: var(--df-radius-sm);
        margin-right: 2px;
        font-family: 'SFMono-Regular', Menlo, Consolas, monospace;
      }
      .log-filters {
        display: flex;
        gap: 12px;
        align-items: center;
      }
      .log-filters .narrow {
        width: 130px;
      }
      .log-filters mat-form-field {
        margin-bottom: -1.25em;
      }
      .row {
        display: flex;
        align-items: center;
        gap: 10px;
        min-height: 44px;
        padding: 4px 10px;
        border-top: 1px solid var(--df-border-2);
        border-left: 3px solid transparent;
      }
      .row:hover {
        background: var(--df-hover);
      }
      .row:first-of-type {
        border-top: 0;
      }
      .row.sevbar-warning {
        border-left-color: var(--df-warning, var(--page-warning));
      }
      .row.sevbar-critical {
        border-left-color: var(--df-danger);
      }
      .row.sevbar-info {
        border-left-color: var(--df-accent);
      }
      .spacer {
        flex: 1;
      }
      .muted {
        color: var(--df-text-muted);
      }
      .rl {
        font-size: 1.2rem;
      }
      .test-res {
        font-size: 1.2rem;
      }
      .evt {
        background: var(--df-surface-2);
        border: 1px solid var(--df-border-2);
        color: var(--df-text-2);
        padding: 2px 10px;
        border-radius: var(--df-radius-sm);
        font-size: 1.2rem;
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
      .sev-critical {
        background: var(--df-danger-soft);
        color: var(--df-danger);
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
      .status-throttled {
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
export class DfAlertsComponent implements OnInit {
  private http = inject(HttpClient);
  readonly CUSTOM = CUSTOM;

  channels: Channel[] = [];
  rules: Rule[] = [];
  log: LogRow[] = [];
  events: EventOpt[] = [];
  loading = true;
  saving = false;
  testing: Record<number, boolean> = {};
  testResult: Record<number, string> = {};

  filterText = '';
  filterStatus = 'all';

  showNewRule = false;
  showNewChannel = false;
  newRule = {
    name: '',
    event_pattern: 'system.role.*',
    channel_id: null as number | null,
    severity: 'info',
    rate_limit_seconds: 0,
    template_message: '',
  };
  newChoice = 'system.role.*';
  newChannel = { name: '', type: 'slack', url: '' };

  editId: number | null = null;
  editRule = {
    name: '',
    event_pattern: '',
    channel_id: null as number | null,
    severity: 'info',
    rate_limit_seconds: 0,
    template_message: '',
    is_active: true,
  };
  editChoice = '';

  // filteredLog is bound in the template (*ngIf x2 + *ngFor), so the getter
  // runs on every change-detection pass. Memoize on its inputs and hand back
  // the same array ref until one of them changes; combined with trackBy this
  // keeps the log table from re-filtering and re-rendering per CD.
  private memoLog: LogRow[] | null = null;
  private memoFilterText: string | null = null;
  private memoFilterStatus: string | null = null;
  private memoEvents: EventOpt[] | null = null;
  private memoFilteredLog: LogRow[] = [];

  get filteredLog(): LogRow[] {
    if (
      this.memoLog !== this.log ||
      this.memoFilterText !== this.filterText ||
      this.memoFilterStatus !== this.filterStatus ||
      this.memoEvents !== this.events
    ) {
      this.memoLog = this.log;
      this.memoFilterText = this.filterText;
      this.memoFilterStatus = this.filterStatus;
      this.memoEvents = this.events;
      const t = this.filterText.trim().toLowerCase();
      this.memoFilteredLog = this.log.filter(
        l =>
          (this.filterStatus === 'all' || l.status === this.filterStatus) &&
          (!t ||
            this.eventLabel(l.event_name).toLowerCase().includes(t) ||
            l.event_name.toLowerCase().includes(t))
      );
    }
    return this.memoFilteredLog;
  }

  trackById = (_: number, item: { id: number }): number => item.id;
  trackByPattern = (_: number, e: EventOpt): string => e.pattern;

  ngOnInit(): void {
    this.http
      .get<{ resource: EventOpt[] }>('/_internal/alerts/events')
      .subscribe(r => (this.events = r.resource ?? []));
    this.refresh();
  }

  refresh(): void {
    this.loading = true;
    this.http
      .get<{ resource: Channel[] }>('/_internal/alerts/channels')
      .subscribe(r => {
        this.channels = r.resource ?? [];
        if (this.newRule.channel_id == null && this.channels.length)
          this.newRule.channel_id = this.channels[0].id;
      });
    this.http
      .get<{ resource: Rule[] }>('/_internal/alerts/rules')
      .subscribe(r => (this.rules = r.resource ?? []));
    this.http.get<{ resource: LogRow[] }>('/_internal/alerts/log').subscribe({
      next: r => {
        this.log = r.resource ?? [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  eventLabel(pattern: string): string {
    return this.events.find(e => e.pattern === pattern)?.label ?? pattern;
  }

  onNewEvent(choice: string): void {
    this.newChoice = choice;
    this.newRule.event_pattern = choice === CUSTOM ? '' : choice;
  }

  onEditEvent(choice: string): void {
    this.editChoice = choice;
    this.editRule.event_pattern = choice === CUSTOM ? '' : choice;
  }

  createRule(): void {
    this.saving = true;
    this.http.post('/_internal/alerts/rules', this.newRule).subscribe({
      next: () => {
        this.saving = false;
        this.showNewRule = false;
        this.newRule = {
          name: '',
          event_pattern: 'system.role.*',
          channel_id: this.channels[0]?.id ?? null,
          severity: 'info',
          rate_limit_seconds: 0,
          template_message: '',
        };
        this.newChoice = 'system.role.*';
        this.refresh();
      },
      error: () => (this.saving = false),
    });
  }

  startEdit(r: Rule): void {
    this.editId = r.id;
    this.editRule = {
      name: r.name,
      event_pattern: r.event_pattern,
      channel_id: r.channel_id,
      severity: r.severity,
      rate_limit_seconds: r.rate_limit_seconds ?? 0,
      template_message: r.template_message ?? '',
      is_active: r.is_active,
    };
    this.editChoice = this.events.some(e => e.pattern === r.event_pattern)
      ? r.event_pattern
      : CUSTOM;
  }

  cancelEdit(): void {
    this.editId = null;
  }

  saveEdit(): void {
    if (this.editId == null) return;
    this.saving = true;
    this.http
      .put(`/_internal/alerts/rules/${this.editId}`, this.editRule)
      .subscribe({
        next: () => {
          this.saving = false;
          this.editId = null;
          this.refresh();
        },
        error: () => (this.saving = false),
      });
  }

  toggleRule(r: Rule, active: boolean): void {
    this.http
      .put(`/_internal/alerts/rules/${r.id}`, { is_active: active })
      .subscribe(() => (r.is_active = active));
  }

  remove(r: Rule): void {
    this.http
      .delete(`/_internal/alerts/rules/${r.id}`)
      .subscribe(() => this.refresh());
  }

  testChannel(c: Channel): void {
    this.testing[c.id] = true;
    this.testResult[c.id] = '';
    this.http
      .post<{
        status: string;
        code?: number;
        message?: string;
      }>(
        `/_internal/alerts/channels/${c.id}/test`,
        {},
        // toast-off: the inline testResult marker is the error surface here.
        { context: toastOff() }
      )
      .subscribe({
        next: res => {
          this.testing[c.id] = false;
          this.testResult[c.id] =
            res.status === 'sent' ? '✓ sent' : `✗ ${res.message ?? res.status}`;
        },
        error: () => {
          this.testing[c.id] = false;
          this.testResult[c.id] = '✗ error';
        },
      });
  }

  createChannel(): void {
    this.saving = true;
    this.http.post('/_internal/alerts/channels', this.newChannel).subscribe({
      next: () => {
        this.saving = false;
        this.showNewChannel = false;
        this.newChannel = { name: '', type: 'slack', url: '' };
        this.refresh();
      },
      error: () => (this.saving = false),
    });
  }
}
