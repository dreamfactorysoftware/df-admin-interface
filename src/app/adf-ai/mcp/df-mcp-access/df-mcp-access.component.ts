import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { DfBadgeComponent } from 'src/app/shared/components/df-badge/df-badge.component';
import { DfSkeletonComponent } from 'src/app/shared/components/df-skeleton/df-skeleton.component';
import { DfSnackbarService } from 'src/app/shared/services/df-snackbar.service';
import { normalizeError } from 'src/app/shared/utilities/app-error';
import {
  DfMcpApiService,
  McpAccess,
  McpApp,
  McpRole,
} from '../df-mcp-api.service';
import {
  DfMcpAccessDialogComponent,
  McpAccessDialogData,
} from '../df-mcp-access-dialog/df-mcp-access-dialog.component';
import {
  AccessLevel,
  McpBackend,
  accessRowsForChanges,
  grantsByService,
  levelFromMask,
} from '../mcp-model';

export interface ReachItem {
  serviceId: number;
  label: string;
  exposed: boolean;
  level: AccessLevel;
  tableLimited: boolean;
}

export interface AccessRow {
  roleId: number;
  name: string;
  granted: boolean;
  level: AccessLevel;
  reach: ReachItem[];
  keyName: string | null;
  requests: number;
  denied: number;
  lastSeen: string | null;
}

/**
 * df-mcp-access — "Who can connect": roles seen by mcp-access joined with
 * their real role_service_access rows and any API key bound to them.
 * Grants written here are real role rows, so every save states that it
 * changes what the role can do everywhere, not only through MCP.
 */
@Component({
  selector: 'df-mcp-access',
  standalone: true,
  templateUrl: './df-mcp-access.component.html',
  styleUrls: ['./df-mcp-access.component.scss'],
  imports: [
    CommonModule,
    RouterLink,
    TranslocoModule,
    MatButtonModule,
    MatDialogModule,
    MatTooltipModule,
    DfBadgeComponent,
    DfSkeletonComponent,
  ],
})
export class DfMcpAccessComponent implements OnChanges {
  @Input({ required: true }) serviceId!: number;
  @Input() serviceLabel = '';
  @Input() access: McpAccess | null = null;
  @Input() roles: McpRole[] = [];
  @Input() apps: McpApp[] = [];
  @Input() backends: McpBackend[] = [];
  @Input() exposed: string[] = [];
  @Input() requireRoleAccess = false;
  @Input() allowWrites = true;
  @Input() loading = false;

  @Output() previewAs = new EventEmitter<number>();
  @Output() changed = new EventEmitter<void>();

  rows: AccessRow[] = [];
  granting: number | null = null;

  constructor(
    private api: DfMcpApiService,
    private dialog: MatDialog,
    private snackbar: DfSnackbarService,
    private transloco: TranslocoService
  ) {}

  ngOnChanges(): void {
    this.rows = this.buildRows();
  }

  get grantedRows(): AccessRow[] {
    return this.rows.filter(r => r.granted);
  }

  get seenRows(): AccessRow[] {
    return this.rows.filter(r => !r.granted);
  }

  get exposedBackends(): McpBackend[] {
    return this.backends.filter(
      b => b.id != null && this.exposed.includes(b.name)
    );
  }

  private buildRows(): AccessRow[] {
    const byId = new Map(this.roles.map(r => [r.id, r]));
    const listed = new Map<number, AccessRow>();
    const push = (
      id: number,
      name: string,
      stats?: {
        granted: boolean;
        requests: number;
        denied: number;
        last_seen: string | null;
      }
    ) => {
      const role = byId.get(id);
      const grants = role ? grantsByService(role.rows) : {};
      const server = grants[this.serviceId];
      const granted =
        stats?.granted ?? (server ? server.level !== 'none' : false);
      const reach: ReachItem[] = this.backends
        .filter(
          b => b.id != null && grants[b.id] && grants[b.id].level !== 'none'
        )
        .map(b => ({
          serviceId: b.id as number,
          label: b.label,
          exposed: this.exposed.includes(b.name),
          level: grants[b.id as number].level,
          tableLimited: grants[b.id as number].tableLimited,
        }));
      const mask = reach
        .filter(r => r.exposed)
        .reduce((m, r) => m | (r.level === 'rw' ? 31 : 1), 0);
      listed.set(id, {
        roleId: id,
        name,
        granted,
        level: levelFromMask(mask),
        reach,
        keyName: this.apps.find(a => a.roleId === id)?.name ?? null,
        requests: stats?.requests ?? 0,
        denied: stats?.denied ?? 0,
        lastSeen: stats?.last_seen ?? null,
      });
    };
    for (const r of this.access?.roles ?? []) {
      push(r.role_id, r.name, r);
    }
    for (const r of this.roles) {
      if (listed.has(r.id)) continue;
      if (r.rows.some(x => x.serviceId === this.serviceId && x.verbMask > 0)) {
        push(r.id, r.name);
      }
    }
    return Array.from(listed.values()).sort((a, b) =>
      a.granted === b.granted ? b.requests - a.requests : a.granted ? -1 : 1
    );
  }

  /** Server-only grant for a role seen without one. */
  grant(row: AccessRow): void {
    const role = this.roles.find(r => r.id === row.roleId);
    if (!role) return;
    this.granting = row.roleId;
    const rows = accessRowsForChanges(
      [{ serviceId: this.serviceId, label: '', before: 'none', after: 'read' }],
      role.rows
    );
    this.api.patchRoleAccess(role.id, rows).subscribe({
      next: () => {
        this.granting = null;
        this.snackbar.openSnackBar(
          this.transloco.translate('mcpServer.access.granted', {
            name: row.name,
          }),
          'success'
        );
        this.changed.emit();
      },
      error: err => {
        this.granting = null;
        this.snackbar.openSnackBar(normalizeError(err).message, 'error');
      },
    });
  }

  open(mode: McpAccessDialogData['mode'], row?: AccessRow): void {
    const data: McpAccessDialogData = {
      mode,
      serviceId: this.serviceId,
      serviceLabel: this.serviceLabel,
      backends: this.exposedBackends,
      roles: this.roles,
      role: row ? this.roles.find(r => r.id === row.roleId) : undefined,
      granted: new Set(this.grantedRows.map(r => r.roleId)),
      allowWrites: this.allowWrites,
    };
    this.dialog
      .open(DfMcpAccessDialogComponent, { data, width: '560px' })
      .afterClosed()
      .subscribe(saved => {
        if (saved) this.changed.emit();
      });
  }

  hasExposedReach(row: AccessRow): boolean {
    return row.reach.some(r => r.exposed);
  }

  trackByRole(_: number, r: AccessRow): number {
    return r.roleId;
  }
}
