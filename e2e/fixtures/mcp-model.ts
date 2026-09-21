/**
 * Expected-value math for the MCP e2e suites.
 *
 * Counts and totals are computed through the SAME pure model module the UI
 * uses (src/app/adf-mcp/mcp-effective — no Angular in its import graph), so
 * a UI number and its expectation can only diverge when the wiring between
 * config, catalog and screen breaks — which is exactly what e2e should
 * catch. The stored-config contract itself (exact disabled_tools keys,
 * exposed_services values) is asserted against LITERAL key lists in the
 * specs, never through this module, so a model bug cannot hide a wire bug.
 */
import {
  McpBackendService,
  effectiveTools,
  parseMcpConfig,
  toBackendServices,
} from '../../src/app/adf-mcp/mcp-effective';
import { DfApi } from './df-api';

export {
  effectiveTools,
  parseMcpConfig,
  toBackendServices,
} from '../../src/app/adf-mcp/mcp-effective';
export type { McpBackendService } from '../../src/app/adf-mcp/mcp-effective';

/** The daemon-servable backend services on the instance (db/file kinds). */
export async function fetchBackendCatalog(
  api: DfApi
): Promise<McpBackendService[]> {
  const [rows, groups] = await Promise.all([
    api.listServices(),
    api.listServiceTypeGroups(),
  ]);
  return toBackendServices(rows, groups);
}

/** Effective total for a raw (snake_case) config blob from the API. */
export function effectiveTotalOf(
  rawConfig: any,
  services: McpBackendService[]
): number {
  return effectiveTools(parseMcpConfig(rawConfig), services).total;
}

/* ------------------------------- system_mcp ------------------------------- */
import { SYSTEM_MCP_TOOLS } from '../../src/app/adf-services/df-service-details/system-mcp-tools';

export const SYSTEM_MCP_TOOL_COUNT = SYSTEM_MCP_TOOLS.length;

export function systemMcpEnabledCount(rawConfig: any): number {
  const disabled = new Set<string>(
    Array.isArray(rawConfig?.disabled_tools) ? rawConfig.disabled_tools : []
  );
  return SYSTEM_MCP_TOOLS.filter(t => !disabled.has(t.name)).length;
}

/* ------------------------------------------------------------------ */
/* Literal key lists — asserted against the API, independent of the    */
/* app model on purpose.                                               */
/* ------------------------------------------------------------------ */

/** The write/execute disabled_tools keys read-only compiles for a db. */
export function dbWriteExecKeys(serviceName: string): string[] {
  return [
    `${serviceName}_call_stored_function`,
    `${serviceName}_call_stored_procedure`,
    `${serviceName}_create_records`,
    `${serviceName}_delete_records`,
    `${serviceName}_get_stored_functions`,
    `${serviceName}_get_stored_procedures`,
    `${serviceName}_update_records`,
  ].sort();
}

/** The "Write data" capability group of a database service. */
export function dbWriteDataKeys(serviceName: string): string[] {
  return [
    `${serviceName}_create_records`,
    `${serviceName}_delete_records`,
    `${serviceName}_update_records`,
  ].sort();
}
