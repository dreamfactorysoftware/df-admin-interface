import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ApiBuilderPreviewTrace {
  key: string;
  type?: string;
  service?: string;
  resource?: string;
  method?: string;
  ok?: boolean;
  preview?: string;
  error?: string;
  ms?: number;
}

@Component({
  selector: 'df-api-builder-preview',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <aside class="preview-card">
      <div class="preview-heading">
        <span>
          <strong>Response preview</strong>
          <small>What API consumers will receive</small>
        </span>
        <button
          mat-stroked-button
          type="button"
          [disabled]="!canPreview || previewing"
          (click)="previewRequested.emit()">
          <mat-icon>play_arrow</mat-icon>
          {{ previewResult ? 'Refresh' : 'Run preview' }}
        </button>
      </div>

      <div class="route-summary">
        <mat-icon>route</mat-icon>
        <span>
          <strong>{{ routeLabel }}</strong>
          <small>{{ sourceSummary }}</small>
        </span>
      </div>

      <div class="contract-summary" *ngIf="canPreview">
        <div>
          <span>Fields</span>
          <strong>{{ fieldNames.length }}</strong>
        </div>
        <div>
          <span>Related datasets</span>
          <strong>{{ relationshipNames.length }}</strong>
        </div>
      </div>

      <div class="contract-tags" *ngIf="fieldNames.length">
        <span *ngFor="let field of fieldNames | slice: 0 : 8">{{ field }}</span>
        <span *ngIf="fieldNames.length > 8">+{{ fieldNames.length - 8 }}</span>
      </div>

      <div class="relationship-tags" *ngIf="relationshipNames.length">
        <span *ngFor="let relationship of relationshipNames">
          <mat-icon>account_tree</mat-icon>
          {{ relationship }}
        </span>
      </div>

      <p class="preview-empty" *ngIf="!previewResult">
        <mat-icon>visibility</mat-icon>
        <span>
          {{
            canPreview
              ? 'Run a preview to inspect the response before saving.'
              : 'Choose a data source and response fields to begin.'
          }}
        </span>
      </p>

      <p class="preview-warning" *ngIf="previewResult && previewStale">
        <mat-icon>update</mat-icon>
        The definition changed. Refresh to see the current response.
      </p>

      <pre *ngIf="previewResult">{{ previewResult }}</pre>

      <details class="trace" *ngIf="trace.length">
        <summary>
          <mat-icon>{{
            previewOk === false ? 'error' : 'check_circle'
          }}</mat-icon>
          Execution details · {{ trace.length }} step{{
            trace.length === 1 ? '' : 's'
          }}
        </summary>
        <div
          class="trace-row"
          *ngFor="let step of trace; trackBy: trackByIndex">
          <mat-icon [class.failed]="step.ok === false">
            {{ step.ok === false ? 'error' : 'check_circle' }}
          </mat-icon>
          <span>
            <strong>{{ step.key }}</strong>
            <small>
              {{ step.method }} {{ step.service }}/{{ step.resource }}
            </small>
            <small *ngIf="step.ok === false">{{ step.error }}</small>
            <small *ngIf="step.ok !== false">{{ step.preview }}</small>
          </span>
          <small *ngIf="step.ms != null">{{ step.ms }}ms</small>
        </div>
      </details>
    </aside>
  `,
  styles: [
    `
      :host {
        align-self: start;
        display: block;
        max-width: 100%;
        min-width: 0;
        position: sticky;
        top: 16px;
        width: 100%;
      }
      .preview-card {
        border: 1px solid rgba(63, 81, 181, 0.3);
        border-radius: 9px;
        display: grid;
        gap: 12px;
        min-width: 0;
        padding: 14px;
        width: 100%;
        box-sizing: border-box;
      }
      .preview-heading {
        align-items: center;
        display: flex;
        gap: 10px;
        justify-content: space-between;
      }
      .preview-heading > span,
      .route-summary > span {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }
      small {
        opacity: 0.68;
      }
      .route-summary {
        align-items: flex-start;
        background: rgba(63, 81, 181, 0.08);
        border-radius: 7px;
        display: flex;
        gap: 8px;
        padding: 10px;
      }
      .route-summary mat-icon {
        color: #3f51b5;
      }
      .route-summary strong,
      .route-summary small {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .contract-summary {
        display: grid;
        gap: 8px;
        grid-template-columns: 1fr 1fr;
      }
      .contract-summary > div {
        background: rgba(127, 127, 127, 0.07);
        border-radius: 6px;
        display: flex;
        flex-direction: column;
        padding: 8px;
      }
      .contract-summary span {
        font-size: 11px;
        opacity: 0.65;
        text-transform: uppercase;
      }
      .contract-tags,
      .relationship-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
      }
      .contract-tags span,
      .relationship-tags span {
        align-items: center;
        border: 1px solid rgba(127, 127, 127, 0.3);
        border-radius: 999px;
        display: inline-flex;
        font-size: 11px;
        gap: 3px;
        max-width: 100%;
        min-width: 0;
        padding: 3px 7px;
      }
      .relationship-tags mat-icon {
        font-size: 13px;
        height: 13px;
        width: 13px;
      }
      .preview-empty,
      .preview-warning {
        align-items: center;
        border: 1px dashed rgba(127, 127, 127, 0.35);
        border-radius: 7px;
        display: flex;
        gap: 8px;
        margin: 0;
        padding: 12px;
      }
      .preview-empty {
        opacity: 0.7;
      }
      .preview-warning {
        background: rgba(255, 171, 0, 0.08);
        border-color: rgba(255, 171, 0, 0.45);
      }
      pre {
        background: #101418;
        border-radius: 6px;
        color: #f4f7fb;
        font-family:
          ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 12px;
        margin: 0;
        max-height: 480px;
        overflow: auto;
        padding: 12px;
        overflow-wrap: anywhere;
        word-break: break-word;
        white-space: pre-wrap;
      }
      .preview-warning,
      .preview-empty,
      .trace-row small,
      .route-summary small {
        overflow-wrap: anywhere;
      }
      .trace summary {
        align-items: center;
        cursor: pointer;
        display: flex;
        font-size: 12px;
        font-weight: 600;
        gap: 5px;
      }
      .trace summary mat-icon,
      .trace-row > mat-icon {
        color: #1a7f43;
        font-size: 16px;
        height: 16px;
        width: 16px;
      }
      .trace-row {
        align-items: flex-start;
        border-top: 1px solid rgba(127, 127, 127, 0.16);
        display: flex;
        gap: 7px;
        padding: 7px 0;
      }
      .trace-row > span {
        display: flex;
        flex: 1;
        flex-direction: column;
        min-width: 0;
      }
      .trace-row .failed {
        color: #c62828;
      }
      @media (max-width: 1120px) {
        :host {
          position: static;
        }
      }
    `,
  ],
})
export class DfApiBuilderPreviewComponent {
  @Input() routeLabel = '';
  @Input() sourceSummary = '';
  @Input() fieldNames: string[] = [];
  @Input() relationshipNames: string[] = [];
  @Input() previewResult = '';
  @Input() previewStale = false;
  @Input() previewing = false;
  @Input() canPreview = false;
  @Input() previewOk: boolean | null = null;
  @Input() trace: ApiBuilderPreviewTrace[] = [];
  @Output() previewRequested = new EventEmitter<void>();

  // Trace rows are append-only within a run; index identity keeps existing
  // rows in place when a fresh trace array arrives.
  trackByIndex(index: number): number {
    return index;
  }
}
