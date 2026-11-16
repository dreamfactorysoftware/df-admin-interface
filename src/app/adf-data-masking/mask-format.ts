/**
 * Renders a value the way a mask format would return it. Masked characters
 * become MASK_GLYPH runs, which <df-masked-value> paints as redaction bars.
 * Pure TypeScript: shared by the UI (Masks tab examples), the Playwright
 * mock and the fixture generator.
 */
import { MaskFormat, classDef } from './data-masking.catalog';

/**
 * U+2022 BULLET: the mask character in every masked value the server
 * returns (backend contract, section 2). The UI paints runs of it as bars.
 */
export const MASK_GLYPH = '\u2022';

const REDACT_RUN = 8;
const SPAN_RUN = 6;

const SPAN_PATTERNS: RegExp[] = [
  /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, // email
  /\b(?:\d[ -]?){13,19}\b/g, // card-like digit runs
  /\b\d{3}-\d{2}-\d{4}\b/g, // US SSN
  /(?:\+\d{1,3}[ .-]?)?\(?\d{3}\)?[ .-]?\d{3}[ .-]?\d{4}\b/g, // phone
];

const run = (n: number) => MASK_GLYPH.repeat(Math.max(1, n));

/**
 * FNV-1a, 8 lowercase hex chars, the same shape as the server's tokens
 * (first 8 hex of a keyed HMAC-SHA256). Stable across runs; not a secret:
 * it only drives synthetic examples and the Playwright mock.
 */
export function shortHash(value: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

function maskAllButLast(value: string, keep: number): string {
  const alnum = value.replace(/[^A-Za-z0-9]/g, '').length;
  let toMask = Math.max(0, alnum - keep);
  if (alnum <= keep) return run(REDACT_RUN);
  let out = '';
  for (const ch of value) {
    if (/[A-Za-z0-9]/.test(ch) && toMask > 0) {
      out += MASK_GLYPH;
      toMask--;
    } else {
      out += ch;
    }
  }
  return out;
}

function initials(value: string): string {
  const at = value.indexOf('@');
  if (at > 0) {
    const local = value.slice(0, at);
    const domain = value.slice(at + 1);
    const dot = domain.lastIndexOf('.');
    const host = dot > 0 ? domain.slice(0, dot) : domain;
    const tld = dot > 0 ? domain.slice(dot) : '';
    return `${local[0]}${run(local.length - 1)}@${run(host.length)}${tld}`;
  }
  return value
    .split(/(\s+)/)
    .map(part =>
      /^\s+$/.test(part) || part.length === 0
        ? part
        : `${part[0]}${part.length > 1 ? run(part.length - 1) : ''}`
    )
    .join('');
}

function yearOnly(value: string): string {
  const m = value.match(/\b(19|20)\d{2}\b/);
  if (m && m.index !== undefined) {
    const before = value.slice(0, m.index).replace(/[0-9]/g, MASK_GLYPH);
    const after = value
      .slice(m.index + 4)
      .replace(/[0-9]/g, MASK_GLYPH)
      .replace(/T.*$/, '');
    return `${before}${m[0]}${after}`;
  }
  // MM/YY: keep the trailing group (the year).
  const parts = value.split(/([/-])/);
  if (parts.length >= 3) {
    return parts
      .map((p, i) =>
        i === parts.length - 1 || /^[/-]$/.test(p) ? p : run(p.length)
      )
      .join('');
  }
  return run(REDACT_RUN);
}

/** Replace detected personal-data spans inside free text. */
export function maskSpans(text: string): string {
  let out = text;
  for (const re of SPAN_PATTERNS) {
    out = out.replace(re, () => run(SPAN_RUN));
  }
  return out;
}

export function tokenFor(classId: string, value: string): string {
  const prefix = classDef(classId)?.token ?? 'VAL';
  return `${prefix}_${shortHash(`${classId}:${value}`)}`;
}

/**
 * Masked rendering of `value` for `format`. Returns null for the null
 * format. `classId` only matters for token prefixes.
 */
export function applyMask(
  value: string,
  format: MaskFormat,
  classId: string
): string | null {
  const v = String(value ?? '');
  switch (format) {
    case 'null':
      return null;
    case 'token':
      return tokenFor(classId, v);
    case 'last4':
      return maskAllButLast(v, 4);
    case 'initial':
      return v ? initials(v) : run(REDACT_RUN);
    case 'year':
      return yearOnly(v);
    case 'span':
      return maskSpans(v);
    case 'redact':
    default:
      return run(REDACT_RUN);
  }
}

/** The Masks tab example: the class's synthetic sample through `format`. */
export function sampleMask(
  classId: string,
  format: MaskFormat
): { before: string; after: string | null } {
  const def = classDef(classId);
  const before = def?.sample ?? '';
  return { before, after: applyMask(before, format, classId) };
}

export interface MaskSegment {
  kind: 'text' | 'bar';
  text: string;
  /** Glyph count for bars. */
  length: number;
}

/** Split a masked string into plain text and bar runs. */
export function segmentMasked(masked: string): MaskSegment[] {
  const segs: MaskSegment[] = [];
  const re = new RegExp(`${MASK_GLYPH}+|[^${MASK_GLYPH}]+`, 'g');
  for (const m of masked.match(re) ?? []) {
    if (m[0] === MASK_GLYPH) {
      segs.push({ kind: 'bar', text: m, length: m.length });
    } else {
      segs.push({ kind: 'text', text: m, length: m.length });
    }
  }
  return segs;
}

/**
 * A typed token: `<PREFIX>_<hex>`. The server emits 8 lowercase hex chars;
 * 4-16 are accepted so a future key/prefix change never renders a token as
 * a raw value (the masked-value guard would draw a full bar instead).
 */
export const TOKEN_RE = /^[A-Z][A-Z0-9]*_[0-9a-f]{4,16}$/;
