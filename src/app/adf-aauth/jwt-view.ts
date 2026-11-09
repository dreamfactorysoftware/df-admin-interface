/**
 * Display helpers for the protocol inspector: JWT decoding (no
 * verification; the server verifies), a JSON tokenizer for the viewer,
 * and small formatters. Pure functions, no Angular.
 */

export interface DecodedJwt {
  raw: string;
  header: Record<string, unknown> | null;
  payload: Record<string, unknown> | null;
  /** header.typ, e.g. aa-agent+jwt. */
  typ: string | null;
  /** payload.exp as epoch ms. */
  expMs: number | null;
}

export function base64UrlDecode(s: string): string {
  let b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  // Bytes to UTF-8 via percent-decoding (no TextDecoder dependency).
  const bin = atob(b64);
  let pct = '';
  for (let i = 0; i < bin.length; i++) {
    pct += '%' + bin.charCodeAt(i).toString(16).padStart(2, '0');
  }
  return decodeURIComponent(pct);
}

function segment(s: string | undefined): Record<string, unknown> | null {
  if (!s) return null;
  try {
    const v = JSON.parse(base64UrlDecode(s));
    return v && typeof v === 'object' && !Array.isArray(v) ? v : null;
  } catch {
    return null;
  }
}

export function decodeJwt(raw: string): DecodedJwt {
  const parts = (raw ?? '').trim().split('.');
  const header = parts.length === 3 ? segment(parts[0]) : null;
  const payload = parts.length === 3 ? segment(parts[1]) : null;
  const typ = typeof header?.['typ'] === 'string' ? header['typ'] : null;
  const exp = payload?.['exp'];
  return {
    raw,
    header,
    payload,
    typ,
    expMs: typeof exp === 'number' ? exp * 1000 : null,
  };
}

export type JsonTokenKind =
  | 'key'
  | 'string'
  | 'number'
  | 'literal'
  | 'punct'
  | 'space';

export interface JsonToken {
  text: string;
  kind: JsonTokenKind;
}

const TOKEN_RE =
  /("(?:\\.|[^"\\])*")(\s*:)?|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|(true|false|null)|([{}[\],:])|(\s+)/g;

/**
 * Splits pretty JSON into coloured spans, rendered with *ngFor (no
 * innerHTML). Anything unrecognised passes through as punctuation.
 */
export function tokenizeJson(text: string): JsonToken[] {
  const out: JsonToken[] = [];
  let last = 0;
  TOKEN_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = TOKEN_RE.exec(text))) {
    if (m.index > last) {
      out.push({ text: text.slice(last, m.index), kind: 'punct' });
    }
    if (m[1] !== undefined) {
      if (m[2] !== undefined) {
        out.push({ text: m[1], kind: 'key' });
        out.push({ text: m[2], kind: 'punct' });
      } else {
        out.push({ text: m[1], kind: 'string' });
      }
    } else if (m[3] !== undefined) {
      out.push({ text: m[3], kind: 'number' });
    } else if (m[4] !== undefined) {
      out.push({ text: m[4], kind: 'literal' });
    } else if (m[5] !== undefined) {
      out.push({ text: m[5], kind: 'punct' });
    } else {
      out.push({ text: m[6], kind: 'space' });
    }
    last = TOKEN_RE.lastIndex;
  }
  if (last < text.length) out.push({ text: text.slice(last), kind: 'punct' });
  return out;
}

export interface PrettyBody {
  json: boolean;
  text: string;
}

/** Pretty-prints a body when it parses as JSON; else returns it as is. */
export function prettyBody(body: string | null | undefined): PrettyBody {
  const text = body ?? '';
  const t = text.trim();
  if (t.startsWith('{') || t.startsWith('[')) {
    try {
      return { json: true, text: JSON.stringify(JSON.parse(t), null, 2) };
    } catch {
      /* not JSON */
    }
  }
  return { json: false, text };
}

export function prettyJson(v: unknown): string {
  return JSON.stringify(v, null, 2);
}

/** Host of a URL ("https://a.example" -> "a.example"); input on failure. */
export function hostOf(url: string | null | undefined): string {
  if (!url) return '';
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

/** Path + query of a URL; the input itself when it is not absolute. */
export function pathOf(url: string): string {
  try {
    const u = new URL(url);
    return u.pathname + u.search;
  } catch {
    return url;
  }
}

/** Origin of the issuer, without a trailing slash. */
export function originOf(url: string | null | undefined): string {
  if (!url) return '';
  try {
    return new URL(url).origin;
  } catch {
    return url.replace(/\/+$/, '');
  }
}

const PROTOCOL_HEADERS = new Set([
  'signature',
  'signature-input',
  'signature-key',
  'signature-error',
  'accept-signature',
  'content-digest',
  'aauth-requirement',
  'aauth-scope',
  'aauth-access',
  'aauth-mission',
  'link',
  'retry-after',
]);

/** Headers that carry the protocol, highlighted in the inspector. */
export function isProtocolHeader(name: string): boolean {
  return PROTOCOL_HEADERS.has(name.toLowerCase());
}

/** "sales.read sales.refund" -> ["sales.read", "sales.refund"]. */
export function splitScopes(scope: string | null | undefined): string[] {
  return (scope ?? '').split(/[\s,]+/).filter(Boolean);
}

export const SCOPE_RE = /^[a-z0-9][a-z0-9._:-]{0,63}$/;

/** Status pill variant for an HTTP status. */
export function statusVariant(
  status: number | null | undefined
): 'success' | 'warning' | 'danger' | 'neutral' | 'accent' {
  if (!status) return 'neutral';
  if (status >= 200 && status < 300)
    return status === 202 ? 'accent' : 'success';
  if (status === 401) return 'warning';
  if (status >= 400) return 'danger';
  return 'neutral';
}
