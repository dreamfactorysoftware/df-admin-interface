import { BrowserContext, ConsoleMessage, Response } from '@playwright/test';
import { BASE_URL } from './env';

/**
 * Console and network watcher (auto fixture). It fails the test on a
 * console.error, an uncaught exception, an NG0 code, an HTTP >= 400 from the
 * app origin or a failed request, unless declared with `allowHttp` /
 * `allowConsole`. An allowance that never matches also fails the test.
 */
interface HttpAllowance {
  status: number | number[];
  /** Matched against `pathname + search` of the request URL. */
  url: RegExp;
  method?: string;
  reason: string;
  /** Do not fail when the allowance never matched (data dependent noise). */
  optional?: boolean;
}

interface ConsoleAllowance {
  pattern: RegExp;
  reason: string;
  optional?: boolean;
  hits: number;
}

type TrackedHttpAllowance = HttpAllowance & { hits: number };

/**
 * Responses that every flow would trip over and that are not what the flow
 * is about. Each entry says why. Remove a known-defect entry with its fix.
 */
const BASELINE: HttpAllowance[] = [
  {
    status: 401,
    method: 'POST',
    url: /^\/api\/v2\/user\/session\/?$/,
    reason:
      'by design: the login form posts to user/session first and falls back ' +
      'to system/admin/session, so every admin login starts with one 401',
  },
  {
    status: 404,
    method: 'GET',
    url: /^\/api\/v2\/system\/access_usage\b/,
    reason:
      'capability probe: the access-usage package is absent on the base ' +
      'backend image; the lists hide the "last used" column when it is',
  },
  {
    status: 404,
    method: 'GET',
    url: /^\/_internal\/ai\/aliases\/?$/,
    reason:
      'capability probe: a backend without the AI budgets API answers 404 ' +
      'once per admin login; the app hides the budgets entry points',
  },
  {
    status: 400,
    method: 'GET',
    url: /^\/api\/v2\/system\/lookup\?filter=name(=|%3D)%22intercom_widget_enabled%22/,
    reason:
      'df-admin-interface#579: the logged-out login page asks for a protected ' +
      'lookup key and gets 400 on every load',
  },
];

const NG_CODE = /\bNG0\d{3,4}\b/;
// Chromium prints this line for every failed fetch. The response and
// requestfailed listeners report the same event with the URL and status.
const BROWSER_NETWORK_NOTICE = /^Failed to load resource:/;

export class Watcher {
  private problems: string[] = [];
  private pending: Promise<void>[] = [];
  private http: TrackedHttpAllowance[] = [];
  private consoleAllow: ConsoleAllowance[] = [];
  private origin = new URL(BASE_URL).origin;
  /** Every same-origin non-GET request, for "no request was sent" checks. */
  readonly writes: { method: string; path: string; status?: number }[] = [];

  constructor(context: BrowserContext) {
    for (const a of BASELINE) this.allowHttp({ ...a, optional: true });
    context.on('console', msg => this.onConsole(msg));
    context.on('weberror', err =>
      this.problems.push(`uncaught exception: ${err.error().message}`)
    );
    context.on('response', res => this.onResponse(res));
    context.on('request', req => {
      if (req.method() !== 'GET' && req.url().startsWith(this.origin)) {
        const u = new URL(req.url());
        this.writes.push({ method: req.method(), path: u.pathname + u.search });
      }
    });
    context.on('requestfailed', req => {
      const failure = req.failure()?.errorText ?? '';
      // A navigation or a route change cancels requests in flight.
      if (/ERR_ABORTED|NS_BINDING_ABORTED|cancelled/i.test(failure)) return;
      if (!req.url().startsWith(this.origin)) return;
      this.problems.push(
        `request failed: ${req.method()} ${req.url()} (${failure})`
      );
    });
  }

  /** Declare an expected HTTP failure. */
  allowHttp(a: HttpAllowance): void {
    this.http.push({ ...a, hits: 0 });
  }

  /** Declare an expected console.error. */
  allowConsole(pattern: RegExp, reason: string, optional = false): void {
    this.consoleAllow.push({ pattern, reason, optional, hits: 0 });
  }

  /** Write requests (non-GET) whose path matches, in the order sent. */
  writesTo(path: RegExp): { method: string; path: string }[] {
    return this.writes.filter(w => path.test(w.path));
  }

  /** Called by the fixture after the test body. Returns what went wrong. */
  async finish(): Promise<string[]> {
    await Promise.allSettled(this.pending);
    const out = [...this.problems];
    for (const a of this.http) {
      if (!a.hits && !a.optional) {
        out.push(
          `allowance never matched: HTTP ${a.status} ${a.url} (${a.reason})`
        );
      }
    }
    for (const a of this.consoleAllow) {
      if (!a.hits && !a.optional) {
        out.push(`allowance never matched: console ${a.pattern} (${a.reason})`);
      }
    }
    return out;
  }

  private onResponse(res: Response): void {
    const status = res.status();
    const url = res.url();
    if (!url.startsWith(this.origin)) return;
    const req = res.request();
    const u = new URL(url);
    const path = u.pathname + u.search;
    if (req.method() !== 'GET') {
      // Last write with this method and path that has no status yet.
      const w = [...this.writes]
        .reverse()
        .find(
          x =>
            x.method === req.method() &&
            x.path === path &&
            x.status === undefined
        );
      if (w) w.status = status;
    }
    if (status < 400) return;
    const allowed = this.http.find(
      a =>
        (Array.isArray(a.status)
          ? a.status.includes(status)
          : a.status === status) &&
        (!a.method || a.method === req.method()) &&
        a.url.test(path)
    );
    if (allowed) {
      allowed.hits += 1;
      return;
    }
    this.pending.push(
      res
        .text()
        .catch(() => '')
        .then(body => {
          this.problems.push(
            `HTTP ${status}: ${req.method()} ${path} ${body.slice(0, 300)}`
          );
        })
    );
  }

  private onConsole(msg: ConsoleMessage): void {
    const type = msg.type();
    const raw = msg.text();
    if (type !== 'error' && !NG_CODE.test(raw)) return;
    if (BROWSER_NETWORK_NOTICE.test(raw)) return;
    // `console.error('ERROR', err)` prints the Error as "JSHandle@object";
    // read the real message and stack out of the page.
    this.pending.push(
      Promise.all(
        msg
          .args()
          .map(a =>
            a
              .evaluate(v =>
                v instanceof Error
                  ? `${v.name}: ${v.message}\n${v.stack ?? ''}`
                  : typeof v === 'object'
                    ? JSON.stringify(v)
                    : String(v)
              )
              .catch(() => '')
          )
      )
        .then(parts => parts.filter(Boolean).join(' ') || raw)
        .catch(() => raw)
        .then(text => {
          const allowed = this.consoleAllow.find(a => a.pattern.test(text));
          if (allowed) {
            allowed.hits += 1;
            return;
          }
          const where = msg.location()?.url ?? '';
          this.problems.push(
            `console.${type}: ${text.slice(0, 1200)}${where ? ` [${where}]` : ''}`
          );
        })
    );
  }
}
