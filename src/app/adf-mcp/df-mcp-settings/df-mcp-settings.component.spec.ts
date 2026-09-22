import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import {
  CACHE_SERVICE_TOKEN,
  SERVICES_SERVICE_TOKEN,
  SERVICE_TYPE_SERVICE_TOKEN,
} from 'src/app/shared/constants/tokens';
import { DfSnackbarService } from 'src/app/shared/services/df-snackbar.service';
import { McpEditorStore } from '../mcp-store';
import {
  DfMcpHousekeepingDialogComponent,
  McpHousekeepingDialogData,
} from './df-mcp-housekeeping-dialog.component';
import { DfMcpSettingsComponent } from './df-mcp-settings.component';

function makeStore(
  overrides: {
    toolStyle?: 'merged' | 'prefixed' | null;
    disabled?: string[];
    exposed?: string[];
    lazy?: any;
    allowKey?: boolean;
    type?: 'mcp' | 'system_mcp';
  } = {}
): McpEditorStore {
  const store = new McpEditorStore();
  const config: Record<string, any> = {
    exposed_services: overrides.exposed ?? ['billing'],
    disabled_tools: overrides.disabled ?? [],
    lazy_mode: overrides.lazy ?? 'auto',
    allow_api_key_auth: overrides.allowKey ?? false,
    oauth_client_id: 'client-id-123',
    oauth_client_secret: 'super-secret-value',
    redirect_uris: ['https://claude.ai/api/mcp/auth_callback'],
    registered_redirect_uris: ['https://client.example/registered-cb'],
    scope_tools: true,
  };
  if (overrides.toolStyle !== undefined && overrides.toolStyle !== null) {
    config['tool_style'] = overrides.toolStyle;
  }
  store.init(
    {
      id: 7,
      name: 'warehouse',
      label: 'Warehouse Analytics',
      description: '',
      isActive: true,
      type: overrides.type ?? 'mcp',
      raw: {},
    },
    config
  );
  store.backendServices = [
    { name: 'billing', label: 'Billing', kind: 'db', active: true },
    { name: 'hr', label: 'HR', kind: 'db', active: true },
  ];
  store.backendLoaded = true;
  return store;
}

describe('DfMcpSettingsComponent', () => {
  let fixture: ComponentFixture<DfMcpSettingsComponent>;
  const snackbar = { openSnackBar: jest.fn() };
  const listResponse = { resource: [] };
  const serviceTypeService = {
    getAll: jest.fn(() => of(listResponse)),
  };
  const servicesService = {
    getAll: jest.fn(() => of(listResponse)),
  };
  const cacheService = {
    delete: jest.fn(() => of({})),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    serviceTypeService.getAll.mockReturnValue(of(listResponse));
    servicesService.getAll.mockReturnValue(of(listResponse));
    cacheService.delete.mockReturnValue(of({}));
    await TestBed.configureTestingModule({
      imports: [DfMcpSettingsComponent],
      providers: [
        provideNoopAnimations(),
        { provide: DfSnackbarService, useValue: snackbar },
        { provide: SERVICE_TYPE_SERVICE_TOKEN, useValue: serviceTypeService },
        { provide: SERVICES_SERVICE_TOKEN, useValue: servicesService },
        { provide: CACHE_SERVICE_TOKEN, useValue: cacheService },
      ],
    }).compileComponents();
  });

  function create(store: McpEditorStore): DfMcpSettingsComponent {
    fixture = TestBed.createComponent(DfMcpSettingsComponent);
    fixture.componentInstance.store = store;
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function byTestId(id: string): HTMLElement | null {
    return el().querySelector(`[data-testid="${id}"]`);
  }

  /** textContent with template line breaks collapsed to single spaces. */
  function textOf(elm: HTMLElement | null): string {
    return (elm?.textContent ?? '').replace(/\s+/g, ' ');
  }

  describe('rename warning', () => {
    it('appears when the draft name differs and disappears when it matches again', () => {
      const store = makeStore();
      create(store);
      expect(byTestId('mcp-rename-warning')).toBeNull();

      const input = byTestId('mcp-set-name') as HTMLInputElement;
      input.value = 'warehouse-v2';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(store.draftName).toBe('warehouse-v2');
      const warning = byTestId('mcp-rename-warning');
      expect(warning).toBeTruthy();
      expect(textOf(warning)).toContain(
        'Renaming changes your endpoint URL to …/mcp/warehouse-v2. ' +
          'Connected clients will break until they update.'
      );

      input.value = 'warehouse';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      expect(byTestId('mcp-rename-warning')).toBeNull();
    });
  });

  describe('tool naming', () => {
    function radioInput(testId: string): HTMLInputElement {
      return byTestId(testId)!.querySelector(
        'input[type="radio"]'
      ) as HTMLInputElement;
    }

    it('renders a null stored value as prefixed-selected with the server-default note', () => {
      create(makeStore({ toolStyle: null }));
      expect(radioInput('mcp-toolstyle-prefixed').checked).toBe(true);
      expect(radioInput('mcp-toolstyle-merged').checked).toBe(false);
      expect(byTestId('mcp-toolstyle-prefixed')!.textContent).toContain(
        'Server default (per-service names).'
      );
      // Nothing was rewritten on render (migration safety).
      expect(fixture.componentInstance.store.cfg.toolStyle).toBeNull();
    });

    it('radio changes write explicit values, never null', () => {
      const store = makeStore({ toolStyle: null });
      create(store);

      radioInput('mcp-toolstyle-merged').click();
      fixture.detectChanges();
      expect(store.cfg.toolStyle).toBe('merged');
      expect(byTestId('mcp-toolstyle-merged')!.textContent).toContain(
        'Matches the recommended default.'
      );

      radioInput('mcp-toolstyle-prefixed').click();
      fixture.detectChanges();
      expect(store.cfg.toolStyle).toBe('prefixed');
      expect(store.cfg.toolStyle).not.toBeNull();
      // The explicit value carries no server-default note.
      expect(byTestId('mcp-toolstyle-prefixed')!.textContent).not.toContain(
        'Server default'
      );
    });

    it('shows the style-change note only while the draft differs from saved', () => {
      const store = makeStore({ toolStyle: 'merged' });
      create(store);
      expect(byTestId('mcp-toolstyle-note')).toBeNull();

      radioInput('mcp-toolstyle-prefixed').click();
      fixture.detectChanges();
      expect(byTestId('mcp-toolstyle-note')!.textContent).toContain(
        'Style changes rename emitted tools — preview before saving.'
      );

      store.discard();
      fixture.detectChanges();
      expect(byTestId('mcp-toolstyle-note')).toBeNull();
    });

    it('renders no tool-naming control for system_mcp but keeps catalog delivery', () => {
      create(makeStore({ type: 'system_mcp' }));
      expect(byTestId('mcp-toolstyle-merged')).toBeNull();
      expect(byTestId('mcp-toolstyle-prefixed')).toBeNull();
      expect(byTestId('mcp-lazy-select')).toBeTruthy();
      expect(byTestId('mcp-scope-line')).toBeTruthy();
    });
  });

  describe('API-key toggle', () => {
    it('mutates cfg.allowApiKeyAuth and marks the store dirty', () => {
      const store = makeStore({ allowKey: false });
      create(store);
      expect(store.dirty()).toBe(false);

      const toggle = byTestId('mcp-apikey-toggle')!.querySelector(
        'button[role="switch"], input[type="checkbox"]'
      ) as HTMLElement;
      toggle.click();
      fixture.detectChanges();

      expect(store.cfg.allowApiKeyAuth).toBe(true);
      expect(store.dirty()).toBe(true);
    });
  });

  describe('catalog delivery (auto|on|off contract)', () => {
    it('displays contract tokens as themselves', () => {
      const cmp = create(makeStore({ lazy: 'on' }));
      expect(cmp.lazyValue).toBe('on');
      cmp.store.cfg.lazyMode = 'off' as any;
      expect(cmp.lazyValue).toBe('off');
      cmp.store.cfg.lazyMode = 'auto';
      expect(cmp.lazyValue).toBe('auto');
    });

    it("coerces legacy stored values on read: 'always'/true → on, 'never'/false → off", () => {
      const cmp = create(makeStore({ lazy: 'always' }));
      expect(cmp.lazyValue).toBe('on');
      cmp.store.cfg.lazyMode = 'never' as any;
      expect(cmp.lazyValue).toBe('off');
      cmp.store.cfg.lazyMode = true as any;
      expect(cmp.lazyValue).toBe('on');
      cmp.store.cfg.lazyMode = false as any;
      expect(cmp.lazyValue).toBe('off');
    });

    it("writes only contract tokens into cfg.lazyMode — never 'always'/'never'", () => {
      const store = makeStore();
      const cmp = create(store);
      cmp.setLazy('on');
      expect(store.cfg.lazyMode).toBe('on');
      expect(store.dirty()).toBe(true);
      cmp.setLazy('off');
      expect(store.cfg.lazyMode).toBe('off');
    });

    it("the select's option values are the contract tokens with the unchanged labels", async () => {
      create(makeStore());
      const trigger = byTestId('mcp-lazy-select') as HTMLElement;
      trigger.click();
      fixture.detectChanges();
      await fixture.whenStable();
      const options = Array.from(document.querySelectorAll('mat-option')).map(
        o => ({
          value: o.getAttribute('ng-reflect-value'),
          label: (o.textContent ?? '').trim(),
        })
      );
      expect(options).toEqual([
        { value: 'auto', label: 'Auto — recommended' },
        { value: 'on', label: 'Always on-demand' },
        { value: 'off', label: 'Never' },
      ]);
    });
  });

  describe('housekeeping', () => {
    it('shows no review button and the all-clear line at 0 orphans', () => {
      create(makeStore({ disabled: ['billing_delete_records'] }));
      expect(byTestId('mcp-housekeeping-review')).toBeNull();
      expect(byTestId('mcp-housekeeping')!.textContent).toContain(
        'No orphaned tool settings.'
      );
    });

    it('counts orphans and the dialog delete removes exactly the checked keys', () => {
      const store = makeStore({
        disabled: [
          'ghost_get_tables',
          'ghost_create_records',
          'billing_delete_records',
        ],
      });
      const cmp = create(store);
      const card = textOf(byTestId('mcp-housekeeping'));
      expect(card).toContain(
        '2 saved tool settings reference services that no longer exist.'
      );
      expect(card).toContain(
        'Nothing is removed automatically — review before deleting.'
      );

      // The dialog returns only the keys left checked. Spy on the
      // component's own MatDialog (MatDialogModule is component-scoped).
      const dialog: MatDialog = (cmp as any).dialog;
      const openSpy = jest.spyOn(dialog, 'open').mockReturnValue({
        afterClosed: () => of(['ghost_get_tables']),
      } as any);

      (byTestId('mcp-housekeeping-review') as HTMLButtonElement).click();
      fixture.detectChanges();

      expect(openSpy).toHaveBeenCalledWith(
        DfMcpHousekeepingDialogComponent,
        expect.objectContaining({
          data: { keys: ['ghost_get_tables', 'ghost_create_records'] },
        })
      );
      // Exactly the checked key is gone; the unchecked orphan and the
      // owned key survive.
      expect(store.cfg.disabledTools.has('ghost_get_tables')).toBe(false);
      expect(store.cfg.disabledTools.has('ghost_create_records')).toBe(true);
      expect(store.cfg.disabledTools.has('billing_delete_records')).toBe(true);
      expect(store.dirty()).toBe(true);
      expect(snackbar.openSnackBar).toHaveBeenCalledWith(
        'Removed 1 saved tool setting — save to apply.',
        'success'
      );
      expect(cmp.orphanCount).toBe(1);
    });

    it('deletes nothing when the dialog is cancelled', () => {
      const store = makeStore({ disabled: ['ghost_get_tables'] });
      const cmp = create(store);
      jest
        .spyOn((cmp as any).dialog as MatDialog, 'open')
        .mockReturnValue({ afterClosed: () => of(undefined) } as any);
      (byTestId('mcp-housekeeping-review') as HTMLButtonElement).click();
      expect(store.cfg.disabledTools.has('ghost_get_tables')).toBe(true);
      expect(store.dirty()).toBe(false);
    });

    it('system_mcp: disabled System API tool names are never reported as orphans', () => {
      // The model excludes SYSTEM_MCP_TOOLS names for system_mcp stores;
      // this pins the settings card to that behavior.
      const store = makeStore({
        type: 'system_mcp',
        disabled: ['create_service', 'update_role', 'call_system_api'],
      });
      const cmp = create(store);
      expect(store.orphans()).toEqual([]);
      expect(cmp.orphanCount).toBe(0);
      expect(byTestId('mcp-housekeeping-review')).toBeNull();
      expect(byTestId('mcp-housekeeping')!.textContent).toContain(
        'No orphaned tool settings.'
      );
    });

    it('flush cache calls the cache API with the service name and toasts', () => {
      create(makeStore());
      (byTestId('mcp-flush-cache') as HTMLButtonElement).click();
      expect(cacheService.delete).toHaveBeenCalledWith('warehouse');
      expect(snackbar.openSnackBar).toHaveBeenCalledWith(
        'Cache flushed.',
        'success'
      );
    });
  });

  describe('full configuration', () => {
    it('masks the client secret and never prints its value', () => {
      create(makeStore());
      const pre = byTestId('mcp-fullconfig')!;
      expect(pre.textContent).toContain('••••••••');
      expect(pre.textContent).not.toContain('super-secret-value');
      // The rest of the stored config is the real serialization.
      expect(pre.textContent).toContain('"exposedServices"');
      expect(pre.textContent).toContain('"billing"');
      expect(pre.textContent).toContain('"scope_tools"');
      // The draft secret itself was not overwritten by the mask.
      expect(fixture.componentInstance.store.cfg.oauthClientSecret).toBe(
        'super-secret-value'
      );
    });

    it('shows the read-only registeredRedirectUris fact, kept apart from redirectUris', () => {
      create(makeStore());
      const json = JSON.parse(byTestId('mcp-fullconfig')!.textContent ?? '{}');
      expect(json.registeredRedirectUris).toEqual([
        'https://client.example/registered-cb',
      ]);
      // Never folded into the admin-managed list.
      expect(json.redirectUris).toEqual([
        'https://claude.ai/api/mcp/auth_callback',
      ]);
    });
  });

  describe('regenerate secret', () => {
    it('confirms and writes 64 hex chars into the draft', () => {
      const store = makeStore();
      create(store);
      jest.spyOn(window, 'confirm').mockReturnValue(true);
      (byTestId('mcp-regenerate-secret') as HTMLButtonElement).click();
      expect(window.confirm).toHaveBeenCalledWith(
        'Clients using the old secret will stop connecting. Regenerate?'
      );
      expect(store.cfg.oauthClientSecret).toMatch(/^[0-9a-f]{64}$/);
      expect(store.dirty()).toBe(true);
    });

    it('does nothing when declined', () => {
      const store = makeStore();
      create(store);
      jest.spyOn(window, 'confirm').mockReturnValue(false);
      (byTestId('mcp-regenerate-secret') as HTMLButtonElement).click();
      expect(store.cfg.oauthClientSecret).toBe('super-secret-value');
      expect(store.dirty()).toBe(false);
    });
  });

  describe('redirect URIs', () => {
    it('adds and removes entries through the store', () => {
      const store = makeStore();
      const cmp = create(store);
      cmp.newRedirectUri = '  https://example.com/cb  ';
      cmp.addRedirect();
      expect(store.cfg.redirectUris).toEqual([
        'https://claude.ai/api/mcp/auth_callback',
        'https://example.com/cb',
      ]);
      expect(cmp.newRedirectUri).toBe('');

      // Duplicates are refused with a warning toast.
      cmp.newRedirectUri = 'https://example.com/cb';
      cmp.addRedirect();
      expect(store.cfg.redirectUris).toHaveLength(2);
      expect(snackbar.openSnackBar).toHaveBeenCalledWith(
        'That redirect URI is already listed.',
        'warning'
      );

      cmp.removeRedirect(0);
      expect(store.cfg.redirectUris).toEqual(['https://example.com/cb']);
      expect(store.dirty()).toBe(true);
    });
  });

  describe('auto OAuth picker', () => {
    it('lists only services whose type group is OAuth', () => {
      serviceTypeService.getAll.mockReturnValue(
        of({
          resource: [
            { name: 'oauth_github', group: 'OAuth' },
            { name: 'mysql', group: 'Database' },
          ],
        }) as any
      );
      servicesService.getAll.mockReturnValue(
        of({
          resource: [
            {
              id: 1,
              name: 'github_sso',
              label: 'GitHub',
              type: 'oauth_github',
            },
            { id: 2, name: 'billing', label: 'Billing', type: 'mysql' },
          ],
        }) as any
      );
      const cmp = create(makeStore());
      expect(cmp.oauthServices).toEqual([
        { name: 'github_sso', label: 'GitHub' },
      ]);
      expect(cmp.oauthLoaded).toBe(true);
    });

    it('writes the picked value (or null for None) into cfg', () => {
      const store = makeStore();
      const cmp = create(store);
      cmp.setAutoOauth('github_sso');
      expect(store.cfg.autoOauthService).toBe('github_sso');
      cmp.setAutoOauth(null);
      expect(store.cfg.autoOauthService).toBeNull();
    });
  });

  describe('identity and danger zone', () => {
    it('active toggle off shows the inactive hint', () => {
      const store = makeStore();
      create(store);
      const toggle = byTestId('mcp-set-active')!.querySelector(
        'button[role="switch"], input[type="checkbox"]'
      ) as HTMLElement;
      toggle.click();
      fixture.detectChanges();
      expect(store.draftIsActive).toBe(false);
      expect(el().textContent).toContain(
        'This server is inactive — the endpoint refuses connections.'
      );
    });

    it('both slide-toggles use the primary (DF purple) palette, not the coral accent', () => {
      create(makeStore());
      expect(byTestId('mcp-set-active')!.getAttribute('color')).toBe('primary');
      expect(byTestId('mcp-apikey-toggle')!.getAttribute('color')).toBe(
        'primary'
      );
    });

    it('Delete server… emits requestDelete', () => {
      const cmp = create(makeStore());
      const emitted = jest.fn();
      cmp.requestDelete.subscribe(emitted);
      (byTestId('mcp-delete-server') as HTMLButtonElement).click();
      expect(emitted).toHaveBeenCalledTimes(1);
    });
  });
});

describe('DfMcpHousekeepingDialogComponent', () => {
  const keys = ['ghost_get_tables', 'ghost_create_records'];
  let dialogRef: { close: jest.Mock };
  let cmp: DfMcpHousekeepingDialogComponent;
  let fixture: ComponentFixture<DfMcpHousekeepingDialogComponent>;

  beforeEach(async () => {
    dialogRef = { close: jest.fn() };
    await TestBed.configureTestingModule({
      imports: [DfMcpHousekeepingDialogComponent],
      providers: [
        provideNoopAnimations(),
        { provide: MatDialogRef, useValue: dialogRef },
        {
          provide: MAT_DIALOG_DATA,
          useValue: { keys } as McpHousekeepingDialogData,
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(DfMcpHousekeepingDialogComponent);
    cmp = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('lists the exact keys with every checkbox pre-checked', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    for (const k of keys) expect(text).toContain(k);
    expect(cmp.selected).toEqual(keys);
  });

  it('Delete selected closes with only the still-checked keys', () => {
    cmp.toggle('ghost_create_records', false);
    cmp.deleteSelected();
    expect(dialogRef.close).toHaveBeenCalledWith(['ghost_get_tables']);
  });
});
