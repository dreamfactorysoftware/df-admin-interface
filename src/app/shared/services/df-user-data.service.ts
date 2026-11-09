import { Inject, Injectable } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  map,
  of,
  shareReplay,
  switchMap,
} from 'rxjs';
import { UserSession } from '../types/user';
import { ROLE_SERVICE_TOKEN } from '../constants/tokens';
import { DfBaseCrudService } from './df-base-crud.service';
import { RoleType } from '../types/role';
import { SESSION_TOKEN_HEADER } from '../constants/http-headers';

@Injectable({
  providedIn: 'root',
})
export class DfUserDataService {
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  isLoggedIn$ = this.isLoggedInSubject.asObservable();
  private userDataSubject = new BehaviorSubject<UserSession | null>(null);
  userData$ = this.userDataSubject.asObservable();
  private restrictedAccessSubject = new BehaviorSubject<Array<string>>([]);
  restrictedAccess$ = this.restrictedAccessSubject.asObservable();
  // The tabs request made for the current session, kept so accessibleTabs()
  // can join it instead of sending the role GET a second time.
  private tabsRequest?: {
    userData: UserSession | null;
    tabs$: Observable<Array<string>>;
  };

  private TOKEN_KEY = 'session_token';

  constructor(
    @Inject(ROLE_SERVICE_TOKEN) private roleService: DfBaseCrudService
  ) {
    this.userData$
      .pipe(switchMap(userData => this.loadTabs(userData)))
      .subscribe(role => this.restrictedAccessSubject.next(role));
  }

  /**
   * Tabs a restricted admin may use; empty for everyone else. For the current
   * session this joins (or replays) the request the service already made, so
   * a guard can wait for the real tabs without a second role GET.
   */
  accessibleTabs(userData: UserSession | null): Observable<Array<string>> {
    return this.tabsRequest?.userData === userData
      ? this.tabsRequest.tabs$
      : this.loadTabs(userData);
  }

  // One request per userData$ emission, exactly as before. refCount keeps the
  // old cancel-on-switch behaviour; a failed request is not replayed.
  private loadTabs(userData: UserSession | null): Observable<Array<string>> {
    const tabs$ = this.requestTabs(userData).pipe(
      shareReplay({ bufferSize: 1, refCount: true })
    );
    this.tabsRequest = { userData, tabs$ };
    return tabs$;
  }

  private requestTabs(userData: UserSession | null): Observable<Array<string>> {
    if (
      userData &&
      userData.isSysAdmin &&
      !userData.isRootAdmin &&
      userData.roleId
    ) {
      return this.roleService
        .get<RoleType>(userData.roleId, {
          related: 'role_service_access_by_role_id',
          additionalParams: [
            {
              key: 'accessible_tabs',
              value: true,
            },
          ],
          additionalHeaders: [
            {
              key: SESSION_TOKEN_HEADER,
              value: userData.sessionToken,
            },
          ],
        })
        .pipe(map(role => role.accessibleTabs ?? []));
    }
    return of([]);
  }

  clearToken() {
    document.cookie = `${this.TOKEN_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
    this.isLoggedIn = false;
  }

  get userData(): UserSession | null {
    return this.userDataSubject.value;
  }

  set userData(userData: UserSession | null) {
    this.userDataSubject.next(userData);
    if (userData) {
      this.token = userData.sessionToken;
      this.isLoggedIn = true;
    }
  }

  get isLoggedIn(): boolean {
    return this.isLoggedInSubject.value;
  }

  set isLoggedIn(isLoggedIn: boolean) {
    this.isLoggedInSubject.next(isLoggedIn);
    if (!isLoggedIn) {
      this.userData = null;
    }
  }

  get token(): string | null {
    const name = `${this.TOKEN_KEY}=`;
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');

    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) === 0) {
        return c.substring(name.length, c.length);
      }
    }
    return null;
  }

  set token(token: string) {
    document.cookie = `${this.TOKEN_KEY}=${token};expires=Session;path=/;SameSite=Strict`;
  }
}
