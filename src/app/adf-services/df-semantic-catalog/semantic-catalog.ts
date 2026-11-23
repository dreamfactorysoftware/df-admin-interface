/**
 * Semantic catalog (df-semantic) model and the pure helpers behind the admin
 * editor. Shapes are the backend's verbatim snake_case: the case interceptor
 * skips /system/semantic so definitions round-trip exactly as agents get them
 * (maps_to, group_by, verified_queries, run_with).
 *
 * The client-side checks mirror only the cheap parts of the server's
 * validation (required fields, `*` only with COUNT, limit range, declared vs
 * used {placeholders}); the server stays the authority on tables and columns.
 */

export type SemanticKind = 'term' | 'metric' | 'query' | 'note';

/**
 * Translates a key under `services.semantic.` (the components pass
 * TranslocoService bound to that scope), so the pure helpers below carry no
 * English of their own.
 */
export type Translate = (
  key: string,
  params?: Record<string, unknown>
) => string;
export type NoteSeverity = 'warning' | 'info';
export type SemanticStatus = 'draft' | 'approved' | 'stale';

export const SEMANTIC_KINDS: SemanticKind[] = [
  'term',
  'metric',
  'query',
  'note',
];
export const NOTE_SEVERITIES: NoteSeverity[] = ['warning', 'info'];
export const SEMANTIC_STATUSES: SemanticStatus[] = [
  'draft',
  'approved',
  'stale',
];

export const AGGREGATE_FUNCTIONS = ['SUM', 'COUNT', 'AVG', 'MIN', 'MAX'];
export const PARAM_TYPES = ['string', 'number', 'integer', 'boolean', 'date'];

export interface SemanticParam {
  name: string;
  type: string;
  required?: boolean;
  description?: string;
}

export interface TermMapping {
  table: string;
  field?: string;
  value?: string;
  filter?: string;
}

export interface TermDefinition {
  meaning: string;
  synonyms?: string[];
  maps_to?: TermMapping;
  /** Shown to every role, even with no table (else: only roles that read every table). */
  service_wide?: boolean;
}

export interface MetricAggregate {
  function: string;
  field: string;
  alias?: string;
}

export interface MetricDefinition {
  table: string;
  aggregates: MetricAggregate[];
  filter?: string;
  group_by?: string[];
  unit?: string;
  params?: SemanticParam[];
  examples?: string[];
}

export interface QueryDefinition {
  question: string;
  table: string;
  fields?: string[];
  filter?: string;
  order?: string;
  limit?: number;
  related?: string;
  params?: SemanticParam[];
  examples?: string[];
}

export interface NoteTarget {
  table: string;
  field?: string;
}

/** A caveat agents must know: test rows, a misleading view name, a sentinel date. */
export interface NoteDefinition {
  text: string;
  severity: NoteSeverity;
  applies_to?: NoteTarget[];
  service_wide?: boolean;
}

export type SemanticDefinition =
  | TermDefinition
  | MetricDefinition
  | QueryDefinition
  | NoteDefinition;

export interface SemanticEntry {
  id: number;
  service: string;
  kind: SemanticKind;
  name: string;
  description: string | null;
  definition: any;
  status: SemanticStatus;
  source: string;
  stale_reason: string | null;
  approved_date: string | null;
  approved_by_id: number | null;
  created_date: string;
  last_modified_date: string;
}

export interface SemanticRunWith {
  tool: string;
  service?: string;
  arguments: Record<string, unknown>;
}

export interface SemanticPreviewBlock {
  guidance?: string;
  /** Approved warning notes, one sentence each, listed before the metrics. */
  warnings?: string[];
  glossary?: Array<{
    term: string;
    meaning: string;
    synonyms?: string[];
    /** The mapping, inlined by the server (older servers nest it as maps_to). */
    table?: string;
    field?: string;
    value?: string | number | boolean;
    filter?: string;
    maps_to?: TermMapping;
  }>;
  metrics?: Array<{
    name: string;
    description?: string;
    unit?: string;
    examples?: string[];
    params?: SemanticParam[];
    run_with: SemanticRunWith;
  }>;
  verified_queries?: Array<{
    name: string;
    question: string;
    description?: string;
    examples?: string[];
    params?: SemanticParam[];
    run_with: SemanticRunWith;
  }>;
  /** Approved info notes, after the queries. */
  notes?: string[];
  omitted?: unknown;
}

/** A glossary entry's mapping as "table.field = value" / "table where filter". */
export function glossaryTarget(
  g: {
    table?: string;
    field?: string;
    value?: unknown;
    filter?: string;
    maps_to?: TermMapping;
  },
  t: Translate
): string {
  const m = g.maps_to ?? g;
  if (!m.table) return '';
  let out = m.field ? `${m.table}.${m.field}` : m.table;
  if (m.value !== undefined && m.value !== null && m.value !== '') {
    out += ` = ${m.value}`;
  } else if (m.filter) out += t('summary.where', { filter: m.filter });
  return out;
}

/** Sources that put drafts in front of an admin without a human writing them. */
export const AUTOMATED_SOURCES = ['seeded', 'drafted', 'imported', 'harvested'];

export function isAutomated(source: string | null | undefined): boolean {
  return AUTOMATED_SOURCES.includes(source ?? '');
}

/** Drafts from automated sources, counted per source, for the review banner. */
export function reviewCounts(
  entries: Array<Pick<SemanticEntry, 'status' | 'source'>>
): {
  total: number;
  bySource: Record<string, number>;
} {
  const bySource: Record<string, number> = {};
  let total = 0;
  for (const e of entries) {
    if (e.status !== 'draft' || !isAutomated(e.source)) continue;
    total++;
    bySource[e.source] = (bySource[e.source] ?? 0) + 1;
  }
  return { total, bySource };
}

export interface SemanticSeedReport {
  candidates: number;
  created: number;
  skipped: number;
  entries: SemanticEntry[];
  dry_run?: boolean;
}

export interface SemanticRejected {
  index?: number;
  kind: string;
  name: string;
  reason: string;
}

export interface SemanticDraftReport {
  ai_service: string;
  model: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  proposed: number;
  created: number;
  rejected: SemanticRejected[];
  entries: SemanticEntry[];
  dry_run?: boolean;
}

export interface SemanticDraftRequest {
  ai_service: string;
  tables?: string[];
  max_entries?: number;
  model?: string;
  /** Opt-in: include sample rows in what the model reads. */
  include_samples?: boolean;
}

export interface SemanticImportReport {
  created: number;
  updated: number;
  unchanged: number;
  approved: number;
  failed: SemanticRejected[];
}

export interface SemanticExportDoc {
  service?: string;
  exported_at?: string;
  entries: Array<{
    kind: SemanticKind;
    name: string;
    description?: string | null;
    definition: any;
    status?: SemanticStatus;
  }>;
}

/** An export document from pasted text, or null when it is not one. */
export function parseExportDoc(text: string): SemanticExportDoc | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  const entries = Array.isArray(parsed)
    ? parsed
    : (parsed as { entries?: unknown })?.entries;
  if (!Array.isArray(entries)) return null;
  const doc = (Array.isArray(parsed) ? {} : parsed) as Record<string, unknown>;
  return { ...doc, entries } as SemanticExportDoc;
}

export interface AiConnectionRow {
  id: number;
  name: string;
  label?: string;
}

export interface SemanticValidateResult {
  checked: number;
  stale: Array<{
    id: number;
    kind: SemanticKind;
    name: string;
    reason: string;
  }>;
}

const PLACEHOLDER = /\{([A-Za-z_][A-Za-z0-9_]*)\}/g;
const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;

/** Distinct {placeholder} names a filter uses, in first-use order. */
export function filterPlaceholders(
  filter: string | null | undefined
): string[] {
  const out: string[] = [];
  for (const m of (filter ?? '').matchAll(PLACEHOLDER)) {
    if (!out.includes(m[1])) out.push(m[1]);
  }
  return out;
}

/**
 * Where a filter's placeholders and the declared params disagree: every
 * placeholder must be declared and every declared param must be used.
 */
export function paramMismatch(
  filter: string | null | undefined,
  params: SemanticParam[] | null | undefined
): { undeclared: string[]; unused: string[] } {
  const used = filterPlaceholders(filter);
  const declared = (params ?? []).map(p => p.name.trim()).filter(n => !!n);
  return {
    undeclared: used.filter(n => !declared.includes(n)),
    unused: declared.filter(n => !used.includes(n)),
  };
}

function trimmed(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function cleanStrings(list: unknown): string[] | undefined {
  const rows = (Array.isArray(list) ? list : []).map(trimmed).filter(s => !!s);
  return rows.length ? rows : undefined;
}

function cleanParams(params: SemanticParam[] | undefined) {
  const rows = (params ?? [])
    .filter(p => trimmed(p.name))
    .map(p => {
      // `required` is always explicit: the server stores the default (true),
      // so an untouched entry must compare equal to what it returned.
      const out: SemanticParam = {
        name: p.name.trim(),
        type: p.type,
        required: p.required !== false,
      };
      if (trimmed(p.description)) out.description = p.description!.trim();
      return out;
    });
  return rows.length ? rows : undefined;
}

/**
 * Drop empty optionals so the stored definition is what an admin would
 * write by hand (and so a no-op edit compares equal to the original).
 */
export function cleanDefinition(
  kind: SemanticKind,
  def: any
): SemanticDefinition {
  const put = (o: any, k: string, v: unknown) => {
    if (v === undefined || v === '' || v === null) return;
    if (Array.isArray(v) && !v.length) return;
    o[k] = v;
  };
  if (kind === 'term') {
    const out: any = { meaning: trimmed(def.meaning) };
    put(
      out,
      'synonyms',
      (def.synonyms ?? []).map(trimmed).filter((s: string) => !!s)
    );
    const m = def.maps_to;
    if (m && trimmed(m.table)) {
      const map: any = { table: m.table };
      put(map, 'field', trimmed(m.field));
      if (trimmed(m.field)) put(map, 'value', trimmed(m.value));
      put(map, 'filter', trimmed(m.filter));
      out.maps_to = map;
    }
    // Stored only when on, so an older entry round-trips unchanged.
    if (def.service_wide === true) out.service_wide = true;
    return out;
  }
  if (kind === 'note') {
    const out: any = {
      text: trimmed(def.text),
      severity: def.severity === 'info' ? 'info' : 'warning',
    };
    put(
      out,
      'applies_to',
      (def.applies_to ?? [])
        .filter((t: NoteTarget) => trimmed(t?.table))
        .map((t: NoteTarget) => {
          const target: any = { table: t.table };
          put(target, 'field', trimmed(t.field));
          return target;
        })
    );
    if (def.service_wide === true) out.service_wide = true;
    return out;
  }
  if (kind === 'metric') {
    const out: any = {
      table: def.table,
      aggregates: (def.aggregates ?? []).map((a: MetricAggregate) => {
        const agg: any = { function: a.function, field: a.field };
        put(agg, 'alias', trimmed(a.alias));
        return agg;
      }),
    };
    put(out, 'filter', trimmed(def.filter));
    put(out, 'group_by', def.group_by);
    put(out, 'unit', trimmed(def.unit));
    put(out, 'params', cleanParams(def.params));
    put(out, 'examples', cleanStrings(def.examples));
    return out;
  }
  const out: any = { question: trimmed(def.question), table: def.table };
  put(out, 'fields', def.fields);
  put(out, 'filter', trimmed(def.filter));
  put(out, 'order', trimmed(def.order));
  if (def.limit !== null && def.limit !== undefined && def.limit !== '') {
    out.limit = Number(def.limit);
  }
  put(out, 'related', trimmed(def.related));
  put(out, 'params', cleanParams(def.params));
  put(out, 'examples', cleanStrings(def.examples));
  return out;
}

function checkParams(
  params: SemanticParam[] | undefined,
  errors: string[],
  t: Translate
) {
  const seen = new Set<string>();
  for (const p of params ?? []) {
    const n = trimmed(p.name);
    if (!n) continue;
    if (!IDENTIFIER.test(n)) {
      errors.push(t('validation.paramName', { name: n }));
    }
    if (seen.has(n)) errors.push(t('validation.paramTwice', { name: n }));
    seen.add(n);
    if (!PARAM_TYPES.includes(p.type)) {
      errors.push(t('validation.paramType', { name: n }));
    }
  }
}

/** Blocking problems the server would reject anyway. Empty = OK to save. */
export function validateDefinition(
  kind: SemanticKind,
  def: any,
  name: string,
  t: Translate
): string[] {
  const errors: string[] = [];
  if (!trimmed(name)) errors.push(t('validation.name'));
  if (kind === 'term') {
    if (!trimmed(def.meaning)) errors.push(t('validation.meaning'));
    const m = def.maps_to;
    if (m && trimmed(m.value) && !trimmed(m.field)) {
      errors.push(t('validation.mapValueField'));
    }
    return errors;
  }
  if (kind === 'note') {
    if (!trimmed(def.text)) errors.push(t('validation.text'));
    (def.applies_to ?? []).forEach((target: NoteTarget, i: number) => {
      if (!trimmed(target?.table)) {
        errors.push(t('validation.targetTable', { n: i + 1 }));
      }
    });
    return errors;
  }
  if (!trimmed(def.table)) errors.push(t('validation.table'));
  if (kind === 'metric') {
    const aggs: MetricAggregate[] = def.aggregates ?? [];
    if (!aggs.length) errors.push(t('validation.aggregates'));
    aggs.forEach((a, i) => {
      if (!AGGREGATE_FUNCTIONS.includes(a.function)) {
        errors.push(t('validation.aggFunction', { n: i + 1 }));
      }
      if (!trimmed(a.field)) {
        errors.push(t('validation.aggField', { n: i + 1 }));
      } else if (a.field === '*' && a.function !== 'COUNT') {
        errors.push(t('validation.aggStar', { n: i + 1 }));
      }
    });
    checkParams(def.params, errors, t);
    return errors;
  }
  if (!trimmed(def.question)) errors.push(t('validation.question'));
  if (def.limit !== null && def.limit !== undefined && def.limit !== '') {
    const n = Number(def.limit);
    if (!Number.isInteger(n) || n < 1 || n > 1000) {
      errors.push(t('validation.limit'));
    }
  }
  checkParams(def.params, errors, t);
  return errors;
}

/** Key-order independent JSON, for "did the definition change" checks. */
export function stableStringify(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(',')}]`;
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    return `{${Object.keys(o)
      .filter(k => o[k] !== undefined)
      .sort()
      .map(k => `${JSON.stringify(k)}:${stableStringify(o[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(v);
}

/** One-line summary of an entry's definition for the list rows. */
export function summarize(
  entry: Pick<SemanticEntry, 'kind' | 'definition'>,
  t: Translate
) {
  const d = entry.definition ?? {};
  if (entry.kind === 'term') {
    const target = d.maps_to ? glossaryTarget({ maps_to: d.maps_to }, t) : '';
    return target ? `${d.meaning} → ${target}` : (d.meaning ?? '');
  }
  if (entry.kind === 'note') {
    const about = (d.applies_to ?? [])
      .map((t: NoteTarget) => (t.field ? `${t.table}.${t.field}` : t.table))
      .join(', ');
    return about ? `${about}: ${d.text ?? ''}` : (d.text ?? '');
  }
  if (entry.kind === 'metric') {
    const aggs = (d.aggregates ?? [])
      .map((a: MetricAggregate) => `${a.function}(${a.field})`)
      .join(', ');
    let s = t('summary.on', { aggregates: aggs, table: d.table });
    if (d.group_by?.length) {
      s += t('summary.by', { fields: d.group_by.join(', ') });
    }
    if (d.filter) s += t('summary.where', { filter: d.filter });
    return s;
  }
  return `${d.question ?? ''} → ${d.table ?? ''}`;
}

/** The server's error text for a failed call (400 bodies are not camelCased). */
export function serverMessage(err: any, t: Translate): string {
  const raw = err?.raw ?? err?.error;
  const msg =
    raw?.error?.message ??
    (typeof raw?.message === 'string' ? raw.message : null) ??
    err?.message;
  return typeof msg === 'string' && msg ? msg : t('errors.requestFailed');
}

/** How many table names a picker renders at once; typing narrows the rest. */
export const TABLE_PICKER_LIMIT = 50;

/**
 * Table names matching a typed query (case-insensitive substring, names that
 * start with it first), capped at `limit`. `hidden` is how many more matched.
 */
export function filterTables(
  tables: readonly string[],
  query: string,
  limit = TABLE_PICKER_LIMIT
): { matches: string[]; hidden: number } {
  const q = (query ?? '').trim().toLowerCase();
  const hits = q
    ? tables.filter(t => t.toLowerCase().includes(q))
    : [...tables];
  if (q) {
    const rank = (t: string) => (t.toLowerCase().startsWith(q) ? 0 : 1);
    hits.sort((a, b) => rank(a) - rank(b));
  }
  return {
    matches: hits.slice(0, limit),
    hidden: Math.max(0, hits.length - limit),
  };
}
