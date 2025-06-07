/**
 * Storage Library - Main Export Module
 * 
 * Provides a unified interface for all storage utilities and hooks used throughout
 * the DreamFactory Admin Interface. This module centralizes browser storage management,
 * React hooks for SSR-safe storage operations, and user session management utilities
 * that replace Angular services throughout the application.
 * 
 * Key Features:
 * - Type-safe localStorage and sessionStorage management with error handling
 * - SSR-compatible storage operations for Next.js server-side rendering
 * - Reactive state management using React hooks instead of RxJS observables
 * - Cross-tab synchronization for consistent application state
 * - Secure session token management with Next.js middleware integration
 * - User preferences and UI state persistence across browser sessions
 * 
 * Architecture:
 * This module serves as the central export point for all storage-related functionality,
 * organizing exports by category while maintaining a flat import structure for
 * consuming components. All storage operations are designed to be SSR-safe and
 * compatible with React 19 concurrent features.
 */

// =============================================================================
// Type Definitions and Constants
// =============================================================================

/**
 * Export all type definitions for storage operations
 * Provides comprehensive type safety across the storage layer
 */
export type {
  // Core storage types
  StorageKey,
  StorageValue,
  StorageResult,
  StorageOptions,
  CookieOptions,
  StorageEvent,
  StorageHookState,
  
  // User session and authentication types
  UserSession,
  AuthState,
  UserProfile,
  
  // Theme and UI preference types
  ThemeMode,
  ThemePreferences,
  UIPreferences,
  
  // UI state management types
  PopupState,
  OnboardingState,
  NavigationState,
  UIState,
  
  // Service state types
  DatabaseServiceType,
  ServiceStatus,
  ServiceState,
  
  // Migration and application state types
  StorageMigrationMap,
  ApplicationState,
  PersistenceConfig,
} from './types';

/**
 * Export storage key constants for type-safe key usage
 */
export { STORAGE_KEYS } from './types';

/**
 * Export type guard utilities for runtime validation
 */
export {
  isUserSession,
  isStorageKey,
  isThemeMode,
  isDatabaseServiceType,
} from './types';

// =============================================================================
// Core Storage Utilities
// =============================================================================

/**
 * Export core storage utilities for direct storage operations
 * These provide the foundation for all storage interactions
 */
export {
  // Environment detection utilities
  isBrowser,
  isStorageAvailable,
  areCookiesAvailable,
  
  // Storage operation utilities
  localStorage,
  sessionStorage,
  cookies,
  
  // High-level storage operations
  userSession,
  themePreferences,
  serviceState,
  
  // Migration and utility functions
  migrationUtils,
  getStorageUsage,
  clearAllStorage,
  validateStorageIntegrity,
  
  // Main storage API (comprehensive interface)
  storage,
} from './storage-utils';

// =============================================================================
// SSR-Safe React Hooks
// =============================================================================

/**
 * Export SSR-compatible React hooks for storage operations
 * These hooks provide reactive state management with SSR safety
 */
export {
  // Core storage hooks
  useLocalStorage,
  useSessionStorage,
  useCookies,
  
  // Convenience hooks for common use cases
  useSessionToken,
  useUserSession,
  useThemePreference,
  useCurrentServiceId,
  useTempFormState,
  
  // Utility functions for storage management
  clearAllStorage as clearAllStorageHook,
  getStorageCapabilities,
} from './ssr-storage';

/**
 * Export hook configuration types
 */
export type {
  StorageHookOptions,
  CookieHookOptions,
} from './ssr-storage';

// =============================================================================
// User Session and Authentication Management
// =============================================================================

/**
 * Export user session management utilities and hooks
 * Provides comprehensive authentication state management
 */
export {
  // Session token management class
  SessionTokenManager,
  
  // User data management class  
  UserDataManager,
  
  // Configuration constants
  SESSION_CONFIG,
  DEFAULT_AUTH_STATE,
  SESSION_COOKIE_OPTIONS,
  
  // Primary authentication hooks
  useAuthState,
  useRoleAccess,
  useSessionData,
  
  // Utility functions for migration compatibility
  sessionUtils,
} from './user-session';

// =============================================================================
// Theme and UI Preferences Management
// =============================================================================

/**
 * Export theme preference management utilities and hooks
 * Provides dark mode, table preferences, and UI customization
 */
export {
  // Default configuration constants
  DEFAULT_THEME_PREFERENCES,
  DEFAULT_UI_PREFERENCES,
  TABLE_ROW_COUNT_OPTIONS,
  
  // Theme management hooks
  useThemeManager,
  useSystemThemeDetection,
  useDarkModeToggle,
  
  // UI preference hooks
  useUIPreferences,
  useTableRowCount,
  
  // Theme utility functions
  themeUtils,
  getSystemThemePreference,
  applyThemeToDocument,
} from './theme-preferences';

// =============================================================================
// UI State Management
// =============================================================================

/**
 * Export UI state management hooks for application interface
 * Provides popup visibility, onboarding state, and navigation state
 */
export {
  // Default state constants
  DEFAULT_POPUP_STATE,
  DEFAULT_ONBOARDING_STATE,
  DEFAULT_NAVIGATION_STATE,
  
  // UI state management hooks
  usePopupState,
  useOnboardingState,
  useNavigationState,
  useUIState,
  
  // Specific UI preference hooks
  useFirstTimeUser,
  usePasswordPopup,
  useBreadcrumbs,
  
  // UI state utility functions
  uiStateUtils,
} from './ui-state';

// =============================================================================
// Service State Management
// =============================================================================

/**
 * Export service selection and navigation state management
 * Provides database service tracking and navigation context
 */
export {
  // Default service state constants
  DEFAULT_SERVICE_STATE,
  SERVICE_NAVIGATION_MODES,
  
  // Service state management hooks
  useServiceState,
  useCurrentService,
  useServiceHistory,
  useServiceNavigation,
  
  // Service selection utilities
  useServiceSelector,
  useRecentServices,
  
  // Service state utility functions
  serviceStateUtils,
  validateServiceState,
} from './service-state';

// =============================================================================
// Convenience Re-exports and Aliases
// =============================================================================

/**
 * Create convenient aliases for commonly used functions
 * Provides backwards compatibility and simplified imports
 */

// Storage operation aliases for common patterns
export const setItem = localStorage.setItem;
export const getItem = localStorage.getItem;
export const removeItem = localStorage.removeItem;
export const setSessionItem = sessionStorage.setItem;
export const getSessionItem = sessionStorage.getItem;
export const removeSessionItem = sessionStorage.removeItem;
export const setCookie = cookies.setItem;
export const getCookie = cookies.getItem;
export const removeCookie = cookies.removeItem;

// Hook aliases for common use cases
export { useLocalStorage as useStorage };
export { useSessionStorage as useSession };
export { useCookies as useCookie };

// Migration helpers for Angular to React transition
export const storageHooks = {
  useLocalStorage,
  useSessionStorage,
  useCookies,
  useSessionToken,
  useUserSession,
  useThemePreference,
  useCurrentServiceId,
};

export const storageUtils = {
  isBrowser,
  isStorageAvailable,
  areCookiesAvailable,
  localStorage,
  sessionStorage,
  cookies,
  getStorageUsage,
  clearAllStorage,
  validateStorageIntegrity,
};

export const authUtils = {
  SessionTokenManager,
  UserDataManager,
  sessionUtils,
};

// =============================================================================
// Main Storage Interface
// =============================================================================

/**
 * Primary storage interface combining all utilities for single import
 * This provides a comprehensive API for all storage operations
 */
export const dfStorage = {
  // Type constants
  STORAGE_KEYS,
  
  // Environment detection
  isBrowser,
  isStorageAvailable,
  areCookiesAvailable,
  
  // Core storage operations
  localStorage,
  sessionStorage,
  cookies,
  
  // React hooks
  hooks: {
    useLocalStorage,
    useSessionStorage,
    useCookies,
    useSessionToken,
    useUserSession,
    useThemePreference,
    useCurrentServiceId,
    useAuthState,
    useRoleAccess,
    useThemeManager,
    useUIPreferences,
    useServiceState,
  },
  
  // Utility functions
  utils: {
    getStorageUsage,
    clearAllStorage,
    validateStorageIntegrity,
    getStorageCapabilities,
    migrationUtils,
    sessionUtils,
    themeUtils: {} as any, // Will be populated from theme-preferences
    uiStateUtils: {} as any, // Will be populated from ui-state
    serviceStateUtils: {} as any, // Will be populated from service-state
  },
  
  // Session management
  session: {
    SessionTokenManager,
    UserDataManager,
    config: SESSION_CONFIG,
    defaultAuthState: DEFAULT_AUTH_STATE,
  },
  
  // Theme management
  theme: {
    defaults: DEFAULT_THEME_PREFERENCES,
    uiDefaults: DEFAULT_UI_PREFERENCES,
    rowCountOptions: TABLE_ROW_COUNT_OPTIONS,
  },
  
  // Migration helpers
  migration: {
    migrateLocalStorageKeys: migrationUtils.migrateLocalStorageKeys,
    cleanupOldKeys: migrationUtils.cleanupOldKeys,
  },
};

// =============================================================================
// Default Export
// =============================================================================

/**
 * Default export provides the complete storage interface
 * Enables both named imports and default import patterns:
 * 
 * import storage from '@/lib/storage'           // Full interface
 * import { useLocalStorage } from '@/lib/storage'  // Named imports
 */
export default dfStorage;

// =============================================================================
// JSDoc Type Definitions for IDE Support
// =============================================================================

/**
 * @typedef {Object} StorageLibrary
 * @description Main storage library interface providing all storage utilities
 * 
 * @property {Object} STORAGE_KEYS - Type-safe storage key constants
 * @property {Function} isBrowser - Environment detection for browser context
 * @property {Object} localStorage - Type-safe localStorage utilities  
 * @property {Object} sessionStorage - Type-safe sessionStorage utilities
 * @property {Object} cookies - Secure cookie management utilities
 * @property {Object} hooks - React hooks for storage operations
 * @property {Object} utils - Utility functions for storage management
 * @property {Object} session - User session and authentication management
 * @property {Object} theme - Theme and UI preference management
 * @property {Object} migration - Migration utilities for Angular transition
 */

/**
 * @typedef {Object} StorageHooks
 * @description React hooks for SSR-safe storage operations
 * 
 * @property {Function} useLocalStorage - localStorage hook with SSR support
 * @property {Function} useSessionStorage - sessionStorage hook with SSR support
 * @property {Function} useCookies - Cookie management hook with security
 * @property {Function} useSessionToken - Session token management hook
 * @property {Function} useUserSession - User session data management hook
 * @property {Function} useAuthState - Complete authentication state hook
 * @property {Function} useThemeManager - Theme preference management hook
 * @property {Function} useServiceState - Service selection state hook
 */

/**
 * @typedef {Object} StorageUtils
 * @description Utility functions for storage operations and debugging
 * 
 * @property {Function} getStorageUsage - Calculate storage quota usage
 * @property {Function} clearAllStorage - Clear all application storage
 * @property {Function} validateStorageIntegrity - Validate storage consistency
 * @property {Function} getStorageCapabilities - Check storage availability
 * @property {Object} migrationUtils - Angular to React migration utilities
 */

// =============================================================================
// Module Documentation
// =============================================================================

/**
 * # Storage Library Usage Examples
 * 
 * ## Basic Storage Operations
 * ```typescript
 * import { localStorage, sessionStorage, cookies } from '@/lib/storage';
 * 
 * // Set and get localStorage items with type safety
 * localStorage.setItem(STORAGE_KEYS.CURRENT_USER, userData);
 * const user = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
 * 
 * // Session storage for temporary data
 * sessionStorage.setItem('tempFormData', formState);
 * const formData = sessionStorage.getItem('tempFormData');
 * 
 * // Secure cookie management
 * cookies.setItem(STORAGE_KEYS.SESSION_TOKEN, token, {
 *   secure: true,
 *   sameSite: 'strict',
 *   maxAge: 86400, // 24 hours
 * });
 * ```
 * 
 * ## React Hooks for Components
 * ```typescript
 * import { useLocalStorage, useSessionToken, useAuthState } from '@/lib/storage';
 * 
 * function MyComponent() {
 *   // SSR-safe localStorage hook
 *   const [theme, setTheme] = useLocalStorage('theme', { defaultValue: 'light' });
 *   
 *   // Session token management
 *   const { value: token, setValue: setToken } = useSessionToken();
 *   
 *   // Complete authentication state
 *   const { authState, login, logout } = useAuthState();
 *   
 *   return (
 *     <div>
 *       <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
 *         Toggle Theme
 *       </button>
 *       {authState.isLoggedIn ? (
 *         <button onClick={logout}>Logout</button>
 *       ) : (
 *         <button onClick={() => login({ email, password })}>Login</button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 * 
 * ## Complete Storage Interface
 * ```typescript
 * import storage from '@/lib/storage';
 * 
 * // Environment detection
 * if (storage.isBrowser()) {
 *   // Check storage capabilities
 *   const capabilities = storage.utils.getStorageCapabilities();
 *   
 *   // Get storage usage for monitoring
 *   const usage = storage.utils.getStorageUsage();
 *   
 *   // Validate storage integrity
 *   const integrity = storage.utils.validateStorageIntegrity();
 * }
 * 
 * // Session management
 * const tokenManager = storage.session.SessionTokenManager;
 * const isValid = tokenManager.validateToken();
 * 
 * // Migration utilities
 * storage.migration.migrateLocalStorageKeys();
 * storage.migration.cleanupOldKeys();
 * ```
 * 
 * ## Error Handling
 * All storage operations return `StorageResult<T>` objects for safe error handling:
 * ```typescript
 * const result = localStorage.setItem('key', 'value');
 * if (result.success) {
 *   console.log('Storage successful');
 * } else {
 *   console.error('Storage failed:', result.error);
 * }
 * ```
 */