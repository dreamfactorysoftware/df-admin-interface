import { HttpErrorResponse } from '@angular/common/http';
import { FormGroup } from '@angular/forms';

/**
 * The single place that understands every error body shape in the app.
 * Everything downstream of the error interceptor consumes AppError.
 * Error bodies are NEVER case-transformed (case.interceptor maps success
 * responses only), so all envelope reads here are snake_case.
 */
export type AppErrorKind =
  | 'validation' // 422 (and 400 with context.resource)
  | 'auth' // 401
  | 'forbidden' // 403
  | 'not-found' // 404
  | 'server' // 5xx
  | 'network' // status 0 / ProgressEvent
  | 'client' // thrown before/after HTTP (TypeError etc.)
  | 'unknown';

export interface AppErrorField {
  /** best-effort control name; null when the server message can't be mapped */
  field: string | null;
  message: string;
}

export interface AppError {
  __appError: true;
  kind: AppErrorKind;
  status: number; // 0 for network/client
  /**
   * Always safe to render, never '[object Object]'. May be a translation
   * key (errors.*, alerts.*); display sites pipe through transloco, which
   * passes unknown keys (raw server messages) through unchanged.
   */
  message: string;
  fields: AppErrorField[]; // all context.resource[]/context.error[] messages, not just [0]
  code?: string; // envelope error.code when present
  url?: string; // failing request URL
  method?: string;
  timestamp: string; // ISO
  raw: unknown; // original body (or Error) for the detail expander
  /**
   * @deprecated Transitional bridge only: the original response body, kept so
   * legacy `err.error.error.message` / `err.error.error.context.resource[0]`
   * readers keep working until sweeps A-D migrate them to `message`/`fields`.
   * ponytail: delete this field once the call-site sweeps land.
   */
  error?: unknown;
}

export function isAppError(x: unknown): x is AppError {
  return (
    !!x &&
    typeof x === 'object' &&
    (x as { __appError?: unknown }).__appError === true
  );
}

const DUPLICATE_EMAIL_REGEX =
  /Duplicate entry '[^']+' for key '[^']*user_email_unique'/;
const DB_INTERNALS_REGEX = /SQLSTATE|Duplicate entry|ORA-\d|constraint/i;

/** Stop leaking database driver internals; the raw text stays in `raw`. */
function friendlyMessage(message: string): string {
  if (DUPLICATE_EMAIL_REGEX.test(message)) {
    return 'alerts.duplicateEmail';
  }
  if (DB_INTERNALS_REGEX.test(message)) {
    return 'errors.databaseConstraint';
  }
  return message;
}

// DSN / connection-string key=value pairs (PDO `host=`, `dbname=`, `user=`,
// `password=`; ODBC `Server=`, `Uid=`, `Pwd=`, `Data Source=`) and the
// PDO/MySQL "for user 'x'@'host'" clause. The headline `message` is already
// replaced via friendlyMessage, but the raw body still carries these; mask
// them before the raw body leaves the app on the clipboard.
const DSN_KEY_VALUE_REGEX =
  /\b(host(?:name)?|server|data\s*source|dbname|database|user(?:\s*(?:name|id))?|uid|password|pwd|port)(\s*=\s*)[^;,\s"']+/gi;
const DB_USER_AT_HOST_REGEX = /\buser\s+'[^']*'@'[^']*'/gi;
const DB_FOR_USER_REGEX = /\bfor\s+user\s+'[^']*'/gi;

/**
 * Mask connection-string internals (DSN host, hostname, DB user, password)
 * so the raw body is safe to copy into a support ticket. Keeps the rest of
 * the raw text intact for triage; only the sensitive tokens are redacted.
 */
export function scrubDbInternals(text: string): string {
  return text
    .replace(
      DSN_KEY_VALUE_REGEX,
      (_m, key: string, eq: string) => `${key}${eq}***`
    )
    .replace(DB_USER_AT_HOST_REGEX, "user '***'@'***'")
    .replace(DB_FOR_USER_REGEX, "for user '***'");
}

/** Collect context.resource[] / context.error[] messages; guards every step:
 * DF types context as string | object and 500s send `context: null`. */
function collectFields(context: unknown): AppErrorField[] {
  const fields: AppErrorField[] = [];
  if (!context || typeof context !== 'object') {
    return fields;
  }
  const ctx = context as Record<string, unknown>;
  for (const key of ['resource', 'error']) {
    const entries = ctx[key];
    if (!Array.isArray(entries)) {
      continue;
    }
    for (const entry of entries) {
      if (typeof entry === 'string' && entry) {
        fields.push({ field: null, message: friendlyMessage(entry) });
      } else if (
        entry &&
        typeof entry === 'object' &&
        typeof (entry as { message?: unknown }).message === 'string'
      ) {
        fields.push({
          field: null,
          message: friendlyMessage((entry as { message: string }).message),
        });
      }
    }
  }
  return fields;
}

function statusFallbackKey(status: number): string {
  if (status >= 500) {
    return 'errors.http5xx';
  }
  if (status >= 400) {
    return 'errors.http4xx';
  }
  return 'errors.unknown';
}

function kindFromStatus(status: number, hasFields: boolean): AppErrorKind {
  switch (status) {
    case 401:
      return 'auth';
    case 403:
      return 'forbidden';
    case 404:
      return 'not-found';
    case 422:
      return 'validation';
    case 400:
      return hasFields ? 'validation' : 'unknown';
    default:
      return status >= 500 ? 'server' : 'unknown';
  }
}

export function normalizeError(
  err: unknown,
  ctx?: { url?: string; method?: string }
): AppError {
  // Idempotent: interceptor and component may both call it.
  if (isAppError(err)) {
    return err;
  }
  const timestamp = new Date().toISOString();

  if (!(err instanceof HttpErrorResponse)) {
    const message =
      err instanceof Error
        ? err.message || 'errors.unknown'
        : typeof err === 'string' && err
          ? err
          : 'errors.unknown';
    return {
      __appError: true,
      kind: 'client',
      status: 0,
      message,
      fields: [],
      url: ctx?.url,
      method: ctx?.method,
      timestamp,
      raw: err,
    };
  }

  const url = ctx?.url ?? err.url ?? undefined;
  const method = ctx?.method;

  if (err.status === 0 || err.error instanceof ProgressEvent) {
    return {
      __appError: true,
      kind: 'network',
      status: 0,
      message: 'errors.network',
      fields: [],
      url,
      method,
      timestamp,
      raw: err.error ?? err.message,
    };
  }

  const body: unknown = err.error;
  let message: string | null = null;
  let code: string | undefined;
  let fields: AppErrorField[] = [];
  let bridge: unknown;

  const isJsonParseWrapper =
    !!body &&
    typeof body === 'object' &&
    typeof (body as { text?: unknown }).text === 'string' &&
    (body as { error?: unknown }).error instanceof Error;

  if (body && typeof body === 'object' && !isJsonParseWrapper) {
    bridge = body;
    const envelope = (body as { error?: unknown }).error;
    if (
      envelope &&
      typeof envelope === 'object' &&
      typeof (envelope as { message?: unknown }).message === 'string'
    ) {
      // Canonical DF envelope: { error: { code, message, context, status_code } }
      const env = envelope as {
        message: string;
        code?: unknown;
        context?: unknown;
      };
      message = friendlyMessage(env.message);
      if (env.code !== undefined && env.code !== null) {
        code = String(env.code);
      }
      fields = collectFields(env.context);
    } else if (typeof (body as { message?: unknown }).message === 'string') {
      // Flat variant: { message: '...' }
      message = friendlyMessage((body as { message: string }).message);
    }
  }
  // String bodies (proxy/PHP-fatal HTML, plain text), JSON parse wrappers and
  // empty bodies all fall through to the status-class fallback; the raw body
  // is preserved for the detail expander, never rendered as the headline.
  if (!message) {
    message = statusFallbackKey(err.status);
  }

  return {
    __appError: true,
    kind: kindFromStatus(err.status, fields.length > 0),
    status: err.status,
    message,
    fields,
    code,
    url,
    method,
    timestamp,
    raw: body ?? err.message,
    error: bridge,
  };
}

function rawAsText(raw: unknown, limit = 4096): string {
  let text: string;
  if (raw instanceof Error) {
    text = `${raw.name}: ${raw.message}`;
  } else if (typeof raw === 'string') {
    text = raw;
  } else {
    try {
      text = JSON.stringify(raw, null, 2) ?? String(raw);
    } catch {
      text = String(raw);
    }
  }
  if (text.length > limit) {
    text = `${text.slice(0, limit)}\n... [truncated]`;
  }
  return text;
}

/** Pretty raw body for the detail expander, truncated at 4KB. */
export function rawErrorBody(e: AppError): string {
  return rawAsText(e.raw);
}

/**
 * One-string support bundle: timestamp, status, method+URL, message, field
 * messages, raw body (JSON, truncated 4KB). Pasted into support tickets
 * instead of screenshots of a toast.
 */
export function formatForSupport(e: AppError): string {
  const lines = [
    'DreamFactory Admin Interface error report',
    `Time: ${e.timestamp}`,
    `Status: ${e.status}${e.code ? ` (code ${e.code})` : ''} [${e.kind}]`,
  ];
  if (e.method || e.url) {
    lines.push(`Request: ${[e.method, e.url].filter(Boolean).join(' ')}`);
  }
  lines.push(`Message: ${e.message}`);
  if (e.fields.length) {
    lines.push('Field errors:');
    e.fields.forEach(f =>
      lines.push(`  - ${f.field ? `${f.field}: ` : ''}${f.message}`)
    );
  }
  lines.push(`Raw: ${scrubDbInternals(rawAsText(e.raw))}`);
  return lines.join('\n');
}

function toSnakeCase(name: string): string {
  return name.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`);
}

function toCamelCase(name: string): string {
  return name.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

function matchControlName(
  controlNames: string[],
  field: string | null,
  message: string
): string | null {
  if (field) {
    const camel = toCamelCase(field);
    const exact = controlNames.find(n => n === field || n === camel);
    if (exact) {
      return exact;
    }
  }
  // DF messages usually name the column; best-effort substring match.
  const lower = message.toLowerCase();
  return (
    controlNames.find(
      n =>
        n.length > 2 &&
        (lower.includes(n.toLowerCase()) || lower.includes(toSnakeCase(n)))
    ) ?? null
  );
}

/**
 * Maps AppError.fields onto form controls (setErrors({server}) + touched) and
 * returns the messages that could not be mapped, for the caller's banner.
 * Mapping is best-effort: the DF envelope has no structured field key, so the
 * banner is the guaranteed fallback and must always list ALL messages.
 * Templates add one shared mat-error line:
 *   <mat-error *ngIf="ctrl.hasError('server')">{{ ctrl.getError('server') }}</mat-error>
 */
export function applyServerErrorsToForm(
  form: FormGroup,
  e: AppError
): string[] {
  const unmatched: string[] = [];
  const controlNames = Object.keys(form.controls);
  for (const { field, message } of e.fields) {
    const name = matchControlName(controlNames, field, message);
    const control = name ? form.get(name) : null;
    if (control) {
      control.setErrors({ ...control.errors, server: message });
      control.markAsTouched();
    } else {
      unmatched.push(message);
    }
  }
  return unmatched;
}

/**
 * Fallback payload for list-route resolvers: navigation completes and the
 * table shell renders the error state with Retry instead of the router
 * silently cancelling navigation. Only for the list branch of resolvers;
 * detail branches keep their own error contract.
 */
export function emptyListWithError(err: unknown): {
  resource: never[];
  meta: { count: number };
  __error: AppError;
} {
  return { resource: [], meta: { count: 0 }, __error: normalizeError(err) };
}
