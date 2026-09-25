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

export type SemanticKind = 'term' | 'metric' | 'query';
export type SemanticStatus = 'draft' | 'approved' | 'stale';

export const SEMANTIC_KINDS: SemanticKind[] = ['term', 'metric', 'query'];
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
}

export type SemanticDefinition =
  | TermDefinition
  | MetricDefinition
  | QueryDefinition;

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
  glossary?: Array<{
    term: string;
    meaning: string;
    synonyms?: string[];
    maps_to?: TermMapping;
  }>;
  metrics?: Array<{
    name: string;
    description?: string;
    unit?: string;
    params?: SemanticParam[];
    run_with: SemanticRunWith;
  }>;
  verified_queries?: Array<{
    name: string;
    question: string;
    description?: string;
    params?: SemanticParam[];
    run_with: SemanticRunWith;
  }>;
  omitted?: unknown;
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
  return out;
}

function checkParams(params: SemanticParam[] | undefined, errors: string[]) {
  const seen = new Set<string>();
  for (const p of params ?? []) {
    const n = trimmed(p.name);
    if (!n) continue;
    if (!IDENTIFIER.test(n)) {
      errors.push(
        `Param "${n}" must start with a letter or _ and use only letters, digits and _.`
      );
    }
    if (seen.has(n)) errors.push(`Param "${n}" is declared twice.`);
    seen.add(n);
    if (!PARAM_TYPES.includes(p.type)) {
      errors.push(`Param "${n}" needs a type.`);
    }
  }
}

/** Blocking problems the server would reject anyway. Empty = OK to save. */
export function validateDefinition(
  kind: SemanticKind,
  def: any,
  name: string
): string[] {
  const errors: string[] = [];
  if (!trimmed(name)) errors.push('Name is required.');
  if (kind === 'term') {
    if (!trimmed(def.meaning)) errors.push('Meaning is required.');
    const m = def.maps_to;
    if (m && trimmed(m.value) && !trimmed(m.field)) {
      errors.push('A mapped value needs a field.');
    }
    return errors;
  }
  if (!trimmed(def.table)) errors.push('Pick a table.');
  if (kind === 'metric') {
    const aggs: MetricAggregate[] = def.aggregates ?? [];
    if (!aggs.length) errors.push('Add at least one aggregate.');
    aggs.forEach((a, i) => {
      if (!AGGREGATE_FUNCTIONS.includes(a.function)) {
        errors.push(`Aggregate ${i + 1} needs a function.`);
      }
      if (!trimmed(a.field)) {
        errors.push(`Aggregate ${i + 1} needs a field.`);
      } else if (a.field === '*' && a.function !== 'COUNT') {
        errors.push(`Aggregate ${i + 1}: * only works with COUNT.`);
      }
    });
    checkParams(def.params, errors);
    return errors;
  }
  if (!trimmed(def.question)) errors.push('Question is required.');
  if (def.limit !== null && def.limit !== undefined && def.limit !== '') {
    const n = Number(def.limit);
    if (!Number.isInteger(n) || n < 1 || n > 1000) {
      errors.push('Limit must be a whole number from 1 to 1000.');
    }
  }
  checkParams(def.params, errors);
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
export function summarize(entry: Pick<SemanticEntry, 'kind' | 'definition'>) {
  const d = entry.definition ?? {};
  if (entry.kind === 'term') {
    const m = d.maps_to;
    let target = '';
    if (m?.table) {
      target = m.field ? `${m.table}.${m.field}` : m.table;
      if (m.value) target += ` = ${m.value}`;
      else if (m.filter) target += ` where ${m.filter}`;
    }
    return target ? `${d.meaning} → ${target}` : (d.meaning ?? '');
  }
  if (entry.kind === 'metric') {
    const aggs = (d.aggregates ?? [])
      .map((a: MetricAggregate) => `${a.function}(${a.field})`)
      .join(', ');
    let s = `${aggs} on ${d.table}`;
    if (d.group_by?.length) s += ` by ${d.group_by.join(', ')}`;
    if (d.filter) s += ` where ${d.filter}`;
    return s;
  }
  return `${d.question ?? ''} → ${d.table ?? ''}`;
}

/** The server's error text for a failed call (400 bodies are not camelCased). */
export function serverMessage(err: any): string {
  const raw = err?.raw ?? err?.error;
  const msg =
    raw?.error?.message ??
    (typeof raw?.message === 'string' ? raw.message : null) ??
    err?.message;
  return typeof msg === 'string' && msg ? msg : 'Request failed.';
}
