/**
 * Shell for the redesigned MCP service page: persistent endpoint header,
 * Connect / Tools / Settings tabs, dirty bar with the tool-count delta, and
 * the save pipeline (auto cache flush, stay-in-place, delta snackbar,
 * reconnect banner arming). Tabs receive the McpEditorStore and mutate it.
 */
import { CommonModule } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, forkJoin } from 'rxjs';
import { UntilDestroy } from '@ngneat/until-destroy';
import {
  CACHE_SERVICE_TOKEN,
  SERVICES_SERVICE_TOKEN,
  SERVICE_TYPE_SERVICE_TOKEN,
} from 'src/app/shared/constants/tokens';
import { DfBaseCrudService } from 'src/app/shared/services/df-base-crud.service';
import { DfSnackbarService } from 'src/app/shared/services/df-snackbar.service';
import { GenericListResponse } from 'src/app/shared/types/generic-http';
import { serializeMcpConfig, toBackendServices } from '../mcp-effective';
import { McpEditorStore, McpServiceType } from '../mcp-store';
import { DfMcpConnectComponent } from '../df-mcp-connect/df-mcp-connect.component';
import { DfMcpToolsComponent } from '../df-mcp-tools/df-mcp-tools.component';
import { DfMcpSettingsComponent } from '../df-mcp-settings/df-mcp-settings.component';

export type McpTab = 'connect' | 'tools' | 'settings';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-mcp-details',
  templateUrl: './df-mcp-details.component.html',
  styleUrls: ['./df-mcp-details.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    DfMcpConnectComponent,
    DfMcpToolsComponent,
    DfMcpSettingsComponent,
  ],
})
export class DfMcpDetailsComponent implements OnInit, OnDestroy {
  store = new McpEditorStore();
  tab: McpTab = 'connect';
  loading = true;
  saving = false;
  private sub?: Subscription;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    @Inject(SERVICES_SERVICE_TOKEN) private servicesService: DfBaseCrudService,
    @Inject(SERVICE_TYPE_SERVICE_TOKEN)
    private serviceTypeService: DfBaseCrudService,
    @Inject(CACHE_SERVICE_TOKEN) private cacheService: DfBaseCrudService,
    private snackbarService: DfSnackbarService
  ) {}

  ngOnInit(): void {
    const data = this.activatedRoute.snapshot.data['data'];
    const qp = this.activatedRoute.snapshot.queryParamMap;
    this.store.created = qp.get('created') === '1';
    const type: McpServiceType =
      data?.type === 'system_mcp' ? 'system_mcp' : 'mcp';
    this.store.init(
      {
        id: data?.id,
        name: data?.name ?? '',
        label: data?.label || data?.name || '',
        description: data?.description ?? '',
        isActive: data?.isActive ?? true,
        type,
        raw: data,
      },
      data?.config ?? {}
    );
    const requestedTab = qp.get('tab') as McpTab | null;
    if (requestedTab && ['connect', 'tools', 'settings'].includes(requestedTab)) {
      this.tab = requestedTab;
    }
    this.loadBackendServices();
    this.sub = this.store.changes.subscribe(() => undefined);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private loadBackendServices(): void {
    // The daemon serves tools for Database-group services and local file
    // storage. Fetch types (for the group map) + services in one go.
    forkJoin({
      types: this.serviceTypeService.getAll<GenericListResponse<any>>({
        fields: 'name,group',
        limit: 1000,
      }),
      services: this.servicesService.getAll<GenericListResponse<any>>({
        limit: 1000,
        fields: 'id,name,label,type,is_active',
        sort: 'name',
      }),
    }).subscribe({
      next: ({ types, services }) => {
        const groupMap: Record<string, string> = {};
        for (const t of types?.resource ?? []) groupMap[t.name] = t.group;
        this.store.backendServices = toBackendServices(
          services?.resource ?? [],
          groupMap
        );
        this.store.backendLoaded = true;
        this.loading = false;
        this.store.touch();
      },
      error: () => {
        this.store.backendLoaded = true;
        this.loading = false;
        this.store.touch();
      },
    });
  }

  /* ------------------------------ header ------------------------------ */
  get mcpUrl(): string {
    return `${window.location.origin}/mcp/${this.store.service.name}`;
  }

  copyUrl(): void {
    navigator.clipboard?.writeText(this.mcpUrl).catch(() => undefined);
    this.store.copiedUrl = true;
    this.snackbarService.openSnackBar('Endpoint URL copied.', 'success');
  }

  setTab(tab: McpTab): void {
    this.tab = tab;
  }

  /* ------------------------------- save ------------------------------- */
  save(): void {
    if (this.saving || !this.store.dirty()) return;
    const s = this.store;
    const wasTools = s.savedEffective().total;
    const renamed = s.draftName !== s.service.name;
    const connectionAffecting = s.connectionAffecting();
    if (renamed) {
      const ok = window.confirm(
        `Renaming changes your endpoint URL to …/mcp/${s.draftName}. ` +
          'Connected clients will break until they update. Rename?'
      );
      if (!ok) return;
    }
    this.saving = true;
    const payload: any = {
      ...s.service.raw,
      id: s.service.id,
      name: s.draftName,
      label: s.draftLabel,
      description: s.draftDescription,
      isActive: s.draftIsActive,
      type: s.service.type,
      config: serializeMcpConfig(s.cfg, s.service.type),
    };
    delete payload.serviceDocByServiceId;
    this.servicesService.update(s.service.id, payload).subscribe({
      next: () => {
        this.saving = false;
        s.markSaved();
        // MCP saves always flush the service cache — no button for it.
        this.cacheService.delete(s.service.name).subscribe({
          next: () => undefined,
          error: () => undefined,
        });
        const now = s.effective().total;
        if (now === 0) {
          this.snackbarService.openSnackBar(
            'Saved — this server serves no tools. Agents can connect but can call nothing.',
            'warning'
          );
        } else if (now !== wasTools) {
          this.snackbarService.openSnackBar(
            `Saved — ${now} tools live (was ${wasTools}).`,
            'success'
          );
        } else {
          this.snackbarService.openSnackBar('Saved.', 'success');
        }
        if (connectionAffecting) {
          s.reconnectBanner = true;
        }
        s.touch();
      },
      error: err => {
        this.saving = false;
        this.snackbarService.openSnackBar(
          err?.error?.error?.message ?? 'Save failed.',
          'error'
        );
      },
    });
  }

  discard(): void {
    this.store.discard();
  }

  /** Delete server (Settings danger zone calls this). */
  deleteServer(): void {
    const s = this.store;
    const typed = window.prompt(
      `Delete this MCP server? Clients lose access immediately.\n` +
        `Type the server name (${s.service.name}) to confirm:`
    );
    if (typed !== s.service.name) return;
    this.servicesService.delete(s.service.id).subscribe({
      next: () => {
        this.snackbarService.openSnackBar('Server deleted.', 'success');
        this.router.navigate(['../'], { relativeTo: this.activatedRoute });
      },
      error: () =>
        this.snackbarService.openSnackBar('Delete failed.', 'error'),
    });
  }
}
