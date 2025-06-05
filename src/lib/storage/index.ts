/**
 * Storage Management Index
 * 
 * Centralized export hub for all storage utilities and React hooks that replace Angular services
 * throughout the DreamFactory Admin Interface migration. Provides type-safe storage management,
 * SSR-compatible React hooks, and reactive state management patterns.
 * 
 * This module serves as the main interface for all storage-related operations, replacing
 * Angular's BehaviorSubject patterns with modern React hooks and providing seamless
 * integration with Next.js server-side rendering capabilities.
 * 
 * @fileoverview Main export file for storage utilities migrated from Angular services
 * @version 1.0.0
 * @since 2024-01-01
 * 
 * Migration Notes:
 * - Replaces Angular localStorage/sessionStorage service patterns
 * - Provides SSR-safe storage operations for Next.js compatibility
 * - Implements React hooks for reactive state management
 * - Maintains API compatibility with existing Angular service interfaces
 */

// =============================================================================
// Type Definitions and Constants
// =============================================================================

// Re-export all type definitions for external consumption
export type {
  // Core storage types
  StorageKey,
  StorageOptions,
  CookieOptions,
  StorageEvent,
  StorageValue,
  StorageResult,
  StorageHookState,
  StorageMigrationMap,
  ApplicationState,
  PersistenceConfig,
  
  // User session types
  UserSession,
  AuthState,
  UserProfile,
  
  // Theme preference types
  ThemeMode,
  ThemePreferences,
  UIPreferences,
  
  // UI state types
  PopupState,
  OnboardingState,
  NavigationState,
  UIState,
  
  // Service state types
  DatabaseServiceType,
  ServiceStatus,
  ServiceState,
} from './types';

// Export storage key constants
export {
  STORAGE_KEYS,
  isUserSession,
  isStorageKey,
  isThemeMode,
  isDatabaseServiceType,
} from './types';

// =============================================================================
// Core Storage Utilities
// =============================================================================

// Browser environment detection
export { isBrowser } from './storage-utils';

// Core storage classes with error handling and JSON serialization
export {
  LocalStorage,
  SessionStorage,
  CookieStorage,
  Storage,
  storageHelpers,
  STORAGE_KEYS as CORE_STORAGE_KEYS,
} from './storage-utils';

// Re-export storage operation types from storage-utils
export type {
  StorageOptions as CoreStorageOptions,
  CookieOptions as CoreCookieOptions,
  StorageResult as CoreStorageResult,
  StorageKey as CoreStorageKey,
} from './storage-utils';

// =============================================================================
// SSR-Safe React Hooks
// =============================================================================

// SSR-compatible storage hooks for Next.js integration
export {
  useLocalStorage,
  useSessionStorage,
  useCookies,
  useCookieState,
  useIsHydrated,
  storageUtils,
} from './ssr-storage';

// Re-export SSR storage hook types
export type {
  StorageHookOptions,
  CookieOptions as SSRCookieOptions,
} from './ssr-storage';

// =============================================================================
// User Session Management
// =============================================================================

// User session and authentication state management
export {
  // Session storage constants
  SESSION_STORAGE_KEYS,
  
  // Core hooks for session management
  useSessionToken,
  useUserStorage,
  useUserSession,
  useAuthState,
  
  // Utility functions for external usage
  sessionUtils,
  
  // Default export object
  default as userSessionExports,
} from './user-session';

// Re-export user session types
export type {
  UserSession as UserSessionType,
  UserProfile as UserProfileType,
  RoleType,
} from './user-session';

// =============================================================================
// Theme and UI Preferences
// =============================================================================

// Theme preference management with localStorage persistence
export {
  // Storage keys and defaults
  THEME_STORAGE_KEYS,
  THEME_DEFAULTS,
  
  // Core theme hooks
  useDarkMode,
  useTableRowCount,
  useThemePreferences,
  
  // Theme effect utilities
  useThemeEffect,
  
  // Utility functions
  getThemePreferences,
  initializeThemePreferences,
  isValidThemePreferences,
} from './theme-preferences';

// Re-export theme preference types
export type {
  ThemePreferences as ThemePreferencesType,
  ThemeContextValue,
} from './theme-preferences';

// =============================================================================
// UI State Management
// =============================================================================

// UI state management replacing Angular PopupService and DFStorageService
export {
  // Storage keys and defaults
  UI_STORAGE_KEYS,
  DEFAULT_UI_CONFIG,
  DEFAULT_POPUP_STATE,
  
  // UI state hooks
  usePasswordPopupState,
  useFirstTimeUserState,
  useDialogVisibilityState,
  useUIState,
  useOnboardingState,
  useUIStateSynchronization,
  
  // Utility functions
  isUIFeatureEnabled,
  getCurrentUIState,
} from './ui-state';

// Re-export UI state types
export type {
  UIStateConfig,
  PopupVisibilityState,
} from './ui-state';

// =============================================================================
// Service State Management
// =============================================================================

// Service selection and navigation state management
export {
  // Core service state hooks
  useCurrentServiceId,
  useServiceNavigationState,
  useServiceState,
  
  // Storage utilities
  serviceIdStorage,
  serviceNavigationStorage,
  serviceStatePersistence,
  
  // Constants
  STORAGE_KEYS as SERVICE_STORAGE_KEYS,
  
  // Default export
  default as serviceStateExports,
} from './service-state';

// Re-export service state types
export type {
  ServiceNavigationState,
  ServiceState as ServiceStateType,
} from './service-state';

// =============================================================================
// Unified Storage Interface
// =============================================================================

/**
 * Unified storage management interface providing centralized access to all storage operations.
 * This class consolidates Angular service patterns into a single, React-compatible interface.
 * 
 * Features:
 * - Type-safe storage operations with automatic JSON serialization
 * - SSR-compatible with Next.js server-side rendering
 * - Cross-tab synchronization for session and preference management
 * - Unified error handling and logging
 * - Migration compatibility with existing Angular service APIs
 */
export class UnifiedStorageManager {
  /**
   * Initialize storage manager with optional configuration
   * @param config - Storage configuration options
   */
  constructor(private config?: {
    enableLogging?: boolean;
    enableCrossTabs?: boolean;
    defaultTTL?: number;
  }) {}

  /**
   * Get all current storage states for debugging and development
   * @returns Complete storage state snapshot
   */
  getStorageSnapshot() {
    return {
      sessionToken: sessionUtils.getToken(),
      userSession: sessionUtils.getUserSession(),
      restrictedAccess: sessionUtils.getRestrictedAccess(),
      themePreferences: getThemePreferences(),
      uiState: getCurrentUIState(),
      currentServiceId: serviceIdStorage.getCurrentServiceId(),
      storageInfo: Storage.getStorageInfo(),
    };
  }

  /**
   * Clear all application storage data (logout scenario)
   * @param preserveTheme - Whether to preserve theme preferences
   */
  clearAllStorage(preserveTheme: boolean = false) {
    // Clear session data
    sessionUtils.clearAllSessionData();
    
    // Clear service state
    serviceStatePersistence.clearCurrentServiceId();
    serviceStatePersistence.clearAllNavigationStates();
    
    // Clear UI state
    if (!preserveTheme) {
      LocalStorage.removeItem(UI_STORAGE_KEYS.UI_PREFERENCES);
      LocalStorage.removeItem(THEME_STORAGE_KEYS.DARK_MODE);
      LocalStorage.removeItem(THEME_STORAGE_KEYS.TABLE_ROW_COUNT);
      LocalStorage.removeItem(THEME_STORAGE_KEYS.SYSTEM_THEME_PREFERENCE);
    }
    
    // Clear popup and dialog states
    LocalStorage.removeItem(UI_STORAGE_KEYS.SHOW_PASSWORD_POPUP);
    LocalStorage.removeItem(UI_STORAGE_KEYS.CONFIG_FIRST_TIME_USER);
    LocalStorage.removeItem(UI_STORAGE_KEYS.DIALOG_VISIBILITY);
    LocalStorage.removeItem(UI_STORAGE_KEYS.ONBOARDING_STATE);
    
    // Clear browser caches
    Storage.clearAll(['session_token', 'df_session_token']);
  }

  /**
   * Migrate storage data from Angular service format to React format
   * @param migrationMap - Mapping configuration for data migration
   */
  migrateFromAngularServices(migrationMap?: StorageMigrationMap) {
    if (!isBrowser) return;
    
    // Default migration mappings for common Angular service keys
    const defaultMigrationMap: StorageMigrationMap = {
      behaviorSubjects: {
        'isDarkMode': {
          reactKey: STORAGE_KEYS.IS_DARK_MODE,
          defaultValue: false,
        },
        'currentServiceId': {
          reactKey: STORAGE_KEYS.CURRENT_SERVICE_ID,
          defaultValue: -1,
          transform: (value) => parseInt(value, 10) || -1,
        },
        'showPasswordPopup': {
          reactKey: STORAGE_KEYS.SHOW_PASSWORD_POPUP,
          defaultValue: false,
        },
      },
      localStorageKeys: {
        'currentUser': STORAGE_KEYS.CURRENT_USER,
        'configFirstTimeUser': STORAGE_KEYS.CONFIG_FIRST_TIME_USER,
      },
      cookieKeys: {
        'session_token': STORAGE_KEYS.SESSION_TOKEN,
      },
    };
    
    const actualMigrationMap = migrationMap || defaultMigrationMap;
    
    // Migrate BehaviorSubject values
    Object.entries(actualMigrationMap.behaviorSubjects).forEach(([oldKey, mapping]) => {
      const oldValue = LocalStorage.getItem(oldKey, { defaultValue: mapping.defaultValue });
      if (oldValue.success && oldValue.data !== undefined) {
        const newValue = mapping.transform ? mapping.transform(oldValue.data) : oldValue.data;
        LocalStorage.setItem(mapping.reactKey, newValue);
        LocalStorage.removeItem(oldKey); // Clean up old key
      }
    });
    
    // Migrate localStorage keys
    Object.entries(actualMigrationMap.localStorageKeys).forEach(([oldKey, newKey]) => {
      const oldValue = LocalStorage.getItem(oldKey);
      if (oldValue.success && oldValue.data !== undefined) {
        LocalStorage.setItem(newKey, oldValue.data);
        LocalStorage.removeItem(oldKey); // Clean up old key
      }
    });
    
    // Migrate cookie keys
    Object.entries(actualMigrationMap.cookieKeys).forEach(([oldKey, newKey]) => {
      const oldValue = CookieStorage.getCookie(oldKey);
      if (oldValue.success && oldValue.data !== undefined) {
        CookieStorage.setCookie(newKey, oldValue.data);
        CookieStorage.removeCookie(oldKey); // Clean up old key
      }
    });
  }

  /**
   * Validate storage integrity and repair corrupted data
   * @returns Validation report with any issues found and resolved
   */
  validateAndRepairStorage() {
    const issues: string[] = [];
    const repairs: string[] = [];
    
    try {
      // Validate user session data
      const userSession = sessionUtils.getUserSession();
      if (userSession && !isUserSession(userSession)) {
        sessionUtils.clearUserSession();
        issues.push('Invalid user session data detected');
        repairs.push('Cleared corrupted user session');
      }
      
      // Validate theme preferences
      const themePrefs = getThemePreferences();
      if (!isValidThemePreferences(themePrefs)) {
        initializeThemePreferences();
        issues.push('Invalid theme preferences detected');
        repairs.push('Reset theme preferences to defaults');
      }
      
      // Validate service ID
      const serviceId = serviceIdStorage.getCurrentServiceId();
      if (isNaN(serviceId) || serviceId < -1) {
        serviceIdStorage.setCurrentServiceId(-1);
        issues.push('Invalid service ID detected');
        repairs.push('Reset service ID to default (-1)');
      }
      
      // Clean up expired navigation states
      serviceStatePersistence.cleanupExpiredStates();
      repairs.push('Cleaned up expired navigation states');
      
    } catch (error) {
      issues.push(`Storage validation error: ${error}`);
    }
    
    return {
      hasIssues: issues.length > 0,
      issues,
      repairs,
      timestamp: new Date().toISOString(),
    };
  }
}

// =============================================================================
// Convenience Exports and Default Interface
// =============================================================================

/**
 * Pre-configured storage manager instance for immediate use throughout the application
 */
export const storageManager = new UnifiedStorageManager({
  enableLogging: process.env.NODE_ENV === 'development',
  enableCrossTabs: true,
  defaultTTL: 5 * 60 * 1000, // 5 minutes
});

/**
 * Collection of commonly used storage operations for quick access
 */
export const commonStorageOperations = {
  // Authentication operations
  authentication: {
    getToken: () => sessionUtils.getToken(),
    setToken: (token: string) => sessionUtils.setToken(token),
    clearToken: () => sessionUtils.clearToken(),
    getUser: () => sessionUtils.getUserSession(),
    setUser: (user: UserSession) => sessionUtils.setUserSession(user),
    clearUser: () => sessionUtils.clearUserSession(),
    isLoggedIn: () => Boolean(sessionUtils.getToken()),
  },
  
  // Theme operations
  theme: {
    isDarkMode: () => getThemePreferences().isDarkMode,
    toggleDarkMode: () => {
      const current = getThemePreferences();
      LocalStorage.setItem(THEME_STORAGE_KEYS.DARK_MODE, !current.isDarkMode);
    },
    getTableRowCount: () => getThemePreferences().tableRowCount,
    setTableRowCount: (count: number) => {
      LocalStorage.setItem(THEME_STORAGE_KEYS.TABLE_ROW_COUNT, count);
    },
  },
  
  // Service operations
  service: {
    getCurrentServiceId: () => serviceIdStorage.getCurrentServiceId(),
    setCurrentServiceId: (id: number) => serviceIdStorage.setCurrentServiceId(id),
    clearCurrentServiceId: () => serviceIdStorage.clearCurrentServiceId(),
    hasSelectedService: () => serviceIdStorage.getCurrentServiceId() !== -1,
  },
  
  // UI state operations
  ui: {
    isFirstTimeUser: () => getCurrentUIState().onboarding.isFirstTimeUser,
    markOnboardingComplete: () => {
      LocalStorage.setItem(UI_STORAGE_KEYS.CONFIG_FIRST_TIME_USER, true);
    },
    shouldShowPasswordPopup: () => getCurrentUIState().popups.showPasswordPopup,
    setShowPasswordPopup: (show: boolean) => {
      LocalStorage.setItem(UI_STORAGE_KEYS.SHOW_PASSWORD_POPUP, show);
    },
  },
};

/**
 * Storage utility functions for external consumption
 */
export const storageUtilities = {
  // Environment detection
  isBrowser,
  
  // Storage info
  getStorageInfo: Storage.getStorageInfo,
  
  // Clear operations
  clearAll: (preserveTheme: boolean = false) => storageManager.clearAllStorage(preserveTheme),
  
  // Migration utilities
  migrateFromAngular: (migrationMap?: StorageMigrationMap) => 
    storageManager.migrateFromAngularServices(migrationMap),
  
  // Validation and repair
  validateStorage: () => storageManager.validateAndRepairStorage(),
  
  // Snapshot for debugging
  getSnapshot: () => storageManager.getStorageSnapshot(),
};

/**
 * Default export providing the complete storage interface
 * This serves as the primary entry point for all storage operations
 */
export default {
  // Core utilities
  LocalStorage,
  SessionStorage,
  CookieStorage,
  Storage,
  storageHelpers,
  
  // SSR-safe hooks
  useLocalStorage,
  useSessionStorage,
  useCookies,
  useCookieState,
  useIsHydrated,
  
  // User session hooks
  useSessionToken,
  useUserStorage,
  useUserSession,
  useAuthState,
  
  // Theme hooks
  useDarkMode,
  useTableRowCount,
  useThemePreferences,
  useThemeEffect,
  
  // UI state hooks
  usePasswordPopupState,
  useFirstTimeUserState,
  useDialogVisibilityState,
  useUIState,
  useOnboardingState,
  useUIStateSynchronization,
  
  // Service state hooks
  useCurrentServiceId,
  useServiceNavigationState,
  useServiceState,
  
  // Management interface
  UnifiedStorageManager,
  storageManager,
  commonStorageOperations,
  storageUtilities,
  
  // Constants
  STORAGE_KEYS,
  SESSION_STORAGE_KEYS,
  THEME_STORAGE_KEYS,
  THEME_DEFAULTS,
  UI_STORAGE_KEYS,
  DEFAULT_UI_CONFIG,
  
  // Utility functions
  sessionUtils,
  getThemePreferences,
  initializeThemePreferences,
  isUIFeatureEnabled,
  getCurrentUIState,
  serviceIdStorage,
  serviceNavigationStorage,
  serviceStatePersistence,
  
  // Type guards
  isUserSession,
  isStorageKey,
  isThemeMode,
  isDatabaseServiceType,
  isValidThemePreferences,
};

// =============================================================================
// Module Documentation
// =============================================================================

/**
 * @example
 * // Basic usage with React hooks
 * import { useUserSession, useThemePreferences, useCurrentServiceId } from '@/lib/storage';
 * 
 * function MyComponent() {
 *   const { userSession, isLoggedIn, logout } = useUserSession();
 *   const { isDarkMode, toggleTheme } = useThemePreferences();
 *   const { currentServiceId, setCurrentServiceId } = useCurrentServiceId();
 *   
 *   return (
 *     <div className={isDarkMode ? 'dark' : 'light'}>
 *       {isLoggedIn ? (
 *         <div>Welcome, {userSession?.name}!</div>
 *       ) : (
 *         <div>Please log in</div>
 *       )}
 *     </div>
 *   );
 * }
 * 
 * @example
 * // Direct storage operations
 * import { storageManager, commonStorageOperations } from '@/lib/storage';
 * 
 * // Quick operations
 * if (commonStorageOperations.authentication.isLoggedIn()) {
 *   console.log('User is authenticated');
 * }
 * 
 * // Full storage snapshot for debugging
 * const snapshot = storageManager.getStorageSnapshot();
 * console.log('Current storage state:', snapshot);
 * 
 * @example
 * // Migration from Angular services
 * import { storageUtilities } from '@/lib/storage';
 * 
 * // Migrate existing Angular localStorage data
 * storageUtilities.migrateFromAngular();
 * 
 * // Validate and repair any corrupted data
 * const validationReport = storageUtilities.validateStorage();
 * if (validationReport.hasIssues) {
 *   console.warn('Storage issues found and repaired:', validationReport);
 * }
 */