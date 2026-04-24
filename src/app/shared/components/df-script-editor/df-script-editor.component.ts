import { DatePipe, NgFor, NgIf } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
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
    MatCheckboxModule,
    NgFor,
    FormsModule,
    MatDialogModule,
    MatInputModule,
    DfAceEditorComponent,
    AsyncPipe,
    DatePipe,
    MatIconModule,
    ReactiveFormsModule,
  ],
})
export class DfScriptEditorComponent implements OnInit {
  @Input() isScript: boolean;
  @Input() cache: string;
  @Input() hideScmActions = false;
  @Input() snapshotTimestamp?: string | Date | null;
  @Input() scmRepository?: FormControl;
  @Input() scmReference?: FormControl;
  @Input({ required: true }) type: FormControl;
  @Input({ required: true }) storageServiceId: FormControl;
  @Input({ required: true }) storagePath: FormControl;
  @Input({ required: true }) content: FormControl;

  storageServices: Array<Service> = [];
  checked = false;
  lastRefreshedAt: Date | null = null;
  refreshError: string | null = null;

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
    if (this.storageServiceId.getRawValue()) {
      this.storagePath.addValidators([Validators.required]);
    }
    // Track previous value so we only reset storagePath on a real user-driven
    // service change, not when the parent patches the form on load/prefill.
    let prevServiceId: any = this.storageServiceId.getRawValue();
    this.storageServiceId.valueChanges.subscribe(value => {
      const isUserSwap =
        !!prevServiceId && value !== prevServiceId && value !== null;
      prevServiceId = value;
      if (isUserSwap) {
        this.storagePath.reset();
      }
      if (value) {
        this.storagePath.addValidators([Validators.required]);
      } else if (this.storagePath.hasValidator(Validators.required)) {
        this.storagePath.removeValidators([Validators.required]);
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
    this.refreshError = null;
    const serviceId = this.storageServiceId.getRawValue();
    const service = this.storageServices.find(s => s.id === serviceId);
    if (!service) {
      this.refreshError = !serviceId
        ? 'No storage service linked to this script.'
        : `Storage service (id ${serviceId}) is not available.`;
      return;
    }
    const storagePath = this.storagePath.getRawValue();
    if (!storagePath) {
      this.refreshError = 'No file path saved — pick a file first.';
      return;
    }

    const scmRepo = this.scmRepository?.getRawValue();
    const scmRef = this.scmReference?.getRawValue() || 'main';
    const isScmLinked = service.type === 'github' && !!scmRepo;

    const filePath = isScmLinked
      ? `${service.name}/_repo/${scmRepo}?branch=${encodeURIComponent(
          scmRef
        )}&content=1&path=${encodeURIComponent(storagePath)}`
      : `${service.name}/${storagePath}`;

    const markRefreshed = () => {
      this.lastRefreshedAt = new Date();
      this.refreshError = null;
    };
    const handleError = (err: any) => {
      this.refreshError =
        err?.error?.error?.message ??
        err?.error?.message ??
        err?.message ??
        'Refresh failed.';
    };
    if (!isScmLinked && filePath.endsWith('.json')) {
      this.fileService.downloadJson(filePath).subscribe({
        next: text => {
          this.content.setValue(text);
          markRefreshed();
        },
        error: handleError,
      });
      return;
    }
    this.fileService
      .downloadFile(filePath)
      .pipe(switchMap(res => readAsText(res as Blob)))
      .subscribe({
        next: text => {
          this.content.setValue(text);
          markRefreshed();
        },
        error: handleError,
      });
  }

  deleteCache() {
    if (!this.cache) return;
    this.cacheService
      .delete(`_event/${this.cache}`, {
        snackbarSuccess: 'scripts.deleteCacheSuccessMsg',
      })
      .subscribe();
  }

  get showSnapshotBanner(): boolean {
    return (
      !!this.storageServiceId?.getRawValue() &&
      (!!this.snapshotTimestamp || !!this.lastRefreshedAt)
    );
  }

  get snapshotDisplayDate(): Date | null {
    if (this.lastRefreshedAt) return this.lastRefreshedAt;
    if (!this.snapshotTimestamp) return null;
    const d = new Date(this.snapshotTimestamp);
    return isNaN(d.getTime()) ? null : d;
  }

  get snapshotLocked(): boolean {
    return !this.storageServiceId?.getRawValue();
  }
}
