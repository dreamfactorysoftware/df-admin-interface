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
import { DfBaseCrudService } from 'src/app/shared/services/df-base-crud.service';
import { BASE_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';
import { FileTableRow, FileResponse, FileType } from '../df-files.types';
import { getFilterQuery } from 'src/app/shared/utilities/filter-queries';
import { ROUTES } from 'src/app/shared/constants/routes';
import { takeUntil } from 'rxjs';
import { GenericListResponse } from 'src/app/shared/types/generic-http.type';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { NgIf } from '@angular/common';
import { saveAsFile } from 'src/app/shared/utilities/file';
import { URLS } from 'src/app/shared/constants/urls';

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
export class DfFilesTableComponent extends DfManageTableComponent<FileTableRow> {
  type: 'files' | 'logs';
  path: string;

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
        this.type = data['type'];
      });
    this._activatedRoute.paramMap
      .pipe(takeUntil(this.destroyed$))
      .subscribe(params => (this.path = params.get('entity') || ''));
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
      function: (row: any) =>
        row.type === 'file'
          ? this.router.navigate([ROUTES.VIEW, row.name], {
              relativeTo: this._activatedRoute,
            })
          : this.router.navigate([ROUTES.ADMIN_SETTINGS, this.type, row.path]),
      ariaLabel: {
        key: 'view',
      },
      disabled: (row: any) => row.type === 'file' && this.type !== 'logs',
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
        label: 'files.download',
        icon: faDownload,
        function: (row: FileTableRow) => this.download(row),
        ariaLabel: {
          key: 'files.download',
          param: 'label',
        },
      },
    ],
  };

  download(row: FileTableRow) {
    const additionalParams = [];
    const isFolder = row.type === 'folder';
    if (isFolder) {
      additionalParams.push({ key: 'zip', value: 'true' });
    }
    this.crudService
      .downloadFile(`${this.type}/${row.path}`, { additionalParams })
      .subscribe(({ body }) => {
        saveAsFile(body, `${row.name}${isFolder ? '.zip' : ''}`);
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
      .legacyDelete(`${this.type}/${row.path}`, {
        additionalParams: [{ key: 'force', value: 'true' }],
      })
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => {
        this.refreshTable(0);
      });
  }

  uploadFile(files: FileList) {
    this.crudService
      .uploadFile(`files/${this.path}`, files, {
        snackbarSuccess: 'files.alerts.uploadSuccess',
      })
      .subscribe(() => {
        this.refreshTable(0);
      });
  }

  refreshTable(limit?: number): void {
    const route = decodeURIComponent(
      this._activatedRoute.snapshot.url.toString()
    );
    this.crudService
      .get<GenericListResponse<FileType>>(`${this.type}/${route}`, { limit })
      .pipe(takeUntil(this.destroyed$))
      .subscribe(data => {
        this.dataSource.data = this.mapDataToTable(data.resource);
      });
  }
}
