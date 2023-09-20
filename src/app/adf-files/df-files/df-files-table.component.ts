import { Component, Inject } from '@angular/core';
import {
  Actions,
  DfManageTableComponent,
  DfManageTableModules,
} from '../../shared/components/df-manage-table/df-manage-table.component';
import { ActivatedRoute, Router } from '@angular/router';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { TranslocoService } from '@ngneat/transloco';
import { MatDialog } from '@angular/material/dialog';
import { DfBaseCrudService } from 'src/app/core/services/df-base-crud.service';
import { BASE_SERVICE_TOKEN } from 'src/app/core/constants/tokens';
import { FileTableRow, FileResponse, FileType } from '../df-files.types';
import { getFilterQuery } from 'src/app/shared/utilities/filter-queries';
import { ROUTES } from 'src/app/core/constants/routes';
import { takeUntil } from 'rxjs';
import { GenericListResponse } from 'src/app/shared/types/generic-http.type';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { NgIf } from '@angular/common';
import { saveAsFile } from 'src/app/shared/utilities/file';

@Component({
  selector: 'df-files-table',
  templateUrl:
    '../../shared/components/df-manage-table/df-manage-table.component.html',
  styleUrls: [
    '../../shared/components/df-manage-table/df-manage-table.component.scss',
  ],
  standalone: true,
  imports: [DfManageTableModules, NgIf],
})
export class DfFilesTableComponent extends DfManageTableComponent<any> {
  path: 'files' | 'logs';

  constructor(
    @Inject(BASE_SERVICE_TOKEN)
    private crudService: DfBaseCrudService,
    router: Router,
    activatedRoute: ActivatedRoute,
    liveAnnouncer: LiveAnnouncer,
    translateService: TranslocoService,
    dialog: MatDialog
  ) {
    super(router, activatedRoute, liveAnnouncer, translateService, dialog);

    this._activatedRoute.data
      .pipe(takeUntil(this.destroyed$))
      .subscribe(data => {
        this.path = data['type'];
      });
  }
  faDownload = faDownload;
  override allowFilter = false;
  override allowCreate = false;
  override columns = [
    {
      columnDef: 'name',
      header: 'name',
      cell: (row: FileTableRow) => row.name,
    },
    {
      columnDef: 'type',
      header: 'type',
      cell: (row: FileTableRow) =>
        row.type === 'folder' ? 'Folder' : row.contentType,
    },
    {
      columnDef: 'actions',
    },
  ];

  override actions: Actions<any> = {
    default: {
      label: 'view',
      function: (row: any) => {
        this.router.navigate([ROUTES.ADMIN_SETTINGS, this.path, row.path]);
      },
      ariaLabel: {
        key: 'view',
      },
    },
    additional: [
      {
        label: 'delete',
        function: row => this.confirmDelete(row),
        ariaLabel: {
          key: 'deleteRow',
          param: 'id',
        },
        icon: this.faTrashCan,
      },
      {
        label: 'files.downloadFile',
        icon: faDownload,
        function: (row: FileTableRow) => this.downloadFile(row),
        ariaLabel: {
          key: 'files.downloadFile',
          param: 'label',
        },
      },
    ],
  };

  // TODO: file download not working
  downloadFile(row: FileTableRow) {
    console.log('download', `${this.path}/${row.path}`, row);
    // return;

    this.crudService
      .downloadFile(`${this.path}/${row.path}`)
      .subscribe(data => {
        console.log('data', data);
        saveAsFile(data, row.name, row.contentType);
      });
  }

  mapDataToTable(data: any): FileTableRow[] {
    return data.map((app: FileResponse) => {
      return {
        name: app.name,
        path: app.path,
        type: app.type,
        contentType: app.contentType,
      };
    });
  }

  filterQuery = getFilterQuery();

  override deleteRow(row: FileTableRow): void {
    this.crudService
      .create(
        { resource: [] },
        {
          additionalHeaders: [{ key: 'X-Http-Method', value: 'DELETE' }],
          snackbarSuccess: 'files.alerts.deleteFolderSuccess',
        },
        `${this.path}/${row.path}?force=true`
      )
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => {
        this.refreshTable(0);
      });

    // TODO: implement error handling
    //  this.triggerAlert
  }

  // TODO: get working
  uploadFile(files: FileList) {
    // example: ?api_key=b5cb82af7b5d4130f36149f90aa2746782e59a872ac70454ac188743cb55b0ba&session_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI5Mzk0MmU5NmY1YWNkODNlMmUwNDdhZDhmZTAzMTE0ZCIsImlzcyI6Imh0dHA6Ly9sb2NhbGhvc3QvYXBpL3YyL3N5c3RlbS9hZG1pbi9zZXNzaW9uIiwiaWF0IjoxNjk1MDg1MjU1LCJleHAiOjE2OTUxNzE2NTUsIm5iZiI6MTY5NTA4NTI1NSwianRpIjoiSExKTDU4ekxtUG1rNTNYZiIsInVzZXJfaWQiOjEsImZvcmV2ZXIiOmZhbHNlfQ.3Ost6JbtVeELZMi7JKvUlfCIJ_fwfS1V7GImMXi2DCA
    const route = decodeURIComponent(
      this._activatedRoute.snapshot.url.toString()
    );
    this.crudService
      .uploadFile(
        files[0],
        { snackbarSuccess: 'files.alerts.uploadSuccess' }
        // `${this.path}/${route}`
      )
      .subscribe(() => {
        this.refreshTable(0);
      });
  }

  refreshTable(limit?: number): void {
    const route = decodeURIComponent(
      this._activatedRoute.snapshot.url.toString()
    );
    this.crudService
      .get<GenericListResponse<FileType>>(`${this.path}/${route}`, { limit })
      .pipe(takeUntil(this.destroyed$))
      .subscribe(data => {
        this.dataSource.data = this.mapDataToTable(data.resource);
      });
  }
}
