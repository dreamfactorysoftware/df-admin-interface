import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { ActionRegistryService, PaletteItem } from './action-registry.service';

/** Command palette: Data Masking and Compliance are found by what admins type. */
describe('ActionRegistryService palette search', () => {
  let registry: ActionRegistryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: HttpClient, useValue: {} }],
    });
    registry = TestBed.inject(ActionRegistryService);
  });

  const ids = (q: string): string[] =>
    registry
      .query(q)
      .flatMap(g => g.items)
      .map((i: PaletteItem) => i.id);

  it.each([
    'pii',
    'phi',
    'pci',
    'mask',
    'masking',
    'redact',
    'personal data',
    'hipaa',
    'gdpr',
  ])('"%s" finds Data Masking', q => {
    expect(ids(q)).toContain('jump.data-masking');
  });

  it.each(['hipaa', 'pci', 'phi', 'gdpr', 'soc 2', 'soc2', 'iso', 'baseline'])(
    '"%s" finds Compliance',
    q => {
      expect(ids(q)).toContain('jump.compliance');
    }
  );

  it('ranks Data Masking first among pages for "pii"', () => {
    const docs = registry.query('pii').find(g => g.kind === 'doc')!;
    expect(docs.items[0].id).toBe('jump.data-masking');
  });

  it('keeps existing jumps where they were (rate limiting by "throttle")', () => {
    const docs = registry.query('throttle').find(g => g.kind === 'doc')!;
    expect(docs.items[0].id).toBe('jump.rate-limiting');
  });

  describe('ranking with real objects loaded (the GOLD stack)', () => {
    // The objects dmgold lists: services, roles and apps whose names and
    // keywords hold "p…i…i" / "p…c…i" as letters in order, but never the
    // word itself.
    const rows: Record<string, unknown[]> = {
      service: [
        { id: 10, name: 'crm', label: 'CRM', type: 'pgsql' },
        { id: 11, name: 'sports', label: 'Sports', type: 'pgsql' },
        { id: 13, name: 'crm_mysql', label: 'CRM MySQL', type: 'mysql' },
        { id: 15, name: 'hr_mssql', label: 'HR', type: 'sqlsrv' },
        { id: 16, name: 'crm_mcp', label: 'CRM MCP', type: 'mcp' },
        { id: 1, name: 'api_docs', label: 'Live API Docs', type: 'swagger' },
      ],
      role: [{ id: 1, name: 'support', description: 'Support desk' }],
      app: [
        { id: 4, name: 'mobile-app', description: 'Mobile application' },
        { id: 1, name: 'admin', description: 'Admin application' },
      ],
    };

    beforeEach(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          {
            provide: HttpClient,
            useValue: {
              get: (url: string) =>
                of({ resource: rows[url.split('/').pop() ?? ''] ?? [] }),
            },
          },
        ],
      });
      registry = TestBed.inject(ActionRegistryService);
      registry.refresh().subscribe();
    });

    it.each(['pii', 'pci', 'phi', 'mask'])(
      '"%s" puts Data Masking first, above fuzzy matches in other groups',
      q => {
        const groups = registry.query(q);
        expect(groups[0].kind).toBe('doc');
        expect(ids(q)[0]).toBe('jump.data-masking');
      }
    );

    it('"hipaa" and "gdpr" open with the pages that name them', () => {
      for (const q of ['hipaa', 'gdpr']) {
        expect(registry.query(q)[0].kind).toBe('doc');
        expect(ids(q).slice(0, 2).sort()).toEqual([
          'jump.compliance',
          'jump.data-masking',
        ]);
      }
    });

    it('fuzzy-only groups keep their order after the strong ones', () => {
      const kinds = registry.query('pii').map(g => g.kind);
      expect(kinds[0]).toBe('doc');
      // The rest stay in the usual order: actions, services, …, keys.
      const rest = kinds.slice(1);
      const order = ['action', 'service', 'role', 'key', 'mcp'];
      expect(rest).toEqual(order.filter(k => rest.includes(k as never)));
    });

    it('a label hit keeps the usual group order (actions first)', () => {
      expect(registry.query('new').map(g => g.kind)[0]).toBe('action');
      // "role": the New role verb (label) leads, as before.
      expect(ids('role')[0]).toBe('verb.new-role');
      expect(registry.query('role').map(g => g.kind)).toEqual([
        'action',
        'role',
        'doc',
      ]);
      // A service whose label matches leads; verbs that only hold the
      // letters in order follow.
      expect(registry.query('crm')[0].kind).toBe('service');
    });
  });
});
