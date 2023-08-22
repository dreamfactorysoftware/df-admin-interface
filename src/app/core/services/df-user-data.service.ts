import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { URLS } from '../constants/urls';
import { GenericListResponse } from 'src/app/shared/types/generic-http.type';

@Injectable({
  providedIn: 'root',
})
export class DfUserDataService {
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  isLoggedIn$ = this.isLoggedInSubject.asObservable();
  private userDataSubject = new BehaviorSubject<UserData | null>(null);
  userData$ = this.userDataSubject.asObservable();

  private TOKEN_KEY = 'session_token';

  constructor(private http: HttpClient) {}

  getSystemUsers(): Observable<GenericListResponse<Array<SystemUserType>>> {
    const relatedParams = [
      'lookup_by_user_id',
      'user_to_app_to_role_by_user_id',
    ];

    return this.http.get<GenericListResponse<Array<SystemUserType>>>(
      URLS.SYSTEM_USERS,
      {
        params: {
          related: relatedParams.join(','),
        },
      }
    );
  }

  clearToken() {
    sessionStorage.removeItem(this.TOKEN_KEY);
  }

  get userData(): UserData | null {
    return this.userDataSubject.value;
  }

  set userData(userData: UserData | null) {
    this.userDataSubject.next(userData);
    if (userData) {
      this.token = userData.sessionToken;
      this.isLoggedIn = true;
    }
  }

  set isLoggedIn(isLoggedIn: boolean) {
    this.isLoggedInSubject.next(isLoggedIn);
  }

  get token(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  set token(token: string) {
    sessionStorage.setItem(this.TOKEN_KEY, token);
  }
}

export interface SystemUserType {
  id: number;
  name: string;
  username: string;
  ldapUsername: string | null;
  firstName: string;
  lastName: string;
  lastLoginDate: string | null;
  email: string;
  isActive: boolean;
  phone: string | null;
  securityQuestion: string | null;
  defaultAppId: number | null;
  adldap: string | null;
  oauthProvider: string | null;
  saml: string | null;
  createdDate: string;
  lastModifiedDate: string;
  createdById: number;
  lastModifiedById: number;
  isRootAdmin: number;
  confirmed: boolean;
  expired: boolean;
  lookupByUserId: any[];
  userToAppToRoleByUserId: Record<string, number>[];
}

export interface UserData {
  email: string;
  firstName: string;
  host: string;
  id: number;
  isRootAdmin: boolean;
  isSysAdmin: boolean;
  lastLoginDate: string;
  lastName: string;
  name: string;
  sessionId: string;
  sessionToken: string;
  tokenExpiryDate: string;
}
