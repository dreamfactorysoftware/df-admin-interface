import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Component, Inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  DfManageTableComponent,
  DfManageTableModules,
} from 'src/app/shared/components/df-manage-table/df-manage-table.component';
import { GUARDIAN_APPROVAL_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';
import { DfBaseCrudService } from 'src/app/shared/services/df-base-crud.service';
import { TranslocoService } from '@ngneat/transloco';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { timer } from 'rxjs';
import { GuardianApprovalEntry, GuardianApprovalTableRow } from '../types';
import { Actions } from 'src/app/shared/types/table';

interface ApprovalListResponse {
  resource: GuardianApprovalEntry[];
  meta: { count: number };
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-guardian-approvals-table',
  templateUrl:
    '../../shared/components/df-manage-table/df-manage-table.component.html',
  styleUrls: [
    '../../shared/components/df-manage-table/df-manage-table.component.scss',
  ],
  standalone: true,
  imports: DfManageTableModules,
})
export class DfGuardianApprovalsTableComponent extends DfManageTableComponent<GuardianApprovalTableRow> {
  override allowCreate = false;

  constructor(
    @Inject(GUARDIAN_APPROVAL_SERVICE_TOKEN)
    private approvalService: DfBaseCrudService,
    router: Router,
    activatedRoute: ActivatedRoute,
    liveAnnouncer: LiveAnnouncer,
    translateService: TranslocoService,
    dialog: MatDialog
  ) {
    super(router, activatedRoute, liveAnnouncer, translateService, dialog);
  }

  override ngOnInit(): void {
    super.ngOnInit();

    // Auto-poll every 5 seconds for pending approvals
    timer(0, 5000)
      .pipe(untilDestroyed(this))
      .subscribe(() => this.refreshTable());
  }

  override actions: Actions<GuardianApprovalTableRow> = {
    default: {
      label: 'View',
      function: (row: GuardianApprovalTableRow) => this.viewRow(row),
      ariaLabel: { key: 'View approval' },
    },
    additional: [
      {
        label: 'Approve',
        function: (row: GuardianApprovalTableRow) => this.approveRequest(row),
        ariaLabel: { key: 'Approve request' },
      },
      {
        label: 'Deny',
        function: (row: GuardianApprovalTableRow) => this.denyRequest(row),
        ariaLabel: { key: 'Deny request' },
      },
    ],
  };

  override columns = [
    {
      columnDef: 'method',
      cell: (row: GuardianApprovalTableRow) => row.method,
      header: 'Method',
    },
    {
      columnDef: 'service',
      cell: (row: GuardianApprovalTableRow) => row.service,
      header: 'Service',
    },
    {
      columnDef: 'resource',
      cell: (row: GuardianApprovalTableRow) => row.resource,
      header: 'Resource',
    },
    {
      columnDef: 'user_email',
      cell: (row: GuardianApprovalTableRow) => row.user_email,
      header: 'User',
    },
    {
      columnDef: 'risk_score',
      cell: (row: GuardianApprovalTableRow) => row.risk_score,
      header: 'Risk',
    },
    {
      columnDef: 'status',
      cell: (row: GuardianApprovalTableRow) => row.status,
      header: 'Status',
    },
    {
      columnDef: 'created_at',
      cell: (row: GuardianApprovalTableRow) =>
        new Date(row.created_at).toLocaleString(),
      header: 'Requested',
    },
    {
      columnDef: 'actions',
    },
  ];

  mapDataToTable(data: GuardianApprovalEntry[]): GuardianApprovalTableRow[] {
    return data.map(approval => ({
      id: approval.id,
      method: approval.method,
      service: approval.service,
      resource: approval.resource,
      user_email: approval.user_email,
      risk_score: approval.risk_score,
      status: approval.status,
      created_at: approval.created_at,
    }));
  }

  filterQuery = (value: string) =>
    `(status like %25${value}%25) or (user_email like %25${value}%25)`;

  approveRequest(row: GuardianApprovalTableRow): void {
    this.approvalService
      .patch(row.id, { action: 'approve' })
      .subscribe(() => this.refreshTable());
  }

  denyRequest(row: GuardianApprovalTableRow): void {
    this.approvalService
      .patch(row.id, { action: 'deny' })
      .subscribe(() => this.refreshTable());
  }

  refreshTable(limit?: number, offset?: number, filter?: string): void {
    this.approvalService
      .getAll<ApprovalListResponse>({ limit, offset, filter })
      .subscribe(data => {
        this.dataSource.data = this.mapDataToTable(data.resource);
        this.tableLength = data.meta.count;
      });
  }
}
