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
  selector: 'df-security-overview',
  standalone: true,
  imports: [CommonModule, DfSectionLandingComponent],
  template: `
    <df-section-landing
      eyebrow="Security"
      title="Control who can call what"
      description="Review the access surfaces that protect generated APIs: authentication providers, rate limits, roles, and application keys."
      [actions]="actions"
      [groups]="groups"
      [notes]="notes">
    </df-section-landing>
  `,
})
export class DfSecurityOverviewComponent implements OnInit {
  private serviceTypeService = inject(SERVICE_TYPE_SERVICE_TOKEN);
  private serviceTypes: ServiceType[] | null = null;

  readonly actions: SectionLandingAction[] = [
    {
      label: 'Create role',
      route: `/${ROUTES.API_CONNECTIONS}/${ROUTES.ROLE_BASED_ACCESS}/${ROUTES.CREATE}`,
      icon: 'admin_panel_settings',
      primary: true,
    },
    {
      label: 'Create API key',
      route: `/${ROUTES.API_CONNECTIONS}/${ROUTES.API_KEYS}/${ROUTES.CREATE}`,
      icon: 'vpn_key',
    },
  ];

  readonly notes: SectionLandingNote[] = [
    {
      icon: 'verified_user',
      title: 'Least privilege',
      text: 'Start with narrow roles, then expand only when an app or user needs more access.',
    },
    {
      icon: 'speed',
      title: 'Rate limits protect services',
      text: 'Limits help prevent runaway clients from overwhelming expensive or sensitive APIs.',
    },
    {
      icon: 'login',
      title: 'Auth depends on installed providers',
      text: 'Authentication options reflect the provider connectors installed in this instance.',
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
    const authCount = this.countServiceTypes(
      SERVICE_GROUPS[ROUTES.AUTHENTICATION]
    );
    return [
      {
        title: 'Security controls',
        cards: [
          {
            icon: 'login',
            title: 'Authentication',
            text: 'Configure LDAP, SSO, OAuth, and other installed authentication service types.',
            route: `/${ROUTES.API_SECURITY}/${ROUTES.AUTHENTICATION}`,
            action: 'Manage authentication',
            meta: this.connectorMeta(authCount),
            disabled: authCount === 0,
          },
          {
            icon: 'speed',
            title: 'Rate Limiting',
            text: 'Throttle calls by user, role, service, IP, or application key.',
            route: `/${ROUTES.API_SECURITY}/${ROUTES.RATE_LIMITING}`,
            action: 'Manage limits',
          },
          {
            icon: 'admin_panel_settings',
            title: 'Role-Based Access',
            text: 'Audit what users, apps, and AI services are allowed to reach.',
            route: `/${ROUTES.API_CONNECTIONS}/${ROUTES.ROLE_BASED_ACCESS}`,
            action: 'Manage roles',
          },
          {
            icon: 'vpn_key',
            title: 'API Keys',
            text: 'Review application keys and the roles they grant to callers.',
            route: `/${ROUTES.API_CONNECTIONS}/${ROUTES.API_KEYS}`,
            action: 'Manage keys',
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
      return 'Checking available providers';
    }
    return count === 1
      ? '1 provider type available'
      : `${count} provider types available`;
  }
}
