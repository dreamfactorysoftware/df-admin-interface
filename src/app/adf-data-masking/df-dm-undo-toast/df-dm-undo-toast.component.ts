import { Component, Inject, Injectable, Injector, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_SNACK_BAR_DATA,
  MatSnackBar,
  MatSnackBarRef,
} from '@angular/material/snack-bar';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCheckCircle, faXmark } from '@fortawesome/free-solid-svg-icons';

export interface UndoToastData {
  message: string;
  action: string;
}

/**
 * The app's success toast with one action (Undo). Same surface as
 * df-snackbar, whose stylesheet it reuses, so it reads as the same toast.
 */
@Component({
  selector: 'df-dm-undo-toast',
  standalone: true,
  imports: [MatButtonModule, FontAwesomeModule],
  template: `
    <div class="alert-container success">
      <fa-icon class="alert-icon" [icon]="icon" aria-hidden="true"></fa-icon>
      <span class="alert-message" role="status">{{ data.message }}</span>
      <button
        mat-button
        type="button"
        (click)="ref.dismissWithAction()"
        data-testid="dm-undo">
        {{ data.action }}
      </button>
      <button mat-icon-button type="button" (click)="ref.dismiss()">
        <fa-icon [icon]="close"></fa-icon>
      </button>
    </div>
  `,
  styleUrls: ['../../shared/components/df-snackbar/df-snackbar.component.scss'],
})
export class DfDmUndoToastComponent {
  readonly icon = faCheckCircle;
  readonly close = faXmark;
  constructor(
    public ref: MatSnackBarRef<DfDmUndoToastComponent>,
    @Inject(MAT_SNACK_BAR_DATA) public data: UndoToastData
  ) {}
}

/**
 * Opens the undo toast; `onUndo` runs when its action is clicked. The snack
 * bar is resolved when first needed (the app root provides it).
 */
@Injectable({ providedIn: 'root' })
export class DmUndoToastService {
  private injector = inject(Injector);

  open(message: string, action: string, onUndo: () => void): void {
    this.injector
      .get(MatSnackBar)
      .openFromComponent(DfDmUndoToastComponent, {
        duration: 8000,
        horizontalPosition: 'left',
        verticalPosition: 'bottom',
        data: { message, action },
      })
      .onAction()
      .subscribe(onUndo);
  }
}
