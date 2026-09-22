import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import {
  SERVICES_SERVICE_TOKEN,
  SERVICE_TYPE_SERVICE_TOKEN,
} from 'src/app/shared/constants/tokens';
import { DfSnackbarService } from 'src/app/shared/services/df-snackbar.service';
import { SYSTEM_MCP_TOOLS } from '../../adf-services/df-service-details/system-mcp-tools';
import {
  effectiveTools,
  parseMcpConfig,
  readOnlyKeys,
  toBackendServices,
} from '../mcp-effective';
import { DfMcpCreateComponent } from './df-mcp-create.component';

const TYPE_ROWS = [
  { name: 'mysql', group: 'Database' },
  { name: 'pgsql', group: 'Database' },
  { name: 'local_file', group: 'File' },
  { name: 'mcp', group: 'MCP' },
];

const SERVICE_ROWS = [
  { id: 1, name: 'billing', label: 'Billing', type: 'mysql', isActive: true },
  { id: 2, name: 'hr', label: 'HR', type: 'pgsql', isActive: true },
  {
    id: 3,
    name: 'reports',
    label: 'Reports',
    type: 'local_file',
    isActive: true,
  },
  {
    id: 4,
    name: 'warehouse',
    label: 'Warehouse',
    type: 'mcp',
    isActive: true,
  },
];

const GROUP_MAP: Record<string, string> = {
  mysql: 'Database',
  pgsql: 'Database',
  local_file: 'File',
  mcp: 'MCP',
};

/** The same backend list the component derives, built independently. */
const BACKEND = toBackendServices(SERVICE_ROWS, GROUP_MAP);
const billingSvc = BACKEND.find(s => s.name === 'billing')!;
const reportsSvc = BACKEND.find(s => s.name === 'reports')!;

/** Model-computed breakdown for a selection, for drift-free expectations. */
function expectedBreakdown(names: string[], access: 'ro' | 'rw') {
  const cfg = parseMcpConfig({});
  cfg.exposedServices = [...names];
  cfg.toolStyle = 'merged';
  cfg.lazyMode = 'auto';
  if (access === 'ro') {
    for (const n of names) {
      const svc = BACKEND.find(s => s.name === n);
      if (svc) readOnlyKeys(svc).forEach(k => cfg.disabledTools.add(k));
    }
  }
  return effectiveTools(cfg, BACKEND);
}

describe('DfMcpCreateComponent', () => {
  let fixture: ComponentFixture<DfMcpCreateComponent>;
  let cmp: DfMcpCreateComponent;

  const snackbar = { openSnackBar: jest.fn() };
  const router = { navigate: jest.fn() };
  const route = {};
  const serviceTypeService = {
    getAll: jest.fn(() => of({ resource: TYPE_ROWS })),
  };
  const servicesService = {
    getAll: jest.fn(() => of({ resource: SERVICE_ROWS })),
    get: jest.fn(() => of({})),
    create: jest.fn(() => of({ resource: [{ id: 9 }] })),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    serviceTypeService.getAll.mockReturnValue(of({ resource: TYPE_ROWS }));
    servicesService.getAll.mockReturnValue(of({ resource: SERVICE_ROWS }));
    servicesService.create.mockReturnValue(of({ resource: [{ id: 9 }] }));
    await TestBed.configureTestingModule({
      imports: [DfMcpCreateComponent],
      providers: [
        provideNoopAnimations(),
        { provide: DfSnackbarService, useValue: snackbar },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: route },
        { provide: SERVICE_TYPE_SERVICE_TOKEN, useValue: serviceTypeService },
        { provide: SERVICES_SERVICE_TOKEN, useValue: servicesService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DfMcpCreateComponent);
    cmp = fixture.componentInstance;
    fixture.detectChanges();
  });

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function byTestId(id: string): HTMLElement | null {
    return el().querySelector(`[data-testid="${id}"]`);
  }

  function textOf(elm: HTMLElement | null): string {
    return (elm?.textContent ?? '').replace(/\s+/g, ' ').trim();
  }

  function consequence(): string {
    return textOf(byTestId('mcp-create-consequence'));
  }

  function setName(value: string): void {
    const input = byTestId('mcp-create-name') as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  describe('consequence math (real simulation through effectiveTools)', () => {
    it('zero selected: global tools only, with the bold empty warning', () => {
      const b = expectedBreakdown([], 'ro');
      expect(consequence()).toBe(
        `Agents will get global tools only (${b.globalTools}) — no data ` +
          'access. Empty never means every service.'
      );
      expect(
        byTestId('mcp-create-consequence')!.querySelector('b')!.textContent
      ).toContain('Empty never means every service.');
    });

    it('read-only selection: totals from the shared math, write tools off', () => {
      // One selection through the DOM (validates the row testid), the
      // rest through the same handler.
      (
        byTestId('mcp-create-svc-billing')!.querySelector(
          'input[type="checkbox"]'
        ) as HTMLInputElement
      ).click();
      cmp.toggle('hr');
      cmp.toggle('reports');
      fixture.detectChanges();

      const b = expectedBreakdown(['billing', 'hr', 'reports'], 'ro');
      // Sanity-pin the merged read-only shape: 9 shared db verbs across 2
      // dbs, 3 file, 5 global (+6 aggregators inside the total).
      expect(b.dbTools).toBe(9);
      expect(b.fileTools).toBe(3);
      expect(b.globalTools).toBe(5);
      expect(b.total).toBe(22);
      expect(consequence()).toBe(
        `Agents will get ${b.total} tools: ${b.dbTools} database (shared) ` +
          `· ${b.fileTools} file · ${b.globalTools} global. ` +
          'Write tools are off.'
      );
    });

    it('read & write selection: full counts and no write-off sentence', () => {
      cmp.toggle('billing');
      cmp.toggle('hr');
      cmp.toggle('reports');
      (byTestId('mcp-create-access-rw') as HTMLButtonElement).click();
      fixture.detectChanges();

      const b = expectedBreakdown(['billing', 'hr', 'reports'], 'rw');
      expect(b.total).toBe(32);
      expect(consequence()).toBe(
        `Agents will get ${b.total} tools: ${b.dbTools} database (shared) ` +
          `· ${b.fileTools} file · ${b.globalTools} global.`
      );
      expect(consequence()).not.toContain('Write tools are off.');
    });

    it('All databases (read-only) preset selects every db, read-only', () => {
      (byTestId('mcp-create-access-rw') as HTMLButtonElement).click();
      (byTestId('mcp-create-preset-alldb') as HTMLButtonElement).click();
      fixture.detectChanges();

      expect([...cmp.selected].sort()).toEqual(['billing', 'hr']);
      expect(cmp.access).toBe('ro');
      const b = expectedBreakdown(['billing', 'hr'], 'ro');
      expect(consequence()).toContain(`Agents will get ${b.total} tools:`);
      expect(consequence()).toContain('Write tools are off.');
    });
  });

  describe('name: sanitize, URL preview, collision', () => {
    it('sanitizes as the user types and previews the URL', () => {
      setName('My Service!');
      expect(cmp.name).toBe('myservice');
      expect((byTestId('mcp-create-name') as HTMLInputElement).value).toBe(
        'myservice'
      );
      expect(textOf(byTestId('mcp-create-url-preview'))).toContain(
        `${window.location.origin}/mcp/myservice`
      );
      expect(textOf(byTestId('mcp-create-url-preview'))).toContain(
        'the name is the URL'
      );

      setName('Data_Warehouse 2');
      expect(cmp.name).toBe('data_warehouse2');
      // Label auto-suggests from the name until edited.
      expect(cmp.label).toBe('Data Warehouse2');
    });

    it('flags a taken name inline and disables Create server', () => {
      setName('billing');
      expect(el().textContent).toContain(
        'A service named billing already exists.'
      );
      expect(
        (byTestId('mcp-create-submit') as HTMLButtonElement).disabled
      ).toBe(true);

      setName('billing2');
      expect(el().textContent).not.toContain('already exists');
      expect(
        (byTestId('mcp-create-submit') as HTMLButtonElement).disabled
      ).toBe(false);
    });

    it('empty name disables Create server', () => {
      expect(
        (byTestId('mcp-create-submit') as HTMLButtonElement).disabled
      ).toBe(true);
    });
  });

  describe('read-only compilation', () => {
    it('produces exactly the write/execute keys of the selected services', () => {
      cmp.toggle('billing');
      cmp.toggle('reports');

      const expected = new Set([
        ...readOnlyKeys(billingSvc),
        ...readOnlyKeys(reportsSvc),
      ]);
      expect(cmp.compiledDisabledTools()).toEqual(expected);
      // And nothing else: every key belongs to a write/exec verb.
      expect(expected).toEqual(
        new Set([
          'billing_create_records',
          'billing_update_records',
          'billing_delete_records',
          'billing_get_stored_procedures',
          'billing_call_stored_procedure',
          'billing_get_stored_functions',
          'billing_call_stored_function',
          'reports_create_file',
          'reports_create_folder',
          'reports_delete_file',
        ])
      );
    });

    it('read & write compiles an empty disabled set', () => {
      cmp.toggle('billing');
      cmp.setAccess('rw');
      expect(cmp.compiledDisabledTools().size).toBe(0);
    });
  });

  describe('create (POST) and navigation', () => {
    it('sends the compiled config and lands on ../{id}?created=1', () => {
      setName('analytics');
      cmp.toggle('billing');
      cmp.toggle('reports');
      fixture.detectChanges();

      (byTestId('mcp-create-submit') as HTMLButtonElement).click();

      expect(servicesService.create).toHaveBeenCalledTimes(1);
      const body = (servicesService.create as jest.Mock).mock.calls[0][0];
      expect(body).toEqual({
        resource: [
          {
            name: 'analytics',
            label: 'Analytics',
            description: '',
            isActive: true,
            type: 'mcp',
            config: {
              exposedServices: ['billing', 'reports'],
              disabledTools: [
                ...new Set([
                  ...readOnlyKeys(billingSvc),
                  ...readOnlyKeys(reportsSvc),
                ]),
              ].sort(),
              toolStyle: 'merged',
              lazyMode: 'auto',
              allowApiKeyAuth: false,
              allowWrites: true,
              requireRoleAccess: true,
            },
          },
        ],
      });
      expect(router.navigate).toHaveBeenCalledWith(['../', 9], {
        relativeTo: route,
        queryParams: { created: 1 },
      });
    });

    it('surfaces the server message on failure and stays put', () => {
      servicesService.create.mockReturnValue(
        throwError(() => ({
          error: { error: { message: 'Name is reserved.' } },
        })) as any
      );
      setName('analytics');
      (byTestId('mcp-create-submit') as HTMLButtonElement).click();
      expect(snackbar.openSnackBar).toHaveBeenCalledWith(
        'Name is reserved.',
        'error'
      );
      expect(router.navigate).not.toHaveBeenCalled();
      expect(cmp.saving).toBe(false);
    });
  });

  describe('system_mcp type', () => {
    beforeEach(() => {
      (byTestId('mcp-create-type-system') as HTMLButtonElement).click();
      fixture.detectChanges();
    });

    it('skips the exposure UI entirely (fixed scope)', () => {
      expect(byTestId('mcp-create-search')).toBeNull();
      expect(byTestId('mcp-create-preset-alldb')).toBeNull();
      expect(byTestId('mcp-create-access-ro')).toBeNull();
      expect(byTestId('mcp-create-access-rw')).toBeNull();
    });

    it('states the catalog-derived tool consequence, without the empty warning', () => {
      expect(consequence()).toBe(
        `Agents will get the ${SYSTEM_MCP_TOOLS.length} System API admin tools.`
      );
      // Pin the current catalog size so a catalog change surfaces here too.
      expect(SYSTEM_MCP_TOOLS.length).toBe(18);
      expect(consequence()).not.toContain('Empty never means every service.');
    });

    it('creates with type system_mcp and only require_role_access', () => {
      setName('admin_mcp');
      (byTestId('mcp-create-submit') as HTMLButtonElement).click();
      const body = (servicesService.create as jest.Mock).mock.calls[0][0];
      expect(body.resource[0].type).toBe('system_mcp');
      expect(body.resource[0].config).toEqual({ requireRoleAccess: true });
      expect(router.navigate).toHaveBeenCalledWith(['../', 9], {
        relativeTo: route,
        queryParams: { created: 1 },
      });
    });
  });

  describe('clone', () => {
    it('copies exposure, curation and tool style — an explicit access click overrides curation', () => {
      servicesService.get.mockReturnValue(
        of({
          config: {
            exposed_services: ['billing'],
            disabled_tools: ['billing_create_records'],
            tool_style: 'prefixed',
            oauth_client_secret: 'never-copied',
          },
        }) as any
      );
      cmp.pickClone({ id: 4, name: 'warehouse', label: 'Warehouse' });
      fixture.detectChanges();

      expect([...cmp.selected]).toEqual(['billing']);
      expect(cmp.toolStyle).toBe('prefixed');
      expect(cmp.cloneApplied).toBe(true);
      expect(textOf(el())).toContain('Cloned from Warehouse');
      // Untouched access keeps the cloned curation verbatim.
      expect(cmp.compiledDisabledTools()).toEqual(
        new Set(['billing_create_records'])
      );

      // Explicit Read-only click recompiles from the selection instead.
      (byTestId('mcp-create-access-ro') as HTMLButtonElement).click();
      fixture.detectChanges();
      expect(cmp.compiledDisabledTools()).toEqual(
        new Set(readOnlyKeys(billingSvc))
      );

      // Credentials never travel: the payload carries only the compiled
      // exposure/curation fields.
      setName('cloned');
      (byTestId('mcp-create-submit') as HTMLButtonElement).click();
      const body = (servicesService.create as jest.Mock).mock.calls[0][0];
      expect(JSON.stringify(body)).not.toContain('never-copied');
      expect(body.resource[0].config.toolStyle).toBe('prefixed');
    });

    it("a null tool_style on the source clones as 'prefixed' (behavior-preserving), never 'merged'", () => {
      // Legacy sources with an unset column behave prefixed on the daemon;
      // the clone must emit the same tool-name shape as its source.
      servicesService.get.mockReturnValue(
        of({
          config: {
            exposed_services: ['billing'],
            disabled_tools: [],
            // no tool_style key at all
          },
        }) as any
      );
      cmp.pickClone({ id: 4, name: 'warehouse', label: 'Warehouse' });
      fixture.detectChanges();

      expect(cmp.toolStyle).toBe('prefixed');
      // And the prefixed consequence makes no "(shared)" claim.
      expect(consequence()).not.toContain('(shared)');

      setName('cloned_legacy');
      (byTestId('mcp-create-submit') as HTMLButtonElement).click();
      const body = (servicesService.create as jest.Mock).mock.calls[0][0];
      expect(body.resource[0].config.toolStyle).toBe('prefixed');
    });
  });
});
