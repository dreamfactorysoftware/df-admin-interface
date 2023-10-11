import { Inject, Injectable } from '@angular/core';
import { BehaviorSubject, map, of, switchMap } from 'rxjs';
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

  private TOKEN_KEY = 'session_token';

  constructor(
    @Inject(ROLE_SERVICE_TOKEN) private roleService: DfBaseCrudService
  ) {
    this.userData$
      .pipe(
        switchMap(userData => {
          if (userData && userData.isSysAdmin && !userData.isRootAdmin) {
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
        })
      )
      .subscribe(role => this.restrictedAccessSubject.next(role));
  }

  clearToken() {
    document.cookie = `${this.TOKEN_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
    this.isLoggedIn = false;
  }

  set userData(userData: UserSession | null) {
    this.userDataSubject.next(userData);
    if (userData) {
      this.token = userData.sessionToken;
      this.isLoggedIn = true;
    }
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
