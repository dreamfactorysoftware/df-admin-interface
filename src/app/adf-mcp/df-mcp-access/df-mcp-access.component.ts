/**
 * Access section of the Tools rail: which roles can use this MCP server
 * (granted flag, requests, denied and last seen from mcp-access, joined
 * with the real role rows and any API key bound to the role), a one-click
 * Grant for roles seen without one, and the access editor dialog to create
 * a role, add an existing one or edit a role's reach. Role writes are
 * immediate system/role saves — independent of the page's dirty bar.
 */
import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { DfSnackbarService } from 'src/app/shared/services/df-snackbar.service';
import { normalizeError } from 'src/app/shared/utilities/app-error';
import {
  AccessEditorMode,
  cfgFlag,
  serverGrantRows,
  specsFor,
} from '../mcp-access';
import {
  DfMcpAccessApiService,
  McpAccess,
  McpApp,
  McpRole,
} from '../mcp-access-api.service';
import { McpBackendService } from '../mcp-effective';
import { McpEditorStore } from '../mcp-store';
import {
  DfMcpAccessEditorComponent,
  McpAccessEditorData,
  ROLE_ROUTE,
} from './df-mcp-access-editor.component';

export interface AccessListRow {
  roleId: number;
  name: string;
  granted: boolean;
  requests: number;
  denied: number;
  lastSeen: string | null;
  keyName: string | null;
  /** False for ids mcp-access still reports but that were deleted ("#14"). */
  exists: boolean;
}

/**
 * Roles to list: every role mcp-access reports (granted or seen in the
 * window), plus roles holding a server grant it did not report. Granted
 * first, then by requests.
 */
export function buildAccessRows(
  serviceId: number,
  access: McpAccess | null,
  roles: McpRole[],
  apps: McpApp[]
): AccessListRow[] {
  const keyOf = (id: number) => apps.find(a => a.roleId === id)?.name ?? null;
  const out = new Map<number, AccessListRow>();
  for (const r of access?.roles ?? []) {
    out.set(r.role_id, {
      roleId: r.role_id,
      name: r.name,
      granted: !!r.granted,
      requests: r.requests ?? 0,
      denied: r.denied ?? 0,
      lastSeen: r.last_seen ?? null,
      keyName: keyOf(r.role_id),
      exists: roles.some(x => x.id === r.role_id),
    });
  }
  for (const role of roles) {
    if (out.has(role.id)) continue;
    if (specsFor(role.rows, [serviceId])[serviceId].level === 'none') continue;
    out.set(role.id, {
      roleId: role.id,
      name: role.name,
      granted: true,
      requests: 0,
      denied: 0,
      lastSeen: null,
      keyName: keyOf(role.id),
      exists: true,
    });
  }
  return [...out.values()].sort((a, b) =>
    a.granted === b.granted ? b.requests - a.requests : a.granted ? -1 : 1
  );
}

@Component({
  selector: 'df-mcp-access',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatTooltipModule,
    RouterLink,
  ],
  templateUrl: './df-mcp-access.component.html',
  styleUrls: ['./df-mcp-access.component.scss'],
})
export class DfMcpAccessComponent implements OnChanges {
  @Input({ required: true }) store!: McpEditorStore;

  readonly roleRoute = ROLE_ROUTE;
  loading = false;
  access: McpAccess | null = null;
  roles: McpRole[] = [];
  apps: McpApp[] = [];
  rows: AccessListRow[] = [];
  granting: number | null = null;
  readonly trackByRole = (_: number, r: AccessListRow): number => r.roleId;

  constructor(
    private api: DfMcpAccessApiService,
    private dialog: MatDialog,
    private snackbar: DfSnackbarService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['store']) this.load();
  }

  load(): void {
    const id = this.store?.service?.id;
    if (id == null) return;
    this.loading = true;
    forkJoin({
      access: this.api.access(id),
      roles: this.api.roles(),
      apps: this.api.apps(),
    }).subscribe(({ access, roles, apps }) => {
      this.access = access;
      this.roles = roles;
      this.apps = apps;
      this.rows = buildAccessRows(id, access, roles, apps);
      this.loading = false;
    });
  }

  get granted(): AccessListRow[] {
    return this.rows.filter(r => r.granted);
  }

  get seen(): AccessListRow[] {
    return this.rows.filter(r => !r.granted);
  }

  /** Whether the daemon gates connections on a role grant. */
  get requireRoleAccess(): boolean {
    return (
      this.access?.require_role_access ??
      cfgFlag(
        this.store.cfg.rest,
        'require_role_access',
        'requireRoleAccess',
        false
      )
    );
  }

  get allowWrites(): boolean {
    return cfgFlag(this.store.cfg.rest, 'allow_writes', 'allowWrites', true);
  }

  /** Exposed services the role can be granted (need a service id). */
  backends(): McpBackendService[] {
    return this.store
      .rows()
      .map(r => r.svc)
      .filter((s): s is McpBackendService => !!s && s.id != null);
  }

  /** One click: grant read on this MCP server only. */
  grant(row: AccessListRow): void {
    const role = this.roles.find(r => r.id === row.roleId);
    if (!role) return;
    const rows = serverGrantRows(this.store.service.id, role.rows);
    if (rows.length === 0) return this.load();
    this.granting = row.roleId;
    this.api.patchRoleAccess(role.id, rows).subscribe({
      next: () => {
        this.granting = null;
        this.snackbar.openSnackBar(
          `${row.name} can now connect to this server.`,
          'success'
        );
        this.load();
      },
      error: err => {
        this.granting = null;
        this.snackbar.openSnackBar(normalizeError(err).message, 'error');
      },
    });
  }

  open(mode: AccessEditorMode, row?: AccessListRow): void {
    const data: McpAccessEditorData = {
      store: this.store,
      mode,
      backends: this.backends(),
      allowWrites: this.allowWrites,
      roles: this.roles,
      role: row ? this.roles.find(r => r.id === row.roleId) : undefined,
      grantedIds: new Set(this.granted.map(r => r.roleId)),
    };
    this.dialog
      .open(DfMcpAccessEditorComponent, {
        data,
        width: '720px',
        maxWidth: '95vw',
        // Unsaved picks (and a shown-once key) must not vanish on a stray click.
        disableClose: true,
      })
      .afterClosed()
      .subscribe(saved => {
        if (!saved) return;
        this.store.touch(); // Connect may now show a created key
        this.load();
      });
  }
}
