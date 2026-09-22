/**
 * Pure model + math for the MCP editor: the stored-config contract
 * (exposed_services / disabled_tools / tool_style / lazy_mode / auth fields),
 * and the single effective-tools computation that feeds the rail, the row
 * fractions, the tab label and the preview drawer.
 *
 * Everything here is side-effect free and unit-testable without Angular.
 */
import {
  AGGREGATOR_TOOLS,
  GLOBAL_TOOLS,
  LAZY_AUTO_TOKEN_THRESHOLD,
  McpServiceKind,
  McpVerbGroup,
  TOKENS_PER_TOOL,
  WRITE_GROUP_KEYS,
  serviceKindOf,
  verbGroupsFor,
  verbsFor,
} from './mcp-catalog';

/* ------------------------------------------------------------------ */
/* Stored config                                                       */
/* ------------------------------------------------------------------ */

export type ToolStyle = 'prefixed' | 'merged';
/**
 * Catalog-delivery contract shared with the PHP schema picklist and the
 * daemon's server.ts: only these three values are ever stored.
 */
export type LazyMode = 'auto' | 'on' | 'off';

/**
 * Read-side tolerance for legacy rows: 'always'/true → 'on',
 * 'never'/false → 'off', null/absent/anything else → 'auto'.
 */
export function normalizeLazyMode(v: unknown): LazyMode {
  if (v === 'on' || v === 'always' || v === true) return 'on';
  if (v === 'off' || v === 'never' || v === false) return 'off';
  return 'auto';
}

/** Parsed, normalized view of an mcp service's config blob. */
export interface McpConfig {
  exposedServices: string[];
  disabledTools: Set<string>;
  /** null = column empty; serves as prefixed but labeled "server default". */
  toolStyle: ToolStyle | null;
  lazyMode: LazyMode;
  allowApiKeyAuth: boolean;
  oauthClientId: string;
  oauthClientSecret: string;
  customLoginUrl: string;
  autoOauthService: string | null;
  redirectUris: string[];
  /**
   * Read-only projection of URIs OAuth clients registered for themselves
   * (dynamic registration). Never edited here, never folded into
   * redirectUris — re-emitted verbatim on save so the column survives.
   */
  registeredRedirectUris: string[];
  customTools: any[];
  /** Untouched fields, spread back on save so we never drop columns. */
  rest: Record<string, any>;
}

const KNOWN_KEYS = [
  'exposed_services',
  'exposedServices',
  'disabled_tools',
  'disabledTools',
  'tool_style',
  'toolStyle',
  'lazy_mode',
  'lazyMode',
  'allow_api_key_auth',
  'allowApiKeyAuth',
  'oauth_client_id',
  'oauthClientId',
  'oauth_client_secret',
  'oauthClientSecret',
  'custom_login_url',
  'customLoginUrl',
  'auto_oauth_service',
  'autoOauthService',
  'redirect_uris',
  'redirectUris',
  'registered_redirect_uris',
  'registeredRedirectUris',
  'custom_tools',
  'customTools',
];

function pick(raw: Record<string, any>, snake: string, camel: string): any {
  if (raw[snake] !== undefined) return raw[snake];
  return raw[camel];
}

/** Accepts either snake_case (API) or camelCase (legacy resolver) blobs. */
export function parseMcpConfig(raw: Record<string, any> | null | undefined): McpConfig {
  const r = raw ?? {};
  const exposed = pick(r, 'exposed_services', 'exposedServices');
  const disabled = pick(r, 'disabled_tools', 'disabledTools');
  const style = pick(r, 'tool_style', 'toolStyle');
  // No fallback between the two: redirect_uris is the admin-managed list,
  // registered_redirect_uris the clients' read-only projection.
  const redirect = pick(r, 'redirect_uris', 'redirectUris');
  const registered = pick(r, 'registered_redirect_uris', 'registeredRedirectUris');
  const rest: Record<string, any> = {};
  for (const k of Object.keys(r)) {
    if (!KNOWN_KEYS.includes(k)) rest[k] = r[k];
  }
  return {
    exposedServices: Array.isArray(exposed) ? [...exposed] : [],
    disabledTools: new Set(Array.isArray(disabled) ? disabled : []),
    toolStyle: style === 'merged' ? 'merged' : style === 'prefixed' ? 'prefixed' : null,
    lazyMode: normalizeLazyMode(pick(r, 'lazy_mode', 'lazyMode')),
    allowApiKeyAuth: !!pick(r, 'allow_api_key_auth', 'allowApiKeyAuth'),
    oauthClientId: pick(r, 'oauth_client_id', 'oauthClientId') ?? '',
    oauthClientSecret: pick(r, 'oauth_client_secret', 'oauthClientSecret') ?? '',
    customLoginUrl: pick(r, 'custom_login_url', 'customLoginUrl') ?? '',
    autoOauthService: pick(r, 'auto_oauth_service', 'autoOauthService') ?? null,
    redirectUris: Array.isArray(redirect) ? [...redirect] : [],
    registeredRedirectUris: Array.isArray(registered) ? [...registered] : [],
    customTools: pick(r, 'custom_tools', 'customTools') ?? [],
    rest,
  };
}

/**
 * Emits the camelCase config payload the app's HTTP layer expects — the
 * global case interceptor converts it to snake_case on the wire.
 * `custom_tools` handling mirrors the legacy editor: included for `mcp`
 * (mapped shape, ids preserved), omitted for `system_mcp`.
 */
export function serializeMcpConfig(
  c: McpConfig,
  serviceType: 'mcp' | 'system_mcp' = 'mcp'
): Record<string, any> {
  const out: Record<string, any> = {
    ...c.rest,
    exposedServices: [...c.exposedServices],
    disabledTools: [...c.disabledTools].sort(),
    toolStyle: c.toolStyle,
    // The stored contract is exactly auto|on|off, whatever we were handed.
    lazyMode: normalizeLazyMode(c.lazyMode),
    allowApiKeyAuth: c.allowApiKeyAuth,
    oauthClientId: c.oauthClientId,
    oauthClientSecret: c.oauthClientSecret,
    customLoginUrl: c.customLoginUrl || null,
    autoOauthService: c.autoOauthService,
    redirectUris: [...c.redirectUris],
    // Read-only field, re-emitted verbatim so saves never drop the column.
    registeredRedirectUris: [...(c.registeredRedirectUris ?? [])],
  };
  if (serviceType === 'mcp') {
    out['customTools'] = (c.customTools ?? []).map((tool: any) => ({
      id: tool.id,
      toolType: tool.toolType || 'api',
      name: tool.name,
      description: tool.description,
      httpMethod: tool.httpMethod,
      url: tool.url,
      parameters: tool.parameters,
      headers: tool.headers,
      function: tool.function || '',
      enabled: tool.enabled,
      storageServiceId: tool.storageServiceId || null,
      scmRepository: tool.scmRepository || '',
      scmReference: tool.scmReference || '',
      storagePath: tool.storagePath || '',
    }));
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Instance services (what the picker and rows are built from)          */
/* ------------------------------------------------------------------ */

/** One backend service the daemon could serve tools for. */
export interface McpBackendService {
  /** system/service id — role_service_access rows key on it. */
  id?: number;
  name: string;
  label: string;
  kind: McpServiceKind;
  active: boolean;
}

/** Build from GET system/service rows + service type groups. */
export function toBackendServices(
  rows: Array<{ id?: number; name: string; label?: string; type: string; isActive?: boolean; is_active?: boolean }>,
  typeGroups: Record<string, string>
): McpBackendService[] {
  const out: McpBackendService[] = [];
  for (const r of rows) {
    const kind = serviceKindOf(typeGroups[r.type] ?? '', r.type);
    if (!kind) continue;
    out.push({
      id: r.id,
      name: r.name,
      label: r.label || r.name,
      kind,
      active: r.isActive ?? (r as any).is_active ?? true,
    });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Derivations                                                          */
/* ------------------------------------------------------------------ */

export function toolKey(serviceName: string, verb: string): string {
  return `${serviceName}_${verb}`;
}

export interface ServiceFraction {
  on: number;
  total: number;
}

export function serviceFraction(svc: McpBackendService, disabled: ReadonlySet<string>): ServiceFraction {
  const verbs = verbsFor(svc.kind);
  return {
    on: verbs.filter(v => !disabled.has(toolKey(svc.name, v.verb))).length,
    total: verbs.length,
  };
}

export type GroupState = 'on' | 'off' | 'part';

export function groupState(
  svc: McpBackendService,
  group: McpVerbGroup,
  disabled: ReadonlySet<string>
): GroupState {
  const on = group.verbs.filter(v => !disabled.has(toolKey(svc.name, v.verb))).length;
  if (on === 0) return 'off';
  return on === group.verbs.length ? 'on' : 'part';
}

export type AccessKind = 'full' | 'ro' | 'custom' | 'zero';

export interface AccessState {
  kind: AccessKind;
  /** e.g. "Full", "Read-only", "Custom 11 of 16", "0 of 16" */
  label: string;
}

export function accessState(svc: McpBackendService, disabled: ReadonlySet<string>): AccessState {
  const f = serviceFraction(svc, disabled);
  if (f.on === 0) return { kind: 'zero', label: `0 of ${f.total}` };
  if (f.on === f.total) return { kind: 'full', label: 'Full' };
  const groups = verbGroupsFor(svc.kind);
  const writeOff = groups
    .filter(g => WRITE_GROUP_KEYS.has(g.key))
    .every(g => groupState(svc, g, disabled) === 'off');
  const readOn = groups
    .filter(g => !WRITE_GROUP_KEYS.has(g.key))
    .every(g => groupState(svc, g, disabled) === 'on');
  if (writeOff && readOn) return { kind: 'ro', label: 'Read-only' };
  return { kind: 'custom', label: `Custom ${f.on} of ${f.total}` };
}

/** disabled_tools keys that make one service read-only. */
export function readOnlyKeys(svc: McpBackendService): string[] {
  return verbGroupsFor(svc.kind)
    .filter(g => WRITE_GROUP_KEYS.has(g.key))
    .flatMap(g => g.verbs.map(v => toolKey(svc.name, v.verb)));
}

/** All prefixed keys for one service (used by Reset to all / Full access). */
export function allKeys(svc: McpBackendService): string[] {
  return verbsFor(svc.kind).map(v => toolKey(svc.name, v.verb));
}

/* ------------------------------------------------------------------ */
/* Custom tools                                                         */
/* ------------------------------------------------------------------ */

/** enabled-flag semantics shared with the legacy editor. */
export function isCustomToolEnabled(t: any): boolean {
  return !!t && t.enabled !== false && t.enabled !== 0;
}

/**
 * A custom tool that can change state or execute code: server-side
 * function tools, and API tools with any HTTP method other than GET.
 * (Classification only — pair with isCustomToolEnabled for "live".)
 */
export function isWriteCapableCustomTool(t: any): boolean {
  if (!t) return false;
  if ((t.toolType || 'api') === 'function') return true;
  return String(t.httpMethod ?? 'GET').toUpperCase() !== 'GET';
}

/* ------------------------------------------------------------------ */
/* Key ownership                                                        */
/* ------------------------------------------------------------------ */

const DB_VERB_SET: ReadonlySet<string> = new Set(verbsFor('db').map(v => v.verb));
const FILE_VERB_SET: ReadonlySet<string> = new Set(verbsFor('file').map(v => v.verb));

/**
 * True when `key` is exactly `{serviceName}_{verb}` for a verb in the given
 * kind's catalog — both catalogs when the kind is unknown (orphans). Bare
 * `startsWith(name + '_')` over-claims sibling services (service `db` would
 * claim `db_backup_list_files`), so every ownership decision funnels here.
 */
export function keyBelongsTo(
  key: string,
  serviceName: string,
  kind?: McpServiceKind | null
): boolean {
  const prefix = serviceName + '_';
  if (!key.startsWith(prefix)) return false;
  const verb = key.slice(prefix.length);
  if (kind === 'db') return DB_VERB_SET.has(verb);
  if (kind === 'file') return FILE_VERB_SET.has(verb);
  return DB_VERB_SET.has(verb) || FILE_VERB_SET.has(verb);
}

/* ------------------------------------------------------------------ */
/* The one effective computation                                        */
/* ------------------------------------------------------------------ */

export interface ExposedRow {
  name: string;
  svc: McpBackendService | null; // null => orphan (renamed/deleted)
}

export function exposedRows(cfg: McpConfig, services: McpBackendService[]): ExposedRow[] {
  return cfg.exposedServices.map(name => ({
    name,
    svc: services.find(s => s.name === name) ?? null,
  }));
}

function activeExposed(cfg: McpConfig, services: McpBackendService[], kind?: McpServiceKind): McpBackendService[] {
  return exposedRows(cfg, services)
    .map(r => r.svc)
    .filter((s): s is McpBackendService => !!s && s.active && (!kind || s.kind === kind));
}

export interface EffectiveBreakdown {
  total: number;
  /** merged: shared verb count; prefixed: sum of per-db enabled verbs. */
  dbTools: number;
  dbServices: number;
  fileTools: number;
  fileServices: number;
  globalTools: number;
  aggregators: number;
  customTools: number;
  /**
   * SERVED write/execute-capable tools (Appendix A math): merged style =
   * distinct db write verbs enabled in ≥1 exposed db + per-service file
   * write instances; prefixed style = per-service instances for dbs and
   * files. Enabled write-capable custom tools count in both styles.
   */
  writeVerbs: number;
  /** Enabled custom tools that are write/execute-capable. */
  writeCapableCustoms: number;
  /** services with any write/execute verb enabled */
  writeReach: number;
  writeReachDb: number;
  readOnly: boolean;
  tokenEstimate: number;
  lazyEngaged: boolean;
  effectiveStyle: ToolStyle;
}

export function effectiveTools(
  cfg: McpConfig,
  services: McpBackendService[]
): EffectiveBreakdown {
  const style: ToolStyle = cfg.toolStyle === 'merged' ? 'merged' : 'prefixed';
  const dbs = activeExposed(cfg, services, 'db');
  const files = activeExposed(cfg, services, 'file');
  const disabled = cfg.disabledTools;

  let dbTools = 0;
  if (dbs.length) {
    if (style === 'merged') {
      for (const v of verbsFor('db')) {
        if (dbs.some(d => !disabled.has(toolKey(d.name, v.verb)))) dbTools++;
      }
    } else {
      dbTools = dbs.reduce((a, d) => a + serviceFraction(d, disabled).on, 0);
    }
  }
  const fileTools = files.reduce((a, f) => a + serviceFraction(f, disabled).on, 0);
  // Global tools disable by their bare name in the same disabled_tools list.
  const globalTools = GLOBAL_TOOLS.filter(t => !disabled.has(t.verb)).length;
  const aggregators =
    dbs.length >= 2
      ? AGGREGATOR_TOOLS.filter(t => !disabled.has(t.verb)).length
      : 0;
  const enabledCustoms = (cfg.customTools ?? []).filter(isCustomToolEnabled);
  const customTools = enabledCustoms.length;
  const writeCapableCustoms = enabledCustoms.filter(isWriteCapableCustomTool).length;

  // Write math mirrors the served-tool math above: merged db verbs are one
  // shared tool each; everything else (prefixed dbs, files in both styles)
  // is a per-service instance.
  const dbWriteVerbSet = new Set<string>();
  let dbWriteInstances = 0;
  let fileWriteInstances = 0;
  let writeReach = 0;
  let writeReachDb = 0;
  for (const s of [...dbs, ...files]) {
    const on = verbGroupsFor(s.kind)
      .filter(g => WRITE_GROUP_KEYS.has(g.key))
      .flatMap(g => g.verbs)
      .filter(v => !disabled.has(toolKey(s.name, v.verb)));
    if (on.length) {
      writeReach++;
      if (s.kind === 'db') {
        writeReachDb++;
        dbWriteInstances += on.length;
        on.forEach(v => dbWriteVerbSet.add(v.verb));
      } else {
        fileWriteInstances += on.length;
      }
    }
  }
  const dbWriteTools = style === 'merged' ? dbWriteVerbSet.size : dbWriteInstances;
  const writeVerbs = dbWriteTools + fileWriteInstances + writeCapableCustoms;

  const total = dbTools + fileTools + globalTools + aggregators + customTools;
  const tokenEstimate = total * TOKENS_PER_TOOL;
  const lazyEngaged =
    cfg.lazyMode === 'on' ||
    (cfg.lazyMode === 'auto' && tokenEstimate > LAZY_AUTO_TOKEN_THRESHOLD);

  return {
    total,
    dbTools,
    dbServices: dbs.length,
    fileTools,
    fileServices: files.length,
    globalTools,
    aggregators,
    customTools,
    writeVerbs,
    writeCapableCustoms,
    writeReach,
    writeReachDb,
    readOnly: writeVerbs === 0,
    tokenEstimate,
    lazyEngaged,
    effectiveStyle: style,
  };
}

/** In merged style: how many exposed DBs a verb reaches. */
export function verbReach(
  verb: string,
  cfg: McpConfig,
  services: McpBackendService[]
): { on: string[]; total: number } {
  const dbs = activeExposed(cfg, services, 'db');
  return {
    on: dbs.filter(d => !cfg.disabledTools.has(toolKey(d.name, verb))).map(d => d.name),
    total: dbs.length,
  };
}

/**
 * disabled_tools entries no service owns (per keyBelongsTo's exact
 * `{service}_{verb}` rule) and which aren't bare global/aggregator/custom
 * tool names. `extraBareNames` lets the caller add catalog names disabled by
 * bare name — e.g. SYSTEM_MCP_TOOLS names for a system_mcp server — without
 * this module importing them.
 */
export function orphanedKeys(
  cfg: McpConfig,
  services: McpBackendService[],
  extraBareNames: Iterable<string> = []
): string[] {
  const bare = new Set<string>([
    ...GLOBAL_TOOLS.map(t => t.verb),
    ...AGGREGATOR_TOOLS.map(t => t.verb),
    ...(cfg.customTools ?? []).map((t: any) => t?.name).filter(Boolean),
    ...extraBareNames,
  ]);
  const names = new Set(services.map(s => s.name));
  // Exposed-but-missing entries still claim their keys (dormant, not
  // orphaned); their kind is unknown, so both verb catalogs apply.
  const exposedOrphans = cfg.exposedServices.filter(n => !names.has(n));
  const owned = (key: string) =>
    bare.has(key) ||
    services.some(s => keyBelongsTo(key, s.name, s.kind)) ||
    exposedOrphans.some(n => keyBelongsTo(key, n));
  return [...cfg.disabledTools].filter(k => !owned(k));
}

/** Emitted tool name a client sees for a db verb in the given style. */
export function emittedDbToolName(style: ToolStyle, serviceName: string, verb: string): string {
  return style === 'merged' ? verb : toolKey(serviceName, verb);
}
