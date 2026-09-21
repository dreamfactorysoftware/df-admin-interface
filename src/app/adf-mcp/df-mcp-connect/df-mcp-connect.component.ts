/**
 * Connect tab: post-create checklist, endpoint card, auth cards (OAuth 2.1 +
 * API key state), auth-aware per-client setup snippets, reconnect banner.
 * STUB — full implementation lands in the tab build phase. The selector,
 * class name, inputs and outputs are the frozen contract with the shell.
 */
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { McpEditorStore } from '../mcp-store';
import { McpTab } from '../df-mcp-details/df-mcp-details.component';

@Component({
  selector: 'df-mcp-connect',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  template: `<div class="mcp-connect-stub" data-testid="mcp-connect-tab">
    Connect tab — implementation pending.
  </div>`,
})
export class DfMcpConnectComponent {
  @Input({ required: true }) store!: McpEditorStore;
  @Input({ required: true }) mcpUrl!: string;
  @Output() goToTab = new EventEmitter<McpTab>();
}
