import { APIRequestContext, APIResponse } from '@playwright/test';
import { Credentials, ROOT_ADMIN, SEED, assertWritableTarget } from './env';
import { E2E_PREFIX } from './names';

/**
 * DreamFactory REST client for setup, read-back and cleanup. It refuses a
 * target without the gate seed, and refuses to create or delete a record
 * whose name does not start with `e2e_`.
 */
type SystemResource =
  | 'service'
  | 'app'
  | 'user'
  | 'scheduler'
  | 'email_template';

/** The field that carries the `e2e_` name, per resource. */
const NAME_FIELD: Record<SystemResource, string> = {
  service: 'name',
  app: 'name',
  user: 'email',
  scheduler: 'name',
  email_template: 'name',
};

interface Tracked {
  resource: SystemResource;
  /** Value of the resource's name field. */
  name: string;
}

function isE2eName(value: unknown): boolean {
  return typeof value === 'string' && value.startsWith(E2E_PREFIX);
}

export class FlowApi {
  private tracked: Tracked[] = [];

  private constructor(
    private ctx: APIRequestContext,
    readonly token: string
  ) {}

  /** Log in (root admin by default) after the two target checks. */
  static async login(
    ctx: APIRequestContext,
    creds: Credentials = ROOT_ADMIN
  ): Promise<FlowApi> {
    assertWritableTarget();
    const res = await ctx.post('/api/v2/system/admin/session', {
      data: { email: creds.email, password: creds.password },
    });
    if (!res.ok()) {
      throw new Error(
        `API login as ${creds.email} failed: HTTP ${res.status()} ${await res.text()}`
      );
    }
    const api = new FlowApi(ctx, (await res.json()).session_token);
    if (creds === ROOT_ADMIN) await api.assertGateStack();
    return api;
  }

  /** The seeded marker service must exist, or this is not the gate stack. */
  private async assertGateStack(): Promise<void> {
    const rows = await this.list('service', {
      filter: `name=${SEED.sampleDbService}`,
      fields: 'id,name',
    });
    if (rows.length !== 1) {
      throw new Error(
        `e2e/flows refuses to run: the instance has no "${SEED.sampleDbService}" ` +
          'service, so it is not the seeded gate stack. The flow suite writes ' +
          'to the backend and must never run against a shared instance.'
      );
    }
  }

  headers(): Record<string, string> {
    return { 'X-DreamFactory-Session-Token': this.token };
  }

  /** Any request with the admin session. Never throws on a status. */
  raw(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    data?: unknown,
    headers: Record<string, string> = {}
  ): Promise<APIResponse> {
    return this.ctx.fetch(path, {
      method,
      headers: { ...this.headers(), ...headers },
      data: data as any,
    });
  }

  /**
   * A request WITHOUT the admin session: what an API consumer sends. Use it
   * to prove that an API key and its role are enforced by the backend.
   */
  asClient(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    opts: { apiKey?: string; sessionToken?: string; data?: unknown } = {}
  ): Promise<APIResponse> {
    const headers: Record<string, string> = {};
    if (opts.apiKey) headers['X-DreamFactory-API-Key'] = opts.apiKey;
    if (opts.sessionToken)
      headers['X-DreamFactory-Session-Token'] = opts.sessionToken;
    return this.ctx.fetch(path, { method, headers, data: opts.data as any });
  }

  private async json(res: APIResponse, what: string): Promise<any> {
    if (!res.ok()) {
      throw new Error(
        `${what} -> HTTP ${res.status()} ${(await res.text()).slice(0, 600)}`
      );
    }
    return res.json();
  }

  async list(
    resource: SystemResource,
    params: {
      filter?: string;
      fields?: string;
      related?: string;
      limit?: number;
      order?: string;
    } = {}
  ): Promise<any[]> {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) q.set(k, String(v));
    }
    const res = await this.raw('GET', `/api/v2/system/${resource}?${q}`);
    return (await this.json(res, `GET system/${resource}?${q}`)).resource ?? [];
  }

  /** One record by its name field, or null. Fails when several match. */
  async findByName(
    resource: SystemResource,
    name: string,
    related?: string
  ): Promise<any | null> {
    const field = NAME_FIELD[resource];
    const rows = await this.list(resource, {
      filter: `${field}="${name}"`,
      related,
    });
    if (rows.length > 1) {
      throw new Error(
        `${rows.length} ${resource} records have ${field}="${name}" (a duplicate was created)`
      );
    }
    return rows[0] ?? null;
  }

  async get(
    resource: SystemResource,
    id: number | string,
    related?: string
  ): Promise<any> {
    const q = related ? `?related=${encodeURIComponent(related)}` : '';
    const res = await this.raw('GET', `/api/v2/system/${resource}/${id}${q}`);
    return this.json(res, `GET system/${resource}/${id}`);
  }

  /** Create one record through the API and track it for cleanup. */
  async create(
    resource: SystemResource,
    record: Record<string, any>,
    params = ''
  ): Promise<any> {
    const name = record[NAME_FIELD[resource]];
    if (!isE2eName(name)) {
      throw new Error(
        `refusing to create a ${resource} named "${name}": flow fixtures must start with "${E2E_PREFIX}"`
      );
    }
    this.track(resource, name);
    const res = await this.raw(
      'POST',
      `/api/v2/system/${resource}?fields=*${params ? '&' + params : ''}`,
      { resource: [record] }
    );
    const body = await this.json(res, `POST system/${resource}`);
    return body.resource?.[0] ?? body;
  }

  /**
   * Register a record that the UI is about to create, so it is deleted after
   * the test even when the test fails half way. Call it BEFORE the save.
   */
  track(resource: SystemResource, name: string): void {
    if (!isE2eName(name)) {
      throw new Error(
        `refusing to track a ${resource} named "${name}" for deletion: not an "${E2E_PREFIX}" record`
      );
    }
    if (!this.tracked.some(t => t.resource === resource && t.name === name)) {
      this.tracked.push({ resource, name });
    }
  }

  /** Delete one e2e record by name. No error when it is already gone. */
  async remove(resource: SystemResource, name: string): Promise<void> {
    if (!isE2eName(name)) {
      throw new Error(
        `refusing to delete ${resource} "${name}": not an "${E2E_PREFIX}" record`
      );
    }
    const field = NAME_FIELD[resource];
    const rows = await this.list(resource, { filter: `${field}="${name}"` });
    for (const row of rows) {
      const res = await this.raw(
        'DELETE',
        `/api/v2/system/${resource}/${row.id}`
      );
      if (!res.ok() && res.status() !== 404) {
        throw new Error(
          `DELETE system/${resource}/${row.id} -> HTTP ${res.status()} ${(await res.text()).slice(0, 300)}`
        );
      }
    }
  }

  /**
   * Delete everything this test registered, newest first (an app before its
   * role, a role before its service).
   */
  async cleanup(): Promise<string[]> {
    const errors: string[] = [];
    for (const t of [...this.tracked].reverse()) {
      try {
        await this.remove(t.resource, t.name);
      } catch (e) {
        errors.push((e as Error).message);
      }
    }
    this.tracked = [];
    return errors;
  }
}
