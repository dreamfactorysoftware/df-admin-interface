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
import {
  BASE_SERVICE_TOKEN,
  FILE_SERVICE_TOKEN,
} from 'src/app/core/constants/tokens';
import { FileTableRow, FileResponse } from '../df-files.types';
import { getFilterQuery } from 'src/app/shared/utilities/filter-queries';
import { ROUTES } from 'src/app/core/constants/routes';

@Component({
  selector: 'df-files-table',
  templateUrl:
    '../../shared/components/df-manage-table/df-manage-table.component.html',
  styleUrls: [
    '../../shared/components/df-manage-table/df-manage-table.component.scss',
  ],
  standalone: true,
  imports: [DfManageTableModules],
})
export class DfFilesTableComponent extends DfManageTableComponent<any> {
  constructor(
    @Inject(FILE_SERVICE_TOKEN)
    private crudService: DfBaseCrudService,
    router: Router,
    activatedRoute: ActivatedRoute,
    liveAnnouncer: LiveAnnouncer,
    translateService: TranslocoService,
    dialog: MatDialog
  ) {
    super(router, activatedRoute, liveAnnouncer, translateService, dialog);
  }
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
        this.router.navigate([ROUTES.ADMIN_SETTINGS, ROUTES.FILES, row.path]);
      },
      ariaLabel: {
        key: 'view',
      },
    },
    additional: this.actions.additional,
  };

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
    // TODO: implement error handling
    //  this.triggerAlert
  }

  refreshTable = () => null;
}
