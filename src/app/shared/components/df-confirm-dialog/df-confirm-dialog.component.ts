import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { TranslocoPipe } from '@ngneat/transloco';
import { ConfirmDialogData } from '../../types/dialog';

@Component({
  selector: 'df-confirm-dialog',
  templateUrl: './df-confirm-dialog.component.html',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, TranslocoPipe],
})
export class DfConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<DfConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}

  onClose(): void {
    this.dialogRef.close(true);
  }
}
