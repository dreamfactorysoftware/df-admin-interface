/**
 * "It was renamed…" successor picker (§7): repoints an orphaned
 * exposed_services entry at a live service and previews the disabled_tools
 * key rewrite before confirming. Returns the chosen successor name; the
 * caller performs store.renameExposedEntry().
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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { McpBackendService } from '../mcp-effective';
import { McpEditorStore } from '../mcp-store';

export interface McpRenameDialogData {
  store: McpEditorStore;
  oldName: string;
}

@Component({
  selector: 'df-mcp-rename-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
  ],
  template: `
    <div class="mcp-rename-dialog">
      <h2>Point this entry at its renamed service</h2>
      <p class="mcp-rename-intro">
        “{{ data.oldName }}” no longer exists on this instance. Pick the
        service it was renamed to.
      </p>
      <mat-form-field appearance="outline" class="mcp-rename-field">
        <mat-label>Renamed to</mat-label>
        <mat-select [(ngModel)]="newName" data-testid="mcp-rename-select">
          <mat-option *ngFor="let svc of candidates()" [value]="svc.name">
            {{ svc.label }} ({{ svc.name }})
          </mat-option>
        </mat-select>
      </mat-form-field>
      <p class="mcp-rename-preview" *ngIf="newName">
        Point this entry at {{ newName }} and rename its {{ keyCount() }} saved
        tool settings ({{ data.oldName }}_* → {{ newName }}_*)?
      </p>
      <div class="mcp-rename-actions">
        <button mat-button type="button" (click)="dialogRef.close()">Cancel</button>
        <button
          mat-flat-button
          color="primary"
          type="button"
          data-testid="mcp-rename-confirm"
          [disabled]="!newName"
          (click)="dialogRef.close(newName)">
          Rename entry
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .mcp-rename-dialog {
        padding: 18px 20px 14px;
        font-family: Inter, 'Helvetica Neue', sans-serif;
        max-width: 440px;
      }
      h2 {
        margin: 0 0 8px;
        font-size: 16px;
        font-weight: 700;
      }
      .mcp-rename-intro {
        font-size: 13px;
        opacity: 0.8;
        margin: 0 0 12px;
      }
      .mcp-rename-field {
        width: 100%;
      }
      .mcp-rename-preview {
        font-size: 13px;
        background: #fdf3dc;
        border: 1px solid rgba(154, 103, 0, 0.4);
        border-radius: 8px;
        padding: 8px 12px;
        margin: 0 0 4px;
      }
      .mcp-rename-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 12px;
      }
    `,
  ],
})
export class DfMcpRenameDialogComponent {
  newName: string | undefined = undefined;

  constructor(
    public dialogRef: MatDialogRef<DfMcpRenameDialogComponent, string>,
    @Inject(MAT_DIALOG_DATA) public data: McpRenameDialogData
  ) {}

  /** Live services not already carried by another exposed entry. */
  candidates(): McpBackendService[] {
    return this.data.store.backendServices.filter(
      s => !this.data.store.cfg.exposedServices.includes(s.name)
    );
  }

  keyCount(): number {
    return this.data.store.dormantCurationCount(this.data.oldName);
  }
}
