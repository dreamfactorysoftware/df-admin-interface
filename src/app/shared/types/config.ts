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
  dfInstanceId?: string;
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

export interface CorsConfigData {
  createdById: number | null;
  createdDate: string | null;
  description: string;
  enabled: boolean;
  exposedHeader: string | null;
  header: string;
  id: number;
  lastModifiedById: number | null;
  lastModifiedDate: string | null;
  maxAge: number;
  method: string[];
  origin: string;
  path: string;
  supportsCredentials: boolean;
}
