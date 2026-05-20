import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { catchError, map, of } from 'rxjs';
import {
  DfSectionLandingComponent,
  SectionLandingAction,
  SectionLandingGroup,
  SectionLandingNote,
} from '../shared/components/df-section-landing/df-section-landing.component';
import { SERVICE_GROUPS } from '../shared/constants/serviceGroups';
import { SERVICE_TYPE_SERVICE_TOKEN } from '../shared/constants/tokens';
import { GenericListResponse } from '../shared/types/generic-http';
import { ROUTES } from '../shared/types/routes';
import { ServiceType } from '../shared/types/service';

@Component({
  selector: 'df-api-types-overview',
  standalone: true,
  imports: [CommonModule, DfSectionLandingComponent],
  template: `
    <df-section-landing
      eyebrow="API types"
      title="Choose the right API source"
      description="DreamFactory turns databases, files, remote services, scripts, and platform utilities into governed REST APIs. Pick the API type that matches the system you need to expose."
      [actions]="actions"
      [groups]="groups"
      [notes]="notes">
    </df-section-landing>
  `,
})
export class DfApiTypesOverviewComponent implements OnInit {
  private serviceTypeService = inject(SERVICE_TYPE_SERVICE_TOKEN);
  private serviceTypes: ServiceType[] | null = null;

  readonly actions: SectionLandingAction[] = [
    {
      label: 'Create Custom API',
      route: `/${ROUTES.API_CONNECTIONS}/${ROUTES.API_TYPES}/${ROUTES.API_BUILDER}`,
      icon: 'api',
      primary: true,
    },
    {
      label: 'Data Explorer',
      route: `/${ROUTES.API_CONNECTIONS}/${ROUTES.DATA_EXPLORER}`,
      icon: 'travel_explore',
    },
  ];

  readonly notes: SectionLandingNote[] = [
    {
      icon: 'hub',
      title: 'Data gateway pattern',
      text: 'Each API type connects DreamFactory to a different class of enterprise system.',
    },
    {
      icon: 'lock',
      title: 'Governance is shared',
      text: 'Roles, API keys, scripting, and docs apply after the source API is created.',
    },
    {
      icon: 'extension',
      title: 'Installed connectors only',
      text: 'Unavailable API categories are marked by the connector types installed in this instance.',
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
        title: 'Available API source categories',
        cards: [
          this.serviceCard(
            'api',
            'API Builder',
            'Create custom business APIs that compose database, RWS, script, and relationship-backed calls.',
            ROUTES.API_BUILDER,
            SERVICE_GROUPS[ROUTES.API_BUILDER]
          ),
          this.serviceCard(
            'storage',
            'Database APIs',
            'Generate REST APIs for relational and big data sources, including tables, stored procedures, views, filters, and relationships.',
            ROUTES.DATABASE,
            SERVICE_GROUPS[ROUTES.DATABASE]
          ),
          this.serviceCard(
            'code',
            'Scripting APIs',
            'Expose custom server-side logic as API endpoints when the workflow needs more than a direct connector.',
            ROUTES.SCRIPTING,
            SERVICE_GROUPS[ROUTES.SCRIPTING]
          ),
          this.serviceCard(
            'language',
            'Network APIs',
            'Proxy and govern remote HTTP, SOAP, and network-accessible services through DreamFactory.',
            ROUTES.NETWORK,
            SERVICE_GROUPS[ROUTES.NETWORK]
          ),
          this.serviceCard(
            'folder',
            'File APIs',
            'Expose object storage and file systems with consistent REST access and DreamFactory permissions.',
            ROUTES.FILE,
            SERVICE_GROUPS[ROUTES.FILE]
          ),
          this.serviceCard(
            'build',
            'Utility APIs',
            'Add platform services such as email, cache, notification, logging, and supporting infrastructure APIs.',
            ROUTES.UTILITY,
            SERVICE_GROUPS[ROUTES.UTILITY]
          ),
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
      action: 'Open category',
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
      return 'Checking connector types';
    }
    return count === 1
      ? '1 connector type available'
      : `${count} connector types available`;
  }
}
