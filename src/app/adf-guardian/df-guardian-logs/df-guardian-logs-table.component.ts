import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Component, Inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  DfManageTableComponent,
  DfManageTableModules,
} from 'src/app/shared/components/df-manage-table/df-manage-table.component';
import { GUARDIAN_LOG_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';
import { DfBaseCrudService } from 'src/app/shared/services/df-base-crud.service';
import { TranslocoService } from '@ngneat/transloco';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy } from '@ngneat/until-destroy';
import { GuardianLogEntry, GuardianLogTableRow } from '../types';

interface LogListResponse {
  resource: GuardianLogEntry[];
  meta: { count: number };
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-guardian-logs-table',
  templateUrl:
    '../../shared/components/df-manage-table/df-manage-table.component.html',
  styleUrls: [
    '../../shared/components/df-manage-table/df-manage-table.component.scss',
  ],
  standalone: true,
  imports: DfManageTableModules,
})
export class DfGuardianLogsTableComponent extends DfManageTableComponent<GuardianLogTableRow> {
  override allowCreate = false;

  constructor(
    @Inject(GUARDIAN_LOG_SERVICE_TOKEN)
    private logService: DfBaseCrudService,
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
      columnDef: 'method',
      cell: (row: GuardianLogTableRow) => row.method,
      header: 'Method',
    },
    {
      columnDef: 'service',
      cell: (row: GuardianLogTableRow) => row.service,
      header: 'Service',
    },
    {
      columnDef: 'resource',
      cell: (row: GuardianLogTableRow) => row.resource,
      header: 'Resource',
    },
    {
      columnDef: 'user_email',
      cell: (row: GuardianLogTableRow) => row.user_email,
      header: 'User',
    },
    {
      columnDef: 'risk_score',
      cell: (row: GuardianLogTableRow) => row.risk_score,
      header: 'Risk',
    },
    {
      columnDef: 'decision',
      cell: (row: GuardianLogTableRow) => row.decision,
      header: 'Decision',
    },
    {
      columnDef: 'threat_type',
      cell: (row: GuardianLogTableRow) => row.threat_type || '-',
      header: 'Threat',
    },
    {
      columnDef: 'ai_provider',
      cell: (row: GuardianLogTableRow) => row.ai_provider,
      header: 'Provider',
    },
    {
      columnDef: 'created_at',
      cell: (row: GuardianLogTableRow) =>
        new Date(row.created_at).toLocaleString(),
      header: 'Time',
    },
  ];

  mapDataToTable(data: GuardianLogEntry[]): GuardianLogTableRow[] {
    return data.map(log => ({
      id: log.id,
      method: log.method,
      service: log.service,
      resource: log.resource,
      user_email: log.user_email,
      risk_score: log.risk_score,
      decision: log.decision,
      threat_type: log.threat_type || '-',
      ai_provider: log.ai_provider,
      created_at: log.created_at,
    }));
  }

  filterQuery = (value: string) =>
    `(user_email like %25${value}%25) or (service like %25${value}%25) or (decision like %25${value}%25)`;

  refreshTable(limit?: number, offset?: number, filter?: string): void {
    this.logService
      .getAll<LogListResponse>({ limit, offset, filter })
      .subscribe(data => {
        this.dataSource.data = this.mapDataToTable(data.resource);
        this.tableLength = data.meta.count;
      });
  }
}
