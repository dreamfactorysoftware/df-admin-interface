import { Component, Inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslocoPipe } from '@ngneat/transloco';
import { UntilDestroy } from '@ngneat/until-destroy';
import { FILE_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';
import { DfBaseCrudService } from 'src/app/shared/services/df-base-crud.service';
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-folder-dialog-component',
  templateUrl: 'df-folder-dialog.component.html',
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
export class DfFolderDialogComponent {
  dialogForm: FormGroup;

  constructor(
    @Inject(FILE_SERVICE_TOKEN)
    private crudService: DfBaseCrudService,
    @Inject(MAT_DIALOG_DATA) public data: { route: string },
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<DfFolderDialogComponent>
  ) {
    this.dialogForm = this.fb.group({
      name: ['', Validators.required],
    });
  }

  save(): void {
    if (!this.dialogForm.valid) {
      return;
    }
    this.crudService
      .create(
        { resource: [] },
        {
          additionalHeaders: [
            {
              key: 'X-Folder-Name',
              value: this.dialogForm.value.name,
            },
          ],
          snackbarSuccess: 'files.alerts.createFolderSuccess',
        },
        this.data.route
      )
      .subscribe(() => {
        this.dialogRef.close({ refreshData: true });
      });
  }
}
