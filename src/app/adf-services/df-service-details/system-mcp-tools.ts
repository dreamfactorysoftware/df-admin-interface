/**
 * Tool catalogue for the "System API MCP Server" service type (`system_mcp`).
 *
 * The names mirror `TOOL_NAMES` in df-system-mcp-server exactly; the admin UI
 * uses them to render enable/disable toggles that round-trip through the
 * service config `disabled_tools` array, just like the data-plane `mcp` type.
 */
export interface SystemMcpTool {
  name: string;
  title: string;
  description: string;
}

/** Service type name registered by df-mcp-server for the System API server. */
export const SYSTEM_MCP_SERVICE_TYPE = 'system_mcp';

export const SYSTEM_MCP_TOOLS: ReadonlyArray<SystemMcpTool> = [
  // Services
  {
    name: 'list_services',
    title: 'List Services',
    description: 'List the services configured on this DreamFactory instance.',
  },
  {
    name: 'get_service',
    title: 'Get Service',
    description: 'Retrieve one service, including its configuration.',
  },
  {
    name: 'create_service',
    title: 'Create Service',
    description: 'Create a new service (database, file, MCP, etc.).',
  },
  {
    name: 'update_service',
    title: 'Update Service',
    description: 'Update an existing service, its label, or its configuration.',
  },
  {
    name: 'delete_service',
    title: 'Delete Service',
    description: 'Permanently delete a service by ID or name.',
  },
  // Metadata
  {
    name: 'list_service_types',
    title: 'List Service Types',
    description: 'List the service types available on this instance.',
  },
  {
    name: 'get_service_type_schema',
    title: 'Get Service Type Schema',
    description:
      'Return the configuration schema required to create a given service type.',
  },
  {
    name: 'get_environment',
    title: 'Get Environment',
    description: 'Read platform, license, and server environment information.',
  },
  // Roles
  {
    name: 'list_roles',
    title: 'List Roles',
    description: 'List the roles that control API access for apps and users.',
  },
  {
    name: 'create_role',
    title: 'Create Role',
    description: 'Create a role with service and component access rules.',
  },
  {
    name: 'get_role',
    title: 'Get Role',
    description: 'Retrieve one role with its access rules and lookups.',
  },
  {
    name: 'update_role',
    title: 'Update Role',
    description: 'Update a role, including its service access rules.',
  },
  // Apps / API keys
  {
    name: 'list_apps',
    title: 'List Apps',
    description: 'List apps (API keys) and the roles they are bound to.',
  },
  {
    name: 'create_app',
    title: 'Create App',
    description: 'Create an app, generating a new API key bound to a role.',
  },
  {
    name: 'get_app',
    title: 'Get App',
    description: 'Retrieve one app, including its API key and role.',
  },
  // Admins
  {
    name: 'list_admins',
    title: 'List Admins',
    description: 'List the administrator accounts on this instance.',
  },
  // Generic
  {
    name: 'call_system_api',
    title: 'Call System API',
    description:
      'Call any /api/v2/system/* or /api/v2/user/* endpoint directly for operations not covered by a dedicated tool.',
  },
];

/** True when the given service type name is the System API MCP server type. */
export function isSystemMcpType(type: string | null | undefined): boolean {
  return (
    (type ?? '').toString().trim().toLowerCase() === SYSTEM_MCP_SERVICE_TYPE
  );
}
