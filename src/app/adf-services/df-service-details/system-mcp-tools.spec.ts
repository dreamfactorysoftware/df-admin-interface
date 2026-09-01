import {
  SYSTEM_MCP_SERVICE_TYPE,
  SYSTEM_MCP_TOOLS,
  isSystemMcpType,
} from './system-mcp-tools';

// Must mirror TOOL_NAMES in df-system-mcp-server (src/tools/index.ts).
const EXPECTED_TOOL_NAMES = [
  'list_services',
  'get_service',
  'create_service',
  'update_service',
  'delete_service',
  'list_service_types',
  'get_service_type_schema',
  'get_environment',
  'list_roles',
  'create_role',
  'get_role',
  'update_role',
  'list_apps',
  'create_app',
  'get_app',
  'list_admins',
  'call_system_api',
];

describe('SYSTEM_MCP_TOOLS catalogue', () => {
  it('contains exactly the 17 tools exposed by df-system-mcp-server', () => {
    expect(SYSTEM_MCP_TOOLS.length).toBe(17);
    expect(SYSTEM_MCP_TOOLS.map(t => t.name)).toEqual(EXPECTED_TOOL_NAMES);
  });

  it('has unique names and non-empty titles/descriptions', () => {
    const names = new Set(SYSTEM_MCP_TOOLS.map(t => t.name));
    expect(names.size).toBe(SYSTEM_MCP_TOOLS.length);
    for (const tool of SYSTEM_MCP_TOOLS) {
      expect(tool.name).toMatch(/^[a-z_]+$/);
      expect(tool.title.trim().length).toBeGreaterThan(0);
      expect(tool.description.trim().length).toBeGreaterThan(0);
    }
  });
});

describe('isSystemMcpType', () => {
  it('matches the system_mcp service type name', () => {
    expect(SYSTEM_MCP_SERVICE_TYPE).toBe('system_mcp');
    expect(isSystemMcpType('system_mcp')).toBe(true);
    expect(isSystemMcpType(' System_MCP ')).toBe(true);
  });

  it('does not match the data-plane mcp type or empty values', () => {
    expect(isSystemMcpType('mcp')).toBe(false);
    expect(isSystemMcpType('mysql')).toBe(false);
    expect(isSystemMcpType('')).toBe(false);
    expect(isSystemMcpType(null)).toBe(false);
    expect(isSystemMcpType(undefined)).toBe(false);
  });
});
