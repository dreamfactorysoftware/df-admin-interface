import { RoleType } from './role';

export type UserProfileType = 'users' | 'admins';

export interface UserProfile {
  adldap: string;
  defaultAppId: number;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  oauthProvider: string;
  phone: string;
  username: string;
  securityQuestion: string;
  securityAnswer?: string;
  currentPassword?: string;
  id: number;
  confirmed: boolean;
  createdById?: number;
  createdDate: string;
  expired: boolean;
  isActive: boolean;
  isRootAdmin: number;
  lastLoginDate: string;
  lastModifiedDate: string;
  lastModifiedById: number;
  ldapUsername: string;
  lookupByUserId: Array<any>;
  saml: string;
  userToAppToRoleByUserId: Array<{
    id: number;
    userId: number;
    appId: number;
    roleId: number;
  }>;
  role?: RoleType;
  password?: string;
}

export interface UserRow {
  active: boolean;
  id: number;
  email: string;
  displayName: string;
  firstName: string;
  lastName: string;
  registration: boolean;
}
export interface CreateAdmin extends UserProfile {
  isRestrictedAdmin?: boolean;
  accessByTabs?: string[];
}

export interface LookupKey {
  name: string;
  value: string;
  private: boolean;
}
