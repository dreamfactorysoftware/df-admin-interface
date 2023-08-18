import { Component, Input } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ServiceType } from '../services/service-data.service';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'df-service-definition',
  templateUrl: './df-service-definition.component.html',
  styleUrls: ['./df-service-definition.component.scss'],
})
export class DfServiceDefinitionComponent {
  @Input() isServiceEditable = true;
  @Input() selectedService: ServiceType | null;

  githubFormGroup = new FormGroup({
    githubURL: new FormControl(
      {
        value: '',
        disabled: this.isServiceEditable,
      },
      Validators.required
    ),
    githubUsername: new FormControl(
      {
        value: '',
        disabled: this.isServiceEditable,
      },
      Validators.required
    ),
    githubPassword: new FormControl(
      {
        value: '',
        disabled: this.isServiceEditable,
      },
      Validators.required
    ),
  });

  desktopFile = new FormControl<File | null>({
    value: null,
    disabled: false,
  });
  githubFile = new FormControl<File | null>({
    value: null,
    disabled: false,
  });
  serviceDefinitionFormat = new FormControl<string>({
    value: '',
    disabled: false,
  });

  isGithubFormsVisible = false;

  constructor(public dialog: MatDialog) {}

  displayGithubFields(): void {
    this.isGithubFormsVisible = true;
  }

  hideGithubFields(): void {
    this.isGithubFormsVisible = false;
  }

  uploadGithubFile(): void {
    // TODO: insert post request here
  }

  onDesktopFileChange(event: Event) {
    const files = (event.target as HTMLInputElement).files as FileList;
    this.desktopFile.setValue(files[0]);
  }
}
