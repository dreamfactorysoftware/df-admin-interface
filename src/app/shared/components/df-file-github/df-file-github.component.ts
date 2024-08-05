import { NgFor, NgIf } from '@angular/common';
import { Component, Inject, Input, OnInit } from '@angular/core';
import {
  FormControl,
  ReactiveFormsModule,
  Validators,
  FormsModule,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
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
import { AsyncPipe } from '@angular/common';
import { DfThemeService } from '../../services/df-theme.service';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-file-github',
  templateUrl: './df-file-github.component.html',
  styleUrls: ['./df-file-github.component.scss'],
  standalone: true,
  imports: [
    MatButtonModule,
    TranslocoPipe,
    NgIf,
    MatFormFieldModule,
    MatSelectModule,
    MatCheckboxModule,
    NgFor,
    FormsModule,
    MatDialogModule,
    MatInputModule,
    DfAceEditorComponent,
    AsyncPipe,
    ReactiveFormsModule,
  ],
})
export class DfFileGithubComponent implements OnInit {
  @Input() cache: string;
  @Input({ required: true }) type: FormControl;
  @Input({ required: true }) contentText: string;
  @Input({ required: true }) content: FormControl;

  storageServices: Array<Service> = [];
  checked = false;

  constructor(
    private dialog: MatDialog,
    @Inject(BASE_SERVICE_TOKEN) private fileService: DfBaseCrudService,
    @Inject(CACHE_SERVICE_TOKEN) private cacheService: DfBaseCrudService,
    @Inject(BASE_SERVICE_TOKEN) private baseService: DfBaseCrudService,
    private themeService: DfThemeService
  ) {
    this.baseService
      .getAll<{
        serviceTypes: Array<ServiceType>;
        services: Array<Service>;
      }>({
        additionalParams: [
          {
            key: 'group',
            value: 'source control,file',
          },
        ],
      })
      .subscribe(res => {
        this.storageServices = res.services;
      });
  }
  isDarkMode = this.themeService.darkMode$;
  ngOnInit(): void {
    this.content.setValue(this.contentText);
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
}
