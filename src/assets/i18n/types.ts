/**
 * TypeScript type definitions for all translation keys and namespaces used throughout the application.
 * This file provides compile-time type checking for translation keys, ensuring that all references
 * to translation strings are valid and preventing runtime errors from missing translations.
 * 
 * Designed for React/Next.js integration with React Hook Form and component prop validation.
 */

// =============================================================================
// BASE TRANSLATION INTERFACES
// =============================================================================

/**
 * Base interface for all translation objects with nested key support
 */
export interface BaseTranslation {
  [key: string]: string | BaseTranslation;
}

/**
 * Common CRUD operation messages used across multiple features
 */
export interface CrudMessages {
  create: {
    success: string;
    error: string;
    pending: string;
  };
  update: {
    success: string;
    error: string;
    pending: string;
  };
  delete: {
    success: string;
    error: string;
    pending: string;
    confirm: string;
  };
  fetch: {
    error: string;
    pending: string;
    empty: string;
  };
}

/**
 * Form validation messages for React Hook Form integration
 */
export interface FormValidation {
  required: string;
  email: string;
  minLength: string;
  maxLength: string;
  pattern: string;
  numeric: string;
  url: string;
  custom: string;
}

/**
 * Common UI labels and actions
 */
export interface CommonLabels {
  actions: {
    save: string;
    cancel: string;
    edit: string;
    delete: string;
    create: string;
    update: string;
    view: string;
    close: string;
    refresh: string;
    search: string;
    filter: string;
    export: string;
    import: string;
    reset: string;
    submit: string;
    back: string;
    next: string;
    previous: string;
    confirm: string;
  };
  status: {
    active: string;
    inactive: string;
    pending: string;
    loading: string;
    success: string;
    error: string;
    warning: string;
  };
  pagination: {
    first: string;
    last: string;
    next: string;
    previous: string;
    page: string;
    of: string;
    showing: string;
    results: string;
  };
}

// =============================================================================
// FEATURE-SPECIFIC TRANSLATION INTERFACES
// =============================================================================

/**
 * Users management translations
 */
export interface UsersTranslations extends BaseTranslation {
  title: string;
  subtitle: string;
  labels: {
    name: string;
    email: string;
    firstName: string;
    lastName: string;
    displayName: string;
    phone: string;
    status: string;
    role: string;
    lastLogin: string;
    dateCreated: string;
    defaultApp: string;
    security: string;
    profile: string;
  };
  placeholders: {
    searchUsers: string;
    enterName: string;
    enterEmail: string;
    selectRole: string;
    selectApp: string;
  };
  messages: CrudMessages;
  validation: FormValidation;
  dialogs: {
    delete: {
      title: string;
      message: string;
      confirm: string;
      cancel: string;
    };
    deactivate: {
      title: string;
      message: string;
    };
  };
}

/**
 * User management (authentication) translations
 */
export interface UserManagementTranslations extends BaseTranslation {
  login: {
    title: string;
    subtitle: string;
    fields: {
      email: string;
      password: string;
      rememberMe: string;
    };
    actions: {
      signIn: string;
      forgotPassword: string;
      createAccount: string;
    };
    messages: {
      invalidCredentials: string;
      accountLocked: string;
      sessionExpired: string;
    };
  };
  register: {
    title: string;
    subtitle: string;
    fields: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
      confirmPassword: string;
    };
    messages: {
      passwordMismatch: string;
      emailExists: string;
      registrationSuccess: string;
    };
  };
  forgotPassword: {
    title: string;
    subtitle: string;
    fields: {
      email: string;
    };
    messages: {
      emailSent: string;
      emailNotFound: string;
    };
  };
  resetPassword: {
    title: string;
    subtitle: string;
    fields: {
      newPassword: string;
      confirmPassword: string;
    };
    messages: {
      resetSuccess: string;
      tokenExpired: string;
    };
  };
  validation: FormValidation;
}

/**
 * System information translations
 */
export interface SystemInfoTranslations extends BaseTranslation {
  title: string;
  subtitle: string;
  sections: {
    general: {
      title: string;
      version: string;
      buildDate: string;
      environment: string;
      timezone: string;
      locale: string;
    };
    database: {
      title: string;
      driver: string;
      version: string;
      host: string;
      status: string;
    };
    server: {
      title: string;
      phpVersion: string;
      webServer: string;
      memoryLimit: string;
      diskSpace: string;
    };
    license: {
      title: string;
      type: string;
      expiresAt: string;
      features: string;
      status: string;
    };
  };
  actions: {
    refresh: string;
    downloadLogs: string;
    checkUpdates: string;
  };
}

/**
 * Services management translations
 */
export interface ServicesTranslations extends BaseTranslation {
  title: string;
  subtitle: string;
  types: {
    database: string;
    email: string;
    file: string;
    script: string;
    remote: string;
    oauth: string;
    notification: string;
  };
  database: {
    title: string;
    labels: {
      name: string;
      type: string;
      label: string;
      description: string;
      host: string;
      port: string;
      database: string;
      username: string;
      password: string;
      dsn: string;
      options: string;
      charset: string;
      collation: string;
      timezone: string;
      connection: string;
      pooling: string;
    };
    placeholders: {
      serviceName: string;
      serviceDescription: string;
      hostAddress: string;
      portNumber: string;
      databaseName: string;
      dsnString: string;
    };
    validation: FormValidation & {
      connectionTest: string;
      hostRequired: string;
      portInvalid: string;
      databaseRequired: string;
    };
    connection: {
      testing: string;
      success: string;
      failed: string;
      timeout: string;
    };
    actions: {
      testConnection: string;
      generateSchema: string;
      refreshSchema: string;
      manageAccess: string;
    };
  };
  messages: CrudMessages;
  dialogs: {
    delete: {
      title: string;
      message: string;
      warning: string;
    };
  };
}

/**
 * Scripts management translations
 */
export interface ScriptsTranslations extends BaseTranslation {
  title: string;
  subtitle: string;
  types: {
    php: string;
    javascript: string;
    python: string;
    nodejs: string;
  };
  labels: {
    name: string;
    type: string;
    language: string;
    description: string;
    content: string;
    active: string;
    storage: string;
    github: string;
    local: string;
  };
  editor: {
    loading: string;
    saving: string;
    saved: string;
    error: string;
    syntax: string;
    fullscreen: string;
    exitFullscreen: string;
  };
  github: {
    repository: string;
    branch: string;
    path: string;
    token: string;
    sync: string;
    lastSync: string;
  };
  validation: FormValidation;
  messages: CrudMessages;
}

/**
 * Schema management translations
 */
export interface SchemaTranslations extends BaseTranslation {
  title: string;
  subtitle: string;
  navigation: {
    tables: string;
    fields: string;
    relationships: string;
    schemas: string;
  };
  tables: {
    title: string;
    labels: {
      name: string;
      label: string;
      plural: string;
      description: string;
      primaryKey: string;
      alias: string;
      fieldCount: string;
      relationshipCount: string;
      access: string;
    };
    actions: {
      viewSchema: string;
      manageFields: string;
      manageRelationships: string;
      generateAPI: string;
      exportSchema: string;
    };
    filters: {
      all: string;
      withData: string;
      empty: string;
      system: string;
      custom: string;
    };
  };
  fields: {
    title: string;
    labels: {
      name: string;
      type: string;
      length: string;
      precision: string;
      scale: string;
      nullable: string;
      default: string;
      autoIncrement: string;
      unique: string;
      indexed: string;
      comment: string;
      validation: string;
    };
    types: {
      string: string;
      integer: string;
      float: string;
      decimal: string;
      boolean: string;
      date: string;
      datetime: string;
      timestamp: string;
      text: string;
      json: string;
      binary: string;
    };
    validation: FormValidation & {
      fieldName: string;
      fieldType: string;
      lengthRequired: string;
      precisionRequired: string;
    };
  };
  relationships: {
    title: string;
    labels: {
      name: string;
      type: string;
      localTable: string;
      localField: string;
      foreignTable: string;
      foreignField: string;
      junction: string;
      onUpdate: string;
      onDelete: string;
    };
    types: {
      belongsTo: string;
      hasOne: string;
      hasMany: string;
      manyToMany: string;
    };
    actions: {
      cascade: string;
      restrict: string;
      setNull: string;
      noAction: string;
    };
  };
  discovery: {
    scanning: string;
    complete: string;
    error: string;
    progress: string;
    foundTables: string;
    foundFields: string;
    foundRelationships: string;
  };
  messages: CrudMessages;
}

/**
 * Scheduler translations
 */
export interface SchedulerTranslations extends BaseTranslation {
  title: string;
  subtitle: string;
  labels: {
    name: string;
    description: string;
    schedule: string;
    timezone: string;
    active: string;
    lastRun: string;
    nextRun: string;
    service: string;
    endpoint: string;
    method: string;
    payload: string;
    headers: string;
  };
  schedule: {
    hourly: string;
    daily: string;
    weekly: string;
    monthly: string;
    yearly: string;
    custom: string;
    cron: string;
  };
  status: {
    running: string;
    completed: string;
    failed: string;
    disabled: string;
    pending: string;
  };
  actions: {
    runNow: string;
    enable: string;
    disable: string;
    viewHistory: string;
    editSchedule: string;
  };
  validation: FormValidation & {
    cronExpression: string;
    serviceRequired: string;
    endpointRequired: string;
  };
  messages: CrudMessages;
}

/**
 * Roles management translations
 */
export interface RolesTranslations extends BaseTranslation {
  title: string;
  subtitle: string;
  labels: {
    name: string;
    description: string;
    active: string;
    defaultApp: string;
    serviceAccess: string;
    permissions: string;
    users: string;
    dateCreated: string;
    lastModified: string;
  };
  permissions: {
    title: string;
    create: string;
    read: string;
    update: string;
    delete: string;
    admin: string;
    service: string;
    component: string;
    verb: string;
    access: string;
    condition: string;
  };
  access: {
    allow: string;
    deny: string;
    inherit: string;
  };
  validation: FormValidation;
  messages: CrudMessages;
  dialogs: {
    delete: {
      title: string;
      message: string;
      warning: string;
    };
  };
}

/**
 * Limits management translations
 */
export interface LimitsTranslations extends BaseTranslation {
  title: string;
  subtitle: string;
  labels: {
    name: string;
    description: string;
    type: string;
    period: string;
    limit: string;
    active: string;
    service: string;
    endpoint: string;
    verb: string;
    user: string;
    role: string;
    key: string;
  };
  types: {
    instance: string;
    user: string;
    role: string;
    service: string;
    endpoint: string;
  };
  periods: {
    minute: string;
    hour: string;
    day: string;
    week: string;
    month: string;
    year: string;
  };
  validation: FormValidation & {
    limitValue: string;
    periodRequired: string;
    typeRequired: string;
  };
  messages: CrudMessages;
}

/**
 * Home/Dashboard translations
 */
export interface HomeTranslations extends BaseTranslation {
  title: string;
  subtitle: string;
  welcome: string;
  quickstart: {
    title: string;
    subtitle: string;
    steps: {
      database: string;
      schema: string;
      api: string;
      test: string;
    };
  };
  statistics: {
    services: string;
    tables: string;
    users: string;
    requests: string;
  };
  resources: {
    title: string;
    documentation: string;
    tutorials: string;
    community: string;
    support: string;
  };
  download: {
    title: string;
    mobile: string;
    desktop: string;
    cli: string;
  };
}

/**
 * Files management translations
 */
export interface FilesTranslations extends BaseTranslation {
  title: string;
  subtitle: string;
  labels: {
    name: string;
    size: string;
    type: string;
    modified: string;
    path: string;
    permissions: string;
  };
  actions: {
    upload: string;
    download: string;
    delete: string;
    rename: string;
    createFolder: string;
    viewDetails: string;
  };
  upload: {
    dropzone: string;
    selectFiles: string;
    uploading: string;
    success: string;
    error: string;
    maxSize: string;
    allowedTypes: string;
  };
  logs: {
    title: string;
    level: string;
    timestamp: string;
    message: string;
    context: string;
    download: string;
    clear: string;
  };
  validation: FormValidation;
  messages: CrudMessages;
}

/**
 * Email templates translations
 */
export interface EmailTemplatesTranslations extends BaseTranslation {
  title: string;
  subtitle: string;
  labels: {
    name: string;
    subject: string;
    to: string;
    cc: string;
    bcc: string;
    from: string;
    replyTo: string;
    contentType: string;
    bodyText: string;
    bodyHtml: string;
    defaults: string;
  };
  types: {
    plain: string;
    html: string;
    both: string;
  };
  defaults: {
    userInvite: string;
    passwordReset: string;
    registration: string;
    notification: string;
  };
  editor: {
    preview: string;
    variables: string;
    insertVariable: string;
    testSend: string;
  };
  validation: FormValidation & {
    emailFormat: string;
    subjectRequired: string;
    bodyRequired: string;
  };
  messages: CrudMessages;
}

/**
 * CORS configuration translations
 */
export interface CorsTranslations extends BaseTranslation {
  title: string;
  subtitle: string;
  labels: {
    enabled: string;
    origins: string;
    headers: string;
    methods: string;
    credentials: string;
    maxAge: string;
    exposedHeaders: string;
  };
  placeholders: {
    origins: string;
    headers: string;
    methods: string;
  };
  methods: {
    get: string;
    post: string;
    put: string;
    patch: string;
    delete: string;
    options: string;
    head: string;
  };
  validation: FormValidation & {
    originsFormat: string;
    headersFormat: string;
    maxAgeNumeric: string;
  };
  messages: {
    updateSuccess: string;
    updateError: string;
  };
}

/**
 * Cache configuration translations
 */
export interface CacheTranslations extends BaseTranslation {
  title: string;
  subtitle: string;
  labels: {
    enabled: string;
    driver: string;
    prefix: string;
    ttl: string;
    tags: string;
    compression: string;
    serialization: string;
  };
  drivers: {
    file: string;
    database: string;
    redis: string;
    memcached: string;
    array: string;
  };
  actions: {
    clear: string;
    flush: string;
    stats: string;
    test: string;
  };
  stats: {
    hits: string;
    misses: string;
    ratio: string;
    size: string;
    keys: string;
  };
  validation: FormValidation;
  messages: {
    cleared: string;
    flushed: string;
    testSuccess: string;
    testError: string;
  };
}

/**
 * Apps management translations
 */
export interface AppsTranslations extends BaseTranslation {
  title: string;
  subtitle: string;
  labels: {
    name: string;
    description: string;
    url: string;
    active: string;
    storage: string;
    path: string;
    type: string;
    defaultRole: string;
    apiKey: string;
    users: string;
  };
  types: {
    none: string;
    file: string;
    url: string;
    repo: string;
  };
  storage: {
    local: string;
    github: string;
    gitlab: string;
    bitbucket: string;
  };
  actions: {
    launch: string;
    preview: string;
    download: string;
    regenerateKey: string;
  };
  validation: FormValidation & {
    urlFormat: string;
    pathRequired: string;
    storageRequired: string;
  };
  messages: CrudMessages;
}

/**
 * API documentation translations
 */
export interface ApiDocsTranslations extends BaseTranslation {
  title: string;
  subtitle: string;
  sections: {
    overview: string;
    authentication: string;
    services: string;
    endpoints: string;
    models: string;
    examples: string;
  };
  labels: {
    service: string;
    resource: string;
    method: string;
    endpoint: string;
    parameters: string;
    response: string;
    example: string;
    schema: string;
  };
  methods: {
    get: string;
    post: string;
    put: string;
    patch: string;
    delete: string;
  };
  parameters: {
    query: string;
    path: string;
    header: string;
    body: string;
  };
  responses: {
    success: string;
    error: string;
    format: string;
  };
  actions: {
    tryIt: string;
    copyUrl: string;
    download: string;
    export: string;
  };
}

/**
 * Admins management translations
 */
export interface AdminsTranslations extends BaseTranslation {
  title: string;
  subtitle: string;
  labels: {
    name: string;
    email: string;
    firstName: string;
    lastName: string;
    displayName: string;
    phone: string;
    active: string;
    lastLogin: string;
    dateCreated: string;
    permissions: string;
    role: string;
  };
  permissions: {
    full: string;
    limited: string;
    readonly: string;
    custom: string;
  };
  validation: FormValidation;
  messages: CrudMessages;
  dialogs: {
    delete: {
      title: string;
      message: string;
      warning: string;
    };
  };
}

// =============================================================================
// UNIFIED TRANSLATION INTERFACE
// =============================================================================

/**
 * Complete translation interface combining all feature namespaces
 */
export interface Translations extends BaseTranslation {
  // Global common translations
  common: CommonLabels;
  
  // Feature-specific translations
  users: UsersTranslations;
  userManagement: UserManagementTranslations;
  systemInfo: SystemInfoTranslations;
  services: ServicesTranslations;
  scripts: ScriptsTranslations;
  schema: SchemaTranslations;
  scheduler: SchedulerTranslations;
  roles: RolesTranslations;
  limits: LimitsTranslations;
  home: HomeTranslations;
  files: FilesTranslations;
  emailTemplates: EmailTemplatesTranslations;
  cors: CorsTranslations;
  cache: CacheTranslations;
  apps: AppsTranslations;
  apiDocs: ApiDocsTranslations;
  admins: AdminsTranslations;
}

// =============================================================================
// UTILITY TYPES FOR TYPE-SAFE TRANSLATION KEY ACCESS
// =============================================================================

/**
 * Extract all possible translation keys from a nested object type
 */
export type TranslationKeys<T> = T extends string
  ? never
  : T extends Record<string, any>
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends string
          ? K
          : T[K] extends Record<string, any>
          ? `${K}.${TranslationKeys<T[K]>}`
          : never
        : never;
    }[keyof T]
  : never;

/**
 * Get all possible translation keys for a specific namespace
 */
export type NamespaceKeys<T extends keyof Translations> = TranslationKeys<Translations[T]>;

/**
 * Get all possible translation namespaces
 */
export type TranslationNamespace = keyof Translations;

/**
 * Type for translation function parameter
 */
export type TranslationKey = 
  | TranslationKeys<Translations>
  | `${TranslationNamespace}.${string}`;

/**
 * Type for translation function with interpolation support
 */
export interface TranslationFunction {
  (key: TranslationKey, values?: Record<string, string | number>): string;
  <T extends TranslationNamespace>(namespace: T, key: NamespaceKeys<T>, values?: Record<string, string | number>): string;
}

// =============================================================================
// REACT HOOK FORM INTEGRATION TYPES
// =============================================================================

/**
 * Form validation message keys for React Hook Form integration
 */
export type ValidationMessageKey = 
  | 'required'
  | 'email'
  | 'minLength'
  | 'maxLength'
  | 'pattern'
  | 'numeric'
  | 'url'
  | 'custom';

/**
 * Type for form field validation with i18n support
 */
export interface FieldValidation {
  required?: boolean | string;
  minLength?: { value: number; message: string };
  maxLength?: { value: number; message: string };
  pattern?: { value: RegExp; message: string };
  validate?: Record<string, (value: any) => boolean | string>;
}

/**
 * Props for components that need translation support
 */
export interface TranslationProps {
  t: TranslationFunction;
  namespace?: TranslationNamespace;
}

/**
 * Hook return type for translation functionality
 */
export interface UseTranslationReturn {
  t: TranslationFunction;
  ready: boolean;
  i18n: {
    language: string;
    changeLanguage: (lng: string) => Promise<void>;
  };
}

// =============================================================================
// COMPONENT INTEGRATION TYPES
// =============================================================================

/**
 * Props for components that display localized content
 */
export interface LocalizedComponentProps {
  /**
   * Translation key or pre-translated text
   */
  text?: TranslationKey | string;
  
  /**
   * Translation namespace for scoped keys
   */
  namespace?: TranslationNamespace;
  
  /**
   * Values for string interpolation
   */
  values?: Record<string, string | number>;
  
  /**
   * Fallback text if translation is missing
   */
  fallback?: string;
}

/**
 * Props for form components with validation messages
 */
export interface ValidatedFormComponentProps extends LocalizedComponentProps {
  /**
   * Validation message translation keys
   */
  validationMessages?: Partial<Record<ValidationMessageKey, TranslationKey>>;
  
  /**
   * Custom validation message namespace
   */
  validationNamespace?: TranslationNamespace;
}

// =============================================================================
// SERVER-SIDE RENDERING SUPPORT
// =============================================================================

/**
 * Static translation data for SSR
 */
export interface StaticTranslations {
  [locale: string]: Translations;
}

/**
 * Translation loading configuration
 */
export interface TranslationConfig {
  defaultLocale: string;
  locales: string[];
  fallbackLocale: string;
  load: 'currentOnly' | 'all' | 'currentAndFallback';
  interpolation: {
    escapeValue: boolean;
    formatSeparator: string;
  };
}

/**
 * Next.js page props with translations
 */
export interface PagePropsWithTranslations {
  translations: Translations;
  locale: string;
  fallbackTranslations?: Partial<Translations>;
}

// =============================================================================
// TYPE GUARDS AND UTILITIES
// =============================================================================

/**
 * Type guard to check if a string is a valid translation key
 */
export function isValidTranslationKey(key: string): key is TranslationKey {
  return typeof key === 'string' && key.length > 0;
}

/**
 * Type guard to check if a string is a valid namespace
 */
export function isValidNamespace(namespace: string): namespace is TranslationNamespace {
  const validNamespaces: TranslationNamespace[] = [
    'common', 'users', 'userManagement', 'systemInfo', 'services', 'scripts',
    'schema', 'scheduler', 'roles', 'limits', 'home', 'files', 'emailTemplates',
    'cors', 'cache', 'apps', 'apiDocs', 'admins'
  ];
  return validNamespaces.includes(namespace as TranslationNamespace);
}

/**
 * Utility type to ensure proper translation object structure
 */
export type EnsureTranslationStructure<T> = T extends Translations ? T : never;

/**
 * Default export for easier importing
 */
export default Translations;