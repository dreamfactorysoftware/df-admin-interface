import { NgFor, NgIf } from '@angular/common';
import { Component, Inject, Input, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslocoPipe } from '@ngneat/transloco';
import {
  BASE_SERVICE_TOKEN,
  CACHE_SERVICE_TOKEN,
} from '../../constants/tokens';
import { DfBaseCrudService } from '../../services/df-base-crud.service';
import { readAsText } from '../../utilities/file';
import { UntilDestroy } from '@ngneat/until-destroy';
import { DfScriptsGithubDialogComponent } from '../df-scripts-github-dialog/df-scripts-github-dialog.component';
import { DfAceEditorComponent } from '../df-ace-editor/df-ace-editor.component';
import { Service, ServiceType } from '../../types/service';
import { switchMap } from 'rxjs';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-script-editor',
  templateUrl: './df-script-editor.component.html',
  styleUrls: ['./df-script-editor.component.scss'],
  standalone: true,
  imports: [
    MatButtonModule,
    TranslocoPipe,
    NgIf,
    MatFormFieldModule,
    MatSelectModule,
    NgFor,
    MatDialogModule,
    MatInputModule,
    DfAceEditorComponent,
    ReactiveFormsModule,
  ],
})
export class DfScriptEditorComponent implements OnInit {
  @Input() cache: string;
  @Input({ required: true }) type: FormControl;
  @Input({ required: true }) storageServiceId: FormControl;
  @Input({ required: true }) storagePath: FormControl;
  @Input({ required: true }) content: FormControl;

  storageServices: Array<Service> = [];

  constructor(
    private dialog: MatDialog,
    @Inject(BASE_SERVICE_TOKEN) private fileService: DfBaseCrudService,
    @Inject(CACHE_SERVICE_TOKEN) private cacheService: DfBaseCrudService,
    @Inject(BASE_SERVICE_TOKEN) private baseService: DfBaseCrudService
  ) {
    this.baseService
      .getAll<{
        serviceTypes: Array<ServiceType>;
        services: Array<Service>;
      }>({
        additionalParams: [
          {
            key: 'group',
            value: 'source control,file,database, email,notification,log,iot',
          },
        ],
      })
      .subscribe(res => {
        this.storageServices = res.services;
      });
  }

  ngOnInit(): void {
    if (this.storageServiceId.getRawValue()) {
      this.storagePath.addValidators([Validators.required]);
    }
    this.storageServiceId.valueChanges.subscribe(value => {
      this.storagePath.reset();
      if (value) {
        this.storagePath.addValidators([Validators.required]);
        // this.content.reset();
        // this.content.disable();
      } else {
        if (this.storagePath.hasValidator(Validators.required)) {
          // this.content.enable();
          this.storagePath.removeValidators([Validators.required]);
        }
      }
      this.storagePath.updateValueAndValidity();
    });
  }

  fileUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      readAsText(input.files[0]).subscribe(value => {
        this.content.setValue(value);
      });
    }
  }

  githubImport() {
    const dialogRef = this.dialog.open(DfScriptsGithubDialogComponent);
    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        this.content.setValue(window.atob(res.data.content));
      }
    });
  }

  viewLatest() {
    const filePath = `${
      this.storageServices.find(
        service => service.id === this.storageServiceId.getRawValue()
      )?.name
    }/${this.storagePath.getRawValue()}`;
    if (filePath.endsWith('.json')) {
      this.fileService
        .downloadJson(filePath)
        .subscribe(text => this.content.setValue(text));
      return;
    } else {
      this.fileService
        .downloadFile(filePath)
        .pipe(switchMap(res => readAsText(res as Blob)))
        .subscribe(text => this.content.setValue(text));
    }
  }

  deleteCache() {
    if (!this.cache) return;
    this.cacheService
      .delete(`_event/${this.cache}`, {
        snackbarSuccess: 'scripts.deleteCacheSuccessMsg',
      })
      .subscribe();
  }
}
