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
  styleUrls: ['./df-confirm-dialog.component.scss'],
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, TranslocoPipe],
})
export class DfConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<DfConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}

  // Destructive (delete) confirmations get the danger treatment on the confirm
  // button instead of the accent. Driven off the existing dialog data: delete
  // flows pass the 'confirmDelete' message key (df-manage-table.confirmDelete),
  // so no caller or type change is needed.
  get isDestructive(): boolean {
    const m = (this.data?.message ?? '').toLowerCase();
    const t = (this.data?.title ?? '').toLowerCase();
    return m.includes('delete') || t.includes('delete');
  }

  onClose(): void {
    this.dialogRef.close(true);
  }
}
