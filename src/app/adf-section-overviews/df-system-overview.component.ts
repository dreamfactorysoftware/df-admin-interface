import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { catchError, map, of } from 'rxjs';
import {
  DfSectionLandingComponent,
  SectionLandingAction,
  SectionLandingGroup,
  SectionLandingNote,
  SectionLandingStat,
} from '../shared/components/df-section-landing/df-section-landing.component';
import { SERVICE_GROUPS } from '../shared/constants/serviceGroups';
import { SERVICE_TYPE_SERVICE_TOKEN } from '../shared/constants/tokens';
import { GenericListResponse } from '../shared/types/generic-http';
import { ROUTES } from '../shared/types/routes';
import { ServiceType } from '../shared/types/service';
import { DfSystemConfigDataService } from '../shared/services/df-system-config-data.service';
import { Environment } from '../shared/types/system';

@Component({
  selector: 'df-system-overview',
  standalone: true,
  imports: [CommonModule, DfSectionLandingComponent],
  template: `
    <df-section-landing
      eyebrow="System"
      title="Operate this DreamFactory instance"
      description="Find runtime health, cache, scheduler, logs, reporting, and platform configuration from one operational starting point."
      [actions]="actions"
      [stats]="stats"
      [groups]="groups"
      [notes]="notes">
    </df-section-landing>
  `,
})
export class DfSystemOverviewComponent implements OnInit {
  private serviceTypeService = inject(SERVICE_TYPE_SERVICE_TOKEN);
  private systemConfigDataService = inject(DfSystemConfigDataService);
  private serviceTypes: ServiceType[] | null = null;
  environment = this.systemConfigDataService.environment;

  readonly actions: SectionLandingAction[] = [
    {
      label: 'System Info',
      route: `/${ROUTES.SYSTEM_SETTINGS}/${ROUTES.CONFIG}/${ROUTES.SYSTEM_INFO}`,
      icon: 'info',
      primary: true,
    },
    {
      label: 'Cache',
      route: `/${ROUTES.SYSTEM_SETTINGS}/${ROUTES.CONFIG}/${ROUTES.CACHE}`,
      icon: 'cached',
    },
  ];

  readonly notes: SectionLandingNote[] = [
    {
      icon: 'health_and_safety',
      title: 'Start with health',
      text: 'System Info and logs are the fastest path when an environment feels off.',
    },
    {
      icon: 'cached',
      title: 'Cache affects behavior',
      text: 'Config and schema cache state can change what admins see while testing builds.',
    },
    {
      icon: 'schedule',
      title: 'Background work matters',
      text: 'Scheduler and reporting settings help confirm operational jobs are actually running.',
    },
  ];

  ngOnInit(): void {
    this.systemConfigDataService.environment$.subscribe(
      environment => (this.environment = environment)
    );
    this.serviceTypeService
      .getAll<GenericListResponse<ServiceType>>({ limit: 500 })
      .pipe(
        map(response => response.resource ?? []),
        catchError(() => of([]))
      )
      .subscribe(serviceTypes => (this.serviceTypes = serviceTypes));
  }

  // stats/groups feed child [inputs]; returning a fresh array per
  // change-detection pass forces the landing component to re-diff its cards
  // every cycle. Memoize on the async-loaded sources (environment ref /
  // serviceTypes ref) so the refs stay stable between data loads.
  private memoStatsEnv: Environment | null = null;
  private memoStats: SectionLandingStat[] = [];

  get stats(): SectionLandingStat[] {
    if (this.memoStatsEnv !== this.environment) {
      this.memoStatsEnv = this.environment;
      this.memoStats = this.buildStats();
    }
    return this.memoStats;
  }

  private buildStats(): SectionLandingStat[] {
    const environment = this.environment;
    return [
      {
        icon: 'api',
        label: 'DreamFactory',
        value: environment.platform?.version || 'Unknown',
        category: 'system',
      },
      {
        icon: 'database',
        label: 'System DB',
        value: environment.platform?.dbDriver || 'Unknown',
        category: 'data',
      },
      {
        icon: 'article',
        label: 'Log Level',
        value: environment.platform?.logLevel || 'Unknown',
        category: 'docs',
      },
      {
        icon: 'dns',
        label: 'Operating System',
        value: this.osLabel(environment),
        category: 'system',
      },
      {
        icon: 'memory',
        label: 'PHP / Laravel',
        value: `${environment.php?.core?.phpVersion || 'Unknown'} / ${this.laravelVersion(environment)}`,
        category: 'build',
      },
    ];
  }

  private memoGroupsTypes: ServiceType[] | null | undefined = undefined;
  private memoGroups: SectionLandingGroup[] = [];

  get groups(): SectionLandingGroup[] {
    if (this.memoGroupsTypes !== this.serviceTypes) {
      this.memoGroupsTypes = this.serviceTypes;
      this.memoGroups = this.buildGroups();
    }
    return this.memoGroups;
  }

  private buildGroups(): SectionLandingGroup[] {
    const logstashCount = this.countServiceTypes(SERVICE_GROUPS[ROUTES.LOGS]);
    return [
      {
        title: 'Runtime operations',
        cards: [
          {
            icon: 'info',
            title: 'System Info',
            text: 'Review installed version, environment paths, cache state, and runtime status.',
            route: `/${ROUTES.SYSTEM_SETTINGS}/${ROUTES.CONFIG}/${ROUTES.SYSTEM_INFO}`,
            action: 'View system info',
            category: 'system',
          },
          {
            icon: 'cached',
            title: 'Cache',
            text: 'Inspect and clear DreamFactory cache entries when configuration changes need to settle.',
            route: `/${ROUTES.SYSTEM_SETTINGS}/${ROUTES.CONFIG}/${ROUTES.CACHE}`,
            action: 'Manage cache',
            category: 'system',
          },
          {
            icon: 'import_export',
            title: 'Config Import / Export',
            text: 'Move services, roles, role access, and app bindings between DreamFactory instances with portable manifests.',
            route: `/${ROUTES.SYSTEM_SETTINGS}/${ROUTES.CONFIG}/${ROUTES.CONFIG_PACKAGE}`,
            action: 'Open config package',
            category: 'build',
          },
          {
            icon: 'schedule',
            title: 'Scheduler',
            text: 'Create and manage scheduled jobs that call services or platform endpoints.',
            route: `/${ROUTES.SYSTEM_SETTINGS}/${ROUTES.SCHEDULER}`,
            action: 'Manage scheduler',
            category: 'system',
          },
          {
            icon: 'article',
            title: 'Logs',
            text: 'Browse DreamFactory log files from the existing admin log viewer.',
            route: `/${ROUTES.ADMIN_SETTINGS}/${ROUTES.LOGS}`,
            action: 'View logs',
            category: 'docs',
          },
          {
            icon: 'outbox',
            title: 'Logstash',
            text: 'Configure installed log service connectors for forwarding runtime events.',
            route: `/${ROUTES.SYSTEM_SETTINGS}/${ROUTES.LOGS}`,
            action: 'Manage Logstash',
            category: 'docs',
            meta: this.connectorMeta(logstashCount),
            disabled: logstashCount === 0,
          },
          {
            icon: 'analytics',
            title: 'Reporting',
            text: 'Review service reports and operational usage summaries.',
            route: `/${ROUTES.SYSTEM_SETTINGS}/${ROUTES.REPORTING}`,
            action: 'View reporting',
            category: 'docs',
          },
        ],
      },
      {
        title: 'Platform configuration',
        cards: [
          {
            icon: 'public',
            title: 'CORS',
            text: 'Manage browser access rules for applications calling DreamFactory APIs.',
            route: `/${ROUTES.SYSTEM_SETTINGS}/${ROUTES.CONFIG}/${ROUTES.CORS}`,
            action: 'Manage CORS',
            category: 'security',
          },
          {
            icon: 'mail',
            title: 'Email Templates',
            text: 'Edit system email templates used for account and notification workflows.',
            route: `/${ROUTES.SYSTEM_SETTINGS}/${ROUTES.CONFIG}/${ROUTES.EMAIL_TEMPLATES}`,
            action: 'Manage templates',
            category: 'system',
          },
          {
            icon: 'key',
            title: 'Global Lookup Keys',
            text: 'Manage reusable key-value settings shared across services and scripts.',
            route: `/${ROUTES.SYSTEM_SETTINGS}/${ROUTES.CONFIG}/${ROUTES.GLOBAL_LOOKUP_KEYS}`,
            action: 'Manage keys',
            category: 'build',
          },
          {
            icon: 'forum',
            title: 'Intercom',
            text: 'Configure support messaging integration for this admin interface.',
            route: `/${ROUTES.SYSTEM_SETTINGS}/${ROUTES.CONFIG}/${ROUTES.INTERCOM}`,
            action: 'Configure Intercom',
            category: 'system',
          },
          {
            icon: 'api',
            title: 'DreamFactory Platform APIs',
            text: 'Review built-in platform services exposed by DreamFactory itself.',
            route: `/${ROUTES.SYSTEM_SETTINGS}/${ROUTES.DF_PLATFORM_APIS}`,
            action: 'Open platform APIs',
            category: 'data',
          },
        ],
      },
    ];
  }

  private countServiceTypes(groups: string[]): number | null {
    if (!this.serviceTypes) {
      return null;
    }
    return this.serviceTypes.filter(serviceType =>
      groups.includes(serviceType.group)
    ).length;
  }

  private connectorMeta(count: number | null): string {
    if (count === null) {
      return 'Checking available connectors';
    }
    return count === 1
      ? '1 connector type available'
      : `${count} connector types available`;
  }

  private osLabel(environment: Environment): string {
    return [environment.server?.serverOs, environment.server?.release]
      .filter(Boolean)
      .join(' ');
  }

  private laravelVersion(environment: Environment): string {
    const laravel = environment.platform?.packages?.find(
      pkg => pkg.name === 'laravel/framework'
    );
    return laravel?.version || 'Unknown';
  }
}
