import { Component, Inject } from '@angular/core';
import { DfManageTableComponent } from '../../shared/components/df-manage-table/df-manage-table.component';
import { ActivatedRoute, Router } from '@angular/router';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { DfBreakpointService } from '../../core/services/df-breakpoint.service';
import { TranslocoPipe, TranslocoService } from '@ngneat/transloco';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { AsyncPipe, NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { DfBaseCrudService } from 'src/app/core/services/df-base-crud.service';
import {
  BASE_SERVICE_TOKEN,
  FILE_SERVICE_TOKEN,
} from 'src/app/core/constants/tokens';
import { takeUntil } from 'rxjs';
import { ROUTES } from 'src/app/core/constants/routes';
import { FileTableRow, FileResponse } from '../df-files.types';

@Component({
  selector: 'df-files-table',
  templateUrl:
    '../../shared/components/df-manage-table/df-manage-table.component.html',
  styleUrls: [
    '../../shared/components/df-manage-table/df-manage-table.component.scss',
  ],
  standalone: true,
  imports: [
    MatButtonModule,
    FontAwesomeModule,
    MatTableModule,
    MatPaginatorModule,
    TranslocoPipe,
    AsyncPipe,
    NgIf,
    NgFor,
    NgTemplateOutlet,
    MatMenuModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
  ],
})
export class DfFilesTableComponent extends DfManageTableComponent<any> {
  constructor(
    @Inject(FILE_SERVICE_TOKEN)
    private crudService: DfBaseCrudService,
    router: Router,
    activatedRoute: ActivatedRoute,
    liveAnnouncer: LiveAnnouncer,
    breakpointService: DfBreakpointService,
    translateService: TranslocoService,
    dialog: MatDialog
  ) {
    super(
      router,
      activatedRoute,
      liveAnnouncer,
      breakpointService,
      translateService,
      dialog
    );
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

  filterQuery(value: string): string {
    return '';
  }

  override editRow(row: FileTableRow): void {
    this.router.navigate([ROUTES.ADMIN_SETTINGS, ROUTES.FILES, row.path]);
  }

  override deleteRow(row: FileTableRow): void {
    // TODO: implement error handling
    //  this.triggerAlert
  }

  refreshTable(limit?: number, offset?: number, filter?: string): void {
    //TODO ??
  }
}
