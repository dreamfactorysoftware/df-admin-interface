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
  selector: 'df-ai-setup',
  standalone: true,
  imports: [CommonModule, DfSectionLandingComponent],
  templateUrl: './df-ai-setup.component.html',
  styleUrls: ['./df-ai-setup.component.scss'],
})
export class DfAiSetupComponent {
  readonly routes = ROUTES;

  readonly actions: SectionLandingAction[] = [
    {
      label: 'Create connection',
      route: `/${ROUTES.AI}/${ROUTES.AI_CONNECTIONS}/${ROUTES.CREATE}`,
      icon: 'add_link',
      primary: true,
    },
    {
      label: 'Usage',
      route: `/${ROUTES.AI}/${ROUTES.AI_USAGE}`,
      icon: 'monitoring',
    },
  ];

  readonly groups: SectionLandingGroup[] = [
    {
      title: 'AI gateway setup',
      cards: [
        {
          icon: 'hub',
          title: 'Connections',
          text: 'Connect model providers or OpenAI-compatible gateways, configure credentials, choose defaults, and test before wiring AI into apps.',
          route: `/${ROUTES.AI}/${ROUTES.AI_CONNECTIONS}`,
          action: 'Manage connections',
        },
        {
          icon: 'admin_panel_settings',
          title: 'Role Based Access',
          text: 'Create least-privilege DreamFactory roles so AI tool calls can reach only the data and services they should.',
          route: `/${ROUTES.API_CONNECTIONS}/${ROUTES.ROLE_BASED_ACCESS}`,
          action: 'Manage roles',
        },
        {
          icon: 'chat',
          title: 'Chat Configuration',
          text: 'Bind model connections to AI roles, default services, tool limits, and system prompts for governed in-DF chat.',
          route: `/${ROUTES.AI}/${ROUTES.AI_CHAT_SERVICES}`,
          action: 'Configure chat',
        },
        {
          icon: 'forum',
          title: 'Conversations',
          text: 'Test chat workflows, verify the service reaches the right data, and confirm permissions block anything outside scope.',
          route: `/${ROUTES.AI}/${ROUTES.AI_CHAT_UI}`,
          action: 'Open conversations',
        },
        {
          icon: 'account_tree',
          title: 'MCP',
          text: 'Expose governed DreamFactory tools to external AI clients when agent workflows need controlled data access.',
          route: `/${ROUTES.AI}/${ROUTES.AI_MCP}`,
          action: 'Manage MCP',
        },
        {
          icon: 'monitoring',
          title: 'Usage',
          text: 'Track requests, token burn, provider mix, MCP activity, expensive calls, and budget pressure before it surprises anyone.',
          route: `/${ROUTES.AI}/${ROUTES.AI_USAGE}`,
          action: 'View usage',
        },
      ],
    },
  ];

  readonly notes: SectionLandingNote[] = [
    {
      icon: 'verified_user',
      title: 'Permission model',
      text: 'The AI sees only what the selected role can see. Use dedicated roles instead of administrator roles.',
    },
    {
      icon: 'price_check',
      title: 'Cost control',
      text: 'Set provider rates and budgets on AI Connections, then track spend from the Usage page.',
    },
    {
      icon: 'manage_search',
      title: 'Audit trail',
      text: 'Prompt logs, request logs, and MCP usage views help review who asked for what and which tools ran.',
    },
  ];
}
