import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { TranslocoPipe } from '@ngneat/transloco';
import { AppError } from '../../utilities/app-error';
import { DfErrorDetailComponent } from './df-error-detail.component';

/** Dialog wrapper for DfErrorDetailComponent, opened by the error toast's
 * Details action (DfSnackbarService.openError). */
@Component({
  selector: 'df-error-detail-dialog',
  template: `
    <h2 mat-dialog-title>{{ data.error.message | transloco }}</h2>
    <mat-dialog-content>
      <df-error-detail [error]="data.error" [expanded]="true">
      </df-error-detail>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close class="cancel-btn" type="button">
        {{ 'close' | transloco }}
      </button>
    </mat-dialog-actions>
  `,
  styleUrls: ['./df-error-detail-dialog.component.scss'],
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    TranslocoPipe,
    DfErrorDetailComponent,
  ],
})
export class DfErrorDetailDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { error: AppError }) {}
}
