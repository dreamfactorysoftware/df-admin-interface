/**
 * The single client-side catalog of MCP tools the DreamFactory daemon serves.
 *
 * Every count, fraction and preview in the MCP editor derives from this one
 * module. Verb names mirror the daemon exactly: a database service named
 * `crm` serves `crm_get_tables` in prefixed style and a shared `get_tables`
 * (with a `service` argument) in merged style; disabled_tools keys are always
 * the prefixed `{service}_{verb}` form in BOTH styles.
 *
 * Global tools: `discover_services`, `request_access`, `list_apis`, `search`
 * and `fetch` are always served; the `all_*` aggregators only exist when two
 * or more database services are exposed.
 */

export interface McpToolDef {
  /** Bare verb, without service prefix. */
  verb: string;
  title: string;
  description: string;
}

export interface McpVerbGroup {
  key: 'read' | 'schema' | 'write' | 'procs' | 'fread' | 'fwrite';
  label: string;
  /** 'writes' | 'executes' | null — drives the ⚠ tag. */
  warn: 'writes' | 'executes' | null;
  verbs: McpToolDef[];
}

export const DB_VERB_GROUPS: readonly McpVerbGroup[] = [
  {
    key: 'read',
    label: 'Read data',
    warn: null,
    verbs: [
      {
        verb: 'get_table_data',
        title: 'Get Table Data',
        description: 'Retrieve records from a table with filtering and paging',
      },
      {
        verb: 'aggregate_data',
        title: 'Aggregate Data',
        description:
          'Compute server-side aggregations (SUM, COUNT, AVG, MIN, MAX)',
      },
    ],
  },
  {
    key: 'schema',
    label: 'Explore schema',
    warn: null,
    verbs: [
      {
        verb: 'get_tables',
        title: 'Get Tables',
        description: 'List tables available in the database',
      },
      {
        verb: 'get_table_schema',
        title: 'Get Table Schema',
        description: 'Retrieve schema definition for a table',
      },
      {
        verb: 'get_table_fields',
        title: 'Get Table Fields',
        description: 'Retrieve field definitions for a table',
      },
      {
        verb: 'get_table_relationships',
        title: 'Get Table Relationships',
        description: 'Retrieve relationships definition for a table',
      },
      {
        verb: 'get_database_resources',
        title: 'List Database Resources',
        description: 'Get all resources available in the database service',
      },
      {
        verb: 'get_api_spec',
        title: 'Get API Spec',
        description: 'Get the OpenAPI specification for this database service',
      },
      {
        verb: 'get_data_model',
        title: 'Get Data Model',
        description: 'Get a condensed data model showing all tables and columns',
      },
    ],
  },
  {
    key: 'write',
    label: 'Write data',
    warn: 'writes',
    verbs: [
      {
        verb: 'create_records',
        title: 'Create Records',
        description: 'Insert records into a table',
      },
      {
        verb: 'update_records',
        title: 'Update Records',
        description: 'Update (patch) records in a table',
      },
      {
        verb: 'delete_records',
        title: 'Delete Records',
        description: 'Delete records from a table',
      },
    ],
  },
  {
    key: 'procs',
    label: 'Procedures & functions',
    warn: 'executes',
    verbs: [
      {
        verb: 'get_stored_procedures',
        title: 'List Stored Procedures',
        description: 'Get stored procedures available in the database',
      },
      {
        verb: 'call_stored_procedure',
        title: 'Call Stored Procedure',
        description: 'Call a stored procedure',
      },
      {
        verb: 'get_stored_functions',
        title: 'List Stored Functions',
        description: 'Get stored functions available in the database',
      },
      {
        verb: 'call_stored_function',
        title: 'Call Stored Function',
        description: 'Call a stored function',
      },
    ],
  },
];

export const FILE_VERB_GROUPS: readonly McpVerbGroup[] = [
  {
    key: 'fread',
    label: 'Read files',
    warn: null,
    verbs: [
      {
        verb: 'list_files',
        title: 'List Files',
        description: 'List files and folders in a path',
      },
      {
        verb: 'get_file',
        title: 'Get File',
        description: 'Read the contents of a file',
      },
      {
        verb: 'get_file_properties',
        title: 'Get File Properties',
        description: 'Get properties/metadata of a file or folder',
      },
    ],
  },
  {
    key: 'fwrite',
    label: 'Write files',
    warn: 'writes',
    verbs: [
      {
        verb: 'create_file',
        title: 'Create File',
        description: 'Create or overwrite a file',
      },
      {
        verb: 'create_folder',
        title: 'Create Folder',
        description: 'Create a new folder',
      },
      {
        verb: 'delete_file',
        title: 'Delete File or Folder',
        description: 'Delete a file or folder',
      },
    ],
  },
];

/** Always-served cross-service tools. */
export const GLOBAL_TOOLS: readonly McpToolDef[] = [
  {
    verb: 'discover_services',
    title: 'Discover Services',
    description:
      'List the services and operations the calling role can access',
  },
  {
    verb: 'request_access',
    title: 'Request Access',
    description: 'Explain how to request wider access',
  },
  {
    verb: 'list_apis',
    title: 'List Available APIs',
    description: 'List all available database APIs and their tool prefixes',
  },
  {
    verb: 'search',
    title: 'Search',
    description: 'Search records across the exposed services',
  },
  {
    verb: 'fetch',
    title: 'Fetch',
    description: 'Fetch one record by id',
  },
];

/** Cross-database aggregators — served only when 2+ database services are exposed. */
export const AGGREGATOR_TOOLS: readonly McpToolDef[] = [
  {
    verb: 'all_get_tables',
    title: 'Get Tables from All Databases',
    description:
      'Retrieve tables from all connected database services in one call',
  },
  {
    verb: 'all_find_table',
    title: 'Find Table Across Databases',
    description: 'Search for a table by name across all connected databases',
  },
  {
    verb: 'all_get_stored_procedures',
    title: 'Get Stored Procedures from All',
    description: 'Retrieve stored procedures from all connected databases',
  },
  {
    verb: 'all_get_stored_functions',
    title: 'Get Stored Functions from All',
    description: 'Retrieve stored functions from all connected databases',
  },
  {
    verb: 'all_get_resources',
    title: 'Get Resources from All',
    description: 'Retrieve all available resources from all connected databases',
  },
  {
    verb: 'all_list_files',
    title: 'List Files from All Storage',
    description: 'List files from all connected file storage services',
  },
];

/**
 * Discovery facade served INSTEAD of the catalog when lazy delivery engages
 * (daemon lazy.service FACADE): search → describe → call, paged by fetch_more.
 */
export const LAZY_FACADE_TOOLS: readonly McpToolDef[] = [
  { verb: 'search_tools', title: 'Search Tools', description: 'Find tools by capability' },
  { verb: 'describe_tool', title: 'Describe Tool', description: 'Get one tool’s full schema' },
  { verb: 'call_tool', title: 'Call Tool', description: 'Invoke a tool by name' },
  { verb: 'fetch_more', title: 'Fetch More', description: 'Page through a long result' },
  { verb: 'list_tools', title: 'List Tools', description: 'Page through the full catalog' },
];

/** Kind of backend service an MCP server can expose. */
export type McpServiceKind = 'db' | 'file';

/**
 * Service types the daemon serves tools for, matching loadMcpServices() in
 * the legacy editor: every 'Database' group type plus local_file.
 */
export function serviceKindOf(typeGroup: string, type: string): McpServiceKind | null {
  if (typeGroup === 'Database') return 'db';
  if (type === 'local_file' || typeGroup === 'File') return 'file';
  return null;
}

export function verbGroupsFor(kind: McpServiceKind): readonly McpVerbGroup[] {
  return kind === 'db' ? DB_VERB_GROUPS : FILE_VERB_GROUPS;
}

export function verbsFor(kind: McpServiceKind): McpToolDef[] {
  return verbGroupsFor(kind).flatMap(g => g.verbs);
}

export const WRITE_GROUP_KEYS: ReadonlySet<string> = new Set([
  'write',
  'procs',
  'fwrite',
]);

/**
 * Verbs the daemon never registers when allow_writes=false (tool-utils
 * WRITE_VERBS) — narrower than WRITE_GROUP_KEYS, which also holds the
 * read-only get_stored_* listings.
 */
export const WRITE_VERBS: ReadonlySet<string> = new Set([
  'create_records',
  'update_records',
  'delete_records',
  'call_stored_procedure',
  'call_stored_function',
  'create_file',
  'create_folder',
  'delete_file',
]);

/** lazy_mode 'auto' serves the facade above this tools/list size (daemon LAZY_THRESHOLD_BYTES, ≈ 8k tokens). */
export const LAZY_THRESHOLD_BYTES = 32 * 1024;
/** ~540 B of JSON schema per tool observed on df-dev (58 tools ≈ 31 KB); replaced by the server's own ratio once known. */
export const DEFAULT_BYTES_PER_TOOL = 540;
