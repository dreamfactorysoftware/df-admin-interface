import { Component } from '@angular/core';
import { SampleApps } from '../df-apps.consts';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DfAppsService } from '../services/df-apps.service';

@Component({
  selector: 'df-df-import-app',
  templateUrl: './df-import-app.component.html',
  styleUrls: ['./df-import-app.component.scss'],
})
export class DfImportAppComponent {
  sampleApps = SampleApps;
  importForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private appsService: DfAppsService
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
  }

  fileInputChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.importForm.patchValue({ file: file, filePath: file.name });
    }
  }

  onSubmit() {
    this.appsService
      .importApp(
        this.importForm.value.filePath,
        parseInt(this.importForm.value.storageService),
        this.importForm.value.storageFolder,
        this.importForm.value.file
      )
      .subscribe(data => console.log(data));
  }
}
