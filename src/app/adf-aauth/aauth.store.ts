/**
 * Shared state for the AAuth page. The shell provides one instance; every
 * tab injects it. Writes are optimistic: the UI moves first, the server
 * confirms, and a failure rolls back with a single error toast. A
 * per-target sequence stops a slow response from undoing a newer write.
 */
import { Injectable, OnDestroy, inject } from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';
import { Observable, Subscription, forkJoin, switchMap, timer } from 'rxjs';
import { DfSnackbarService } from 'src/app/shared/services/df-snackbar.service';
import { isAppError, normalizeError } from 'src/app/shared/utilities/app-error';
import { DfAauthApiService } from './aauth-api.service';
import {
  AauthAgent,
  AauthGrant,
  AauthOverview,
  AauthScope,
  ActivityRow,
  HttpMethod,
  PersonServer,
  PersonServerPatch,
  PlaygroundRun,
  ScopePatch,
} from './aauth.types';
import { SCOPE_RE } from './jwt-view';

/** Tab slices that load on their own and can fail on their own. */
export type AauthSlice = 'servers' | 'agents' | 'activity' | 'grants';

export const ACTIVITY_PAGE = 100;
export const POLL_MS = 2000;
/** Consecutive failed polls before a run is given up on. */
const POLL_RETRIES = 5;
export const DEFAULT_PATH = '/api/v2/sales/_table/orders?limit=5';

export function errorMessage(e: unknown): string {
  return (isAppError(e) ? e : normalizeError(e)).message;
}

@Injectable()
export class AauthStore implements OnDestroy {
  private api = inject(DfAauthApiService);
  private snackbar = inject(DfSnackbarService);
  private transloco = inject(TranslocoService);

  overview: AauthOverview | null = null;
  scopes: AauthScope[] | null = null;
  servers: PersonServer[] | null = null;
  agents: AauthAgent[] | null = null;
  activity: ActivityRow[] | null = null;
  grants: AauthGrant[] | null = null;

  loading = true;
  loadFailed = false;
  loadError: string | null = null;
  readonly failed = new Set<AauthSlice>();
  enabledSaving = false;
  addingServer = false;
  activityHasMore = false;
  activityLoadingOlder = false;
  activityRefreshing = false;

  /**
   * Scopes tab row order, fixed when the list loads (enabled first, then
   * by role name), so a row never jumps away while it is being edited.
   */
  scopeOrder: number[] = [];

  // Try it
  method: HttpMethod = 'GET';
  path = DEFAULT_PATH;
  body = '';
  run: PlaygroundRun | null = null;
  sending = false;
  private pollSub?: Subscription;
  private pollFailures = 0;
  private polling = false;

  private seq = new Map<string, number>();

  private nextSeq(key: string): number {
    const n = (this.seq.get(key) ?? 0) + 1;
    this.seq.set(key, n);
    return n;
  }

  private isLatest(key: string, n: number): boolean {
    return this.seq.get(key) === n;
  }

  t(key: string, params?: Record<string, unknown>): string {
    return this.transloco.translate(`aauth.${key}`, params);
  }

  get enabledScopes(): AauthScope[] {
    return (this.scopes ?? []).filter(s => s.enabled);
  }

  // ----------------------------------------------------------------- load

  load(): void {
    this.loading = true;
    this.loadError = null;
    forkJoin({
      overview: this.api.overview(),
      scopes: this.api.scopes(),
    }).subscribe({
      next: ({ overview, scopes }) => {
        this.overview = overview;
        this.setScopes(scopes);
        this.loading = false;
        this.loadFailed = false;
      },
      error: e => {
        this.loading = false;
        this.loadFailed = true;
        const err = isAppError(e) ? e : normalizeError(e);
        this.loadError = err.status === 503 ? err.message : null;
      },
    });
  }

  private setScopes(scopes: AauthScope[]): void {
    this.scopes = scopes;
    this.scopeOrder = [...scopes]
      .sort(
        (a, b) =>
          Number(b.enabled) - Number(a.enabled) ||
          a.roleName.localeCompare(b.roleName)
      )
      .map(s => s.roleId);
  }

  /** Quiet re-read so the tab counts follow writes. */
  refreshOverview(): void {
    this.api.overview(true).subscribe({
      next: o => (this.overview = o),
      error: () => undefined,
    });
  }

  setEnabled(enabled: boolean): void {
    const o = this.overview;
    if (!o || this.enabledSaving || o.enabled === enabled) return;
    if (enabled && !o.issuerOk) return;
    this.enabledSaving = true;
    o.enabled = enabled;
    this.api.setEnabled(enabled).subscribe({
      next: res => {
        this.enabledSaving = false;
        this.overview = res;
        this.toast(enabled ? 'toast.enabled' : 'toast.disabled');
      },
      error: e => {
        this.enabledSaving = false;
        o.enabled = !enabled;
        this.fail(e);
      },
    });
  }

  // --------------------------------------------------------------- scopes

  /**
   * Returns false (and warns) when a new scope name is invalid or taken;
   * the caller keeps the editor open then.
   */
  updateScope(roleId: number, patch: ScopePatch): boolean {
    const row = this.scopes?.find(s => s.roleId === roleId);
    if (!row) return false;
    if (patch.scope !== undefined) {
      const name = patch.scope.trim();
      if (!SCOPE_RE.test(name)) {
        this.warn('scopes.invalid');
        return false;
      }
      if (
        (this.scopes ?? []).some(s => s.roleId !== roleId && s.scope === name)
      ) {
        this.warn('scopes.taken', { scope: name });
        return false;
      }
      patch = { ...patch, scope: name };
    }
    const before: AauthScope = { ...row };
    Object.assign(row, patch);
    const key = `scope:${roleId}`;
    const n = this.nextSeq(key);
    this.api.updateScope(roleId, patch).subscribe({
      next: res => {
        if (!this.isLatest(key, n)) return;
        if (res && typeof res === 'object') Object.assign(row, res);
        if (patch.enabled !== undefined) this.refreshOverview();
      },
      error: e => {
        if (!this.isLatest(key, n)) return;
        Object.assign(row, before);
        this.fail(e);
      },
    });
    return true;
  }

  // ------------------------------------------------------- person servers

  loadServers(quiet = false): void {
    this.api.personServers(quiet).subscribe({
      next: s => {
        this.servers = s;
        this.failed.delete('servers');
      },
      error: () => this.failed.add('servers'),
    });
  }

  addServer(issuer: string, done: () => void): void {
    const value = issuer.trim().replace(/\/+$/, '');
    if (!value || this.addingServer) return;
    this.addingServer = true;
    this.api.addPersonServer(value).subscribe({
      next: row => {
        this.addingServer = false;
        this.servers = [...(this.servers ?? []), row];
        this.toast('toast.serverAdded', { name: row.name || row.issuer });
        this.refreshOverview();
        done();
      },
      error: e => {
        this.addingServer = false;
        this.fail(e);
      },
    });
  }

  updateServer(id: number, patch: PersonServerPatch): void {
    const row = this.servers?.find(s => s.id === id);
    if (!row) return;
    const before: PersonServer = { ...row, scopes: [...row.scopes] };
    Object.assign(row, patch);
    const key = `ps:${id}`;
    const n = this.nextSeq(key);
    this.api.updatePersonServer(id, patch).subscribe({
      next: res => {
        if (!this.isLatest(key, n)) return;
        if (res && typeof res === 'object') Object.assign(row, res);
      },
      error: e => {
        if (!this.isLatest(key, n)) return;
        Object.assign(row, before);
        this.fail(e);
      },
    });
  }

  deleteServer(id: number): void {
    const list = this.servers ?? [];
    const index = list.findIndex(s => s.id === id);
    if (index < 0 || list[index].isLocal) return;
    const row = list[index];
    this.servers = list.filter(s => s.id !== id);
    this.api.deletePersonServer(id).subscribe({
      next: () => {
        this.toast('toast.serverRemoved', { name: row.name || row.issuer });
        this.refreshOverview();
      },
      error: e => {
        const now = [...(this.servers ?? [])];
        now.splice(Math.min(index, now.length), 0, row);
        this.servers = now;
        this.fail(e);
      },
    });
  }

  // --------------------------------------------------------------- agents

  loadAgents(quiet = false): void {
    this.api.agents(quiet).subscribe({
      next: a => {
        this.agents = a;
        this.failed.delete('agents');
      },
      error: () => this.failed.add('agents'),
    });
  }

  setAgentBlocked(id: number, blocked: boolean): void {
    const row = this.agents?.find(a => a.id === id);
    if (!row) return;
    const before = row.status;
    row.status = blocked ? 'blocked' : 'allowed';
    const key = `agent:${id}`;
    const n = this.nextSeq(key);
    this.api.setAgentStatus(id, row.status).subscribe({
      next: res => {
        if (!this.isLatest(key, n)) return;
        if (res && typeof res === 'object') Object.assign(row, res);
        this.toast(blocked ? 'toast.agentBlocked' : 'toast.agentAllowed', {
          name: row.name || row.agentId,
        });
      },
      error: e => {
        if (!this.isLatest(key, n)) return;
        row.status = before;
        this.fail(e);
      },
    });
  }

  // ------------------------------------------------------------- activity

  loadActivity(): void {
    if (this.activityRefreshing) return;
    this.activityRefreshing = true;
    this.api.activity(ACTIVITY_PAGE).subscribe({
      next: rows => {
        this.activityRefreshing = false;
        this.activity = rows;
        this.activityHasMore = rows.length >= ACTIVITY_PAGE;
        this.failed.delete('activity');
      },
      error: () => {
        this.activityRefreshing = false;
        this.failed.add('activity');
      },
    });
  }

  loadOlderActivity(): void {
    const rows = this.activity;
    if (!rows?.length || this.activityLoadingOlder) return;
    this.activityLoadingOlder = true;
    const beforeId = rows[rows.length - 1].id;
    this.api.activity(ACTIVITY_PAGE, beforeId).subscribe({
      next: older => {
        this.activityLoadingOlder = false;
        const seen = new Set(rows.map(r => r.id));
        this.activity = [...rows, ...older.filter(r => !seen.has(r.id))];
        this.activityHasMore = older.length >= ACTIVITY_PAGE;
      },
      error: () => (this.activityLoadingOlder = false),
    });
  }

  // --------------------------------------------------------------- grants

  loadGrants(quiet = false): void {
    this.api.grants(quiet).subscribe({
      next: g => {
        this.grants = g;
        this.failed.delete('grants');
      },
      error: () => this.failed.add('grants'),
    });
  }

  revokeGrant(id: number): void {
    const list = this.grants ?? [];
    const index = list.findIndex(g => g.id === id);
    if (index < 0) return;
    const row = list[index];
    this.grants = list.filter(g => g.id !== id);
    this.api.revokeGrant(id).subscribe({
      next: () => {
        this.toast('toast.grantRevoked');
        this.refreshOverview();
      },
      error: e => {
        const now = [...(this.grants ?? [])];
        now.splice(Math.min(index, now.length), 0, row);
        this.grants = now;
        this.fail(e);
      },
    });
  }

  // ---------------------------------------------------------- playground

  get runActive(): boolean {
    return this.run?.status === 'running' || this.run?.status === 'waiting';
  }

  get bodyAllowed(): boolean {
    return ['POST', 'PATCH', 'PUT'].includes(this.method);
  }

  send(): void {
    if (this.sending) return;
    const path = this.normalizedPath();
    if (!path) return;
    if (this.bodyAllowed && this.body.trim()) {
      try {
        JSON.parse(this.body);
      } catch {
        this.warn('try.badJson');
        return;
      }
    }
    this.stopPolling();
    this.sending = true;
    this.api
      .playgroundSend({
        method: this.method,
        path,
        ...(this.bodyAllowed && this.body.trim() ? { body: this.body } : {}),
      })
      .subscribe({
        next: run => {
          this.sending = false;
          this.applyRun(run);
          this.startPolling();
        },
        error: e => {
          this.sending = false;
          this.fail(e);
        },
      });
  }

  /** "api/v2/x" and "/api/v2/x" both become "/api/v2/x". */
  normalizedPath(): string {
    const p = this.path.trim();
    if (!p) return '';
    return p.startsWith('/') ? p : `/${p}`;
  }

  reset(): void {
    this.stopPolling();
    this.api.playgroundReset().subscribe({
      next: () => {
        this.run = null;
        this.toast('toast.reset');
      },
      error: e => this.fail(e),
    });
  }

  private applyRun(run: PlaygroundRun): void {
    this.run = {
      ...run,
      steps: Array.isArray(run?.steps) ? run.steps : [],
    };
  }

  /** Polls `advance` every 2 s while the run is running or waiting. */
  startPolling(): void {
    this.polling = true;
    this.pollFailures = 0;
    this.schedulePoll();
  }

  stopPolling(): void {
    this.polling = false;
    this.pollSub?.unsubscribe();
    this.pollSub = undefined;
  }

  private schedulePoll(): void {
    this.pollSub?.unsubscribe();
    const run = this.run;
    if (!this.polling || !run || !this.runActive) return;
    this.pollSub = timer(POLL_MS)
      .pipe(switchMap(() => this.advance(run.runId)))
      .subscribe({
        next: next => {
          if (this.run?.runId !== run.runId) return;
          this.pollFailures = 0;
          this.applyRun(next);
          this.schedulePoll();
        },
        error: e => {
          if (this.run?.runId !== run.runId) return;
          if (++this.pollFailures >= POLL_RETRIES) {
            this.run = { ...run, status: 'failed', error: errorMessage(e) };
            this.polling = false;
            return;
          }
          this.schedulePoll();
        },
      });
  }

  private advance(runId: string): Observable<PlaygroundRun> {
    return this.api.playgroundAdvance(runId);
  }

  // -------------------------------------------------------------- helpers

  toast(key: string, params?: Record<string, unknown>): void {
    this.snackbar.openSnackBar(this.t(key, params), 'success');
  }

  warn(key: string, params?: Record<string, unknown>): void {
    this.snackbar.openSnackBar(this.t(key, params), 'warning');
  }

  fail(e: unknown): void {
    this.snackbar.openError(isAppError(e) ? e : normalizeError(e));
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }
}
