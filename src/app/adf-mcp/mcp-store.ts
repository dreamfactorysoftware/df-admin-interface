/**
 * Shared editor state for the MCP service page. The shell component owns one
 * instance and hands it to every tab; tabs mutate the draft config through
 * it and call touch(). All effective math funnels through effective().
 */
import { Subject } from 'rxjs';
import {
  AccessState,
  EffectiveBreakdown,
  McpBackendService,
  McpConfig,
  accessState,
  allKeys,
  effectiveTools,
  exposedRows,
  ExposedRow,
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
    ci: c.oauthClientId,
    cs: c.oauthClientSecret,
    lu: c.customLoginUrl,
    ao: c.autoOauthService,
    r: [...c.redirectUris],
    ct: c.customTools,
  });
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

  /** All instance services the daemon could serve (db/file), from the API. */
  backendServices: McpBackendService[] = [];
  backendLoaded = false;

  /** First-run (arrived with ?created=1). */
  created = false;
  checklistDismissed = false;
  copiedUrl = false;
  copiedClient = false;
  /** One-shot amber banner on Connect after connection-affecting saves. */
  reconnectBanner = false;

  readonly changes = new Subject<void>();

  init(service: McpServiceRecord, rawConfig: any): void {
    this.service = service;
    this.cfg = parseMcpConfig(rawConfig);
    this.savedCfg = cloneCfg(this.cfg);
    this.draftName = service.name;
    this.draftLabel = service.label;
    this.draftDescription = service.description;
    this.draftIsActive = service.isActive;
  }

  get isSystemMcp(): boolean {
    return this.service?.type === 'system_mcp';
  }

  touch(): void {
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
  effective(): EffectiveBreakdown {
    return effectiveTools(this.cfg, this.backendServices);
  }
  savedEffective(): EffectiveBreakdown {
    return effectiveTools(this.savedCfg, this.backendServices);
  }
  rows(): ExposedRow[] {
    return exposedRows(this.cfg, this.backendServices);
  }
  fraction(svc: McpBackendService): ServiceFraction {
    return serviceFraction(svc, this.cfg.disabledTools);
  }
  access(svc: McpBackendService): AccessState {
    return accessState(svc, this.cfg.disabledTools);
  }
  orphans(): string[] {
    return orphanedKeys(this.cfg, this.backendServices);
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
  /** Remove from exposure. Curation keys are kept unless clearCuration. */
  removeService(name: string, clearCuration = false): void {
    this.cfg.exposedServices = this.cfg.exposedServices.filter(n => n !== name);
    if (clearCuration) {
      for (const k of [...this.cfg.disabledTools]) {
        if (k.startsWith(name + '_')) this.cfg.disabledTools.delete(k);
      }
    }
    this.touch();
  }
  /** Rename-successor flow: repoint an orphaned entry and re-prefix its keys. */
  renameExposedEntry(oldName: string, newName: string): void {
    this.cfg.exposedServices = this.cfg.exposedServices.map(n =>
      n === oldName ? newName : n
    );
    for (const k of [...this.cfg.disabledTools]) {
      if (k.startsWith(oldName + '_')) {
        this.cfg.disabledTools.delete(k);
        this.cfg.disabledTools.add(newName + k.slice(oldName.length));
      }
    }
    this.touch();
  }
  makeReadOnly(): void {
    for (const row of this.rows()) {
      if (row.svc && row.svc.active) this.setServiceReadOnly(row.svc);
    }
    this.touch();
  }
  dormantCurationCount(name: string): number {
    let n = 0;
    for (const k of this.cfg.disabledTools) if (k.startsWith(name + '_')) n++;
    return n;
  }
}
