import { DfApi } from './df-api';
import { appUrlOrigin } from '../../src/app/adf-mcp/mcp-effective';

/**
 * Self-provisioned services for the MCP e2e suites, so they run against any
 * DreamFactory instance: two SQLite databases, a local file service, an
 * `mcp` server exposing the first database (API-key auth on, one custom
 * tool) and a `system_mcp` server.
 *
 * Each spec file passes its own prefix: Playwright may run files in parallel
 * workers, and the create-flow cleanup (`e2e_mcp_*`) must never match these.
 */
export interface McpFixtures {
  db: string;
  db2: string;
  files: string;
  mcp: string;
  sys: string;
  dbId: number;
  mcpId: number;
  sysId: number;
  /** Origin the editor builds endpoint URLs from (APP_URL, else the page). */
  endpointOrigin: (pageOrigin: string) => string;
}

export async function createMcpFixtures(
  api: DfApi,
  prefix: string
): Promise<McpFixtures> {
  await destroyMcpFixtures(api, prefix); // leftovers of an aborted run
  const db = `${prefix}db`;
  const db2 = `${prefix}db2`;
  const files = `${prefix}files`;
  const mcp = `${prefix}mcp_full`;
  const sys = `${prefix}sys`;

  // SQLite files and the local folder are created on first use under the
  // instance's storage/ and reused by name on the next run.
  const [dbId] = await api.createServices([
    sqlite(db),
    sqlite(db2),
    {
      name: files,
      label: 'E2E files',
      type: 'local_file',
      is_active: true,
      description: 'Created by the MCP e2e suite; safe to delete.',
      config: { container: files },
    },
  ]);
  const [mcpId, sysId] = await api.createServices([
    {
      name: mcp,
      label: 'E2E MCP',
      type: 'mcp',
      is_active: true,
      description: 'Created by the MCP e2e suite; safe to delete.',
      config: {
        exposed_services: [db],
        disabled_tools: [],
        allow_api_key_auth: true,
        custom_tools: [
          {
            tool_type: 'api',
            name: 'env_info',
            description: 'Instance environment',
            method: 'GET',
            url: '/api/v2/system/environment',
            enabled: true,
          },
        ],
      },
    },
    {
      name: sys,
      label: 'E2E system MCP',
      type: 'system_mcp',
      is_active: true,
      description: 'Created by the MCP e2e suite; safe to delete.',
      config: {},
    },
  ]);

  const appOrigin = appUrlOrigin(await api.getMcpHealth());
  return {
    db,
    db2,
    files,
    mcp,
    sys,
    dbId,
    mcpId,
    sysId,
    endpointOrigin: pageOrigin => appOrigin ?? pageOrigin,
  };
}

/** Delete every fixture service of this prefix (MCP servers first). */
export async function destroyMcpFixtures(
  api: DfApi,
  prefix: string
): Promise<void> {
  const rows = (await api.listServices()).filter(
    r => typeof r.name === 'string' && r.name.startsWith(prefix)
  );
  const mcpFirst = [...rows].sort(
    (a, b) => Number(b.type?.includes('mcp')) - Number(a.type?.includes('mcp'))
  );
  for (const r of mcpFirst) await api.deleteService(r.id);
}

function sqlite(name: string): any {
  return {
    name,
    label: `E2E ${name}`,
    type: 'sqlite',
    is_active: true,
    description: 'Created by the MCP e2e suite; safe to delete.',
    config: { database: `${name}.sqlite` },
  };
}
