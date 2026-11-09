import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

export interface AaConfirmData {
  title: string;
  message: string;
  confirm: string;
  cancel: string;
}

/** Destructive confirm (revoke a grant, remove a Person Server). */
@Component({
  selector: 'df-aa-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <div mat-dialog-content>{{ data.message }}</div>
    <div mat-dialog-actions align="end">
      <button
        mat-button
        type="button"
        [mat-dialog-close]="false"
        data-testid="aa-confirm-cancel">
        {{ data.cancel }}
      </button>
      <button
        mat-flat-button
        type="button"
        cdkFocusInitial
        class="confirm"
        [mat-dialog-close]="true"
        data-testid="aa-confirm-ok">
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

      .confirm {
        --mdc-filled-button-container-color: var(--df-danger-soft);
        --mdc-filled-button-label-text-color: var(--df-danger);
        border: 1px solid var(--df-danger-border);
      }
    `,
  ],
})
export class DfAaConfirmDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: AaConfirmData) {}
}
