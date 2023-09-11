import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Component, Inject } from '@angular/core';
import { NgIf, NgFor, NgTemplateOutlet, AsyncPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DfManageTableComponent } from 'src/app/shared/components/df-manage-table/df-manage-table.component';
import { DfBaseCrudService } from 'src/app/core/services/df-base-crud.service';
import { EMAIL_TEMPLATES_SERVICE_TOKEN } from 'src/app/core/constants/tokens';
import { DfBreakpointService } from 'src/app/core/services/df-breakpoint.service';
import { TranslocoPipe, TranslocoService } from '@ngneat/transloco';
import { GenericListResponse } from 'src/app/shared/types/generic-http.type';
import { takeUntil } from 'rxjs';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { EmailTemplate, EmailTemplateRow } from './df-email-templates.types';

@Component({
  selector: 'df-email-templates-table',
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
//TODO add type
export class DfEmailTemplatesTableComponent extends DfManageTableComponent<any> {
  constructor(
    @Inject(EMAIL_TEMPLATES_SERVICE_TOKEN)
    private emailTemplateService: DfBaseCrudService,
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

  override columns = [
    {
      columnDef: 'name',
      header: 'name',
      cell: (row: any) => row.name, //TODO add type
    },
    {
      columnDef: 'description',
      header: 'description',
      cell: (row: any) => row.description, //TODO add type
    },
    {
      columnDef: 'actions',
    },
  ];

  // TODO add type
  mapDataToTable(data: any): EmailTemplateRow[] {
    return data.map((app: EmailTemplate) => {
      return {
        id: app.id,
        name: app.name,
        description: app.description,
      };
    });
  }

  filterQuery(value: string): string {
    return `(name like "%${value}%") or (description like "%${value}%")`;
  }

  override deleteRow(row: EmailTemplateRow): void {
    this.emailTemplateService
      .delete(row.id)
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => {
        this.refreshTable();
      });
  }

  refreshTable(limit?: number, offset?: number, filter?: string): void {
    this.emailTemplateService
      .getAll<GenericListResponse<EmailTemplate>>({
        limit,
        offset,
        filter,
      })
      .pipe(takeUntil(this.destroyed$))
      .subscribe(data => {
        this.dataSource.data = this.mapDataToTable(data.resource);
        this.tableLength = data.meta.count;
      });
  }
}
