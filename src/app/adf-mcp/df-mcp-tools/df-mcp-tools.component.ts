/**
 * Tools tab: the single exposure + curation surface (exposed-service rows
 * with capability-group drill-ins), Global tools, Custom tools, the
 * "What an agent gets" rail, the Expose-services picker and the
 * "What an agent sees" preview drawer.
 * STUB — full implementation lands in the tab build phase. The selector,
 * class name and inputs are the frozen contract with the shell.
 */
import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { McpEditorStore } from '../mcp-store';

@Component({
  selector: 'df-mcp-tools',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  template: `<div class="mcp-tools-stub" data-testid="mcp-tools-tab">
    Tools tab — implementation pending.
  </div>`,
})
export class DfMcpToolsComponent {
  @Input({ required: true }) store!: McpEditorStore;
  @Input() loading = false;
}
