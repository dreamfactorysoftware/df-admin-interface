import { ROUTES } from '../types/routes';

export const SERVICE_GROUPS = {
  [ROUTES.API_BUILDER]: ['API Builder'],
  [ROUTES.DATABASE]: ['Database', 'Big Data'],
  [ROUTES.SCRIPTING]: ['Script'],
  [ROUTES.NETWORK]: ['Remote Service'],
  [ROUTES.FILE]: ['File', 'Excel'],
  [ROUTES.UTILITY]: [
    'Cache',
    'Email',
    'Notification',
    'Log',
    'Source Control',
    'IoT',
  ],
  [ROUTES.AUTHENTICATION]: ['LDAP', 'SSO', 'OAuth'],
  [ROUTES.LOGS]: ['Log'],
  [ROUTES.AI]: ['MCP', 'AI', 'AI Chat'],
  [ROUTES.AI_CONNECTIONS]: ['AI'],
  [ROUTES.AI_CHAT_SERVICES]: ['AI Chat'],
  [ROUTES.AI_MCP]: ['MCP'],
};
