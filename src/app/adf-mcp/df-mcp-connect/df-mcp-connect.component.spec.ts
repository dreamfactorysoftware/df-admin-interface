import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatTooltip } from '@angular/material/tooltip';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { DfSnackbarService } from 'src/app/shared/services/df-snackbar.service';
import { McpEditorStore } from '../mcp-store';
import { DfMcpConnectComponent } from './df-mcp-connect.component';

const MCP_URL = 'https://df.test/mcp/warehouse';

function makeStore(
  overrides: {
    exposed?: string[];
    disabled?: string[];
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
      disabled_tools: overrides.disabled ?? [],
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
      expect(text).toContain('2 services exposed (26 tools)');
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
      expect(card!.textContent).toContain('API-key auth is off — enable it in');
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

    it('fills a key just created from the Access section instead of the placeholder', () => {
      const store = makeStore({ allowKey: true });
      store.createdApiKey = 'abc123key';
      const cmp = create(store);
      cmp.selectClient('claude-code');
      cmp.setAuthVariant('apikey');
      fixture.detectChanges();
      const panel = byTestId('mcp-client-panel');
      expect(panel!.textContent).toContain(
        '--header "X-DreamFactory-API-Key: abc123key"'
      );
      expect(panel!.textContent).not.toContain('YOUR_API_KEY');
      expect(byTestId('mcp-created-key-caption')).toBeTruthy();
      // A re-init (service switch) drops the key: never leaks across servers.
      store.init(store.service, {});
      expect(store.createdApiKey).toBeNull();
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

  describe('probe chip (truthful indicator)', () => {
    it('claims auth enforced only on a 401 challenge', async () => {
      (global as any).fetch = jest.fn(() => Promise.resolve({ status: 401 }));
      create(makeStore());
      await fixture.whenStable();
      fixture.detectChanges();
      expect(byTestId('mcp-probe-chip')!.textContent).toContain(
        '✓ Reachable — auth enforced'
      );
    });

    it('treats 403 as an auth challenge too', async () => {
      (global as any).fetch = jest.fn(() => Promise.resolve({ status: 403 }));
      create(makeStore());
      await fixture.whenStable();
      fixture.detectChanges();
      expect(byTestId('mcp-probe-chip')!.textContent).toContain(
        '✓ Reachable — auth enforced'
      );
    });

    it('renders plain "Reachable" with NO auth claim on any other HTTP response', async () => {
      for (const status of [200, 400, 405]) {
        (global as any).fetch = jest.fn(() => Promise.resolve({ status }));
        create(makeStore());
        await fixture.whenStable();
        fixture.detectChanges();
        const chip = byTestId('mcp-probe-chip')!;
        expect(chip.textContent!.trim()).toBe('Reachable');
        expect(chip.textContent).not.toContain('auth enforced');
        expect(chip.classList.contains('good')).toBe(false);
        const tooltip = fixture.debugElement
          .query(By.css('[data-testid="mcp-probe-chip"]'))
          .injector.get(MatTooltip);
        expect(tooltip.message).toBe(
          'The endpoint answered, but not with the expected sign-in challenge.'
        );
      }
    });

    it('stays neutral ("—") on network failure', async () => {
      (global as any).fetch = jest.fn(() => Promise.reject(new Error('down')));
      create(makeStore());
      await fixture.whenStable();
      fixture.detectChanges();
      expect(byTestId('mcp-probe-chip')!.textContent!.trim()).toBe('—');
    });
  });

  describe('zero-tools banner', () => {
    const ALL_GLOBALS = [
      'discover_services',
      'request_access',
      'list_apis',
      'search',
      'fetch',
    ];

    it('warns at the top of Connect when the server serves no tools', () => {
      create(makeStore({ exposed: [], disabled: ALL_GLOBALS }));
      const banner = byTestId('mcp-connect-zero-banner');
      expect(banner).toBeTruthy();
      expect(banner!.textContent).toContain(
        '⚠ This server serves no tools. Agents can connect but can call nothing.'
      );
      expect(banner!.textContent).toContain('Expose services in Tools.');
    });

    it('its link switches to the Tools tab via goToTab', () => {
      const cmp = create(makeStore({ exposed: [], disabled: ALL_GLOBALS }));
      const emitted = jest.fn();
      cmp.goToTab.subscribe(emitted);
      (byTestId('mcp-connect-zero-link') as HTMLButtonElement).click();
      expect(emitted).toHaveBeenCalledWith('tools');
    });

    it('does not render when any tool is served', () => {
      create(makeStore({ exposed: [] })); // globals still on: 5 tools
      expect(byTestId('mcp-connect-zero-banner')).toBeNull();
    });
  });

  describe('checklist step circles', () => {
    function marks(): string[] {
      return Array.from(el().querySelectorAll('.mcp-step-mark')).map(m =>
        (m.textContent ?? '').trim()
      );
    }

    it('uses one numbered-circle grammar for all three steps', () => {
      create(makeStore({ exposed: [] }));
      expect(marks()).toEqual(['1', '2', '3']);
    });

    it('a completed step swaps its number for a check — including the pre-checked step 3', () => {
      const store = makeStore({ exposed: ['billing'] });
      create(store);
      expect(marks()).toEqual(['1', '2', '✓']);
      (byTestId('mcp-endpoint-copy') as HTMLButtonElement).click();
      fixture.detectChanges();
      expect(marks()).toEqual(['✓', '2', '✓']);
      // The completed li carries the .done class that turns its circle green.
      const items = el().querySelectorAll('.mcp-checklist-steps li');
      expect(items[0].classList.contains('done')).toBe(true);
      expect(items[1].classList.contains('done')).toBe(false);
      expect(items[2].classList.contains('done')).toBe(true);
    });
  });

  describe('OAuth card redirect jump prompt', () => {
    const PROMPT =
      "This client needs a redirect URI — add Claude's callback below or in Settings.";

    it('shows for Claude when redirectUris is empty and clears once the callback is added', () => {
      const cmp = create(makeStore());
      expect(cmp.selectedClient).toBe('claude');
      const prompt = byTestId('mcp-redirect-jump-prompt');
      expect(prompt).toBeTruthy();
      expect((prompt!.textContent ?? '').replace(/\s+/g, ' ')).toContain(
        PROMPT
      );
      cmp.addClaudeCallback();
      fixture.detectChanges();
      expect(byTestId('mcp-redirect-jump-prompt')).toBeNull();
    });

    it('shows for ChatGPT, but not for clients without a callback requirement', () => {
      const cmp = create(makeStore());
      cmp.selectClient('chatgpt');
      fixture.detectChanges();
      expect(byTestId('mcp-redirect-jump-prompt')).toBeTruthy();
      cmp.selectClient('cursor');
      fixture.detectChanges();
      expect(byTestId('mcp-redirect-jump-prompt')).toBeNull();
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
