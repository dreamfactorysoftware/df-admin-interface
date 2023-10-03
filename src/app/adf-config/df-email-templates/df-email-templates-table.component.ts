import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Component, Inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  DfManageTableComponent,
  DfManageTableModules,
} from 'src/app/shared/components/df-manage-table/df-manage-table.component';
import { DfBaseCrudService } from 'src/app/shared/services/df-base-crud.service';
import { EMAIL_TEMPLATES_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';
import { TranslocoService } from '@ngneat/transloco';
import { GenericListResponse } from 'src/app/shared/types/generic-http';
import { MatDialog } from '@angular/material/dialog';
import {
  EmailTemplate,
  EmailTemplateRow,
} from '../../shared/types/email-templates';
import { getFilterQuery } from 'src/app/shared/utilities/filter-queries';
import { UntilDestroy } from '@ngneat/until-destroy';
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-email-templates-table',
  templateUrl:
    '../../shared/components/df-manage-table/df-manage-table.component.html',
  styleUrls: [
    '../../shared/components/df-manage-table/df-manage-table.component.scss',
  ],
  standalone: true,
  imports: DfManageTableModules,
})
//TODO add type
export class DfEmailTemplatesTableComponent extends DfManageTableComponent<any> {
  constructor(
    @Inject(EMAIL_TEMPLATES_SERVICE_TOKEN)
    private emailTemplateService: DfBaseCrudService,
    router: Router,
    activatedRoute: ActivatedRoute,
    liveAnnouncer: LiveAnnouncer,
    translateService: TranslocoService,
    dialog: MatDialog
  ) {
    super(router, activatedRoute, liveAnnouncer, translateService, dialog);
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

  filterQuery = getFilterQuery('emailTemplates');

  override deleteRow(row: EmailTemplateRow): void {
    this.emailTemplateService.delete(row.id).subscribe(() => {
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
      .subscribe(data => {
        this.dataSource.data = this.mapDataToTable(data.resource);
        this.tableLength = data.meta.count;
      });
  }
}
