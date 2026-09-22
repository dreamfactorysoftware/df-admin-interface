/**
 * Housekeeping review dialog (§6.4): itemized, review-before-delete flow for
 * orphaned disabled_tools keys. Lists the exact keys with a best-guess origin
 * service, all pre-checked; only [Delete selected] removes anything, and it
 * returns the checked keys — the Settings tab applies the removal to the
 * draft config. Cancel (or ✕) returns undefined and deletes nothing.
 */
import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { DB_VERB_GROUPS, FILE_VERB_GROUPS } from '../mcp-catalog';

export interface McpHousekeepingDialogData {
  /** The exact orphaned disabled_tools keys, from store.orphans(). */
  keys: string[];
}

/** All bare verbs a key could end with, longest first so the greediest
 *  suffix wins (e.g. `_get_table_data` before any shorter overlap). */
const KNOWN_VERBS: string[] = [...DB_VERB_GROUPS, ...FILE_VERB_GROUPS]
  .flatMap(g => g.verbs.map(v => v.verb))
  .sort((a, b) => b.length - a.length);

/** Best-guess origin service for an orphaned `{service}_{verb}` key. */
export function guessOrigin(key: string): string | null {
  for (const verb of KNOWN_VERBS) {
    if (key.endsWith('_' + verb) && key.length > verb.length + 1) {
      return key.slice(0, key.length - verb.length - 1);
    }
  }
  return null;
}

@Component({
  selector: 'df-mcp-housekeeping-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCheckboxModule, MatDialogModule],
  template: `
    <div class="mcp-hk-dialog" data-testid="mcp-housekeeping-dialog">
      <h2>Review &amp; clean up</h2>
      <p class="mcp-hk-note">
        These saved tool settings reference services that no longer exist.
        Checked entries are deleted; unchecked entries are kept.
      </p>
      <ul class="mcp-hk-list">
        <li *ngFor="let key of data.keys">
          <mat-checkbox
            [checked]="checked[key]"
            (change)="toggle(key, $event.checked)"
            [attr.data-testid]="'mcp-orphan-' + key">
            <code>{{ key }}</code>
            <span class="mcp-hk-origin" *ngIf="originOf(key) as origin">
              — from “{{ origin }}”?
            </span>
          </mat-checkbox>
        </li>
      </ul>
      <div class="mcp-hk-actions">
        <button mat-button type="button" (click)="dialogRef.close()">
          Cancel
        </button>
        <button
          mat-flat-button
          color="warn"
          type="button"
          [disabled]="selected.length === 0"
          data-testid="mcp-housekeeping-delete"
          (click)="deleteSelected()">
          Delete selected
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .mcp-hk-dialog {
        padding: 18px 20px 14px;
        font-family: Inter, 'Helvetica Neue', sans-serif;
        max-width: 460px;
      }
      h2 {
        margin: 0 0 8px;
        font-size: 16px;
        font-weight: 700;
      }
      .mcp-hk-note {
        font-size: 13px;
        opacity: 0.75;
        margin: 0 0 10px;
      }
      .mcp-hk-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        max-height: 320px;
        overflow-y: auto;
      }
      .mcp-hk-list code {
        font-size: 12.5px;
        background: color-mix(in srgb, var(--df-text) 3.5%, transparent);
        border: 1px solid color-mix(in srgb, var(--df-text) 8%, transparent);
        border-radius: 5px;
        padding: 1px 6px;
        word-break: break-all;
      }
      .mcp-hk-origin {
        font-size: 12px;
        opacity: 0.6;
        margin-left: 4px;
      }
      .mcp-hk-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 14px;
      }
    `,
  ],
})
export class DfMcpHousekeepingDialogComponent {
  /** Selection state; every key starts checked (§6.4). */
  checked: Record<string, boolean> = {};

  constructor(
    public dialogRef: MatDialogRef<DfMcpHousekeepingDialogComponent, string[]>,
    @Inject(MAT_DIALOG_DATA) public data: McpHousekeepingDialogData
  ) {
    for (const k of data.keys) this.checked[k] = true;
  }

  toggle(key: string, value: boolean): void {
    this.checked[key] = value;
  }

  get selected(): string[] {
    return this.data.keys.filter(k => this.checked[k]);
  }

  originOf(key: string): string | null {
    return guessOrigin(key);
  }

  deleteSelected(): void {
    this.dialogRef.close(this.selected);
  }
}
