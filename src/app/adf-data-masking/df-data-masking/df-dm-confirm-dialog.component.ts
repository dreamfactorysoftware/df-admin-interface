import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { NgIf } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

export interface DmConfirmData {
  title: string;
  message: string;
  confirm: string;
  cancel: string;
  danger?: boolean;
  /**
   * A second, alternative confirm (e.g. "Delete and unmask 3"). The dialog
   * then closes with 'extra'.
   */
  extra?: string;
}

/** Confirm: one sentence carrying the real numbers. */
@Component({
  selector: 'df-dm-confirm-dialog',
  standalone: true,
  imports: [NgIf, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <div mat-dialog-content *ngIf="data.message">{{ data.message }}</div>
    <div mat-dialog-actions align="end">
      <button
        mat-button
        type="button"
        [mat-dialog-close]="false"
        data-testid="dm-confirm-cancel">
        {{ data.cancel }}
      </button>
      <button
        *ngIf="data.extra"
        mat-stroked-button
        type="button"
        [mat-dialog-close]="'extra'"
        data-testid="dm-confirm-extra">
        {{ data.extra }}
      </button>
      <button
        mat-flat-button
        color="primary"
        type="button"
        cdkFocusInitial
        class="confirm"
        [class.danger]="data.danger"
        [mat-dialog-close]="true"
        data-testid="dm-confirm-ok">
        {{ data.confirm }}
      </button>
    </div>
  `,
  styles: [
    `
      @use '../../shared/components/df-dialog-surface' as *;
      @include df-dialog-surface;

      [mat-dialog-content] {
        color: var(--df-text-2);
        font-size: var(--df-font-size-sm);
        max-width: 420px;
      }

      .confirm.danger {
        --mdc-filled-button-container-color: var(--df-danger-soft);
        --mdc-filled-button-label-text-color: var(--df-danger);
        border: 1px solid var(--df-danger-border);
      }
    `,
  ],
})
export class DfDmConfirmDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: DmConfirmData) {}
}
