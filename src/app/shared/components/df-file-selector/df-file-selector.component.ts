import {
  Component,
  EventEmitter,
  Inject,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslocoPipe } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faFile,
  faFolderOpen,
  faCheck,
  faUpload,
} from '@fortawesome/free-solid-svg-icons';
import { DfFileSelectorDialogComponent } from './df-file-selector-dialog.component';
import { FileApiService } from '../../services/df-file-api.service';
import { BASE_SERVICE_TOKEN } from '../../constants/tokens';
import { DfBaseCrudService } from '../../services/df-base-crud.service';
import { GenericListResponse } from '../../types/generic-http';
import { MatIconModule } from '@angular/material/icon';

export interface FileApiInfo {
  id: number;
  name: string;
  label: string;
  type: string;
}

export interface SelectedFile {
  path: string; // Full absolute path for the Snowflake config (includes storage root)
  relativePath?: string; // The relative path within the file service
  fileName: string; // Just the filename
  name?: string; // Alias for fileName for template compatibility
  serviceId: number; // The ID of the file service
  serviceName: string; // The name of the file service
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-file-selector',
  templateUrl: './df-file-selector.component.html',
  styleUrls: ['./df-file-selector.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule,
    TranslocoPipe,
    MatTooltipModule,
    FontAwesomeModule,
    MatIconModule,
  ],
})
export class DfFileSelectorComponent implements OnInit {
  @Input() label: string = 'Private Key File';
  @Input() description: string = '';
  @Input() allowedExtensions: string[] = ['.pem', '.p8', '.key'];
  @Input() initialValue: string = '';
  @Output() fileSelected = new EventEmitter<SelectedFile | undefined>();

  faFile = faFile;
  faFolderOpen = faFolderOpen;
  faCheck = faCheck;
  faUpload = faUpload;

  selectedFile: SelectedFile | undefined = undefined;
  fileApis: FileApiInfo[] = [];
  isLoading = false;

  constructor(
    private dialog: MatDialog,
    private fileApiService: FileApiService
  ) {}

  ngOnInit(): void {
    this.loadFileApis();

    // If initialValue is set, try to parse it
    if (this.initialValue) {
      this.parseInitialValue();
    }

    // Create a fallback service entry immediately, in case the API call takes too long
    // or fails completely
    this.ensureFallbackService();
  }

  // Ensure there's always at least one file service available
  private ensureFallbackService(): void {
    if (this.fileApis.length === 0) {
      console.log('Creating fallback file service entry');
      this.fileApis = [
        {
          id: 1,
          name: 'files',
          label: 'Local Files',
          type: 'local_file',
        },
      ];
    }
  }

  loadFileApis(): void {
    this.isLoading = true;

    // Ensure fallback is in place immediately
    this.ensureFallbackService();

    // Use the FileApiService to get the list of file services
    this.fileApiService
      .getFileServices()
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (response: { resource: FileApiInfo[] }) => {
          if (response && response.resource && response.resource.length > 0) {
            this.fileApis = response.resource;
          } else {
            // If we get an empty or invalid response, ensure fallback
            this.ensureFallbackService();
          }
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Error loading file APIs:', error);

          // Ensure fallback on error
          this.ensureFallbackService();
          this.isLoading = false;
        },
      });
  }

  openFileSelector(): void {
    // Ensure fallback before opening dialog
    this.ensureFallbackService();

    const dialogRef = this.dialog.open(DfFileSelectorDialogComponent, {
      width: '800px',
      data: {
        fileApis: this.fileApis,
        allowedExtensions: this.allowedExtensions,
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.selectedFile = result;
        this.fileSelected.emit(this.selectedFile);
      }
    });
  }

  clearSelection(): void {
    this.selectedFile = undefined;
    this.fileSelected.emit(undefined);
  }

  // Update the parseInitialValue method to accept an optional path parameter
  private parseInitialValue(providedPath?: string): void {
    // Attempt to parse the initial value if it's provided
    try {
      const pathToUse = providedPath || this.initialValue;

      if (pathToUse) {
        console.log('Parsing path value:', pathToUse);

        // Extract the filename from the path
        const parts = pathToUse.split('/');
        const fileName = parts[parts.length - 1];

        // We don't have full information but we can set what we know
        this.selectedFile = {
          path: pathToUse,
          fileName: fileName,
          name: fileName, // Add name property for template compatibility
          serviceId: 0, // Unknown
          serviceName: 'Unknown',
        };

        console.log('Generated selected file:', this.selectedFile);
      }
    } catch (e) {
      console.error('Failed to parse path value:', e);
    }
  }

  // Add this method to set the path externally if needed
  setPath(path: string): void {
    if (path) {
      console.log('Setting path manually:', path);
      this.parseInitialValue(path);
    }
  }
}
