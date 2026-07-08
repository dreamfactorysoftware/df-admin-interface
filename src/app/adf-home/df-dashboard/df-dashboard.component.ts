import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@ngneat/transloco';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faShieldHalved,
  faArrowRight,
} from '@fortawesome/free-solid-svg-icons';
import { firstValueFrom } from 'rxjs';

import { BASE_URL } from 'src/app/shared/constants/urls';
import { silent } from 'src/app/shared/utilities/http-contexts';
import { SERVICES_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';
import { DfBaseCrudService } from 'src/app/shared/services/df-base-crud.service';
import { ROUTES } from 'src/app/shared/types/routes';
import type { TimeRange } from 'src/app/adf-ai-usage/services/usage.service';
import {
  DfHomeMetricsService,
  HomeMetrics,
} from 'src/app/shared/services/df-home-metrics.service';
import { ServiceScopePosture } from 'src/app/shared/services/df-scope.service';
import { DfArtifactResolverService } from 'src/app/shared/services/df-artifact-resolver.service';
import { ArtifactKeyOption } from 'src/app/shared/components/df-artifact-card/df-artifact-card.component';

import { DfPageHeaderComponent } from 'src/app/shared/components/df-page-header/df-page-header.component';
import { DfOnboardingChecklistComponent } from 'src/app/shared/components/df-onboarding-checklist/df-onboarding-checklist.component';
import { DfStatTileComponent } from 'src/app/shared/components/df-stat-tile/df-stat-tile.component';
import { DfArtifactCardComponent } from 'src/app/shared/components/df-artifact-card/df-artifact-card.component';
import { DfBadgeComponent } from 'src/app/shared/components/df-badge/df-badge.component';
import { DfEmptyStateComponent } from 'src/app/shared/components/df-empty-state/df-empty-state.component';
import { DfSkeletonComponent } from 'src/app/shared/components/df-skeleton/df-skeleton.component';

// System service names excluded from the user-facing API count / State
// detection. Mirrors DfHomeMetricsService + DfAnalyticsService (one security
// model kept in sync by hand because each holds a private copy).
const SYSTEM_SERVICE_NAMES = new Set(
  [
    'system',
    'api_docs',
    'files',
    'logs',
    'db',
    'email',
    'user',
    'script',
    'ui',
    'schema',
    'api_doc',
    'file',
    'log',
    'admin',
    'df-admin',
    'dreamfactory',
    'cache',
    'push',
    'pub_sub',
  ].map(s => s.toLowerCase())
);

interface ServiceRow {
  id: number;
  name: string;
  label?: string;
  type?: string;
}

/** One KPI tile rendered in State B. Built only from metrics with a real
 *  value; a null metric is dropped upstream so no tile is ever fabricated. */
interface KpiTile {
  key: string;
  label: string;
  value: string | number;
  route: string | unknown[];
  invertDelta?: boolean;
  /** Optional i18n key for a native tooltip explaining what the KPI means. */
  tooltip?: string;
}

type HomeState = 'loading' | 'error' | 'onboarding' | 'cockpit';

/**
 * df-dashboard — Home, the activation cockpit (Meridian Phase 2, spec 3.1).
 *
 * One surface, two states, driven by the live user-service count:
 *  - State A (zero services): the df-onboarding-checklist hero plus a
 *    "Provision sample database" action that boots a real SQLite service so the
 *    empty state ends in one working API.
 *  - State B (>=1 service): a df-stat-tile KPI grid (every value derived from a
 *    REAL endpoint via DfHomeMetricsService; null metrics are omitted, never
 *    faked) governed by one time-range select, the df-artifact-card Live API
 *    Card wired through the shared resolver so its curl returns 200, and an
 *    exposure alert strip when any user service is OPEN - broadly reachable
 *    (whole-service read+write) through an active role. Deny-by-default: a
 *    service no role grants is LOCKED, not a risk, and is never flagged.
 *
 * Loading renders df-skeleton tiles + checklist rows; a hard fetch failure
 * renders df-empty-state with retry. Tokens only, i18n via transloco.
 */
@Component({
  selector: 'df-dashboard',
  templateUrl: './df-dashboard.component.html',
  styleUrls: ['./df-dashboard.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatSelectModule,
    MatButtonModule,
    TranslocoModule,
    FontAwesomeModule,
    DfPageHeaderComponent,
    DfOnboardingChecklistComponent,
    DfStatTileComponent,
    DfArtifactCardComponent,
    DfBadgeComponent,
    DfEmptyStateComponent,
    DfSkeletonComponent,
  ],
})
export class DfDashboardComponent implements OnInit {
  readonly faShieldHalved: IconDefinition = faShieldHalved;
  readonly faArrowRight: IconDefinition = faArrowRight;

  state: HomeState = 'loading';

  // Activation counts (State A checklist inputs).
  serviceCount = 0;
  apiKeyCount = 0;
  roleCount = 0;
  firstCallMade = false;

  // State B.
  range: TimeRange = '24h';
  readonly ranges: Array<{ value: TimeRange; labelKey: string }> = [
    { value: '24h', labelKey: 'homeCockpit.ranges.24h' },
    { value: '7d', labelKey: 'homeCockpit.ranges.7d' },
    { value: '30d', labelKey: 'homeCockpit.ranges.30d' },
    { value: 'all', labelKey: 'homeCockpit.ranges.all' },
  ];
  tilesLoading = false;
  tiles: KpiTile[] = [];

  // Live API Card inputs (resolved so the curl returns 200).
  artifactServiceName = '';
  artifactBaseUrl = '';
  artifactSampleTable = 'your_table';
  artifactKeys: ArtifactKeyOption[] = [];

  // Exposure alert strip: user services classified OPEN (whole-service write
  // via some active role). Empty = nothing broadly exposed; the strip hides.
  openServices: ServiceScopePosture[] = [];
  get openCount(): number {
    return this.openServices.length;
  }
  /** Deep-link for the alert CTA: the first OPEN service's Access view when its
   *  group resolved, else the roles list so "Review access" always lands. */
  get openReviewRoute(): string | unknown[] {
    return this.openServices[0]?.detailRoute ?? this.rolesRoute;
  }
  /** Roles that make the OPEN services broadly reachable - the strip's "why". */
  get openReasons(): string {
    const roles = new Set<string>();
    for (const s of this.openServices) {
      for (const r of s.openRoles) {
        roles.add(r);
      }
    }
    return Array.from(roles).join(', ');
  }

  provisioning = false;

  readonly connectRoute = `/${ROUTES.API_CONNECTIONS}/${ROUTES.API_TYPES}`;
  readonly rolesRoute = `/${ROUTES.API_CONNECTIONS}/${ROUTES.ROLE_BASED_ACCESS}`;
  readonly apiKeysRoute = `/${ROUTES.API_CONNECTIONS}/${ROUTES.API_KEYS}`;

  private userServices: ServiceRow[] = [];

  constructor(
    private http: HttpClient,
    private homeMetrics: DfHomeMetricsService,
    private artifactResolver: DfArtifactResolverService,
    private router: Router,
    @Inject(SERVICES_SERVICE_TOKEN) private servicesService: DfBaseCrudService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  /** Full Home load. Real fetch failure => error state (with retry), never a
   *  fabricated zero that would masquerade as the empty onboarding state. */
  async load(): Promise<void> {
    this.state = 'loading';
    try {
      const [services, apiKeyCount, roleCount] = await Promise.all([
        this.fetchUserServices(),
        this.fetchCount(`${BASE_URL}/system/app`),
        this.fetchCount(`${BASE_URL}/system/role`),
      ]);
      this.userServices = services;
      this.serviceCount = services.length;
      this.apiKeyCount = apiKeyCount;
      this.roleCount = roleCount;

      if (this.serviceCount === 0) {
        this.state = 'onboarding';
        return;
      }

      await this.loadCockpit();
      this.state = 'cockpit';
    } catch {
      this.state = 'error';
    }
  }

  /** Re-slice the KPI grid on time-range change (only usage tiles move, but the
   *  metrics service is the single source so we rebuild the whole grid). */
  async onRangeChange(): Promise<void> {
    this.tilesLoading = true;
    try {
      const metrics = await this.homeMetrics.getMetrics(this.range);
      this.tiles = this.buildTiles(metrics);
      this.firstCallMade = (metrics.requestsToday.value ?? 0) > 0;
      this.openServices = metrics.openServices;
    } finally {
      this.tilesLoading = false;
    }
  }

  /** Boot a real SQLite sample service so the empty state ends in one working
   *  API. Honest by design: this creates an actual service record against the
   *  bundled SQLite driver (DreamFactory creates the file on first use). The
   *  sample database ships empty unless the instance seeds it, so the API is
   *  live but may expose no tables yet. Never a faked success. */
  async provisionSample(): Promise<void> {
    if (this.provisioning) {
      return;
    }
    this.provisioning = true;
    try {
      await firstValueFrom(
        this.servicesService.create(
          {
            resource: [
              {
                name: 'sample_db',
                label: 'Sample Database',
                description:
                  'Bundled SQLite sample for exploring a generated API.',
                type: 'sqlite',
                is_active: true,
                config: { database: 'sample.sqlite' },
              },
            ],
          },
          { snackbarSuccess: 'homeCockpit.provisionSampleSuccess' }
        )
      );
      await this.load();
    } finally {
      this.provisioning = false;
    }
  }

  retry(): void {
    this.load();
  }

  // --- State B assembly ----------------------------------------------------

  private async loadCockpit(): Promise<void> {
    const metrics = await this.homeMetrics.getMetrics(this.range);
    this.tiles = this.buildTiles(metrics);
    this.firstCallMade = (metrics.requestsToday.value ?? 0) > 0;
    this.openServices = metrics.openServices;
    await this.loadArtifactCard();
  }

  /** Omit any tile whose metric has no real source (value === null). A real 0
   *  from an endpoint that answered still renders. */
  private buildTiles(metrics: HomeMetrics): KpiTile[] {
    const tiles: KpiTile[] = [];
    if (metrics.totalApis.value !== null) {
      tiles.push({
        key: 'totalApis',
        label: 'homeCockpit.tiles.totalApis',
        value: metrics.totalApis.value,
        route: [`/${ROUTES.API_CONNECTIONS}`],
      });
    }
    if (metrics.scopedAccess.value !== null) {
      tiles.push({
        key: 'scopedAccess',
        label: 'homeCockpit.tiles.scopedAccess',
        value: `${metrics.scopedAccess.value}%`,
        route: this.rolesRoute,
        tooltip: 'homeCockpit.tiles.scopedAccessTip',
      });
    }
    if (metrics.deprecatedCount.value !== null) {
      tiles.push({
        key: 'deprecatedCount',
        label: 'homeCockpit.tiles.deprecated',
        value: metrics.deprecatedCount.value,
        route: [`/${ROUTES.API_CONNECTIONS}`],
      });
    }
    if (metrics.requestsToday.value !== null) {
      tiles.push({
        key: 'requestsToday',
        label: 'homeCockpit.tiles.requestsToday',
        value: metrics.requestsToday.value.toLocaleString(),
        route: [`/${ROUTES.AI}`],
      });
    }
    if (metrics.spendToday.value !== null) {
      tiles.push({
        key: 'spendToday',
        label: 'homeCockpit.tiles.spendToday',
        value: this.formatSpend(metrics.spendToday.value),
        route: [`/${ROUTES.AI}`],
        invertDelta: true,
      });
    }
    return tiles;
  }

  private formatSpend(value: number): string {
    return `$${value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  // Resolve a working key + sample table for the first user service so the Live
  // API Card's curl returns 200 (shared probe, same as service Overview).
  private async loadArtifactCard(): Promise<void> {
    const first = this.userServices[0];
    if (!first) {
      return;
    }
    this.artifactServiceName = first.name;
    this.artifactBaseUrl = `${window.location.origin}${BASE_URL}/${first.name}`;
    const res = await this.artifactResolver.resolveWorkingKeyAndTable(
      first.id,
      first.name,
      this.artifactSampleTable
    );
    this.artifactSampleTable = res.sampleTable;
    this.artifactKeys = res.keys;
  }

  onCreateApiKey(): void {
    this.router.navigate([this.apiKeysRoute]);
  }

  // --- data fetch ----------------------------------------------------------

  // Throws on real failure so load() can render the error state. Filters system
  // services so State detection matches the user-facing API count.
  private async fetchUserServices(): Promise<ServiceRow[]> {
    const res = await firstValueFrom(
      this.http.get<{ resource: ServiceRow[] }>(`${BASE_URL}/system/service`, {
        context: silent(),
      })
    );
    return (res?.resource ?? []).filter(
      s => s?.name && !SYSTEM_SERVICE_NAMES.has(s.name.toLowerCase())
    );
  }

  // include_count total for a system collection. Silent; 0 on failure (a
  // key/role count is not load-critical the way the service list is).
  private async fetchCount(url: string): Promise<number> {
    try {
      const res = await firstValueFrom(
        this.http.get<{ meta?: { count?: number }; resource?: unknown[] }>(
          `${url}?fields=id&include_count=true&limit=1`,
          { context: silent() }
        )
      );
      return res?.meta?.count ?? res?.resource?.length ?? 0;
    } catch {
      return 0;
    }
  }
}
