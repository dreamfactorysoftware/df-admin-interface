import {
  ADMIN_IDENTITY,
  DB_VERBS,
  FACADE_TOOLS,
  McpBackend,
  McpConfig,
  accessDiff,
  accessRowsForChanges,
  callsByBackend,
  cellState,
  connectSnippet,
  grantsByService,
  levelFromMask,
  maskForLevel,
  shapeCatalog,
  shapeFixedCatalog,
  tokensPerTurn,
  toolKey,
  verbsByServiceName,
} from './mcp-model';

const backends: McpBackend[] = [
  { id: 50, name: 'demo_mysql', label: 'Demo MySQL', kind: 'database' },
  { id: 51, name: 'demo_pgsql', label: 'Demo PostgreSQL', kind: 'database' },
  { id: 52, name: 'demo_sqlsrv', label: 'Demo SQL Server', kind: 'database' },
  { id: 9, name: 'files', label: 'Local Files', kind: 'file' },
];

const base: McpConfig = {
  exposedServices: ['demo_mysql', 'demo_pgsql', 'demo_sqlsrv'],
  disabledTools: [],
  lazyMode: 'auto',
  toolStyle: 'prefixed',
  allowWrites: true,
  allowApiKeyAuth: false,
  requireRoleAccess: false,
};

const verb = (name: string) => DB_VERBS.find(x => x.name === name)!;

describe('mcp-model: catalog shaping', () => {
  it('prefixed style advertises 5 globals + 5 aggregates + 16 per exposed db', () => {
    const shape = shapeCatalog(base, backends);
    expect(shape.tools.length).toBe(5 + 5 + 3 * 16);
    expect(shape.dbs.map(b => b.name)).toEqual(base.exposedServices);
    expect(shape.files).toEqual([]);
    expect(shape.lazy).toBe(false);
    expect(shape.shown).toBe(shape.tools);
  });

  it('merged style registers each database verb once', () => {
    const shape = shapeCatalog({ ...base, toolStyle: 'merged' }, backends);
    expect(shape.tools.length).toBe(5 + 5 + 16);
    expect(shape.tools.some(t => t.name === 'get_table_data')).toBe(true);
    expect(shape.tools.some(t => t.name === 'demo_mysql_get_table_data')).toBe(
      false
    );
  });

  it('a single exposed database drops the aggregate tools', () => {
    const shape = shapeCatalog(
      { ...base, exposedServices: ['demo_mysql'] },
      backends
    );
    expect(shape.tools.some(t => t.kind === 'aggregate')).toBe(false);
  });

  it('disabled keys remove the tool in prefixed style and per service in merged', () => {
    const key = toolKey('demo_mysql', 'delete_records');
    const prefixed = shapeCatalog({ ...base, disabledTools: [key] }, backends);
    expect(prefixed.tools.some(t => t.name === key)).toBe(false);
    const merged = shapeCatalog(
      { ...base, toolStyle: 'merged', disabledTools: [key] },
      backends
    );
    // still advertised because other databases keep it
    expect(merged.tools.some(t => t.name === 'delete_records')).toBe(true);
    const allOff = shapeCatalog(
      {
        ...base,
        toolStyle: 'merged',
        disabledTools: base.exposedServices.map(s =>
          toolKey(s, 'delete_records')
        ),
      },
      backends
    );
    expect(allOff.tools.some(t => t.name === 'delete_records')).toBe(false);
  });

  it('blocking writes removes every write verb', () => {
    const shape = shapeCatalog({ ...base, allowWrites: false }, backends);
    expect(shape.writable).toBe(0);
    expect(shape.tools.some(t => t.name.endsWith('_create_records'))).toBe(
      false
    );
  });

  it('lazy auto flips to the facade above 32 KB, on forces it, off never', () => {
    const big = shapeCatalog(base, backends, ADMIN_IDENTITY, [], 700);
    expect(big.bytes).toBeGreaterThan(32 * 1024);
    expect(big.lazy).toBe(true);
    expect(big.shown.map(t => t.name)).toEqual(FACADE_TOOLS);
    expect(tokensPerTurn(big)).toBe(Math.round((5 * 700) / 4));

    expect(shapeCatalog({ ...base, lazyMode: 'on' }, backends).lazy).toBe(true);
    expect(
      shapeCatalog(
        { ...base, lazyMode: 'off' },
        backends,
        ADMIN_IDENTITY,
        [],
        700
      ).lazy
    ).toBe(false);
  });

  it('a role identity only sees backends it holds a verb on', () => {
    const shape = shapeCatalog(base, backends, {
      kind: 'role',
      roleId: 15,
      verbs: { demo_mysql: 1 },
    });
    expect(shape.dbs.map(b => b.name)).toEqual(['demo_mysql']);
    // write verbs stay advertised (the role denies them at call time)
    expect(shape.tools.some(t => t.name === 'demo_mysql_create_records')).toBe(
      true
    );
  });

  it('custom tools ride along as their own kind', () => {
    const shape = shapeCatalog(base, backends, ADMIN_IDENTITY, ['weather']);
    expect(shape.tools.find(t => t.name === 'weather')?.kind).toBe('custom');
  });

  it('fixed catalog (system_mcp) is the tool list minus disabled', () => {
    const shape = shapeFixedCatalog(
      { disabledTools: ['delete_service'], lazyMode: 'off' },
      ['list_services', 'get_service', 'delete_service']
    );
    expect(shape.tools.map(t => t.name)).toEqual([
      'list_services',
      'get_service',
    ]);
  });
});

describe('mcp-model: grid cell states', () => {
  const db = backends[0];
  it('walks the precedence gone > writes-off > off > denied > on', () => {
    const readOnly = { kind: 'role' as const, verbs: { demo_mysql: 1 } };
    expect(
      cellState(base, backends[3], verb('get_tables'), ADMIN_IDENTITY)
    ).toBe('gone');
    expect(cellState(base, backends[1], verb('get_tables'), readOnly)).toBe(
      'gone'
    );
    expect(
      cellState(
        { ...base, allowWrites: false },
        db,
        verb('delete_records'),
        readOnly
      )
    ).toBe('writes-off');
    expect(
      cellState(
        { ...base, disabledTools: [toolKey('demo_mysql', 'delete_records')] },
        db,
        verb('delete_records'),
        readOnly
      )
    ).toBe('off');
    expect(cellState(base, db, verb('delete_records'), readOnly)).toBe(
      'denied'
    );
    expect(cellState(base, db, verb('get_tables'), readOnly)).toBe('on');
    expect(cellState(base, db, verb('delete_records'), ADMIN_IDENTITY)).toBe(
      'on'
    );
  });

  it('update_records is satisfied by PUT or PATCH', () => {
    expect(
      cellState(base, db, verb('update_records'), {
        kind: 'role',
        verbs: { demo_mysql: 4 },
      })
    ).toBe('on');
    expect(
      cellState(base, db, verb('update_records'), {
        kind: 'role',
        verbs: { demo_mysql: 8 },
      })
    ).toBe('on');
    expect(
      cellState(base, db, verb('update_records'), {
        kind: 'role',
        verbs: { demo_mysql: 2 },
      })
    ).toBe('denied');
  });
});

describe('mcp-model: access', () => {
  it('maps verb masks to levels and back', () => {
    expect(levelFromMask(0)).toBe('none');
    expect(levelFromMask(1)).toBe('read');
    expect(levelFromMask(3)).toBe('rw');
    expect(maskForLevel('rw')).toBe(31);
    expect(maskForLevel('read')).toBe(1);
    expect(maskForLevel('none')).toBe(0);
  });

  it('collapses rows per service and flags table-level limits', () => {
    const grants = grantsByService([
      { id: 80, serviceId: 50, component: '_table/orders/*', verbMask: 1 },
      { id: 81, serviceId: 50, component: '_table/customers/*', verbMask: 1 },
      { id: 82, serviceId: 54, component: '*', verbMask: 1 },
    ]);
    expect(grants[50]).toEqual({ level: 'read', tableLimited: true, mask: 1 });
    expect(grants[54]).toEqual({ level: 'read', tableLimited: false, mask: 1 });
    expect(
      verbsByServiceName([{ serviceId: 50, component: '*', verbMask: 3 }], {
        50: 'demo_mysql',
      })
    ).toEqual({ demo_mysql: 3 });
  });

  it('writes a plain diff and only for changed lines', () => {
    const labels = { none: 'no access', read: 'read', rw: 'read and write' };
    expect(
      accessDiff(
        [
          { serviceId: 50, label: 'Demo MySQL', before: 'none', after: 'read' },
          { serviceId: 51, label: 'Demo PG', before: 'read', after: 'read' },
          { serviceId: 52, label: 'Demo SQL', before: 'rw', after: 'none' },
        ],
        labels
      )
    ).toEqual([
      'Demo MySQL: no access → read',
      'Demo SQL: read and write → no access',
    ]);
  });

  it('builds PATCH rows: update by id, unlink with role_id null, create new', () => {
    const rows = accessRowsForChanges(
      [
        { serviceId: 50, label: 'a', before: 'read', after: 'rw' },
        { serviceId: 51, label: 'b', before: 'read', after: 'none' },
        { serviceId: 52, label: 'c', before: 'none', after: 'read' },
        { serviceId: 53, label: 'd', before: 'read', after: 'read' },
      ],
      [
        { id: 1, serviceId: 50, component: '*', verbMask: 1 },
        { id: 2, serviceId: 51, component: '*', verbMask: 1 },
      ]
    );
    expect(rows).toEqual([
      expect.objectContaining({ id: 1, service_id: 50, verb_mask: 31 }),
      { id: 2, role_id: null },
      expect.objectContaining({ service_id: 52, verb_mask: 1, component: '*' }),
    ]);
    expect(rows[2]['id']).toBeUndefined();
  });
});

describe('mcp-model: connect snippets', () => {
  const o = { name: 'demo_mcp', url: 'https://df.example.com/mcp/demo_mcp' };
  it('OAuth snippets carry no key header', () => {
    for (const c of [
      'claude',
      'cursor',
      'vscode',
      'chatgpt',
      'curl',
    ] as const) {
      expect(connectSnippet(c, o)).not.toContain('X-DreamFactory-API-Key');
      expect(connectSnippet(c, o)).toContain(o.url);
    }
  });
  it('a previewed key lands in the header of every client', () => {
    for (const c of [
      'claude',
      'cursor',
      'vscode',
      'chatgpt',
      'curl',
    ] as const) {
      expect(connectSnippet(c, { ...o, apiKey: 'abc' })).toContain(
        'X-DreamFactory-API-Key'
      );
    }
    expect(
      JSON.parse(connectSnippet('cursor', { ...o, apiKey: 'abc' }))
    ).toEqual({
      mcpServers: {
        demo_mcp: { url: o.url, headers: { 'X-DreamFactory-API-Key': 'abc' } },
      },
    });
  });
});

describe('mcp-model: usage attribution', () => {
  it('attributes prefixed tools to backends and bare verbs to the merged bucket', () => {
    const r = callsByBackend(
      [
        { tool_name: 'demo_mysql_get_table_data', requests: 8 },
        { tool_name: 'demo_mysql_get_tables', requests: 2 },
        { tool_name: 'get_table_data', requests: 2 },
        { tool_name: 'discover_services', requests: 9 },
      ],
      backends
    );
    expect(r.perBackend).toEqual({ demo_mysql: 10 });
    expect(r.merged).toBe(2);
  });
});
