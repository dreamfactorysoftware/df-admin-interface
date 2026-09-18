import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { TranslocoModule } from '@ngneat/transloco';
import { Subject, forkJoin, of, switchMap, takeUntil } from 'rxjs';
import { DfBadgeComponent } from 'src/app/shared/components/df-badge/df-badge.component';
import { DfMcpAccessComponent } from '../df-mcp-access/df-mcp-access.component';
import { DfMcpExposureGridComponent } from '../df-mcp-exposure-grid/df-mcp-exposure-grid.component';
import {
  CatalogSource,
  DfMcpApiService,
  McpAccess,
  McpApp,
  McpHealth,
  McpRole,
  McpUsage,
} from '../df-mcp-api.service';
import {
  ADMIN_IDENTITY,
  CONNECT_CLIENTS,
  CatalogShape,
  ConnectClient,
  DEFAULT_BYTES_PER_TOOL,
  FACADE_TOOLS,
  LAZY_THRESHOLD_BYTES,
  McpBackend,
  McpConfig,
  McpIdentity,
  callsByBackend,
  componentsByServiceName,
  connectSnippet,
  formatKb,
  formatTokens,
  grantsByService,
  maskFromVerbNames,
  shapeCatalog,
  shapeFixedCatalog,
  tokensPerTurn,
  verbsByServiceName,
} from '../mcp-model';

export interface IdentityOption {
  key: string;
  label: string;
  identity: McpIdentity;
}

interface UsageRow {
  label: string;
  calls: number;
  lastUsed: string | null;
}

/**
 * df-mcp-exposure — the MCP server page body: what the server exposes,
 * previewed as one identity, who can connect, modes, connect snippets.
 *
 * Composed into df-service-details behind its `isMcp` branch. The host
 * owns the form: this component binds the config controls it is given
 * (exposedServices, lazyMode, toolStyle, allowApiKeyAuth, requireRoleAccess,
 * allowWrites) and mutates the shared `disabledTools` set, so the host's
 * existing save path persists everything unchanged.
 *
 * `preview` (the create-flow review step) renders from inputs only: no
 * access, health or usage calls, and backends come from the host.
 */
@Component({
  selector: 'df-mcp-exposure',
  standalone: true,
  templateUrl: './df-mcp-exposure.component.html',
  styleUrls: ['./df-mcp-exposure.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    TranslocoModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTooltipModule,
    DfBadgeComponent,
    DfMcpExposureGridComponent,
    DfMcpAccessComponent,
  ],
})
export class DfMcpExposureComponent implements OnInit, OnChanges, OnDestroy {
  @Input() serviceId: number | null = null;
  @Input({ required: true }) serviceName = '';
  @Input() serviceLabel = '';
  @Input() systemMcp = false;
  @Input({ required: true }) config!: FormGroup;
  @Input({ required: true }) disabledTools = new Set<string>();
  @Input() customTools: string[] = [];
  @Input() fixedTools: string[] = [];
  /** exposed_services.values from the type schema; null = all DB/file. */
  @Input() attachableNames: string[] | null = null;
  @Input() preview = false;
  /** Preview mode only: the host supplies the backends. */
  @Input() backends: McpBackend[] = [];
  /** Preview mode only: roles the create flow will grant. */
  @Input() previewRoles: McpRole[] = [];

  @Output() identityChange = new EventEmitter<McpIdentity>();

  readonly clients = CONNECT_CLIENTS;
  readonly facadeTools = FACADE_TOOLS;
  readonly thresholdKb = formatKb(LAZY_THRESHOLD_BYTES);

  loading = false;
  roles: McpRole[] = [];
  apps: McpApp[] = [];
  access: McpAccess | null = null;
  health: McpHealth | null = null;
  healthChecked = false;
  usage: McpUsage | null = null;
  serviceNameById: Record<number, string> = {};

  identities: IdentityOption[] = [];
  identityKey = 'admin';
  identity: McpIdentity = ADMIN_IDENTITY;

  shape!: CatalogShape;
  bytesPerTool = DEFAULT_BYTES_PER_TOOL;
  catalogSource: CatalogSource = 'estimate';
  private rpcCalibrated = false;
  private rpcToolCount: number | null = null;
  /** Tool count the server itself reported (rpc/catalog), for reconciliation. */
  serverToolCount: number | null = null;

  client: ConnectClient = 'claude';
  copied = false;

  private destroy$ = new Subject<void>();
  private formSub$ = new Subject<void>();
  /** Bumped on every (re)load so a late response for another server is dropped. */
  private loadSeq = 0;

  constructor(private api: DfMcpApiService) {}

  ngOnInit(): void {
    this.bindForm();
    this.recompute();
    if (!this.preview) this.load();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config'] && !changes['config'].firstChange) this.bindForm();
    const switched =
      (changes['serviceId'] && !changes['serviceId'].firstChange) ||
      (changes['serviceName'] && !changes['serviceName'].firstChange);
    if (switched) {
      // Route param change between two MCP servers: the component instance
      // is reused, so drop the previous server's preview before loading.
      this.resetPreview();
      if (!this.preview) this.load();
      return;
    }
    if (changes['backends'] || changes['previewRoles']) {
      if (this.preview) {
        this.roles = this.previewRoles;
        this.buildIdentities();
      }
      this.recompute();
    }
  }

  ngOnDestroy(): void {
    this.formSub$.next();
    this.formSub$.complete();
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Back to "Any admin" with nothing loaded, as on first render. */
  private resetPreview(): void {
    this.loadSeq++;
    this.identityKey = 'admin';
    this.identity = ADMIN_IDENTITY;
    this.identities = [];
    this.roles = [];
    this.apps = [];
    this.access = null;
    this.health = null;
    this.healthChecked = false;
    this.usage = null;
    this.serviceNameById = {};
    if (!this.preview) this.backends = [];
    this.bytesPerTool = DEFAULT_BYTES_PER_TOOL;
    this.catalogSource = 'estimate';
    this.rpcCalibrated = false;
    this.rpcToolCount = null;
    this.serverToolCount = null;
    this.identityChange.emit(this.identity);
    this.recompute();
  }

  private bindForm(): void {
    this.formSub$.next();
    this.config.valueChanges
      .pipe(takeUntil(this.formSub$), takeUntil(this.destroy$))
      .subscribe(() => this.recompute());
  }

  // ----------------------------------------------------------- config

  control(name: string): FormControl | null {
    return (this.config.get(name) as FormControl | null) ?? null;
  }

  has(name: string): boolean {
    return !!this.config.get(name);
  }

  get cfg(): McpConfig {
    const val = (name: string, fallback: unknown) => {
      const c = this.config.get(name);
      return c && c.value != null ? c.value : fallback;
    };
    return {
      exposedServices: (val('exposedServices', []) as string[]) ?? [],
      disabledTools: Array.from(this.disabledTools),
      lazyMode: val('lazyMode', 'auto') as McpConfig['lazyMode'],
      toolStyle:
        val('toolStyle', 'prefixed') === 'merged' ? 'merged' : 'prefixed',
      allowWrites: val('allowWrites', true) !== false,
      allowApiKeyAuth: val('allowApiKeyAuth', false) === true,
      requireRoleAccess: val('requireRoleAccess', false) === true,
    };
  }

  setMode(name: string, value: unknown): void {
    const c = this.control(name);
    if (!c) return;
    c.setValue(value);
    c.markAsDirty();
  }

  toggleExposed(name: string): void {
    const c = this.control('exposedServices');
    if (!c) return;
    const cur: string[] = Array.isArray(c.value) ? c.value : [];
    c.setValue(
      cur.includes(name) ? cur.filter(n => n !== name) : [...cur, name]
    );
    c.markAsDirty();
  }

  toggleCell(key: string): void {
    if (this.disabledTools.has(key)) this.disabledTools.delete(key);
    else this.disabledTools.add(key);
    this.recompute();
  }

  recompute(): void {
    const cfg = this.cfg;
    this.shape = this.systemMcp
      ? shapeFixedCatalog(cfg, this.fixedTools, this.bytesPerTool)
      : shapeCatalog(
          cfg,
          this.backends,
          this.identity,
          this.customTools,
          this.bytesPerTool
        );
  }

  // ------------------------------------------------------------- load

  private load(): void {
    if (this.serviceId == null) return;
    this.loading = true;
    const seq = ++this.loadSeq;
    forkJoin({
      backends: this.systemMcp
        ? of([] as McpBackend[])
        : this.api.attachableBackends(this.attachableNames),
      roles: this.api.roles(),
      apps: this.api.apps(),
      access: this.api.access(this.serviceName),
      names: this.api.serviceNames(),
      usage: this.api.usage(this.serviceId),
      health: this.api.health(),
      rpc: this.systemMcp ? of(null) : this.api.rpcToolsList(this.serviceName),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe(r => {
        if (seq !== this.loadSeq) return;
        this.backends = r.backends;
        this.roles = r.roles;
        this.apps = r.apps;
        this.access = r.access;
        this.serviceNameById = r.names;
        this.usage = r.usage;
        this.health = r.health;
        this.healthChecked = true;
        if (r.rpc) {
          this.rpcCalibrated = true;
          this.rpcToolCount = r.rpc.names.length;
          this.serverToolCount = r.rpc.names.length;
          this.bytesPerTool = Math.round(r.rpc.bytes / r.rpc.names.length);
          this.catalogSource = 'rpc';
        }
        this.loading = false;
        this.buildIdentities();
        this.recompute();
        this.calibrateFromCatalog();
      });
  }

  /** Reload access + roles after the access panel writes a role. */
  reloadAccess(): void {
    if (this.serviceId == null) return;
    const seq = this.loadSeq;
    forkJoin({
      roles: this.api.roles(),
      apps: this.api.apps(),
      access: this.api.access(this.serviceName),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe(r => {
        if (seq !== this.loadSeq) return;
        this.roles = r.roles;
        this.apps = r.apps;
        this.access = r.access;
        this.buildIdentities();
        this.selectIdentity(this.identityKey);
      });
  }

  /**
   * mcp-catalog: the server's own preview for a role or key. Real bytes and
   * count calibrate the estimate; `backends[].verbs` replaces the reach we
   * derived from role rows, and component-scoped backends are labelled
   * "limited to <components>" rather than marking every tool denied.
   * Admins have no preview (the endpoint needs a role), so they keep the
   * tools/list calibration.
   */
  private calibrateFromCatalog(): void {
    if (this.serviceId == null) return;
    if (this.identity.kind === 'admin') {
      this.catalogSource = this.rpcCalibrated ? 'rpc' : 'estimate';
      this.serverToolCount = this.rpcToolCount;
      this.recompute();
      return;
    }
    const asked = this.identity;
    const seq = this.loadSeq;
    of(asked)
      .pipe(
        switchMap(id =>
          this.api.catalog(this.serviceName, {
            roleId: id.roleId,
            appId: id.appId,
          })
        ),
        takeUntil(this.destroy$)
      )
      .subscribe(cat => {
        if (this.identity !== asked || seq !== this.loadSeq) return;
        if (!cat || !cat.count) {
          this.catalogSource = this.rpcCalibrated ? 'rpc' : 'estimate';
          this.serverToolCount = null;
          return;
        }
        this.catalogSource = 'catalog';
        this.serverToolCount = cat.count;
        if (cat.bytes) this.bytesPerTool = Math.round(cat.bytes / cat.count);
        if (cat.backends) {
          const verbs: Record<string, number> = {};
          const components: Record<string, string[]> = {};
          for (const b of cat.backends) {
            verbs[b.name] = maskFromVerbNames(b.verbs ?? []);
            if (b.component_scoped && b.components?.length) {
              components[b.name] = b.components;
            }
          }
          this.identity = { ...asked, verbs, components };
        }
        this.recompute();
      });
  }

  // --------------------------------------------------------- identity

  private buildIdentities(): void {
    const opts: IdentityOption[] = [
      { key: 'admin', label: '', identity: ADMIN_IDENTITY },
    ];
    const rolesById = new Map(this.roles.map(r => [r.id, r]));
    const seen = new Set<number>();
    const listed: Array<{ id: number; name: string }> = [];
    for (const r of this.access?.roles ?? []) {
      listed.push({ id: r.role_id, name: r.name });
    }
    if (this.serviceId != null) {
      for (const r of this.roles) {
        if (
          r.rows.some(x => x.serviceId === this.serviceId && x.verbMask > 0)
        ) {
          listed.push({ id: r.id, name: r.name });
        }
      }
    }
    for (const r of this.previewRoles) listed.push({ id: r.id, name: r.name });
    for (const r of listed) {
      if (seen.has(r.id)) continue;
      seen.add(r.id);
      const role = rolesById.get(r.id);
      const verbs = role
        ? verbsByServiceName(role.rows, this.serviceNameById)
        : {};
      const components = role
        ? componentsByServiceName(role.rows, this.serviceNameById)
        : {};
      opts.push({
        key: `role:${r.id}`,
        label: r.name,
        identity: {
          kind: 'role',
          roleId: r.id,
          roleName: r.name,
          verbs,
          components,
        },
      });
      for (const app of this.apps.filter(a => a.roleId === r.id)) {
        opts.push({
          key: `app:${app.id}`,
          label: app.name,
          identity: {
            kind: 'app',
            roleId: r.id,
            roleName: r.name,
            appId: app.id,
            appName: app.name,
            apiKey: app.apiKey ?? undefined,
            verbs,
            components,
          },
        });
      }
    }
    this.identities = opts;
    if (!opts.some(o => o.key === this.identityKey)) this.identityKey = 'admin';
  }

  selectIdentity(key: string): void {
    this.identityKey = key;
    this.identity =
      this.identities.find(o => o.key === key)?.identity ?? ADMIN_IDENTITY;
    this.identityChange.emit(this.identity);
    this.recompute();
    this.calibrateFromCatalog();
  }

  previewRole(roleId: number): void {
    this.selectIdentity(`role:${roleId}`);
  }

  /** Backends the previewed role reaches nowhere (its note text). */
  get identityNoteKey(): string {
    if (this.identity.kind === 'admin') return 'admin';
    if (this.systemMcp) return 'roleSystem';
    return this.shape.dbs.length + this.shape.files.length === 0
      ? 'roleNoData'
      : 'role';
  }

  // ------------------------------------------------------------ tiles

  get endpointUrl(): string {
    return this.api.endpointUrl(this.serviceName);
  }

  get tokens(): string {
    return formatTokens(tokensPerTurn(this.shape));
  }

  get fullKb(): string {
    return formatKb(this.shape.bytes);
  }

  get facadeKb(): string {
    return formatKb(this.shape.facadeBytes);
  }

  barWidth(bytes: number): number {
    const max = Math.max(this.shape.bytes, LAZY_THRESHOLD_BYTES);
    return Math.max(2, Math.round((bytes / max) * 100));
  }

  get modeReasonKey(): string {
    const cfg = this.cfg;
    if (cfg.lazyMode === 'on') return 'forcedOn';
    if (cfg.lazyMode === 'off') return 'forcedOff';
    return this.shape.lazy ? 'autoOver' : 'autoUnder';
  }

  get grantedRoleCount(): number {
    return (this.access?.roles ?? []).filter(r => r.granted).length;
  }

  get keyCount(): number {
    const granted = new Set(
      (this.access?.roles ?? []).filter(r => r.granted).map(r => r.role_id)
    );
    return this.apps.filter(a => a.roleId != null && granted.has(a.roleId))
      .length;
  }

  get healthVariant(): 'success' | 'warning' | 'danger' | 'neutral' {
    if (!this.health) return 'neutral';
    const s = (this.health.status || '').toLowerCase();
    if (s === 'ok' || s === 'healthy' || s === 'pass') return 'success';
    if (s === 'warn' || s === 'warning' || s === 'degraded') return 'warning';
    return 'danger';
  }

  get healthMessage(): string {
    if (!this.health) return '';
    const bad = this.health.checks?.find(
      c => (c.status || '').toLowerCase() !== 'ok' && c.message
    );
    return bad?.message ?? '';
  }

  get exampleTool(): string {
    return this.cfg.toolStyle === 'merged' || this.systemMcp
      ? 'get_table_data'
      : `${this.shape.dbs[0]?.name ?? 'db'}_get_table_data`;
  }

  // ---------------------------------------------------------- connect

  get snippet(): string {
    return connectSnippet(this.client, {
      name: this.serviceName,
      url: this.endpointUrl,
      apiKey:
        this.identity.kind === 'app' && this.cfg.allowApiKeyAuth
          ? (this.identity.apiKey ?? `<${this.identity.appName} key>`)
          : null,
    });
  }

  copySnippet(): void {
    navigator.clipboard?.writeText(this.snippet).then(() => {
      this.copied = true;
      setTimeout(() => (this.copied = false), 1500);
    });
  }

  // ------------------------------------------------------------ usage

  get usageRows(): UsageRow[] {
    const byTool = this.usage?.by_tool ?? [];
    const lastUsed =
      [...(this.usage?.series ?? [])]
        .filter(s => s.requests > 0)
        .map(s => s.date)
        .sort()
        .pop() ?? null;
    if (this.systemMcp) {
      return byTool
        .slice()
        .sort((a, b) => b.requests - a.requests)
        .slice(0, 8)
        .map(t => ({ label: t.tool_name, calls: t.requests, lastUsed }));
    }
    const exposed = this.backends.filter(b =>
      this.cfg.exposedServices.includes(b.name)
    );
    const { perBackend, merged } = callsByBackend(byTool, exposed);
    const rows = exposed.map(b => ({
      label: b.label,
      calls: perBackend[b.name] ?? 0,
      lastUsed: perBackend[b.name] ? lastUsed : null,
    }));
    if (merged > 0) {
      rows.push({ label: '', calls: merged, lastUsed });
    }
    return rows;
  }

  /** Roles the access panel needs: grants collapsed per service. */
  grantsFor(role: McpRole) {
    return grantsByService(role.rows);
  }

  trackByKey(_: number, o: { key: string }): string {
    return o.key;
  }

  trackByName(_: number, o: { name: string }): string {
    return o.name;
  }
}
