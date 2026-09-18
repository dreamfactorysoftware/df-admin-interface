/**
 * Pure model for the MCP server page: what a server exposes, what one
 * identity (admin / role / API key) actually gets, and the text the page
 * derives from that (access diffs, connect snippets).
 *
 * No Angular, no HTTP. Everything the page shows that is not raw data from
 * an endpoint is computed here so it can be unit tested in isolation.
 *
 * Verb lists mirror df-mcp-server's tool registry (see buildToolList in the
 * previous synthesised panel). Disabled-tool keys are `<sanitized>_<verb>`
 * in BOTH tool styles; the daemon drops that service from the merged tool's
 * `service` enum when merged.
 */

export type VerbGroup = 'read' | 'spec' | 'procedures' | 'write';
export type HttpVerb = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export interface McpVerb {
  name: string;
  group: VerbGroup;
  /** Writes data (or runs server-side code). Amber + W badge in the grid. */
  write: boolean;
  /** REST verb the role must hold for this tool to succeed at call time. */
  http: HttpVerb;
}

const v = (
  name: string,
  group: VerbGroup,
  http: HttpVerb = 'GET',
  write = false
): McpVerb => ({ name, group, http, write });

export const DB_VERBS: ReadonlyArray<McpVerb> = [
  v('get_table_data', 'read'),
  v('get_tables', 'read'),
  v('get_table_schema', 'read'),
  v('get_table_fields', 'read'),
  v('get_table_relationships', 'read'),
  v('aggregate_data', 'read'),
  v('get_api_spec', 'spec'),
  v('get_data_model', 'spec'),
  v('get_database_resources', 'spec'),
  v('get_stored_procedures', 'procedures'),
  v('call_stored_procedure', 'procedures', 'POST', true),
  v('get_stored_functions', 'procedures'),
  v('call_stored_function', 'procedures', 'POST', true),
  v('create_records', 'write', 'POST', true),
  v('update_records', 'write', 'PATCH', true),
  v('delete_records', 'write', 'DELETE', true),
];

export const FILE_VERBS: ReadonlyArray<McpVerb> = [
  v('list_files', 'read'),
  v('get_file', 'read'),
  v('get_file_properties', 'read'),
  v('create_folder', 'write', 'POST', true),
  v('create_file', 'write', 'POST', true),
  v('delete_file', 'write', 'DELETE', true),
];

export const VERB_GROUPS: ReadonlyArray<VerbGroup> = [
  'read',
  'spec',
  'procedures',
  'write',
];

/** Always advertised, regardless of exposure. */
export const GLOBAL_TOOLS = [
  'discover_services',
  'request_access',
  'list_apis',
  'search',
  'fetch',
];
/** Advertised once more than one database is visible to the identity. */
export const AGGREGATE_DB_TOOLS = [
  'all_get_tables',
  'all_find_table',
  'all_get_stored_procedures',
  'all_get_stored_functions',
  'all_get_resources',
];
export const AGGREGATE_FILE_TOOLS = ['all_list_files'];
/** What a lazy server advertises instead of the catalog. */
export const FACADE_TOOLS = [
  'search_tools',
  'list_tools',
  'describe_tool',
  'call_tool',
  'fetch_more',
];

/** lazy_mode=auto flips to the facade above this catalog size. */
export const LAZY_THRESHOLD_BYTES = 32 * 1024;
/** ~540 B of JSON schema per tool observed on df-dev (58 tools ≈ 31 KB). */
export const DEFAULT_BYTES_PER_TOOL = 540;

/** verb_mask bits, as df-core encodes them. */
export const VERB_BITS: Record<string, number> = {
  GET: 1,
  POST: 2,
  PUT: 4,
  PATCH: 8,
  DELETE: 16,
};
export const READ_MASK = 1;
export const WRITE_MASK = 2 | 4 | 8 | 16;
export const FULL_MASK = 31;

export type BackendKind = 'database' | 'file';

export interface McpBackend {
  id: number | null;
  name: string;
  label: string;
  kind: BackendKind;
}

export interface McpConfig {
  exposedServices: string[];
  disabledTools: string[];
  lazyMode: 'auto' | 'on' | 'off';
  toolStyle: 'merged' | 'prefixed';
  allowWrites: boolean;
  allowApiKeyAuth: boolean;
  requireRoleAccess: boolean;
}

/**
 * Who the page previews as. `verbs` is `service name -> verb_mask` for a
 * role; undefined means an admin (nothing filtered).
 */
export interface McpIdentity {
  kind: 'admin' | 'role' | 'app';
  roleId?: number;
  roleName?: string;
  appId?: number;
  appName?: string;
  apiKey?: string;
  verbs?: Record<string, number>;
  /** Backends the role only reaches through specific components (tables). */
  components?: Record<string, string[]>;
}

export const ADMIN_IDENTITY: McpIdentity = { kind: 'admin' };

export type CellState = 'on' | 'off' | 'writes-off' | 'denied' | 'gone';

export type ToolKind =
  | 'global'
  | 'aggregate'
  | 'tool'
  | 'write'
  | 'facade'
  | 'custom';

export interface CatalogTool {
  name: string;
  kind: ToolKind;
  service?: string;
}

export interface CatalogShape {
  /** The full catalog this identity could reach. */
  tools: CatalogTool[];
  /** What the client is actually sent each turn (facade when lazy). */
  shown: CatalogTool[];
  bytes: number;
  facadeBytes: number;
  lazy: boolean;
  dbs: McpBackend[];
  files: McpBackend[];
  writable: number;
}

export function sanitizeApiName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

export function toolKey(backendName: string, verb: string): string {
  return `${sanitizeApiName(backendName)}_${verb}`;
}

export function verbsFor(kind: BackendKind): ReadonlyArray<McpVerb> {
  return kind === 'database' ? DB_VERBS : FILE_VERBS;
}

/** A role allows a tool when it holds the REST verb the tool maps to. */
export function roleAllows(mask: number | undefined, verb: McpVerb): boolean {
  if (mask === undefined) return true;
  if (verb.http === 'PATCH') {
    return (mask & (VERB_BITS['PATCH'] | VERB_BITS['PUT'])) !== 0;
  }
  return (mask & VERB_BITS[verb.http]) !== 0;
}

/** Whether the identity can see this backend at all. */
export function backendVisible(
  backend: McpBackend,
  identity: McpIdentity
): boolean {
  if (!identity.verbs) return true;
  return (identity.verbs[backend.name] ?? 0) > 0;
}

export function cellState(
  cfg: McpConfig,
  backend: McpBackend,
  verb: McpVerb,
  identity: McpIdentity
): CellState {
  if (!cfg.exposedServices.includes(backend.name)) return 'gone';
  if (!backendVisible(backend, identity)) return 'gone';
  if (!cfg.allowWrites && verb.write) return 'writes-off';
  if (cfg.disabledTools.includes(toolKey(backend.name, verb.name))) {
    return 'off';
  }
  if (identity.verbs && !roleAllows(identity.verbs[backend.name], verb)) {
    return 'denied';
  }
  return 'on';
}

// ---------------------------------------------------------- columns

/** State of a verb (or verb group) across the EXPOSED backends of a kind. */
export type VerbSetState = 'on' | 'mixed' | 'off' | 'none';

/** Exposed backends of the kind a verb set applies to. */
export function exposedOfKind(
  cfg: Pick<McpConfig, 'exposedServices'>,
  backends: McpBackend[],
  kind: BackendKind
): McpBackend[] {
  return backends.filter(
    b => b.kind === kind && cfg.exposedServices.includes(b.name)
  );
}

/** disabled_tools keys a verb set spans on the exposed backends of a kind. */
export function verbSetKeys(
  cfg: Pick<McpConfig, 'exposedServices'>,
  backends: McpBackend[],
  verbs: ReadonlyArray<McpVerb>,
  kind: BackendKind
): string[] {
  const keys: string[] = [];
  for (const b of exposedOfKind(cfg, backends, kind)) {
    for (const v of verbs) keys.push(toolKey(b.name, v.name));
  }
  return keys;
}

/** on: every key enabled; off: none; mixed: some; none: nothing exposed. */
export function verbSetState(
  cfg: Pick<McpConfig, 'exposedServices' | 'disabledTools'>,
  backends: McpBackend[],
  verbs: ReadonlyArray<McpVerb>,
  kind: BackendKind
): VerbSetState {
  const keys = verbSetKeys(cfg, backends, verbs, kind);
  if (keys.length === 0) return 'none';
  const disabled = new Set(cfg.disabledTools);
  const off = keys.filter(k => disabled.has(k)).length;
  if (off === 0) return 'on';
  if (off === keys.length) return 'off';
  return 'mixed';
}

/**
 * One click on a column/group header: when every key is enabled, disable
 * them all; otherwise (mixed or off) enable them all. Keys of hidden or
 * unexposed backends, and every other key, are left untouched.
 */
export function toggleVerbSet(
  cfg: Pick<McpConfig, 'exposedServices' | 'disabledTools'>,
  backends: McpBackend[],
  verbs: ReadonlyArray<McpVerb>,
  kind: BackendKind
): string[] {
  const keys = verbSetKeys(cfg, backends, verbs, kind);
  const state = verbSetState(cfg, backends, verbs, kind);
  const next = new Set(cfg.disabledTools);
  if (state === 'on') keys.forEach(k => next.add(k));
  else keys.forEach(k => next.delete(k));
  return Array.from(next);
}

/** Tools a backend advertises: exposed, not disabled, not blocked by writes. */
export function advertisedVerbs(
  cfg: McpConfig,
  backend: McpBackend
): McpVerb[] {
  if (!cfg.exposedServices.includes(backend.name)) return [];
  return verbsFor(backend.kind).filter(
    verb =>
      (cfg.allowWrites || !verb.write) &&
      !cfg.disabledTools.includes(toolKey(backend.name, verb.name))
  );
}

/**
 * Build the catalog one identity is served. Mirrors the daemon's registry:
 * globals, aggregates when 2+ backends of a kind are visible, then either
 * one merged verb per tool (database) or `<service>_<verb>` per backend.
 */
export function shapeCatalog(
  cfg: McpConfig,
  backends: McpBackend[],
  identity: McpIdentity = ADMIN_IDENTITY,
  customTools: string[] = [],
  bytesPerTool = DEFAULT_BYTES_PER_TOOL
): CatalogShape {
  const visible = backends.filter(
    b => cfg.exposedServices.includes(b.name) && backendVisible(b, identity)
  );
  const dbs = visible.filter(b => b.kind === 'database');
  const files = visible.filter(b => b.kind === 'file');
  const disabled = new Set(cfg.disabledTools);
  const tools: CatalogTool[] = GLOBAL_TOOLS.filter(n => !disabled.has(n)).map(
    name => ({ name, kind: 'global' })
  );
  if (dbs.length > 1) {
    AGGREGATE_DB_TOOLS.filter(n => !disabled.has(n)).forEach(name =>
      tools.push({ name, kind: 'aggregate' })
    );
  }
  if (files.length > 1) {
    AGGREGATE_FILE_TOOLS.filter(n => !disabled.has(n)).forEach(name =>
      tools.push({ name, kind: 'aggregate' })
    );
  }
  const kindOf = (verb: McpVerb): ToolKind => (verb.write ? 'write' : 'tool');
  if (cfg.toolStyle === 'merged') {
    for (const verb of DB_VERBS) {
      if (dbs.some(b => advertisedVerbs(cfg, b).includes(verb))) {
        tools.push({ name: verb.name, kind: kindOf(verb) });
      }
    }
  } else {
    for (const b of dbs) {
      for (const verb of advertisedVerbs(cfg, b)) {
        tools.push({
          name: toolKey(b.name, verb.name),
          kind: kindOf(verb),
          service: b.name,
        });
      }
    }
  }
  for (const b of files) {
    for (const verb of advertisedVerbs(cfg, b)) {
      tools.push({
        name: toolKey(b.name, verb.name),
        kind: kindOf(verb),
        service: b.name,
      });
    }
  }
  customTools
    .filter(n => !disabled.has(n))
    .forEach(name => tools.push({ name, kind: 'custom' }));

  const bytes = tools.length * bytesPerTool;
  const facadeBytes = FACADE_TOOLS.length * bytesPerTool;
  const lazy =
    cfg.lazyMode === 'on' ||
    (cfg.lazyMode === 'auto' && bytes > LAZY_THRESHOLD_BYTES);
  const shown = lazy
    ? FACADE_TOOLS.map(name => ({ name, kind: 'facade' as ToolKind }))
    : tools;
  return {
    tools,
    shown,
    bytes,
    facadeBytes,
    lazy,
    dbs,
    files,
    writable: tools.filter(t => t.kind === 'write').length,
  };
}

/** Catalog for the fixed-tool System API server: names minus disabled. */
export function shapeFixedCatalog(
  cfg: Pick<McpConfig, 'disabledTools' | 'lazyMode'>,
  toolNames: ReadonlyArray<string>,
  bytesPerTool = DEFAULT_BYTES_PER_TOOL
): CatalogShape {
  const disabled = new Set(cfg.disabledTools);
  const tools: CatalogTool[] = toolNames
    .filter(n => !disabled.has(n))
    .map(name => ({
      name,
      kind: /^(get_|list_)/.test(name) ? 'tool' : 'write',
    }));
  const bytes = tools.length * bytesPerTool;
  const lazy =
    cfg.lazyMode === 'on' ||
    (cfg.lazyMode === 'auto' && bytes > LAZY_THRESHOLD_BYTES);
  return {
    tools,
    shown: lazy ? FACADE_TOOLS.map(name => ({ name, kind: 'facade' })) : tools,
    bytes,
    facadeBytes: FACADE_TOOLS.length * bytesPerTool,
    lazy,
    dbs: [],
    files: [],
    writable: tools.filter(t => t.kind === 'write').length,
  };
}

/** Rough tokens the client carries per turn: bytes / 4. */
export function tokensPerTurn(shape: CatalogShape): number {
  return Math.round((shape.lazy ? shape.facadeBytes : shape.bytes) / 4);
}

export function formatTokens(n: number): string {
  return n >= 1000 ? `~${(n / 1000).toFixed(1)}k` : `~${n}`;
}

export function formatKb(bytes: number): string {
  return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`;
}

// ---------------------------------------------------------------- access

export type AccessLevel = 'none' | 'read' | 'rw';

export function levelFromMask(mask: number): AccessLevel {
  if (mask <= 0) return 'none';
  return (mask & WRITE_MASK) !== 0 ? 'rw' : 'read';
}

export function maskForLevel(level: AccessLevel): number {
  return level === 'rw' ? FULL_MASK : level === 'read' ? READ_MASK : 0;
}

export interface RoleAccessRow {
  id?: number;
  serviceId: number;
  component: string;
  verbMask: number;
  requestorMask?: number;
}

export interface ServiceGrant {
  level: AccessLevel;
  /** Rows narrower than `*` exist (table-level limits): edit on the role page. */
  tableLimited: boolean;
  mask: number;
}

/** Collapse a role's access rows into one grant per service id. */
export function grantsByService(
  rows: RoleAccessRow[]
): Record<number, ServiceGrant> {
  const out: Record<number, ServiceGrant> = {};
  for (const row of rows) {
    const g = out[row.serviceId] ?? {
      level: 'none',
      tableLimited: false,
      mask: 0,
    };
    g.mask |= row.verbMask;
    if (row.component !== '*' && row.verbMask > 0) g.tableLimited = true;
    g.level = levelFromMask(g.mask);
    out[row.serviceId] = g;
  }
  return out;
}

/** `service name -> verb_mask` for the identity filter, from a role's rows. */
export function verbsByServiceName(
  rows: RoleAccessRow[],
  serviceNameById: Record<number, string>
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const row of rows) {
    const name = serviceNameById[row.serviceId];
    if (!name) continue;
    out[name] = (out[name] ?? 0) | row.verbMask;
  }
  return out;
}

/** `service name -> components` for rows narrower than `*`. */
export function componentsByServiceName(
  rows: RoleAccessRow[],
  serviceNameById: Record<number, string>
): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const row of rows) {
    const name = serviceNameById[row.serviceId];
    if (!name || row.component === '*' || row.verbMask <= 0) continue;
    (out[name] ??= []).push(row.component);
  }
  return out;
}

/** verb_mask from the HTTP verb names mcp-catalog reports per backend. */
export function maskFromVerbNames(verbs: string[]): number {
  return verbs.reduce((m, v) => m | (VERB_BITS[v.toUpperCase()] ?? 0), 0);
}

export interface AccessChange {
  serviceId: number;
  label: string;
  before: AccessLevel;
  after: AccessLevel;
}

export interface AccessChangeInput {
  serverId: number;
  serverLabel: string;
  backends: Array<{ id: number; label: string }>;
  grants: Record<number, ServiceGrant>;
  levels: Record<number, AccessLevel>;
  /** Opt-in modes (add / create): only ticked backends are considered. */
  include?: Record<number, boolean> | null;
}

/**
 * The changes a role save proposes: the server row (granted read when the
 * role has none) plus one row per considered backend. Table-limited grants,
 * on a backend or on the server itself, are never widened here: they stay
 * as they are and the dialog points at the role page instead.
 */
export function buildAccessChanges(i: AccessChangeInput): AccessChange[] {
  const changes: AccessChange[] = [];
  const server = i.grants[i.serverId];
  if (!server?.tableLimited) {
    const before = server?.level ?? 'none';
    changes.push({
      serviceId: i.serverId,
      label: i.serverLabel,
      before,
      after: before === 'none' ? 'read' : before,
    });
  }
  for (const b of i.backends) {
    if (i.include && !i.include[b.id]) continue;
    if (i.grants[b.id]?.tableLimited) continue;
    changes.push({
      serviceId: b.id,
      label: b.label,
      before: i.grants[b.id]?.level ?? 'none',
      after: i.levels[b.id] ?? 'none',
    });
  }
  return changes;
}

export type AccessDelta = '+read' | '+rw' | '+write' | '-write' | '-access';

export interface AccessSummary {
  /** The server row: newly granted, kept as is, or not touched. */
  server: 'grant' | 'keep' | 'none';
  /** Backends that go from no access straight to a level (add / create). */
  read: string[];
  rw: string[];
  /** Every other transition (edit): label + what changes. */
  deltas: Array<{ label: string; delta: AccessDelta }>;
}

/**
 * The one-line summary an access editor shows live: what a save grants or
 * removes, per backend, plus whether the server row is new.
 */
export function summarizeAccessChanges(
  changes: AccessChange[],
  serverId: number
): AccessSummary {
  const out: AccessSummary = { server: 'none', read: [], rw: [], deltas: [] };
  for (const c of changes) {
    if (c.serviceId === serverId) {
      out.server = c.before === 'none' ? 'grant' : 'keep';
      continue;
    }
    if (c.before === c.after) continue;
    if (c.before === 'none') {
      (c.after === 'rw' ? out.rw : out.read).push(c.label);
    } else if (c.after === 'none') {
      out.deltas.push({ label: c.label, delta: '-access' });
    } else {
      out.deltas.push({
        label: c.label,
        delta: c.after === 'rw' ? '+write' : '-write',
      });
    }
  }
  return out;
}

/** Plain-language lines for the diff shown before a role save. */
export function accessDiff(
  changes: AccessChange[],
  labels: Record<AccessLevel, string>
): string[] {
  return changes
    .filter(c => c.before !== c.after)
    .map(c => `${c.label}: ${labels[c.before]} → ${labels[c.after]}`);
}

/**
 * The role_service_access rows to PATCH for a set of level changes. A row
 * that exists is updated by id; `none` on an existing `*` row unlinks it
 * (`role_id: null`); a new level creates a `*` row. Table-limited rows are
 * never touched here.
 */
export function accessRowsForChanges(
  changes: AccessChange[],
  existing: RoleAccessRow[]
): Array<Record<string, unknown>> {
  const out: Array<Record<string, unknown>> = [];
  for (const c of changes) {
    if (c.before === c.after) continue;
    const star = existing.find(
      r => r.serviceId === c.serviceId && r.component === '*'
    );
    if (c.after === 'none') {
      if (star?.id != null) out.push({ id: star.id, role_id: null });
      continue;
    }
    out.push({
      ...(star?.id != null ? { id: star.id } : {}),
      service_id: c.serviceId,
      component: '*',
      verb_mask: maskForLevel(c.after),
      requestor_mask: 3,
      filters: [],
      filter_op: 'AND',
    });
  }
  return out;
}

// ------------------------------------------------------------- snippets

export type ConnectClient = 'claude' | 'cursor' | 'vscode' | 'chatgpt' | 'curl';
export const CONNECT_CLIENTS: ReadonlyArray<ConnectClient> = [
  'claude',
  'cursor',
  'vscode',
  'chatgpt',
  'curl',
];

export interface SnippetOptions {
  name: string;
  url: string;
  /** Set when previewing an API key; the header goes in the snippet. */
  apiKey?: string | null;
}

const KEY_HEADER = 'X-DreamFactory-API-Key';

export function connectSnippet(
  client: ConnectClient,
  o: SnippetOptions
): string {
  const key = o.apiKey || null;
  const headers = key
    ? `,\n      "headers": { "${KEY_HEADER}": "${key}" }`
    : '';
  switch (client) {
    case 'claude':
      return (
        `{\n  "mcpServers": {\n    "${o.name}": {\n      "type": "http",\n` +
        `      "url": "${o.url}"${headers}\n    }\n  }\n}` +
        (key ? '' : '\n// Claude opens the DreamFactory login on first use.')
      );
    case 'cursor':
      return `{\n  "mcpServers": {\n    "${o.name}": {\n      "url": "${o.url}"${headers}\n    }\n  }\n}`;
    case 'vscode':
      return (
        `// .vscode/mcp.json\n{\n  "servers": {\n    "${o.name}": {\n      "type": "http",\n` +
        `      "url": "${o.url}"${headers}\n    }\n  }\n}`
      );
    case 'chatgpt':
      return key
        ? `Settings → Connectors → Create\n  Name: ${o.name}\n  MCP server URL: ${o.url}\n  Authentication: Custom header\n  ${KEY_HEADER}: ${key}`
        : `Settings → Connectors → Create\n  Name: ${o.name}\n  MCP server URL: ${o.url}\n  Authentication: OAuth\n// ChatGPT opens the DreamFactory login when you add the connector.`;
    case 'curl':
      return key
        ? `curl -X POST ${o.url} \\\n  -H '${KEY_HEADER}: ${key}' \\\n  -H 'Content-Type: application/json' \\\n  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'`
        : `# OAuth only: discover the authorization server, then use a bearer token\ncurl ${o.url}/.well-known/oauth-authorization-server\n\ncurl -X POST ${o.url} \\\n  -H 'Authorization: Bearer <token>' \\\n  -H 'Content-Type: application/json' \\\n  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'`;
  }
}

// ---------------------------------------------------------------- usage

export interface ToolUsage {
  tool_name: string;
  requests: number;
}

/**
 * Calls per backend over the usage window. Prefixed tools attribute to their
 * backend; merged verbs (no prefix) cannot, so they land on the `merged`
 * bucket the caller shows as "all databases".
 */
export function callsByBackend(
  byTool: ToolUsage[],
  backends: McpBackend[]
): { perBackend: Record<string, number>; merged: number } {
  const perBackend: Record<string, number> = {};
  let merged = 0;
  const prefixes = backends
    .map(b => ({ name: b.name, prefix: sanitizeApiName(b.name) + '_' }))
    .sort((a, b) => b.prefix.length - a.prefix.length);
  const bareVerbs = new Set(DB_VERBS.map(x => x.name));
  for (const row of byTool) {
    const hit = prefixes.find(p => row.tool_name.startsWith(p.prefix));
    if (hit) {
      perBackend[hit.name] = (perBackend[hit.name] ?? 0) + row.requests;
    } else if (bareVerbs.has(row.tool_name)) {
      merged += row.requests;
    }
  }
  return { perBackend, merged };
}
