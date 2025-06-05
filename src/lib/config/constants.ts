/**
 * Centralized Application Constants
 * 
 * Consolidates constants from multiple Angular files into a unified module
 * compatible with React 19/Next.js 15.1 architecture. Maintains exact
 * compatibility with existing business logic while providing framework-agnostic
 * constant definitions for component and service consumption.
 * 
 * Migration Source: Consolidates the following Angular constant files:
 * - src/app/shared/constants/languages.ts
 * - src/app/shared/constants/scripts.ts  
 * - src/app/shared/constants/http-headers.ts
 * - src/app/shared/constants/serviceGroups.ts
 * - src/app/shared/constants/services.ts
 * - src/app/shared/constants/supported-extensions.ts
 */

// =============================================================================
// LANGUAGE CONFIGURATION
// =============================================================================

/**
 * Supported application languages for internationalization
 * Maintains compatibility with existing translation infrastructure
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

/**
 * Default fallback language for the application
 */
export const DEFAULT_LANGUAGE = 'en' as const;

// =============================================================================
// SCRIPT TYPES AND ACE EDITOR MODES
// =============================================================================

/**
 * Ace Editor modes for syntax highlighting
 * Framework-agnostic enum compatible with React components
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

/**
 * Script type definitions for code editor components
 * Note: Labels are provided as keys for i18n translation lookup
 * React components should translate these keys at runtime
 */
export const SCRIPT_TYPES = [
  {
    labelKey: 'scriptTypes.nodejs', // Translate at runtime
    value: AceEditorMode.NODEJS,
    extension: 'js',
  },
  {
    labelKey: 'scriptTypes.php', // Translate at runtime
    value: AceEditorMode.PHP,
    extension: 'php',
  },
  {
    labelKey: 'scriptTypes.python', // Translate at runtime
    value: AceEditorMode.PYTHON,
    extension: 'py',
  },
  {
    labelKey: 'scriptTypes.python3', // Translate at runtime
    value: AceEditorMode.PYTHON3,
    extension: 'py',
  },
] as const;

// =============================================================================
// HTTP HEADERS AND REQUEST OPTIONS
// =============================================================================

/**
 * DreamFactory HTTP headers for authentication and session management
 * Compatible with Next.js fetch API and middleware patterns
 */
export const HTTP_HEADERS = {
  SESSION_TOKEN: 'X-DreamFactory-Session-Token',
  API_KEY: 'X-DreamFactory-API-Key',
  LICENSE_KEY: 'X-DreamFactory-License-Key',
  SHOW_LOADING: 'show-loading',
} as const;

/**
 * Pre-configured header objects for common request patterns
 * Optimized for Next.js fetch API usage
 */
export const REQUEST_OPTIONS = {
  WITH_LOADING: {
    headers: {
      [HTTP_HEADERS.SHOW_LOADING]: '',
    },
  },
  LOGIN_FALSE: {
    headers: {
      [HTTP_HEADERS.SHOW_LOADING]: '',
    },
    // Note: URL params should be handled by Next.js API client implementation
    params: {
      login: false,
    },
  },
  RESET_TRUE: {
    headers: {
      [HTTP_HEADERS.SHOW_LOADING]: '',
    },
    // Note: URL params should be handled by Next.js API client implementation  
    params: {
      reset: true,
    },
  },
} as const;

// =============================================================================
// ROUTES ENUM
// =============================================================================

/**
 * Application routes enum for consistent navigation and service grouping
 * Compatible with Next.js app router file-based routing
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

// =============================================================================
// SERVICE GROUPS AND CATEGORIES
// =============================================================================

/**
 * Service group mappings for DreamFactory service categorization
 * Maps route types to human-readable service group labels
 * Maintains compatibility with existing service registration logic
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

// =============================================================================
// SERVICE TYPE DEFINITIONS
// =============================================================================

/**
 * Service type interface for DreamFactory service configuration
 * Maintains compatibility with existing service registration APIs
 */
export interface ServiceType {
  name: string;
  label: string;
  description: string;
  group: string;
  class?: string;
  configSchema: Array<ConfigSchema>;
}

/**
 * Configuration schema interface for service setup forms
 * Compatible with React Hook Form and Zod validation patterns
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

/**
 * Label type for configuration schema
 */
interface LabelType {
  label: string;
  type: string;
}

/**
 * Silver tier service definitions
 * Maintains exact compatibility with existing service configuration
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
 * Premium service integrations for enterprise deployments
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

// =============================================================================
// FILE EXPORT AND DATA FORMATS
// =============================================================================

/**
 * Supported file export formats for data export functionality
 * Compatible with Next.js API routes and file streaming
 */
export const EXPORT_TYPES = ['csv', 'json', 'xml'] as const;

// =============================================================================
// API ENDPOINTS AND BASE URLS
// =============================================================================

/**
 * Base API URL for DreamFactory v2 endpoints
 * Compatible with Next.js environment configuration
 */
export const BASE_URL = '/api/v2' as const;

/**
 * API endpoint URLs for DreamFactory services
 * Supports both internal v2 service paths and external endpoints
 */
export const URLS = {
  // Internal DreamFactory v2 API endpoints
  SYSTEM: '/api/v2/system',
  USER_SESSION: '/api/v2/user/session',
  ADMIN_PASSWORD: '/api/v2/system/admin/password',
  ADMIN_SESSION: '/api/v2/system/admin/session',
  ADMIN_PROFILE: '/api/v2/system/admin/profile',
  USER_PROFILE: '/api/v2/user/profile',
  USER_PASSWORD: '/api/v2/user/password',
  REGISTER: '/api/v2/user/register',
  USER_CUSTOM: '/api/v2/user/custom',
  
  // External service endpoints
  GITHUB_REPOS: 'https://api.github.com/repos',
  DREAMFACTORY_SUBSCRIPTION: 'https://updates.dreamfactory.com/check',
  CALENDLY_WIDGET: 'https://assets.calendly.com/assets/external/widget.js',
} as const;

// =============================================================================
// TYPE EXPORTS FOR EXTERNAL CONSUMPTION
// =============================================================================

/**
 * Type definitions for constants to enable type-safe usage
 */
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];
export type ScriptTypeConfig = typeof SCRIPT_TYPES[number];
export type HttpHeaderKey = keyof typeof HTTP_HEADERS;
export type RequestOptionKey = keyof typeof REQUEST_OPTIONS;
export type ServiceGroupMapping = typeof SERVICE_GROUPS;
export type SilverServiceType = typeof SILVER_SERVICES[number];
export type GoldServiceType = typeof GOLD_SERVICES[number];
export type AllServiceTypes = SilverServiceType | GoldServiceType;
export type ExportFormat = typeof EXPORT_TYPES[number];
export type ApiEndpoint = keyof typeof URLS;

/**
 * Helper type for service lookup by name
 */
export type ServiceByName<T extends string> = AllServiceTypes extends infer U
  ? U extends ServiceType
    ? U['name'] extends T
      ? U
      : never
    : never
  : never;

/**
 * Helper function to get all services (Silver + Gold)
 */
export const getAllServices = (): Array<ServiceType> => [
  ...SILVER_SERVICES,
  ...GOLD_SERVICES,
];

/**
 * Helper function to get services by group
 */
export const getServicesByGroup = (group: string): Array<ServiceType> => {
  const allServices = getAllServices();
  return allServices.filter(service => service.group === group);
};

/**
 * Helper function to get service groups for a route
 */
export const getServiceGroupsForRoute = (route: ROUTES): readonly string[] => {
  return SERVICE_GROUPS[route] || [];
};