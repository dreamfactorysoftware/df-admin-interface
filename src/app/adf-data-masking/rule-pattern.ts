/**
 * Custom detection rules as the admin app writes them. The server takes a
 * PCRE pattern (case-insensitive, no delimiters, at most 500 characters);
 * the Add rule dialog builds one from a sentence ("Column name is emp_ssn
 * or social_sec") and the rule list reads the sentence back.
 *
 * describeRule recognises exactly the shapes compileRule writes, checked by
 * compiling its answer again; anything else is shown as the regex it is.
 */
import { DetectionRule } from './data-masking.types';

export type RuleTarget = DetectionRule['match'];
/** Operators that take terms (chips). */
export type TermOp =
  | 'is'
  | 'contains'
  | 'startsWith'
  | 'endsWith'
  | 'looksLike';
export type RuleOp = TermOp | 'regex';

export type RuleShape = { op: TermOp; terms: string[] } | { op: 'regex' };

/** Operators per target, in menu order; the first is the default. */
export const RULE_OPS: Record<RuleTarget, readonly RuleOp[]> = {
  name: ['is', 'contains', 'startsWith', 'endsWith', 'regex'],
  value: ['looksLike', 'contains', 'startsWith', 'regex'],
};

/** The server's pattern length limit. */
export const MAX_PATTERN = 500;

/** Terms are literal text (not a format mask, not a regex). */
export function isLiteralOp(op: RuleOp): boolean {
  return (
    op === 'is' || op === 'contains' || op === 'startsWith' || op === 'endsWith'
  );
}

export function opAllowed(target: RuleTarget, op: RuleOp): boolean {
  return RULE_OPS[target].includes(op);
}

/** PCRE metacharacters outside a character class. */
const META = '\\^$.[]|()?*+{}';

export function escapeLiteral(text: string): string {
  return text.replace(/[\\^$.[\]|()?*+{}]/g, '\\$&');
}

/**
 * A format mask: letters of any script become A (any letter), numbers of
 * any script and # become # (any digit), everything else stays literal. A
 * real example and the mask typed directly come out the same, and nothing
 * of the example but its punctuation survives: only the mask is ever sent.
 * A letter's combining marks belong to it; marks left on anything else are
 * dropped (on their own they are no format).
 */
export function toMask(text: string): string {
  return text
    .normalize('NFC')
    .replace(/\p{L}\p{M}*/gu, 'A')
    .replace(/[\p{N}#]/gu, '#')
    .replace(/\p{M}/gu, '');
}

/** A committed term: trimmed, masked for look like, null when blank. */
export function normalizeTerm(op: TermOp, raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  return op === 'looksLike' ? toMask(t) : t;
}

/**
 * The server's /u flag makes these Unicode-aware: \p{L} is any letter and
 * \d any decimal digit, in every script.
 */
const ANY_LETTER = '\\p{L}';
const ANY_DIGIT = '\\d';

function maskSource(mask: string): string {
  const count = (n: number) => (n > 1 ? `{${n}}` : '');
  return (mask.match(/A+|#+|[^A#]+/g) ?? [])
    .map(run => {
      if (run[0] === 'A') return `${ANY_LETTER}${count(run.length)}`;
      if (run[0] === '#') return `${ANY_DIGIT}${count(run.length)}`;
      return escapeLiteral(run);
    })
    .join('');
}

/**
 * The pattern for a sentence. Several terms mean "any of". Blank terms are
 * dropped; '' when nothing is left (or the operator is not the target's).
 */
export function compileRule(
  target: RuleTarget,
  op: RuleOp,
  input: string | readonly string[]
): string {
  if (!opAllowed(target, op)) return '';
  const list = typeof input === 'string' ? [input] : [...input];
  if (op === 'regex') return list.join('|').trim();
  const terms = list
    .map(t => normalizeTerm(op, t))
    .filter((t): t is string => !!t);
  if (!terms.length) return '';
  const parts = terms.map(t =>
    op === 'looksLike' ? maskSource(t) : escapeLiteral(t)
  );
  const body = parts.length === 1 ? parts[0] : `(?:${parts.join('|')})`;
  switch (op) {
    case 'is':
    case 'looksLike':
      return `^${body}$`;
    case 'startsWith':
      return `^${body}`;
    case 'endsWith':
      return `${body}$`;
    default:
      return body;
  }
}

/** `s` ends with `ch` that is not escaped (an even run of \ before it). */
function endsUnescaped(s: string, ch: string): boolean {
  if (!s.endsWith(ch)) return false;
  let slashes = 0;
  for (let i = s.length - 2; i >= 0 && s[i] === '\\'; i--) slashes++;
  return slashes % 2 === 0;
}

/** Split on unescaped |. */
function alternatives(s: string): string[] {
  const out: string[] = [];
  let cur = '';
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '\\') {
      cur += s.slice(i, i + 2);
      i++;
    } else if (s[i] === '|') {
      out.push(cur);
      cur = '';
    } else {
      cur += s[i];
    }
  }
  out.push(cur);
  return out;
}

/** The literal an escaped piece stands for, or null if it is not one. */
function unescapeLiteral(s: string): string | null {
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '\\') {
      const next = s[i + 1];
      if (next === undefined || !META.includes(next)) return null;
      out += next;
      i++;
    } else if (META.includes(c)) {
      return null;
    } else {
      out += c;
    }
  }
  return out;
}

/** The mask a compiled piece stands for, or null if it is not one. */
function unmask(s: string): string | null {
  let out = '';
  let i = 0;
  while (i < s.length) {
    const run = /^(\\p\{L\}|\\d)(?:\{(\d{1,3})\})?/.exec(s.slice(i));
    if (run) {
      const n = run[2] ? Number(run[2]) : 1;
      if (n < 1 || n > MAX_PATTERN) return null;
      out += (run[1] === ANY_LETTER ? 'A' : '#').repeat(n);
      i += run[0].length;
      continue;
    }
    const c = s[i];
    if (c === '\\') {
      const next = s[i + 1];
      if (next === undefined || !META.includes(next)) return null;
      out += next;
      i += 2;
    } else if (META.includes(c)) {
      return null;
    } else {
      out += c;
      i++;
    }
  }
  return out;
}

function candidate(
  match: RuleTarget,
  start: boolean,
  end: boolean
): TermOp | null {
  if (start && end) return match === 'name' ? 'is' : 'looksLike';
  if (start) return 'startsWith';
  if (end) return match === 'name' ? 'endsWith' : null;
  return 'contains';
}

/**
 * Read a rule back as its sentence: the operator and terms compileRule
 * would turn into exactly this pattern (plus `a|b` of plain literals, read
 * as contains), otherwise regex.
 */
export function describeRule(match: RuleTarget, pattern: string): RuleShape {
  const regex: RuleShape = { op: 'regex' };
  let body = pattern;
  const start = body.startsWith('^');
  if (start) body = body.slice(1);
  const end = endsUnescaped(body, '$');
  if (end) body = body.slice(0, -1);
  const op = candidate(match, start, end);
  if (!op || !body) return regex;

  const grouped = body.startsWith('(?:') && endsUnescaped(body, ')');
  const pieces = alternatives(grouped ? body.slice(3, -1) : body);
  const decode = op === 'looksLike' ? unmask : unescapeLiteral;
  const terms = pieces.map(decode);
  if (terms.some(t => t === null || !t.trim())) return regex;
  const shape = { op, terms: terms as string[] };
  if (compileRule(match, op, shape.terms) === pattern) return shape;
  // `ssn|tax_id`: an unwrapped alternation of plain literals.
  const unwrapped =
    op === 'contains' &&
    !grouped &&
    pieces.length > 1 &&
    shape.terms.every(t => t === t.trim()) &&
    shape.terms.map(escapeLiteral).join('|') === pattern;
  return unwrapped ? shape : regex;
}
