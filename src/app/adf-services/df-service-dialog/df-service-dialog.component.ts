import { Component, Inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'df-service-dialog',
  templateUrl: './df-service-dialog.component.html',
  styleUrls: ['./df-service-dialog.component.scss'],
})
export class DfServiceDialogComponent {
  isCreateServiceEnabled = true; // TODO: possibly change to input() when manage services component is being built

  firstFormGroup = this._formBuilder.group({
    firstCtrl: ['', Validators.required],
  });
  secondFormGroup = this._formBuilder.group({
    secondCtrl: ['', Validators.required],
  });

  constructor(
    public dialogRef: MatDialogRef<DfServiceDialogComponent>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // TODO: create dialog data object and remove the above eslint comment
    @Inject(MAT_DIALOG_DATA) public data: any,
    private _formBuilder: FormBuilder
  ) {}

  onClose(): void {
    this.dialogRef.close();
  }
}
