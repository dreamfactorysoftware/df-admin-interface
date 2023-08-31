export interface Platform {
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
  packages: Package[];
  rootAdminExists: boolean;
}

export interface Package {
  name: string;
  version: string;
}

export interface Server {
  serverOs: string;
  release: string;
  version: string;
  host: string;
  machine: string;
}

export interface Client {
  userAgent: string;
  ipAddress: string;
  locale: string;
}

export interface Php {
  phpVersion: string;
  serverApi: string;
}
