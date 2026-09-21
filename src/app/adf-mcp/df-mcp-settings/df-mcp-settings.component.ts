/**
 * Settings tab: Identity, Authentication (redirect URIs, API-key toggle,
 * auto OAuth picker, regenerate secret), Serving (tool naming, catalog
 * delivery, scope note), Housekeeping (orphan review, cache flush),
 * Full configuration viewer, Danger zone.
 * STUB — full implementation lands in the tab build phase. The selector,
 * class name, inputs and outputs are the frozen contract with the shell.
 */
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { McpEditorStore } from '../mcp-store';

@Component({
  selector: 'df-mcp-settings',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  template: `<div class="mcp-settings-stub" data-testid="mcp-settings-tab">
    Settings tab — implementation pending.
  </div>`,
})
export class DfMcpSettingsComponent {
  @Input({ required: true }) store!: McpEditorStore;
  @Output() requestDelete = new EventEmitter<void>();
}
