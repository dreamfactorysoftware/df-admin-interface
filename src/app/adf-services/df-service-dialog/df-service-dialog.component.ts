import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'df-service-dialog',
  templateUrl: './df-service-dialog.component.html',
  styleUrls: ['./df-service-dialog.component.scss'],
})
export class DfServiceDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<DfServiceDialogComponent>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // TODO: create dialog data object and remove the above eslint comment
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onClose(): void {
    this.dialogRef.close();
  }
}
