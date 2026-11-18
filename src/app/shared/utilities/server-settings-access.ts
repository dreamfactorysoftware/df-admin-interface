import { UserSession } from '../types/user';

/**
 * Who may open Server Settings: a full admin, or a restricted admin whose role
 * has the Config tab. A restricted admin is a sys admin who is not root and has
 * a role, the same definition DfUserDataService uses to load accessible tabs.
 */
export function canManageServerSettings(
  user: UserSession | null | undefined,
  tabs: Array<string>
): boolean {
  return (
    !!user?.isSysAdmin &&
    (!!user.isRootAdmin || !user.roleId || tabs.includes('config'))
  );
}
