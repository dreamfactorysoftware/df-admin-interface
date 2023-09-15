import { Component, Inject } from '@angular/core';
import { DfFilesTableComponent } from './df-files-table.component';
import { faFolderPlus, faUpload } from '@fortawesome/free-solid-svg-icons';
import { TranslocoPipe, TranslocoService } from '@ngneat/transloco';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AsyncPipe, NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { FileResponse, FileTableRow } from '../df-files.types';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MatMenuModule } from '@angular/material/menu';
import { FILE_SERVICE_TOKEN } from 'src/app/core/constants/tokens';
import { DfBaseCrudService } from 'src/app/core/services/df-base-crud.service';
import { ROUTES } from 'src/app/core/constants/routes';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DfFilesDialogComponent } from './df-files-dialog.component';

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
    DfFilesDialogComponent,
  ],
})
export class DfFilesComponent {
  // ** Resolver GET /api/v2?group=File&_=1694700647562 > response.services
  // what is the number at the end?
  // ** create folder
  // POST http://localhost/api/v2/files/
  // payload {name: "testfolder", path: "testfolder"}
  // ** delete folder
  // POST http://localhost/api/v2/files/{FOLDER_NAME}/?force=true
  // ** navigate to folder
  // GET http://localhost/api/v2/files/{FOLDER_NAME}/
  // response: {resource: []}
  // ** upload file
  // ! no file type limitations on input
  // ! user can select multiple files
  // POST http://localhost/api/v2/files/{FOLDER_NAME}/?api_key={API_KEY}
  // payload = form data
  // response = {resource: []}
  // ** edit file
  // GET http://localhost/api/v2/files/{FOLDER_NAME}/{FILE_NAME}?method=GET
  // response = string?
  // PUT http://localhost/api/v2/files/{FOLDER_NAME}/{FILE_NAME}?method=GET
  // ** download file
  // ??
  // ** delete file
  // POST http://localhost/api/v2/files/{FOLDER_NAME}/{FILE_NAME}?force=true

  faUpload = faUpload;
  faFolderPlus = faFolderPlus;
  filesTableData: FileResponse[];
  destroyed$ = new Subject<void>();

  constructor(
    @Inject(FILE_SERVICE_TOKEN)
    private crudService: DfBaseCrudService,
    private activatedRoute: ActivatedRoute,
    private translateService: TranslocoService,
    private router: Router,
    public dialog: MatDialog
  ) {
    this.activatedRoute.data
      .pipe(takeUntil(this.destroyed$))
      .subscribe(data => {
        // RESOLVER DATA
        this.filesTableData = data['data'].services;
      });
  }

  // ! DELETE
  testEditFile(): void {
    this.router.navigate(['details'], {
      relativeTo: this.activatedRoute,
    });
  }

  uploadFile(): void {
    console.log('upload file');
  }

  createFolder(): void {
    console.log('create folder');
    this.dialog.open(DfFilesDialogComponent);
  }

  // TODO: hide "edit" action option for folders

  openFolder(row: FileTableRow) {
    console.log('open', row);
    this.router.navigate([
      ROUTES.ADMIN_SETTINGS,
      ROUTES.FILES,
      (row as any).path,
    ]);
  }

  openFolderLabel(row: FileTableRow) {
    return this.translateService.selectTranslate('files.openFolder', {
      name: (row as any).name,
    });
  }

  // TODO: config.allowedActions ?
  // https://github.com/dreamfactorysoftware/df-filemanager-app/blob/master/js/angular-filemanager/src/templates/item-toolbar.html
  downloadFolder(row: FileTableRow) {
    console.log('download', row);
  }

  downloadFolderLabel(row: FileTableRow) {
    return this.translateService.selectTranslate('files.download', {
      name: (row as any).name,
    });
  }
}
