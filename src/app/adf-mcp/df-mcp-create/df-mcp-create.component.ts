/**
 * Create page for MCP servers: one screen, one decision (what agents may
 * reach). Type cards, name with live URL preview, the expose-services
 * picker with read-only default, live consequence line, silent OAuth
 * provisioning, single Create button. First save navigates to the new
 * service's own edit page, Connect tab, ?created=1.
 * STUB — full implementation lands in the tab build phase. The selector and
 * class name are the frozen contract with the routing shim.
 */
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'df-mcp-create',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  template: `<div class="mcp-create-stub" data-testid="mcp-create-page">
    New MCP server — implementation pending.
  </div>`,
})
export class DfMcpCreateComponent {}
