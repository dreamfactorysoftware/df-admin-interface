/**
 * Shared editor state for the MCP service page. The shell component owns one
 * instance and hands it to every tab; tabs mutate the draft config through
 * it and call touch(). All effective math funnels through effective().
 */
import { Subject } from 'rxjs';
import { SYSTEM_MCP_TOOLS } from '../adf-services/df-service-details/system-mcp-tools';
import {
  AccessState,
  CatalogStats,
  EffectiveBreakdown,
  McpHealth,
  ServerCatalog,
  catalogStats,
  McpBackendService,
  McpConfig,
  accessState,
  allKeys,
  effectiveTools,
  exposedRows,
  ExposedRow,
  isWriteCapableCustomTool,
  keyBelongsTo,
  orphanedKeys,
  parseMcpConfig,
  readOnlyKeys,
  serviceFraction,
  ServiceFraction,
  toolKey,
} from './mcp-effective';

export type McpServiceType = 'mcp' | 'system_mcp';

export interface McpServiceRecord {
  id: number;
  name: string;
  label: string;
  description: string;
  isActive: boolean;
  type: McpServiceType;
  /** Raw camelCased service row from the resolver, for save spreads. */
  raw: any;
}

function cloneCfg(c: McpConfig): McpConfig {
  return {
    ...c,
    exposedServices: [...c.exposedServices],
    disabledTools: new Set(c.disabledTools),
    redirectUris: [...c.redirectUris],
    customTools: (c.customTools ?? []).map((t: any) => ({ ...t })),
    rest: { ...c.rest },
  };
}

function cfgFingerprint(c: McpConfig): string {
  return JSON.stringify({
    e: [...c.exposedServices],
    d: [...c.disabledTools].sort(),
    s: c.toolStyle,
    l: c.lazyMode,
    k: c.allowApiKeyAuth,
    w: c.allowWrites,
    rr: c.requireRoleAccess,
    ci: c.oauthClientId,
    cs: c.oauthClientSecret,
    lu: c.customLoginUrl,
    ao: c.autoOauthService,
    r: [...c.redirectUris],
    ct: c.customTools,
  });
}

/** Memoized derivations, all invalidated together by a version bump. */
interface McpStoreMemo {
  effective?: EffectiveBreakdown;
  savedEffective?: EffectiveBreakdown;
  rows?: ExposedRow[];
  orphans?: string[];
  totalTools?: number;
  savedTotalTools?: number;
  catalogStats?: CatalogStats;
}

/** Who the server catalog is previewed as; empty = the admin (server maximum). */
export interface McpPreviewIdentity {
  roleId?: number;
  appId?: number;
}

export class McpEditorStore {
  service!: McpServiceRecord;
  /** Draft the tabs edit. */
  cfg!: McpConfig;
  /** Last-saved state, for dirty/delta math. */
  savedCfg!: McpConfig;
  /** Draft identity fields (Settings tab). */
  draftName = '';
  draftLabel = '';
  draftDescription = '';
  draftIsActive = true;

  /**
   * Monotonic edit counter, bumped by touch(). The memoized derivations
   * below key on it, so every mutation path must end in touch() (they all
   * do — the mutators here, and the tabs' direct-cfg writes).
   */
  private _version = 0;
  private memoVersion = -1;
  private memo: McpStoreMemo = {};

  get version(): number {
    return this._version;
  }

  private memoFor(): McpStoreMemo {
    if (this.memoVersion !== this._version) {
      this.memo = {};
      this.memoVersion = this._version;
    }
    return this.memo;
  }

  private _backendServices: McpBackendService[] = [];
  /** All instance services the daemon could serve (db/file), from the API. */
  get backendServices(): McpBackendService[] {
    return this._backendServices;
  }
  set backendServices(v: McpBackendService[]) {
    this._backendServices = v;
    this.touch(); // the memoized derivations depend on the service list
  }
  backendLoaded = false;

  /** First-run (arrived with ?created=1). */
  created = false;
  checklistDismissed = false;
  copiedUrl = false;
  copiedClient = false;
  /** One-shot amber banner on Connect after connection-affecting saves. */
  reconnectBanner = false;
  /**
   * API key created from the Access section this visit, shown once. Connect
   * snippets fill it in place of YOUR_API_KEY; never persisted.
   */
  createdApiKey: string | null = null;

  readonly changes = new Subject<void>();

  /** /_internal/ai/mcp-health report; null until loaded or when unavailable. */
  health: McpHealth | null = null;
  healthChecked = false;
  /** The server's own catalog numbers for the SAVED config (null = unavailable). */
  serverCatalog: ServerCatalog | null = null;
  previewIdentity: McpPreviewIdentity = {};
  /** Set by the shell: refetches serverCatalog for previewIdentity. */
  reloadServerCatalog: () => void = () => undefined;

  /**
   * Preview the server catalog as a role or app key (mcp-catalog), or as
   * the admin with {}. Role preview UI calls this; numbers land in
   * serverCatalog and flow through catalogStats().
   */
  setPreviewIdentity(identity: McpPreviewIdentity): void {
    this.previewIdentity = { ...identity };
    this.serverCatalog = null;
    this.touch();
    this.reloadServerCatalog();
  }

  setServerCatalog(c: ServerCatalog | null): void {
    this.serverCatalog = c;
    this.touch();
  }

  init(service: McpServiceRecord, rawConfig: any): void {
    this.service = service;
    this.cfg = parseMcpConfig(rawConfig);
    this.savedCfg = cloneCfg(this.cfg);
    this.draftName = service.name;
    this.draftLabel = service.label;
    this.draftDescription = service.description;
    this.draftIsActive = service.isActive;
    // Transient page state must not leak across same-route service
    // switches (the shell re-inits this store on every resolver emission).
    this.created = false;
    this.checklistDismissed = false;
    this.copiedUrl = false;
    this.copiedClient = false;
    this.reconnectBanner = false;
    this.createdApiKey = null;
    this.touch();
  }

  get isSystemMcp(): boolean {
    return this.service?.type === 'system_mcp';
  }

  touch(): void {
    this._version++;
    this.changes.next();
  }

  dirty(): boolean {
    return (
      cfgFingerprint(this.cfg) !== cfgFingerprint(this.savedCfg) ||
      this.draftName !== this.service.name ||
      this.draftLabel !== this.service.label ||
      this.draftDescription !== this.service.description ||
      this.draftIsActive !== this.service.isActive
    );
  }

  /** True when the pending changes alter what connected clients must know. */
  connectionAffecting(): boolean {
    return (
      this.draftName !== this.service.name ||
      this.cfg.allowApiKeyAuth !== this.savedCfg.allowApiKeyAuth ||
      // The daemon registers tools at connect: clients must reconnect.
      this.cfg.allowWrites !== this.savedCfg.allowWrites ||
      this.cfg.toolStyle !== this.savedCfg.toolStyle ||
      this.cfg.oauthClientSecret !== this.savedCfg.oauthClientSecret ||
      JSON.stringify(this.cfg.redirectUris) !==
        JSON.stringify(this.savedCfg.redirectUris)
    );
  }

  markSaved(): void {
    this.savedCfg = cloneCfg(this.cfg);
    this.service.name = this.draftName;
    this.service.label = this.draftLabel;
    this.service.description = this.draftDescription;
    this.service.isActive = this.draftIsActive;
    this.touch();
  }

  discard(): void {
    this.cfg = cloneCfg(this.savedCfg);
    this.draftName = this.service.name;
    this.draftLabel = this.service.label;
    this.draftDescription = this.service.description;
    this.draftIsActive = this.service.isActive;
    this.touch();
  }

  /* ------------ derived shortcuts (all funnel through mcp-effective) --- */
  /* effective/rows/totals are memoized on the version counter: the templates
   * call them many times per change-detection pass, and at 84 services the
   * uncached math alone blows the frame budget. access()/fraction() stay
   * uncached — they are cheap per row. */
  effective(): EffectiveBreakdown {
    const m = this.memoFor();
    return (m.effective ??= effectiveTools(this.cfg, this.backendServices));
  }
  savedEffective(): EffectiveBreakdown {
    const m = this.memoFor();
    return (m.savedEffective ??= effectiveTools(
      this.savedCfg,
      this.backendServices
    ));
  }
  /**
   * The number every header/tab/delta surface shows. For system_mcp the
   * catalog is the fixed System API tool list (disabled by bare name);
   * effectiveTools() only knows the data-plane catalog.
   */
  totalTools(): number {
    const m = this.memoFor();
    return (m.totalTools ??= this.isSystemMcp
      ? SYSTEM_MCP_TOOLS.filter(t => !this.cfg.disabledTools.has(t.name)).length
      : this.effective().total);
  }
  savedTotalTools(): number {
    const m = this.memoFor();
    return (m.savedTotalTools ??= this.isSystemMcp
      ? SYSTEM_MCP_TOOLS.filter(t => !this.savedCfg.disabledTools.has(t.name))
          .length
      : this.savedEffective().total);
  }
  /**
   * Catalog size / lazy decision / tokens per turn. The server's numbers
   * while the draft matches what is saved; the simulation over
   * totalTools() once the form is dirty or the endpoint failed.
   */
  catalogStats(): CatalogStats {
    const m = this.memoFor();
    return (m.catalogStats ??= catalogStats(
      this.totalTools(),
      this.cfg.lazyMode,
      this.serverCatalog,
      this.dirty()
    ));
  }
  rows(): ExposedRow[] {
    const m = this.memoFor();
    return (m.rows ??= exposedRows(this.cfg, this.backendServices));
  }
  fraction(svc: McpBackendService): ServiceFraction {
    return serviceFraction(svc, this.cfg.disabledTools);
  }
  access(svc: McpBackendService): AccessState {
    return accessState(svc, this.cfg.disabledTools);
  }
  orphans(): string[] {
    const m = this.memoFor();
    return (m.orphans ??= orphanedKeys(
      this.cfg,
      this.backendServices,
      // system_mcp disables tools by bare System API name — never orphans.
      this.isSystemMcp ? SYSTEM_MCP_TOOLS.map(t => t.name) : []
    ));
  }
  /** Kind of the live backend service, for key-ownership checks. */
  private kindOf(name: string): McpBackendService['kind'] | undefined {
    return this._backendServices.find(s => s.name === name)?.kind;
  }

  /* ------------ mutations ------------ */
  isToolEnabled(serviceName: string, verb: string): boolean {
    return !this.cfg.disabledTools.has(toolKey(serviceName, verb));
  }
  setTool(serviceName: string, verb: string, enabled: boolean): void {
    const k = toolKey(serviceName, verb);
    enabled ? this.cfg.disabledTools.delete(k) : this.cfg.disabledTools.add(k);
    this.touch();
  }
  /** Bare-name tools (globals/aggregators) share the same disabled list. */
  isBareToolEnabled(verb: string): boolean {
    return !this.cfg.disabledTools.has(verb);
  }
  setBareTool(verb: string, enabled: boolean): void {
    enabled
      ? this.cfg.disabledTools.delete(verb)
      : this.cfg.disabledTools.add(verb);
    this.touch();
  }
  setServiceFull(svc: McpBackendService): void {
    allKeys(svc).forEach(k => this.cfg.disabledTools.delete(k));
    this.touch();
  }
  setServiceReadOnly(svc: McpBackendService): void {
    allKeys(svc).forEach(k => this.cfg.disabledTools.delete(k));
    readOnlyKeys(svc).forEach(k => this.cfg.disabledTools.add(k));
    this.touch();
  }
  /**
   * Expose services, applying read-only compilation when asked. Never touches
   * keys of services that stay exposed (migration-safety rule 3); re-exposed
   * services keep their dormant curation unless an access choice overrides it.
   */
  exposeServices(names: string[], access: 'ro' | 'rw' | 'keep'): void {
    for (const name of names) {
      if (!this.cfg.exposedServices.includes(name)) {
        this.cfg.exposedServices.push(name);
      }
      const svc = this.backendServices.find(s => s.name === name);
      if (!svc || access === 'keep') continue;
      if (access === 'ro') this.setServiceReadOnly(svc);
      else this.setServiceFull(svc);
    }
    this.touch();
  }
  /**
   * Remove from exposure. Curation keys are kept unless clearCuration —
   * and only keys the service actually owns (`{name}_{catalog verb}`) are
   * cleared, so siblings like `sales` / `sales_eu` never claim each other's.
   */
  removeService(name: string, clearCuration = false): void {
    this.cfg.exposedServices = this.cfg.exposedServices.filter(n => n !== name);
    if (clearCuration) {
      const kind = this.kindOf(name);
      for (const k of [...this.cfg.disabledTools]) {
        if (keyBelongsTo(k, name, kind)) this.cfg.disabledTools.delete(k);
      }
    }
    this.touch();
  }
  /** Rename-successor flow: repoint an orphaned entry and re-prefix its keys. */
  renameExposedEntry(oldName: string, newName: string): void {
    this.cfg.exposedServices = this.cfg.exposedServices.map(n =>
      n === oldName ? newName : n
    );
    const kind = this.kindOf(oldName);
    for (const k of [...this.cfg.disabledTools]) {
      if (keyBelongsTo(k, oldName, kind)) {
        this.cfg.disabledTools.delete(k);
        this.cfg.disabledTools.add(newName + k.slice(oldName.length));
      }
    }
    this.touch();
  }
  /**
   * Zero write/execute-capable tools anywhere: compiles read-only across
   * every active exposed service AND disables write-capable custom tools
   * (function tools, non-GET API tools).
   */
  makeReadOnly(): void {
    for (const row of this.rows()) {
      if (row.svc && row.svc.active) this.setServiceReadOnly(row.svc);
    }
    for (const tool of this.cfg.customTools ?? []) {
      if (isWriteCapableCustomTool(tool)) tool.enabled = false;
    }
    this.touch();
  }
  dormantCurationCount(name: string): number {
    const kind = this.kindOf(name);
    let n = 0;
    for (const k of this.cfg.disabledTools) {
      if (keyBelongsTo(k, name, kind)) n++;
    }
    return n;
  }
}
