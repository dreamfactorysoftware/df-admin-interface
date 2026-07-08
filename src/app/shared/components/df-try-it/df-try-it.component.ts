import {
  Component,
  EventEmitter,
  Input,
  NgZone,
  OnInit,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslocoModule } from '@ngneat/transloco';

import { DfBadgeComponent } from '../df-badge/df-badge.component';
import { DfUserDataService } from 'src/app/shared/services/df-user-data.service';
import { BASE_URL } from 'src/app/shared/constants/urls';
import {
  API_KEY_HEADER,
  SESSION_TOKEN_HEADER,
} from 'src/app/shared/constants/http-headers';

export type TryItMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** A single editable query-param or header row in the request builder. */
export interface TryItKeyValue {
  key: string;
  value: string;
  enabled: boolean;
}

/** The identity a request is fired under. `session` is the current admin;
 *  every other identity is a real API key (bound to a role), so switching to
 *  it re-fires the exact request under that role's RBAC scope. */
export interface TryItIdentity {
  id: string;
  label: string;
  type: 'session' | 'key';
  apiKey?: string;
  roleName?: string;
  readOnly?: boolean;
}

/** Emitted after every send so a host (e.g. a Recent Requests tab) can log it. */
export interface TryItResult {
  method: string;
  url: string;
  status: number;
  ok: boolean;
  durationMs: number;
  sizeBytes: number;
  identity: string;
}

interface TryItResponseView {
  status: number;
  statusText: string;
  ok: boolean;
  durationMs: number;
  sizeBytes: number;
  isJson: boolean;
  bodyPretty: string;
  bodyRaw: string;
}

interface RoleAccess {
  verbMask?: number;
  verb_mask?: number;
}

interface RoleRow {
  id: number;
  name: string;
  roleServiceAccessByRoleId?: RoleAccess[];
  role_service_access_by_role_id?: RoleAccess[];
}

interface AppRow {
  name: string;
  apiKey?: string;
  api_key?: string;
  roleId?: number;
  role_id?: number;
  isActive?: boolean;
  is_active?: boolean;
}

const VERB_GET = 1;

/**
 * df-try-it — the reusable request console.
 *
 * Supersedes the auth-only `df-api-tester`: a full method + path + headers +
 * body builder that fires live HTTP against the running DreamFactory instance,
 * shows status / time / size with a pretty/raw toggle, generates a runnable
 * curl / Python / JS snippet from the ACTUAL composed request, and carries the
 * Test-as-identity switcher that re-fires under a chosen API key (= its role's
 * scope) and dims the fields that identity is denied.
 *
 * Tokens only, no literals (phosphor-safe). Composes `df-badge` for status.
 * Reused on the service workbench Try-it tab, the API docs right column, and
 * the AI "generate a test" flow.
 */
@Component({
  selector: 'df-try-it',
  standalone: true,
  templateUrl: './df-try-it.component.html',
  styleUrls: ['./df-try-it.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatMenuModule,
    MatButtonToggleModule,
    MatProgressSpinnerModule,
    TranslocoModule,
    DfBadgeComponent,
  ],
})
export class DfTryItComponent implements OnInit {
  /** HTTP verb. */
  @Input() method: TryItMethod = 'GET';
  /** Path appended to `baseUrl`, e.g. `/_table/employees`. */
  @Input() path = '';
  /** Service base, e.g. `/api/v2/mysql`. Falls back to the instance API root. */
  @Input() baseUrl = '';
  /** Optional API key. When set it seeds the auth header; otherwise the current
   *  session token is used. */
  @Input() apiKey?: string;
  /** Optional service name; when provided the identity switcher lists the keys
   *  scoped to it (and, resolvable via role, their read-only status). */
  @Input() serviceName?: string;
  /** Initial request body (string or object). */
  @Input() set body(value: string | object | undefined) {
    if (value == null) {
      return;
    }
    this.bodyText =
      typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  }
  /** Emits after each send. Feeds a host-owned request log. */
  @Output() sent = new EventEmitter<TryItResult>();

  readonly methods: TryItMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

  params: TryItKeyValue[] = [{ key: '', value: '', enabled: true }];
  headers: TryItKeyValue[] = [{ key: '', value: '', enabled: true }];
  bodyText = '';

  identities: TryItIdentity[] = [];
  selectedIdentityId = 'session';

  viewMode: 'pretty' | 'raw' = 'pretty';
  snippetLang: 'curl' | 'python' | 'js' = 'curl';

  loading = false;
  response: TryItResponseView | null = null;
  errorMessage: string | null = null;

  /** Field names the broadest (session) identity saw, so a scoped identity's
   *  missing fields can be surfaced as denied. */
  private baselineFields: string[] = [];
  deniedFields: string[] = [];

  constructor(
    private http: HttpClient,
    private userData: DfUserDataService,
    private zone: NgZone
  ) {}

  ngOnInit(): void {
    this.identities = [
      { id: 'session', label: 'Session (you)', type: 'session' },
    ];
    if (this.apiKey) {
      this.identities.push({
        id: this.apiKey,
        label: 'Provided key',
        type: 'key',
        apiKey: this.apiKey,
      });
      this.selectedIdentityId = this.apiKey;
    }
    this.loadIdentities();
  }

  // ---- identity resolution ------------------------------------------------

  /** Load roles (to resolve names + read-only) and apps (real API keys). A key
   *  bound to a read-only role becomes the default identity so the console
   *  opens on the least-privileged view. */
  private loadIdentities(): void {
    const roles$ = this.http.get<{ resource: RoleRow[] }>(
      `${BASE_URL}/system/role`,
      {
        params: {
          fields: 'id,name',
          related: 'role_service_access_by_role_id',
          sort: 'name',
        },
      }
    );
    const apps$ = this.http.get<{ resource: AppRow[] }>(
      `${BASE_URL}/system/app`,
      { params: { fields: 'name,api_key,role_id,is_active' } }
    );

    roles$.subscribe({
      next: rolesRes => {
        const roleMeta = new Map<number, { name: string; readOnly: boolean }>();
        (rolesRes.resource ?? []).forEach(r => {
          const access =
            r.roleServiceAccessByRoleId ??
            r.role_service_access_by_role_id ??
            [];
          const readOnly =
            access.length > 0 &&
            access.every(a => {
              const mask = a.verbMask ?? a.verb_mask ?? 0;
              // read-only == GET bit only, no write bits set.
              return (mask & ~VERB_GET) === 0;
            });
          roleMeta.set(r.id, { name: r.name, readOnly });
        });

        apps$.subscribe({
          next: appsRes =>
            this.buildIdentities(appsRes.resource ?? [], roleMeta),
          error: () => undefined,
        });
      },
      error: () => undefined,
    });
  }

  private buildIdentities(
    apps: AppRow[],
    roleMeta: Map<number, { name: string; readOnly: boolean }>
  ): void {
    let readOnlyDefault: string | null = null;

    apps.forEach(app => {
      const key = app.apiKey ?? app.api_key;
      const active = app.isActive ?? app.is_active ?? true;
      if (!key || !active) {
        return;
      }
      if (this.identities.some(i => i.apiKey === key)) {
        return;
      }
      const roleId = app.roleId ?? app.role_id;
      const meta = roleId != null ? roleMeta.get(roleId) : undefined;
      const identity: TryItIdentity = {
        id: key,
        label: app.name,
        type: 'key',
        apiKey: key,
        roleName: meta?.name,
        readOnly: meta?.readOnly,
      };
      this.identities.push(identity);
      if (meta?.readOnly && !readOnlyDefault) {
        readOnlyDefault = key;
      }
    });

    // Default to a read-only identity when one exists and the caller did not
    // pin an explicit key.
    if (!this.apiKey && readOnlyDefault) {
      this.selectedIdentityId = readOnlyDefault;
    }
  }

  get selectedIdentity(): TryItIdentity {
    return (
      this.identities.find(i => i.id === this.selectedIdentityId) ??
      this.identities[0]
    );
  }

  onIdentityChange(): void {
    this.deniedFields = [];
  }

  // ---- request construction ----------------------------------------------

  private get effectiveBaseUrl(): string {
    if (this.baseUrl) {
      return this.baseUrl.replace(/\/+$/, '');
    }
    const svc = this.serviceName ? `/${this.serviceName}` : '';
    return `${window.location.origin}${BASE_URL}${svc}`;
  }

  private buildQuery(): string {
    const pairs = this.params
      .filter(p => p.enabled && p.key.trim())
      .map(
        p =>
          `${encodeURIComponent(p.key.trim())}=${encodeURIComponent(p.value)}`
      );
    return pairs.length ? `?${pairs.join('&')}` : '';
  }

  /** The exact URL the request will hit (used by send AND the snippets). */
  get requestUrl(): string {
    const base = this.effectiveBaseUrl;
    const path = this.path.startsWith('/') ? this.path : `/${this.path}`;
    return `${base}${this.path ? path : ''}${this.buildQuery()}`;
  }

  /** Auth + custom headers as a plain map, so send and the snippets agree. */
  get requestHeaders(): Record<string, string> {
    const out: Record<string, string> = {
      Accept: 'application/json',
    };
    if (this.methodHasBody) {
      out['Content-Type'] = 'application/json';
    }
    const identity = this.selectedIdentity;
    if (identity?.type === 'key' && identity.apiKey) {
      out[API_KEY_HEADER] = identity.apiKey;
    } else {
      const token = this.userData.token;
      if (token) {
        out[SESSION_TOKEN_HEADER] = token;
      }
    }
    this.headers
      .filter(h => h.enabled && h.key.trim())
      .forEach(h => (out[h.key.trim()] = h.value));
    return out;
  }

  get methodHasBody(): boolean {
    return (
      this.method === 'POST' || this.method === 'PUT' || this.method === 'PATCH'
    );
  }

  addParam(): void {
    this.params.push({ key: '', value: '', enabled: true });
  }

  removeParam(index: number): void {
    this.params.splice(index, 1);
    if (!this.params.length) {
      this.addParam();
    }
  }

  addHeader(): void {
    this.headers.push({ key: '', value: '', enabled: true });
  }

  removeHeader(index: number): void {
    this.headers.splice(index, 1);
    if (!this.headers.length) {
      this.addHeader();
    }
  }

  // ---- send ---------------------------------------------------------------

  send(): void {
    this.loading = true;
    this.errorMessage = null;
    this.deniedFields = [];

    const identity = this.selectedIdentity;
    const started = performance.now();

    // A scoped API key must fire OUTSIDE Angular's HttpClient. The
    // session-token interceptor force-injects the admin API key AND the admin
    // session token onto every /api request, so an HttpClient call would run
    // as the admin no matter which identity is picked — the switcher would be
    // theater. A raw fetch with credentials:'omit' carrying only the selected
    // key's header is the true, unprivileged request: a read-only role really
    // does 403 on DELETE, and the response panel shows the real boundary.
    if (identity?.type === 'key' && identity.apiKey) {
      void this.sendAsKey(started);
      return;
    }
    this.sendAsSession(started);
  }

  /** Admin path: HttpClient, interceptors attach the session token + admin key
   *  as usual. This is the normal, fully-privileged send. */
  private sendAsSession(started: number): void {
    const url = this.requestUrl;
    const headers = new HttpHeaders(this.requestHeaders);
    const outBody =
      this.methodHasBody && this.bodyText.trim() ? this.bodyText : undefined;

    this.http
      .request(this.method, url, {
        headers,
        body: outBody,
        observe: 'response',
        responseType: 'text',
      })
      .subscribe({
        next: res =>
          this.applyResult(
            res.status,
            res.statusText,
            true,
            res.body ?? '',
            started
          ),
        error: (err: HttpErrorResponse) => this.handleError(err, started),
      });
  }

  /** Scoped-identity path: a raw fetch that bypasses every interceptor. Only
   *  the selected key's `X-DreamFactory-API-Key` header is sent, and
   *  credentials:'omit' strips the admin session cookie, so the DreamFactory
   *  RBAC layer resolves the request purely from that key's role. */
  private async sendAsKey(started: number): Promise<void> {
    const url = this.requestUrl;
    const headers = this.requestHeaders; // key header, no session token
    const outBody =
      this.methodHasBody && this.bodyText.trim() ? this.bodyText : undefined;

    try {
      const res = await fetch(url, {
        method: this.method,
        headers,
        body: outBody,
        credentials: 'omit',
      });
      const raw = await res.text();
      this.zone.run(() =>
        this.applyResult(res.status, res.statusText, res.ok, raw, started)
      );
    } catch {
      this.zone.run(() => {
        const durationMs = Math.round(performance.now() - started);
        const view = this.toView(0, 'Error', false, durationMs, '');
        this.response = view;
        this.loading = false;
        this.errorMessage = 'Request could not reach the instance.';
        this.emitResult(view);
      });
    }
  }

  /** Shared result handler for both the HttpClient and fetch paths. */
  private applyResult(
    status: number,
    statusText: string,
    ok: boolean,
    raw: string,
    started: number
  ): void {
    const durationMs = Math.round(performance.now() - started);
    const view = this.toView(status, statusText, ok, durationMs, raw);
    this.response = view;
    this.loading = false;
    this.computeDenied(raw);
    this.emitResult(view);
  }

  private handleError(err: HttpErrorResponse, started: number): void {
    const durationMs = Math.round(performance.now() - started);
    // HttpClient with responseType:'text' delivers the error body as a string.
    const raw =
      typeof err.error === 'string'
        ? err.error
        : err.error != null
          ? JSON.stringify(err.error)
          : err.message;
    const status = err.status || 0;
    const view = this.toView(
      status,
      err.statusText || 'Error',
      false,
      durationMs,
      raw
    );
    this.response = view;
    this.loading = false;
    if (status === 0) {
      this.errorMessage = 'Request could not reach the instance.';
    }
    this.emitResult(view);
  }

  private toView(
    status: number,
    statusText: string,
    ok: boolean,
    durationMs: number,
    raw: string
  ): TryItResponseView {
    let pretty = raw;
    let isJson = false;
    try {
      pretty = JSON.stringify(JSON.parse(raw), null, 2);
      isJson = true;
    } catch {
      isJson = false;
    }
    const sizeBytes = new TextEncoder().encode(raw).length;
    return {
      status,
      statusText,
      ok: ok && status >= 200 && status < 300,
      durationMs,
      sizeBytes,
      isJson,
      bodyPretty: pretty,
      bodyRaw: raw,
    };
  }

  private emitResult(view: TryItResponseView): void {
    this.sent.emit({
      method: this.method,
      url: this.requestUrl,
      status: view.status,
      ok: view.ok,
      durationMs: view.durationMs,
      sizeBytes: view.sizeBytes,
      identity: this.selectedIdentity?.label ?? 'Session',
    });
  }

  // ---- field-level denial (provable scope) --------------------------------

  /** Session = broadest view; capture its field set as the baseline. A scoped
   *  identity that returns fewer fields has those fields denied by its role. */
  private computeDenied(raw: string): void {
    const fields = this.extractFields(raw);
    if (this.selectedIdentity?.type === 'session') {
      this.baselineFields = fields;
      this.deniedFields = [];
      return;
    }
    if (!this.baselineFields.length) {
      return;
    }
    const seen = new Set(fields);
    this.deniedFields = this.baselineFields.filter(f => !seen.has(f));
  }

  private extractFields(raw: string): string[] {
    try {
      const parsed = JSON.parse(raw);
      const records = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.resource)
          ? parsed.resource
          : [parsed];
      const set = new Set<string>();
      records
        .filter((r: unknown) => r && typeof r === 'object')
        .forEach((r: object) => Object.keys(r).forEach(k => set.add(k)));
      return [...set];
    } catch {
      return [];
    }
  }

  // ---- copy-as snippets (generated from the ACTUAL request) ---------------

  get snippet(): string {
    switch (this.snippetLang) {
      case 'python':
        return this.pythonSnippet();
      case 'js':
        return this.jsSnippet();
      default:
        return this.curlSnippet();
    }
  }

  private bodyForSnippet(): string | null {
    return this.methodHasBody && this.bodyText.trim()
      ? this.bodyText.trim()
      : null;
  }

  private curlSnippet(): string {
    const lines = [`curl -X ${this.method} '${this.requestUrl}'`];
    const headers = this.requestHeaders;
    Object.keys(headers).forEach(k => lines.push(`  -H '${k}: ${headers[k]}'`));
    const body = this.bodyForSnippet();
    if (body) {
      lines.push(`  -d '${body.replace(/'/g, "'\\''")}'`);
    }
    return lines.join(' \\\n');
  }

  private pythonSnippet(): string {
    const headers = this.requestHeaders;
    const headerLines = Object.keys(headers)
      .map(k => `    '${k}': '${headers[k]}',`)
      .join('\n');
    const body = this.bodyForSnippet();
    const bodyArg = body ? `, data=json.dumps(${body})` : '';
    const jsonImport = body ? 'import json\n' : '';
    return [
      `${jsonImport}import requests`,
      '',
      `url = '${this.requestUrl}'`,
      `headers = {\n${headerLines}\n}`,
      `resp = requests.request('${this.method}', url, headers=headers${bodyArg})`,
      'print(resp.status_code, resp.text)',
    ].join('\n');
  }

  private jsSnippet(): string {
    const headers = this.requestHeaders;
    const headerLines = Object.keys(headers)
      .map(k => `    '${k}': '${headers[k]}',`)
      .join('\n');
    const body = this.bodyForSnippet();
    const bodyLine = body ? `\n  body: JSON.stringify(${body}),` : '';
    return [
      `const resp = await fetch('${this.requestUrl}', {`,
      `  method: '${this.method}',`,
      `  headers: {\n${headerLines}\n  },${bodyLine}`,
      '});',
      'console.log(resp.status, await resp.text());',
    ].join('\n');
  }

  copySnippet(): void {
    void navigator.clipboard?.writeText(this.snippet);
  }

  copyResponse(): void {
    if (this.response) {
      void navigator.clipboard?.writeText(
        this.viewMode === 'pretty'
          ? this.response.bodyPretty
          : this.response.bodyRaw
      );
    }
  }

  get responseBody(): string {
    if (!this.response) {
      return '';
    }
    return this.viewMode === 'pretty'
      ? this.response.bodyPretty
      : this.response.bodyRaw;
  }

  /** True when the active identity is a scoped key and the instance refused the
   *  request (401/403). This is the boundary being proven on screen. */
  get isDenied(): boolean {
    const s = this.response?.status ?? 0;
    return (
      this.selectedIdentity?.type === 'key' && (s === 401 || s === 403)
    );
  }

  /** The role (or key) name to name in the denial message. */
  get deniedIdentityLabel(): string {
    const identity = this.selectedIdentity;
    return identity?.roleName ?? identity?.label ?? '';
  }

  get statusVariant(): 'success' | 'warning' | 'danger' | 'neutral' {
    const s = this.response?.status ?? 0;
    if (!s) {
      return 'danger';
    }
    if (s >= 200 && s < 300) {
      return 'success';
    }
    if (s === 401 || s === 403 || s >= 500) {
      return 'danger';
    }
    return 'warning';
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    }
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  trackByIndex(index: number): number {
    return index;
  }

  trackByIdentity(_index: number, i: TryItIdentity): string {
    return i.id;
  }

  trackByField(_index: number, f: string): string {
    return f;
  }
}
