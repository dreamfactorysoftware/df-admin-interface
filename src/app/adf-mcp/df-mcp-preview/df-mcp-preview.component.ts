/**
 * "What an agent sees" preview drawer (§3.7) — the exact final list a
 * client's tools/list returns, grouped by origin, with an always-present
 * Excluded section that names WHY every absent thing is absent, a
 * First response / Full catalog switch when lazy delivery engages, and a
 * Copy tools/list JSON audit export. Read-only: it never mutates the store.
 *
 * Opened as a right-side sheet (MatDialog positioned right, full height).
 * Handles both service types: `mcp` derives from the shared effective math,
 * `system_mcp` applies the same math to the fixed System API catalog.
 */
import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatRadioModule } from '@angular/material/radio';
import { FormsModule } from '@angular/forms';
import { DfSnackbarService } from 'src/app/shared/services/df-snackbar.service';
import { SYSTEM_MCP_TOOLS } from 'src/app/adf-services/df-service-details/system-mcp-tools';
import {
  AGGREGATOR_TOOLS,
  GLOBAL_TOOLS,
  LAZY_AUTO_TOKEN_THRESHOLD,
  LAZY_FACADE_TOOLS,
  TOKENS_PER_TOOL,
  WRITE_GROUP_KEYS,
  verbGroupsFor,
  verbsFor,
} from '../mcp-catalog';
import {
  McpBackendService,
  emittedDbToolName,
  groupState,
  toolKey,
  verbReach,
} from '../mcp-effective';
import { McpEditorStore } from '../mcp-store';

export interface McpPreviewData {
  store: McpEditorStore;
}

interface PreviewItem {
  name: string;
  description: string;
  /** e.g. the merged enum line "service: crm, hr (2 of 3)". */
  meta?: string;
}

interface PreviewGroup {
  label: string;
  items: PreviewItem[];
}

interface ExcludedItem {
  name: string;
  reason: string;
}

@Component({
  selector: 'df-mcp-preview',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatRadioModule,
  ],
  templateUrl: './df-mcp-preview.component.html',
  styleUrls: ['./df-mcp-preview.component.scss'],
})
export class DfMcpPreviewComponent implements OnInit {
  groups: PreviewGroup[] = [];
  excluded: ExcludedItem[] = [];
  total = 0;
  tokenEstimate = 0;
  lazyEngaged = false;
  lazyAuto = true;
  /** 'first' = the lazy discovery facade; 'full' = the whole catalog. */
  view: 'first' | 'full' = 'full';

  constructor(
    public dialogRef: MatDialogRef<DfMcpPreviewComponent>,
    @Inject(MAT_DIALOG_DATA) public data: McpPreviewData,
    private snackbar: DfSnackbarService
  ) {}

  get store(): McpEditorStore {
    return this.data.store;
  }

  ngOnInit(): void {
    this.store.isSystemMcp ? this.buildSystem() : this.buildMcp();
    if (this.lazyEngaged) this.view = 'first';
  }

  /* ------------------------------ mcp ------------------------------ */
  private buildMcp(): void {
    const s = this.store;
    const cfg = s.cfg;
    const disabled = cfg.disabledTools;
    const eff = s.effective();
    const style = eff.effectiveStyle;
    const rows = s.rows();
    const liveRows = rows.filter(
      (r): r is { name: string; svc: McpBackendService } => !!r.svc
    );
    const activeDbs = liveRows
      .map(r => r.svc)
      .filter(v => v.active && v.kind === 'db');
    const activeFiles = liveRows
      .map(r => r.svc)
      .filter(v => v.active && v.kind === 'file');

    // Global group: always-served globals + aggregators when 2+ active dbs.
    const globalItems: PreviewItem[] = GLOBAL_TOOLS.filter(
      t => !disabled.has(t.verb)
    ).map(t => ({ name: t.verb, description: t.description }));
    if (activeDbs.length >= 2) {
      for (const t of AGGREGATOR_TOOLS) {
        if (!disabled.has(t.verb)) {
          globalItems.push({ name: t.verb, description: t.description });
        }
      }
    }
    this.groups.push({ label: `Global (${globalItems.length})`, items: globalItems });

    // Database group.
    const dbItems: PreviewItem[] = [];
    if (activeDbs.length > 0) {
      if (style === 'merged') {
        for (const v of verbsFor('db')) {
          const reach = verbReach(v.verb, cfg, s.backendServices);
          if (reach.on.length === 0) continue;
          dbItems.push({
            name: v.verb,
            description: v.description,
            meta: `service: ${reach.on.join(', ')} (${reach.on.length} of ${reach.total})`,
          });
        }
        this.groups.push({
          label: `Database — consolidated, service argument (${dbItems.length})`,
          items: dbItems,
        });
      } else {
        for (const db of activeDbs) {
          for (const v of verbsFor('db')) {
            if (!disabled.has(toolKey(db.name, v.verb))) {
              dbItems.push({
                name: emittedDbToolName('prefixed', db.name, v.verb),
                description: v.description,
              });
            }
          }
        }
        this.groups.push({
          label: `Database (${dbItems.length})`,
          items: dbItems,
        });
      }
    }

    // File group (always per-service names).
    const fileItems: PreviewItem[] = [];
    for (const f of activeFiles) {
      for (const v of verbsFor('file')) {
        if (!disabled.has(toolKey(f.name, v.verb))) {
          fileItems.push({
            name: toolKey(f.name, v.verb),
            description: v.description,
          });
        }
      }
    }
    if (activeFiles.length > 0) {
      this.groups.push({ label: `File (${fileItems.length})`, items: fileItems });
    }

    // Custom group.
    const customItems: PreviewItem[] = (cfg.customTools ?? [])
      .filter((t: any) => t?.enabled !== false && t?.enabled !== 0)
      .map((t: any) => ({
        name: t.name ?? '',
        description: t.description ?? '',
      }));
    if (customItems.length > 0) {
      this.groups.push({
        label: `Custom (${customItems.length})`,
        items: customItems,
      });
    }

    /* ----------------------- Excluded — always present ----------------------- */
    // 1. Not exposed (aggregate).
    const unexposed = s.backendServices.filter(
      b => !cfg.exposedServices.includes(b.name)
    );
    if (unexposed.length > 0) {
      const names = unexposed.map(u => u.name);
      const shown = names.slice(0, 3).join(', ');
      const more = names.length > 3 ? `, +${names.length - 3} more` : '';
      this.excluded.push({ name: shown + more, reason: 'not exposed' });
    }
    // 2. Inactive exposed services.
    for (const r of liveRows) {
      if (!r.svc.active) {
        this.excluded.push({ name: r.name, reason: 'service inactive' });
      }
    }
    // 3. Orphans — exposed entries matching no live service.
    for (const r of rows) {
      if (!r.svc) {
        this.excluded.push({
          name: r.name,
          reason: 'no service with this name exists',
        });
      }
    }
    // 4. Curation: whole groups off per service; loose per-tool offs (prefixed).
    for (const r of liveRows) {
      if (!r.svc.active) continue;
      for (const g of verbGroupsFor(r.svc.kind)) {
        const st = groupState(r.svc, g, disabled);
        if (st === 'off') {
          this.excluded.push({
            name: `${r.name} · ${g.label.toLowerCase()}`,
            reason: 'turned off by you',
          });
        } else if (st === 'part' && (style === 'prefixed' || r.svc.kind === 'file')) {
          for (const v of g.verbs) {
            if (disabled.has(toolKey(r.name, v.verb))) {
              this.excluded.push({
                name: toolKey(r.name, v.verb),
                reason: 'turned off by you',
              });
            }
          }
        }
      }
    }
    // 5. Merged: verbs off in every exposed database.
    if (style === 'merged' && activeDbs.length > 0) {
      for (const v of verbsFor('db')) {
        const reach = verbReach(v.verb, cfg, s.backendServices);
        if (reach.on.length === 0) {
          this.excluded.push({
            name: v.verb,
            reason: 'turned off in every exposed database',
          });
        }
      }
    }
    // 6. Aggregators absent below two databases.
    if (activeDbs.length < 2) {
      this.excluded.push({
        name: 'cross-database aggregators',
        reason: 'served only with two or more databases',
      });
    }
    // 7. Disabled globals / aggregators (bare names).
    for (const t of GLOBAL_TOOLS) {
      if (disabled.has(t.verb)) {
        this.excluded.push({ name: t.verb, reason: 'turned off by you' });
      }
    }
    if (activeDbs.length >= 2) {
      for (const t of AGGREGATOR_TOOLS) {
        if (disabled.has(t.verb)) {
          this.excluded.push({ name: t.verb, reason: 'turned off by you' });
        }
      }
    }
    // 8. Disabled custom tools.
    for (const t of cfg.customTools ?? []) {
      if (t?.enabled === false || t?.enabled === 0) {
        this.excluded.push({
          name: t.name ?? '',
          reason: 'turned off by you',
        });
      }
    }

    this.total = eff.total;
    this.tokenEstimate = eff.tokenEstimate;
    this.lazyEngaged = eff.lazyEngaged;
    this.lazyAuto = cfg.lazyMode === 'auto';
  }

  /* --------------------------- system_mcp --------------------------- */
  private buildSystem(): void {
    const s = this.store;
    const disabled = s.cfg.disabledTools;
    const served = SYSTEM_MCP_TOOLS.filter(t => !disabled.has(t.name));
    this.groups.push({
      label: `System API (${served.length})`,
      items: served.map(t => ({ name: t.name, description: t.description })),
    });
    for (const t of SYSTEM_MCP_TOOLS) {
      if (disabled.has(t.name)) {
        this.excluded.push({ name: t.name, reason: 'turned off by you' });
      }
    }
    this.total = served.length;
    this.tokenEstimate = this.total * TOKENS_PER_TOOL;
    const lm = s.cfg.lazyMode;
    this.lazyAuto = lm === 'auto';
    this.lazyEngaged =
      lm === 'always' ||
      lm === true ||
      (lm === 'auto' && this.tokenEstimate > LAZY_AUTO_TOKEN_THRESHOLD);
  }

  /* ------------------------------ view ------------------------------ */
  firstResponseItems(): PreviewItem[] {
    return LAZY_FACADE_TOOLS.map(t => ({
      name: t.verb,
      description: t.description,
    }));
  }

  visibleGroups(): PreviewGroup[] {
    if (this.lazyEngaged && this.view === 'first') {
      return [
        {
          label: `First response — discovery tools (${LAZY_FACADE_TOOLS.length})`,
          items: this.firstResponseItems(),
        },
      ];
    }
    return this.groups;
  }

  tokenLabel(): string {
    return `~${(this.tokenEstimate / 1000).toFixed(1)}k tokens of definitions`;
  }

  lazyLabel(): string {
    if (!this.lazyEngaged) return 'Lazy loading: not engaged';
    return this.lazyAuto
      ? 'Lazy loading: engaged (auto)'
      : 'Lazy loading: engaged';
  }

  copyJson(): void {
    const list = this.visibleGroups()
      .flatMap(g => g.items)
      .map(i => ({ name: i.name, description: i.description }));
    const json = JSON.stringify(list, null, 2);
    navigator.clipboard?.writeText(json).catch(() => undefined);
    this.snackbar.openSnackBar('tools/list JSON copied.', 'success');
  }

  close(): void {
    this.dialogRef.close();
  }
}
