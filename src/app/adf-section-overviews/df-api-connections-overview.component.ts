import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';
import {
  DfSectionLandingComponent,
  SectionLandingAction,
  SectionLandingGroup,
  SectionLandingNote,
} from '../shared/components/df-section-landing/df-section-landing.component';
import { ROUTES } from '../shared/types/routes';

// Build pillar home (/api-connections). Tiles mirror this section's nav
// children: API Types + API Builder (generate), API Docs + Data Explorer +
// Event Scripts (test/extend), Role-Based Access + API Keys (secure). The
// six connector categories are not exploded here; that is the job of the
// API Types overview one level down. Copy is user-goal, keyed through the
// root transloco scope, tinted by category (item 11 + 15 + 21).
@Component({
  selector: 'df-api-connections-overview',
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
export class DfApiConnectionsOverviewComponent {
  private transloco = inject(TranslocoService);

  t(key: string): string {
    return this.transloco.translate(`sectionOverviews.apiConnections.${key}`);
  }

  readonly actions: SectionLandingAction[] = [
    {
      label: this.t('actionGenerate'),
      route: `/${ROUTES.API_CONNECTIONS}/${ROUTES.API_TYPES}`,
      icon: 'api',
      primary: true,
    },
    {
      label: this.t('actionDocs'),
      route: `/${ROUTES.API_CONNECTIONS}/${ROUTES.API_DOCS}`,
      icon: 'description',
    },
  ];

  readonly groups: SectionLandingGroup[] = [
    {
      title: this.t('groupBuild'),
      cards: [
        {
          icon: 'account_tree',
          title: this.t('apiTypesTitle'),
          text: this.t('apiTypesText'),
          route: `/${ROUTES.API_CONNECTIONS}/${ROUTES.API_TYPES}`,
          action: this.t('apiTypesAction'),
          tint: 'build',
        },
        {
          icon: 'api',
          title: this.t('apiBuilderTitle'),
          text: this.t('apiBuilderText'),
          route: `/${ROUTES.API_CONNECTIONS}/${ROUTES.API_TYPES}/${ROUTES.API_BUILDER}`,
          action: this.t('apiBuilderAction'),
          tint: 'build',
        },
      ],
    },
    {
      title: this.t('groupTest'),
      cards: [
        {
          icon: 'description',
          title: this.t('apiDocsTitle'),
          text: this.t('apiDocsText'),
          route: `/${ROUTES.API_CONNECTIONS}/${ROUTES.API_DOCS}`,
          action: this.t('apiDocsAction'),
          tint: 'docs',
        },
        {
          icon: 'travel_explore',
          title: this.t('dataExplorerTitle'),
          text: this.t('dataExplorerText'),
          route: `/${ROUTES.API_CONNECTIONS}/${ROUTES.DATA_EXPLORER}`,
          action: this.t('dataExplorerAction'),
          tint: 'data',
        },
        {
          icon: 'terminal',
          title: this.t('eventScriptsTitle'),
          text: this.t('eventScriptsText'),
          route: `/${ROUTES.API_CONNECTIONS}/${ROUTES.EVENT_SCRIPTS}`,
          action: this.t('eventScriptsAction'),
          tint: 'build',
        },
      ],
    },
    {
      title: this.t('groupSecure'),
      cards: [
        {
          icon: 'admin_panel_settings',
          title: this.t('rolesTitle'),
          text: this.t('rolesText'),
          route: `/${ROUTES.API_CONNECTIONS}/${ROUTES.ROLE_BASED_ACCESS}`,
          action: this.t('rolesAction'),
          tint: 'security',
        },
        {
          icon: 'vpn_key',
          title: this.t('keysTitle'),
          text: this.t('keysText'),
          route: `/${ROUTES.API_CONNECTIONS}/${ROUTES.API_KEYS}`,
          action: this.t('keysAction'),
          tint: 'security',
        },
      ],
    },
  ];

  readonly notes: SectionLandingNote[] = [
    {
      icon: 'lock',
      title: this.t('noteSecureTitle'),
      text: this.t('noteSecureText'),
    },
    {
      icon: 'science',
      title: this.t('noteTestTitle'),
      text: this.t('noteTestText'),
    },
    {
      icon: 'extension',
      title: this.t('noteConnectorsTitle'),
      text: this.t('noteConnectorsText'),
    },
  ];
}
