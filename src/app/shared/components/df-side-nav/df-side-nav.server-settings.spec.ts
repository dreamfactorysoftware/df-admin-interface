import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { TranslocoService, provideTransloco } from '@ngneat/transloco';
import { TranslocoHttpLoader } from 'src/transloco-loader';
import { routes } from 'src/app/routes';
import { DfSideNavComponent } from './df-side-nav.component';
import { DfUserDataService } from '../../services/df-user-data.service';
import { SESSION_TOKEN_HEADER } from '../../constants/http-headers';
import { URLS } from '../../constants/urls';
import { Nav } from '../../types/nav';
import { ROUTES } from '../../types/routes';
import { UserSession } from '../../types/user';
import {
  accessibleRoutes,
  transformRoutes,
  withoutRoute,
} from '../../utilities/route';

const SERVER_SETTINGS = '/system-settings/config/server-settings';
const SYSTEM_INFO = '/system-settings/config/system-info';
const CORS = '/system-settings/config/cors';

const paths = (items: Array<Nav>): string[] =>
  items.flatMap(i => [i.path, ...(i.subRoutes ? paths(i.subRoutes) : [])]);

const session = (over: Partial<UserSession>) =>
  ({ id: 7, sessionToken: 'tok', ...over }) as UserSession;

const OLD_BACKEND = { resource: [{ name: 'admin' }, { name: 'cache' }] };
const NEW_BACKEND = {
  resource: [{ name: 'admin' }, { name: 'server_setting' }],
};

// The nav is driven end to end here: real user data service, real server
// settings service, HTTP answered by the test.
describe('DfSideNavComponent Server Settings entry', () => {
  let fixture: ComponentFixture<DfSideNavComponent>;
  let component: DfSideNavComponent;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        DfSideNavComponent,
        HttpClientTestingModule,
        NoopAnimationsModule,
        MatSnackBarModule,
      ],
      providers: [
        provideTransloco({
          config: { defaultLang: 'en', availableLangs: ['en'] },
          loader: TranslocoHttpLoader,
        }),
        TranslocoService,
        {
          provide: ActivatedRoute,
          useValue: {
            data: {
              pipe: () => ({ subscribe: (fn: (v: unknown) => void) => fn({}) }),
            },
          },
        },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(DfSideNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  const signIn = (user: UserSession, tabs?: string[]) => {
    TestBed.inject(DfUserDataService).userData = user;
    http
      .match(r => r.url === `${URLS.ROLES}/${user.roleId}`)
      .forEach(r => r.flush({ id: user.roleId, accessibleTabs: tabs }));
  };

  /** Answers the system resource list lookup; returns how many were pending. */
  const answerSystemList = (body: object) => {
    const pending = http.match(r => r.url === URLS.SYSTEM);
    pending.forEach(r => r.flush(body));
    return pending.length;
  };

  const navPaths = () => paths(component.nav);
  const groupPaths = () => paths(component.navGroups.flatMap(g => g.items));

  // The component regroups the list it is given in place (API Builder, Agents
  // and Alerts move under their parents), so expectations go through the
  // same step.
  const built = (nav: Array<Nav>) => {
    (
      component as unknown as { buildNavGroups(n: Array<Nav>): unknown }
    ).buildNavGroups(nav);
    return paths(nav);
  };

  // What develop builds for an admin: the whole route table. Server Settings
  // is the only route this feature adds, so without it the two are equal.
  const fullNavWithoutServerSettings = () =>
    built(withoutRoute(transformRoutes(routes), ROUTES.SERVER_SETTINGS));

  const rootAdmin = session({ isSysAdmin: true, isRootAdmin: true });
  const fullAdmin = session({ isSysAdmin: true, isRootAdmin: false });
  const restricted = session({
    isSysAdmin: true,
    isRootAdmin: false,
    roleId: 5,
  });
  const plainUser = session({
    isSysAdmin: false,
    isRootAdmin: false,
    roleId: 6,
  });

  describe('on a backend without system/server_setting', () => {
    it.each([
      ['root admin', rootAdmin, undefined],
      ['full admin', fullAdmin, undefined],
      ['restricted admin with the Config tab', restricted, ['apps', 'config']],
    ])('%s: no entry, the rest of the nav is unchanged', (_, user, tabs) => {
      signIn(user, tabs);
      expect(answerSystemList(OLD_BACKEND)).toBe(1);

      expect(navPaths()).not.toContain(SERVER_SETTINGS);
      expect(groupPaths()).not.toContain(SERVER_SETTINGS);
      expect(navPaths()).toEqual(fullNavWithoutServerSettings());
      expect(navPaths()).toContain(SYSTEM_INFO);
      expect(navPaths()).toContain(CORS);
    });

    it('keeps the entry out when the resource list cannot be read', () => {
      signIn(rootAdmin);
      http
        .match(r => r.url === URLS.SYSTEM)
        .forEach(r => r.flush('no', { status: 500, statusText: 'Error' }));
      expect(navPaths()).not.toContain(SERVER_SETTINGS);
      expect(navPaths()).toEqual(fullNavWithoutServerSettings());
    });
  });

  describe('on a backend with system/server_setting', () => {
    it.each([
      ['root admin', rootAdmin, undefined],
      ['full admin', fullAdmin, undefined],
      ['restricted admin with the Config tab', restricted, ['apps', 'config']],
    ])('%s: the entry appears once the lookup answers', (_, user, tabs) => {
      signIn(user, tabs);
      // The nav is already built and usable before the lookup answers.
      expect(navPaths()).toEqual(fullNavWithoutServerSettings());

      expect(answerSystemList(NEW_BACKEND)).toBe(1);

      expect(navPaths()).toEqual(built(transformRoutes(routes)));
      expect(navPaths()).toContain(SERVER_SETTINGS);
      expect(groupPaths()).toContain(SERVER_SETTINGS);
    });

    it('the lookup is authenticated with the token of the new session', () => {
      signIn(rootAdmin);
      const [req] = http.match(r => r.url === URLS.SYSTEM);
      expect(req.request.headers.get(SESSION_TOKEN_HEADER)).toBe('tok');
      expect(req.request.headers.has('show-loading')).toBe(false);
      req.flush(NEW_BACKEND);
      expect(navPaths()).toContain(SERVER_SETTINGS);
    });

    it('restricted admin without the Config tab: no entry and no lookup', () => {
      signIn(restricted, ['apps']);
      expect(answerSystemList(NEW_BACKEND)).toBe(0);
      expect(navPaths()).not.toContain(SERVER_SETTINGS);
      expect(groupPaths()).not.toContain(SERVER_SETTINGS);
    });

    it('non-admin user: no entry and no lookup', () => {
      signIn(plainUser);
      expect(answerSystemList(NEW_BACKEND)).toBe(0);
      expect(navPaths()).not.toContain(SERVER_SETTINGS);
    });

    it('signing out removes the entry again', () => {
      signIn(rootAdmin);
      answerSystemList(NEW_BACKEND);
      expect(navPaths()).toContain(SERVER_SETTINGS);

      TestBed.inject(DfUserDataService).isLoggedIn = false;
      expect(navPaths()).not.toContain(SERVER_SETTINGS);
    });
  });

  // Pins what the nav showed each kind of user before this feature, so a
  // change to the shared tab logic that alters another screen's nav fails here.
  describe('nav per user kind, unchanged by this feature', () => {
    it('signed out: only the always-allowed routes', () => {
      expect(navPaths()).toEqual(
        built(accessibleRoutes(transformRoutes(routes), []))
      );
      expect(navPaths()).toContain(SYSTEM_INFO);
      expect(navPaths()).not.toContain(CORS);
    });

    // Existing behaviour, not introduced here: the nav does not narrow a
    // restricted admin by tabs (the check reads a `role_id` key the session
    // never has), so both kinds see what a root admin sees.
    it.each([
      ['with the Config tab', ['apps', 'config']],
      ['without the Config tab', ['apps']],
    ])('restricted admin %s: same nav as a root admin', (_, tabs) => {
      signIn(restricted, tabs);
      answerSystemList(OLD_BACKEND);
      expect(navPaths()).toEqual(fullNavWithoutServerSettings());
    });

    it('non-admin user: the fixed tab list, which has no Config pages', () => {
      signIn(plainUser);
      expect(navPaths()).toEqual(
        built(
          accessibleRoutes(transformRoutes(routes), [
            'apps',
            'users',
            'roles',
            'services',
            'apidocs',
            'schema/data',
            'files',
            'scripts',
            'systemInfo',
            'limits',
            'scheduler',
          ])
        )
      );
      expect(navPaths()).toContain(SYSTEM_INFO);
      expect(navPaths()).toContain('/admin-settings/users');
      expect(navPaths()).not.toContain(CORS);
      expect(navPaths()).not.toContain('/admin-settings/admins');
    });
  });
});

describe('withoutRoute', () => {
  const navs = (): Nav[] => [
    { path: '/a', route: ROUTES.HOME },
    {
      path: '/system-settings',
      route: ROUTES.SYSTEM_SETTINGS,
      subRoutes: [
        {
          path: '/system-settings/config',
          route: ROUTES.CONFIG,
          subRoutes: [
            { path: SYSTEM_INFO, route: ROUTES.SYSTEM_INFO },
            { path: SERVER_SETTINGS, route: ROUTES.SERVER_SETTINGS },
          ],
        },
      ],
    },
  ];

  it('removes the route at any depth and keeps everything else', () => {
    expect(paths(withoutRoute(navs(), ROUTES.SERVER_SETTINGS))).toEqual([
      '/a',
      '/system-settings',
      '/system-settings/config',
      SYSTEM_INFO,
    ]);
  });

  it('does not change the list it was given', () => {
    const input = navs();
    withoutRoute(input, ROUTES.SERVER_SETTINGS);
    expect(paths(input)).toContain(SERVER_SETTINGS);
  });

  it('returns an equal list when the route is not there', () => {
    expect(paths(withoutRoute(navs(), ROUTES.CORS))).toEqual(paths(navs()));
  });
});
