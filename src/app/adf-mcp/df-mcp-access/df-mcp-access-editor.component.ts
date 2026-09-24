/**
 * Access editor dialog, opened from the Tools rail's Access section: creates
 * a role, adds an existing one, or edits a role's reach across the exposed
 * services. One segmented control per backend (No access by default), rows
 * grouped by type with "Read on all", a filter above six backends, optional
 * "Limit to tables" per database, and a live summary that is the diff.
 * Every save also grants the MCP server itself; nothing is written until
 * the admin saves. Returns true when something was saved.
 */
import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
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
import { catchError, of, switchMap } from 'rxjs';
import { normalizeError } from 'src/app/shared/utilities/app-error';
import {
  AccessChange,
  AccessEditorMode,
  AccessLevel,
  NO_GRANT,
  ServiceGrantSpec,
  accessChangeTouched,
  accessRowsForChanges,
  buildAccessChanges,
  roleNameFrom,
  specsFor,
  summarizeAccessChanges,
  summaryText,
} from '../mcp-access';
import { DfMcpAccessApiService, McpRole } from '../mcp-access-api.service';
import { McpServiceKind } from '../mcp-catalog';
import { McpBackendService } from '../mcp-effective';
import { McpEditorStore } from '../mcp-store';

export interface McpAccessEditorData {
  store: McpEditorStore;
  mode: AccessEditorMode;
  /** Exposed backends that carry a service id. */
  backends: McpBackendService[];
  allowWrites: boolean;
  roles: McpRole[];
  /** The role being edited (edit mode). */
  role?: McpRole;
  /** Roles already granted the server (excluded from add). */
  grantedIds: Set<number>;
}

interface EditorRow {
  svc: McpBackendService;
  id: number;
  spec: ServiceGrantSpec;
}

export const ROLE_ROUTE = '/api-connections/role-based-access';

@Component({
  selector: 'df-mcp-access-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    RouterLink,
  ],
  templateUrl: './df-mcp-access-editor.component.html',
  styleUrls: ['./df-mcp-access-editor.component.scss'],
})
export class DfMcpAccessEditorComponent {
  readonly mode: AccessEditorMode;
  readonly serviceId: number;
  readonly serviceLabel: string;
  readonly levelsList: AccessLevel[] = ['none', 'read', 'rw'];
  readonly levelText: Record<AccessLevel, string> = {
    none: 'No access',
    read: 'Read',
    rw: 'Read and write',
  };
  readonly roleRoute = ROLE_ROUTE;

  roleId: number | null = null;
  name = '';
  createKey = false;
  levels: Record<number, AccessLevel> = {};
  /** Ticked tables per backend id; missing / empty = whole API. */
  tables: Record<number, string[]> = {};
  expanded = new Set<number>();
  tableFilter: Record<number, string> = {};
  /** Table names per backend name, fetched on first expand. */
  private tableCache: Record<string, string[]> = {};
  loadingTables = new Set<string>();
  filter = '';
  saving = false;
  error = '';
  /** Set once a create-with-key save succeeds: the key screen shows. */
  done = false;
  apiKey: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<DfMcpAccessEditorComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) public data: McpAccessEditorData,
    private api: DfMcpAccessApiService
  ) {
    this.mode = data.mode;
    this.serviceId = data.store.service.id;
    this.serviceLabel = data.store.service.label || data.store.service.name;
    for (const b of data.backends) this.levels[b.id as number] = 'none';
    if (data.mode === 'edit' && data.role) {
      this.roleId = data.role.id;
      this.seed(data.role);
    }
    if (data.mode === 'create') this.name = roleNameFrom(this.serviceLabel);
  }

  get title(): string {
    if (this.mode === 'create') return `Create a role for ${this.serviceLabel}`;
    if (this.mode === 'add') return `Add a role to ${this.serviceLabel}`;
    return `Edit access to ${this.serviceLabel}`;
  }

  get hint(): string {
    if (this.mode === 'edit') {
      return 'Per exposed service. No access removes the role’s row for that service.';
    }
    return 'The role is granted this MCP server. Pick what else it may reach — No access is the default.';
  }

  private ids(): number[] {
    return [this.serviceId, ...this.data.backends.map(b => b.id as number)];
  }

  private seed(role: McpRole): void {
    const specs = specsFor(role.rows, this.ids());
    this.tables = {};
    for (const b of this.data.backends) {
      const id = b.id as number;
      this.levels[id] = specs[id]?.level ?? 'none';
      if (specs[id]?.tables?.length) this.tables[id] = [...specs[id].tables!];
    }
  }

  /** Roles an admin can add: active ones without a server grant yet. */
  get addableRoles(): McpRole[] {
    return this.data.roles.filter(
      r => r.isActive !== false && !this.data.grantedIds.has(r.id)
    );
  }

  get currentRole(): McpRole | undefined {
    return this.data.role ?? this.data.roles.find(r => r.id === this.roleId);
  }

  private currentSpecs(): Record<number, ServiceGrantSpec> {
    return specsFor(this.currentRole?.rows ?? [], this.ids());
  }

  onRolePicked(id: number): void {
    this.roleId = id;
    const role = this.currentRole;
    if (role) this.seed(role);
  }

  get showFilter(): boolean {
    return this.data.backends.length > 6;
  }

  private rowsOf(kind: McpServiceKind): EditorRow[] {
    const specs = this.currentSpecs();
    const q = this.filter.trim().toLowerCase();
    return this.data.backends
      .filter(b => b.kind === kind)
      .filter(
        b =>
          !q ||
          b.label.toLowerCase().includes(q) ||
          b.name.toLowerCase().includes(q)
      )
      .map(b => ({
        svc: b,
        id: b.id as number,
        spec: specs[b.id as number] ?? NO_GRANT,
      }));
  }

  get groups(): Array<{
    kind: McpServiceKind;
    label: string;
    rows: EditorRow[];
  }> {
    return [
      { kind: 'db', label: 'Databases', rows: this.rowsOf('db') },
      { kind: 'file', label: 'File stores', rows: this.rowsOf('file') },
    ];
  }

  readonly trackByKind = (_: number, g: { kind: string }): string => g.kind;
  readonly trackByRow = (_: number, r: EditorRow): number => r.id;

  /** No role picked yet (add), or rows the editor cannot manage. */
  locked(row: EditorRow): boolean {
    return (this.mode === 'add' && !this.roleId) || !row.spec.editable;
  }

  setLevel(row: EditorRow, level: AccessLevel): void {
    if (this.locked(row)) return;
    if (level === 'rw' && !this.data.allowWrites) return;
    this.levels[row.id] = level;
    if (level === 'none') {
      delete this.tables[row.id];
      this.expanded.delete(row.id);
    }
  }

  /** Per-group shortcut: read on every editable row still at no access. */
  readOnAll(kind: McpServiceKind): void {
    for (const row of this.rowsOf(kind)) {
      if (!this.locked(row) && this.levels[row.id] === 'none') {
        this.levels[row.id] = 'read';
      }
    }
  }

  /* --------------------------- table limits --------------------------- */
  canLimit(row: EditorRow): boolean {
    return (
      row.svc.kind === 'db' &&
      !this.locked(row) &&
      (this.levels[row.id] ?? 'none') !== 'none'
    );
  }

  toggleExpanded(row: EditorRow): void {
    if (this.expanded.delete(row.id)) return;
    this.expanded.add(row.id);
    const name = row.svc.name;
    if (this.tableCache[name] || this.loadingTables.has(name)) return;
    this.loadingTables.add(name);
    this.api.listTables(name).subscribe(names => {
      this.tableCache[name] = names;
      this.loadingTables.delete(name);
    });
  }

  tablesOf(row: EditorRow): string[] | null {
    return this.tableCache[row.svc.name] ?? null;
  }

  visibleTables(row: EditorRow): string[] {
    const all = this.tablesOf(row) ?? [];
    const q = (this.tableFilter[row.id] ?? '').trim().toLowerCase();
    return q ? all.filter(t => t.toLowerCase().includes(q)) : all;
  }

  ticked(row: EditorRow, table: string): boolean {
    return (this.tables[row.id] ?? []).includes(table);
  }

  toggleTable(row: EditorRow, table: string): void {
    const cur = this.tables[row.id] ?? [];
    this.tables[row.id] = cur.includes(table)
      ? cur.filter(t => t !== table)
      : [...cur, table];
  }

  tickedCount(row: EditorRow): number {
    return (this.tables[row.id] ?? []).length;
  }

  limitLabel(row: EditorRow): string {
    const n = this.tickedCount(row);
    if (n === 0) return 'Limit to tables';
    const all = this.tablesOf(row);
    return all
      ? `${n} of ${all.length} tables`
      : `${n} ${n === 1 ? 'table' : 'tables'}`;
  }

  /* ----------------------------- summary ------------------------------ */
  get changes(): AccessChange[] {
    return buildAccessChanges({
      serverId: this.serviceId,
      serverLabel: this.serviceLabel,
      backends: this.data.backends.map(b => ({
        id: b.id as number,
        label: b.label,
      })),
      specs: this.currentSpecs(),
      levels: this.levels,
      tables: this.tables,
      tableTotals: Object.fromEntries(
        this.data.backends
          .filter(b => this.tableCache[b.name])
          .map(b => [b.id as number, this.tableCache[b.name].length])
      ),
    });
  }

  get summaryText(): string {
    return summaryText(summarizeAccessChanges(this.changes, this.serviceId), {
      mode: this.mode,
      roleName: this.name.trim(),
      createKey: this.createKey,
    });
  }

  get touchesApis(): boolean {
    const s = summarizeAccessChanges(this.changes, this.serviceId);
    return s.read.length + s.rw.length + s.deltas.length > 0;
  }

  get canSave(): boolean {
    if (this.saving) return false;
    if (this.mode === 'add' && !this.roleId) return false;
    if (this.mode === 'create') return !!this.name.trim();
    return this.changes.some(accessChangeTouched);
  }

  save(): void {
    if (!this.canSave) return;
    this.saving = true;
    this.error = '';
    const rows = accessRowsForChanges(
      this.changes,
      this.currentRole?.rows ?? []
    );
    const name = this.name.trim();
    const op$ =
      this.mode === 'create'
        ? this.api
            .createRole(
              name,
              `Created from the ${this.serviceLabel} MCP page`,
              rows
            )
            .pipe(
              switchMap(id =>
                this.createKey
                  ? // The role exists now: a failed key must not look like a
                    // failed save (a retry would create the role twice).
                    this.api
                      .createAppKey(`${name}_app`, id)
                      .pipe(catchError(() => of(null)))
                  : of(null)
              )
            )
        : this.api.patchRoleAccess(this.roleId as number, rows);
    op$.subscribe({
      next: key => {
        this.saving = false;
        if (this.mode === 'create' && this.createKey) {
          this.apiKey = (key as string | null) ?? null;
          if (this.apiKey) this.data.store.createdApiKey = this.apiKey;
          this.done = true;
        } else {
          this.dialogRef.close(true);
        }
      },
      error: err => {
        this.saving = false;
        this.error = normalizeError(err).message;
      },
    });
  }

  copyKey(): void {
    if (this.apiKey) {
      navigator.clipboard?.writeText(this.apiKey).catch(() => undefined);
    }
  }
}
