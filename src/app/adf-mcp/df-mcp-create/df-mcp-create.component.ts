/**
 * Create page for MCP servers (§1.1): one screen, one decision (what agents
 * may reach). Type cards, name with live URL preview, the expose-services
 * picker with the read-only default, a live consequence line computed by
 * real simulation through the shared effective math, silent OAuth
 * provisioning, single Create button. First save navigates to the new
 * service's own edit page, Connect tab, ?created=1 (§2.1).
 */
import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  SERVICES_SERVICE_TOKEN,
  SERVICE_TYPE_SERVICE_TOKEN,
} from 'src/app/shared/constants/tokens';
import { DfBaseCrudService } from 'src/app/shared/services/df-base-crud.service';
import { DfSnackbarService } from 'src/app/shared/services/df-snackbar.service';
import {
  GenericCreateResponse,
  GenericListResponse,
} from 'src/app/shared/types/generic-http';
import { verbsFor } from '../mcp-catalog';
import {
  EffectiveBreakdown,
  McpBackendService,
  McpConfig,
  ToolStyle,
  accessState,
  effectiveTools,
  parseMcpConfig,
  readOnlyKeys,
  toBackendServices,
} from '../mcp-effective';

export type McpCreateType = 'mcp' | 'system_mcp';
export type McpCreateAccess = 'ro' | 'rw';
export type McpCreatePreset = 'alldb' | 'choose' | 'clone';

/** An existing mcp-type service offered as a clone source. */
export interface McpCloneCandidate {
  id: number;
  name: string;
  label: string;
}

interface SelectedRow {
  name: string;
  svc: McpBackendService | null;
}

@Component({
  selector: 'df-mcp-create',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatMenuModule,
    MatTooltipModule,
  ],
  templateUrl: './df-mcp-create.component.html',
  styleUrls: ['./df-mcp-create.component.scss'],
})
export class DfMcpCreateComponent implements OnInit {
  /* ------------------------------ identity ------------------------------ */
  serverType: McpCreateType = 'mcp';
  name = '';
  label = '';
  labelTouched = false;
  nameBlurred = false;
  description = '';
  showDescription = false;

  /* ------------------------------ exposure ------------------------------ */
  preset: McpCreatePreset = 'choose';
  access: McpCreateAccess = 'ro';
  selected = new Set<string>();
  q = '';

  /** Clone state: curation copied from a sibling — never credentials. */
  cloneApplied = false;
  cloneSource = '';
  clonedDisabled = new Set<string>();
  /** Explicit Read-only / Read & write click after a clone overrides the
   *  cloned curation (same precedence rule as the edit-time picker). */
  accessTouchedAfterClone = false;

  /** tool_style is invisible at create: 'merged' unless a clone copied one. */
  toolStyle: ToolStyle = 'merged';

  /* ------------------------------ instance ------------------------------ */
  backendServices: McpBackendService[] = [];
  existingNames = new Set<string>();
  mcpSiblings: McpCloneCandidate[] = [];
  instanceLoaded = false;

  saving = false;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    @Inject(SERVICES_SERVICE_TOKEN) private servicesService: DfBaseCrudService,
    @Inject(SERVICE_TYPE_SERVICE_TOKEN)
    private serviceTypeService: DfBaseCrudService,
    private snackbarService: DfSnackbarService
  ) {}

  ngOnInit(): void {
    this.loadInstance();
  }

  /**
   * One combined fetch covers everything create needs: the type→group map,
   * the db/file backend services for the picker (same query the shell
   * runs), the full name list for collision checks, and the mcp siblings
   * for the clone menu.
   */
  private loadInstance(): void {
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
        const rows: any[] = services?.resource ?? [];
        this.backendServices = toBackendServices(rows, groupMap);
        this.existingNames = new Set(rows.map(r => r.name).filter(Boolean));
        this.mcpSiblings = rows
          .filter(r => r.type === 'mcp')
          .map(r => ({ id: r.id, name: r.name, label: r.label || r.name }));
        this.instanceLoaded = true;
      },
      error: () => {
        // The page still works: collisions and the picker degrade, the
        // server enforces name uniqueness on save.
        this.instanceLoaded = true;
      },
    });
  }

  /* ------------------------------ type ------------------------------ */
  setType(t: McpCreateType): void {
    this.serverType = t;
  }

  /* ------------------------------ identity ------------------------------ */
  onNameInput(event: Event): void {
    const el = event.target as HTMLInputElement;
    this.name = el.value
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9_-]/g, '');
    // Reflect the sanitized value even when Angular sees no binding change.
    el.value = this.name;
    if (!this.labelTouched) this.label = this.labelSuggestion();
  }

  onLabelInput(event: Event): void {
    const el = event.target as HTMLInputElement;
    this.label = el.value;
    // Clearing the label hands it back to the auto-suggestion.
    this.labelTouched = el.value.length > 0;
    if (!this.labelTouched) this.label = this.labelSuggestion();
  }

  onDescriptionInput(event: Event): void {
    this.description = (event.target as HTMLTextAreaElement).value;
  }

  labelSuggestion(): string {
    return this.name
      .split(/[_-]+/)
      .filter(Boolean)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  get urlPreview(): string {
    return `${window.location.origin}/mcp/${this.name || '…'}`;
  }

  nameTaken(): boolean {
    return this.name !== '' && this.existingNames.has(this.name);
  }

  /* ------------------------------ picker ------------------------------ */
  private matches(s: McpBackendService): boolean {
    const q = this.q.trim().toLowerCase();
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) || s.label.toLowerCase().includes(q)
    );
  }

  dbAll(): McpBackendService[] {
    return this.backendServices.filter(s => s.kind === 'db');
  }

  fileAll(): McpBackendService[] {
    return this.backendServices.filter(s => s.kind === 'file');
  }

  dbFiltered(): McpBackendService[] {
    return this.dbAll().filter(s => this.matches(s));
  }

  fileFiltered(): McpBackendService[] {
    return this.fileAll().filter(s => this.matches(s));
  }

  emptySearch(): boolean {
    return (
      this.q.trim().length > 0 &&
      this.dbFiltered().length === 0 &&
      this.fileFiltered().length === 0
    );
  }

  toolDelta(svc: McpBackendService): string {
    return `+${verbsFor(svc.kind).length} tools`;
  }

  isSelected(name: string): boolean {
    return this.selected.has(name);
  }

  toggle(name: string): void {
    this.selected.has(name)
      ? this.selected.delete(name)
      : this.selected.add(name);
    if (this.preset === 'alldb') this.preset = 'choose';
  }

  groupAllSelected(group: McpBackendService[]): boolean {
    return group.length > 0 && group.every(s => this.selected.has(s.name));
  }

  groupSomeSelected(group: McpBackendService[]): boolean {
    const n = group.filter(s => this.selected.has(s.name)).length;
    return n > 0 && n < group.length;
  }

  toggleGroup(group: McpBackendService[]): void {
    const all = this.groupAllSelected(group);
    for (const s of group) {
      all ? this.selected.delete(s.name) : this.selected.add(s.name);
    }
  }

  selectedList(): SelectedRow[] {
    return [...this.selected].map(name => ({
      name,
      svc: this.backendServices.find(s => s.name === name) ?? null,
    }));
  }

  /** Per-row access chip, derived from the real compiled disabled set. */
  accessLabelFor(row: SelectedRow): string {
    if (!row.svc) return '';
    const st = accessState(row.svc, this.compiledDisabledTools());
    return st.kind === 'full' ? 'Full access' : st.label;
  }

  accessKindFor(row: SelectedRow): string {
    if (!row.svc) return '';
    return accessState(row.svc, this.compiledDisabledTools()).kind;
  }

  /* ------------------------------ presets ------------------------------ */
  presetAllDb(): void {
    this.selected = new Set(this.dbAll().map(s => s.name));
    this.access = 'ro';
    this.cloneApplied = false;
    this.preset = 'alldb';
  }

  presetChoose(): void {
    this.cloneApplied = false;
    this.preset = 'choose';
  }

  pickClone(sibling: McpCloneCandidate): void {
    this.servicesService.get<any>(sibling.id).subscribe({
      next: row => {
        const cfg = parseMcpConfig(row?.config);
        // Copy exposure + curation + naming style. Never credentials.
        this.selected = new Set(cfg.exposedServices);
        this.clonedDisabled = new Set(cfg.disabledTools);
        this.toolStyle = cfg.toolStyle ?? 'merged';
        this.cloneApplied = true;
        this.cloneSource = sibling.label || sibling.name;
        this.accessTouchedAfterClone = false;
        this.preset = 'clone';
      },
      error: () =>
        this.snackbarService.openSnackBar(
          `Could not load ${sibling.name}'s configuration.`,
          'error'
        ),
    });
  }

  setAccess(a: McpCreateAccess): void {
    this.access = a;
    this.accessTouchedAfterClone = true;
  }

  /* --------------------- the one simulation path --------------------- */
  /**
   * The disabled_tools set the server would be created with right now.
   * Read-only compiles the write/execute verbs of every selected service;
   * an untouched clone keeps the cloned curation verbatim.
   */
  compiledDisabledTools(): Set<string> {
    if (this.serverType === 'system_mcp') return new Set();
    if (this.cloneApplied && !this.accessTouchedAfterClone) {
      return new Set(this.clonedDisabled);
    }
    if (this.access === 'ro') {
      const out = new Set<string>();
      for (const name of this.selected) {
        const svc = this.backendServices.find(s => s.name === name);
        if (svc) readOnlyKeys(svc).forEach(k => out.add(k));
      }
      return out;
    }
    return new Set();
  }

  draftConfig(): McpConfig {
    const cfg = parseMcpConfig({});
    cfg.exposedServices = [...this.selected];
    cfg.disabledTools = this.compiledDisabledTools();
    cfg.toolStyle = this.toolStyle;
    cfg.lazyMode = 'auto';
    cfg.allowApiKeyAuth = false;
    return cfg;
  }

  breakdown(): EffectiveBreakdown {
    return effectiveTools(this.draftConfig(), this.backendServices);
  }

  consequenceMain(): string {
    if (this.serverType === 'system_mcp') {
      return 'Agents will get the 18 System API admin tools.';
    }
    const b = this.breakdown();
    if (this.selected.size === 0) {
      return `Agents will get global tools only (${b.globalTools}) — no data access.`;
    }
    const parts: string[] = [];
    if (b.dbServices > 0) {
      parts.push(
        `${b.dbTools} database (shared set across ${b.dbServices} ` +
          `${b.dbServices === 1 ? 'service' : 'services'})`
      );
    }
    if (b.fileServices > 0) parts.push(`${b.fileTools} file`);
    parts.push(`${b.globalTools} global`);
    let line = `Agents will get ${b.total} tools: ${parts.join(' · ')}.`;
    if (b.readOnly) line += ' Write tools are off.';
    return line;
  }

  showEmptyBold(): boolean {
    return this.serverType === 'mcp' && this.selected.size === 0;
  }

  /* ------------------------------ save ------------------------------ */
  canSubmit(): boolean {
    return !this.saving && this.name.length > 0 && !this.nameTaken();
  }

  submit(): void {
    if (!this.canSubmit()) return;
    this.saving = true;
    // camelCase keys — the HTTP case interceptor snake_cases them on the
    // wire, exactly like the legacy editor's form payload. OAuth fields are
    // deliberately absent: the backend seeds client id/secret itself.
    const config =
      this.serverType === 'mcp'
        ? {
            exposedServices: [...this.selected],
            disabledTools: [...this.compiledDisabledTools()].sort(),
            toolStyle: this.toolStyle,
            lazyMode: 'auto',
            allowApiKeyAuth: false,
          }
        : {};
    this.servicesService
      .create<GenericCreateResponse>({
        resource: [
          {
            name: this.name,
            label: this.label || this.name,
            description: this.description,
            isActive: true,
            type: this.serverType,
            config,
          },
        ],
      })
      .subscribe({
        next: res => {
          this.saving = false;
          const newId = res?.resource?.[0]?.id;
          if (newId != null) {
            // §2.1: land on the new server's own Connect tab, first-run.
            this.router.navigate(['../', newId], {
              relativeTo: this.activatedRoute,
              queryParams: { created: 1 },
            });
          } else {
            this.router.navigate(['../'], {
              relativeTo: this.activatedRoute,
            });
          }
        },
        error: err => {
          this.saving = false;
          this.snackbarService.openSnackBar(
            err?.error?.error?.message ?? 'Create failed.',
            'error'
          );
        },
      });
  }

  cancel(): void {
    this.router.navigate(['../'], { relativeTo: this.activatedRoute });
  }
}
