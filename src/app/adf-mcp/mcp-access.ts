/**
 * Pure model for the Tools tab's Access section: a role's
 * role_service_access rows collapsed per service, the changes an access
 * editor save proposes, the live summary shown before save, and the rows
 * that save PATCHes. Ported from the earlier MCP exposure page.
 *
 * No Angular, no HTTP — unit-tested in mcp-access.spec.ts.
 */

export type AccessLevel = 'none' | 'read' | 'rw';

/** verb_mask bits, as df-core encodes them. */
export const READ_MASK = 1; // GET
export const WRITE_MASK = 2 | 4 | 8 | 16; // POST PUT PATCH DELETE
export const FULL_MASK = 31;

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
  filters?: unknown[] | null;
}

/** GET on this component lets a table-limited role list tables. */
export const TABLE_LIST_COMPONENT = '_table/';
const TABLE_ROW = /^_table\/([^/*][^/]*)\/\*$/;

/** `_table/<name>/*` -> name; anything else -> null. */
export function tableOfComponent(component: string): string | null {
  const m = TABLE_ROW.exec(component);
  return m ? m[1] : null;
}

function isListingComponent(component: string): boolean {
  return component === TABLE_LIST_COMPONENT || component === '_table';
}

/**
 * What the access editor can show for one service: the level, the ticked
 * tables (null = whole API) and whether the rows are ones it manages.
 * Anything it cannot represent (row filters, differing per-table verbs,
 * _proc / _schema components, `*` mixed with table rows) makes the row
 * read-only, pointing at the role page.
 */
export interface ServiceGrantSpec {
  level: AccessLevel;
  tables: string[] | null;
  editable: boolean;
  mask: number;
}

export const NO_GRANT: ServiceGrantSpec = {
  level: 'none',
  tables: null,
  editable: true,
  mask: 0,
};

export function classifyServiceGrant(rows: RoleAccessRow[]): ServiceGrantSpec {
  const active = rows.filter(r => r.verbMask > 0);
  const mask = active.reduce((m, r) => m | r.verbMask, 0);
  if (active.length === 0) return { ...NO_GRANT };
  const filtered = active.some(
    r => Array.isArray(r.filters) && r.filters.length > 0
  );
  const star = active.filter(r => r.component === '*');
  const tableRows = active.filter(r => tableOfComponent(r.component));
  const listing = active.filter(r => isListingComponent(r.component));
  const others =
    active.length - star.length - tableRows.length - listing.length;
  const tables = tableRows.length
    ? tableRows.map(r => tableOfComponent(r.component) as string)
    : null;
  if (filtered || others > 0 || (star.length && tableRows.length)) {
    return { level: levelFromMask(mask), tables, editable: false, mask };
  }
  if (star.length) {
    const m = star.reduce((x, r) => x | r.verbMask, 0);
    return { level: levelFromMask(m), tables: null, editable: true, mask: m };
  }
  if (tableRows.length) {
    const m = tableRows[0].verbMask;
    if (tableRows.some(r => r.verbMask !== m)) {
      return { level: levelFromMask(mask), tables, editable: false, mask };
    }
    return { level: levelFromMask(m), tables, editable: true, mask: m };
  }
  // listing rows only: nothing readable
  return { level: 'none', tables: null, editable: true, mask };
}

/** Classify a role's rows for each of the given service ids. */
export function specsFor(
  rows: RoleAccessRow[],
  serviceIds: number[]
): Record<number, ServiceGrantSpec> {
  const out: Record<number, ServiceGrantSpec> = {};
  for (const id of serviceIds) {
    out[id] = classifyServiceGrant(rows.filter(r => r.serviceId === id));
  }
  return out;
}

export interface AccessChange {
  serviceId: number;
  label: string;
  before: AccessLevel;
  after: AccessLevel;
  /** Ticked tables before / after; null or missing = the whole API. */
  beforeTables?: string[] | null;
  tables?: string[] | null;
  /** How many tables the API has, when known (for "2 of 5 tables"). */
  tableTotal?: number;
}

function sameTables(a?: string[] | null, b?: string[] | null): boolean {
  return [...(a ?? [])].sort().join('|') === [...(b ?? [])].sort().join('|');
}

/** A change that a save has to write. */
export function accessChangeTouched(c: AccessChange): boolean {
  if (c.before !== c.after) return true;
  return c.after !== 'none' && !sameTables(c.beforeTables, c.tables);
}

export interface AccessChangeInput {
  serverId: number;
  serverLabel: string;
  backends: Array<{ id: number; label: string }>;
  /** Per-service classification; a non-editable spec is left untouched. */
  specs: Record<number, ServiceGrantSpec>;
  levels: Record<number, AccessLevel>;
  /** Ticked tables per backend (null / missing = whole API). */
  tables?: Record<number, string[] | null>;
  tableTotals?: Record<number, number>;
}

/**
 * The changes a role save proposes: the MCP server row (granted read when
 * the role has none — needed when require_role_access is on) plus one row
 * per backend. Grants the editor cannot represent are never rewritten.
 */
export function buildAccessChanges(i: AccessChangeInput): AccessChange[] {
  const changes: AccessChange[] = [];
  const server = i.specs[i.serverId] ?? NO_GRANT;
  if (server.editable) {
    changes.push({
      serviceId: i.serverId,
      label: i.serverLabel,
      before: server.level,
      after: server.level === 'none' ? 'read' : server.level,
    });
  }
  for (const b of i.backends) {
    const spec = i.specs[b.id] ?? NO_GRANT;
    if (!spec.editable) continue;
    const ticked = i.tables?.[b.id];
    const total = i.tableTotals?.[b.id];
    changes.push({
      serviceId: b.id,
      label: b.label,
      before: spec.level,
      after: i.levels[b.id] ?? 'none',
      ...(spec.tables?.length ? { beforeTables: spec.tables } : {}),
      ...(ticked?.length ? { tables: ticked } : {}),
      ...(total != null ? { tableTotal: total } : {}),
    });
  }
  return changes;
}

export type AccessDelta = '+write' | '-write' | '-access' | '~tables';

export interface AccessSummary {
  /** The server row: newly granted, kept as is, or not touched. */
  server: 'grant' | 'keep' | 'none';
  /** Backends that go from no access straight to a level. */
  read: string[];
  rw: string[];
  /** Every other transition: label + what changes. */
  deltas: Array<{ label: string; delta: AccessDelta }>;
  /** A table-limited grant is written: the listing row (_table/ GET) too. */
  listing: boolean;
}

/** "Demo MySQL (2 of 5 tables)" when the grant is table-limited. */
export function tableLabel(c: AccessChange): string {
  if (!c.tables?.length) return c.label;
  return c.tableTotal
    ? `${c.label} (${c.tables.length} of ${c.tableTotal} tables)`
    : `${c.label} (${c.tables.length} tables)`;
}

export function summarizeAccessChanges(
  changes: AccessChange[],
  serverId: number
): AccessSummary {
  const out: AccessSummary = {
    server: 'none',
    read: [],
    rw: [],
    deltas: [],
    listing: false,
  };
  for (const c of changes) {
    if (c.serviceId === serverId) {
      out.server = c.before === 'none' ? 'grant' : 'keep';
      continue;
    }
    if (!accessChangeTouched(c)) continue;
    if (c.after !== 'none' && c.tables?.length) out.listing = true;
    const label = tableLabel(c);
    if (c.before === c.after) {
      out.deltas.push({ label, delta: '~tables' });
    } else if (c.before === 'none') {
      (c.after === 'rw' ? out.rw : out.read).push(label);
    } else if (c.after === 'none') {
      out.deltas.push({ label: c.label, delta: '-access' });
    } else {
      out.deltas.push({
        label,
        delta: c.after === 'rw' ? '+write' : '-write',
      });
    }
  }
  return out;
}

export type AccessEditorMode = 'create' | 'add' | 'edit';

const DELTA_TEXT: Record<AccessDelta, string> = {
  '+write': '+ write on',
  '-write': '− write on',
  '-access': '− access on',
  '~tables': 'tables on',
};

const plural = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`;

/** The live one-line summary the editor shows before save — it is the diff. */
export function summaryText(
  s: AccessSummary,
  o: { mode: AccessEditorMode; roleName?: string; createKey?: boolean }
): string {
  const parts: string[] = [];
  if (o.mode === 'create') parts.push(`Creates role ${o.roleName || '…'}`);
  if (s.server === 'grant') parts.push('grants this MCP server');
  if (o.mode === 'edit') {
    // edit reads as a diff, one entry per backend
    s.read.forEach(l => parts.push(`+ read on ${l}`));
    s.rw.forEach(l => parts.push(`+ read and write on ${l}`));
  } else {
    if (s.read.length)
      parts.push(`read on ${plural(s.read.length, 'API', 'APIs')}`);
    if (s.rw.length) {
      parts.push(`read and write on ${plural(s.rw.length, 'API', 'APIs')}`);
    }
  }
  s.deltas.forEach(d => parts.push(`${DELTA_TEXT[d.delta]} ${d.label}`));
  if (s.listing) parts.push('plus table listing (GET _table/) on limited APIs');
  if (o.mode === 'create' && o.createKey) parts.push('creates an API key');
  return parts.length ? parts.join(', ') : 'No changes yet.';
}

/**
 * The role_service_access rows to PATCH for a set of changes.
 *
 * Whole API: one `*` row at the level (updated by id when it exists).
 * Table-limited: one `_table/<name>/*` row per ticked table at the level
 * plus a GET-only `_table/` row so the role can still list tables; no `*`
 * row. No access: every managed row is unlinked (`role_id: null`). Rows the
 * editor does not manage are never sent.
 */
export function accessRowsForChanges(
  changes: AccessChange[],
  existing: RoleAccessRow[]
): Array<Record<string, unknown>> {
  const out: Array<Record<string, unknown>> = [];
  const unlink = (r: RoleAccessRow) => {
    if (r.id != null) out.push({ id: r.id, role_id: null });
  };
  const upsert = (
    r: RoleAccessRow | undefined,
    serviceId: number,
    component: string,
    mask: number
  ) => {
    if (r?.id != null && r.verbMask === mask) return;
    out.push({
      ...(r?.id != null ? { id: r.id } : {}),
      service_id: serviceId,
      component,
      verb_mask: mask,
      requestor_mask: 3,
      filters: [],
      filter_op: 'AND',
    });
  };
  for (const c of changes) {
    if (!accessChangeTouched(c)) continue;
    const rows = existing.filter(r => r.serviceId === c.serviceId);
    const star = rows.find(r => r.component === '*');
    const tableRows = rows.filter(r => tableOfComponent(r.component));
    const listing = rows.filter(r => isListingComponent(r.component));
    if (c.after === 'none') {
      if (star) unlink(star);
      tableRows.forEach(unlink);
      listing.forEach(unlink);
      continue;
    }
    const mask = maskForLevel(c.after);
    if (!c.tables?.length) {
      upsert(star, c.serviceId, '*', mask);
      tableRows.forEach(unlink);
      listing.forEach(unlink);
      continue;
    }
    if (star) unlink(star);
    const ticked = new Set(c.tables);
    for (const r of tableRows) {
      if (!ticked.has(tableOfComponent(r.component) as string)) unlink(r);
    }
    for (const t of c.tables) {
      const r = tableRows.find(x => tableOfComponent(x.component) === t);
      upsert(r, c.serviceId, `_table/${t}/*`, mask);
    }
    const keep = listing.find(r => r.component === TABLE_LIST_COMPONENT);
    listing.filter(r => r !== keep).forEach(unlink);
    upsert(keep, c.serviceId, TABLE_LIST_COMPONENT, READ_MASK);
  }
  return out;
}

/** Rows granting read on the MCP server alone (one-click Grant). */
export function serverGrantRows(
  serverId: number,
  existing: RoleAccessRow[]
): Array<Record<string, unknown>> {
  const spec = specsFor(existing, [serverId])[serverId];
  if (spec.level !== 'none') return [];
  return accessRowsForChanges(
    [{ serviceId: serverId, label: '', before: 'none', after: 'read' }],
    existing
  );
}

/** Config flag reader: the service blob arrives snake- or camelCased. */
export function cfgFlag(
  rest: Record<string, any>,
  snake: string,
  camel: string,
  fallback: boolean
): boolean {
  const v = rest[snake] ?? rest[camel];
  if (v === undefined || v === null) return fallback;
  return v === true || v === 1 || v === '1' || v === 'true';
}

export function roleNameFrom(serverLabel: string): string {
  const base = serverLabel
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
  return base ? `${base}_access` : 'mcp_access';
}
