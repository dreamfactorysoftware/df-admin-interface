/**
 * allow_writes / require_role_access config, the byte-based catalog size +
 * lazy model, server-catalog merging and health helpers.
 */
import { DEFAULT_BYTES_PER_TOOL, LAZY_FACADE_TOOLS } from './mcp-catalog';
import {
  McpBackendService,
  appUrlOrigin,
  catalogStats,
  effectiveTools,
  estimateCatalog,
  healthLevel,
  healthMessage,
  parseMcpConfig,
  serializeMcpConfig,
  serverCatalogFromToolsList,
} from './mcp-effective';
import { McpEditorStore } from './mcp-store';

const db = (name: string): McpBackendService => ({
  name,
  label: name,
  kind: 'db',
  active: true,
});
const file = (name: string): McpBackendService => ({
  name,
  label: name,
  kind: 'file',
  active: true,
});

describe('allow_writes / require_role_access config', () => {
  it('defaults: writes on, role access off (pre-existing rows)', () => {
    const c = parseMcpConfig({});
    expect(c.allowWrites).toBe(true);
    expect(c.requireRoleAccess).toBe(false);
  });

  it('parses both casings and round-trips on save', () => {
    const c = parseMcpConfig({
      allow_writes: false,
      require_role_access: true,
    });
    expect(c.allowWrites).toBe(false);
    expect(c.requireRoleAccess).toBe(true);
    expect(c.rest['allow_writes']).toBeUndefined();
    const out = serializeMcpConfig(c);
    expect(out['allowWrites']).toBe(false);
    expect(out['requireRoleAccess']).toBe(true);
    expect(parseMcpConfig({ allowWrites: false }).allowWrites).toBe(false);
  });

  it('allow_writes=false drops write verbs and writing custom tools', () => {
    const services = [db('crm'), file('docs')];
    const base = {
      ...parseMcpConfig({}),
      exposedServices: ['crm', 'docs'],
      toolStyle: 'prefixed' as const,
      customTools: [
        { name: 'get_x', toolType: 'api', httpMethod: 'GET' },
        { name: 'post_x', toolType: 'api', httpMethod: 'POST' },
        { name: 'fn', toolType: 'function' },
      ],
    };
    const on = effectiveTools(base, services);
    const off = effectiveTools({ ...base, allowWrites: false }, services);
    // 5 db write verbs (call_* included, get_stored_* kept) + 3 file writes.
    expect(on.dbTools - off.dbTools).toBe(5);
    expect(on.fileTools - off.fileTools).toBe(3);
    expect(off.customTools).toBe(1);
    expect(off.writeVerbs).toBe(0);
    expect(off.readOnly).toBe(true);
    expect(on.readOnly).toBe(false);
  });

  it('store: both switches mark dirty; allow_writes is connection-affecting', () => {
    const s = new McpEditorStore();
    s.init(
      {
        id: 1,
        name: 'm',
        label: 'm',
        description: '',
        isActive: true,
        type: 'mcp',
        raw: {},
      },
      {}
    );
    s.cfg.requireRoleAccess = true;
    expect(s.dirty()).toBe(true);
    expect(s.connectionAffecting()).toBe(false);
    s.cfg.allowWrites = false;
    expect(s.connectionAffecting()).toBe(true);
  });
});

describe('catalog size + lazy model', () => {
  it('flips to the facade above 32 KiB on auto', () => {
    // 60 × 540 = 32400 B ≤ 32768; 61 × 540 = 32940 B > 32768.
    expect(estimateCatalog(60, 'auto').lazy).toBe(false);
    expect(estimateCatalog(61, 'auto').lazy).toBe(true);
    expect(estimateCatalog(1, 'on').lazy).toBe(true);
    expect(estimateCatalog(500, 'off').lazy).toBe(false);
  });

  it('tokens per turn are the served bytes / 4', () => {
    expect(estimateCatalog(10, 'off').tokens).toBe(
      Math.round((10 * DEFAULT_BYTES_PER_TOOL) / 4)
    );
    expect(estimateCatalog(10, 'on').tokens).toBe(
      Math.round((LAZY_FACADE_TOOLS.length * DEFAULT_BYTES_PER_TOOL) / 4)
    );
  });

  it('uses the server numbers while clean, the calibrated simulation once dirty', () => {
    const server = { count: 24, bytes: 19200, lazy: false };
    const clean = catalogStats(20, 'auto', server, false);
    expect(clean).toMatchObject({
      source: 'server',
      count: 24,
      bytes: 19200,
      tokens: 4800,
    });
    const dirty = catalogStats(20, 'auto', server, true);
    // 800 B per tool from the server, applied to the simulated 20.
    expect(dirty).toMatchObject({
      source: 'estimate',
      count: 20,
      bytes: 16000,
    });
    expect(catalogStats(20, 'auto', null, false).source).toBe('estimate');
  });

  it('a facade-only server answer is lazy with a simulated full size', () => {
    const c = catalogStats(
      100,
      'auto',
      { count: null, bytes: 2000, lazy: true },
      false
    );
    expect(c).toMatchObject({
      source: 'server',
      lazy: true,
      facadeBytes: 2000,
      tokens: 500,
    });
    expect(c.bytes).toBe(100 * DEFAULT_BYTES_PER_TOOL);
  });

  it('reads a tools/list: facade names mean lazy', () => {
    expect(serverCatalogFromToolsList([])).toBeNull();
    const direct = serverCatalogFromToolsList([
      { name: 'get_tables' },
      { name: 'search' },
    ]);
    expect(direct).toMatchObject({ count: 2, lazy: false });
    expect(direct!.bytes).toBe(
      JSON.stringify({ tools: [{ name: 'get_tables' }, { name: 'search' }] })
        .length
    );
    expect(
      serverCatalogFromToolsList([
        { name: 'search_tools' },
        { name: 'call_tool' },
      ])
    ).toMatchObject({
      count: null,
      lazy: true,
    });
  });

  it('store.catalogStats covers the fixed system_mcp catalog', () => {
    const s = new McpEditorStore();
    s.init(
      {
        id: 2,
        name: 'sys',
        label: 'sys',
        description: '',
        isActive: true,
        type: 'system_mcp',
        raw: {},
      },
      {}
    );
    expect(s.catalogStats().count).toBe(s.totalTools());
    s.setServerCatalog({ count: 18, bytes: 36000, lazy: true });
    expect(s.catalogStats()).toMatchObject({
      source: 'server',
      count: 18,
      lazy: true,
    });
  });
});

describe('health helpers', () => {
  const report = {
    status: 'warn',
    checks: [
      { id: 'daemon.mcp', status: 'ok', message: 'reachable' },
      {
        id: 'app_url',
        status: 'warn',
        message: 'APP_URL (https://df.example.com) does not match',
        details: { app_url: 'https://df.example.com/' },
      },
    ],
  };

  it('level + first non-ok message', () => {
    expect(healthLevel(report)).toBe('warn');
    expect(healthLevel({ status: 'ok', checks: [] })).toBe('ok');
    expect(healthLevel({ status: 'fail', checks: [] })).toBe('error');
    expect(healthMessage(report)).toContain('APP_URL');
    expect(healthMessage({ status: 'ok', checks: [] })).toBe('');
  });

  it('APP_URL origin without trailing slash', () => {
    expect(appUrlOrigin(report)).toBe('https://df.example.com');
    expect(appUrlOrigin(null)).toBeNull();
    expect(appUrlOrigin({ status: 'ok', checks: [] })).toBeNull();
  });
});
