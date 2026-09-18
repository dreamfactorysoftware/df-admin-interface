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
  ServiceGrant,
  accessRowsForChanges,
  buildAccessChanges,
  grantsByService,
  summarizeAccessChanges,
} from '../mcp-model';

export type AccessEditorMode = 'add' | 'edit' | 'create';

interface EditorRow {
  backend: McpBackend;
  id: number;
  grant?: ServiceGrant;
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
    const grants = grantsByService(role.rows);
    for (const b of this.backends) {
      this.levels[b.id as number] = grants[b.id as number]?.level ?? 'none';
    }
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

  private currentGrants(): Record<number, ServiceGrant> {
    return this.currentRole ? grantsByService(this.currentRole.rows) : {};
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
    const grants = this.currentGrants();
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
        grant: grants[b.id as number],
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

  /** The row is locked: the role is not picked yet, or the grant is table-limited. */
  locked(row: EditorRow): boolean {
    return (this.mode === 'add' && !this.roleId) || !!row.grant?.tableLimited;
  }

  setLevel(row: EditorRow, level: AccessLevel): void {
    if (this.locked(row)) return;
    if (level === 'rw' && !this.allowWrites) return;
    this.levels[row.id] = level;
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
      grants: this.currentGrants(),
      levels: this.levels,
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
    if (this.mode === 'create' && this.createKey) parts.push(t('sumKey'));
    if (parts.length === 0) return t('sumNothing');
    return parts.join(', ');
  }

  get canSave(): boolean {
    if (this.saving) return false;
    if (this.mode === 'add' && !this.roleId) return false;
    if (this.mode === 'create') return !!this.name.trim();
    return this.changes.some(c => c.before !== c.after);
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
