/**
 * Remove-from-server confirm (§3.8 rule 2): a default-safe radio choice —
 * "Keep its tool curation (recommended)" (default) vs "Also clear its saved
 * tool settings". Used for single rows, orphaned entries and bulk removal.
 * Returns { clear: boolean } or undefined on cancel.
 */
import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatRadioModule } from '@angular/material/radio';

export interface McpRemoveDialogData {
  names: string[];
  /** True when the entry no longer matches a live service. */
  orphan?: boolean;
}

export interface McpRemoveDialogResult {
  clear: boolean;
}

@Component({
  selector: 'df-mcp-remove-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatDialogModule, MatRadioModule],
  template: `
    <div class="mcp-remove-dialog">
      <h2>{{ title }}</h2>
      <mat-radio-group [(ngModel)]="clear" class="mcp-remove-choices">
        <mat-radio-button [value]="false">
          {{ data.names.length === 1 ? 'Keep its tool curation (recommended)' : 'Keep their tool curation (recommended)' }}
        </mat-radio-button>
        <mat-radio-button [value]="true">
          {{ data.names.length === 1 ? 'Also clear its saved tool settings' : 'Also clear their saved tool settings' }}
        </mat-radio-button>
      </mat-radio-group>
      <p class="mcp-remove-note">
        Kept curation restores automatically if you expose
        {{ data.names.length === 1 ? 'the service' : 'a service' }} again.
      </p>
      <div class="mcp-remove-actions">
        <button mat-button type="button" (click)="dialogRef.close()">Cancel</button>
        <button
          mat-flat-button
          color="warn"
          type="button"
          data-testid="mcp-remove-confirm"
          (click)="dialogRef.close({ clear })">
          Remove from server
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .mcp-remove-dialog {
        padding: 18px 20px 14px;
        font-family: Inter, 'Helvetica Neue', sans-serif;
        max-width: 420px;
      }
      h2 {
        margin: 0 0 10px;
        font-size: 16px;
        font-weight: 700;
      }
      .mcp-remove-choices {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .mcp-remove-note {
        font-size: 12.5px;
        opacity: 0.7;
        margin: 8px 0 0;
      }
      .mcp-remove-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 14px;
      }
    `,
  ],
})
export class DfMcpRemoveDialogComponent {
  clear = false;

  constructor(
    public dialogRef: MatDialogRef<DfMcpRemoveDialogComponent, McpRemoveDialogResult>,
    @Inject(MAT_DIALOG_DATA) public data: McpRemoveDialogData
  ) {}

  get title(): string {
    return this.data.names.length === 1
      ? `Remove ${this.data.names[0]} from this server?`
      : `Remove ${this.data.names.length} services from this server?`;
  }
}
