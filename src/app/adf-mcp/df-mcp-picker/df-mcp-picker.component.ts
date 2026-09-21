/**
 * "Expose services" picker dialog (§3.6) — search-to-add over the not-yet-
 * exposed backend services, grouped Databases / File storage with per-group
 * select-all, a default-Read-only access control, and a running consequence
 * line computed by simulating the selection against the shared effective
 * math. The dialog never mutates the store; it returns an McpPickerResult
 * that the Tools tab applies through applyPickerResult().
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
import { MatRadioModule } from '@angular/material/radio';
import { verbsFor } from '../mcp-catalog';
import {
  McpBackendService,
  McpConfig,
  allKeys,
  effectiveTools,
  readOnlyKeys,
} from '../mcp-effective';
import { McpEditorStore } from '../mcp-store';

export type McpPickerAccess = 'ro' | 'rw';

export interface McpPickerResult {
  names: string[];
  access: McpPickerAccess;
  /** True when the admin explicitly clicked an access option. */
  accessTouched: boolean;
}

export interface McpPickerData {
  store: McpEditorStore;
}

function clonePickerCfg(c: McpConfig): McpConfig {
  return {
    ...c,
    exposedServices: [...c.exposedServices],
    disabledTools: new Set(c.disabledTools),
    redirectUris: [...c.redirectUris],
    customTools: (c.customTools ?? []).map((t: any) => ({ ...t })),
    rest: { ...c.rest },
  };
}

/**
 * Dormant-curation precedence (documented decision): a service with saved
 * (dormant) disabled_tools keys re-applies that curation when re-exposed —
 * UNLESS the admin explicitly clicked an access option in this dialog, in
 * which case the explicit Read-only / Read & write choice overrides the
 * dormant curation. The pre-selected "Read-only — recommended" default does
 * NOT count as an explicit choice, so the migration-safety rule ("re-exposing
 * restores prior curation exactly", §3.8 rule 3) holds on the default path.
 */
export function pickerKeepNames(
  store: McpEditorStore,
  names: string[],
  accessTouched: boolean
): Set<string> {
  const keep = new Set<string>();
  if (accessTouched) return keep;
  for (const n of names) {
    if (store.dormantCurationCount(n) > 0) keep.add(n);
  }
  return keep;
}

/** Simulate the selection and return the resulting effective tool count. */
export function simulateExposeTotal(
  store: McpEditorStore,
  names: string[],
  access: McpPickerAccess,
  accessTouched: boolean
): number {
  const cfg = clonePickerCfg(store.cfg);
  const keep = pickerKeepNames(store, names, accessTouched);
  for (const name of names) {
    if (!cfg.exposedServices.includes(name)) cfg.exposedServices.push(name);
    const svc = store.backendServices.find(s => s.name === name);
    if (!svc || keep.has(name)) continue;
    allKeys(svc).forEach(k => cfg.disabledTools.delete(k));
    if (access === 'ro') readOnlyKeys(svc).forEach(k => cfg.disabledTools.add(k));
  }
  return effectiveTools(cfg, store.backendServices).total;
}

/** Apply a confirmed picker result to the store (same rules the simulation used). */
export function applyPickerResult(store: McpEditorStore, res: McpPickerResult): void {
  const keep = pickerKeepNames(store, res.names, res.accessTouched);
  const applied = res.names.filter(n => !keep.has(n));
  if (applied.length) store.exposeServices(applied, res.access);
  if (keep.size) store.exposeServices([...keep], 'keep');
}

@Component({
  selector: 'df-mcp-picker',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatRadioModule,
  ],
  templateUrl: './df-mcp-picker.component.html',
  styleUrls: ['./df-mcp-picker.component.scss'],
})
export class DfMcpPickerComponent {
  q = '';
  access: McpPickerAccess = 'ro';
  accessTouched = false;
  selected = new Set<string>();

  constructor(
    public dialogRef: MatDialogRef<DfMcpPickerComponent, McpPickerResult>,
    @Inject(MAT_DIALOG_DATA) public data: McpPickerData
  ) {}

  get store(): McpEditorStore {
    return this.data.store;
  }

  /** Only not-yet-exposed services are listed. */
  candidates(): McpBackendService[] {
    return this.store.backendServices.filter(
      s => !this.store.cfg.exposedServices.includes(s.name)
    );
  }

  private matches(s: McpBackendService): boolean {
    const q = this.q.trim().toLowerCase();
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) || s.label.toLowerCase().includes(q)
    );
  }

  dbCandidates(): McpBackendService[] {
    return this.candidates().filter(s => s.kind === 'db' && this.matches(s));
  }

  fileCandidates(): McpBackendService[] {
    return this.candidates().filter(s => s.kind === 'file' && this.matches(s));
  }

  toolDelta(svc: McpBackendService): string {
    return `+${verbsFor(svc.kind).length} tools`;
  }

  dormantCount(svc: McpBackendService): number {
    return this.store.dormantCurationCount(svc.name);
  }

  isSelected(name: string): boolean {
    return this.selected.has(name);
  }

  toggle(name: string): void {
    this.selected.has(name)
      ? this.selected.delete(name)
      : this.selected.add(name);
  }

  markAccessTouched(): void {
    this.accessTouched = true;
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

  accessLabel(): string {
    return this.access === 'ro' ? 'read-only' : 'read & write';
  }

  consequenceText(): string {
    const k = this.selected.size;
    const old = effectiveTools(this.store.cfg, this.store.backendServices).total;
    const next = simulateExposeTotal(
      this.store,
      [...this.selected],
      this.access,
      this.accessTouched
    );
    return `${k} selected · ${this.accessLabel()} → server will serve ${next} tools (was ${old})`;
  }

  emptySearch(): boolean {
    return (
      this.q.trim().length > 0 &&
      this.dbCandidates().length === 0 &&
      this.fileCandidates().length === 0
    );
  }

  confirm(): void {
    if (this.selected.size === 0) return;
    this.dialogRef.close({
      names: [...this.selected],
      access: this.access,
      accessTouched: this.accessTouched,
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
