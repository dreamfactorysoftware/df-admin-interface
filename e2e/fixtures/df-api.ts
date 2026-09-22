import { APIRequestContext, expect } from '@playwright/test';
import { ADMIN_EMAIL, ADMIN_PASSWORD } from './admin-login';

/**
 * Thin DreamFactory system-API client for e2e setup/teardown.
 *
 * Non-destructive discipline: suites snapshot the full service record of any
 * live service they save changes to (snapshotService) and restore it in
 * afterAll (restoreService + expectConfigRestored); services created by tests
 * carry the `e2e_mcp_` prefix and are deleted through deleteByNamePrefix.
 */
export const E2E_SERVICE_PREFIX = 'e2e_mcp_';

export class DfApi {
  private constructor(
    private ctx: APIRequestContext,
    private token: string
  ) {}

  /** Login with the same credentials the UI fixture uses. */
  static async login(ctx: APIRequestContext): Promise<DfApi> {
    const resp = await ctx.post('/api/v2/system/admin/session', {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    });
    expect(resp.ok(), `admin API login failed: HTTP ${resp.status()}`).toBe(
      true
    );
    const body = await resp.json();
    return new DfApi(ctx, body.session_token);
  }

  private headers(): Record<string, string> {
    return { 'X-DreamFactory-Session-Token': this.token };
  }

  /** Full service record incl. config (the API returns config inline). */
  async getService(id: number): Promise<any> {
    const resp = await this.ctx.get(`/api/v2/system/service/${id}`, {
      headers: this.headers(),
    });
    expect(resp.ok(), `GET service/${id} -> HTTP ${resp.status()}`).toBe(true);
    return resp.json();
  }

  async getServiceByName(name: string): Promise<any | null> {
    const resp = await this.ctx.get(
      `/api/v2/system/service?filter=${encodeURIComponent(`name=${name}`)}`,
      { headers: this.headers() }
    );
    expect(resp.ok()).toBe(true);
    const rows = (await resp.json())?.resource ?? [];
    return rows[0] ?? null;
  }

  async listServices(): Promise<any[]> {
    const resp = await this.ctx.get(
      '/api/v2/system/service?fields=id,name,label,type,is_active&limit=1000&order=name',
      { headers: this.headers() }
    );
    expect(resp.ok()).toBe(true);
    return (await resp.json())?.resource ?? [];
  }

  async listServiceTypeGroups(): Promise<Record<string, string>> {
    const resp = await this.ctx.get(
      '/api/v2/system/service_type?fields=name,group&limit=1000',
      { headers: this.headers() }
    );
    expect(resp.ok()).toBe(true);
    const out: Record<string, string> = {};
    for (const t of (await resp.json())?.resource ?? []) out[t.name] = t.group;
    return out;
  }

  /** POST services; returns the new ids in request order. */
  async createServices(resources: any[]): Promise<number[]> {
    const resp = await this.ctx.post('/api/v2/system/service', {
      headers: this.headers(),
      data: { resource: resources },
    });
    expect(
      resp.ok(),
      `POST service -> HTTP ${resp.status()}: ${await resp.text()}`
    ).toBe(true);
    return ((await resp.json())?.resource ?? []).map((r: any) => r.id);
  }

  /** Admin MCP health report; null on backends that predate it. */
  async getMcpHealth(): Promise<any | null> {
    const resp = await this.ctx.get('/_internal/ai/mcp-health', {
      headers: this.headers(),
    });
    return resp.ok() ? resp.json() : null;
  }

  async putService(id: number, body: any): Promise<void> {
    const resp = await this.ctx.put(`/api/v2/system/service/${id}`, {
      headers: this.headers(),
      data: body,
    });
    expect(
      resp.ok(),
      `PUT service/${id} -> HTTP ${resp.status()}: ${await resp.text()}`
    ).toBe(true);
  }

  async deleteService(id: number): Promise<void> {
    const resp = await this.ctx.delete(`/api/v2/system/service/${id}`, {
      headers: this.headers(),
    });
    expect(
      resp.ok(),
      `DELETE service/${id} -> HTTP ${resp.status()}: ${await resp.text()}`
    ).toBe(true);
  }

  /** Snapshot a service record for later byte-equivalent restore. */
  async snapshotService(id: number): Promise<any> {
    return this.getService(id);
  }

  /** PUT the snapshot back verbatim (verified equivalent by a fresh GET). */
  async restoreService(snapshot: any): Promise<void> {
    await this.putService(snapshot.id, snapshot);
  }

  /**
   * Assert the live config is byte-equivalent to the snapshot's. Identity
   * fields must match too; only server-side bookkeeping may differ: the
   * service row's last_modified_* and each custom tool's created_at /
   * updated_at (re-stamped on every save of the service).
   */
  async expectConfigRestored(snapshot: any): Promise<void> {
    const live = await this.getService(snapshot.id);
    expect(
      withoutToolTimestamps(live.config),
      'config must be byte-equivalent after restore'
    ).toEqual(withoutToolTimestamps(snapshot.config));
    for (const f of ['name', 'label', 'description', 'is_active', 'type']) {
      expect(live[f], `service.${f} must be restored`).toEqual(snapshot[f]);
    }
  }

  /** Delete every service whose name starts with the e2e prefix. */
  async deleteByNamePrefix(prefix: string = E2E_SERVICE_PREFIX): Promise<void> {
    const rows = await this.listServices();
    for (const r of rows) {
      if (typeof r.name === 'string' && r.name.startsWith(prefix)) {
        await this.deleteService(r.id);
      }
    }
  }
}

function withoutToolTimestamps(config: any): any {
  if (!Array.isArray(config?.custom_tools)) return config;
  return {
    ...config,
    custom_tools: config.custom_tools.map(
      ({ created_at, updated_at, ...tool }: any) => tool
    ),
  };
}
