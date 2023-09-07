import { AuthService, LdapService, Service, ServiceType } from './service';

export interface Environment {
  authentication: {
    allowOpenRegistration: boolean;
    openRegEmailServiceId: number;
    allowForeverSessions: boolean;
    loginAttribute: string;
    adldap: Array<LdapService>;
    oauth: Array<AuthService>;
    saml: Array<AuthService>;
  };
  platform: {
    rootAdminExists: boolean;
    host?: string;
  };
}

export interface System {
  services: Array<Service>;
  serviceTypes: Array<ServiceType>;
}
