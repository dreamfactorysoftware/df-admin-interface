import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { DfSnackbarService } from 'src/app/shared/services/df-snackbar.service';
import { McpEditorStore } from '../mcp-store';
import { DfMcpConnectComponent } from './df-mcp-connect.component';

const MCP_URL = 'https://df.test/mcp/warehouse';

function makeStore(
  overrides: {
    exposed?: string[];
    allowKey?: boolean;
    created?: boolean;
  } = {}
): McpEditorStore {
  const store = new McpEditorStore();
  store.init(
    {
      id: 7,
      name: 'warehouse',
      label: 'Warehouse Analytics',
      description: '',
      isActive: true,
      type: 'mcp',
      raw: {},
    },
    {
      exposed_services: overrides.exposed ?? [],
      disabled_tools: [],
      tool_style: 'merged',
      allow_api_key_auth: overrides.allowKey ?? false,
      oauth_client_id: 'client-id-123',
      oauth_client_secret: 'original-secret',
      redirect_uris: [],
    }
  );
  store.backendServices = [
    { name: 'billing', label: 'Billing', kind: 'db', active: true },
    { name: 'hr', label: 'HR', kind: 'db', active: true },
  ];
  store.backendLoaded = true;
  store.created = overrides.created ?? true;
  return store;
}

describe('DfMcpConnectComponent', () => {
  let fixture: ComponentFixture<DfMcpConnectComponent>;
  const snackbar = { openSnackBar: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    try {
      localStorage.clear();
    } catch {
      /* ignore */
    }
    (global as any).fetch = jest.fn(() => Promise.resolve({ status: 401 }));
    await TestBed.configureTestingModule({
      imports: [DfMcpConnectComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: DfSnackbarService, useValue: snackbar },
      ],
    }).compileComponents();
  });

  function create(store: McpEditorStore): DfMcpConnectComponent {
    fixture = TestBed.createComponent(DfMcpConnectComponent);
    fixture.componentInstance.store = store;
    fixture.componentInstance.mcpUrl = MCP_URL;
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function byTestId(id: string): HTMLElement | null {
    return el().querySelector(`[data-testid="${id}"]`);
  }

  describe('first-run checklist step 3', () => {
    it('renders the pre-checked summary with the effective count when services were exposed', () => {
      create(makeStore({ exposed: ['billing', 'hr'] }));
      const checklist = byTestId('mcp-checklist');
      expect(checklist).toBeTruthy();
      const text = checklist!.textContent ?? '';
      // 2 dbs, merged, nothing disabled: 16 shared db + 5 global + 6 aggregators
      expect(text).toContain('2 services exposed (27 tools)');
      expect(text).toContain('refine in Tools');
      expect(text).not.toContain('Empty never means every service');
    });

    it('renders the expose prompt with the empty-never-means-every-service rule when created empty', () => {
      create(makeStore({ exposed: [] }));
      const checklist = byTestId('mcp-checklist');
      expect(checklist).toBeTruthy();
      const text = checklist!.textContent ?? '';
      expect(text).toContain('Expose your first service');
      expect(text).toContain('0 services exposed');
      expect(text).toContain('Empty never means every service.');
      expect(text).not.toContain('refine in Tools');
    });

    it('dismiss × sets store.checklistDismissed and hides the card', () => {
      const store = makeStore({ exposed: ['billing'] });
      create(store);
      (byTestId('mcp-checklist-dismiss') as HTMLButtonElement).click();
      fixture.detectChanges();
      expect(store.checklistDismissed).toBe(true);
      expect(byTestId('mcp-checklist')).toBeNull();
    });
  });

  describe('API key card', () => {
    it('shows the off-state hint when allowApiKeyAuth is off', () => {
      create(makeStore({ allowKey: false }));
      const card = byTestId('mcp-apikey-card');
      expect(card!.textContent).toContain(
        'API-key auth is off — enable it in'
      );
      expect(card!.textContent).toContain('Settings → Authentication');
    });

    it('shows the hygiene copy when allowApiKeyAuth is on', () => {
      create(makeStore({ allowKey: true }));
      const card = byTestId('mcp-apikey-card');
      expect(card!.textContent).toContain(
        'The URL plus any valid key grants access — treat the pair like a password.'
      );
    });
  });

  describe('snippet auth-awareness', () => {
    it('never mentions the API-key header anywhere when the flag is off', () => {
      const cmp = create(makeStore({ allowKey: false }));
      for (const client of [
        'claude',
        'claude-code',
        'cursor',
        'vscode',
        'chatgpt',
        'json',
      ] as const) {
        cmp.selectClient(client);
        fixture.detectChanges();
        expect(el().textContent).not.toContain('X-DreamFactory-API-Key');
        expect(el().textContent).not.toContain('YOUR_API_KEY');
      }
    });

    it('shows the sub-toggle and the header variant only in API-key mode when the flag is on', () => {
      const cmp = create(makeStore({ allowKey: true }));
      cmp.selectClient('claude-code');
      fixture.detectChanges();
      // Toggle visible, OAuth variant default: no key header yet.
      expect(el().textContent).toContain('Connect with:');
      expect(el().textContent).not.toContain('X-DreamFactory-API-Key');
      cmp.setAuthVariant('apikey');
      fixture.detectChanges();
      const panel = byTestId('mcp-client-panel');
      expect(panel!.textContent).toContain(
        '--header "X-DreamFactory-API-Key: YOUR_API_KEY"'
      );
    });

    it('placeholders are YOUR_API_KEY, never a session token', () => {
      const cmp = create(makeStore({ allowKey: true }));
      cmp.selectClient('json');
      cmp.setAuthVariant('apikey');
      fixture.detectChanges();
      const panel = byTestId('mcp-client-panel');
      expect(panel!.textContent).toContain('YOUR_API_KEY');
      expect(panel!.textContent).not.toContain('session_token');
    });
  });

  describe('regenerate secret', () => {
    it('confirms, writes 64 hex chars into the draft and marks the store dirty', () => {
      const store = makeStore();
      create(store);
      jest.spyOn(window, 'confirm').mockReturnValue(true);
      expect(store.dirty()).toBe(false);
      (byTestId('mcp-secret-regenerate') as HTMLButtonElement).click();
      expect(window.confirm).toHaveBeenCalledWith(
        'Clients using the old secret will stop connecting. Regenerate?'
      );
      expect(store.cfg.oauthClientSecret).toMatch(/^[0-9a-f]{64}$/);
      expect(store.cfg.oauthClientSecret).not.toBe('original-secret');
      expect(store.dirty()).toBe(true);
    });

    it('does nothing when the confirm is declined', () => {
      const store = makeStore();
      create(store);
      jest.spyOn(window, 'confirm').mockReturnValue(false);
      (byTestId('mcp-secret-regenerate') as HTMLButtonElement).click();
      expect(store.cfg.oauthClientSecret).toBe('original-secret');
      expect(store.dirty()).toBe(false);
    });
  });

  describe('Claude redirect-URI helper', () => {
    it('appends the callback once and marks the store dirty', () => {
      const store = makeStore();
      create(store);
      const btn = byTestId('mcp-add-redirect') as HTMLButtonElement;
      btn.click();
      fixture.detectChanges();
      expect(store.cfg.redirectUris).toEqual([
        'https://claude.ai/api/mcp/auth_callback',
      ]);
      expect(store.dirty()).toBe(true);
      // Second click is a no-op (button disabled, guard in code).
      fixture.componentInstance.addClaudeCallback();
      expect(store.cfg.redirectUris).toHaveLength(1);
    });
  });

  describe('probe chip', () => {
    it('shows reachable on any HTTP response', async () => {
      create(makeStore());
      await fixture.whenStable();
      fixture.detectChanges();
      expect(byTestId('mcp-probe-chip')!.textContent).toContain(
        'Reachable — auth enforced'
      );
    });

    it('stays neutral ("—") on network failure', async () => {
      (global as any).fetch = jest.fn(() => Promise.reject(new Error('down')));
      create(makeStore());
      await fixture.whenStable();
      fixture.detectChanges();
      expect(byTestId('mcp-probe-chip')!.textContent!.trim()).toBe('—');
    });
  });

  describe('checklist copy tracking', () => {
    it('endpoint copy sets copiedUrl; a snippet copy sets copiedClient', () => {
      const store = makeStore();
      create(store);
      (byTestId('mcp-endpoint-copy') as HTMLButtonElement).click();
      expect(store.copiedUrl).toBe(true);
      fixture.componentInstance.copyForClient('anything');
      expect(store.copiedClient).toBe(true);
    });
  });
});
