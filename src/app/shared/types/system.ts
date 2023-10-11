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
  platform?: {
    version: string;
    bitnamiDemo: boolean;
    isHosted: boolean;
    isTrial: boolean;
    license: string;
    securedPackageExport: boolean;
    licenseKey: string;
    dbDriver: string;
    installPath: string;
    logPath: string;
    appDebug: boolean;
    logMode: string;
    logLevel: string;
    cacheDriver: string;
    packages: Array<{
      name: string;
      version: string;
    }>;
    dfInstanceId: string;
  };
  server: {
    host: string;
    machine: string;
    release: string;
    serverOs: string;
    version: string;
  };
  php?: {
    core: {
      phpVersion: string;
    };
    general: {
      serverApi: string;
    };
  };
  client?: {
    userAgent: string;
    ipAddress: string;
    locale: string;
  };
}

export interface System {
  resource: Array<{
    name: string;
  }>;
}
