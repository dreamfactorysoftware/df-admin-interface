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
}

export interface UserRow {
  active: boolean;
  id: number;
  email: string;
  displayName: string;
  firstName: string;
  lastName: string;
  registration: string;
}

export interface AdminType extends UserProfile {
  id: number;
  ldapUsername: string;
  lastLoginDate: string;
  isActive: boolean;
  phone: string;
  saml: string;
  createdDate: string;
  lastModifiedDate: string;
  createdById: number;
  lastModifiedById: number;
  isRootAdmin: number;
  confirmed: boolean;
  expired: boolean;
  lookupByUserId: Array<any>;
  userToAppToRoleByUserId: Array<{
    id: number;
    userId: number;
    appId: number;
    roleId: number;
  }>;
}
