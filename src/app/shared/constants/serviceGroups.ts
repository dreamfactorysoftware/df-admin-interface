import { ROUTES } from '../types/routes';

export const SERVICE_GROUPS = {
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
  [ROUTES.AI_MCP]: ['MCP'],
  [ROUTES.AI_PROVIDERS]: ['AI'],
  [ROUTES.AI_CHAT]: ['AI Chat'],
};
