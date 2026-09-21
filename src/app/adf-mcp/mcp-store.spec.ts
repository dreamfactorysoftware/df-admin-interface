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

  it('touch() notifies subscribers', () => {
    const store = makeStore();
    const seen = jest.fn();
    const sub = store.changes.subscribe(seen);
    store.setBareTool('search', false);
    expect(seen).toHaveBeenCalled();
    sub.unsubscribe();
  });
});
