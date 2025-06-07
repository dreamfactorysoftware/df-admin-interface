/**
 * Centralized application constants migrated from Angular shared constants.
 * Maintains compatibility with existing business logic while providing 
 * Next.js-compatible module exports for component and service consumption.
 */

// ============================================================================
// LANGUAGE CONSTANTS
// ============================================================================

/**
 * Supported languages configuration
 * Migrated from: src/app/shared/constants/languages.ts
 */
export const SUPPORTED_LANGUAGES = [
  {
    code: 'en',
    altCodes: ['en-US'], // ['en-US', 'en-CA']
  },
  // {
  //   code: 'fr',
  //   altCodes: ['fr-CA'],
  // },
] as const;

export const DEFAULT_LANGUAGE = 'en' as const;

// ============================================================================
// SCRIPT TYPE CONSTANTS
// ============================================================================

/**
 * Script types for code editor and execution
 * Migrated from: src/app/shared/constants/scripts.ts
 * Note: Removed Angular transloco dependency, using static labels
 */
export enum AceEditorMode {
  JSON = 'json',
  YAML = 'yaml',
  TEXT = 'text',
  NODEJS = 'nodejs',
  PHP = 'php',
  PYTHON = 'python',
  PYTHON3 = 'python3',
  JAVASCRIPT = 'javascript',
}

export const SCRIPT_TYPES = [
  {
    label: 'Node.js',
    value: AceEditorMode.NODEJS,
    extension: 'js',
  },
  {
    label: 'PHP',
    value: AceEditorMode.PHP,
    extension: 'php',
  },
  {
    label: 'Python',
    value: AceEditorMode.PYTHON,
    extension: 'py',
  },
  {
    label: 'Python 3',
    value: AceEditorMode.PYTHON3,
    extension: 'py',
  },
] as const;

// ============================================================================
// EXPORT FORMAT CONSTANTS
// ============================================================================

/**
 * Supported export file formats
 * Migrated from: src/app/shared/constants/supported-extensions.ts
 */
export const EXPORT_TYPES = ['csv', 'json', 'xml'] as const;

// ============================================================================
// ROUTE CONSTANTS
// ============================================================================

/**
 * Application route definitions
 * Migrated from: src/app/shared/types/routes.ts
 */
export enum ROUTES {
  IMPORT = 'import',
  EDIT = 'edit',
  CREATE = 'create',
  VIEW = 'view',
  AUTH = 'auth',
  LOGIN = 'login',
  RESET_PASSWORD = 'reset-password',
  FORGOT_PASSWORD = 'forgot-password',
  REGISTER = 'register',
  USER_INVITE = 'user-invite',
  REGISTER_CONFIRM = 'register-confirm',
  PROFILE = 'profile',
  HOME = 'home',
  WELCOME = 'welcome',
  QUICKSTART = 'quickstart',
  RESOURCES = 'resources',
  DOWNLOAD = 'download',
  API_CONNECTIONS = 'api-connections',
  API_TYPES = 'api-types',
  DATABASE = 'database',
  SCRIPTING = 'scripting',
  NETWORK = 'network',
  FILE = 'file',
  UTILITY = 'utility',
  ROLE_BASED_ACCESS = 'role-based-access',
  API_KEYS = 'api-keys',
  SCRIPTS = 'scripts',
  EVENT_SCRIPTS = 'event-scripts',
  API_DOCS = 'api-docs',
  API_SECURITY = 'api-security',
  RATE_LIMITING = 'rate-limiting',
  AUTHENTICATION = 'authentication',
  SYSTEM_SETTINGS = 'system-settings',
  CONFIG = 'config',
  SCHEDULER = 'scheduler',
  LOGS = 'logs',
  REPORTING = 'reporting',
  DF_PLATFORM_APIS = 'df-platform-apis',
  ADMIN_SETTINGS = 'admin-settings',
  ADMINS = 'admins',
  SCHEMA = 'schema',
  USERS = 'users',
  FILES = 'files',
  LAUNCHPAD = 'launchpad',
  DATA = 'data',
  PACKAGES = 'package-manager',
  SYSTEM_INFO = 'system-info',
  CORS = 'cors',
  CACHE = 'cache',
  EMAIL_TEMPLATES = 'email-templates',
  GLOBAL_LOOKUP_KEYS = 'global-lookup-keys',
  TABLES = 'tables',
  RELATIONSHIPS = 'relationships',
  FIELDS = 'fields',
  ERROR = 'error',
  LICENSE_EXPIRED = 'license-expired',
}

// ============================================================================
// SERVICE GROUP CONSTANTS
// ============================================================================

/**
 * Service grouping for DreamFactory service types
 * Migrated from: src/app/shared/constants/serviceGroups.ts
 */
export const SERVICE_GROUPS = {
  [ROUTES.DATABASE]: ['Database', 'Big Data'],
  [ROUTES.SCRIPTING]: ['Script'],
  [ROUTES.NETWORK]: ['Remote Service'],
  [ROUTES.FILE]: ['File', 'Excel'],
  [ROUTES.UTILITY]: [
    'Cache',
    'Email',
    'Notification',
    'Log',
    'Source Control',
    'IoT',
  ],
  [ROUTES.AUTHENTICATION]: ['LDAP', 'SSO', 'OAuth'],
  [ROUTES.LOGS]: ['Log'],
} as const;

// ============================================================================
// SERVICE TYPE DEFINITIONS
// ============================================================================

/**
 * Service type interface for DreamFactory services
 * Migrated from: src/app/shared/types/service.ts
 */
export interface ConfigSchema {
  name: string;
  label: string;
  type:
    | 'string'
    | 'text'
    | 'integer'
    | 'password'
    | 'boolean'
    | 'object'
    | 'array'
    | 'picklist'
    | 'multi_picklist'
    | 'file_certificate'
    | 'file_certificate_api'
    | 'verb_mask'
    | 'event_picklist';
  description?: string;
  alias: string;
  native?: any[];
  length?: number;
  precision: number;
  scale: any;
  default: any;
  required?: boolean;
  allowNull?: boolean;
  fixedLength?: boolean;
  supportsMultibyte?: boolean;
  isPrimaryKey?: boolean;
  isUnique?: boolean;
  isForeignKey?: boolean;
  refTable?: string;
  refField?: string;
  refOnUpdate: any;
  refOnDelete: any;
  picklist: any;
  validation: any;
  dbFunction: any;
  isVirtual?: boolean;
  isAggregate?: boolean;
  object?: {
    key: LabelType;
    value: LabelType;
  };
  items: Array<ConfigSchema> | 'string';
  values?: any[];
  dbType?: string;
  autoIncrement?: boolean;
  isIndex?: boolean;
  columns?: number;
  legend?: string;
}

interface LabelType {
  label: string;
  type: string;
}

export interface ServiceType {
  name: string;
  label: string;
  description: string;
  group: string;
  class?: string;
  configSchema: Array<ConfigSchema>;
}

export interface Service {
  id: number;
  name: string;
  label: string;
  description: string;
  isActive: boolean;
  type: string;
  mutable: boolean;
  deletable: boolean;
  createdDate: string;
  lastModifiedDate: string;
  createdById: number | null;
  lastModifiedById: number | null;
  config: any;
  serviceDocByServiceId: number | null;
  refresh: boolean;
}

export interface ServiceRow {
  id: number;
  name: string;
  label: string;
  description: string;
  type: string;
  scripting: string;
  active: boolean;
  deletable: boolean;
}

export interface LdapService {
  name: string;
  label: string;
}

export interface AuthService {
  iconClass: string;
  label: string;
  name: string;
  type: string;
  path: string;
}

/**
 * Silver tier service definitions
 * Migrated from: src/app/shared/constants/services.ts
 */
export const SILVER_SERVICES: Array<ServiceType> = [
  {
    name: 'adldap',
    label: 'Active Directory',
    description: 'A service for supporting Active Directory integration',
    group: 'LDAP',
    configSchema: [],
  },
  {
    name: 'ldap',
    label: 'Standard LDAP',
    description: 'A service for supporting Open LDAP integration',
    group: 'LDAP',
    configSchema: [],
  },
  {
    name: 'oidc',
    label: 'OpenID Connect',
    description: 'OpenID Connect service supporting SSO.',
    group: 'OAuth',
    configSchema: [],
  },
  {
    name: 'oauth_azure_ad',
    label: 'Azure Active Directory OAuth',
    description:
      'OAuth service for supporting Azure Active Directory authentication and API access.',
    group: 'OAuth',
    configSchema: [],
  },
  {
    name: 'saml',
    label: 'SAML 2.0',
    description: 'SAML 2.0 service supporting SSO.',
    group: 'SSO',
    configSchema: [],
  },
  {
    name: 'okta_saml',
    label: 'Okta SAML',
    description: 'Okta service supporting SSO.',
    group: 'SSO',
    configSchema: [],
  },
  {
    name: 'auth0_sso',
    label: 'Auth0 SSO',
    description: 'Auth0 service supporting SSO.',
    group: 'SSO',
    configSchema: [],
  },
  {
    name: 'ibmdb2',
    label: 'IBM DB2',
    description: 'Database service supporting IBM DB2 SQL connections.',
    group: 'Database',
    configSchema: [],
  },
  {
    name: 'informix',
    label: 'IBM Informix',
    description: 'Database service supporting IBM Informix SQL connections.',
    group: 'Database',
    configSchema: [],
  },
  {
    name: 'oracle',
    label: 'Oracle',
    description: 'Database service supporting SQL connections.',
    group: 'Database',
    configSchema: [],
  },
  {
    name: 'salesforce_db',
    label: 'Salesforce',
    description:
      'Database service with SOAP and/or OAuth authentication support for Salesforce connections.',
    group: 'Database',
    configSchema: [],
  },
  {
    name: 'soap',
    label: 'SOAP Service',
    description: 'A service to handle SOAP Services',
    group: 'Remote Service',
    configSchema: [],
  },
  {
    name: 'sqlanywhere',
    label: 'SAP SQL Anywhere',
    description: 'Database service supporting SAP SQL Anywhere connections.',
    group: 'Database',
    configSchema: [],
  },
  {
    name: 'sqlsrv',
    label: 'SQL Server',
    description: 'Database service supporting SQL Server connections.',
    group: 'Database',
    configSchema: [],
  },
  {
    name: 'memsql',
    label: 'MemSQL',
    description: 'Database service supporting MemSQL connections.',
    group: 'Database',
    configSchema: [],
  },
  {
    name: 'apns',
    label: 'Apple Push Notification',
    description: 'Apple Push Notification Service Provider.',
    group: 'Notification',
    configSchema: [],
  },
  {
    name: 'gcm',
    label: 'GCM Push Notification',
    description: 'GCM Push Notification Service Provider.',
    group: 'Notification',
    configSchema: [],
  },
  {
    name: 'mysql',
    label: 'MySQL',
    description: 'Database service supporting MySLQ connections.',
    group: 'Database',
    configSchema: [],
  },
  {
    name: 'mariadb',
    label: 'MariaDB',
    description: 'Database service supporting MariaDB connections.',
    group: 'Database',
    configSchema: [],
  },
  {
    name: 'nodejs',
    label: 'Node.js',
    description:
      'Service that allows client-callable scripts utilizing the system scripting.',
    group: 'Script',
    configSchema: [],
  },
  {
    name: 'php',
    label: 'PHP',
    description:
      'Service that allows client-callable scripts utilizing the system scripting.',
    group: 'Script',
    configSchema: [],
  },
  // {
  //   name: 'python',
  //   label: 'Python',
  //   description:
  //     'Service that allows client-callable scripts utilizing the system scripting.',
  //   group: 'Script',
  //   configSchema: [],
  // },
  {
    name: 'python3',
    label: 'Python3',
    description:
      'Service that allows client-callable scripts utilizing the system scripting.',
    group: 'Script',
    configSchema: [],
  },
  {
    name: 'mongodb',
    label: 'MongoDB',
    description: 'Database service for MongoDB connections.',
    group: 'Database',
    configSchema: [],
  },
  {
    name: 'gridfs',
    label: 'GridFS',
    description: 'GridFS File Storage services.',
    group: 'File',
    configSchema: [],
  },
] as const;

/**
 * Gold tier service definitions
 * Migrated from: src/app/shared/constants/services.ts
 */
export const GOLD_SERVICES: Array<ServiceType> = [
  {
    name: 'logstash',
    label: 'Logstash',
    description: 'Logstash service.',
    group: 'Log',
    configSchema: [],
  },
  {
    name: 'snowflake',
    label: 'Snowflake',
    description: 'Database service supporting Snowflake connections.',
    group: 'Database',
    configSchema: [],
  },
  {
    name: 'apache_hive',
    label: 'Apache Hive',
    description:
      'The Apache Hive data warehouse software facilitates reading, writing, and managing large datasets residing in distributed storage using SQL',
    group: 'Big Data',
    configSchema: [],
  },
  {
    name: 'databricks',
    label: 'Databricks',
    description:
      'The Databricks data intelligence platform simplifies data engineering, analytics, and AI workloads by providing scalable compute and SQL-based access to large datasets in a unified environment.',
    group: 'Big Data',
    configSchema: [],
  },
  {
    name: 'dremio',
    label: 'Dremio',
    description:
      'The Dremio data lakehouse platform enables fast querying, data exploration, and analytics on large datasets across various storage systems using SQL.',
    group: 'Big Data',
    configSchema: [],
  },
  {
    name: 'hadoop_hdfs',
    label: 'Hadoop HDFS',
    description: 'Hadoop Distributed File System',
    group: 'File',
    configSchema: [],
  },
  {
    name: 'hana',
    label: 'SAP HANA',
    description: 'SAP HANA service.',
    group: 'Big Data',
    configSchema: [],
  },
] as const;

// ============================================================================
// HTTP HEADER CONSTANTS
// ============================================================================

/**
 * DreamFactory API header constants
 * Migrated from: src/app/shared/constants/http-headers.ts
 * Compatible with Next.js fetch API and middleware patterns
 */
export const SESSION_TOKEN_HEADER = 'X-DreamFactory-Session-Token' as const;
export const API_KEY_HEADER = 'X-DreamFactory-API-Key' as const;
export const LICENSE_KEY_HEADER = 'X-DreamFactory-License-Key' as const;

/**
 * HTTP headers for Next.js fetch API usage
 * Replaces Angular HTTP interceptor patterns
 */
export const SHOW_LOADING_HEADER = {
  'show-loading': '',
} as const;

/**
 * HTTP options for specific request types
 * Compatible with fetch API Request initialization
 */
export const HTTP_OPTION_LOGIN_FALSE = {
  headers: SHOW_LOADING_HEADER,
  params: {
    login: false,
  },
} as const;

export const HTTP_OPTION_RESET_TRUE = {
  headers: SHOW_LOADING_HEADER,
  params: {
    reset: true,
  },
} as const;

// ============================================================================
// DATABASE TYPE CONSTANTS
// ============================================================================

/**
 * Supported database types for connection configuration
 * Derived from service definitions for consistent database support
 */
export const DATABASE_TYPES = [
  'mysql',
  'mariadb',
  'postgresql',
  'sqlsrv',
  'oracle',
  'ibmdb2',
  'informix',
  'sqlanywhere',
  'mongodb',
  'snowflake',
  'salesforce_db',
  'memsql',
  'apache_hive',
  'databricks',
  'dremio',
  'hana',
] as const;

/**
 * Database connection timeout defaults (in milliseconds)
 */
export const CONNECTION_TIMEOUT = 5000 as const;
export const VALIDATION_TIMEOUT = 3000 as const;

// ============================================================================
// COMMON PATTERNS
// ============================================================================

/**
 * HTTP status codes for API responses
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

/**
 * Common HTTP methods for API requests
 */
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
  OPTIONS: 'OPTIONS',
} as const;

/**
 * Request content types
 */
export const CONTENT_TYPES = {
  JSON: 'application/json',
  FORM_DATA: 'multipart/form-data',
  URL_ENCODED: 'application/x-www-form-urlencoded',
  TEXT: 'text/plain',
  XML: 'application/xml',
  CSV: 'text/csv',
} as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

/**
 * Type aliases for better type inference and documentation
 */
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number]['code'];
export type ExportType = typeof EXPORT_TYPES[number];
export type DatabaseType = typeof DATABASE_TYPES[number];
export type HttpMethod = keyof typeof HTTP_METHODS;
export type HttpStatus = typeof HTTP_STATUS[keyof typeof HTTP_STATUS];
export type ContentType = typeof CONTENT_TYPES[keyof typeof CONTENT_TYPES];

/**
 * Service tier type unions for type safety
 */
export type SilverServiceType = typeof SILVER_SERVICES[number];
export type GoldServiceType = typeof GOLD_SERVICES[number];
export type AllServiceTypes = SilverServiceType | GoldServiceType;