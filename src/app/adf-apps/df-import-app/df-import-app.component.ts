import { Component } from '@angular/core';
import { SampleApps } from '../df-apps.consts';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { DfAppsService } from '../services/df-apps.service';
import { Router } from '@angular/router';

import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { NgFor, NgIf } from '@angular/common';
import { TranslocoPipe } from '@ngneat/transloco';

@Component({
  selector: 'df-df-import-app',
  templateUrl: './df-import-app.component.html',
  styleUrls: ['./df-import-app.component.scss'],
  providers: [DfAppsService],
  standalone: true,
  imports: [
    NgFor,
    MatButtonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    NgIf,
    MatSelectModule,
    MatOptionModule,
    TranslocoPipe,
  ],
})
export class DfImportAppComponent {
  sampleApps = SampleApps;
  importForm: FormGroup;
  type: 'url' | 'file' = 'url';

  constructor(
    private fb: FormBuilder,
    private appsService: DfAppsService,
    private router: Router
  ) {
    this.importForm = this.fb.group({
      file: [null],
      filePath: ['', Validators.required],
      storageService: [0],
      storageFolder: [''],
    });
  }

  selectApp(path: string) {
    this.importForm.patchValue({ filePath: path, file: null });
    this.type = 'url';
  }

  fileInputChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.importForm.patchValue({ file: file, filePath: file.name });
      this.type = 'file';
    }
  }

  goBack() {
    this.router.navigate(['/apps']);
  }

  onSubmit() {
    if (this.importForm.invalid) {
      return;
    }
    if (this.type === 'url') {
      this.appsService
        .importFromUrl(
          this.importForm.value.filePath,
          this.importForm.value.storageFolder,
          this.importForm.value.storageService
        )
        .subscribe();
    } else {
      this.appsService
        .importFromFile(
          this.importForm.value.file,
          this.importForm.value.storageFolder,
          this.importForm.value.storageService
        )
        .subscribe();
    }
  }
}
