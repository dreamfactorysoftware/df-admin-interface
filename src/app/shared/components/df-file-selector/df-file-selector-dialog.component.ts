import {
  Component,
  Inject,
  OnInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslocoPipe } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faFolderOpen,
  faFile,
  faArrowLeft,
  faUpload,
} from '@fortawesome/free-solid-svg-icons';
import { FileApiInfo, SelectedFile } from './df-file-selector.component';
import { HttpClient } from '@angular/common/http';
import { FileApiService } from '../../services/df-file-api.service';
import { DfBaseCrudService } from '../../services/df-base-crud.service';
import { URL_TOKEN } from '../../constants/tokens';

// Simple dialog for creating a new folder
@Component({
  selector: 'df-create-folder-dialog',
  template: `
    <h2 mat-dialog-title>Create New Folder</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Folder Name</mat-label>
        <input
          matInput
          [(ngModel)]="folderName"
          placeholder="Enter folder name" />
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button
        mat-raised-button
        color="primary"
        [disabled]="!folderName"
        (click)="onConfirm()">
        Create
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .full-width {
        width: 100%;
      }
    `,
  ],
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    CommonModule,
  ],
})
export class CreateFolderDialogComponent {
  folderName: string = '';

  constructor(public dialogRef: MatDialogRef<CreateFolderDialogComponent>) {}

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    this.dialogRef.close(this.folderName);
  }
}

interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'folder';
  contentType?: string;
  lastModified?: string;
  size?: number;
}

interface DialogData {
  fileApis: FileApiInfo[];
  allowedExtensions: string[];
  uploadMode?: boolean;
  fileToUpload?: File;
  selectorOnly?: boolean;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-file-selector-dialog',
  templateUrl: './df-file-selector-dialog.component.html',
  styleUrls: ['./df-file-selector-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatTableModule,
    MatTooltipModule,
    FormsModule,
    ReactiveFormsModule,
    TranslocoPipe,
    FontAwesomeModule,
  ],
  providers: [
    // Create a factory provider for the DfBaseCrudService that sets the URL dynamically
    {
      provide: DfBaseCrudService,
      useFactory: (http: HttpClient) => {
        return new DfBaseCrudService('api/v2', http);
      },
      deps: [HttpClient],
    },
  ],
})
export class DfFileSelectorDialogComponent implements OnInit {
  // Reference to the file input element
  @ViewChild('fileUploadInput') fileUploadInput!: ElementRef<HTMLInputElement>;

  faFolderOpen = faFolderOpen;
  faFile = faFile;
  faArrowLeft = faArrowLeft;
  faUpload = faUpload;

  selectedFileApi: FileApiInfo | null = null;
  currentPath: string = '';
  files: FileItem[] = [];
  navigationStack: string[] = [];
  isLoading = false;
  uploadInProgress = false;

  displayedColumns: string[] = ['name', 'type', 'actions'];

  selectedFile: FileItem | null = null;

  // Flag to determine if we're in selector-only mode
  get isSelectorOnly(): boolean {
    return !!this.data.selectorOnly;
  }

  constructor(
    private dialogRef: MatDialogRef<DfFileSelectorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private dialog: MatDialog,
    private http: HttpClient,
    private fileApiService: FileApiService,
    private crudService: DfBaseCrudService
  ) {}

  ngOnInit(): void {
    // If we're in upload mode, start by showing the file APIs
    if (this.data.uploadMode && this.data.fileApis.length > 0) {
      this.selectFileApi(this.data.fileApis[0]);
    }
  }

  selectFileApi(fileApi: FileApiInfo): void {
    this.selectedFileApi = fileApi;
    this.currentPath = '';
    this.navigationStack = [];
    this.loadFiles();
  }

  loadFiles(): void {
    if (!this.selectedFileApi) return;

    this.isLoading = true;

    // Use fileApiService to handle authentication and headers properly
    this.fileApiService.listFiles(this.selectedFileApi.name, this.currentPath)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (response: any) => {
          this.isLoading = false;

          // Check if response contains an error message from our error handling
          if (response.error) {
            console.warn('File listing contained error:', response.error);
            // Handle specific error conditions silently
            if (response.error.includes('Internal Server Error')) {
              console.log('Server error encountered, showing empty directory');
              this.files = [];
              return;
            }
          }

          // Format depends on file service type
          // Typically, the response is either an array of files or has a resource property
          let fileList: any[] = [];

          if (Array.isArray(response)) {
            fileList = response;
          } else if (response.resource && Array.isArray(response.resource)) {
            fileList = response.resource;
          }

          this.files = fileList.map(file => ({
            name: file.name || (file.path ? file.path.split('/').pop() : ''),
            path:
              file.path ||
              (
                (this.currentPath ? this.currentPath + '/' : '') + file.name
              ).replace('//', '/'),
            type: file.type === 'folder' ? 'folder' : 'file',
            contentType: file.content_type || file.contentType,
            lastModified: file.last_modified || file.lastModified,
            size: file.size,
          }));

          console.log('Processed files:', this.files);
        },
        error: (err: any) => {
          console.error('Error loading files:', err);
          this.files = []; // Empty array instead of undefined

          // Provide a more specific error message based on the error
          let errorMsg = 'Failed to load files. ';

          if (err.status === 500) {
            errorMsg +=
              'The server encountered an internal error. Using empty directory view.';
            // We just show an empty directory without alert for 500 errors
            console.warn(errorMsg);
          } else if (err.status === 404) {
            errorMsg += 'The specified folder does not exist.';
            alert(errorMsg);
          } else if (err.status === 403 || err.status === 401) {
            errorMsg += 'You do not have permission to access this location.';
            alert(errorMsg);
          } else {
            errorMsg += 'Please check your connection and try again.';
            alert(errorMsg);
          }

          this.isLoading = false;
        },
      });
  }

  openFolder(file: FileItem): void {
    this.navigationStack.push(this.currentPath);
    this.currentPath = file.path;
    this.loadFiles();
  }

  navigateBack(): void {
    if (this.navigationStack.length > 0) {
      this.currentPath = this.navigationStack.pop() || '';
      this.loadFiles();
    } else if (this.selectedFileApi) {
      // Go back to file API selection
      this.selectedFileApi = null;
      this.files = [];
    }
  }

  selectFile(file: FileItem): void {
    // Check if file extension is allowed
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!this.data.allowedExtensions.includes(fileExt)) {
      alert(
        `Only ${this.data.allowedExtensions.join(', ')} files are allowed.`
      );
      return;
    }

    this.selectedFile = file;
  }

  confirmSelection(): void {
    if (!this.selectedFile || !this.selectedFileApi) return;

    // Store reference to avoid null checks later
    const fileApi = this.selectedFileApi;
    const sourcePath = this.selectedFile.path;

    // Get the base storage path for the file service
    // For local file service, the base path should be '/opt/dreamfactory/storage/app/'
    const baseStoragePath = '/opt/dreamfactory/storage/app/';

    // Create result with proper path based on the current selection
    const result: SelectedFile = {
      // Provide both the relative path and the absolute path with storage root
      path: baseStoragePath + this.selectedFile.path,
      relativePath: this.selectedFile.path,
      fileName: this.selectedFile.name,
      name: this.selectedFile.name,
      serviceId: fileApi.id,
      serviceName: fileApi.name,
    };

    console.log('Selected file with absolute path:', result);

    // Return the selected file directly
    this.dialogRef.close(result);
  }

  // Upload a file in the current path
  uploadFileDirectly(file: File): void {
    if (!this.selectedFileApi) {
      alert('Please select a file service first.');
      return;
    }

    this.uploadInProgress = true;

    // Store reference to avoid null checks later
    const fileApi = this.selectedFileApi;

    // Use the current path for upload
    const uploadPath = this.currentPath;

    // Upload to the current path
    this.performUpload(file, uploadPath);
  }

  // Helper method to perform the actual upload
  private performUpload(file: File, path: string): void {
    if (!this.selectedFileApi) {
      this.uploadInProgress = false;
      return;
    }

    this.uploadInProgress = true;

    // Store reference to avoid null checks later
    const fileApi = this.selectedFileApi;

    console.log(
      `Starting upload of ${file.name} (${file.size} bytes) to ${fileApi.name}/${path}`
    );

    // Use fileApiService to handle authentication and proper URL construction
    this.fileApiService.uploadFile(fileApi.name, file, path)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: response => {
          this.uploadInProgress = false;
          console.log('Upload successful:', response);

          // Determine the relative path to the uploaded file
          const relativePath = path ? `${path}/${file.name}` : file.name;

          // Get the base storage path for the file service
          const baseStoragePath = '/opt/dreamfactory/storage/app/';

          // Create result with uploaded file info
          const result: SelectedFile = {
            path: baseStoragePath + relativePath,
            relativePath: relativePath,
            fileName: file.name,
            name: file.name,
            serviceId: fileApi.id,
            serviceName: fileApi.name,
          };

          console.log('File uploaded successfully, returning:', result);

          // Reload files to show the newly uploaded file
          this.loadFiles();

          // Automatically select the uploaded file
          setTimeout(() => {
            const uploadedFile = this.files.find(f => f.name === file.name);
            if (uploadedFile) {
              this.selectedFile = uploadedFile;
            }
          }, 500);
        },
        error: (err: any) => {
          console.error('Error uploading file:', err);
          this.uploadInProgress = false;

          let errorMsg = 'Failed to upload file. ';

          if (err.status === 400) {
            errorMsg +=
              'Bad request - check if the file type is allowed or if the file is too large.';
          } else if (err.status === 401 || err.status === 403) {
            errorMsg +=
              'Permission denied - you may not have access to upload to this location.';
          } else if (err.status === 404) {
            errorMsg += 'The specified folder does not exist.';
          } else if (err.status === 413) {
            errorMsg += 'The file is too large.';
          } else if (err.status === 500) {
            errorMsg += err.error?.error?.message || 'Server error occurred.';
          } else {
            errorMsg += 'Please try again.';
          }

          alert(errorMsg);
        },
      });
  }

  // For files selected via the upload button in the main component
  uploadFile(): void {
    if (!this.data.fileToUpload || !this.selectedFileApi) return;

    this.uploadInProgress = true;

    // Store reference to avoid null checks later
    const fileApi = this.selectedFileApi;

    // Use the current path for upload
    const uploadPath = this.currentPath;

    // Upload to the current path
    this.performUploadAndClose(this.data.fileToUpload, uploadPath);
  }

  // Helper method to perform the upload and close the dialog
  private performUploadAndClose(file: File, path: string): void {
    if (!this.selectedFileApi) {
      this.uploadInProgress = false;
      return;
    }

    this.uploadInProgress = true;

    // Store reference to avoid null checks later
    const fileApi = this.selectedFileApi;

    console.log(
      `Starting upload of ${file.name} (${file.size} bytes) to ${fileApi.name}/${path}`
    );

    // Use fileApiService to handle authentication and proper URL construction
    this.fileApiService.uploadFile(fileApi.name, file, path)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: response => {
          this.uploadInProgress = false;
          console.log('Upload successful:', response);

          // Determine the relative path to the uploaded file
          const relativePath = path ? `${path}/${file.name}` : file.name;

          // Get the base storage path for the file service
          const baseStoragePath = '/opt/dreamfactory/storage/app/';

          // Create result with uploaded file info including absolute path
          const result: SelectedFile = {
            path: baseStoragePath + relativePath,
            relativePath: relativePath,
            fileName: file.name,
            name: file.name,
            serviceId: fileApi.id,
            serviceName: fileApi.name,
          };

          console.log(
            'File uploaded successfully, returning with absolute path:',
            result
          );
          this.dialogRef.close(result);
        },
        error: (err: any) => {
          console.error('Error uploading file:', err);
          this.uploadInProgress = false;

          let errorMsg = 'Failed to upload file. ';

          if (err.status === 400) {
            errorMsg +=
              'Bad request - check if the file type is allowed or if the file is too large.';
          } else if (err.status === 401 || err.status === 403) {
            errorMsg +=
              'Permission denied - you may not have access to upload to this location.';
          } else if (err.status === 404) {
            errorMsg += 'The specified folder does not exist.';
          } else if (err.status === 413) {
            errorMsg += 'The file is too large.';
          } else if (err.status === 500) {
            errorMsg += err.error?.error?.message || 'Server error occurred.';
          } else {
            errorMsg += 'Please try again.';
          }

          alert(errorMsg);
        },
      });
  }

  // Show dialog to create a new folder
  showCreateFolderDialog(): void {
    // Don't allow folder creation in selector-only mode
    if (this.isSelectorOnly) {
      return;
    }

    const dialogRef = this.dialog.open(CreateFolderDialogComponent, {
      width: '350px',
    });

    dialogRef.afterClosed().subscribe(folderName => {
      if (folderName && this.selectedFileApi) {
        this.createFolder(folderName);
      }
    });
  }

  // Create a new folder in the current path
  createFolder(folderName: string): void {
    if (!this.selectedFileApi) return;

    this.isLoading = true;

    // Use fileApiService to handle authentication and proper URL construction
    this.fileApiService.createDirectory(this.selectedFileApi.name, this.currentPath, folderName)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          console.log('Folder created successfully');
          // Reload files to show the new folder
          this.loadFiles();
        },
        error: (err: any) => {
          console.error('Error creating folder:', err);
          alert('Failed to create folder. Please try again.');
          this.isLoading = false;
        },
      });
  }

  cancel(): void {
    this.dialogRef.close();
  }

  // Trigger the file input click programmatically
  triggerFileUpload(): void {
    // Don't allow file upload in selector-only mode
    if (this.isSelectorOnly) {
      return;
    }

    if (this.fileUploadInput) {
      this.fileUploadInput.nativeElement.click();
    }
  }

  // Handle file selection from the input element
  handleFileUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Log detailed information about the file
      console.log(`File selected: ${file.name}`);
      console.log(`File size: ${file.size} bytes`);
      console.log(`File type: ${file.type}`);

      // Check file extension to identify sensitive key files
      const isPEMFile =
        file.name.endsWith('.pem') ||
        file.name.endsWith('.p8') ||
        file.name.endsWith('.key');

      if (isPEMFile) {
        console.log(
          'Handling private key file with special care for Snowflake authentication'
        );
      }

      // Read the file content to verify it's not empty
      const reader = new FileReader();
      reader.onload = e => {
        const content = e.target?.result;
        console.log(
          `File content read successfully, content length: ${
            content ? (content as ArrayBuffer).byteLength : 0
          } bytes`
        );

        // Continue with file validation
        // Validate file extension
        const extension = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!this.data.allowedExtensions.includes(extension)) {
          alert(
            `Only ${this.data.allowedExtensions.join(', ')} files are allowed`
          );
          return;
        }

        // Upload the file directly with verified content
        this.uploadFileDirectly(file);
      };

      reader.onerror = e => {
        console.error('Error reading file:', e);
        alert(
          'Error reading file content. Please try again with another file.'
        );
      };

      // Start reading the file as an array buffer
      reader.readAsArrayBuffer(file);
    }
  }
}
