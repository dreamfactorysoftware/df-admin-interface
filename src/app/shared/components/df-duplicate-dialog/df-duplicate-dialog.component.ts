import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  FormControl,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslocoPipe } from '@ngneat/transloco';
import { NgIf } from '@angular/common';

export interface DuplicateDialogData {
  title: string;
  message: string;
  label: string;
  originalName: string;
  existingNames?: string[];
}

@Component({
  selector: 'df-duplicate-dialog',
  templateUrl: './df-duplicate-dialog.component.html',
  styleUrls: ['./df-duplicate-dialog.component.scss'],
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    TranslocoPipe,
    NgIf,
  ],
})
export class DfDuplicateDialogComponent {
  nameControl: FormControl;

  constructor(
    public dialogRef: MatDialogRef<DfDuplicateDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DuplicateDialogData
  ) {
    this.nameControl = new FormControl('', [
      Validators.required,
      this.uniqueNameValidator.bind(this),
    ]);
  }

  uniqueNameValidator(control: AbstractControl): ValidationErrors | null {
    if (
      this.data.existingNames &&
      this.data.existingNames.includes(control.value)
    ) {
      return { nameExists: true };
    }
    if (control.value === this.data.originalName) {
      return { sameName: true };
    }
    return null;
  }

  onDuplicate(): void {
    if (this.nameControl.valid) {
      this.dialogRef.close(this.nameControl.value);
    }
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
