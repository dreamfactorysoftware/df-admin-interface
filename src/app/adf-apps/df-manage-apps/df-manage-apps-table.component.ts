import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Component, Inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  DfManageTableComponent,
  DfManageTableModules,
} from 'src/app/shared/components/df-manage-table/df-manage-table.component';
import { AppType } from '../../shared/types/apps';
import {
  APP_SERVICE_TOKEN,
  LIMIT_SERVICE_TOKEN,
} from 'src/app/shared/constants/tokens';
import { DfBaseCrudService } from 'src/app/shared/services/df-base-crud.service';
import { GenericListResponse } from 'src/app/shared/types/generic-http';
import { TranslocoService } from '@ngneat/transloco';
import { MatDialog } from '@angular/material/dialog';
import { getFilterQuery } from 'src/app/shared/utilities/filter-queries';
import { UntilDestroy } from '@ngneat/until-destroy';
import { generateApiKey } from 'src/app/shared/utilities/hash';
import { DfSystemConfigDataService } from 'src/app/shared/services/df-system-config-data.service';
import { AdditonalAction } from 'src/app/shared/types/table';
import { DfSnackbarService } from 'src/app/shared/services/df-snackbar.service';
import { DfDuplicateDialogComponent } from 'src/app/shared/components/df-duplicate-dialog/df-duplicate-dialog.component';
import { DfEmptyStateComponent } from 'src/app/shared/components/df-empty-state/df-empty-state.component';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { faCopy } from '@fortawesome/free-solid-svg-icons';
import { catchError, forkJoin, of, throwError } from 'rxjs';
import { UsageService, n } from 'src/app/adf-ai-usage/services/usage.service';
import { LimitType } from 'src/app/shared/types/limit';

/** Threshold state for a key's rate-limit meter. */
type MeterVariant = 'ok' | 'warning' | 'danger';

/** A key's live budget meter: real consumed-vs-cap pulled from the rate-limit
 *  cache counter that governs the key's role. Never synthesized. */
interface KeyMeter {
  consumed: number;
  cap: number;
  ratio: number; // clamped 0..1 for the bar width
  period: string;
  variant: MeterVariant;
  label: string; // "42 / 1000"
}

/** A virtual-key row: the API-key record plus the live metering figures that
 *  turn it from a credential into a metered key. Every metric field is
 *  nullable; null means "no real source for this key" and renders as an honest
 *  empty, never a zero we made up. */
interface VirtualKeyRow {
  id: number;
  name: string;
  role: string;
  roleId: number | null;
  apiKey: string;
  description?: string;
  active: boolean;
  launchUrl: string;
  createdById: number;
  tokens: number | null;
  spendUsd: number | null;
  meter: KeyMeter | null;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-manage-apps-table',
  templateUrl: './df-manage-apps-table.component.html',
  styleUrls: [
    '../../shared/components/df-manage-table/df-manage-table.component.scss',
    './df-manage-apps-table.component.scss',
  ],
  standalone: true,
  imports: [
    ...DfManageTableModules,
    DfEmptyStateComponent,
    DecimalPipe,
    CurrencyPipe,
  ],
})
export class DfManageAppsTableComponent extends DfManageTableComponent<VirtualKeyRow> {
  override emptyStateMessage = 'emptyState.apps.message';
  override emptyStateActionLabel = 'emptyState.apps.action';

  // Live metering, keyed for O(1) lookup during row mapping. Populated once,
  // asynchronously; every fetch reads through these so re-fetches stay enriched.
  private usageByApp = new Map<number, { tokens: number; spend: number }>();
  private meterByRole = new Map<number, KeyMeter>();

  constructor(
    @Inject(APP_SERVICE_TOKEN)
    private appsService: DfBaseCrudService,
    @Inject(LIMIT_SERVICE_TOKEN)
    private limitService: DfBaseCrudService,
    private usageService: UsageService,
    override systemConfigDataService: DfSystemConfigDataService,
    router: Router,
    activatedRoute: ActivatedRoute,
    liveAnnouncer: LiveAnnouncer,
    translateService: TranslocoService,
    dialog: MatDialog,
    private snackbarService: DfSnackbarService
  ) {
    super(router, activatedRoute, liveAnnouncer, translateService, dialog);
    this.snackbarService.setSnackbarLastEle('', false);
    const extraActions: Array<AdditonalAction<VirtualKeyRow>> = [
      {
        label: 'apps.launchApp',
        function: (row: VirtualKeyRow) => {
          window.open(row.launchUrl, '_blank');
        },
        ariaLabel: {
          key: 'apps.launchApp',
        },
        disabled: (row: VirtualKeyRow) => !row.launchUrl,
      },
      {
        label: 'apps.createApp.apiKey.copy',
        function: (row: VirtualKeyRow) => {
          navigator.clipboard.writeText(row.apiKey);
        },
        ariaLabel: {
          key: 'apps.createApp.apiKey.copy',
        },
      },
      {
        label: 'apps.createApp.apiKey.refresh',
        function: async (row: VirtualKeyRow) => {
          const newKey = await generateApiKey(
            this.systemConfigDataService.environment.server.host,
            row.name
          );
          this.appsService
            .update(row.id, { api_key: newKey })
            .subscribe(() => this.refreshTable());
        },
        ariaLabel: {
          key: 'apps.createApp.apiKey.refresh',
        },
        disabled: row => row.createdById === null,
      },
    ];

    // Add duplicate action before delete action
    const duplicateAction = {
      label: 'duplicate',
      function: (row: VirtualKeyRow) => this.duplicateApp(row),
      ariaLabel: {
        key: 'duplicateApp',
        param: 'name',
      },
      icon: faCopy,
    };

    if (this.actions.additional) {
      // Find the delete action index
      const deleteIndex = this.actions.additional.findIndex(
        action => action.label === 'delete'
      );
      if (deleteIndex !== -1) {
        // Insert duplicate before delete
        this.actions.additional.splice(deleteIndex, 0, duplicateAction);
      } else {
        // Add at the beginning if no delete found
        this.actions.additional.unshift(duplicateAction);
      }
      // Add the extra actions at the end
      this.actions.additional.push(...extraActions);
    } else {
      this.actions.additional = [duplicateAction, ...extraActions];
    }

    this.loadMetrics();
  }

  override columns = [
    {
      columnDef: 'active',
      cell: (row: VirtualKeyRow) => row.active,
      header: 'active',
    },
    {
      columnDef: 'name',
      cell: (row: VirtualKeyRow) => row.name,
      header: 'name',
    },
    {
      columnDef: 'role',
      cell: (row: VirtualKeyRow) => row.role,
      header: 'role',
    },
    {
      columnDef: 'apiKey',
      cell: (row: VirtualKeyRow) => row.apiKey,
      header: 'apiKey',
    },
    {
      columnDef: 'tokens',
      cell: (row: VirtualKeyRow) => row.tokens,
      header: 'apps.virtualKey.tokens',
    },
    {
      columnDef: 'spend',
      cell: (row: VirtualKeyRow) => row.spendUsd,
      header: 'apps.virtualKey.spend',
    },
    {
      columnDef: 'meter',
      cell: (row: VirtualKeyRow) => row.meter,
      header: 'apps.virtualKey.rateLimit',
    },
    {
      columnDef: 'actions',
    },
  ];

  mapDataToTable(data: AppType[]): VirtualKeyRow[] {
    return data.map((app: AppType) => this.enrich(this.baseRow(app)));
  }

  private baseRow(app: AppType): VirtualKeyRow {
    return {
      id: app.id,
      name: app.name,
      role: app.roleByRoleId?.description || '',
      roleId: app.roleId ?? null,
      apiKey: app.apiKey,
      description: app.description,
      active: app.isActive,
      launchUrl: app.launchUrl,
      createdById: app.createdById,
      tokens: null,
      spendUsd: null,
      meter: null,
    };
  }

  /** Fold the live metering maps onto a row. Missing entries stay null so the
   *  template can show an honest empty instead of a fabricated zero. */
  private enrich(row: VirtualKeyRow): VirtualKeyRow {
    const usage = this.usageByApp.get(row.id);
    const meter = row.roleId != null ? this.meterByRole.get(row.roleId) : null;
    return {
      ...row,
      tokens: usage ? usage.tokens : null,
      spendUsd: usage ? usage.spend : null,
      meter: meter ?? null,
    };
  }

  /** One-shot load of the two real metering sources: the AI usage aggregate
   *  (per-app tokens + spend) and the rate-limit cache (per-role consumed vs
   *  cap). Both degrade silently to "no data" so a metering hiccup never turns
   *  the key list into an error screen. */
  private loadMetrics(): void {
    forkJoin({
      usage: this.usageService.loadAll('30d').pipe(catchError(() => of(null))),
      limits: this.limitService
        .getAll<GenericListResponse<LimitType>>({
          limit: 0,
          related: 'limit_cache_by_limit_id',
        })
        .pipe(catchError(() => of(null))),
    }).subscribe(({ usage, limits }) => {
      if (usage) {
        this.usageByApp.clear();
        for (const row of usage.raw.by_app ?? []) {
          if (row.app_id == null) {
            continue;
          }
          this.usageByApp.set(row.app_id, {
            tokens: n(row.input_tokens) + n(row.output_tokens),
            spend: n(row.cost_usd),
          });
        }
      }
      if (limits) {
        this.meterByRole = this.buildMeters(limits.resource ?? []);
      }
      this.enrichExistingRows();
    });
  }

  /** Tightest active role-scoped limit per role. A key runs under its role, so
   *  that role's rate limit is the real cap governing the key. Global and
   *  user/service-scoped limits are intentionally excluded: they don't map to a
   *  single key. */
  private buildMeters(limits: LimitType[]): Map<number, KeyMeter> {
    const byRole = new Map<number, KeyMeter>();
    for (const limit of limits) {
      if (!limit.isActive || limit.roleId == null) {
        continue;
      }
      const cache = limit.limitCacheByLimitId?.[0];
      const cap = cache?.max ?? limit.rate;
      if (!cap || cap <= 0) {
        continue;
      }
      const consumed = cache?.attempts ?? 0;
      const meter = this.toMeter(consumed, cap, limit.period);
      const existing = byRole.get(limit.roleId);
      if (!existing || meter.ratio > existing.ratio) {
        byRole.set(limit.roleId, meter);
      }
    }
    return byRole;
  }

  private toMeter(consumed: number, cap: number, period: string): KeyMeter {
    const ratio = Math.max(0, Math.min(1, cap > 0 ? consumed / cap : 0));
    let variant: MeterVariant = 'ok';
    if (ratio >= 0.9) {
      variant = 'danger';
    } else if (ratio >= 0.75) {
      variant = 'warning';
    }
    return {
      consumed,
      cap,
      ratio,
      period,
      variant,
      label: `${consumed} / ${cap}`,
    };
  }

  private enrichExistingRows(): void {
    if (!this.dataSource.data.length) {
      return;
    }
    this.dataSource.data = this.dataSource.data.map(row => this.enrich(row));
  }

  filterQuery = getFilterQuery('apps');

  override deleteRow(row: VirtualKeyRow): void {
    this.appsService.delete(row.id).subscribe(() => {
      this.refreshTable();
    });
  }

  refreshTable(limit?: number, offset?: number, filter?: string): void {
    this.fetchTable(this.appsService, { limit, offset, filter });
  }

  duplicateApp(row: VirtualKeyRow): void {
    // First, get the full app details
    this.appsService
      .get<AppType>(row.id)
      .pipe(
        catchError(error => {
          console.error('Failed to fetch app details:', error);
          return throwError(() => error);
        })
      )
      .subscribe(app => {
        // Get all existing app names for validation
        this.appsService
          .getAll<GenericListResponse<AppType>>({ limit: 1000 })
          .subscribe(allApps => {
            const existingNames = allApps.resource.map(a => a.name);

            const dialogRef = this.dialog.open(DfDuplicateDialogComponent, {
              width: '400px',
              data: {
                title: 'apps.duplicate.title',
                message: 'apps.duplicate.message',
                label: 'apps.duplicate.nameLabel',
                originalName: app.name,
                existingNames: existingNames,
              },
            });

            dialogRef.afterClosed().subscribe(newName => {
              if (newName) {
                // Create a copy of the app with the new name
                // Using snake_case as expected by the API
                // Note: API key is generated server-side, not sent in payload
                const duplicatedApp = {
                  name: newName,
                  description: `${app.description || ''} (copy)`,
                  is_active: app.isActive,
                  type: app.type,
                  role_id: app.roleId || null,
                  // Copy app location specific fields
                  url: app.url || null,
                  storage_service_id: app.storageServiceId || null,
                  storage_container: app.storageContainer || null,
                  path: app.path || null,
                  // Copy additional settings
                  requires_fullscreen: app.requiresFullscreen,
                  allow_fullscreen_toggle: app.allowFullscreenToggle,
                  toggle_location: app.toggleLocation,
                };

                // Wrap in resource array as expected by the API
                const payload = {
                  resource: [duplicatedApp],
                };

                // Create the new app
                this.appsService
                  .create(payload, {
                    snackbarSuccess: 'apps.alerts.duplicateSuccess',
                    fields: '*',
                    related: 'role_by_role_id',
                  })
                  .pipe(
                    catchError(error => {
                      console.error('Failed to duplicate app:', error);
                      return throwError(() => error);
                    })
                  )
                  .subscribe(() => {
                    this.refreshTable();
                  });
              }
            });
          });
      });
  }
}
