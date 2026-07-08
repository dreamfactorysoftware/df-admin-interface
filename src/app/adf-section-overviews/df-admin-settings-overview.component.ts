import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  DfSectionLandingComponent,
  SectionLandingAction,
  SectionLandingGroup,
  SectionLandingNote,
} from '../shared/components/df-section-landing/df-section-landing.component';
import { ROUTES } from '../shared/types/routes';

@Component({
  selector: 'df-admin-settings-overview',
  standalone: true,
  imports: [CommonModule, DfSectionLandingComponent],
  template: `
    <df-section-landing
      eyebrow="Admin settings"
      title="Manage people, data, and diagnostics"
      description="Use this area for administrator accounts, users, schema work, files, and the existing diagnostic log viewer."
      [actions]="actions"
      [groups]="groups"
      [notes]="notes">
    </df-section-landing>
  `,
})
export class DfAdminSettingsOverviewComponent {
  readonly actions: SectionLandingAction[] = [
    {
      label: 'Create admin',
      route: `/${ROUTES.ADMIN_SETTINGS}/${ROUTES.ADMINS}/${ROUTES.CREATE}`,
      icon: 'person_add',
      primary: true,
    },
    {
      label: 'Create user',
      route: `/${ROUTES.ADMIN_SETTINGS}/${ROUTES.USERS}/${ROUTES.CREATE}`,
      icon: 'group_add',
    },
  ];

  readonly groups: SectionLandingGroup[] = [
    {
      title: 'People',
      cards: [
        {
          icon: 'supervisor_account',
          title: 'Admins',
          text: 'Manage administrator accounts for this DreamFactory instance.',
          route: `/${ROUTES.ADMIN_SETTINGS}/${ROUTES.ADMINS}`,
          action: 'Manage admins',
          category: 'admin',
        },
        {
          icon: 'groups',
          title: 'Users',
          text: 'Create, edit, and review users that authenticate into DreamFactory.',
          route: `/${ROUTES.ADMIN_SETTINGS}/${ROUTES.USERS}`,
          action: 'Manage users',
          category: 'admin',
        },
      ],
    },
    {
      title: 'Data management',
      cards: [
        {
          icon: 'schema',
          title: 'Schema',
          text: 'Review database services, tables, fields, and relationships.',
          route: `/${ROUTES.ADMIN_SETTINGS}/${ROUTES.SCHEMA}`,
          action: 'Manage schema',
          category: 'data',
        },
        {
          icon: 'folder',
          title: 'Files',
          text: 'Browse configured file service containers and stored objects.',
          route: `/${ROUTES.ADMIN_SETTINGS}/${ROUTES.FILES}`,
          action: 'Browse files',
          category: 'data',
        },
      ],
    },
    {
      title: 'Diagnostics',
      cards: [
        {
          icon: 'article',
          title: 'Logs',
          text: 'Open the existing log file browser for troubleshooting.',
          route: `/${ROUTES.ADMIN_SETTINGS}/${ROUTES.LOGS}`,
          action: 'View logs',
          category: 'docs',
        },
      ],
    },
  ];

  readonly notes: SectionLandingNote[] = [
    {
      icon: 'admin_panel_settings',
      title: 'Admins are separate',
      text: 'Administrator accounts are managed separately from ordinary users and app roles.',
    },
    {
      icon: 'table_chart',
      title: 'Schema follows services',
      text: 'Schema tools are available for database services configured in this instance.',
    },
    {
      icon: 'bug_report',
      title: 'Logs stay here too',
      text: 'Logs also appear under System so operators can find them without retraining current users.',
    },
  ];
}
