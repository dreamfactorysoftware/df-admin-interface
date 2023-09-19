import { Component, ViewChild } from '@angular/core';
import { DfFilesTableComponent } from './df-files-table.component';
import { faFolderPlus, faUpload } from '@fortawesome/free-solid-svg-icons';
import { TranslocoPipe } from '@ngneat/transloco';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AsyncPipe, NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { FileResponse } from '../df-files.types';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DfFolderDialogComponent } from '../df-folder-dialog/df-folder-dialog.component';

@Component({
  selector: 'df-files',
  templateUrl: './df-files.component.html',
  styleUrls: ['./df-files.component.scss'],
  standalone: true,
  imports: [
    DfFilesTableComponent,
    TranslocoPipe,
    FontAwesomeModule,
    NgIf,
    MatButtonModule,
    AsyncPipe,
    MatMenuModule,
    MatDialogModule,
    DfFolderDialogComponent,
  ],
})
export class DfFilesComponent {
  faUpload = faUpload;
  faFolderPlus = faFolderPlus;
  filesTableData: FileResponse[];
  destroyed$ = new Subject<void>();
  currentRoute = '';
  @ViewChild(DfFilesTableComponent) filesTable: DfFilesTableComponent;

  constructor(
    private activatedRoute: ActivatedRoute,
    public dialog: MatDialog
  ) {
    this.activatedRoute.data
      .pipe(takeUntil(this.destroyed$))
      .subscribe(data => {
        this.filesTableData = data['data'].resource;
      });
  }

  // TODO get working
  uploadFile(event: Event): void {
    // ! no file type limitations on input
    // ! user can select multiple files
    // POST http://localhost/api/v2/files/{FOLDER_NAME}/?api_key={API_KEY}

    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.filesTable.uploadFile(input.files);
    }
  }

  createFolder(): void {
    const dialogRef = this.dialog.open(DfFolderDialogComponent, {
      data: {
        route: decodeURIComponent(this.activatedRoute.snapshot.url.toString()),
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.refreshData) {
        this.filesTable.refreshTable();
      }
    });
  }
}
