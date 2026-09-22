/**
 * Connect tab: post-create checklist, endpoint card with reachability probe,
 * auth cards (OAuth 2.1 + API key state), auth-aware per-client setup
 * snippets, reconnect banner. The shell owns Save; this tab only mutates the
 * draft via the store (secret regeneration, redirect-URI append) and lets the
 * dirty bar pick it up.
 */
import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DfSnackbarService } from 'src/app/shared/services/df-snackbar.service';
import { McpEditorStore } from '../mcp-store';
import { McpTab } from '../df-mcp-details/df-mcp-details.component';

export type McpClientId =
  | 'claude'
  | 'claude-code'
  | 'cursor'
  | 'vscode'
  | 'chatgpt'
  | 'json';

/**
 * 'auth'    → an HTTP 401/403: reachable AND the sign-in challenge is live.
 * 'open'    → any other HTTP response: reachable, but NO auth claim is made.
 * 'unknown' → network failure: the neutral "—" chip.
 */
type ProbeState = 'pending' | 'auth' | 'open' | 'unknown';
type AuthVariant = 'oauth' | 'apikey';

export const CLAUDE_CALLBACK_URI = 'https://claude.ai/api/mcp/auth_callback';
const CLIENT_CHOICE_KEY_PREFIX = 'df-mcp-connect-client.';
const API_KEY_HEADER = 'X-DreamFactory-API-Key';
/** Clients whose panel has a real API-key variant (headers are possible). */
const KEY_CAPABLE_CLIENTS: ReadonlySet<McpClientId> = new Set<McpClientId>([
  'claude-code',
  'cursor',
  'vscode',
  'json',
]);

function randomHex64(): string {
  const bytes = new Uint8Array(32);
  const c: Crypto | undefined = (globalThis as any).crypto;
  if (c?.getRandomValues) {
    c.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

@Component({
  selector: 'df-mcp-connect',
  standalone: true,
  templateUrl: './df-mcp-connect.component.html',
  styleUrls: ['./df-mcp-connect.component.scss'],
  imports: [CommonModule, RouterModule, MatButtonModule, MatTooltipModule],
})
export class DfMcpConnectComponent implements OnInit, OnChanges, OnDestroy {
  @Input({ required: true }) store!: McpEditorStore;
  @Input({ required: true }) mcpUrl!: string;
  @Output() goToTab = new EventEmitter<McpTab>();

  readonly claudeCallback = CLAUDE_CALLBACK_URI;
  readonly clients: ReadonlyArray<{ id: McpClientId; label: string }> = [
    { id: 'claude', label: 'Claude' },
    { id: 'claude-code', label: 'Claude Code' },
    { id: 'cursor', label: 'Cursor' },
    { id: 'vscode', label: 'VS Code' },
    { id: 'chatgpt', label: 'ChatGPT' },
    { id: 'json', label: 'Generic JSON' },
  ];

  probe: ProbeState = 'pending';
  secretRevealed = false;
  selectedClient: McpClientId = 'claude';
  /** Sub-toggle value; only meaningful when API-key auth is on. */
  authVariant: AuthVariant = 'oauth';

  private autoDismissTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private snackbarService: DfSnackbarService) {}

  ngOnInit(): void {
    this.restoreClientChoice();
    this.runProbe();
  }

  /** The shell keeps this component across same-route service switches;
   *  a new endpoint URL means per-service state must reset and re-probe. */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mcpUrl'] && !changes['mcpUrl'].firstChange) {
      this.probe = 'pending';
      this.secretRevealed = false;
      this.authVariant = 'oauth';
      this.restoreClientChoice();
      this.runProbe();
    }
  }

  private runProbe(): void {
    // Raw fetch on purpose: DF's HTTP interceptors would attach a session
    // token; the probe must see what an unauthenticated client sees. Only a
    // 401/403 challenge proves auth is enforced — any other HTTP response
    // (200/400/405/…) is merely "reachable" with no auth claim, and a
    // network failure leaves the neutral "—" chip. Truthful indicators:
    // never claim "auth enforced" when the server answered without one.
    const url = this.mcpUrl;
    fetch(url, { method: 'GET' })
      .then(res => {
        if (url !== this.mcpUrl) return;
        this.probe = res.status === 401 || res.status === 403 ? 'auth' : 'open';
      })
      .catch(() => {
        if (url === this.mcpUrl) this.probe = 'unknown';
      });
  }

  ngOnDestroy(): void {
    if (this.autoDismissTimer) clearTimeout(this.autoDismissTimer);
  }

  /* --------------------------- zero-tools banner -------------------------- */
  /** §7: the zero-effective-tools warning renders on Connect AND Tools —
   *  gated on the catalog load so it never flashes while counts are a guess. */
  get zeroTools(): boolean {
    return (
      (this.store.isSystemMcp || this.store.backendLoaded) &&
      this.store.totalTools() === 0
    );
  }

  /* ------------------------------ checklist ------------------------------ */
  get checklistVisible(): boolean {
    return this.store.created && !this.store.checklistDismissed;
  }

  get exposedCount(): number {
    return this.store.cfg.exposedServices.length;
  }

  get step3Done(): boolean {
    return this.exposedCount > 0;
  }

  /** "3 services exposed (22 tools, read-only)" — numbers from the store. */
  get exposedSummary(): string {
    const n = this.exposedCount;
    const eff = this.store.effective();
    const ro = eff.readOnly ? ', read-only' : '';
    return `${n} ${n === 1 ? 'service' : 'services'} exposed (${eff.total} tools${ro})`;
  }

  dismissChecklist(): void {
    this.store.checklistDismissed = true;
    this.store.touch();
  }

  private maybeAutoDismiss(): void {
    if (!this.checklistVisible || this.autoDismissTimer) return;
    if (this.store.copiedUrl && this.store.copiedClient && this.step3Done) {
      // Let the final ✓ paint before the card auto-dismisses.
      this.autoDismissTimer = setTimeout(() => {
        this.store.checklistDismissed = true;
        this.store.touch();
      }, 1500);
    }
  }

  /* --------------------------- reconnect banner -------------------------- */
  dismissReconnect(): void {
    this.store.reconnectBanner = false;
    this.store.touch();
  }

  /* -------------------------------- copies ------------------------------- */
  private doCopy(text: string): void {
    try {
      navigator.clipboard?.writeText(text)?.catch(() => undefined);
    } catch {
      /* clipboard unavailable — the snackbar still confirms intent */
    }
    this.snackbarService.openSnackBar('Copied.', 'success');
  }

  /** Endpoint-card copy: checklist step ①. */
  copyEndpointUrl(): void {
    this.doCopy(this.mcpUrl);
    this.store.copiedUrl = true;
    this.store.touch();
    this.maybeAutoDismiss();
  }

  /** Any snippet/credential copy inside the client area: checklist step ②. */
  copyForClient(text: string, isUrl = false): void {
    this.doCopy(text);
    this.store.copiedClient = true;
    if (isUrl) this.store.copiedUrl = true;
    this.store.touch();
    this.maybeAutoDismiss();
  }

  copyClientId(): void {
    this.copyForClient(this.store.cfg.oauthClientId);
  }

  copySecret(): void {
    this.copyForClient(this.store.cfg.oauthClientSecret);
  }

  /* -------------------------------- OAuth -------------------------------- */
  get secretDisplay(): string {
    if (this.secretRevealed) return this.store.cfg.oauthClientSecret || '—';
    return this.store.cfg.oauthClientSecret ? '••••••••••••••••' : '—';
  }

  toggleSecret(): void {
    this.secretRevealed = !this.secretRevealed;
  }

  regenerateSecret(): void {
    const ok = window.confirm(
      'Clients using the old secret will stop connecting. Regenerate?'
    );
    if (!ok) return;
    this.store.cfg.oauthClientSecret = randomHex64();
    this.store.touch(); // dirty bar picks it up — the shell owns Save
    this.snackbarService.openSnackBar(
      'New client secret generated — save to apply.',
      'success'
    );
  }

  /* ------------------------------- clients ------------------------------- */
  private get clientChoiceKey(): string {
    return CLIENT_CHOICE_KEY_PREFIX + (this.store.service?.name ?? '');
  }

  private restoreClientChoice(): void {
    try {
      const v = localStorage.getItem(
        this.clientChoiceKey
      ) as McpClientId | null;
      if (v && this.clients.some(c => c.id === v)) this.selectedClient = v;
    } catch {
      /* storage blocked — default stands */
    }
  }

  selectClient(id: McpClientId): void {
    this.selectedClient = id;
    try {
      localStorage.setItem(this.clientChoiceKey, id);
    } catch {
      /* storage blocked — selection still works for this visit */
    }
  }

  /** OAuth is always on; both mechanisms coexist when the key flag is on. */
  get bothAuthOn(): boolean {
    return this.store.cfg.allowApiKeyAuth;
  }

  get showAuthToggle(): boolean {
    return this.bothAuthOn && KEY_CAPABLE_CLIENTS.has(this.selectedClient);
  }

  setAuthVariant(v: AuthVariant): void {
    this.authVariant = v;
  }

  /** True when the current panel should render its API-key variant. */
  get keyMode(): boolean {
    return (
      this.bothAuthOn &&
      this.authVariant === 'apikey' &&
      KEY_CAPABLE_CLIENTS.has(this.selectedClient)
    );
  }

  /* ------------------------------- snippets ------------------------------ */
  get serviceName(): string {
    return this.store.service?.name ?? '';
  }

  /** Instance origin, derived from the endpoint URL the shell hands us. */
  get origin(): string {
    return this.mcpUrl.replace(/\/mcp\/[^/]*\/?$/, '');
  }

  get legacyAlias(): string {
    return `${this.origin}/api/v2/${this.serviceName}/_mcp`;
  }

  get claudeCallbackAdded(): boolean {
    return this.store.cfg.redirectUris.includes(CLAUDE_CALLBACK_URI);
  }

  /** Jump prompt on the OAuth card: the chosen client needs a callback and
   *  none is configured yet (Claude and ChatGPT both require one). */
  get needsRedirectPrompt(): boolean {
    return (
      (this.selectedClient === 'claude' || this.selectedClient === 'chatgpt') &&
      this.store.cfg.redirectUris.length === 0
    );
  }

  addClaudeCallback(): void {
    if (this.claudeCallbackAdded) return;
    this.store.cfg.redirectUris.push(CLAUDE_CALLBACK_URI);
    this.store.touch(); // saved with the form via the dirty bar
    this.snackbarService.openSnackBar(
      "Added Claude's callback to redirect URIs — save to apply.",
      'success'
    );
  }

  /** The key created from the Tools tab's Access section, else a placeholder. */
  get apiKeyValue(): string {
    return this.store.createdApiKey ?? 'YOUR_API_KEY';
  }

  get claudeCodeSnippet(): string {
    const base = `claude mcp add --transport http ${this.serviceName} ${this.mcpUrl}`;
    return this.keyMode
      ? `${base} --header "${API_KEY_HEADER}: ${this.apiKeyValue}"`
      : base;
  }

  private serverEntry(withType: boolean): Record<string, unknown> {
    const entry: Record<string, unknown> = withType
      ? { type: 'http', url: this.mcpUrl }
      : { url: this.mcpUrl };
    if (this.keyMode) {
      entry['headers'] = { [API_KEY_HEADER]: this.apiKeyValue };
    }
    return entry;
  }

  get cursorSnippet(): string {
    return JSON.stringify(
      { mcpServers: { [this.serviceName]: this.serverEntry(false) } },
      null,
      2
    );
  }

  get vscodeSnippet(): string {
    const entry = { name: this.serviceName, ...this.serverEntry(true) };
    return `code --add-mcp '${JSON.stringify(entry)}'`;
  }

  get genericSnippet(): string {
    const json = JSON.stringify(
      { mcpServers: { [this.serviceName]: this.serverEntry(true) } },
      null,
      2
    );
    return `${json}\n// Legacy alias (same server): ${this.legacyAlias}`;
  }

  get genericCurl(): string {
    return `curl -i ${this.mcpUrl}`;
  }
}
