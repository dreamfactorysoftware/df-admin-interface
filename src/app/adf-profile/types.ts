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
