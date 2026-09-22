/**
 * Access model tests: mask <-> level, grant classification, the changes an
 * editor save proposes, the live summary text and the PATCH rows. The
 * row-writing cases are ported verbatim from the earlier MCP page.
 */
import {
  accessRowsForChanges,
  buildAccessChanges,
  cfgFlag,
  classifyServiceGrant,
  levelFromMask,
  maskForLevel,
  serverGrantRows,
  specsFor,
  summarizeAccessChanges,
  summaryText,
} from './mcp-access';

describe('mcp-access: model (ported)', () => {
  it('maps verb masks to levels and back', () => {
    expect(levelFromMask(0)).toBe('none');
    expect(levelFromMask(1)).toBe('read');
    expect(levelFromMask(3)).toBe('rw');
    expect(maskForLevel('rw')).toBe(31);
    expect(maskForLevel('read')).toBe(1);
    expect(maskForLevel('none')).toBe(0);
  });

  it('summarises a save: server grant, new levels, and edit deltas', () => {
    const s = summarizeAccessChanges(
      [
        { serviceId: 54, label: 'Demo MCP', before: 'none', after: 'read' },
        { serviceId: 50, label: 'A', before: 'none', after: 'read' },
        { serviceId: 51, label: 'B', before: 'none', after: 'rw' },
        { serviceId: 52, label: 'C', before: 'read', after: 'rw' },
        { serviceId: 53, label: 'D', before: 'rw', after: 'read' },
        { serviceId: 55, label: 'E', before: 'read', after: 'none' },
        { serviceId: 56, label: 'F', before: 'read', after: 'read' },
      ],
      54
    );
    expect(s.server).toBe('grant');
    expect(s.read).toEqual(['A']);
    expect(s.rw).toEqual(['B']);
    expect(s.deltas).toEqual([
      { label: 'C', delta: '+write' },
      { label: 'D', delta: '-write' },
      { label: 'E', delta: '-access' },
    ]);
    expect(
      summarizeAccessChanges(
        [{ serviceId: 54, label: 'Demo MCP', before: 'rw', after: 'rw' }],
        54
      ).server
    ).toBe('keep');
  });

  it('prefills from grants: * rows, _table/<name>/* rows, or read-only', () => {
    expect(classifyServiceGrant([])).toEqual({
      level: 'none',
      tables: null,
      editable: true,
      mask: 0,
    });
    expect(
      classifyServiceGrant([{ serviceId: 50, component: '*', verbMask: 31 }])
    ).toEqual({ level: 'rw', tables: null, editable: true, mask: 31 });
    expect(
      classifyServiceGrant([
        { serviceId: 50, component: '_table/orders/*', verbMask: 1 },
        { serviceId: 50, component: '_table/customers/*', verbMask: 1 },
        { serviceId: 50, component: '_table/', verbMask: 1 },
      ])
    ).toEqual({
      level: 'read',
      tables: ['orders', 'customers'],
      editable: true,
      mask: 1,
    });
    // anything the editor cannot represent is read-only
    const readOnly = [
      [
        {
          serviceId: 50,
          component: '_table/orders/*',
          verbMask: 1,
          filters: [{ name: 'x' }],
        },
      ],
      [
        { serviceId: 50, component: '_table/orders/*', verbMask: 1 },
        { serviceId: 50, component: '_table/customers/*', verbMask: 31 },
      ],
      [{ serviceId: 50, component: '_proc/*', verbMask: 1 }],
      [
        { serviceId: 50, component: '*', verbMask: 1 },
        { serviceId: 50, component: '_table/orders/*', verbMask: 31 },
      ],
      [{ serviceId: 50, component: '_table/orders', verbMask: 1 }],
    ];
    for (const rows of readOnly) {
      expect(classifyServiceGrant(rows as never).editable).toBe(false);
    }
  });

  it('writes table-limited grants as per-table rows plus a listing row, no *', () => {
    const rows = accessRowsForChanges(
      [
        {
          serviceId: 50,
          label: 'Demo MySQL',
          before: 'none',
          after: 'read',
          tables: ['orders', 'customers'],
        },
      ],
      []
    );
    expect(rows).toEqual([
      expect.objectContaining({ component: '_table/orders/*', verb_mask: 1 }),
      expect.objectContaining({
        component: '_table/customers/*',
        verb_mask: 1,
      }),
      expect.objectContaining({ component: '_table/', verb_mask: 1 }),
    ]);
    expect(rows.some(r => r['component'] === '*')).toBe(false);
    const rw = accessRowsForChanges(
      [
        {
          serviceId: 50,
          label: 'a',
          before: 'none',
          after: 'rw',
          tables: ['orders'],
        },
      ],
      []
    );
    expect(rw[0]).toEqual(
      expect.objectContaining({ component: '_table/orders/*', verb_mask: 31 })
    );
    expect(rw[1]).toEqual(
      expect.objectContaining({ component: '_table/', verb_mask: 1 })
    );
  });

  it('moves between whole API and table-limited without leaving stray rows', () => {
    const existing = [
      { id: 1, serviceId: 50, component: '_table/orders/*', verbMask: 1 },
      { id: 2, serviceId: 50, component: '_table/customers/*', verbMask: 1 },
      { id: 3, serviceId: 50, component: '_table/', verbMask: 1 },
    ];
    expect(
      accessRowsForChanges(
        [
          {
            serviceId: 50,
            label: 'a',
            before: 'read',
            after: 'read',
            beforeTables: ['orders', 'customers'],
            tables: null,
          },
        ],
        existing
      )
    ).toEqual([
      expect.objectContaining({ component: '*', verb_mask: 1 }),
      { id: 1, role_id: null },
      { id: 2, role_id: null },
      { id: 3, role_id: null },
    ]);
    expect(
      accessRowsForChanges(
        [
          {
            serviceId: 50,
            label: 'a',
            before: 'read',
            after: 'read',
            beforeTables: ['orders', 'customers'],
            tables: ['orders', 'products'],
          },
        ],
        existing
      )
    ).toEqual([
      { id: 2, role_id: null },
      expect.objectContaining({ component: '_table/products/*', verb_mask: 1 }),
    ]);
    expect(
      accessRowsForChanges(
        [
          {
            serviceId: 50,
            label: 'a',
            before: 'read',
            after: 'read',
            beforeTables: ['orders', 'customers'],
            tables: ['customers', 'orders'],
          },
        ],
        existing
      )
    ).toEqual([]);
    expect(
      accessRowsForChanges(
        [
          {
            serviceId: 50,
            label: 'a',
            before: 'read',
            after: 'none',
            beforeTables: ['orders', 'customers'],
          },
        ],
        existing
      )
    ).toEqual([
      { id: 1, role_id: null },
      { id: 2, role_id: null },
      { id: 3, role_id: null },
    ]);
  });

  it('summary names table limits and flags the listing row', () => {
    const s = summarizeAccessChanges(
      [
        {
          serviceId: 50,
          label: 'Demo MySQL',
          before: 'none',
          after: 'read',
          tables: ['a', 'b'],
          tableTotal: 5,
        },
        {
          serviceId: 51,
          label: 'PG',
          before: 'read',
          after: 'read',
          beforeTables: ['a'],
          tables: ['a', 'b'],
        },
      ],
      54
    );
    expect(s.read).toEqual(['Demo MySQL (2 of 5 tables)']);
    expect(s.deltas).toEqual([{ label: 'PG (2 tables)', delta: '~tables' }]);
    expect(s.listing).toBe(true);
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

describe('mcp-access: editor changes and summary', () => {
  const backends = [
    { id: 50, label: 'Demo MySQL' },
    { id: 51, label: 'Demo PG' },
  ];

  it('always proposes the MCP server row, granted read when the role has none', () => {
    const changes = buildAccessChanges({
      serverId: 54,
      serverLabel: 'Demo MCP',
      backends,
      specs: {},
      levels: { 50: 'read', 51: 'none' },
    });
    expect(changes[0]).toEqual({
      serviceId: 54,
      label: 'Demo MCP',
      before: 'none',
      after: 'read',
    });
    const rows = accessRowsForChanges(changes, []);
    expect(rows).toEqual([
      expect.objectContaining({ service_id: 54, component: '*', verb_mask: 1 }),
      expect.objectContaining({ service_id: 50, component: '*', verb_mask: 1 }),
    ]);
  });

  it('keeps an existing server grant and never rewrites rows it cannot represent', () => {
    const existing = [
      { id: 1, serviceId: 54, component: '*', verbMask: 31 },
      { id: 2, serviceId: 50, component: '_proc/*', verbMask: 1 },
    ];
    const changes = buildAccessChanges({
      serverId: 54,
      serverLabel: 'Demo MCP',
      backends,
      specs: specsFor(existing, [54, 50, 51]),
      levels: { 50: 'rw', 51: 'none' },
    });
    expect(changes.map(c => c.serviceId)).toEqual([54, 51]);
    expect(changes[0]).toEqual(
      expect.objectContaining({ before: 'rw', after: 'rw' })
    );
    expect(accessRowsForChanges(changes, existing)).toEqual([]);
  });

  it('writes the live summary per mode', () => {
    const create = buildAccessChanges({
      serverId: 54,
      serverLabel: 'Demo MCP',
      backends,
      specs: {},
      levels: { 50: 'read', 51: 'rw' },
    });
    expect(
      summaryText(summarizeAccessChanges(create, 54), {
        mode: 'create',
        roleName: 'demo_access',
        createKey: true,
      })
    ).toBe(
      'Creates role demo_access, grants this MCP server, read on 1 API, ' +
        'read and write on 1 API, creates an API key'
    );
    const edit = buildAccessChanges({
      serverId: 54,
      serverLabel: 'Demo MCP',
      backends,
      specs: specsFor(
        [
          { id: 1, serviceId: 54, component: '*', verbMask: 1 },
          { id: 2, serviceId: 50, component: '*', verbMask: 31 },
        ],
        [54, 50, 51]
      ),
      levels: { 50: 'none', 51: 'read' },
    });
    expect(
      summaryText(summarizeAccessChanges(edit, 54), { mode: 'edit' })
    ).toBe('+ read on Demo PG, − access on Demo MySQL');
    expect(summaryText(summarizeAccessChanges([], 54), { mode: 'edit' })).toBe(
      'No changes yet.'
    );
  });

  it('one-click grant writes only the server row, and nothing when already granted', () => {
    expect(serverGrantRows(54, [])).toEqual([
      expect.objectContaining({ service_id: 54, component: '*', verb_mask: 1 }),
    ]);
    expect(
      serverGrantRows(54, [
        { id: 9, serviceId: 54, component: '*', verbMask: 1 },
      ])
    ).toEqual([]);
  });

  it('reads config flags in either case with a default', () => {
    expect(cfgFlag({}, 'allow_writes', 'allowWrites', true)).toBe(true);
    expect(
      cfgFlag({ allow_writes: false }, 'allow_writes', 'allowWrites', true)
    ).toBe(false);
    expect(
      cfgFlag({ allowWrites: 0 }, 'allow_writes', 'allowWrites', true)
    ).toBe(false);
    expect(
      cfgFlag(
        { requireRoleAccess: true },
        'require_role_access',
        'requireRoleAccess',
        false
      )
    ).toBe(true);
  });
});
