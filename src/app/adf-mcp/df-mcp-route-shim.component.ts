/**
 * Routing shim for the service-details routes: MCP services get the
 * redesigned editor, everything else keeps the legacy generic editor.
 *
 * Edit (`:id`): decided by the resolved service's type.
 * Create: decided by the route's `groups` data — the AI → MCP section
 * creates with the MCP create page; every other section keeps the generic
 * create form (which can still create an mcp service via its type picker;
 * its save handler then lands on the new MCP editor via ?created=1).
 */
import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { McpDeactivatable } from './mcp-dirty.guard';
import { DfServiceDetailsComponent } from '../adf-services/df-service-details/df-service-details.component';
import { DfMcpDetailsComponent } from './df-mcp-details/df-mcp-details.component';
import { DfMcpCreateComponent } from './df-mcp-create/df-mcp-create.component';

@Component({
  selector: 'df-mcp-route-shim',
  standalone: true,
  imports: [
    CommonModule,
    DfServiceDetailsComponent,
    DfMcpDetailsComponent,
    DfMcpCreateComponent,
  ],
  template: `
    <df-mcp-details *ngIf="mode === 'mcp-edit'"></df-mcp-details>
    <df-mcp-create *ngIf="mode === 'mcp-create'"></df-mcp-create>
    <df-service-details *ngIf="mode === 'generic'"></df-service-details>
  `,
})
export class DfMcpRouteShimComponent
  implements OnInit, OnDestroy, McpDeactivatable
{
  mode: 'mcp-edit' | 'mcp-create' | 'generic' = 'generic';
  private routeSub?: Subscription;

  @ViewChild(DfMcpDetailsComponent) details?: DfMcpDetailsComponent;
  @ViewChild(DfMcpCreateComponent) create?: DfMcpCreateComponent;

  constructor(private activatedRoute: ActivatedRoute) {}

  /** Delegates the dirty-navigation check to whichever editor is rendered. */
  canDeactivate(): boolean {
    if (this.mode === 'mcp-edit') return this.details?.canDeactivate() ?? true;
    if (this.mode === 'mcp-create') return this.create?.canDeactivate() ?? true;
    return true; // the legacy editor keeps its own dialogs
  }

  ngOnInit(): void {
    // Same-route navigations (/ai/mcp/9 -> /ai/mcp/21) reuse this component,
    // so the mode has to be recomputed on every resolver emission, not once.
    this.routeSub = this.activatedRoute.data.subscribe(() =>
      this.computeMode()
    );
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  private computeMode(): void {
    const snap = this.activatedRoute.snapshot;
    const service = snap.data['data'];
    if (service?.type === 'mcp' || service?.type === 'system_mcp') {
      this.mode = 'mcp-edit';
      return;
    }
    const isCreate = !snap.paramMap.get('id');
    const groups: string[] =
      snap.data['groups'] || snap.parent?.data?.['groups'] || [];
    this.mode =
      isCreate && groups.includes('MCP') ? 'mcp-create' : 'generic';
  }
}
