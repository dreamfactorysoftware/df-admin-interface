import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
import { TranslocoModule } from '@ngneat/transloco';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faCheck, faCopy, faPlus } from '@fortawesome/free-solid-svg-icons';
import { DfBadgeComponent } from '../df-badge/df-badge.component';
import { BASE_URL } from 'src/app/shared/constants/urls';
import { API_KEY_HEADER } from 'src/app/shared/constants/http-headers';

/**
 * A selectable identity the request can run as. Lets the card switch which key
 * (and, by extension, which role's scope) the snippets authenticate with, so
 * the same card proves "what a read-only key sees" vs "what an admin key sees".
 */
export interface ArtifactKeyOption {
  /** Already-translated display label, e.g. "Read-only demo key". */
  label: string;
  /** The literal API key value embedded in the snippets. */
  apiKey: string;
  /** Optional role name shown as a hint beside the label. */
  role?: string;
  /**
   * True only when this key was PROVEN to return 200 by the resolver's
   * session-less probe. Drives whether the card may claim "returns 200"; an
   * unproven or placeholder key gets a neutral note instead. Never assert the
   * status code for a key we did not actually run.
   */
  verified?: boolean;
}

/** Framework/tab identity for the emitted copy events and per-block state. */
export type ArtifactBlock =
  | 'baseUrl'
  | 'authHeader'
  | 'curl'
  | 'javascript'
  | 'python'
  | 'mcp';

export type ArtifactFormat = 'json' | 'xml';

/**
 * df-artifact-card — the Live API Card (Meridian Phase 1 hero proof-of-life).
 *
 * The instant a service exists this card shows the real base URL
 * (`/api/v2/{serviceName}`), the API key header, and a runnable request that
 * hits a real endpoint (`GET {baseUrl}/_table/{sampleTable}?limit=5`). Framework
 * tabs rewrite the same request as curl / JavaScript fetch / Python requests /
 * an MCP-client config block — the MCP tab is positioning no competitor has, so
 * it is a first-class tab, not a footnote. Role/key and response-format
 * switchers re-slice every snippet in place; each block has its own copy button.
 *
 * The card does NOT fetch its own key — the mounting surface passes `apiKey`
 * (or a `keys` list for the switcher). When no key is present it still renders
 * the full shape with a `YOUR_API_KEY` placeholder and a quiet "create one"
 * affordance, so the surface never dead-ends.
 *
 * Tokens only (code panels on `--df-code-bg` / `--df-code-text` / `--df-font-mono`),
 * so it is legible in light, dark, and phosphor. i18n via transloco.
 *
 * @example
 *   <df-artifact-card
 *     serviceName="db"
 *     sampleTable="customers"
 *     [apiKey]="key"
 *     (createKey)="openKeyDialog()">
 *   </df-artifact-card>
 */
@Component({
  selector: 'df-artifact-card',
  templateUrl: './df-artifact-card.component.html',
  styleUrls: ['./df-artifact-card.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    NgTemplateOutlet,
    TranslocoModule,
    MatTabsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatButtonModule,
    MatTooltipModule,
    FontAwesomeModule,
    DfBadgeComponent,
  ],
})
export class DfArtifactCardComponent {
  /** The service whose API this card proves. Drives the derived base URL. */
  @Input() serviceName = '';
  /**
   * Fully-qualified service base, e.g. `https://host/api/v2/db`. When omitted
   * it is derived from the current origin + `/api/v2/{serviceName}`.
   */
  @Input() baseUrl?: string;
  /** The literal API key embedded in the snippets. Absent => placeholder + CTA. */
  @Input() apiKey?: string;
  /** Table the sample request reads from. */
  @Input() sampleTable = 'your_table';
  /**
   * Optional role/key switcher options. With 0-1 entries the switcher collapses
   * to the single `apiKey`; with 2+ it becomes a live `mat-select`.
   */
  @Input() keys: ArtifactKeyOption[] = [];
  /**
   * Optional override for the MCP endpoint the config block points at.
   * Defaults to `{baseUrl}/_mcp` (sibling of `_table` / `_schema`).
   */
  @Input() mcpUrl?: string;

  /** Fired when the "create one" affordance is used (no key present). */
  @Output() createKey = new EventEmitter<void>();
  /** Fired after a block is copied, carrying which block. */
  @Output() copied = new EventEmitter<ArtifactBlock>();

  /** Selected key value; null until a switcher choice is made. */
  selectedKey: string | null = null;
  /** Response format applied to the REST snippets. */
  format: ArtifactFormat = 'json';
  /** The block most recently copied, for the transient "Copied" state. */
  copiedBlock: ArtifactBlock | null = null;

  readonly headerName = API_KEY_HEADER;
  readonly faCopy: IconDefinition = faCopy;
  readonly faCheck: IconDefinition = faCheck;
  readonly faPlus: IconDefinition = faPlus;

  private readonly origin =
    typeof window !== 'undefined' && window.location
      ? window.location.origin
      : '';
  private copyTimer?: ReturnType<typeof setTimeout>;

  /** Normalized switcher options: caller list, else one synthesized from apiKey. */
  get keyOptions(): ArtifactKeyOption[] {
    if (this.keys?.length) {
      return this.keys;
    }
    if (this.apiKey) {
      return [{ label: 'Default key', apiKey: this.apiKey }];
    }
    return [];
  }

  get hasKey(): boolean {
    return this.keyOptions.length > 0;
  }

  /** The key literal to embed, or a placeholder when none exists yet. */
  get activeKey(): string {
    if (!this.hasKey) {
      return 'YOUR_API_KEY';
    }
    const chosen = this.keyOptions.find(k => k.apiKey === this.selectedKey);
    return (chosen ?? this.keyOptions[0]).apiKey;
  }

  /**
   * Whether the active key was proven to return 200 by the resolver. Only then
   * may the run note assert the status code; the placeholder and any unproven
   * key fall back to a neutral note so the card never fabricates a 200.
   */
  get activeKeyVerified(): boolean {
    if (!this.hasKey) {
      return false;
    }
    const chosen = this.keyOptions.find(k => k.apiKey === this.selectedKey);
    return !!(chosen ?? this.keyOptions[0]).verified;
  }

  /** Service base with any trailing slash trimmed. */
  get resolvedBase(): string {
    const explicit = (this.baseUrl ?? '').replace(/\/+$/, '');
    if (explicit) {
      return explicit;
    }
    return `${this.origin}${BASE_URL}/${this.serviceName}`;
  }

  /** The exact URL the sample request hits. */
  get endpointUrl(): string {
    return `${this.resolvedBase}/_table/${this.sampleTable}?limit=5`;
  }

  get resolvedMcpUrl(): string {
    return (this.mcpUrl ?? `${this.resolvedBase}/_mcp`).replace(/\/+$/, '');
  }

  get acceptHeader(): string {
    return this.format === 'xml' ? 'application/xml' : 'application/json';
  }

  get curlSnippet(): string {
    return [
      `curl -X GET '${this.endpointUrl}' \\`,
      `  -H 'Accept: ${this.acceptHeader}' \\`,
      `  -H '${this.headerName}: ${this.activeKey}'`,
    ].join('\n');
  }

  get javascriptSnippet(): string {
    const parse = this.format === 'xml' ? 'text' : 'json';
    return [
      `const res = await fetch('${this.endpointUrl}', {`,
      `  headers: {`,
      `    'Accept': '${this.acceptHeader}',`,
      `    '${this.headerName}': '${this.activeKey}',`,
      `  },`,
      `});`,
      `const data = await res.${parse}();`,
      `console.log(data);`,
    ].join('\n');
  }

  get pythonSnippet(): string {
    const read = this.format === 'xml' ? 'res.text' : 'res.json()';
    return [
      `import requests`,
      ``,
      `res = requests.get(`,
      `    '${this.endpointUrl}',`,
      `    headers={`,
      `        'Accept': '${this.acceptHeader}',`,
      `        '${this.headerName}': '${this.activeKey}',`,
      `    },`,
      `)`,
      `print(${read})`,
    ].join('\n');
  }

  /**
   * MCP-client config (streamable-HTTP form). Drops straight into a Claude /
   * Cursor `mcpServers` block; the service's CRUD ops arrive as scoped tools,
   * governed by the same RBAC as the REST key.
   */
  get mcpSnippet(): string {
    const serverName = `dreamfactory-${this.serviceName || 'service'}`;
    return [
      `{`,
      `  "mcpServers": {`,
      `    "${serverName}": {`,
      `      "type": "http",`,
      `      "url": "${this.resolvedMcpUrl}",`,
      `      "headers": {`,
      `        "${this.headerName}": "${this.activeKey}"`,
      `      }`,
      `    }`,
      `  }`,
      `}`,
    ].join('\n');
  }

  onCopy(block: ArtifactBlock, text: string): void {
    this.clipboard.copy(text);
    this.copiedBlock = block;
    this.copied.emit(block);
    if (this.copyTimer) {
      clearTimeout(this.copyTimer);
    }
    this.copyTimer = setTimeout(() => {
      this.copiedBlock = null;
    }, 1600);
  }

  trackByLabel(_index: number, option: ArtifactKeyOption): string {
    return option.apiKey;
  }

  constructor(private clipboard: Clipboard) {}
}
