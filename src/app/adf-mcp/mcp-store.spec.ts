/**
 * Unit tests for McpEditorStore: dirty/fingerprint math, exposure mutations
 * (access modes + dormant-curation keep), remove keep/clear, the
 * rename-successor key rewrite, Make read-only, and connection-affecting
 * change detection.
 */
import { McpBackendService, toolKey } from './mcp-effective';
import { McpEditorStore, McpServiceRecord } from './mcp-store';

const svc = (
  name: string,
  kind: 'db' | 'file' = 'db',
  active = true
): McpBackendService => ({ name, label: name, kind, active });

const WRITE_DB_VERBS = [
  'create_records',
  'update_records',
  'delete_records',
  'get_stored_procedures',
  'call_stored_procedure',
  'get_stored_functions',
  'call_stored_function',
];

function makeStore(
  rawConfig: Record<string, any> = {},
  services: McpBackendService[] = [svc('crm'), svc('hr'), svc('s3', 'file')],
  type: 'mcp' | 'system_mcp' = 'mcp'
): McpEditorStore {
  const store = new McpEditorStore();
  const record: McpServiceRecord = {
    id: 7,
    name: 'warehouse',
    label: 'Warehouse',
    description: '',
    isActive: true,
    type,
    raw: {},
  };
  store.init(record, rawConfig);
  store.backendServices = services;
  store.backendLoaded = true;
  return store;
}

describe('dirty / fingerprint', () => {
  it('starts clean and turns dirty on any config mutation', () => {
    const store = makeStore({ exposed_services: ['crm'] });
    expect(store.dirty()).toBe(false);
    store.setTool('crm', 'create_records', false);
    expect(store.dirty()).toBe(true);
  });

  it('returns to clean when the same key is re-enabled', () => {
    const store = makeStore({ exposed_services: ['crm'] });
    store.setTool('crm', 'create_records', false);
    store.setTool('crm', 'create_records', true);
    expect(store.dirty()).toBe(false);
  });

  it('tracks identity drafts and clears on markSaved / discard', () => {
    const store = makeStore();
    store.draftName = 'renamed';
    expect(store.dirty()).toBe(true);
    store.discard();
    expect(store.draftName).toBe('warehouse');
    expect(store.dirty()).toBe(false);

    store.cfg.allowApiKeyAuth = true;
    expect(store.dirty()).toBe(true);
    store.markSaved();
    expect(store.dirty()).toBe(false);
    expect(store.savedCfg.allowApiKeyAuth).toBe(true);
  });

  it('discard restores the saved config exactly', () => {
    const store = makeStore({ exposed_services: ['crm'] });
    store.exposeServices(['hr'], 'ro');
    store.removeService('crm');
    store.discard();
    expect(store.cfg.exposedServices).toEqual(['crm']);
    expect(store.cfg.disabledTools.size).toBe(0);
  });
});

describe('exposeServices', () => {
  it('ro compiles the write/execute verbs into disabled_tools', () => {
    const store = makeStore();
    store.exposeServices(['crm'], 'ro');
    expect(store.cfg.exposedServices).toEqual(['crm']);
    for (const v of WRITE_DB_VERBS) {
      expect(store.cfg.disabledTools.has(toolKey('crm', v))).toBe(true);
    }
    expect(store.cfg.disabledTools.has('crm_get_table_data')).toBe(false);
    expect(store.access(svc('crm')).kind).toBe('ro');
  });

  it('rw clears every key so the service serves everything', () => {
    const store = makeStore({ disabled_tools: ['crm_get_tables'] });
    store.exposeServices(['crm'], 'rw');
    expect(store.cfg.disabledTools.size).toBe(0);
    expect(store.access(svc('crm')).kind).toBe('full');
  });

  it('keep re-applies dormant curation untouched', () => {
    const store = makeStore({ disabled_tools: ['crm_get_tables'] });
    store.exposeServices(['crm'], 'keep');
    expect(store.cfg.exposedServices).toEqual(['crm']);
    expect(store.cfg.disabledTools.has('crm_get_tables')).toBe(true);
  });

  it('never duplicates an already-exposed name', () => {
    const store = makeStore({ exposed_services: ['crm'] });
    store.exposeServices(['crm', 'hr'], 'keep');
    expect(store.cfg.exposedServices).toEqual(['crm', 'hr']);
  });

  it('file services get their write verbs compiled too', () => {
    const store = makeStore();
    store.exposeServices(['s3'], 'ro');
    expect(store.cfg.disabledTools.has('s3_create_file')).toBe(true);
    expect(store.cfg.disabledTools.has('s3_list_files')).toBe(false);
  });
});

describe('removeService', () => {
  it('keeps curation by default (migration-safety rule 2)', () => {
    const store = makeStore({
      exposed_services: ['crm', 'hr'],
      disabled_tools: ['crm_create_records'],
    });
    store.removeService('crm');
    expect(store.cfg.exposedServices).toEqual(['hr']);
    expect(store.cfg.disabledTools.has('crm_create_records')).toBe(true);
    expect(store.dormantCurationCount('crm')).toBe(1);
  });

  it('clears curation only when asked', () => {
    const store = makeStore({
      exposed_services: ['crm'],
      disabled_tools: ['crm_create_records', 'hr_create_records', 'search'],
    });
    store.removeService('crm', true);
    expect(store.cfg.disabledTools.has('crm_create_records')).toBe(false);
    // Other services' keys and bare names are untouched.
    expect(store.cfg.disabledTools.has('hr_create_records')).toBe(true);
    expect(store.cfg.disabledTools.has('search')).toBe(true);
  });
});

describe('prefix ownership (sibling services)', () => {
  const sibs = [svc('sales'), svc('sales_eu')];

  it('removeService(clear) deletes only keys sales actually owns', () => {
    const store = makeStore(
      {
        exposed_services: ['sales', 'sales_eu'],
        disabled_tools: ['sales_create_records', 'sales_eu_create_records'],
      },
      sibs
    );
    store.removeService('sales', true);
    expect(store.cfg.disabledTools.has('sales_create_records')).toBe(false);
    // The sibling's curation is untouched.
    expect(store.cfg.disabledTools.has('sales_eu_create_records')).toBe(true);
  });

  it('renameExposedEntry leaves sibling keys alone', () => {
    const store = makeStore(
      {
        exposed_services: ['sales', 'sales_eu'],
        disabled_tools: ['sales_create_records', 'sales_eu_create_records'],
      },
      [svc('crm'), svc('sales_eu')] // 'sales' itself is an orphan entry
    );
    store.renameExposedEntry('sales', 'crm');
    expect(store.cfg.disabledTools.has('crm_create_records')).toBe(true);
    expect(store.cfg.disabledTools.has('sales_create_records')).toBe(false);
    expect(store.cfg.disabledTools.has('sales_eu_create_records')).toBe(true);
    // No garbage key from re-prefixing the sibling's entry.
    expect(store.cfg.disabledTools.has('crm_eu_create_records')).toBe(false);
  });

  it('dormantCurationCount counts only owned {service}_{verb} keys', () => {
    const store = makeStore(
      {
        disabled_tools: [
          'sales_create_records',
          'sales_eu_create_records',
          'sales_bogus',
        ],
      },
      sibs
    );
    expect(store.dormantCurationCount('sales')).toBe(1);
    expect(store.dormantCurationCount('sales_eu')).toBe(1);
  });
});

describe('renameExposedEntry', () => {
  it('repoints the entry and re-prefixes only its keys', () => {
    const store = makeStore({
      exposed_services: ['legacy_dw', 'crm'],
      disabled_tools: [
        'legacy_dw_create_records',
        'legacy_dw_get_tables',
        'crm_delete_records',
        'search',
      ],
    });
    store.renameExposedEntry('legacy_dw', 'hr');
    expect(store.cfg.exposedServices).toEqual(['hr', 'crm']);
    expect(store.cfg.disabledTools.has('hr_create_records')).toBe(true);
    expect(store.cfg.disabledTools.has('hr_get_tables')).toBe(true);
    expect(store.cfg.disabledTools.has('legacy_dw_create_records')).toBe(false);
    expect(store.cfg.disabledTools.has('crm_delete_records')).toBe(true);
    expect(store.cfg.disabledTools.has('search')).toBe(true);
    expect(store.dormantCurationCount('hr')).toBe(2);
  });
});

describe('makeReadOnly', () => {
  it('compiles read-only across all active exposed services', () => {
    const store = makeStore({ exposed_services: ['crm', 'hr', 's3'] });
    store.makeReadOnly();
    const e = store.effective();
    expect(e.readOnly).toBe(true);
    expect(e.writeVerbs).toBe(0);
    expect(store.access(svc('crm')).kind).toBe('ro');
    expect(store.access(svc('s3', 'file')).kind).toBe('ro');
  });

  it('skips inactive and orphaned entries', () => {
    const services = [svc('crm'), svc('archive', 'db', false)];
    const store = makeStore(
      { exposed_services: ['crm', 'archive', 'ghost'] },
      services
    );
    store.makeReadOnly();
    expect(store.cfg.disabledTools.has('crm_create_records')).toBe(true);
    expect(store.cfg.disabledTools.has('archive_create_records')).toBe(false);
    expect(store.cfg.disabledTools.has('ghost_create_records')).toBe(false);
  });

  it('disables write-capable custom tools, keeps GET-only ones on', () => {
    const store = makeStore({
      exposed_services: ['crm'],
      custom_tools: [
        { name: 'lookup', httpMethod: 'GET', enabled: true },
        { name: 'notify', httpMethod: 'POST', enabled: true },
        { name: 'calc', toolType: 'function', enabled: true },
      ],
    });
    store.makeReadOnly();
    const enabled = Object.fromEntries(
      store.cfg.customTools.map((t: any) => [t.name, t.enabled])
    );
    expect(enabled['lookup']).toBe(true);
    expect(enabled['notify']).toBe(false);
    expect(enabled['calc']).toBe(false);
    const e = store.effective();
    expect(e.writeVerbs).toBe(0);
    expect(e.writeCapableCustoms).toBe(0);
    expect(e.readOnly).toBe(true);
    // The read-capable custom tool is still served.
    expect(e.customTools).toBe(1);
  });
});

describe('orphans', () => {
  it('system_mcp: bare System API tool names are never orphans', () => {
    const store = makeStore(
      { disabled_tools: ['create_service', 'update_role', 'call_system_api'] },
      [],
      'system_mcp'
    );
    expect(store.orphans()).toEqual([]);
    // A genuinely dead prefixed key still surfaces.
    store.cfg.disabledTools.add('ghost_get_tables');
    store.touch();
    expect(store.orphans()).toEqual(['ghost_get_tables']);
  });
});

describe('connectionAffecting', () => {
  it('is false for pure curation changes', () => {
    const store = makeStore({ exposed_services: ['crm'] });
    store.setTool('crm', 'create_records', false);
    expect(store.connectionAffecting()).toBe(false);
  });

  it.each([
    ['rename', (s: McpEditorStore) => (s.draftName = 'other')],
    ['api-key flag', (s: McpEditorStore) => (s.cfg.allowApiKeyAuth = true)],
    ['tool style', (s: McpEditorStore) => (s.cfg.toolStyle = 'merged')],
    ['secret', (s: McpEditorStore) => (s.cfg.oauthClientSecret = 'new')],
    [
      'writes switch',
      (s: McpEditorStore) => (s.cfg.allowWrites = !s.cfg.allowWrites),
    ],
    [
      'redirect uris',
      (s: McpEditorStore) => s.cfg.redirectUris.push('https://claude.ai/cb'),
    ],
  ])('is true for %s changes', (_label, mutate) => {
    const store = makeStore();
    mutate(store);
    expect(store.connectionAffecting()).toBe(true);
  });
});

describe('derived shortcuts', () => {
  it('rows() pairs names with live services and orphans', () => {
    const store = makeStore({ exposed_services: ['crm', 'ghost'] });
    const rows = store.rows();
    expect(rows).toHaveLength(2);
    expect(rows[0].svc?.name).toBe('crm');
    expect(rows[1].svc).toBeNull();
  });

  it('bare-name toggles drive globals', () => {
    const store = makeStore();
    expect(store.isBareToolEnabled('search')).toBe(true);
    store.setBareTool('search', false);
    expect(store.isBareToolEnabled('search')).toBe(false);
    expect(store.effective().globalTools).toBe(4);
  });

  it('touch() notifies subscribers and bumps the version', () => {
    const store = makeStore();
    const seen = jest.fn();
    const sub = store.changes.subscribe(seen);
    const v = store.version;
    store.setBareTool('search', false);
    expect(seen).toHaveBeenCalled();
    expect(store.version).toBeGreaterThan(v);
    sub.unsubscribe();
  });
});

describe('memoization (version-keyed derivations)', () => {
  it('returns the identical object within a version, a new one after touch', () => {
    const store = makeStore({ exposed_services: ['crm'] });
    const e = store.effective();
    const s = store.savedEffective();
    const r = store.rows();
    const o = store.orphans();
    // Same version → same object identity (stable for trackBy/CD).
    expect(store.effective()).toBe(e);
    expect(store.savedEffective()).toBe(s);
    expect(store.rows()).toBe(r);
    expect(store.orphans()).toBe(o);
    expect(store.totalTools()).toBe(store.totalTools());
    store.touch();
    expect(store.effective()).not.toBe(e);
    expect(store.savedEffective()).not.toBe(s);
    expect(store.rows()).not.toBe(r);
    expect(store.orphans()).not.toBe(o);
  });

  it('mutations and markSaved/discard invalidate through the touch bump', () => {
    const store = makeStore({ exposed_services: ['crm'] });
    expect(store.effective().total).toBe(16 + 5);
    expect(store.totalTools()).toBe(21);
    store.setTool('crm', 'create_records', false);
    expect(store.effective().total).toBe(20);
    expect(store.totalTools()).toBe(20);
    // savedEffective refreshes when the saved snapshot moves.
    const savedBefore = store.savedEffective();
    expect(savedBefore.total).toBe(21);
    store.markSaved();
    expect(store.savedEffective()).not.toBe(savedBefore);
    expect(store.savedEffective().total).toBe(20);
    expect(store.savedTotalTools()).toBe(20);
    store.setTool('crm', 'update_records', false);
    expect(store.effective().total).toBe(19);
    store.discard();
    expect(store.effective().total).toBe(20);
  });

  it('assigning backendServices invalidates the cached math', () => {
    const store = makeStore({ exposed_services: ['crm', 'hr'] });
    const before = store.effective();
    expect(before.dbServices).toBe(2);
    store.backendServices = [svc('crm')];
    const after = store.effective();
    expect(after).not.toBe(before);
    expect(after.dbServices).toBe(1);
  });
});
