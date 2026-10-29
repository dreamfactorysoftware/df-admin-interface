import { UserSession } from '../types/user';
import { Nav } from '../types/nav';
import { ROUTES } from '../types/routes';
import { accessibleRoutes } from './route';
import { canManageServerSettings } from './server-settings-access';

const user = (u: Partial<UserSession>) => u as UserSession;

describe('canManageServerSettings', () => {
  it('allows a full admin', () => {
    expect(canManageServerSettings(user({ isSysAdmin: true }), [])).toBe(true);
  });

  it('allows a root admin even when a role is attached', () => {
    expect(
      canManageServerSettings(
        user({ isSysAdmin: true, isRootAdmin: true, roleId: 3 }),
        []
      )
    ).toBe(true);
  });

  it('allows a restricted admin whose tabs include config', () => {
    expect(
      canManageServerSettings(user({ isSysAdmin: true, roleId: 3 }), [
        'apps',
        'config',
      ])
    ).toBe(true);
  });

  it('denies a restricted admin without the config tab', () => {
    expect(
      canManageServerSettings(user({ isSysAdmin: true, roleId: 3 }), ['apps'])
    ).toBe(false);
  });

  it('denies a non-admin and a missing session', () => {
    expect(
      canManageServerSettings(user({ isSysAdmin: false, roleId: 3 }), ['config'])
    ).toBe(false);
    expect(canManageServerSettings(null, ['config'])).toBe(false);
  });
});

describe('accessibleRoutes server settings', () => {
  const navs = (): Nav[] => [
    { path: '/system-info', route: ROUTES.SYSTEM_INFO },
    { path: '/server-settings', route: ROUTES.SERVER_SETTINGS },
  ];

  it('keeps server-settings for the config tab', () => {
    expect(accessibleRoutes(navs(), ['config']).map(n => n.route)).toContain(
      ROUTES.SERVER_SETTINGS
    );
  });

  it('drops server-settings without the config tab', () => {
    expect(accessibleRoutes(navs(), ['apps']).map(n => n.route)).not.toContain(
      ROUTES.SERVER_SETTINGS
    );
  });
});
