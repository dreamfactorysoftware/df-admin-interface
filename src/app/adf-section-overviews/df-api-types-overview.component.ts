import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';
import { catchError, map, of } from 'rxjs';
import {
  DfSectionLandingComponent,
  SectionLandingAction,
  SectionLandingGroup,
  SectionLandingNote,
  SectionLandingTint,
} from '../shared/components/df-section-landing/df-section-landing.component';
import { SERVICE_GROUPS } from '../shared/constants/serviceGroups';
import { SERVICE_TYPE_SERVICE_TOKEN } from '../shared/constants/tokens';
import { GenericListResponse } from '../shared/types/generic-http';
import { ROUTES } from '../shared/types/routes';
import { ServiceType } from '../shared/types/service';

// API Types overview (/api-connections/api-types). One card per source
// category; each generates a governed REST API from a different class of
// system. Category tints (item 21): database=data, scripting=build,
// network=docs, file=admin, utility=system, api-builder=build. Copy is
// user-goal and keyed through the root transloco scope.
@Component({
  selector: 'df-api-types-overview',
  standalone: true,
  imports: [CommonModule, DfSectionLandingComponent],
  template: `
    <df-section-landing
      [eyebrow]="t('eyebrow')"
      [title]="t('title')"
      [description]="t('description')"
      [actions]="actions"
      [groups]="groups"
      [notes]="notes">
    </df-section-landing>
  `,
})
export class DfApiTypesOverviewComponent implements OnInit {
  private serviceTypeService = inject(SERVICE_TYPE_SERVICE_TOKEN);
  private transloco = inject(TranslocoService);
  private serviceTypes: ServiceType[] | null = null;

  t(key: string): string {
    return this.transloco.translate(`sectionOverviews.apiTypes.${key}`);
  }

  readonly actions: SectionLandingAction[] = [
    {
      label: this.t('actionCreate'),
      route: `/${ROUTES.API_CONNECTIONS}/${ROUTES.API_TYPES}/${ROUTES.API_BUILDER}`,
      icon: 'api',
      primary: true,
    },
    {
      label: this.t('actionExplore'),
      route: `/${ROUTES.API_CONNECTIONS}/${ROUTES.DATA_EXPLORER}`,
      icon: 'travel_explore',
    },
  ];

  readonly notes: SectionLandingNote[] = [
    {
      icon: 'hub',
      title: this.t('noteGatewayTitle'),
      text: this.t('noteGatewayText'),
    },
    {
      icon: 'lock',
      title: this.t('noteGovernanceTitle'),
      text: this.t('noteGovernanceText'),
    },
    {
      icon: 'extension',
      title: this.t('noteInstalledTitle'),
      text: this.t('noteInstalledText'),
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

  // groups feeds a child [input]; a fresh array per change-detection pass
  // forces the landing component to re-diff its cards every cycle. Rebuild
  // only when the async-loaded serviceTypes ref changes.
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
    return [
      {
        title: this.t('group'),
        cards: [
          this.serviceCard(
            'api',
            'apiBuilder',
            'build',
            ROUTES.API_BUILDER,
            SERVICE_GROUPS[ROUTES.API_BUILDER]
          ),
          this.serviceCard(
            'storage',
            'database',
            'data',
            ROUTES.DATABASE,
            SERVICE_GROUPS[ROUTES.DATABASE]
          ),
          this.serviceCard(
            'code',
            'scripting',
            'build',
            ROUTES.SCRIPTING,
            SERVICE_GROUPS[ROUTES.SCRIPTING]
          ),
          this.serviceCard(
            'language',
            'network',
            'docs',
            ROUTES.NETWORK,
            SERVICE_GROUPS[ROUTES.NETWORK]
          ),
          this.serviceCard(
            'folder',
            'file',
            'admin',
            ROUTES.FILE,
            SERVICE_GROUPS[ROUTES.FILE]
          ),
          this.serviceCard(
            'build',
            'utility',
            'system',
            ROUTES.UTILITY,
            SERVICE_GROUPS[ROUTES.UTILITY]
          ),
        ],
      },
    ];
  }

  private serviceCard(
    icon: string,
    key: string,
    tint: SectionLandingTint,
    route: ROUTES,
    groups: string[]
  ) {
    const count = this.countServiceTypes(groups);
    return {
      icon,
      title: this.t(`${key}Title`),
      text: this.t(`${key}Text`),
      route: `/${ROUTES.API_CONNECTIONS}/${ROUTES.API_TYPES}/${route}`,
      action: this.t(`${key}Action`),
      meta: this.connectorMeta(count),
      disabled: count === 0,
      tint,
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
      return this.transloco.translate(
        'sectionOverviews.shared.connectorsChecking'
      );
    }
    return count === 1
      ? this.transloco.translate('sectionOverviews.shared.connectorsOne')
      : this.transloco.translate('sectionOverviews.shared.connectorsOther', {
          count,
        });
  }
}
