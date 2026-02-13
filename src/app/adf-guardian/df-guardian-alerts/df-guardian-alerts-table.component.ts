import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Component, Inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  DfManageTableComponent,
  DfManageTableModules,
} from 'src/app/shared/components/df-manage-table/df-manage-table.component';
import { GUARDIAN_ALERT_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';
import { DfBaseCrudService } from 'src/app/shared/services/df-base-crud.service';
import { TranslocoService } from '@ngneat/transloco';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy } from '@ngneat/until-destroy';
import { GuardianAlertEntry, GuardianAlertTableRow } from '../types';
import { Actions } from 'src/app/shared/types/table';

interface AlertListResponse {
  resource: GuardianAlertEntry[];
  meta: { count: number };
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-guardian-alerts-table',
  templateUrl:
    '../../shared/components/df-manage-table/df-manage-table.component.html',
  styleUrls: [
    '../../shared/components/df-manage-table/df-manage-table.component.scss',
  ],
  standalone: true,
  imports: DfManageTableModules,
})
export class DfGuardianAlertsTableComponent extends DfManageTableComponent<GuardianAlertTableRow> {
  override allowCreate = false;

  constructor(
    @Inject(GUARDIAN_ALERT_SERVICE_TOKEN)
    private alertService: DfBaseCrudService,
    router: Router,
    activatedRoute: ActivatedRoute,
    liveAnnouncer: LiveAnnouncer,
    translateService: TranslocoService,
    dialog: MatDialog
  ) {
    super(router, activatedRoute, liveAnnouncer, translateService, dialog);
  }

  override actions: Actions<GuardianAlertTableRow> = {
    default: {
      label: 'View',
      function: (row: GuardianAlertTableRow) => this.viewRow(row),
      ariaLabel: { key: 'View alert' },
    },
    additional: [
      {
        label: 'Resolve',
        function: (row: GuardianAlertTableRow) => this.resolveAlert(row),
        ariaLabel: { key: 'Resolve alert' },
      },
    ],
  };

  override columns = [
    {
      columnDef: 'severity',
      cell: (row: GuardianAlertTableRow) => row.severity,
      header: 'Severity',
    },
    {
      columnDef: 'threat_type',
      cell: (row: GuardianAlertTableRow) => row.threat_type,
      header: 'Threat Type',
    },
    {
      columnDef: 'description',
      cell: (row: GuardianAlertTableRow) =>
        row.description.length > 80
          ? row.description.substring(0, 80) + '...'
          : row.description,
      header: 'Description',
    },
    {
      columnDef: 'status',
      cell: (row: GuardianAlertTableRow) => row.status,
      header: 'Status',
    },
    {
      columnDef: 'detected_at',
      cell: (row: GuardianAlertTableRow) =>
        new Date(row.detected_at).toLocaleString(),
      header: 'Detected',
    },
    {
      columnDef: 'actions',
    },
  ];

  mapDataToTable(data: GuardianAlertEntry[]): GuardianAlertTableRow[] {
    return data.map(alert => ({
      id: alert.id,
      severity: alert.severity,
      threat_type: alert.threat_type,
      description: alert.description,
      status: alert.resolved_at ? 'Resolved' : 'Open',
      detected_at: alert.detected_at,
    }));
  }

  filterQuery = (value: string) =>
    `(severity like %25${value}%25) or (threat_type like %25${value}%25)`;

  resolveAlert(row: GuardianAlertTableRow): void {
    this.alertService
      .patch(row.id, { action: 'resolve' })
      .subscribe(() => this.refreshTable());
  }

  refreshTable(limit?: number, offset?: number, filter?: string): void {
    this.alertService
      .getAll<AlertListResponse>({ limit, offset, filter })
      .subscribe(data => {
        this.dataSource.data = this.mapDataToTable(data.resource);
        this.tableLength = data.meta.count;
      });
  }
}
