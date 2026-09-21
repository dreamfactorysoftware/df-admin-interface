/**
 * Tools tab: the single exposure + curation surface (§3) — exposed-service
 * rows with capability-group drill-ins, the Needs-attention group for
 * orphaned entries, Global tools, Custom tools, the "What an agent gets"
 * rail, the Expose-services picker and the "What an agent sees" preview
 * drawer. For `system_mcp` it renders the fixed System API catalog as two
 * capability groups with the same tri-states, fractions, rail and preview.
 *
 * All counts and derivations funnel through McpEditorStore / mcp-effective;
 * mutations go through store methods + touch(). The shell owns Save.
 */
import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DfSnackbarService } from 'src/app/shared/services/df-snackbar.service';
import {
  SYSTEM_MCP_TOOLS,
  SystemMcpTool,
} from 'src/app/adf-services/df-service-details/system-mcp-tools';
import { FormsModule } from '@angular/forms';
import {
  AGGREGATOR_TOOLS,
  GLOBAL_TOOLS,
  McpServiceKind,
  McpToolDef,
  McpVerbGroup,
  verbGroupsFor,
  verbsFor,
} from '../mcp-catalog';
import {
  EffectiveBreakdown,
  ExposedRow,
  GroupState,
  McpBackendService,
  emittedDbToolName,
  groupState,
  toolKey,
  verbReach,
} from '../mcp-effective';
import { McpEditorStore } from '../mcp-store';
import {
  DfMcpPickerComponent,
  McpPickerResult,
  applyPickerResult,
} from '../df-mcp-picker/df-mcp-picker.component';
import { DfMcpPreviewComponent } from '../df-mcp-preview/df-mcp-preview.component';
import {
  DfMcpCustomToolDialogComponent,
} from './df-mcp-custom-tool-dialog.component';
import {
  DfMcpRemoveDialogComponent,
  McpRemoveDialogResult,
} from './df-mcp-remove-dialog.component';
import { DfMcpRenameDialogComponent } from './df-mcp-rename-dialog.component';

interface SystemGroup {
  key: 'sysread' | 'sysmod';
  label: string;
  warn: boolean;
  tools: SystemMcpTool[];
}

/**
 * Read/modify split for the System API catalog: every tool whose name starts
 * with get_ or list_ only inspects state (list_services … get_access_audit).
 * Everything else — create_/update_/delete_ verbs and call_system_api, which
 * can invoke any system endpoint including writes — modifies the instance.
 */
function isSystemReadTool(t: SystemMcpTool): boolean {
  return /^(get_|list_)/.test(t.name);
}

export const PRECEDENCE_POPOVER =
  '1. Exposed services contribute their tools. 2. Minus tools you turn off. ' +
  '3. Roles filter further per caller at runtime.';

@Component({
  selector: 'df-mcp-tools',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatMenuModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTooltipModule,
  ],
  templateUrl: './df-mcp-tools.component.html',
  styleUrls: ['./df-mcp-tools.component.scss'],
})
export class DfMcpToolsComponent {
  @Input({ required: true }) store!: McpEditorStore;
  @Input() loading = false;

  readonly precedenceTooltip = PRECEDENCE_POPOVER;
  readonly allOffLine =
    'Agents see this service but can call nothing. Enable tools or remove it.';

  /** Expanded drill-ins, level-2 individual-tools disclosures, by name. */
  expanded = new Set<string>();
  toolsListOpen = new Set<string>();
  globalsOpen = false;
  customsOpen = true;
  railReachOpen = false;

  /** Filter strip + bulk selection (appear above ~8 exposed rows). */
  filterText = '';
  filterKind: 'all' | 'db' | 'file' = 'all';
  filterModified = false;
  selected = new Set<string>();

  readonly systemGroups: SystemGroup[] = [
    {
      key: 'sysread',
      label: 'Read system',
      warn: false,
      tools: SYSTEM_MCP_TOOLS.filter(isSystemReadTool),
    },
    {
      key: 'sysmod',
      label: 'Modify system',
      warn: true,
      tools: SYSTEM_MCP_TOOLS.filter(t => !isSystemReadTool(t)),
    },
  ];

  constructor(
    private dialog: MatDialog,
    private snackbar: DfSnackbarService
  ) {}

  /* ------------------------------ shared ------------------------------ */
  eff(): EffectiveBreakdown {
    return this.store.effective();
  }

  railTotal(): number {
    return this.store.isSystemMcp ? this.sysEnabledCount() : this.eff().total;
  }

  railReadOnly(): boolean {
    return this.store.isSystemMcp ? this.sysModifyOn() === 0 : this.eff().readOnly;
  }

  railWriteActive(): number {
    return this.store.isSystemMcp ? this.sysModifyOn() : this.eff().writeVerbs;
  }

  /* ------------------------------- rows ------------------------------- */
  serviceRows(): Array<{ name: string; svc: McpBackendService }> {
    return this.store
      .rows()
      .filter((r): r is { name: string; svc: McpBackendService } => !!r.svc);
  }

  orphanRows(): ExposedRow[] {
    return this.store.rows().filter(r => !r.svc);
  }

  showFilter(): boolean {
    return this.serviceRows().length > 8;
  }

  rowCountOf(kind: McpServiceKind): number {
    return this.serviceRows().filter(r => r.svc.kind === kind).length;
  }

  isModified(name: string): boolean {
    return this.store.dormantCurationCount(name) > 0;
  }

  visibleRows(): Array<{ name: string; svc: McpBackendService }> {
    let rows = this.serviceRows();
    if (!this.showFilter()) return rows;
    const q = this.filterText.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        r =>
          r.name.toLowerCase().includes(q) ||
          r.svc.label.toLowerCase().includes(q)
      );
    }
    if (this.filterKind !== 'all') {
      rows = rows.filter(r => r.svc.kind === this.filterKind);
    }
    if (this.filterModified) {
      rows = rows.filter(r => this.isModified(r.name));
    }
    return rows;
  }

  setFilterKind(kind: 'db' | 'file'): void {
    this.filterKind = this.filterKind === kind ? 'all' : kind;
  }

  typeIcon(kind: McpServiceKind): string {
    return kind === 'db' ? '⛁' : '🗂';
  }

  typeBadge(kind: McpServiceKind): string {
    return kind === 'db' ? 'Database' : 'Files';
  }

  isExpanded(name: string): boolean {
    return this.expanded.has(name);
  }

  toggleExpand(name: string): void {
    this.expanded.has(name)
      ? this.expanded.delete(name)
      : this.expanded.add(name);
  }

  isToolsListOpen(name: string): boolean {
    return this.toolsListOpen.has(name);
  }

  toggleToolsList(name: string): void {
    this.toolsListOpen.has(name)
      ? this.toolsListOpen.delete(name)
      : this.toolsListOpen.add(name);
  }

  /* --------------------------- access chip --------------------------- */
  accessKind(svc: McpBackendService): string {
    return this.store.access(svc).kind;
  }

  accessDisplay(svc: McpBackendService): string {
    const a = this.store.access(svc);
    const f = this.store.fraction(svc);
    switch (a.kind) {
      case 'full':
        return 'Full';
      case 'ro':
        return 'Read-only';
      case 'zero':
        return `0 of ${f.total} ⚠`;
      default:
        return `Custom ◐ ${f.on} of ${f.total}`;
    }
  }

  fractionText(svc: McpBackendService): string {
    const f = this.store.fraction(svc);
    return `${f.on} of ${f.total}`;
  }

  setFull(svc: McpBackendService): void {
    this.store.setServiceFull(svc);
  }

  setReadOnly(svc: McpBackendService): void {
    this.store.setServiceReadOnly(svc);
  }

  /* ---------------------------- drill-ins ---------------------------- */
  groupsFor(svc: McpBackendService): readonly McpVerbGroup[] {
    return verbGroupsFor(svc.kind);
  }

  groupStateOf(svc: McpBackendService, g: McpVerbGroup): GroupState {
    return groupState(svc, g, this.store.cfg.disabledTools);
  }

  groupOnCount(svc: McpBackendService, g: McpVerbGroup): number {
    return g.verbs.filter(v => this.store.isToolEnabled(svc.name, v.verb))
      .length;
  }

  toggleGroup(svc: McpBackendService, g: McpVerbGroup): void {
    const enable = this.groupStateOf(svc, g) !== 'on';
    for (const v of g.verbs) this.store.setTool(svc.name, v.verb, enable);
  }

  toolEnabled(svc: McpBackendService, verb: string): boolean {
    return this.store.isToolEnabled(svc.name, verb);
  }

  setToolChecked(svc: McpBackendService, verb: string, checked: boolean): void {
    this.store.setTool(svc.name, verb, checked);
  }

  emittedName(svc: McpBackendService, verb: string): string {
    const style =
      svc.kind === 'db' ? this.eff().effectiveStyle : 'prefixed';
    return emittedDbToolName(style, svc.name, verb);
  }

  verbCount(svc: McpBackendService): number {
    return verbsFor(svc.kind).length;
  }

  mergedCaption(svc: McpBackendService): string {
    return (
      'Tools are shared across your databases. Turning one off here removes ' +
      `${svc.name} from that tool's allowed services; turning it off in ` +
      'every database removes the tool.'
    );
  }

  showMergedCaption(svc: McpBackendService): boolean {
    return svc.kind === 'db' && this.store.cfg.toolStyle === 'merged';
  }

  /** Other exposed databases a db curation pattern can be copied to. */
  copyTargets(svc: McpBackendService): McpBackendService[] {
    return this.serviceRows()
      .map(r => r.svc)
      .filter(s => s.kind === 'db' && s.name !== svc.name);
  }

  /** Copy this service's disabled-verb pattern to a target (null = all). */
  copySelectionTo(source: McpBackendService, target: McpBackendService | null): void {
    const targets = target ? [target] : this.copyTargets(source);
    if (targets.length === 0) return;
    for (const t of targets) {
      for (const v of verbsFor('db')) {
        this.store.setTool(t.name, v.verb, this.store.isToolEnabled(source.name, v.verb));
      }
    }
    const label = target ? target.name : 'all exposed databases';
    this.snackbar.openSnackBar(
      `Copied ${source.name}'s tool selection to ${label}.`,
      'success'
    );
  }

  /* ------------------------------ remove ------------------------------ */
  removeServices(names: string[], orphan = false): void {
    if (names.length === 0) return;
    this.dialog
      .open(DfMcpRemoveDialogComponent, {
        data: { names, orphan },
        maxWidth: '95vw',
      })
      .afterClosed()
      .subscribe((res: McpRemoveDialogResult | undefined) => {
        if (!res) return;
        for (const n of names) this.store.removeService(n, res.clear);
        names.forEach(n => this.selected.delete(n));
        const what = names.length === 1 ? names[0] : `${names.length} services`;
        this.snackbar.openSnackBar(
          res.clear
            ? `Removed ${what} and cleared the saved tool settings.`
            : `Removed ${what} — the tool selection is kept and restores if you expose it again.`,
          'success'
        );
      });
  }

  /* ------------------------------ orphans ----------------------------- */
  orphanText(name: string): string {
    return (
      `'${name}' no longer exists on this instance (renamed or deleted). ` +
      `Its ${this.store.dormantCurationCount(name)} saved tool settings are kept.`
    );
  }

  renameOrphan(name: string): void {
    this.dialog
      .open(DfMcpRenameDialogComponent, {
        data: { store: this.store, oldName: name },
        maxWidth: '95vw',
      })
      .afterClosed()
      .subscribe((newName: string | undefined) => {
        if (!newName) return;
        this.store.renameExposedEntry(name, newName);
        this.snackbar.openSnackBar(
          `Pointed the entry at ${newName} and renamed its saved tool settings.`,
          'success'
        );
      });
  }

  /* ------------------------------ picker ------------------------------ */
  openPicker(): void {
    this.dialog
      .open(DfMcpPickerComponent, {
        data: { store: this.store },
        width: '680px',
        maxWidth: '95vw',
      })
      .afterClosed()
      .subscribe((res: McpPickerResult | undefined) => {
        if (!res || res.names.length === 0) return;
        applyPickerResult(this.store, res);
        this.snackbar.openSnackBar(
          `Exposed ${res.names.length} ${res.names.length === 1 ? 'service' : 'services'}.`,
          'success'
        );
      });
  }

  /* ------------------------------- bulk ------------------------------- */
  isSelected(name: string): boolean {
    return this.selected.has(name);
  }

  toggleSelected(name: string): void {
    this.selected.has(name)
      ? this.selected.delete(name)
      : this.selected.add(name);
  }

  private selectedServices(): McpBackendService[] {
    return this.serviceRows()
      .filter(r => this.selected.has(r.name))
      .map(r => r.svc);
  }

  bulkReadOnly(): void {
    this.selectedServices().forEach(s => this.store.setServiceReadOnly(s));
  }

  bulkFull(): void {
    this.selectedServices().forEach(s => this.store.setServiceFull(s));
  }

  bulkRemove(): void {
    this.removeServices([...this.selected]);
  }

  clearSelection(): void {
    this.selected.clear();
  }

  /* --------------------------- global tools --------------------------- */
  aggregatorsShown(): boolean {
    return this.eff().dbServices >= 2;
  }

  globalToolList(): Array<{ tool: McpToolDef; aggregator: boolean }> {
    const out = GLOBAL_TOOLS.map(tool => ({ tool, aggregator: false }));
    if (this.aggregatorsShown()) {
      for (const tool of AGGREGATOR_TOOLS) out.push({ tool, aggregator: true });
    }
    return out;
  }

  globalFractionText(): string {
    const list = this.globalToolList();
    const on = list.filter(e => this.store.isBareToolEnabled(e.tool.verb)).length;
    return `${on} of ${list.length}`;
  }

  bareEnabled(verb: string): boolean {
    return this.store.isBareToolEnabled(verb);
  }

  setBareChecked(verb: string, checked: boolean): void {
    this.store.setBareTool(verb, checked);
  }

  /* --------------------------- custom tools --------------------------- */
  customTools(): any[] {
    return this.store.cfg.customTools ?? [];
  }

  customEnabled(tool: any): boolean {
    return tool?.enabled !== false && tool?.enabled !== 0;
  }

  setCustomEnabled(tool: any, enabled: boolean): void {
    tool.enabled = enabled;
    this.store.touch();
  }

  customSummary(tool: any): string {
    if (tool?.toolType === 'function') {
      return tool?.description || 'Server-side function';
    }
    return `${tool?.httpMethod || 'GET'} ${tool?.url || ''}`.trim();
  }

  addCustomTool(): void {
    this.dialog
      .open(DfMcpCustomToolDialogComponent, {
        data: { store: this.store },
        width: '560px',
        maxWidth: '95vw',
      })
      .afterClosed()
      .subscribe(tool => {
        if (!tool) return;
        // New tools carry no id; the daemon assigns one on save.
        this.store.cfg.customTools = [...this.customTools(), tool];
        this.store.touch();
      });
  }

  editCustomTool(tool: any): void {
    this.dialog
      .open(DfMcpCustomToolDialogComponent, {
        data: { store: this.store, tool },
        width: '560px',
        maxWidth: '95vw',
      })
      .afterClosed()
      .subscribe(updated => {
        if (!updated) return;
        const i = this.customTools().indexOf(tool);
        if (i >= 0) {
          this.store.cfg.customTools = [
            ...this.customTools().slice(0, i),
            updated,
            ...this.customTools().slice(i + 1),
          ];
          this.store.touch();
        }
      });
  }

  deleteCustomTool(tool: any): void {
    const ok = window.confirm(`Delete custom tool "${tool?.name}"?`);
    if (!ok) return;
    this.store.cfg.customTools = this.customTools().filter(t => t !== tool);
    this.store.touch();
  }

  /* -------------------------------- rail ------------------------------- */
  railBreakdown(): string[] {
    if (this.store.isSystemMcp) {
      const read = this.sysGroupOn(this.systemGroups[0]);
      const mod = this.sysGroupOn(this.systemGroups[1]);
      return [`${read} read system`, `${mod} modify system`];
    }
    const e = this.eff();
    const out: string[] = [];
    if (e.dbServices > 0) {
      const shared = e.effectiveStyle === 'merged' ? 'shared set — ' : '';
      out.push(
        `${e.dbTools} database (${shared}write reaches ${e.writeReachDb} of ` +
          `${e.dbServices} ${e.dbServices === 1 ? 'database' : 'databases'})`
      );
    }
    if (e.fileServices > 0) {
      out.push(
        `${e.fileTools} file (${e.fileServices} ${e.fileServices === 1 ? 'service' : 'services'})`
      );
    }
    out.push(`${e.globalTools} global`);
    if (e.aggregators > 0) {
      out.push(`${e.aggregators} cross-database aggregators`);
    }
    if (e.customTools > 0) out.push(`${e.customTools} custom`);
    return out;
  }

  servingLine(): string | null {
    if (this.store.isSystemMcp) return null;
    const e = this.eff();
    if (!e.lazyEngaged) return null;
    return this.store.cfg.lazyMode === 'auto'
      ? 'Delivered on demand (auto): the catalog exceeds ~8k tokens, so clients first see 4 discovery tools.'
      : 'Delivered on demand (always): clients first see 4 discovery tools.';
  }

  makeReadOnly(): void {
    if (this.store.isSystemMcp) {
      const mod = this.systemGroups[1].tools.filter(t =>
        this.store.isBareToolEnabled(t.name)
      );
      const ok = window.confirm(
        `Turn off all ${mod.length} write and execute tools? You can undo until you save.`
      );
      if (!ok) return;
      mod.forEach(t => this.store.setBareTool(t.name, false));
      return;
    }
    const e = this.eff();
    const ok = window.confirm(
      `Turn off all ${e.writeVerbs} write and execute tools across ` +
        `${e.writeReach} ${e.writeReach === 1 ? 'service' : 'services'}? ` +
        'You can undo until you save.'
    );
    if (!ok) return;
    this.store.makeReadOnly();
  }

  showReach(): boolean {
    return (
      !this.store.isSystemMcp &&
      this.eff().effectiveStyle === 'merged' &&
      this.eff().dbServices > 0
    );
  }

  reachList(): Array<{ verb: string; on: number; total: number }> {
    return verbsFor('db').map(v => {
      const r = verbReach(v.verb, this.store.cfg, this.store.backendServices);
      return { verb: v.verb, on: r.on.length, total: r.total };
    });
  }

  openPreview(): void {
    this.dialog.open(DfMcpPreviewComponent, {
      data: { store: this.store },
      position: { top: '0', right: '0' },
      height: '100vh',
      width: '560px',
      maxWidth: '95vw',
      panelClass: 'mcp-preview-pane',
    });
  }

  /* ----------------------------- system_mcp ---------------------------- */
  sysEnabledCount(): number {
    return SYSTEM_MCP_TOOLS.filter(t => this.store.isBareToolEnabled(t.name))
      .length;
  }

  sysTotal(): number {
    return SYSTEM_MCP_TOOLS.length;
  }

  sysGroupOn(g: SystemGroup): number {
    return g.tools.filter(t => this.store.isBareToolEnabled(t.name)).length;
  }

  sysGroupState(g: SystemGroup): GroupState {
    const on = this.sysGroupOn(g);
    if (on === 0) return 'off';
    return on === g.tools.length ? 'on' : 'part';
  }

  sysToggleGroup(g: SystemGroup): void {
    const enable = this.sysGroupState(g) !== 'on';
    g.tools.forEach(t => this.store.setBareTool(t.name, enable));
  }

  sysModifyOn(): number {
    return this.sysGroupOn(this.systemGroups[1]);
  }
}
