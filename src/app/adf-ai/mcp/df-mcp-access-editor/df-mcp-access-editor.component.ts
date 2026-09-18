import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { of, switchMap } from 'rxjs';
import { normalizeError } from 'src/app/shared/utilities/app-error';
import { DfMcpApiService, McpRole } from '../df-mcp-api.service';
import {
  AccessChange,
  AccessLevel,
  AccessSummary,
  BackendKind,
  McpBackend,
  ServiceGrantSpec,
  accessChangeTouched,
  accessRowsForChanges,
  buildAccessChanges,
  classifyServiceGrant,
  summarizeAccessChanges,
} from '../mcp-model';

export type AccessEditorMode = 'add' | 'edit' | 'create';

interface EditorRow {
  backend: McpBackend;
  id: number;
  spec: ServiceGrantSpec;
}

/**
 * df-mcp-access-editor — inline panel at the top of the Access tab that
 * creates a role, adds an existing one, or edits a role's reach across the
 * exposed APIs. One segmented control per backend ("No access" selected by
 * default), rows grouped by type with a per-group "Read on all", a filter
 * above six backends, and a live one-line summary that is the diff. Saves
 * write real role rows, so the panel says so next to Save.
 */
@Component({
  selector: 'df-mcp-access-editor',
  standalone: true,
  templateUrl: './df-mcp-access-editor.component.html',
  styleUrls: ['./df-mcp-access-editor.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TranslocoModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
  ],
})
export class DfMcpAccessEditorComponent implements OnInit, OnChanges {
  @Input({ required: true }) mode: AccessEditorMode = 'create';
  @Input({ required: true }) serviceId!: number;
  @Input() serviceLabel = '';
  /** Exposed backends (with ids) the role may be granted. */
  @Input() backends: McpBackend[] = [];
  @Input() roles: McpRole[] = [];
  @Input() role?: McpRole;
  @Input() granted = new Set<number>();
  @Input() allowWrites = true;

  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  roleId: number | null = null;
  name = '';
  createKey = true;
  levels: Record<number, AccessLevel> = {};
  /** Ticked tables per backend id; missing / empty = whole API. */
  tables: Record<number, string[]> = {};
  expanded = new Set<number>();
  tableFilter: Record<number, string> = {};
  /** Table names per backend name, fetched lazily on first expand. */
  private tableCache: Record<string, string[]> = {};
  loadingTables = new Set<string>();
  filter = '';
  saving = false;
  error = '';
  apiKey: string | null = null;
  done = false;

  readonly levelsList: AccessLevel[] = ['none', 'read', 'rw'];

  constructor(
    private api: DfMcpApiService,
    private transloco: TranslocoService
  ) {}

  ngOnInit(): void {
    this.reset();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Only a different job resets the panel; refreshed lists keep the edits.
    if (changes['mode'] || changes['role'] || changes['serviceId']) {
      this.reset();
    } else if (changes['backends']) {
      for (const b of this.backends) {
        const id = b.id as number;
        if (!(id in this.levels)) this.levels[id] = 'none';
      }
    }
  }

  private reset(): void {
    this.levels = {};
    this.tables = {};
    this.expanded = new Set();
    this.tableFilter = {};
    this.error = '';
    this.apiKey = null;
    this.done = false;
    this.filter = '';
    if (this.mode === 'edit' && this.role) {
      this.roleId = this.role.id;
      this.seedLevels(this.role);
    } else {
      this.roleId = null;
      for (const b of this.backends) this.levels[b.id as number] = 'none';
    }
    if (this.mode === 'create') {
      const base = `${this.serviceLabel}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '');
      this.name = base ? `${base}_access` : 'mcp_access';
    }
  }

  private seedLevels(role: McpRole): void {
    const specs = this.specsOf(role);
    for (const b of this.backends) {
      const id = b.id as number;
      const spec = specs[id];
      this.levels[id] = spec?.level ?? 'none';
      if (spec?.tables?.length) this.tables[id] = [...spec.tables];
    }
  }

  private specsOf(role?: McpRole): Record<number, ServiceGrantSpec> {
    const out: Record<number, ServiceGrantSpec> = {};
    if (!role) return out;
    const ids = [this.serviceId, ...this.backends.map(b => b.id as number)];
    for (const id of ids) {
      out[id] = classifyServiceGrant(role.rows.filter(r => r.serviceId === id));
    }
    return out;
  }

  /** Roles an admin can add: active ones without a server grant yet. */
  get addableRoles(): McpRole[] {
    return this.roles.filter(
      r => r.isActive !== false && !this.granted.has(r.id)
    );
  }

  get currentRole(): McpRole | undefined {
    return this.role ?? this.roles.find(r => r.id === this.roleId);
  }

  private currentSpecs(): Record<number, ServiceGrantSpec> {
    return this.specsOf(this.currentRole);
  }

  onRolePicked(id: number): void {
    this.roleId = id;
    const role = this.currentRole;
    if (role) this.seedLevels(role);
  }

  get showFilter(): boolean {
    return this.backends.length > 6;
  }

  private rowsOf(kind: BackendKind): EditorRow[] {
    const specs = this.currentSpecs();
    const q = this.filter.trim().toLowerCase();
    return this.backends
      .filter(b => b.kind === kind)
      .filter(
        b =>
          !q ||
          b.label.toLowerCase().includes(q) ||
          b.name.toLowerCase().includes(q)
      )
      .map(b => ({
        backend: b,
        id: b.id as number,
        spec: specs[b.id as number] ?? {
          level: 'none',
          tables: null,
          editable: true,
          mask: 0,
        },
      }));
  }

  /** Rows grouped by backend type; tracked by kind so the DOM is stable. */
  get groups(): Array<{ kind: BackendKind; rows: EditorRow[] }> {
    return [
      { kind: 'database', rows: this.rowsOf('database') },
      { kind: 'file', rows: this.rowsOf('file') },
    ];
  }

  trackByKind(_: number, g: { kind: BackendKind }): string {
    return g.kind;
  }

  /** The row is locked: no role picked yet, or rows the editor cannot manage. */
  locked(row: EditorRow): boolean {
    return (this.mode === 'add' && !this.roleId) || !row.spec.editable;
  }

  // ------------------------------------------------------- table limits

  canLimit(row: EditorRow): boolean {
    return (
      row.backend.kind === 'database' &&
      !this.locked(row) &&
      (this.levels[row.id] ?? 'none') !== 'none'
    );
  }

  isExpanded(row: EditorRow): boolean {
    return this.expanded.has(row.id);
  }

  toggleExpanded(row: EditorRow): void {
    if (this.expanded.has(row.id)) {
      this.expanded.delete(row.id);
      return;
    }
    this.expanded.add(row.id);
    const name = row.backend.name;
    if (this.tableCache[name] || this.loadingTables.has(name)) return;
    this.loadingTables.add(name);
    this.api.listTables(name).subscribe(names => {
      this.tableCache[name] = names;
      this.loadingTables.delete(name);
    });
  }

  tablesOf(row: EditorRow): string[] | null {
    return this.tableCache[row.backend.name] ?? null;
  }

  /** Tables shown under a row: filtered when the list is long. */
  visibleTables(row: EditorRow): string[] {
    const all = this.tablesOf(row) ?? [];
    const q = (this.tableFilter[row.id] ?? '').trim().toLowerCase();
    return q ? all.filter(t => t.toLowerCase().includes(q)) : all;
  }

  showTableFilter(row: EditorRow): boolean {
    return (this.tablesOf(row)?.length ?? 0) > 12;
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

  /** The role's page, for per-table verbs or row filters. */
  get rolePageLink(): unknown[] | null {
    return this.roleId != null
      ? ['/api-connections/role-based-access', this.roleId]
      : null;
  }

  setLevel(row: EditorRow, level: AccessLevel): void {
    if (this.locked(row)) return;
    if (level === 'rw' && !this.allowWrites) return;
    this.levels[row.id] = level;
    if (level === 'none') {
      delete this.tables[row.id];
      this.expanded.delete(row.id);
    }
  }

  /** Per-group shortcut: read on every editable row still at no access. */
  readOnAll(kind: BackendKind): void {
    for (const row of this.rowsOf(kind)) {
      if (!this.locked(row) && (this.levels[row.id] ?? 'none') === 'none') {
        this.levels[row.id] = 'read';
      }
    }
  }

  get changes(): AccessChange[] {
    return buildAccessChanges({
      serverId: this.serviceId,
      serverLabel: this.serviceLabel,
      backends: this.backends.map(b => ({
        id: b.id as number,
        label: b.label,
      })),
      grants: {},
      specs: this.currentSpecs(),
      levels: this.levels,
      tables: this.tables,
      tableTotals: Object.fromEntries(
        this.backends
          .filter(b => this.tableCache[b.name])
          .map(b => [b.id as number, this.tableCache[b.name].length])
      ),
    });
  }

  get summary(): AccessSummary {
    return summarizeAccessChanges(this.changes, this.serviceId);
  }

  get touchesApis(): boolean {
    const s = this.summary;
    return s.read.length + s.rw.length + s.deltas.length > 0;
  }

  /** The live one-line summary that is the diff. */
  get summaryText(): string {
    const t = (key: string, params?: Record<string, unknown>) =>
      this.transloco.translate(`mcpServer.access.editor.${key}`, params);
    const s = this.summary;
    const parts: string[] = [];
    if (this.mode === 'create') {
      parts.push(t('sumCreates', { name: this.name || '…' }));
    }
    if (s.server === 'grant') parts.push(t('sumServer'));
    if (this.mode === 'edit') {
      // edit reads as a diff, one line per backend
      for (const l of s.read) parts.push(t('sumDelta.+read', { label: l }));
      for (const l of s.rw) parts.push(t('sumDelta.+rw', { label: l }));
    } else {
      if (s.read.length) parts.push(t('sumRead', { n: s.read.length }));
      if (s.rw.length) parts.push(t('sumRw', { n: s.rw.length }));
    }
    for (const d of s.deltas)
      parts.push(t('sumDelta.' + d.delta, { label: d.label }));
    if (s.listing) parts.push(t('sumListing'));
    if (this.mode === 'create' && this.createKey) parts.push(t('sumKey'));
    if (parts.length === 0) return t('sumNothing');
    return parts.join(', ');
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
    const op$ =
      this.mode === 'create'
        ? this.api
            .createRole(
              this.name.trim(),
              this.transloco.translate('mcpServer.access.createdDesc', {
                server: this.serviceLabel,
              }),
              rows
            )
            .pipe(
              switchMap(id =>
                this.createKey
                  ? this.api.createAppKey(`${this.name.trim()}_app`, id)
                  : of(null)
              )
            )
        : this.api.patchRoleAccess(this.roleId as number, rows);
    op$.subscribe({
      next: key => {
        this.saving = false;
        if (this.mode === 'create' && this.createKey) {
          this.apiKey = (key as string | null) ?? null;
          this.done = true;
        } else {
          this.saved.emit();
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

  trackByRow(_: number, row: EditorRow): number {
    return row.id;
  }
}
