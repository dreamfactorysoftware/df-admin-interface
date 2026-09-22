/**
 * Exhaustive unit tests for the pure MCP model + math module. Every number
 * the Tools tab displays derives from these functions, so this spec is the
 * contract for the count formulas in Appendix A of the design spec.
 */
import {
  AGGREGATOR_TOOLS,
  GLOBAL_TOOLS,
  DEFAULT_BYTES_PER_TOOL,
  LAZY_FACADE_TOOLS,
  verbsFor,
} from './mcp-catalog';
import {
  McpBackendService,
  accessState,
  allKeys,
  effectiveTools,
  emittedDbToolName,
  exposedRows,
  groupState,
  isWriteCapableCustomTool,
  keyBelongsTo,
  normalizeLazyMode,
  orphanedKeys,
  parseMcpConfig,
  readOnlyKeys,
  serializeMcpConfig,
  serviceFraction,
  toolKey,
  verbReach,
} from './mcp-effective';

const svc = (
  name: string,
  kind: 'db' | 'file' = 'db',
  active = true
): McpBackendService => ({ name, label: name, kind, active });

const DB_VERBS = verbsFor('db').map(v => v.verb);
const FILE_VERBS = verbsFor('file').map(v => v.verb);
const WRITE_DB_VERBS = [
  'create_records',
  'update_records',
  'delete_records',
  'get_stored_procedures',
  'call_stored_procedure',
  'get_stored_functions',
  'call_stored_function',
];
const READ_DB_VERBS = DB_VERBS.filter(v => !WRITE_DB_VERBS.includes(v));

function cfgWith(over: Partial<ReturnType<typeof parseMcpConfig>> = {}) {
  return { ...parseMcpConfig({}), ...over };
}

describe('parseMcpConfig / serializeMcpConfig', () => {
  it('parses a snake_case (API) blob', () => {
    const c = parseMcpConfig({
      exposed_services: ['crm', 'hr'],
      disabled_tools: ['crm_create_records'],
      tool_style: 'merged',
      lazy_mode: 'always',
      allow_api_key_auth: true,
      oauth_client_id: 'id',
      oauth_client_secret: 'sec',
      custom_login_url: 'https://x',
      auto_oauth_service: 'okta',
      redirect_uris: ['https://claude.ai/api/mcp/auth_callback'],
      custom_tools: [{ name: 'env_info', enabled: true }],
      scope_tools: true,
    });
    expect(c.exposedServices).toEqual(['crm', 'hr']);
    expect(c.disabledTools.has('crm_create_records')).toBe(true);
    expect(c.toolStyle).toBe('merged');
    // Legacy 'always' normalizes to the contract value on read.
    expect(c.lazyMode).toBe('on');
    expect(c.allowApiKeyAuth).toBe(true);
    expect(c.oauthClientId).toBe('id');
    expect(c.oauthClientSecret).toBe('sec');
    expect(c.customLoginUrl).toBe('https://x');
    expect(c.autoOauthService).toBe('okta');
    expect(c.redirectUris).toEqual(['https://claude.ai/api/mcp/auth_callback']);
    expect(c.customTools).toHaveLength(1);
    // Unknown keys survive in rest so saves never drop columns.
    expect(c.rest['scope_tools']).toBe(true);
  });

  it('parses a camelCase (legacy resolver) blob identically', () => {
    const c = parseMcpConfig({
      exposedServices: ['crm'],
      disabledTools: ['crm_delete_records'],
      toolStyle: 'prefixed',
      lazyMode: 'auto',
      allowApiKeyAuth: false,
    });
    expect(c.exposedServices).toEqual(['crm']);
    expect(c.disabledTools.has('crm_delete_records')).toBe(true);
    expect(c.toolStyle).toBe('prefixed');
  });

  it('normalizes null/absent fields', () => {
    const c = parseMcpConfig(null);
    expect(c.exposedServices).toEqual([]);
    expect(c.disabledTools.size).toBe(0);
    expect(c.toolStyle).toBeNull();
    expect(c.lazyMode).toBe('auto');
    expect(c.allowApiKeyAuth).toBe(false);
    // Legacy/unknown tool_style values render as null (server default).
    expect(parseMcpConfig({ tool_style: 'auto' }).toolStyle).toBeNull();
  });

  it('round-trips through serialize (camelCase payload, sorted denylist)', () => {
    const c = parseMcpConfig({
      exposed_services: ['b', 'a'],
      disabled_tools: ['z_tool', 'a_tool'],
      tool_style: 'merged',
      scope_tools: true,
      custom_tools: [{ id: 3, name: 't', toolType: 'api', enabled: true }],
    });
    const out = serializeMcpConfig(c, 'mcp');
    expect(out['exposedServices']).toEqual(['b', 'a']);
    expect(out['disabledTools']).toEqual(['a_tool', 'z_tool']);
    expect(out['toolStyle']).toBe('merged');
    expect(out['scope_tools']).toBe(true); // rest spread back
    expect(out['customTools'][0]).toMatchObject({ id: 3, name: 't' });
    // Parsing the serialized payload yields the same normalized config.
    const again = parseMcpConfig(out);
    expect(again.exposedServices).toEqual(c.exposedServices);
    expect([...again.disabledTools].sort()).toEqual(
      [...c.disabledTools].sort()
    );
    expect(again.toolStyle).toBe(c.toolStyle);
  });

  it('omits customTools for system_mcp', () => {
    const c = parseMcpConfig({ custom_tools: [{ name: 'x' }] });
    expect(serializeMcpConfig(c, 'system_mcp')['customTools']).toBeUndefined();
    expect(serializeMcpConfig(c, 'mcp')['customTools']).toBeDefined();
  });

  it('lazy_mode contract is auto|on|off; legacy values normalize on read', () => {
    expect(normalizeLazyMode('auto')).toBe('auto');
    expect(normalizeLazyMode('on')).toBe('on');
    expect(normalizeLazyMode('off')).toBe('off');
    expect(normalizeLazyMode('always')).toBe('on');
    expect(normalizeLazyMode('never')).toBe('off');
    expect(normalizeLazyMode(true)).toBe('on');
    expect(normalizeLazyMode(false)).toBe('off');
    expect(normalizeLazyMode(null)).toBe('auto');
    expect(normalizeLazyMode(undefined)).toBe('auto');
    expect(parseMcpConfig({ lazy_mode: 'on' }).lazyMode).toBe('on');
    expect(parseMcpConfig({ lazy_mode: 'never' }).lazyMode).toBe('off');
    expect(parseMcpConfig({ lazy_mode: null }).lazyMode).toBe('auto');
    // Serialize writes ONLY contract values, even for a legacy-loaded row.
    expect(serializeMcpConfig(parseMcpConfig({ lazy_mode: 'always' }))['lazyMode']).toBe('on');
    expect(serializeMcpConfig(parseMcpConfig({ lazy_mode: false }))['lazyMode']).toBe('off');
    expect(serializeMcpConfig(parseMcpConfig({}))['lazyMode']).toBe('auto');
  });

  it('registered_redirect_uris is read-only: no fallback in, verbatim out', () => {
    const c = parseMcpConfig({
      redirect_uris: null,
      registered_redirect_uris: ['https://claude.ai/api/mcp/auth_callback'],
    });
    // Never folded into the editable list (that would fake revocability).
    expect(c.redirectUris).toEqual([]);
    expect(c.registeredRedirectUris).toEqual([
      'https://claude.ai/api/mcp/auth_callback',
    ]);
    const out = serializeMcpConfig(c);
    expect(out['redirectUris']).toEqual([]);
    expect(out['registeredRedirectUris']).toEqual([
      'https://claude.ai/api/mcp/auth_callback',
    ]);
    // Survives a full round-trip untouched.
    const again = parseMcpConfig(out);
    expect(again.registeredRedirectUris).toEqual(c.registeredRedirectUris);
    expect(again.redirectUris).toEqual([]);
    // Both lists coexist without cross-contamination.
    const both = parseMcpConfig({
      redirect_uris: ['https://mine.example/cb'],
      registered_redirect_uris: ['https://claude.ai/cb'],
    });
    expect(both.redirectUris).toEqual(['https://mine.example/cb']);
    expect(both.registeredRedirectUris).toEqual(['https://claude.ai/cb']);
  });
});

describe('serviceFraction / groupState', () => {
  it('counts 16 db verbs and 6 file verbs', () => {
    expect(serviceFraction(svc('crm'), new Set())).toEqual({ on: 16, total: 16 });
    expect(serviceFraction(svc('s3', 'file'), new Set())).toEqual({ on: 6, total: 6 });
  });

  it('subtracts only this service’s disabled keys', () => {
    const disabled = new Set([
      'crm_create_records',
      'crm_delete_records',
      'other_update_records',
    ]);
    expect(serviceFraction(svc('crm'), disabled)).toEqual({ on: 14, total: 16 });
  });

  it('derives on/part/off group states', () => {
    const s = svc('crm');
    const writeGroup = verbsFor('db')
      .filter(v => ['create_records', 'update_records', 'delete_records'].includes(v.verb));
    expect(writeGroup).toHaveLength(3);
    const group = {
      key: 'write' as const,
      label: 'Write data',
      warn: 'writes' as const,
      verbs: writeGroup,
    };
    expect(groupState(s, group, new Set())).toBe('on');
    expect(groupState(s, group, new Set(['crm_create_records']))).toBe('part');
    expect(
      groupState(
        s,
        group,
        new Set(['crm_create_records', 'crm_update_records', 'crm_delete_records'])
      )
    ).toBe('off');
  });
});

describe('accessState — all four kinds', () => {
  const s = svc('crm');

  it('Full when nothing is disabled', () => {
    expect(accessState(s, new Set())).toEqual({ kind: 'full', label: 'Full' });
  });

  it('Read-only when all write/execute off and all read/schema on', () => {
    const disabled = new Set(WRITE_DB_VERBS.map(v => toolKey('crm', v)));
    expect(accessState(s, disabled)).toEqual({ kind: 'ro', label: 'Read-only' });
    // readOnlyKeys() compiles exactly that state.
    expect(new Set(readOnlyKeys(s))).toEqual(disabled);
  });

  it('Custom for any other mix', () => {
    const a = accessState(s, new Set(['crm_get_table_data']));
    expect(a.kind).toBe('custom');
    expect(a.label).toBe('Custom 15 of 16');
  });

  it('zero when every tool is off (legacy master-toggle-off)', () => {
    const disabled = new Set(allKeys(s));
    expect(accessState(s, disabled)).toEqual({ kind: 'zero', label: '0 of 16' });
  });
});

describe('effectiveTools', () => {
  const services = [svc('crm'), svc('hr'), svc('s3', 'file')];

  it('prefixed: sums per-service enabled verbs', () => {
    const cfg = cfgWith({
      exposedServices: ['crm', 'hr', 's3'],
      toolStyle: 'prefixed',
      disabledTools: new Set(['crm_create_records', 's3_delete_file']),
    });
    const e = effectiveTools(cfg, services);
    expect(e.effectiveStyle).toBe('prefixed');
    expect(e.dbTools).toBe(15 + 16);
    expect(e.fileTools).toBe(5);
    expect(e.globalTools).toBe(GLOBAL_TOOLS.length);
    expect(e.aggregators).toBe(AGGREGATOR_TOOLS.length); // 2 dbs
    expect(e.total).toBe(31 + 5 + 5 + 6);
  });

  it('merged: counts distinct verbs enabled in at least one exposed db', () => {
    const cfg = cfgWith({
      exposedServices: ['crm', 'hr'],
      toolStyle: 'merged',
      // create_records off in crm only → still reachable through hr.
      disabledTools: new Set([
        'crm_create_records',
        // delete_records off everywhere → verb gone.
        'crm_delete_records',
        'hr_delete_records',
      ]),
    });
    const e = effectiveTools(cfg, services.slice(0, 2));
    expect(e.effectiveStyle).toBe('merged');
    expect(e.dbTools).toBe(15); // 16 verbs − delete_records
  });

  it('null toolStyle behaves as prefixed', () => {
    const cfg = cfgWith({ exposedServices: ['crm'], toolStyle: null });
    expect(effectiveTools(cfg, services).effectiveStyle).toBe('prefixed');
  });

  it('gates aggregators at two databases', () => {
    const one = cfgWith({ exposedServices: ['crm'] });
    const two = cfgWith({ exposedServices: ['crm', 'hr'] });
    expect(effectiveTools(one, services).aggregators).toBe(0);
    expect(effectiveTools(two, services).aggregators).toBe(AGGREGATOR_TOOLS.length);
    // A file service does not count toward the gate.
    const dbPlusFile = cfgWith({ exposedServices: ['crm', 's3'] });
    expect(effectiveTools(dbPlusFile, services).aggregators).toBe(0);
  });

  it('disables globals and aggregators by bare name', () => {
    const cfg = cfgWith({
      exposedServices: ['crm', 'hr'],
      disabledTools: new Set(['search', 'all_get_tables']),
    });
    const e = effectiveTools(cfg, services);
    expect(e.globalTools).toBe(GLOBAL_TOOLS.length - 1);
    expect(e.aggregators).toBe(AGGREGATOR_TOOLS.length - 1);
  });

  it('excludes inactive services from every number', () => {
    const withInactive = [svc('crm'), svc('hr', 'db', false)];
    const cfg = cfgWith({ exposedServices: ['crm', 'hr'] });
    const e = effectiveTools(cfg, withInactive);
    expect(e.dbServices).toBe(1);
    expect(e.dbTools).toBe(16);
    expect(e.aggregators).toBe(0); // only one ACTIVE db
  });

  it('counts enabled custom tools (enabled !== false/0)', () => {
    const cfg = cfgWith({
      exposedServices: [],
      customTools: [
        { name: 'a', enabled: true },
        { name: 'b', enabled: false },
        { name: 'c', enabled: 0 },
        { name: 'd' },
      ],
    });
    expect(effectiveTools(cfg, []).customTools).toBe(2);
  });

  it("engages lazy on 'on', and on 'auto' over the token threshold", () => {
    const small = cfgWith({ exposedServices: ['crm'] });
    expect(effectiveTools(small, services).lazyEngaged).toBe(false);
    expect(
      effectiveTools({ ...small, lazyMode: 'on' }, services).lazyEngaged
    ).toBe(true);
    expect(
      effectiveTools({ ...small, lazyMode: 'off' }, services).lazyEngaged
    ).toBe(false);
    // Legacy stored values engage through parse-time normalization.
    expect(
      effectiveTools(
        cfgWith({ ...parseMcpConfig({ lazy_mode: true }), exposedServices: ['crm'] }),
        services
      ).lazyEngaged
    ).toBe(true);
    // 7 dbs × 16 + 5 globals + 6 aggregators = 123 tools × 540 B > 32 KiB.
    const many = Array.from({ length: 7 }, (_, i) => svc(`db${i}`));
    const big = cfgWith({ exposedServices: many.map(m => m.name) });
    const e = effectiveTools(big, many);
    expect(e.total).toBe(7 * 16 + 5 + 6);
    // Lazy: the client carries the facade, not the catalog.
    expect(e.tokenEstimate).toBe(
      Math.round((LAZY_FACADE_TOOLS.length * DEFAULT_BYTES_PER_TOOL) / 4)
    );
    expect(e.lazyEngaged).toBe(true);
    expect(
      effectiveTools({ ...big, lazyMode: 'off' }, many).lazyEngaged
    ).toBe(false);
  });

  it('computes write reach and the derived read-only state', () => {
    const roCrm = WRITE_DB_VERBS.map(v => toolKey('crm', v));
    const cfg = cfgWith({
      exposedServices: ['crm', 'hr', 's3'],
      disabledTools: new Set(roCrm),
    });
    const e = effectiveTools(cfg, services);
    expect(e.writeReachDb).toBe(1); // only hr still has write verbs
    expect(e.writeReach).toBe(2); // hr + the s3 file service
    // prefixed (null style): per-service instances — hr's 7 + s3's 3.
    expect(e.writeVerbs).toBe(10);
    expect(e.readOnly).toBe(false);
    // Turn off every write/execute verb everywhere → derived read-only.
    const allOff = new Set([
      ...WRITE_DB_VERBS.flatMap(v => [toolKey('crm', v), toolKey('hr', v)]),
      ...['create_file', 'create_folder', 'delete_file'].map(v => toolKey('s3', v)),
    ]);
    const ro = effectiveTools(cfgWith({
      exposedServices: ['crm', 'hr', 's3'],
      disabledTools: allOff,
    }), services);
    expect(ro.writeVerbs).toBe(0);
    expect(ro.readOnly).toBe(true);
    // Read/schema tools are still served.
    expect(ro.dbTools).toBe(READ_DB_VERBS.length * 2);
  });

  it('counts SERVED write tools per style (Appendix A)', () => {
    // prefixed: per-service instances for dbs AND files.
    const pre = cfgWith({
      exposedServices: ['crm', 'hr', 's3'],
      toolStyle: 'prefixed',
    });
    expect(effectiveTools(pre, services).writeVerbs).toBe(7 + 7 + 3);
    // merged: distinct db write verbs + per-service file write instances.
    const mer = cfgWith({
      exposedServices: ['crm', 'hr', 's3'],
      toolStyle: 'merged',
    });
    expect(effectiveTools(mer, services).writeVerbs).toBe(7 + 3);
    // merged: a verb off in one db is still served through the other.
    const merOne = cfgWith({
      exposedServices: ['crm', 'hr'],
      toolStyle: 'merged',
      disabledTools: new Set(['crm_create_records']),
    });
    expect(effectiveTools(merOne, services).writeVerbs).toBe(7);
    // file services are per-service instances in BOTH styles.
    const fileSvcs = [svc('s3', 'file'), svc('gcs', 'file')];
    for (const style of ['merged', 'prefixed'] as const) {
      const cfg = cfgWith({ exposedServices: ['s3', 'gcs'], toolStyle: style });
      expect(effectiveTools(cfg, fileSvcs).writeVerbs).toBe(6);
    }
  });

  it('classifies custom tools into the write math and readOnly', () => {
    expect(isWriteCapableCustomTool({ httpMethod: 'GET' })).toBe(false);
    expect(isWriteCapableCustomTool({})).toBe(false); // api + default GET
    expect(isWriteCapableCustomTool({ httpMethod: 'post' })).toBe(true);
    expect(isWriteCapableCustomTool({ httpMethod: 'DELETE' })).toBe(true);
    expect(isWriteCapableCustomTool({ toolType: 'function' })).toBe(true);

    const cfg = cfgWith({
      customTools: [
        { name: 'lookup', httpMethod: 'GET', enabled: true },
        { name: 'notify', httpMethod: 'POST', enabled: true },
        { name: 'calc', toolType: 'function', enabled: true },
        { name: 'purge', httpMethod: 'DELETE', enabled: false }, // off
      ],
    });
    const e = effectiveTools(cfg, []);
    expect(e.customTools).toBe(3);
    expect(e.writeCapableCustoms).toBe(2); // notify + calc; purge is off
    expect(e.writeVerbs).toBe(2); // no services exposed
    expect(e.readOnly).toBe(false);

    // GET-only customs keep the server read-only.
    const ro = effectiveTools(
      cfgWith({ customTools: [{ name: 'lookup', httpMethod: 'GET', enabled: true }] }),
      []
    );
    expect(ro.writeCapableCustoms).toBe(0);
    expect(ro.readOnly).toBe(true);
  });
});

describe('exposedRows / orphanedKeys', () => {
  const services = [svc('crm'), svc('s3', 'file')];

  it('pairs exposed names with live services, null for orphans', () => {
    const cfg = cfgWith({ exposedServices: ['crm', 'legacy_dw'] });
    const rows = exposedRows(cfg, services);
    expect(rows[0].svc?.name).toBe('crm');
    expect(rows[1]).toEqual({ name: 'legacy_dw', svc: null });
  });

  it('flags keys whose prefix matches no known service', () => {
    const cfg = cfgWith({
      exposedServices: [],
      disabledTools: new Set(['ghost_get_tables', 'crm_get_tables']),
    });
    expect(orphanedKeys(cfg, services)).toEqual(['ghost_get_tables']);
  });

  it('ignores bare globals, aggregators and custom names', () => {
    const cfg = cfgWith({
      exposedServices: [],
      disabledTools: new Set(['search', 'all_get_tables', 'my_custom']),
      customTools: [{ name: 'my_custom' }],
    });
    expect(orphanedKeys(cfg, services)).toEqual([]);
  });

  it('treats exposed orphan entries as owners of their keys', () => {
    const cfg = cfgWith({
      exposedServices: ['legacy_dw'],
      disabledTools: new Set(['legacy_dw_create_records']),
    });
    // The keys are dormant, not orphaned: the entry still claims them.
    expect(orphanedKeys(cfg, services)).toEqual([]);
  });

  it('never lets a service claim a sibling service’s keys', () => {
    // Service 'db' must not own 'db_backup_list_files' — the suffix
    // 'backup_list_files' is no catalog verb.
    const sibs = [svc('db'), svc('db_backup', 'file')];
    const cfg = cfgWith({
      disabledTools: new Set(['db_backup_list_files', 'db_get_tables']),
    });
    expect(orphanedKeys(cfg, sibs)).toEqual([]);
    // Once db_backup is gone, its key is an orphan — 'db' does not absorb it.
    expect(orphanedKeys(cfg, [svc('db')])).toEqual(['db_backup_list_files']);
  });

  it('flags a known-service key whose suffix is no catalog verb', () => {
    const cfg = cfgWith({ disabledTools: new Set(['crm_bogus_verb']) });
    expect(orphanedKeys(cfg, services)).toEqual(['crm_bogus_verb']);
  });

  it('accepts extra bare names (system_mcp tool names) as owned', () => {
    const cfg = cfgWith({
      disabledTools: new Set(['create_service', 'ghost_get_tables']),
    });
    // Without the bare set, a system tool name looks orphaned…
    expect(orphanedKeys(cfg, [])).toEqual(
      expect.arrayContaining(['create_service'])
    );
    // …with it, only the genuinely dead key remains.
    expect(orphanedKeys(cfg, [], ['create_service'])).toEqual([
      'ghost_get_tables',
    ]);
  });

  it('keyBelongsTo requires an exact {service}_{verb} catalog match', () => {
    expect(keyBelongsTo('crm_get_tables', 'crm', 'db')).toBe(true);
    expect(keyBelongsTo('crm_get_tables', 'crm', 'file')).toBe(false);
    expect(keyBelongsTo('s3_list_files', 's3', 'file')).toBe(true);
    // Unknown kind checks both catalogs.
    expect(keyBelongsTo('x_create_records', 'x')).toBe(true);
    expect(keyBelongsTo('x_create_file', 'x')).toBe(true);
    expect(keyBelongsTo('x_bogus', 'x')).toBe(false);
    // Prefix alone is never ownership.
    expect(keyBelongsTo('db_backup_list_files', 'db')).toBe(false);
    expect(keyBelongsTo('db_backup_list_files', 'db_backup')).toBe(true);
  });
});

describe('verbReach / emittedDbToolName', () => {
  it('reports which active exposed dbs a verb reaches', () => {
    const services = [svc('crm'), svc('hr'), svc('archive', 'db', false)];
    const cfg = cfgWith({
      exposedServices: ['crm', 'hr', 'archive'],
      disabledTools: new Set(['crm_create_records']),
    });
    expect(verbReach('create_records', cfg, services)).toEqual({
      on: ['hr'],
      total: 2, // inactive archive excluded
    });
    expect(verbReach('get_table_data', cfg, services).on).toEqual(['crm', 'hr']);
  });

  it('emits bare verbs in merged style, prefixed otherwise', () => {
    expect(emittedDbToolName('merged', 'crm', 'get_tables')).toBe('get_tables');
    expect(emittedDbToolName('prefixed', 'crm', 'get_tables')).toBe(
      'crm_get_tables'
    );
  });

  it('disabled_tools keys are the prefixed form in BOTH styles', () => {
    expect(toolKey('crm', 'get_tables')).toBe('crm_get_tables');
  });
});

describe('catalog sanity (single source of counts)', () => {
  it('serves 16 db verbs, 6 file verbs, 5 globals, 6 aggregators', () => {
    expect(DB_VERBS).toHaveLength(16);
    expect(FILE_VERBS).toHaveLength(6);
    expect(GLOBAL_TOOLS).toHaveLength(5);
    expect(AGGREGATOR_TOOLS).toHaveLength(6);
  });
});
