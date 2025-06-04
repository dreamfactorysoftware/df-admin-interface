/**
 * TypeScript type definitions for all translation keys and namespaces
 * used throughout the DreamFactory Admin Interface application.
 * 
 * This file provides compile-time type checking for translation keys,
 * ensuring that all references to translation strings are valid and
 * preventing runtime errors from missing translations.
 * 
 * Integration with React Hook Form and component prop validation is
 * supported through structured interfaces for form validation messages.
 */

// ============================================================================
// CORE TRANSLATION INTERFACES
// ============================================================================

/**
 * Common actions used throughout the application
 */
interface CommonActions {
  save: string;
  close: string;
  create: string;
  upload: string;
  delete: string;
  edit: string;
  saveAndClear: string;
  saveAndContinue: string;
  select: string;
  submit: string;
  browse: string;
  launch: string;
  launchApp: string;
  cancel: string;
  update: string;
  confirmed: string;
  sendInvite: string;
  filter: string;
  search: string;
  newEntry: string;
  clearLimitCounter: string;
  clearLimitCounters: string;
  exportList: string;
  importList: string;
  goBack: string;
  view: string;
  open: string;
  confirm: string;
}

/**
 * Common labels used in forms and displays
 */
interface CommonLabels {
  basic: string;
  selectAnOption: string;
  name: string;
  value: string;
  private: string;
  id: string;
  email: string;
  phone: string;
  displayName: string;
  firstName: string;
  lastName: string;
  active: string;
  registration: string;
  pending: string;
  description: string;
  role: string;
  apiKey: string;
  type: string;
  rate: string;
  counter: string;
  user: string;
  service: string;
  time: string;
  serviceId: string;
  serviceName: string;
  userEmail: string;
  action: string;
  request: string;
  files: string;
  logs: string;
  data: string;
  packages: string;
  launchpad: string;
  path: string;
  version: string;
  label: string;
  origins: string;
  headers: string;
  exposedHeaders: string;
  maxAge: string;
  methods: string;
  supportsCredentials: string;
  enabled: string;
  component: string;
  method: string;
  frequency: string;
  payload: string;
  noFileSelected: string;
  schema: string;
  apiDocs: string;
  searchFeatures: string;
  scriptType: string;
}

/**
 * Boolean representations
 */
interface CommonBooleans {
  yes: string;
  no: string;
}

/**
 * Common translation keys used across all components
 */
interface CommonTranslations {
  actions: CommonActions;
  labels: CommonLabels;
  booleans: CommonBooleans;
}

/**
 * UI-specific translations for accessibility and states
 */
interface UITranslations {
  accessibility: {
    resetRowCounter: string;
    editRow: string;
    deleteRow: string;
    selectRow: string;
    selectAll: string;
    deselectRow: string;
    deselectAll: string;
    sortCleared: string;
    sortedAsc: string;
    sortedDesc: string;
    sortDescription: string;
    selectPage: string;
    viewRow: string;
    toggleNav: string;
  };
  fileUpload: {
    desktopFile: string;
    githubFile: string;
  };
  states: {
    noEnteries: string;
  };
}

/**
 * HTTP verbs with descriptions
 */
interface VerbTranslations {
  get: string;
  post: string;
  put: string;
  patch: string;
  delete: string;
}

/**
 * Script types supported by the platform
 */
interface ScriptTypes {
  javascript: string;
  php: string;
  python: string;
  python3: string;
  nodejs: string;
}

/**
 * Navigation structure with nested hierarchy
 */
interface NavigationTranslations {
  error: {
    header: string;
  };
  home: {
    nav: string;
    header: string;
  };
  'api-connections': {
    nav: string;
    'api-types': {
      nav: string;
      database: {
        nav: string;
        header: string;
        create: {
          nav: string;
          header: string;
        };
        edit: {
          nav: string;
          header: string;
        };
      };
      scripting: {
        nav: string;
        header: string;
        create: {
          nav: string;
          header: string;
        };
        edit: {
          nav: string;
          header: string;
        };
      };
      network: {
        nav: string;
        header: string;
        create: {
          nav: string;
          header: string;
        };
        edit: {
          nav: string;
          header: string;
        };
      };
      file: {
        nav: string;
        header: string;
        create: {
          nav: string;
          header: string;
        };
      };
      utility: {
        nav: string;
        header: string;
        create: {
          nav: string;
          header: string;
        };
      };
    };
    'role-based-access': {
      nav: string;
      header: string;
      create: {
        nav: string;
        header: string;
      };
    };
    'api-keys': {
      nav: string;
      header: string;
      create: {
        nav: string;
        header: string;
      };
      edit: {
        header: string;
      };
      import: {
        nav: string;
        header: string;
      };
    };
    'event-scripts': {
      nav: string;
      header: string;
      create: {
        header: string;
      };
    };
    'api-docs': {
      nav: string;
      header: string;
    };
  };
  'api-security': {
    nav: string;
    'rate-limiting': {
      nav: string;
    };
  };
}

// ============================================================================
// MODULE-SPECIFIC TRANSLATION INTERFACES
// ============================================================================

/**
 * User management translations
 */
interface UsersTranslations {
  alerts: {
    new: string;
    createdSuccess: string;
    updateSuccess: string;
    deleteSuccess: string;
    importSuccess: string;
    exportSuccess: string;
  };
}

/**
 * Service management translations
 */
interface ServicesTranslations {
  details: string;
  definition: string;
  config: string;
  options: string;
  controls: {
    serviceType: {
      label: string;
      tooltip: string;
    };
    namespace: {
      label: string;
      tooltip: string;
    };
    label: {
      label: string;
      tooltip: string;
    };
    description: {
      label: string;
      tooltip: string;
    };
    createAndTest: string;
    securityConfig: string;
  };
  deleteSuccessMsg: string;
  createSuccessMsg: string;
  updateSuccessMsg: string;
}

/**
 * Admin management translations
 */
interface AdminsTranslations {
  accessByTabs: string;
  alerts: {
    newAdminInvite: string;
    restrictedAdminNotice: string;
    autoGeneratedRoleWarning: string;
    createSuccess: string;
    updateSuccess: string;
    deleteSuccess: string;
    importSuccess: string;
    exportSuccess: string;
  };
  tabs: {
    apps: string;
    users: string;
    services: string;
    apiDocs: string;
    schema: string;
    files: string;
    scripts: string;
    config: string;
    packageManager: string;
    rateLimiting: string;
    scheduler: string;
  };
}

/**
 * API documentation translations
 */
interface ApiDocsTranslations {
  table: {
    header: {
      serviceName: string;
      label: string;
      description: string;
      group: string;
      type: string;
    };
  };
  downloadApiDoc: string;
  apiKeys: {
    label: string;
    copied: string;
  };
}

/**
 * Cache management translations
 */
interface CacheTranslations {
  cache: string;
  overview: string;
  flushService: string;
  flushCache: string;
  flushSystemCache: string;
  perServiceCaches: string;
  description: string;
  serviceCacheFlushed: string;
  systemCacheFlushed: string;
}

/**
 * CORS configuration translations
 */
interface CorsTranslations {
  pageTitle: string;
  pageSubtitle: string;
  formControls: {
    path: string;
    description: string;
    origins: string;
    headers: string;
    exposedHeaders: string;
    maxAge: string;
    methods: string;
    supportsCredentials: string;
    enabled: string;
  };
  alerts: {
    createSuccess: string;
    updateSuccess: string;
  };
}

/**
 * Email templates translations
 */
interface EmailTemplatesTranslations {
  templateName: {
    label: string;
    placeholder: string;
    error: string;
  };
  templateDescription: {
    label: string;
    placeholder: string;
  };
  recipient: {
    label: string;
    tooltip: string;
  };
  cc: {
    label: string;
    tooltip: string;
  };
  bcc: {
    label: string;
    tooltip: string;
  };
  subject: {
    label: string;
    placeholder: string;
  };
  attachment: {
    label: string;
    tooltip: string;
    placeholder: string;
  };
  body: string;
  senderName: string;
  senderEmail: string;
  replyToName: string;
  replyToEmail: string;
  alerts: {
    createSuccess: string;
    updateSuccess: string;
  };
}

/**
 * File operations translations
 */
interface FilesTranslations {
  createFolder: string;
  folderName: string;
  importList: string;
  size: string;
  deleteFile: string;
  downloadFile: string;
  editFile: string;
  deleteFolder: string;
  openFolder: string;
  download: string;
  alerts: {
    uploadSuccess: string;
    createFolderSuccess: string;
    deleteFolderSuccess: string;
    downloadSuccess: string;
  };
}

/**
 * Home page translations
 */
interface HomeTranslations {
  resourceLinks: {
    gettingStartedGuide: string;
    writtenTutorials: string;
    videoTutorials: string;
    fullDocumentation: string;
    communityForum: string;
    bugFeatureRequests: string;
    twitter: string;
    blog: string;
    contactSupport: string;
  };
  welcomePage: {
    watchVideoCta: string;
    welcomeHeading: string;
    welcomeSubHeading: string;
    hearFromYou: string;
    clientPlatformHeading: string;
    nativeExamplesHeading: string;
    javaScriptExamplesHeading: string;
  };
  quickstartPage: {
    quickstartHeading: string;
    quickstartSubHeading: string;
    quickstartSteps: {
      stepOne: string;
      stepTwo: string;
      stepThree: string;
    };
  };
  resourcesPage: {
    resourcesHeading: string;
    resourcesSubHeading: string;
  };
  downloadPage: {
    downloadHeading: string;
    downloadText: string;
    cloudInstallersHeading: string;
    localInstallersHeading: string;
  };
  brandNames: {
    [key: string]: string;
  };
}

/**
 * Rate limiting and API limits translations
 */
interface LimitsTranslations {
  name: string;
  description: string;
  limitType: string;
  limitRate: string;
  limitPeriod: string;
  role: string;
  service: string;
  endpoint: string;
  user: string;
  verb: string;
  active: string;
  refresh: string;
  invalidForm: string;
  createSuccessMessage: string;
  updateSuccessMessage: string;
  deleteSuccessMessage: string;
  verbTooltip: string;
  limitTypes: {
    [key: string]: string;
  };
  limitPeriods: {
    [key: string]: string;
  };
}

/**
 * Role management translations
 */
interface RolesTranslations {
  roles: string;
  role: string;
  app: string;
  noRolesAssigned: string;
  rolesOverview: {
    heading: string;
    description: string;
    validationError: string;
  };
  accessOverview: {
    heading: string;
    description: string;
    tableLabels: {
      [key: string]: string;
    };
    columnHeadings: {
      [key: string]: string;
    };
    noAccessRules: string;
  };
  lookupKeys: {
    heading: string;
    description: string;
  };
}

/**
 * Scheduler translations
 */
interface SchedulerTranslations {
  form: {
    label: {
      [key: string]: string;
    };
  };
  table: {
    header: {
      [key: string]: string;
    };
  };
  logs: {
    [key: string]: string;
  };
  logPageTitle: string;
  logPageSubtitle: string;
  taskOverview: string;
  taskOverviewSubtitle: string;
  alerts: {
    [key: string]: string;
  };
}

/**
 * Database schema builder translations
 */
interface SchemaTranslations {
  fieldDetailsForm: {
    updateSuccess: string;
    createSuccess: string;
    controls: {
      name: {
        label: string;
        tooltip: string;
      };
      alias: {
        label: string;
        tooltip: string;
      };
      label: {
        label: string;
        tooltip: string;
      };
      isVirtual: string;
      isAggregate: string;
      type: {
        label: string;
        tooltip: string;
      };
      databaseType: {
        label: string;
        tooltip: string;
      };
      length: string;
      precision: string;
      scale: string;
      fixedLength: string;
      supportsMultibyte: string;
      allowNull: string;
      autoIncrement: string;
      defaultValue: string;
      isIndex: string;
      isUnique: string;
      isPrimaryKey: string;
      isForeignKey: string;
      refTable: string;
      refField: string;
      validation: {
        label: string;
        tooltip: string;
      };
      picklist: string;
      dbFunctionTitle: string;
      dfFunctionTooltip: string;
      dbFunctionUseDescription: string;
      noDbFunctions: string;
    };
    errors: {
      name: string;
      json: string;
      csv: string;
    };
  };
  name: string;
  alias: string;
  type: string;
  virtual: string;
  aggregate: string;
  required: string;
  constraints: string;
  tableName: string;
  label: string;
  plural: string;
  description: string;
  enter: {
    tableName: string;
    alias: string;
    label: string;
    plural: string;
    description: string;
  };
  fields: string;
  addField: string;
  addRelationship: string;
  alerts: {
    tableNameError: string;
    createSuccecss: string;
    updateSuccess: string;
    deleteSuccess: string;
  };
  primaryKey: string;
  foreignKey: string;
  table: string;
  relationships: {
    heading: string;
    name: {
      tooltip: string;
    };
    alias: {
      tooltip: string;
    };
    label: {
      tooltip: string;
    };
    description: {
      tooltip: string;
    };
    fetch: string;
    type: string;
    virtualRelationship: string;
    field: {
      label: string;
      default: string;
    };
    referenceService: {
      label: string;
      default: string;
    };
    referenceTable: {
      label: string;
      default: string;
    };
    referenceField: {
      label: string;
      default: string;
    };
    junctionService: {
      label: string;
      default: string;
    };
    junctionTable: {
      label: string;
      default: string;
    };
    junctionField: {
      label: string;
      default: string;
    };
    junctionReferenceField: {
      label: string;
      default: string;
    };
    alerts: {
      createSuccecss: string;
      updateSuccess: string;
    };
  };
}

/**
 * Script management translations (Vue.js module)
 */
interface ScriptsTranslations {
  scriptName: string;
  scriptMethod: string;
  scriptType: string;
  scriptLocation: string;
  tableName: string;
  active: string;
  importScriptFile: string;
  fromDesktop: string;
  fromGitHub: string;
  selectFile: string;
  service: string;
  repository: string;
  branch: string;
  path: string;
  viewLatest: string;
  deleteCache: string;
  runtimes: {
    javascript: string;
    php: string;
    python: string;
    python3: string;
    nodejs: string;
  };
  errors: {
    githubImport: string;
  };
  createSuccessMsg: string;
  updateSuccessMsg: string;
  deleteSuccessMsg: string;
  getScriptSuccessMsg: string;
  fetchCacheSuccessMsg: string;
  deleteCacheSuccessMsg: string;
}

/**
 * System information translations
 */
interface SystemInfoTranslations {
  subheading: string;
  instance: {
    instance: string;
    licenseLevel: string;
    licenseKey: string;
    subscriptionStatus: string;
    subscriptionExpirationDate: string;
    systemDatabase: string;
    installPath: string;
    logPath: string;
    logMode: string;
    logLevel: string;
    cacheDriver: string;
    demo: string;
    instanceId: string;
  };
  packages: string;
  server: {
    heading: string;
    os: string;
    release: string;
    host: string;
    machine: string;
    serverApi: string;
  };
  client: {
    heading: string;
    userAgent: string;
    ipAddress: string;
    locale: string;
  };
}

/**
 * User management flow translations
 */
interface UserManagementTranslations {
  // Login translations
  login: {
    [key: string]: string;
  };
  // Registration translations
  registration: {
    [key: string]: string;
  };
  // Password reset translations
  passwordReset: {
    [key: string]: string;
  };
  // Profile translations
  profile: {
    [key: string]: string;
  };
  // Confirmation translations
  confirmation: {
    [key: string]: string;
  };
}

// ============================================================================
// MAIN TRANSLATION INTERFACE
// ============================================================================

/**
 * Root translation interface that encompasses all translation namespaces
 * This interface provides complete type safety for all translation keys
 * used throughout the DreamFactory Admin Interface application.
 */
export interface RootTranslations {
  // Global metadata
  $schema?: string;
  _metadata?: {
    version: string;
    locale: string;
    direction: 'ltr' | 'rtl';
    lastModified: string;
    framework: string;
    ssrOptimized: boolean;
  };

  // Core global translations
  common: CommonTranslations;
  ui: UITranslations;
  notifications: {
    inviteSent: string;
    eventModification: string;
  };
  verbs: VerbTranslations;
  confirmations: {
    confirmDelete: string;
  };
  scriptTypes: ScriptTypes;
  nav: NavigationTranslations;
}

/**
 * Module-specific translations interface
 * Each module has its own namespace to avoid key conflicts
 */
export interface ModuleTranslations {
  // Feature modules
  users: UsersTranslations;
  services: ServicesTranslations;
  admins: AdminsTranslations;
  apiDocs: ApiDocsTranslations;
  cache: CacheTranslations;
  cors: CorsTranslations;
  emailTemplates: EmailTemplatesTranslations;
  files: FilesTranslations;
  home: HomeTranslations;
  limits: LimitsTranslations;
  roles: RolesTranslations;
  scheduler: SchedulerTranslations;
  schema: SchemaTranslations;
  scripts: ScriptsTranslations;
  systemInfo: SystemInfoTranslations;
  userManagement: UserManagementTranslations;
}

// ============================================================================
// UTILITY TYPES FOR TYPE-SAFE TRANSLATION KEYS
// ============================================================================

/**
 * Utility type to extract nested keys from translation objects
 * Enables type-safe translation key access with dot notation
 */
export type TranslationKey<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? T[K] extends string
            ? K
            : `${K}.${TranslationKey<T[K]>}`
          : K
        : never;
    }[keyof T]
  : never;

/**
 * Extract all possible translation keys from root translations
 */
export type RootTranslationKey = TranslationKey<RootTranslations>;

/**
 * Extract all possible translation keys from module translations
 */
export type ModuleTranslationKey<M extends keyof ModuleTranslations> = 
  TranslationKey<ModuleTranslations[M]>;

/**
 * Union type of all available translation namespaces
 */
export type TranslationNamespace = keyof RootTranslations | keyof ModuleTranslations;

/**
 * Type for translation interpolation variables
 * Used when translations contain placeholders like {{variableName}}
 */
export interface TranslationVariables {
  [key: string]: string | number | boolean;
}

// ============================================================================
// REACT HOOK FORM INTEGRATION TYPES
// ============================================================================

/**
 * Form validation message structure for React Hook Form integration
 * Maps field names to their validation error messages
 */
export interface FormValidationMessages {
  [fieldName: string]: {
    required?: string;
    pattern?: string;
    minLength?: string;
    maxLength?: string;
    min?: string;
    max?: string;
    email?: string;
    url?: string;
    custom?: string;
  };
}

/**
 * Database connection form validation messages
 */
export interface DatabaseConnectionValidationMessages extends FormValidationMessages {
  name: {
    required: string;
    minLength: string;
    pattern: string;
  };
  host: {
    required: string;
    url: string;
  };
  port: {
    required: string;
    min: string;
    max: string;
  };
  username: {
    required: string;
  };
  password: {
    required: string;
    minLength: string;
  };
  database: {
    required: string;
  };
}

/**
 * API generation form validation messages
 */
export interface ApiGenerationValidationMessages extends FormValidationMessages {
  serviceName: {
    required: string;
    pattern: string;
    minLength: string;
  };
  namespace: {
    required: string;
    pattern: string;
  };
  description: {
    maxLength: string;
  };
}

/**
 * Schema field form validation messages
 */
export interface SchemaFieldValidationMessages extends FormValidationMessages {
  name: {
    required: string;
    pattern: string;
  };
  type: {
    required: string;
  };
  length: {
    min: string;
    max: string;
  };
  validation: {
    custom: string;
  };
}

// ============================================================================
// COMPONENT PROP VALIDATION TYPES
// ============================================================================

/**
 * Props for translation-aware components
 */
export interface TranslationAwareProps {
  /**
   * Translation key for the component's text content
   */
  translationKey?: RootTranslationKey | string;
  
  /**
   * Variables for translation interpolation
   */
  translationVariables?: TranslationVariables;
  
  /**
   * Translation namespace for module-specific translations
   */
  translationNamespace?: keyof ModuleTranslations;
  
  /**
   * Fallback text when translation key is not found
   */
  fallbackText?: string;
}

/**
 * Props for form components with validation message support
 */
export interface FormComponentTranslationProps extends TranslationAwareProps {
  /**
   * Validation messages for form fields
   */
  validationMessages?: FormValidationMessages;
  
  /**
   * Error message translation key
   */
  errorMessageKey?: string;
  
  /**
   * Success message translation key
   */
  successMessageKey?: string;
}

// ============================================================================
// HOOKS AND UTILITY FUNCTION TYPES
// ============================================================================

/**
 * Translation hook return type
 */
export interface UseTranslationReturn {
  /**
   * Function to get translated text by key
   */
  t: (key: string, variables?: TranslationVariables) => string;
  
  /**
   * Function to check if a translation key exists
   */
  exists: (key: string) => boolean;
  
  /**
   * Current locale
   */
  locale: string;
  
  /**
   * Function to change locale
   */
  setLocale: (locale: string) => void;
  
  /**
   * Available locales
   */
  availableLocales: string[];
  
  /**
   * Loading state for translations
   */
  isLoading: boolean;
  
  /**
   * Error state for translation loading
   */
  error?: Error;
}

/**
 * Translation provider configuration
 */
export interface TranslationProviderConfig {
  /**
   * Default locale
   */
  defaultLocale: string;
  
  /**
   * Available locales
   */
  supportedLocales: string[];
  
  /**
   * Base path for translation files
   */
  basePath: string;
  
  /**
   * Fallback locale when translation is missing
   */
  fallbackLocale: string;
  
  /**
   * Enable debug mode for missing translations
   */
  debug: boolean;
  
  /**
   * Cache strategy for translation files
   */
  cacheStrategy: 'memory' | 'localStorage' | 'none';
}

// ============================================================================
// EXPORTED TYPE UNIONS
// ============================================================================

/**
 * Complete translation type that combines root and module translations
 */
export type CompleteTranslations = RootTranslations & ModuleTranslations;

/**
 * All possible translation keys across the application
 */
export type AllTranslationKeys = 
  | RootTranslationKey 
  | {
      [K in keyof ModuleTranslations]: `${K}.${ModuleTranslationKey<K>}`
    }[keyof ModuleTranslations];

/**
 * Validation message types for all forms
 */
export type AllValidationMessages = 
  | DatabaseConnectionValidationMessages
  | ApiGenerationValidationMessages
  | SchemaFieldValidationMessages
  | FormValidationMessages;

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

/**
 * Default export provides the main translation interfaces
 * for easy importing in React components and hooks
 */
export default {
  RootTranslations,
  ModuleTranslations,
  CompleteTranslations,
  TranslationAwareProps,
  FormComponentTranslationProps,
  UseTranslationReturn,
  TranslationProviderConfig,
} as const;