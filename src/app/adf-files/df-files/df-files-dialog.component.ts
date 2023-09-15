import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormField, MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute } from '@angular/router';
import { TranslocoPipe } from '@ngneat/transloco';

@Component({
  selector: 'df-files-dialog-component',
  templateUrl: 'df-files-dialog.component.html',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    TranslocoPipe,
    ReactiveFormsModule,
  ],
})
export class DfFilesDialogComponent {
  dialogForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private activatedRoute: ActivatedRoute
  ) {
    this.dialogForm = this.fb.group({
      name: ['', Validators.required],
    });
  }

  save(): void {
    console.log('save', this.dialogForm.value.name);
    console.log('route', this.activatedRoute.paramMap);
  }
}
