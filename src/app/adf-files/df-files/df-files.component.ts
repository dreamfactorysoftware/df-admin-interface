import { Component, ViewChild } from '@angular/core';
import { DfFilesTableComponent } from './df-files-table.component';
import { faFolderPlus, faUpload } from '@fortawesome/free-solid-svg-icons';
import { TranslocoPipe } from '@ngneat/transloco';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AsyncPipe, NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DfFolderDialogComponent } from '../df-folder-dialog/df-folder-dialog.component';
import { UntilDestroy } from '@ngneat/until-destroy';
@UntilDestroy({ checkProperties: true })
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
  currentRoute = '';
  @ViewChild(DfFilesTableComponent) filesTable: DfFilesTableComponent;
  type: 'files' | 'logs';
  constructor(
    private activatedRoute: ActivatedRoute,
    public dialog: MatDialog
  ) {
    this.activatedRoute.data.subscribe(({ type }) => {
      this.type = type;
    });
  }

  uploadFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.filesTable.uploadFile(input.files);
      this.filesTable.refreshTable();
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
