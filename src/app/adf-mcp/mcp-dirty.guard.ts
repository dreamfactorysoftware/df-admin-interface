/**
 * Navigation guard for the MCP editor routes: any component (or shim
 * wrapping one) that exposes canDeactivate() gets asked before the router
 * leaves, so a dirty editor can't be abandoned silently (§1.2 — the legacy
 * unsaved-custom-tool dialog generalized to any dirty state).
 */
import { CanDeactivateFn } from '@angular/router';

export interface McpDeactivatable {
  canDeactivate?: () => boolean;
}

export const mcpDirtyGuard: CanDeactivateFn<McpDeactivatable> = component =>
  component?.canDeactivate ? component.canDeactivate() : true;
