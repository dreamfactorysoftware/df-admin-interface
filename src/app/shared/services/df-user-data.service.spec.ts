import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { DfUserDataService } from './df-user-data.service';
import { URLS } from '../constants/urls';
import { SESSION_TOKEN_HEADER } from '../constants/http-headers';
import { UserSession } from '../types/user';

const session = (over: Partial<UserSession>) =>
  ({ id: 7, sessionToken: 'tok-7', ...over }) as UserSession;

const rootAdmin = () =>
  session({ isSysAdmin: true, isRootAdmin: true, roleId: 5 });
const fullAdmin = () => session({ isSysAdmin: true, isRootAdmin: false });
const restrictedAdmin = () =>
  session({ isSysAdmin: true, isRootAdmin: false, roleId: 5 });
const plainUser = () =>
  session({ isSysAdmin: false, isRootAdmin: false, roleId: 5 });

const ROLE_URL = `${URLS.ROLES}/5`;

describe('DfUserDataService restricted-admin tabs', () => {
  let service: DfUserDataService;
  let http: HttpTestingController;
  let seen: Array<Array<string>>;

  beforeEach(() => {
    document.cookie = 'session_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC';
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(DfUserDataService);
    http = TestBed.inject(HttpTestingController);
    seen = [];
    service.restrictedAccess$.subscribe(tabs => seen.push(tabs));
  });

  afterEach(() => http.verify());

  // These pin what the constructor did before its body moved into a method:
  // who triggers the role GET, with what, and what restrictedAccess$ emits.
  describe('behaviour pinned from before the accessibleTabs() refactor', () => {
    it('starts with no tabs and no request while signed out', () => {
      expect(seen).toEqual([[]]);
    });

    it('root admin: no role request, no tabs, even with a role id', () => {
      service.userData = rootAdmin();
      http.expectNone(ROLE_URL);
      expect(seen).toEqual([[], []]);
    });

    it('full admin without a role: no role request, no tabs', () => {
      service.userData = fullAdmin();
      http.expectNone(ROLE_URL);
      expect(seen).toEqual([[], []]);
    });

    it('non-admin user: no role request, no tabs, even with a role id', () => {
      service.userData = plainUser();
      http.expectNone(ROLE_URL);
      expect(seen).toEqual([[], []]);
    });

    it('restricted admin with the Config tab: one role GET, then its tabs', () => {
      service.userData = restrictedAdmin();
      // Nothing new is emitted until the role answers.
      expect(seen).toEqual([[]]);

      const req = http.expectOne(r => r.url === ROLE_URL);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('related')).toBe(
        'role_service_access_by_role_id'
      );
      expect(String(req.request.params.get('accessible_tabs'))).toBe('true');
      expect(req.request.headers.get(SESSION_TOKEN_HEADER)).toBe('tok-7');
      req.flush({ id: 5, accessibleTabs: ['apps', 'config'] });

      expect(seen).toEqual([[], ['apps', 'config']]);
    });

    it('restricted admin without the Config tab: one role GET, then its tabs', () => {
      service.userData = restrictedAdmin();
      http
        .expectOne(r => r.url === ROLE_URL)
        .flush({
          id: 5,
          accessibleTabs: ['apps'],
        });
      expect(seen).toEqual([[], ['apps']]);
    });

    it('restricted admin whose role lists no tabs gets an empty list', () => {
      service.userData = restrictedAdmin();
      http.expectOne(r => r.url === ROLE_URL).flush({ id: 5 });
      expect(seen).toEqual([[], []]);
    });

    it('signing out clears the tabs without a request', () => {
      service.userData = restrictedAdmin();
      http
        .expectOne(r => r.url === ROLE_URL)
        .flush({
          id: 5,
          accessibleTabs: ['config'],
        });
      service.isLoggedIn = false;
      expect(service.userData).toBeNull();
      expect(seen).toEqual([[], ['config'], []]);
    });

    it('a new session while the role request is in flight cancels it', () => {
      service.userData = restrictedAdmin();
      const first = http.expectOne(r => r.url === ROLE_URL);
      service.userData = fullAdmin();
      expect(first.cancelled).toBe(true);
      expect(seen).toEqual([[], []]);
    });

    it('every new restricted session sends its own role request', () => {
      service.userData = restrictedAdmin();
      http
        .expectOne(r => r.url === ROLE_URL)
        .flush({
          id: 5,
          accessibleTabs: ['apps'],
        });
      service.userData = restrictedAdmin();
      http
        .expectOne(r => r.url === ROLE_URL)
        .flush({
          id: 5,
          accessibleTabs: ['config'],
        });
      expect(seen).toEqual([[], ['apps'], ['config']]);
    });
  });

  describe('accessibleTabs()', () => {
    const collect = (user: UserSession | null) => {
      const got: Array<Array<string>> = [];
      service.accessibleTabs(user).subscribe(tabs => got.push(tabs));
      return got;
    };

    it('joins the request in flight for the current session: one role GET', () => {
      const user = restrictedAdmin();
      service.userData = user;
      const got = collect(user);

      http
        .expectOne(r => r.url === ROLE_URL)
        .flush({
          id: 5,
          accessibleTabs: ['config'],
        });

      expect(got).toEqual([['config']]);
      expect(seen).toEqual([[], ['config']]);
    });

    it('replays the loaded tabs for the current session: no second GET', () => {
      const user = restrictedAdmin();
      service.userData = user;
      http
        .expectOne(r => r.url === ROLE_URL)
        .flush({
          id: 5,
          accessibleTabs: ['config'],
        });

      expect(collect(user)).toEqual([['config']]);
      http.expectNone(ROLE_URL);
    });

    it('answers with no tabs and no request for everyone else', () => {
      for (const user of [rootAdmin(), fullAdmin(), plainUser(), null]) {
        service.userData = user;
        expect(collect(user)).toEqual([[]]);
      }
      http.expectNone(ROLE_URL);
    });

    it('asks again after a failed role request instead of replaying the failure', () => {
      const user = restrictedAdmin();
      const errors: unknown[] = [];
      service.accessibleTabs(user).subscribe({ error: e => errors.push(e) });
      http
        .expectOne(r => r.url === ROLE_URL)
        .flush('no', { status: 500, statusText: 'Server Error' });
      expect(errors).toHaveLength(1);

      const got = collect(user);
      http
        .expectOne(r => r.url === ROLE_URL)
        .flush({
          id: 5,
          accessibleTabs: ['config'],
        });
      expect(got).toEqual([['config']]);
    });
  });
});
