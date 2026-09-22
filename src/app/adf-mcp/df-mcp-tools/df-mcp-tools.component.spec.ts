/**
 * Tools tab component tests: rows render only for exposed services, the
 * Needs-attention orphan group, fraction text, the system_mcp variant, and
 * the picker's consequence simulation math (driven through the dialog
 * component class directly).
 */
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OverlayContainer } from '@angular/cdk/overlay';
import { provideRouter } from '@angular/router';
import { of, Subject } from 'rxjs';
import { DfSnackbarService } from 'src/app/shared/services/df-snackbar.service';
import { SYSTEM_MCP_TOOLS } from 'src/app/adf-services/df-service-details/system-mcp-tools';
import { verbsFor } from '../mcp-catalog';
import { McpBackendService, effectiveTools } from '../mcp-effective';
import { McpEditorStore, McpServiceRecord } from '../mcp-store';
import {
  DfMcpPickerComponent,
  simulateExposeTotal,
} from '../df-mcp-picker/df-mcp-picker.component';
import { DfMcpAccessApiService } from '../mcp-access-api.service';
import { DfMcpToolsComponent } from './df-mcp-tools.component';

const svc = (
  name: string,
  kind: 'db' | 'file' = 'db',
  active = true
): McpBackendService => ({ name, label: name, kind, active });

function makeStore(
  rawConfig: Record<string, any>,
  services: McpBackendService[],
  type: 'mcp' | 'system_mcp' = 'mcp'
): McpEditorStore {
  const store = new McpEditorStore();
  const record: McpServiceRecord = {
    id: 1,
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

describe('DfMcpToolsComponent', () => {
  let fixture: ComponentFixture<DfMcpToolsComponent>;
  let component: DfMcpToolsComponent;

  const snackbar = { openSnackBar: jest.fn() };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DfMcpToolsComponent, NoopAnimationsModule],
      providers: [
        { provide: DfSnackbarService, useValue: snackbar },
        {
          provide: DfMcpAccessApiService,
          useValue: {
            access: () => of(null),
            roles: () => of([]),
            apps: () => of([]),
          },
        },
        provideRouter([]),
      ],
    }).compileComponents();
  });

  function render(store: McpEditorStore): void {
    fixture = TestBed.createComponent(DfMcpToolsComponent);
    component = fixture.componentInstance;
    component.store = store;
    component.loading = false;
    fixture.detectChanges();
  }

  function q(testid: string): HTMLElement | null {
    return fixture.nativeElement.querySelector(`[data-testid="${testid}"]`);
  }

  it('renders rows only for exposed services', () => {
    const store = makeStore(
      { exposed_services: ['crm', 's3'] },
      [svc('crm'), svc('hr'), svc('s3', 'file')]
    );
    render(store);
    expect(q('mcp-svc-row-crm')).toBeTruthy();
    expect(q('mcp-svc-row-s3')).toBeTruthy();
    expect(q('mcp-svc-row-hr')).toBeNull(); // not exposed → no row, no toggles
    expect(q('mcp-expose-btn')).toBeTruthy();
    expect(q('mcp-rail')).toBeTruthy();
  });

  it('renders the empty state when nothing is exposed', () => {
    const store = makeStore({}, [svc('crm')]);
    render(store);
    expect(fixture.nativeElement.textContent).toContain(
      'empty never means every service'
    );
    expect(q('mcp-svc-row-crm')).toBeNull();
  });

  it('shows orphaned entries in the Needs-attention group', () => {
    const store = makeStore(
      {
        exposed_services: ['crm', 'legacy_dw'],
        disabled_tools: ['legacy_dw_create_records', 'legacy_dw_get_tables'],
      },
      [svc('crm')]
    );
    render(store);
    const row = q('mcp-orphan-row-legacy_dw');
    expect(row).toBeTruthy();
    expect(row!.textContent).toContain(
      "'legacy_dw' no longer exists on this instance (renamed or deleted)."
    );
    expect(row!.textContent).toContain('Its 2 saved tool settings are kept.');
    // The orphan renders no ordinary service row.
    expect(q('mcp-svc-row-legacy_dw')).toBeNull();
  });

  it('shows the true fraction for a curated service', () => {
    const store = makeStore(
      {
        exposed_services: ['crm'],
        disabled_tools: [
          'crm_create_records',
          'crm_update_records',
          'crm_delete_records',
          'crm_call_stored_procedure',
          'crm_call_stored_function',
        ],
      },
      [svc('crm')]
    );
    render(store);
    expect(q('mcp-svc-fraction-crm')!.textContent).toContain('11 of 16');
    expect(q('mcp-svc-access-crm')!.textContent).toContain('Custom ◐ 11 of 16');
  });

  it('marks the inactive service and keeps it out of the rail total', () => {
    const store = makeStore(
      { exposed_services: ['crm', 'archive'] },
      [svc('crm'), svc('archive', 'db', false)]
    );
    render(store);
    // §8 canonical string.
    expect(q('mcp-svc-row-archive')!.textContent).toContain(
      'Service inactive — tools not served'
    );
    // 1 active db → 16 db + 5 global, no aggregators.
    expect(q('mcp-rail-total')!.textContent).toContain('21');
  });

  it('rail reports the derived read-only state', () => {
    const store = makeStore({ exposed_services: ['crm'] }, [svc('crm')]);
    render(store);
    expect(q('mcp-rail-readonly')!.textContent).toContain('write tools active');
    expect(q('mcp-make-readonly')).toBeTruthy();

    jest.spyOn(window, 'confirm').mockReturnValue(true);
    q('mcp-make-readonly')!.click();
    fixture.detectChanges();
    expect(store.effective().readOnly).toBe(true);
    expect(q('mcp-rail-readonly')!.textContent).toContain('Read-only ✓');
    (window.confirm as jest.Mock).mockRestore();
  });

  it('shows the filter strip and bulk checkboxes only above 8 exposed rows', () => {
    const few = makeStore({ exposed_services: ['crm'] }, [svc('crm')]);
    render(few);
    expect(q('mcp-filter-input')).toBeNull();

    const names = Array.from({ length: 9 }, (_, i) => `db${i}`);
    const many = makeStore(
      { exposed_services: names },
      names.map(n => svc(n))
    );
    render(many);
    expect(q('mcp-filter-input')).toBeTruthy();
    expect(q('mcp-filter-modified')).toBeTruthy();

    component.filterText = 'db3';
    fixture.detectChanges();
    expect(q('mcp-svc-row-db3')).toBeTruthy();
    expect(q('mcp-svc-row-db4')).toBeNull();

    component.filterText = '';
    component.toggleSelected('db1');
    fixture.detectChanges();
    expect(q('mcp-bulk-bar')!.textContent).toContain('1 selected');
  });

  it('renders the global section with aggregators only at 2+ databases', () => {
    const one = makeStore({ exposed_services: ['crm'] }, [svc('crm'), svc('hr')]);
    render(one);
    expect(q('mcp-global-section')!.textContent).toContain('5 of 5');

    const two = makeStore(
      { exposed_services: ['crm', 'hr'] },
      [svc('crm'), svc('hr')]
    );
    render(two);
    expect(q('mcp-global-section')!.textContent).toContain('11 of 11');
  });

  it('renders custom tools with enable toggles feeding the math', () => {
    const store = makeStore(
      {
        exposed_services: [],
        custom_tools: [
          { name: 'env_info', toolType: 'api', httpMethod: 'GET', url: 'https://x', enabled: true },
        ],
      },
      []
    );
    render(store);
    expect(q('mcp-custom-section')!.textContent).toContain('env_info');
    expect(q('mcp-custom-add')).toBeTruthy();
    expect(store.effective().customTools).toBe(1);
    component.setCustomEnabled(store.cfg.customTools[0], false);
    expect(store.effective().customTools).toBe(0);
    expect(store.dirty()).toBe(true);
  });

  describe('system_mcp variant', () => {
    it('renders the fixed catalog as Read/Modify groups without a picker', () => {
      const store = makeStore({}, [], 'system_mcp');
      render(store);
      expect(q('mcp-expose-btn')).toBeNull();
      expect(q('mcp-custom-section')).toBeNull();
      expect(fixture.nativeElement.textContent).toContain('Read system');
      expect(fixture.nativeElement.textContent).toContain('Modify system');
      expect(q('mcp-rail-total')!.textContent).toContain(
        String(SYSTEM_MCP_TOOLS.length)
      );
      // Read + modify partition the whole catalog.
      expect(
        component.systemGroups[0].tools.length +
          component.systemGroups[1].tools.length
      ).toBe(SYSTEM_MCP_TOOLS.length);
      expect(
        component.systemGroups[0].tools.every(t =>
          /^(get_|list_)/.test(t.name)
        )
      ).toBe(true);
    });

    it('bare-name disables drive the rail count and read-only state', () => {
      const store = makeStore(
        { disabled_tools: SYSTEM_MCP_TOOLS.filter(t => !/^(get_|list_)/.test(t.name)).map(t => t.name) },
        [],
        'system_mcp'
      );
      render(store);
      expect(component.sysModifyOn()).toBe(0);
      expect(q('mcp-rail-readonly')!.textContent).toContain('Read-only ✓');
    });
  });

  describe('identity-stable rows and menus (trackBy/memoization)', () => {
    it('returns the same array instances until the store version changes', () => {
      const store = makeStore(
        { exposed_services: ['crm', 's3'] },
        [svc('crm'), svc('s3', 'file')]
      );
      render(store);
      const rows = component.visibleRows();
      fixture.detectChanges();
      expect(component.visibleRows()).toBe(rows);
      expect(component.orphanRows()).toBe(component.orphanRows());
      expect(component.globalToolList()).toBe(component.globalToolList());
      // A real edit bumps the store version and recomputes.
      store.setTool('crm', 'create_records', false);
      expect(component.visibleRows()).not.toBe(rows);
      expect(component.visibleRows()).toBe(component.visibleRows());
    });

    it('keeps the access-chip menu open across change-detection passes', () => {
      const store = makeStore({ exposed_services: ['crm'] }, [svc('crm')]);
      render(store);
      (q('mcp-svc-access-crm') as HTMLButtonElement).click();
      fixture.detectChanges();
      // The reproduced failure: the pass after the opening click used to tear
      // the row (and its open menu) down. Run two passes and assert survival.
      fixture.detectChanges();
      const overlay = TestBed.inject(OverlayContainer).getContainerElement();
      expect(overlay.querySelectorAll('.mat-mdc-menu-panel').length).toBe(1);
      expect(overlay.textContent).toContain('Choose tools…');
    });

    it('offers no redundant Reset-to-all in the row kebab', () => {
      const store = makeStore({ exposed_services: ['crm'] }, [svc('crm')]);
      render(store);
      (q('mcp-svc-menu-crm') as HTMLButtonElement).click();
      fixture.detectChanges();
      const overlay = TestBed.inject(OverlayContainer).getContainerElement();
      const menu = overlay.querySelector('.mat-mdc-menu-panel')!;
      expect(menu.textContent).toContain('Full access');
      expect(menu.textContent).not.toContain('Reset to all');
    });
  });

  describe('access chip semantics', () => {
    it('green Read-only, neutral Full, indigo Custom, warn zero', () => {
      const store = makeStore({ exposed_services: ['crm'] }, [svc('crm')]);
      render(store);
      const chip = () => q('mcp-svc-access-crm')!;
      // Full (most permissive) is neutral — never green.
      expect(chip().textContent).toContain('Full');
      expect(chip().classList.contains('good')).toBe(false);
      expect(chip().classList.contains('primary')).toBe(false);
      expect(chip().classList.contains('warn')).toBe(false);
      // Read-only is the safe state — green.
      store.setServiceReadOnly(store.backendServices[0]);
      fixture.detectChanges();
      expect(chip().textContent).toContain('Read-only');
      expect(chip().classList.contains('good')).toBe(true);
      // Custom ◐ is indigo.
      store.setTool('crm', 'get_table_data', false);
      fixture.detectChanges();
      expect(chip().textContent).toContain('Custom ◐');
      expect(chip().classList.contains('primary')).toBe(true);
      expect(chip().classList.contains('good')).toBe(false);
      // 0 of m is warn.
      for (const v of verbsFor('db')) store.setTool('crm', v.verb, false);
      fixture.detectChanges();
      expect(chip().textContent).toContain('0 of 16 ⚠');
      expect(chip().classList.contains('warn')).toBe(true);
    });
  });

  describe('capability group rows', () => {
    it('state the count once, in the trailing x-of-y-on', () => {
      const store = makeStore(
        { exposed_services: ['crm'], disabled_tools: ['crm_aggregate_data'] },
        [svc('crm')]
      );
      render(store);
      component.toggleExpand('crm');
      fixture.detectChanges();
      const row = q('mcp-svc-row-crm')!;
      expect(row.textContent).toContain('Read data');
      expect(row.textContent).toContain('1 of 2 on');
      expect(row.textContent).not.toContain('(1/2)');
    });
  });

  describe('bulk bar Copy curation from…', () => {
    it('copies the source pattern to every selected database only', () => {
      const names = Array.from({ length: 9 }, (_, i) => `db${i}`);
      const store = makeStore(
        {
          exposed_services: names,
          disabled_tools: ['db0_create_records', 'db0_delete_records'],
        },
        names.map(n => svc(n))
      );
      render(store);
      component.toggleSelected('db1');
      component.toggleSelected('db2');
      fixture.detectChanges();
      expect(q('mcp-bulk-copyfrom')).toBeTruthy();
      component.bulkCopyFrom(store.backendServices[0]);
      expect(store.isToolEnabled('db1', 'create_records')).toBe(false);
      expect(store.isToolEnabled('db1', 'delete_records')).toBe(false);
      expect(store.isToolEnabled('db2', 'create_records')).toBe(false);
      // Unselected databases are untouched.
      expect(store.isToolEnabled('db3', 'create_records')).toBe(true);
      expect(snackbar.openSnackBar).toHaveBeenCalledWith(
        "Copied db0's tool selection to 2 selected databases.",
        'success'
      );
    });
  });

  describe('rail affordances', () => {
    it('Copy tool list exports the served names from the effective math', () => {
      const store = makeStore(
        {
          exposed_services: ['crm', 's3'],
          disabled_tools: ['crm_create_records', 'search'],
        },
        [svc('crm'), svc('s3', 'file')]
      );
      render(store);
      const names = component.servedToolNames();
      expect(names.length).toBe(component.railTotal());
      expect(names).toContain('crm_get_tables');
      expect(names).toContain('s3_list_files');
      expect(names).not.toContain('crm_create_records');
      expect(names).not.toContain('search');
      const writeText = jest.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText },
        configurable: true,
      });
      q('mcp-copy-toollist')!.click();
      expect(writeText).toHaveBeenCalledWith(names.join('\n'));
      expect(snackbar.openSnackBar).toHaveBeenCalledWith(
        `Copied ${names.length} tool names.`,
        'success'
      );
    });

    it('shows the Access section (not a Manage roles link) and explains lazy serving under the on token', () => {
      const store = makeStore(
        { exposed_services: ['crm'], lazy_mode: 'on' },
        [svc('crm')]
      );
      // Lazy token contract: stored 'on' engages; legacy 'always' normalizes.
      expect(store.cfg.lazyMode).toBe('on');
      const legacy = makeStore({ lazy_mode: 'always' }, []);
      expect(legacy.cfg.lazyMode).toBe('on');
      render(store);
      expect(q('mcp-manage-roles')).toBeNull();
      expect(q('mcp-access')).toBeTruthy();
      expect(q('mcp-access-create')).toBeTruthy();
      expect(component.servingLine()).toContain(
        'Delivered on demand (always on)'
      );
      expect(q('mcp-lazy-why')).toBeTruthy();
    });

    it('rail file line carries the × multiplier only when files are full', () => {
      const store = makeStore({ exposed_services: ['s3'] }, [svc('s3', 'file')]);
      render(store);
      expect(component.railBreakdown().join(' ')).toContain(
        '6 file (1 service × 6)'
      );
      store.setTool('s3', 'delete_file', false);
      expect(component.railBreakdown().join(' ')).toContain('5 file (1 service)');
    });

    it('Make read-only confirm names write-capable customs and turns them off', () => {
      const store = makeStore(
        {
          exposed_services: ['crm'],
          custom_tools: [
            {
              name: 'post_hook',
              toolType: 'api',
              httpMethod: 'POST',
              url: 'https://x',
              enabled: true,
            },
          ],
        },
        [svc('crm')]
      );
      render(store);
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
      component.makeReadOnly();
      expect(confirmSpy).toHaveBeenCalledWith(
        expect.stringContaining('and 1 custom tool?')
      );
      expect(store.cfg.customTools[0].enabled).toBe(false);
      expect(store.effective().readOnly).toBe(true);
      confirmSpy.mockRestore();
    });
  });

  describe('canonical strings', () => {
    it('remove snackbar keeps the its-tool-selection wording', () => {
      const store = makeStore({ exposed_services: ['crm'] }, [svc('crm')]);
      render(store);
      jest
        .spyOn(component['dialog'], 'open')
        .mockReturnValue({ afterClosed: () => of({ clear: false }) } as any);
      component.removeServices(['crm']);
      expect(snackbar.openSnackBar).toHaveBeenCalledWith(
        'Removed crm — its tool selection is kept and restores if you expose it again.',
        'success'
      );
    });
  });
});

describe('DfMcpPickerComponent — consequence simulation', () => {
  const dialogRef = { close: jest.fn() } as any;

  function picker(store: McpEditorStore): DfMcpPickerComponent {
    return new DfMcpPickerComponent(dialogRef, { store });
  }

  it('lists only not-yet-exposed services', () => {
    const store = makeStore(
      { exposed_services: ['crm'] },
      [svc('crm'), svc('hr'), svc('s3', 'file')]
    );
    const p = picker(store);
    expect(p.candidates().map(s => s.name)).toEqual(['hr', 's3']);
    expect(p.dbCandidates().map(s => s.name)).toEqual(['hr']);
    expect(p.fileCandidates().map(s => s.name)).toEqual(['s3']);
  });

  it('computes the read-only consequence by simulation', () => {
    const store = makeStore(
      { exposed_services: ['crm'] },
      [svc('crm'), svc('hr')]
    );
    const old = effectiveTools(store.cfg, store.backendServices).total; // 16+5
    const p = picker(store);
    p.toggle('hr');
    // read-only hr: +9 read/schema verbs, aggregators unlock (+6).
    const expected = old + 9 + 6;
    expect(simulateExposeTotal(store, ['hr'], 'ro', false)).toBe(expected);
    expect(p.consequenceText()).toBe(
      `1 selected · read-only → server will serve ${expected} tools (was ${old})`
    );
    // The dialog never mutates the store.
    expect(store.cfg.exposedServices).toEqual(['crm']);
    expect(store.cfg.disabledTools.size).toBe(0);
  });

  it('read & write serves the full verb set', () => {
    const store = makeStore({ exposed_services: [] }, [svc('hr')]);
    const p = picker(store);
    p.toggle('hr');
    p.access = 'rw';
    p.accessTouched = true;
    // 16 db + 5 global (single db → no aggregators).
    expect(p.consequenceText()).toContain('server will serve 21 tools (was 5)');
  });

  it('dormant curation is kept on the untouched default, overridden by an explicit choice', () => {
    const raw = {
      exposed_services: [],
      disabled_tools: ['hr_get_tables', 'hr_get_table_data'],
    };
    const store = makeStore(raw, [svc('hr')]);
    // Untouched default → dormant curation re-applies: 14 + 5 globals.
    expect(simulateExposeTotal(store, ['hr'], 'ro', false)).toBe(19);
    // Explicit read-only overrides it: 9 read/schema + 5 globals.
    expect(simulateExposeTotal(store, ['hr'], 'ro', true)).toBe(14);
    // Explicit read & write overrides it the other way: 16 + 5.
    expect(simulateExposeTotal(store, ['hr'], 'rw', true)).toBe(21);
  });

  it('confirm returns the selection without touching the store', () => {
    const store = makeStore({}, [svc('hr')]);
    const p = picker(store);
    p.toggle('hr');
    p.confirm();
    expect(dialogRef.close).toHaveBeenCalledWith({
      names: ['hr'],
      access: 'ro',
      accessTouched: false,
    });
    expect(store.cfg.exposedServices).toEqual([]);
  });
});

describe('dialog templates render', () => {
  it('picker template renders groups, curation notes and the consequence line', async () => {
    const { MatDialogRef, MAT_DIALOG_DATA } = await import('@angular/material/dialog');
    const store = makeStore(
      { exposed_services: [], disabled_tools: ['hr_get_tables'] },
      [svc('crm'), svc('hr'), svc('s3', 'file')]
    );
    await TestBed.configureTestingModule({
      imports: [DfMcpPickerComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: { close: jest.fn() } },
        { provide: MAT_DIALOG_DATA, useValue: { store } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(DfMcpPickerComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('[data-testid="mcp-picker-dialog"]')).toBeTruthy();
    expect(el.querySelector('[data-testid="mcp-picker-search"]')).toBeTruthy();
    expect(el.querySelector('[data-testid="mcp-picker-access-ro"]')).toBeTruthy();
    expect(el.textContent).toContain('Databases (2)');
    expect(el.textContent).toContain('File storage (1)');
    expect(el.textContent).toContain('saved curation: 1 tools off');
    expect(
      el.querySelector('[data-testid="mcp-picker-consequence"]')!.textContent
    ).toContain('0 selected');
    const confirm = el.querySelector(
      '[data-testid="mcp-picker-confirm"]'
    ) as HTMLButtonElement;
    expect(confirm.disabled).toBe(true);
  });

  it('preview template renders served groups and the named exclusions', async () => {
    const { MatDialogRef, MAT_DIALOG_DATA } = await import('@angular/material/dialog');
    const { DfMcpPreviewComponent } = await import(
      '../df-mcp-preview/df-mcp-preview.component'
    );
    const store = makeStore(
      {
        exposed_services: ['crm', 'archive', 'legacy_dw'],
        disabled_tools: [
          'crm_create_records',
          'crm_update_records',
          'crm_delete_records',
        ],
        tool_style: 'merged',
      },
      [svc('crm'), svc('hr'), svc('archive', 'db', false)]
    );
    await TestBed.configureTestingModule({
      imports: [DfMcpPreviewComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: { close: jest.fn() } },
        { provide: MAT_DIALOG_DATA, useValue: { store } },
        { provide: DfSnackbarService, useValue: { openSnackBar: jest.fn() } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(DfMcpPreviewComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('[data-testid="mcp-preview-drawer"]')).toBeTruthy();
    const excluded = el.querySelector('[data-testid="mcp-preview-excluded"]')!;
    expect(excluded.textContent).toContain('not exposed'); // hr
    expect(excluded.textContent).toContain('service inactive'); // archive
    expect(excluded.textContent).toContain('no service with this name exists'); // legacy_dw
    expect(excluded.textContent).toContain('turned off by you'); // crm write data
    expect(excluded.textContent).toContain(
      'turned off in every exposed database'
    ); // write verbs off everywhere (single active db)
    expect(excluded.textContent).toContain(
      'served only with two or more databases'
    ); // aggregators at 1 db
    // Merged verbs carry the service enum line.
    expect(el.textContent).toContain('service: crm (1 of 1)');
    // Footer math.
    const total = store.effective().total;
    expect(el.textContent).toContain(`${total} tools`);
  });

  it('remove, rename and custom-tool dialogs render and validate', async () => {
    const { MatDialogRef, MAT_DIALOG_DATA } = await import('@angular/material/dialog');
    const { DfMcpRemoveDialogComponent } = await import('./df-mcp-remove-dialog.component');
    const { DfMcpRenameDialogComponent } = await import('./df-mcp-rename-dialog.component');
    const { DfMcpCustomToolDialogComponent, emittedNameSet } = await import(
      './df-mcp-custom-tool-dialog.component'
    );
    const store = makeStore(
      { exposed_services: ['crm'], disabled_tools: ['legacy_dw_get_tables'] },
      [svc('crm'), svc('hr')]
    );

    // Remove dialog — default-safe keep-curation choice.
    TestBed.configureTestingModule({
      imports: [DfMcpRemoveDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: { close: jest.fn() } },
        { provide: MAT_DIALOG_DATA, useValue: { names: ['crm'] } },
      ],
    });
    const removeFx = TestBed.createComponent(DfMcpRemoveDialogComponent);
    removeFx.detectChanges();
    expect(removeFx.nativeElement.textContent).toContain(
      'Remove crm from this server?'
    );
    expect(removeFx.nativeElement.textContent).toContain(
      'Keep its tool curation (recommended)'
    );
    expect(removeFx.componentInstance.clear).toBe(false);
    TestBed.resetTestingModule();

    // Rename dialog — successor list + key-rewrite preview.
    TestBed.configureTestingModule({
      imports: [DfMcpRenameDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: { close: jest.fn() } },
        { provide: MAT_DIALOG_DATA, useValue: { store, oldName: 'legacy_dw' } },
      ],
    });
    const renameFx = TestBed.createComponent(DfMcpRenameDialogComponent);
    renameFx.detectChanges();
    expect(renameFx.componentInstance.candidates().map(s => s.name)).toEqual(['hr']);
    renameFx.componentInstance.newName = 'hr';
    renameFx.detectChanges();
    expect(renameFx.nativeElement.textContent).toContain(
      'Point this entry at hr and rename its 1 saved tool settings (legacy_dw_* → hr_*)?'
    );
    TestBed.resetTestingModule();

    // Custom-tool dialog — collision + pattern validation.
    // Exposed crm in prefixed style emits crm_get_tables; that name collides.
    expect(emittedNameSet(store).has('crm_get_tables')).toBe(true);
    const close = jest.fn();
    // Opened with disableClose: Esc/backdrop reach the dialog via these streams.
    const keydown = new Subject<KeyboardEvent>();
    const backdrop = new Subject<MouseEvent>();
    TestBed.configureTestingModule({
      imports: [DfMcpCustomToolDialogComponent, NoopAnimationsModule],
      providers: [
        {
          provide: MatDialogRef,
          useValue: {
            close,
            keydownEvents: () => keydown,
            backdropClick: () => backdrop,
          },
        },
        { provide: MAT_DIALOG_DATA, useValue: { store } },
      ],
    });
    const ctFx = TestBed.createComponent(DfMcpCustomToolDialogComponent);
    ctFx.detectChanges();
    const ct = ctFx.componentInstance;
    ct.form.patchValue({ name: 'crm_get_tables', url: 'https://x' });
    ct.save();
    expect(ct.form.controls['name'].hasError('collision')).toBe(true);
    expect(close).not.toHaveBeenCalled();
    ct.form.patchValue({ name: 'bad name!' });
    ct.save();
    expect(ct.form.controls['name'].hasError('pattern')).toBe(true);
    ct.form.patchValue({ name: 'env_info', parameters: '{not json' });
    ct.save();
    expect(ct.form.controls['parameters'].hasError('json')).toBe(true);
    ct.form.patchValue({ parameters: '{"a": 1}' });
    ct.save();
    expect(close).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'env_info',
        toolType: 'api',
        url: 'https://x',
        parameters: { a: 1 },
        enabled: true,
      })
    );

    // Esc/backdrop dismissal (dialog opens with disableClose): a dirty form
    // asks first; declining keeps it open, accepting closes it.
    close.mockClear();
    ct.form.markAsDirty();
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);
    keydown.next(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(close).not.toHaveBeenCalled();
    confirmSpy.mockReturnValue(true);
    backdrop.next(new MouseEvent('click'));
    expect(close).toHaveBeenCalledWith();
    // A pristine form closes without asking.
    close.mockClear();
    confirmSpy.mockClear();
    ct.form.markAsPristine();
    keydown.next(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(confirmSpy).not.toHaveBeenCalled();
    expect(close).toHaveBeenCalledWith();
    confirmSpy.mockRestore();
  });

  it('preview reflects the on token and keeps group identity stable', async () => {
    const { MatDialogRef, MAT_DIALOG_DATA } = await import('@angular/material/dialog');
    const { DfMcpPreviewComponent } = await import(
      '../df-mcp-preview/df-mcp-preview.component'
    );
    const store = makeStore(
      { exposed_services: ['crm'], lazy_mode: 'on' },
      [svc('crm')]
    );
    await TestBed.configureTestingModule({
      imports: [DfMcpPreviewComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: { close: jest.fn() } },
        { provide: MAT_DIALOG_DATA, useValue: { store } },
        { provide: DfSnackbarService, useValue: { openSnackBar: jest.fn() } },
      ],
    }).compileComponents();
    const fx = TestBed.createComponent(DfMcpPreviewComponent);
    fx.detectChanges();
    const c = fx.componentInstance;
    expect(c.lazyEngaged).toBe(true);
    expect(c.view).toBe('first');
    expect(c.lazyLabel()).toBe('Lazy loading: engaged (always on)');
    // Identity-stable groups feed trackBy'd ngFors.
    expect(c.visibleGroups()).toBe(c.visibleGroups());
    expect(fx.nativeElement.textContent).toContain(
      'First response — discovery tools (4)'
    );
    // One-line polish: the description carries its full text in title.
    c.view = 'full';
    fx.detectChanges();
    const desc = fx.nativeElement.querySelector(
      '.mcp-preview-desc'
    ) as HTMLElement;
    expect(desc.getAttribute('title')).toBe(desc.textContent!.trim());
  });
});
