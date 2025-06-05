/**
 * TypeScript type definitions for storage-related data structures and interfaces.
 * Provides type safety for localStorage, sessionStorage, and cookie operations
 * while maintaining compatibility with existing Angular service data structures.
 */

// =============================================================================
// Storage Key Constants
// =============================================================================

/**
 * Type-safe storage keys to prevent string literal errors and ensure consistency
 * across the storage layer. These keys match the existing Angular service implementations.
 */
export const STORAGE_KEYS = {
  // Authentication & User Session
  SESSION_TOKEN: 'session_token',
  CURRENT_USER: 'currentUser',
  
  // Theme & UI Preferences
  IS_DARK_MODE: 'isDarkMode',
  
  // UI State Management
  SHOW_PASSWORD_POPUP: 'showPasswordPopup',
  CONFIG_FIRST_TIME_USER: 'configFirstTimeUser',
  
  // Service State
  CURRENT_SERVICE_ID: 'currentServiceId',
  
  // Additional UI Preferences (for future use)
  SIDEBAR_COLLAPSED: 'sidebarCollapsed',
  TABLE_PAGE_SIZE: 'tablePageSize',
  AUTO_REFRESH_SCHEMAS: 'autoRefreshSchemas',
} as const;

/**
 * Type-safe storage key type derived from STORAGE_KEYS constant
 */
export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

// =============================================================================
// User Session Types
// =============================================================================

/**
 * User session interface matching existing Angular UserSession type.
 * Contains authentication state, user profile data, and security context.
 */
export interface UserSession {
  /** User's email address */
  email: string;
  /** User's first name */
  firstName: string;
  /** DreamFactory host URL */
  host: string;
  /** Unique user identifier */
  id: number;
  /** Whether user has root admin privileges */
  isRootAdmin: boolean;
  /** Whether user has system admin privileges */
  isSysAdmin: boolean;
  /** Timestamp of last login */
  lastLoginDate: string;
  /** User's last name */
  lastName: string;
  /** Full display name */
  name: string;
  /** Current session identifier */
  sessionId: string;
  /** JWT session token for API authentication */
  sessionToken: string;
  /** Token expiration timestamp */
  tokenExpiryDate: Date;
  /** Primary role identifier */
  roleId: number;
  /** Alternative role identifier (backward compatibility) */
  role_id?: number;
}

/**
 * Authentication state interface for managing login status
 */
export interface AuthState {
  /** Whether user is currently authenticated */
  isLoggedIn: boolean;
  /** Current user session data */
  userData: UserSession | null;
  /** Restricted access tabs for admin users */
  restrictedAccess: string[];
  /** Loading state for authentication operations */
  isLoading: boolean;
  /** Authentication error message */
  error: string | null;
}

/**
 * User profile data for extended user information storage
 */
export interface UserProfile {
  /** User ID */
  id: number;
  /** Email address */
  email: string;
  /** First name */
  firstName: string;
  /** Last name */
  lastName: string;
  /** Username */
  username: string;
  /** Phone number */
  phone: string;
  /** Default application ID */
  defaultAppId: number;
  /** Account creation date */
  createdDate: string;
  /** Last modification date */
  lastModifiedDate: string;
  /** Account active status */
  isActive: boolean;
  /** Account confirmation status */
  confirmed: boolean;
  /** Account expiration status */
  expired: boolean;
  /** Last login timestamp */
  lastLoginDate: string;
}

// =============================================================================
// Theme Preference Types
// =============================================================================

/**
 * Theme mode options supporting system preference detection
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Theme preferences interface matching existing Angular DfThemeService
 */
export interface ThemePreferences {
  /** Current theme mode */
  mode: ThemeMode;
  /** Whether dark mode is currently active */
  isDarkMode: boolean;
  /** Current table row count preference */
  currentTableRowNum: number;
  /** Whether to follow system theme preference */
  followSystemTheme: boolean;
}

/**
 * UI customization preferences for enhanced user experience
 */
export interface UIPreferences {
  /** Sidebar collapsed state */
  sidebarCollapsed: boolean;
  /** Default table page size */
  tablePageSize: number;
  /** Auto-refresh schemas setting */
  autoRefreshSchemas: boolean;
  /** Show advanced options by default */
  showAdvancedOptions: boolean;
  /** Preferred date format */
  dateFormat: string;
  /** Preferred time zone */
  timeZone: string;
}

// =============================================================================
// UI State Types
// =============================================================================

/**
 * Popup and dialog visibility state management
 */
export interface PopupState {
  /** Whether password complexity popup should be shown */
  showPasswordPopup: boolean;
  /** Generic popup visibility flags */
  [popupName: string]: boolean;
}

/**
 * First-time user onboarding state
 */
export interface OnboardingState {
  /** Whether user is accessing the system for the first time */
  isFirstTimeUser: boolean;
  /** Configuration first-time user flag */
  configFirstTimeUser: boolean;
  /** Completed onboarding steps */
  completedSteps: string[];
  /** Whether onboarding tour was skipped */
  tourSkipped: boolean;
}

/**
 * Navigation and layout state
 */
export interface NavigationState {
  /** Currently active route */
  currentRoute: string;
  /** Navigation history stack */
  history: string[];
  /** Breadcrumb navigation data */
  breadcrumbs: Array<{
    label: string;
    path: string;
    isActive: boolean;
  }>;
}

/**
 * Global UI state combining all interface state types
 */
export interface UIState {
  /** Popup visibility states */
  popups: PopupState;
  /** Onboarding and first-time user state */
  onboarding: OnboardingState;
  /** Navigation and routing state */
  navigation: NavigationState;
  /** Loading states for various operations */
  loading: {
    [operation: string]: boolean;
  };
  /** Error states for UI components */
  errors: {
    [component: string]: string | null;
  };
}

// =============================================================================
// Service State Types
// =============================================================================

/**
 * Database service types supported by DreamFactory
 */
export type DatabaseServiceType = 
  | 'mysql'
  | 'postgresql' 
  | 'sqlserver'
  | 'oracle'
  | 'mongodb'
  | 'snowflake'
  | 'sqlite'
  | 'cassandra';

/**
 * Service connection status
 */
export type ServiceStatus = 'active' | 'inactive' | 'testing' | 'error';

/**
 * Current service state management interface
 */
export interface ServiceState {
  /** Currently selected service ID (-1 if none selected) */
  currentServiceId: number;
  /** Service type of current selection */
  currentServiceType: DatabaseServiceType | null;
  /** Service name for display purposes */
  currentServiceName: string | null;
  /** Connection status of current service */
  currentServiceStatus: ServiceStatus;
  /** Recently accessed service IDs */
  recentServiceIds: number[];
  /** Service navigation context */
  navigationContext: {
    /** Current schema being viewed */
    currentSchema: string | null;
    /** Current table being viewed */
    currentTable: string | null;
    /** Current view mode */
    viewMode: 'list' | 'tree' | 'grid';
  };
}

// =============================================================================
// Storage Configuration Types
// =============================================================================

/**
 * Storage operation options for controlling behavior
 */
export interface StorageOptions {
  /** Whether to serialize objects to JSON */
  serialize: boolean;
  /** Whether to compress stored data */
  compress: boolean;
  /** Expiration time in milliseconds */
  ttl: number | null;
  /** Whether to sync across browser tabs */
  syncTabs: boolean;
  /** Whether to encrypt sensitive data */
  encrypt: boolean;
}

/**
 * Cookie configuration options
 */
export interface CookieOptions {
  /** Cookie expiration in days */
  expires: number;
  /** Cookie path */
  path: string;
  /** Cookie domain */
  domain: string;
  /** Secure flag (HTTPS only) */
  secure: boolean;
  /** SameSite policy */
  sameSite: 'strict' | 'lax' | 'none';
  /** HttpOnly flag */
  httpOnly: boolean;
}

/**
 * Storage event data for cross-tab synchronization
 */
export interface StorageEvent {
  /** Storage key that changed */
  key: string;
  /** New value */
  newValue: any;
  /** Previous value */
  oldValue: any;
  /** Timestamp of change */
  timestamp: number;
  /** Source tab identifier */
  source: string;
}

// =============================================================================
// Generic Storage Types
// =============================================================================

/**
 * Generic type for storage operations with type safety
 */
export type StorageValue<T = any> = T extends string
  ? string
  : T extends number
  ? number
  : T extends boolean
  ? boolean
  : T extends object
  ? T
  : any;

/**
 * Storage result type for error handling
 */
export type StorageResult<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
};

/**
 * Storage hook state for React integration
 */
export interface StorageHookState<T> {
  /** Current stored value */
  value: T;
  /** Whether value is being loaded */
  loading: boolean;
  /** Error message if operation failed */
  error: string | null;
  /** Function to update stored value */
  setValue: (newValue: T) => void;
  /** Function to remove stored value */
  removeValue: () => void;
  /** Function to refresh from storage */
  refresh: () => void;
}

// =============================================================================
// Migration Helper Types
// =============================================================================

/**
 * Type mapping for Angular to React storage migration
 */
export interface StorageMigrationMap {
  /** Angular BehaviorSubject keys to React hook mappings */
  behaviorSubjects: {
    [angularKey: string]: {
      reactKey: StorageKey;
      defaultValue: any;
      transform?: (value: any) => any;
    };
  };
  /** localStorage key migrations */
  localStorageKeys: {
    [oldKey: string]: StorageKey;
  };
  /** Cookie key migrations */
  cookieKeys: {
    [oldKey: string]: StorageKey;
  };
}

// =============================================================================
// Application State Types
// =============================================================================

/**
 * Complete application state interface combining all storage types
 */
export interface ApplicationState {
  /** Authentication and user session state */
  auth: AuthState;
  /** Theme and UI preferences */
  theme: ThemePreferences;
  /** UI interaction state */
  ui: UIState;
  /** Service selection and navigation state */
  service: ServiceState;
  /** User customization preferences */
  preferences: UIPreferences;
}

/**
 * Persistence configuration for different state slices
 */
export interface PersistenceConfig {
  /** Which state slices to persist */
  persist: (keyof ApplicationState)[];
  /** Storage type for each slice */
  storage: {
    [K in keyof ApplicationState]?: 'localStorage' | 'sessionStorage' | 'cookie';
  };
  /** Custom serialization for specific slices */
  serializers: {
    [K in keyof ApplicationState]?: {
      serialize: (value: ApplicationState[K]) => string;
      deserialize: (value: string) => ApplicationState[K];
    };
  };
}

// =============================================================================
// Type Guards and Utilities
// =============================================================================

/**
 * Type guard to check if a value is a valid UserSession
 */
export const isUserSession = (value: any): value is UserSession => {
  return (
    value &&
    typeof value === 'object' &&
    typeof value.email === 'string' &&
    typeof value.sessionToken === 'string' &&
    typeof value.id === 'number'
  );
};

/**
 * Type guard to check if a value is a valid StorageKey
 */
export const isStorageKey = (value: any): value is StorageKey => {
  return Object.values(STORAGE_KEYS).includes(value);
};

/**
 * Type guard to check if a value is a valid ThemeMode
 */
export const isThemeMode = (value: any): value is ThemeMode => {
  return ['light', 'dark', 'system'].includes(value);
};

/**
 * Type guard to check if a value is a valid DatabaseServiceType
 */
export const isDatabaseServiceType = (value: any): value is DatabaseServiceType => {
  return [
    'mysql',
    'postgresql',
    'sqlserver', 
    'oracle',
    'mongodb',
    'snowflake',
    'sqlite',
    'cassandra'
  ].includes(value);
};

// =============================================================================
// Export All Types
// =============================================================================

export type {
  StorageKey,
  UserSession,
  AuthState,
  UserProfile,
  ThemeMode,
  ThemePreferences,
  UIPreferences,
  PopupState,
  OnboardingState,
  NavigationState,
  UIState,
  DatabaseServiceType,
  ServiceStatus,
  ServiceState,
  StorageOptions,
  CookieOptions,
  StorageEvent,
  StorageValue,
  StorageResult,
  StorageHookState,
  StorageMigrationMap,
  ApplicationState,
  PersistenceConfig,
};