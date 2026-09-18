import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { switchMap, of } from 'rxjs';
import { normalizeError } from 'src/app/shared/utilities/app-error';
import { DfMcpApiService, McpRole } from '../df-mcp-api.service';
import {
  AccessChange,
  AccessLevel,
  McpBackend,
  ServiceGrant,
  accessDiff,
  accessRowsForChanges,
  buildAccessChanges,
  grantsByService,
} from '../mcp-model';

export interface McpAccessDialogData {
  mode: 'add' | 'edit' | 'create';
  serviceId: number;
  serviceLabel: string;
  /** Exposed backends (with ids) the role may be granted. */
  backends: McpBackend[];
  roles: McpRole[];
  role?: McpRole;
  granted: Set<number>;
  allowWrites: boolean;
}

/**
 * df-mcp-access-dialog — add an existing role, edit a role's reach across
 * the exposed APIs, or create a role (optionally with an API key shown
 * once). Every save shows a plain diff first, because these are real role
 * rows: they change what the role can do everywhere, not only through MCP.
 */
@Component({
  selector: 'df-mcp-access-dialog',
  standalone: true,
  templateUrl: './df-mcp-access-dialog.component.html',
  styleUrls: ['./df-mcp-access-dialog.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TranslocoModule,
    MatDialogModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
  ],
})
export class DfMcpAccessDialogComponent {
  step: 'edit' | 'review' | 'done' = 'edit';
  roleId: number | null = null;
  name = '';
  levels: Record<number, AccessLevel> = {};
  include: Record<number, boolean> = {};
  createKey = true;
  diff: string[] = [];
  changes: AccessChange[] = [];
  apiKey: string | null = null;
  saving = false;
  error = '';

  constructor(
    public ref: MatDialogRef<DfMcpAccessDialogComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) public data: McpAccessDialogData,
    private api: DfMcpApiService,
    private transloco: TranslocoService
  ) {
    if (data.mode === 'edit' && data.role) {
      this.roleId = data.role.id;
      this.seedLevels(data.role);
    } else if (data.mode === 'create') {
      this.name = `${data.serviceLabel}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '');
      this.name = this.name ? `${this.name}_access` : 'mcp_access';
    }
    if (data.mode !== 'edit') {
      // Opt-in: a new or added role never proposes data access the admin
      // did not tick. The level only applies once the backend is included.
      for (const b of data.backends) {
        this.levels[b.id as number] = 'read';
        this.include[b.id as number] = false;
      }
    }
  }

  /** Add and create are opt-in per backend; edit shows every exposed API. */
  get optIn(): boolean {
    return this.data.mode !== 'edit';
  }

  /** Whether the row's level picker is usable right now. */
  levelDisabled(b: McpBackend): boolean {
    if (!this.optIn) return false;
    if (this.data.mode === 'add' && !this.roleId) return true;
    return !this.include[b.id as number];
  }

  /** Roles an admin can add: active ones without a server grant yet. */
  get addableRoles(): McpRole[] {
    return this.data.roles.filter(
      r => r.isActive !== false && !this.data.granted.has(r.id)
    );
  }

  get role(): McpRole | undefined {
    return this.data.role ?? this.data.roles.find(r => r.id === this.roleId);
  }

  private currentGrants(): Record<number, ServiceGrant> {
    return this.role ? grantsByService(this.role.rows) : {};
  }

  grant(b: McpBackend): ServiceGrant | undefined {
    return this.currentGrants()[b.id as number];
  }

  private seedLevels(role: McpRole): void {
    const grants = grantsByService(role.rows);
    for (const b of this.data.backends) {
      this.levels[b.id as number] = grants[b.id as number]?.level ?? 'none';
    }
  }

  onRolePicked(id: number): void {
    this.roleId = id;
    const role = this.role;
    if (role) this.seedLevels(role);
  }

  levelLabels(): Record<AccessLevel, string> {
    return {
      none: this.transloco.translate('mcpServer.access.level.none'),
      read: this.transloco.translate('mcpServer.access.level.read'),
      rw: this.transloco.translate('mcpServer.access.level.rw'),
    };
  }

  review(): void {
    const changes = buildAccessChanges({
      serverId: this.data.serviceId,
      serverLabel: this.data.serviceLabel,
      backends: this.data.backends.map(b => ({
        id: b.id as number,
        label: b.label,
      })),
      grants: this.currentGrants(),
      levels: this.levels,
      include: this.optIn ? this.include : null,
    });
    this.changes = changes;
    this.diff = accessDiff(changes, this.levelLabels());
    this.step = 'review';
  }

  get touchesApis(): boolean {
    return this.changes.some(
      c => c.serviceId !== this.data.serviceId && c.before !== c.after
    );
  }

  save(): void {
    this.saving = true;
    this.error = '';
    const rows = accessRowsForChanges(this.changes, this.role?.rows ?? []);
    const op$ =
      this.data.mode === 'create'
        ? this.api
            .createRole(
              this.name,
              this.transloco.translate('mcpServer.access.createdDesc', {
                server: this.data.serviceLabel,
              }),
              rows
            )
            .pipe(
              switchMap(id =>
                this.createKey
                  ? this.api.createAppKey(`${this.name}_app`, id)
                  : of(null)
              )
            )
        : this.api.patchRoleAccess(this.roleId as number, rows);
    op$.subscribe({
      next: key => {
        this.saving = false;
        if (this.data.mode === 'create' && this.createKey) {
          this.apiKey = (key as string | null) ?? null;
          this.step = 'done';
        } else {
          this.ref.close(true);
        }
      },
      error: err => {
        this.saving = false;
        this.error = normalizeError(err).message;
      },
    });
  }

  copyKey(): void {
    if (this.apiKey) navigator.clipboard?.writeText(this.apiKey);
  }

  trackByBackend(_: number, b: McpBackend): string {
    return b.name;
  }
}
