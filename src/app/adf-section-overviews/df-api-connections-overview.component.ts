import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { catchError, map, of } from 'rxjs';
import {
  DfSectionLandingComponent,
  SectionLandingAction,
  SectionLandingGroup,
  SectionLandingNote,
} from '../shared/components/df-section-landing/df-section-landing.component';
import { SERVICE_TYPE_SERVICE_TOKEN } from '../shared/constants/tokens';
import { SERVICE_GROUPS } from '../shared/constants/serviceGroups';
import { GenericListResponse } from '../shared/types/generic-http';
import { ROUTES } from '../shared/types/routes';
import { ServiceType } from '../shared/types/service';

@Component({
  selector: 'df-api-connections-overview',
  standalone: true,
  imports: [CommonModule, DfSectionLandingComponent],
  template: `
    <df-section-landing
      eyebrow="API generation"
      title="Build and test governed APIs"
      description="Create service-backed APIs, lock them down with roles and API keys, then test the generated endpoints from API Docs or Data Explorer."
      [actions]="actions"
      [groups]="groups"
      [notes]="notes">
    </df-section-landing>
  `,
})
export class DfApiConnectionsOverviewComponent implements OnInit {
  private serviceTypeService = inject(SERVICE_TYPE_SERVICE_TOKEN);
  private serviceTypes: ServiceType[] | null = null;

  readonly routes = ROUTES;

  readonly actions: SectionLandingAction[] = [
    {
      label: 'Create Custom API',
      route: `/${ROUTES.API_CONNECTIONS}/${ROUTES.API_TYPES}/${ROUTES.API_BUILDER}`,
      icon: 'api',
      primary: true,
    },
    {
      label: 'API Docs',
      route: `/${ROUTES.API_CONNECTIONS}/${ROUTES.API_DOCS}`,
      icon: 'description',
    },
  ];

  readonly notes: SectionLandingNote[] = [
    {
      icon: 'rule',
      title: 'Access follows roles',
      text: 'Generated APIs are useful only after a role and API key define who can call them.',
    },
    {
      icon: 'extension',
      title: 'Connectors vary by build',
      text: 'Cards reflect connector categories available in this DreamFactory instance.',
    },
    {
      icon: 'science',
      title: 'Test before handing off',
      text: 'Use API Docs and Data Explorer to confirm the new API shape before sharing credentials.',
    },
  ];

  ngOnInit(): void {
    this.serviceTypeService
      .getAll<GenericListResponse<ServiceType>>({ limit: 500 })
      .pipe(
        map(response => response.resource ?? []),
        catchError(() => of([]))
      )
      .subscribe(serviceTypes => (this.serviceTypes = serviceTypes));
  }

  get groups(): SectionLandingGroup[] {
    return [
      {
        title: 'Create APIs',
        cards: [
          this.serviceCard(
            'api',
            'API Builder',
            'Compose existing services into custom business APIs with multiple endpoints.',
            ROUTES.API_BUILDER,
            SERVICE_GROUPS[ROUTES.API_BUILDER]
          ),
          this.serviceCard(
            'storage',
            'Database',
            'Expose SQL and big data sources through REST APIs.',
            ROUTES.DATABASE,
            SERVICE_GROUPS[ROUTES.DATABASE]
          ),
          this.serviceCard(
            'code',
            'Scripting',
            'Create scripted service endpoints for custom server-side logic.',
            ROUTES.SCRIPTING,
            SERVICE_GROUPS[ROUTES.SCRIPTING]
          ),
          this.serviceCard(
            'language',
            'Network',
            'Proxy remote HTTP, SOAP, and network-accessible APIs.',
            ROUTES.NETWORK,
            SERVICE_GROUPS[ROUTES.NETWORK]
          ),
          this.serviceCard(
            'folder',
            'File',
            'Expose file storage services through governed endpoints.',
            ROUTES.FILE,
            SERVICE_GROUPS[ROUTES.FILE]
          ),
          this.serviceCard(
            'build',
            'Utility',
            'Add utility services for email, cache, notification, and similar platform work.',
            ROUTES.UTILITY,
            SERVICE_GROUPS[ROUTES.UTILITY]
          ),
        ],
      },
      {
        title: 'Secure and validate',
        cards: [
          {
            icon: 'admin_panel_settings',
            title: 'Role Based Access',
            text: 'Define service, table, verb, and record-level access.',
            route: `/${ROUTES.API_CONNECTIONS}/${ROUTES.ROLE_BASED_ACCESS}`,
            action: 'Manage roles',
          },
          {
            icon: 'vpn_key',
            title: 'API Keys',
            text: 'Create application keys and bind them to the correct role.',
            route: `/${ROUTES.API_CONNECTIONS}/${ROUTES.API_KEYS}`,
            action: 'Manage keys',
          },
          {
            icon: 'terminal',
            title: 'Event Scripts',
            text: 'Attach request and response logic around generated APIs.',
            route: `/${ROUTES.API_CONNECTIONS}/${ROUTES.EVENT_SCRIPTS}`,
            action: 'Manage scripts',
          },
          {
            icon: 'description',
            title: 'API Docs',
            text: 'Inspect generated OpenAPI docs and try calls in-browser.',
            route: `/${ROUTES.API_CONNECTIONS}/${ROUTES.API_DOCS}`,
            action: 'Open docs',
          },
          {
            icon: 'travel_explore',
            title: 'Data Explorer',
            text: 'Browse records and confirm filters, fields, and relations.',
            route: `/${ROUTES.API_CONNECTIONS}/${ROUTES.DATA_EXPLORER}`,
            action: 'Explore data',
          },
        ],
      },
    ];
  }

  private serviceCard(
    icon: string,
    title: string,
    text: string,
    route: ROUTES,
    groups: string[]
  ) {
    const count = this.countServiceTypes(groups);
    return {
      icon,
      title,
      text,
      route: `/${ROUTES.API_CONNECTIONS}/${ROUTES.API_TYPES}/${route}`,
      action: 'View service types',
      meta: this.connectorMeta(count),
      disabled: count === 0,
    };
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
}
