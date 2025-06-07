/**
 * Core browser storage utilities providing type-safe wrappers for localStorage, 
 * sessionStorage, and cookie operations. Includes JSON serialization/deserialization,
 * error handling, and browser environment detection for SSR compatibility.
 * 
 * This module replaces Angular's localStorage/sessionStorage usage with React/Next.js
 * compatible storage utilities that work seamlessly with server-side rendering.
 */

import {
  type StorageKey,
  type StorageValue,
  type StorageResult,
  type CookieOptions,
  type UserSession,
  type ThemePreferences,
  type UIState,
  type ServiceState,
  STORAGE_KEYS,
  isUserSession,
  isStorageKey,
  isThemeMode,
} from './types';

// =============================================================================
// Environment Detection for SSR Compatibility
// =============================================================================

/**
 * Safely detects if we're running in a browser environment.
 * Essential for Next.js SSR compatibility where storage APIs are not available.
 */
export const isBrowser = (): boolean => {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
};

/**
 * Safely detects if cookies are available in the current environment.
 * Handles both browser and server-side environments gracefully.
 */
export const areCookiesAvailable = (): boolean => {
  if (!isBrowser()) return false;
  
  try {
    // Test if we can actually access document.cookie (some browsers block it)
    const testCookie = 'test-cookie-access';
    document.cookie = `${testCookie}=test; path=/; SameSite=Strict`;
    const canRead = document.cookie.includes(testCookie);
    
    // Clean up test cookie
    if (canRead) {
      document.cookie = `${testCookie}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Strict`;
    }
    
    return canRead;
  } catch {
    return false;
  }
};

/**
 * Detects if the current environment supports storage operations.
 * Used as a guard for all storage operations to prevent SSR errors.
 */
export const isStorageAvailable = (type: 'localStorage' | 'sessionStorage' = 'localStorage'): boolean => {
  if (!isBrowser()) return false;
  
  try {
    const storage = window[type];
    const testKey = '__storage_test__';
    storage.setItem(testKey, 'test');
    storage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

// =============================================================================
// Error Handling and Logging
// =============================================================================

/**
 * Logs storage errors for debugging and monitoring purposes.
 * In production, this could integrate with error tracking services.
 */
const logStorageError = (operation: string, key: string, error: Error): void => {
  if (process.env.NODE_ENV === 'development') {
    console.warn(`Storage operation failed [${operation}] for key "${key}":`, error);
  }
  
  // In production, could send to error tracking service
  // Example: errorTracker.captureException(error, { tags: { operation, key } });
};

/**
 * Creates a safe wrapper for storage operations that handles errors gracefully.
 * Returns a result object indicating success/failure instead of throwing.
 */
const safeStorageOperation = <T>(
  operation: () => T,
  operationName: string,
  key: string
): StorageResult<T> => {
  try {
    const result = operation();
    return { success: true, data: result };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown storage error';
    logStorageError(operationName, key, error instanceof Error ? error : new Error(errorMsg));
    return { success: false, error: errorMsg };
  }
};

// =============================================================================
// JSON Serialization Utilities
// =============================================================================

/**
 * Safely serializes values to JSON with error handling.
 * Handles special cases like Date objects and complex nested structures.
 */
const safeSerialize = (value: any): StorageResult<string> => {
  return safeStorageOperation(
    () => {
      // Handle primitive types that don't need serialization
      if (typeof value === 'string') return value;
      if (typeof value === 'number' || typeof value === 'boolean') return String(value);
      if (value === null || value === undefined) return '';
      
      // Serialize objects and arrays
      return JSON.stringify(value, (key, val) => {
        // Handle Date objects specially
        if (val instanceof Date) {
          return { __type: 'Date', value: val.toISOString() };
        }
        return val;
      });
    },
    'serialize',
    typeof value === 'object' ? JSON.stringify(value).substring(0, 50) + '...' : String(value)
  );
};

/**
 * Safely deserializes JSON strings with error handling and type validation.
 * Reconstructs special objects like Dates that were serialized with metadata.
 */
const safeDeserialize = <T = any>(value: string | null): StorageResult<T | null> => {
  if (value === null || value === undefined || value === '') {
    return { success: true, data: null };
  }
  
  return safeStorageOperation(
    () => {
      // Handle primitive string values
      if (typeof value === 'string' && !value.startsWith('{') && !value.startsWith('[')) {
        // Try to parse as number or boolean first
        if (value === 'true') return true as T;
        if (value === 'false') return false as T;
        if (value === 'null') return null;
        if (value === 'undefined') return undefined;
        
        const num = Number(value);
        if (!isNaN(num) && isFinite(num)) return num as T;
        
        return value as T;
      }
      
      // Parse JSON with special object reconstruction
      const parsed = JSON.parse(value, (key, val) => {
        // Reconstruct Date objects
        if (val && typeof val === 'object' && val.__type === 'Date') {
          return new Date(val.value);
        }
        return val;
      });
      
      return parsed;
    },
    'deserialize',
    value.substring(0, 50) + (value.length > 50 ? '...' : '')
  );
};

// =============================================================================
// LocalStorage Utilities
// =============================================================================

/**
 * Type-safe localStorage wrapper with JSON serialization and error handling.
 * Replaces direct localStorage usage throughout the application.
 */
export const localStorage = {
  /**
   * Stores a value in localStorage with automatic JSON serialization.
   * Returns success/failure result instead of throwing errors.
   */
  setItem: <T>(key: StorageKey, value: StorageValue<T>): StorageResult<void> => {
    if (!isStorageAvailable('localStorage')) {
      return { success: false, error: 'localStorage not available' };
    }
    
    const serializedResult = safeSerialize(value);
    if (!serializedResult.success) {
      return { success: false, error: `Serialization failed: ${serializedResult.error}` };
    }
    
    return safeStorageOperation(
      () => {
        window.localStorage.setItem(key, serializedResult.data);
      },
      'localStorage.setItem',
      key
    );
  },

  /**
   * Retrieves and deserializes a value from localStorage.
   * Returns null if the key doesn't exist or if an error occurs.
   */
  getItem: <T = any>(key: StorageKey): T | null => {
    if (!isStorageAvailable('localStorage')) {
      return null;
    }
    
    const getResult = safeStorageOperation(
      () => window.localStorage.getItem(key),
      'localStorage.getItem',
      key
    );
    
    if (!getResult.success) {
      return null;
    }
    
    const deserializeResult = safeDeserialize<T>(getResult.data);
    return deserializeResult.success ? deserializeResult.data : null;
  },

  /**
   * Removes an item from localStorage with error handling.
   */
  removeItem: (key: StorageKey): StorageResult<void> => {
    if (!isStorageAvailable('localStorage')) {
      return { success: false, error: 'localStorage not available' };
    }
    
    return safeStorageOperation(
      () => {
        window.localStorage.removeItem(key);
      },
      'localStorage.removeItem',
      key
    );
  },

  /**
   * Clears all items from localStorage with error handling.
   * Use with caution as this affects all stored data.
   */
  clear: (): StorageResult<void> => {
    if (!isStorageAvailable('localStorage')) {
      return { success: false, error: 'localStorage not available' };
    }
    
    return safeStorageOperation(
      () => {
        window.localStorage.clear();
      },
      'localStorage.clear',
      'all'
    );
  },

  /**
   * Gets all keys currently stored in localStorage.
   * Useful for debugging and migration scenarios.
   */
  getAllKeys: (): string[] => {
    if (!isStorageAvailable('localStorage')) {
      return [];
    }
    
    try {
      return Object.keys(window.localStorage);
    } catch {
      return [];
    }
  },

  /**
   * Checks if a specific key exists in localStorage.
   */
  hasItem: (key: StorageKey): boolean => {
    if (!isStorageAvailable('localStorage')) {
      return false;
    }
    
    try {
      return window.localStorage.getItem(key) !== null;
    } catch {
      return false;
    }
  },
};

// =============================================================================
// SessionStorage Utilities
// =============================================================================

/**
 * Type-safe sessionStorage wrapper for temporary data storage.
 * Similar to localStorage but data is cleared when the browser tab closes.
 */
export const sessionStorage = {
  /**
   * Stores a value in sessionStorage with automatic JSON serialization.
   */
  setItem: <T>(key: StorageKey, value: StorageValue<T>): StorageResult<void> => {
    if (!isStorageAvailable('sessionStorage')) {
      return { success: false, error: 'sessionStorage not available' };
    }
    
    const serializedResult = safeSerialize(value);
    if (!serializedResult.success) {
      return { success: false, error: `Serialization failed: ${serializedResult.error}` };
    }
    
    return safeStorageOperation(
      () => {
        window.sessionStorage.setItem(key, serializedResult.data);
      },
      'sessionStorage.setItem',
      key
    );
  },

  /**
   * Retrieves and deserializes a value from sessionStorage.
   */
  getItem: <T = any>(key: StorageKey): T | null => {
    if (!isStorageAvailable('sessionStorage')) {
      return null;
    }
    
    const getResult = safeStorageOperation(
      () => window.sessionStorage.getItem(key),
      'sessionStorage.getItem',
      key
    );
    
    if (!getResult.success) {
      return null;
    }
    
    const deserializeResult = safeDeserialize<T>(getResult.data);
    return deserializeResult.success ? deserializeResult.data : null;
  },

  /**
   * Removes an item from sessionStorage.
   */
  removeItem: (key: StorageKey): StorageResult<void> => {
    if (!isStorageAvailable('sessionStorage')) {
      return { success: false, error: 'sessionStorage not available' };
    }
    
    return safeStorageOperation(
      () => {
        window.sessionStorage.removeItem(key);
      },
      'sessionStorage.removeItem',
      key
    );
  },

  /**
   * Clears all items from sessionStorage.
   */
  clear: (): StorageResult<void> => {
    if (!isStorageAvailable('sessionStorage')) {
      return { success: false, error: 'sessionStorage not available' };
    }
    
    return safeStorageOperation(
      () => {
        window.sessionStorage.clear();
      },
      'sessionStorage.clear',
      'all'
    );
  },

  /**
   * Gets all keys currently stored in sessionStorage.
   */
  getAllKeys: (): string[] => {
    if (!isStorageAvailable('sessionStorage')) {
      return [];
    }
    
    try {
      return Object.keys(window.sessionStorage);
    } catch {
      return [];
    }
  },

  /**
   * Checks if a specific key exists in sessionStorage.
   */
  hasItem: (key: StorageKey): boolean => {
    if (!isStorageAvailable('sessionStorage')) {
      return false;
    }
    
    try {
      return window.sessionStorage.getItem(key) !== null;
    } catch {
      return false;
    }
  },
};

// =============================================================================
// Cookie Management Utilities
// =============================================================================

/**
 * Default cookie options with security-first configuration.
 * Uses SameSite=Strict for maximum security as required for session tokens.
 */
const DEFAULT_COOKIE_OPTIONS: CookieOptions = {
  expires: 7, // 7 days
  path: '/',
  domain: '',
  secure: true, // HTTPS only in production
  sameSite: 'strict', // Strict SameSite policy for security
  httpOnly: false, // Must be false for client-side access
};

/**
 * Cookie management utilities with secure defaults and comprehensive error handling.
 * Designed specifically for session token storage and user preferences.
 */
export const cookies = {
  /**
   * Sets a cookie with secure defaults and comprehensive options support.
   * Automatically adjusts security settings based on environment.
   */
  setItem: (
    key: StorageKey,
    value: string,
    options: Partial<CookieOptions> = {}
  ): StorageResult<void> => {
    if (!areCookiesAvailable()) {
      return { success: false, error: 'Cookies not available' };
    }
    
    return safeStorageOperation(
      () => {
        const opts = { ...DEFAULT_COOKIE_OPTIONS, ...options };
        
        // Adjust security settings based on environment
        const isSecure = opts.secure && (window.location.protocol === 'https:' || process.env.NODE_ENV === 'production');
        
        let cookieString = `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
        
        // Add expiration
        if (opts.expires > 0) {
          const expiryDate = new Date();
          expiryDate.setTime(expiryDate.getTime() + (opts.expires * 24 * 60 * 60 * 1000));
          cookieString += `; expires=${expiryDate.toUTCString()}`;
        }
        
        // Add path
        if (opts.path) {
          cookieString += `; path=${opts.path}`;
        }
        
        // Add domain
        if (opts.domain) {
          cookieString += `; domain=${opts.domain}`;
        }
        
        // Add security flags
        if (isSecure) {
          cookieString += '; Secure';
        }
        
        if (opts.httpOnly) {
          cookieString += '; HttpOnly';
        }
        
        // Add SameSite policy (required for session security)
        cookieString += `; SameSite=${opts.sameSite}`;
        
        document.cookie = cookieString;
      },
      'cookies.setItem',
      key
    );
  },

  /**
   * Retrieves a cookie value by key with automatic URL decoding.
   */
  getItem: (key: StorageKey): string | null => {
    if (!areCookiesAvailable()) {
      return null;
    }
    
    try {
      const cookies = document.cookie.split(';');
      const encodedKey = encodeURIComponent(key);
      
      for (let cookie of cookies) {
        let [name, value] = cookie.trim().split('=');
        if (name === encodedKey) {
          return value ? decodeURIComponent(value) : '';
        }
      }
      
      return null;
    } catch (error) {
      logStorageError('cookies.getItem', key, error instanceof Error ? error : new Error('Cookie retrieval failed'));
      return null;
    }
  },

  /**
   * Removes a cookie by setting its expiration to the past.
   */
  removeItem: (key: StorageKey, options: Partial<CookieOptions> = {}): StorageResult<void> => {
    if (!areCookiesAvailable()) {
      return { success: false, error: 'Cookies not available' };
    }
    
    return safeStorageOperation(
      () => {
        const opts = { ...DEFAULT_COOKIE_OPTIONS, ...options };
        let cookieString = `${encodeURIComponent(key)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        
        if (opts.path) {
          cookieString += `; path=${opts.path}`;
        }
        
        if (opts.domain) {
          cookieString += `; domain=${opts.domain}`;
        }
        
        cookieString += `; SameSite=${opts.sameSite}`;
        
        document.cookie = cookieString;
      },
      'cookies.removeItem',
      key
    );
  },

  /**
   * Gets all cookie names currently set.
   * Useful for debugging and cleanup operations.
   */
  getAllKeys: (): string[] => {
    if (!areCookiesAvailable()) {
      return [];
    }
    
    try {
      return document.cookie
        .split(';')
        .map(cookie => cookie.trim().split('=')[0])
        .filter(name => name)
        .map(name => decodeURIComponent(name));
    } catch {
      return [];
    }
  },

  /**
   * Checks if a specific cookie exists.
   */
  hasItem: (key: StorageKey): boolean => {
    return cookies.getItem(key) !== null;
  },
};

// =============================================================================
// High-Level Storage Operations
// =============================================================================

/**
 * Comprehensive user session management with automatic token handling.
 * Integrates with Next.js middleware authentication flow.
 */
export const userSession = {
  /**
   * Stores user session data with automatic token management.
   * Session token is stored in secure cookies, user data in localStorage.
   */
  save: (session: UserSession): StorageResult<void> => {
    // Validate session data
    if (!isUserSession(session)) {
      return { success: false, error: 'Invalid user session data' };
    }
    
    // Store session token in secure cookie for Next.js middleware access
    const tokenResult = cookies.setItem(STORAGE_KEYS.SESSION_TOKEN, session.sessionToken, {
      expires: 1, // 1 day for security
      secure: true,
      sameSite: 'strict',
      httpOnly: false, // Must be accessible to client for API calls
    });
    
    if (!tokenResult.success) {
      return tokenResult;
    }
    
    // Store user data in localStorage (excluding sensitive token)
    const userDataForStorage = {
      ...session,
      sessionToken: '', // Don't store token in localStorage
    };
    
    return localStorage.setItem(STORAGE_KEYS.CURRENT_USER, userDataForStorage);
  },

  /**
   * Retrieves complete user session data from both cookies and localStorage.
   */
  load: (): UserSession | null => {
    const sessionToken = cookies.getItem(STORAGE_KEYS.SESSION_TOKEN);
    const userData = localStorage.getItem<UserSession>(STORAGE_KEYS.CURRENT_USER);
    
    if (!sessionToken || !userData) {
      return null;
    }
    
    // Combine data from both sources
    return {
      ...userData,
      sessionToken,
    };
  },

  /**
   * Clears all session data from both cookies and localStorage.
   * Used during logout and authentication failures.
   */
  clear: (): StorageResult<void> => {
    const results: StorageResult<void>[] = [
      cookies.removeItem(STORAGE_KEYS.SESSION_TOKEN),
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER),
    ];
    
    const hasErrors = results.some(result => !result.success);
    if (hasErrors) {
      const errors = results.filter(r => !r.success).map(r => r.error).join(', ');
      return { success: false, error: `Session clear failed: ${errors}` };
    }
    
    return { success: true, data: undefined };
  },

  /**
   * Checks if a valid session exists.
   */
  exists: (): boolean => {
    const session = userSession.load();
    if (!session) return false;
    
    // Check if token is not expired
    if (session.tokenExpiryDate && new Date(session.tokenExpiryDate) <= new Date()) {
      return false;
    }
    
    return true;
  },
};

/**
 * Theme preference management with system theme detection support.
 */
export const themePreferences = {
  /**
   * Saves theme preferences with validation.
   */
  save: (preferences: ThemePreferences): StorageResult<void> => {
    if (!preferences || !isThemeMode(preferences.mode)) {
      return { success: false, error: 'Invalid theme preferences' };
    }
    
    return localStorage.setItem(STORAGE_KEYS.IS_DARK_MODE, preferences);
  },

  /**
   * Loads theme preferences with fallback to system defaults.
   */
  load: (): ThemePreferences => {
    const stored = localStorage.getItem<ThemePreferences>(STORAGE_KEYS.IS_DARK_MODE);
    
    if (stored && isThemeMode(stored.mode)) {
      return stored;
    }
    
    // Return system default
    const prefersDark = isBrowser() && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    return {
      mode: 'system',
      isDarkMode: prefersDark,
      currentTableRowNum: 25,
      followSystemTheme: true,
    };
  },

  /**
   * Toggles dark mode and saves the preference.
   */
  toggleDarkMode: (): StorageResult<void> => {
    const current = themePreferences.load();
    const updated = {
      ...current,
      isDarkMode: !current.isDarkMode,
      mode: current.isDarkMode ? 'light' : 'dark' as const,
      followSystemTheme: false,
    };
    
    return themePreferences.save(updated);
  },
};

/**
 * Service state management for database connections and navigation.
 */
export const serviceState = {
  /**
   * Saves current service selection state.
   */
  save: (state: ServiceState): StorageResult<void> => {
    // Store service ID separately for quick access
    const serviceIdResult = localStorage.setItem(STORAGE_KEYS.CURRENT_SERVICE_ID, state.currentServiceId);
    if (!serviceIdResult.success) {
      return serviceIdResult;
    }
    
    // Store complete state in sessionStorage (cleared when tab closes)
    return sessionStorage.setItem('serviceState', state);
  },

  /**
   * Loads service state with fallback to defaults.
   */
  load: (): ServiceState => {
    const stored = sessionStorage.getItem<ServiceState>('serviceState');
    const currentServiceId = localStorage.getItem<number>(STORAGE_KEYS.CURRENT_SERVICE_ID);
    
    if (stored) {
      return {
        ...stored,
        currentServiceId: currentServiceId ?? stored.currentServiceId,
      };
    }
    
    return {
      currentServiceId: currentServiceId ?? -1,
      currentServiceType: null,
      currentServiceName: null,
      currentServiceStatus: 'inactive',
      recentServiceIds: [],
      navigationContext: {
        currentSchema: null,
        currentTable: null,
        viewMode: 'list',
      },
    };
  },

  /**
   * Updates current service selection.
   */
  setCurrentService: (serviceId: number, serviceType?: string, serviceName?: string): StorageResult<void> => {
    const current = serviceState.load();
    const updated: ServiceState = {
      ...current,
      currentServiceId: serviceId,
      currentServiceType: serviceType as any || current.currentServiceType,
      currentServiceName: serviceName || current.currentServiceName,
      recentServiceIds: [
        serviceId,
        ...current.recentServiceIds.filter(id => id !== serviceId),
      ].slice(0, 5), // Keep only 5 recent services
    };
    
    return serviceState.save(updated);
  },
};

// =============================================================================
// Storage Migration Utilities
// =============================================================================

/**
 * Migrates storage data from Angular format to React format.
 * Handles key mapping and data transformation for backwards compatibility.
 */
export const migrationUtils = {
  /**
   * Migrates localStorage keys from Angular to React format.
   */
  migrateLocalStorageKeys: (): StorageResult<void> => {
    if (!isStorageAvailable('localStorage')) {
      return { success: false, error: 'localStorage not available' };
    }
    
    const migrationMap = {
      // Angular key -> React key mappings
      'currentUser': STORAGE_KEYS.CURRENT_USER,
      'session_token': STORAGE_KEYS.SESSION_TOKEN,
      'isDarkMode': STORAGE_KEYS.IS_DARK_MODE,
      'showPasswordPopup': STORAGE_KEYS.SHOW_PASSWORD_POPUP,
      'configFirstTimeUser': STORAGE_KEYS.CONFIG_FIRST_TIME_USER,
      'currentServiceId': STORAGE_KEYS.CURRENT_SERVICE_ID,
    };
    
    try {
      for (const [oldKey, newKey] of Object.entries(migrationMap)) {
        const value = window.localStorage.getItem(oldKey);
        if (value !== null) {
          window.localStorage.setItem(newKey, value);
          window.localStorage.removeItem(oldKey);
        }
      }
      
      return { success: true, data: undefined };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Migration failed' 
      };
    }
  },

  /**
   * Cleans up old Angular storage keys that are no longer needed.
   */
  cleanupOldKeys: (): StorageResult<void> => {
    if (!isStorageAvailable('localStorage')) {
      return { success: false, error: 'localStorage not available' };
    }
    
    const oldAngularKeys = [
      'angular-cache',
      'ng-bootstrap',
      'material-theme',
      // Add other Angular-specific keys as needed
    ];
    
    try {
      for (const key of oldAngularKeys) {
        window.localStorage.removeItem(key);
      }
      
      return { success: true, data: undefined };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Cleanup failed' 
      };
    }
  },
};

// =============================================================================
// Utility Functions and Helpers
// =============================================================================

/**
 * Gets the storage size usage for debugging and monitoring.
 * Useful for tracking storage quota usage and cleanup needs.
 */
export const getStorageUsage = () => {
  const usage = {
    localStorage: { used: 0, available: 0, items: 0 },
    sessionStorage: { used: 0, available: 0, items: 0 },
    cookies: { count: 0, totalSize: 0 },
  };
  
  if (!isBrowser()) return usage;
  
  try {
    // Calculate localStorage usage
    if (isStorageAvailable('localStorage')) {
      let localStorageSize = 0;
      for (let key in window.localStorage) {
        if (window.localStorage.hasOwnProperty(key)) {
          localStorageSize += window.localStorage[key].length + key.length;
        }
      }
      usage.localStorage.used = localStorageSize;
      usage.localStorage.items = window.localStorage.length;
      
      // Estimate available space (typical limit is 5-10MB)
      usage.localStorage.available = Math.max(0, 5 * 1024 * 1024 - localStorageSize);
    }
    
    // Calculate sessionStorage usage
    if (isStorageAvailable('sessionStorage')) {
      let sessionStorageSize = 0;
      for (let key in window.sessionStorage) {
        if (window.sessionStorage.hasOwnProperty(key)) {
          sessionStorageSize += window.sessionStorage[key].length + key.length;
        }
      }
      usage.sessionStorage.used = sessionStorageSize;
      usage.sessionStorage.items = window.sessionStorage.length;
      usage.sessionStorage.available = Math.max(0, 5 * 1024 * 1024 - sessionStorageSize);
    }
    
    // Calculate cookie usage
    if (areCookiesAvailable()) {
      const allCookies = document.cookie;
      usage.cookies.totalSize = allCookies.length;
      usage.cookies.count = allCookies ? allCookies.split(';').length : 0;
    }
  } catch (error) {
    logStorageError('getStorageUsage', 'all', error instanceof Error ? error : new Error('Usage calculation failed'));
  }
  
  return usage;
};

/**
 * Clears all application storage (localStorage, sessionStorage, cookies).
 * Use with extreme caution - this will log out the user and reset all preferences.
 */
export const clearAllStorage = (): StorageResult<void> => {
  const results: StorageResult<void>[] = [];
  
  // Clear localStorage
  if (isStorageAvailable('localStorage')) {
    results.push(localStorage.clear());
  }
  
  // Clear sessionStorage
  if (isStorageAvailable('sessionStorage')) {
    results.push(sessionStorage.clear());
  }
  
  // Clear application cookies
  if (areCookiesAvailable()) {
    const cookieKeys = cookies.getAllKeys();
    for (const key of cookieKeys) {
      if (isStorageKey(key)) {
        results.push(cookies.removeItem(key));
      }
    }
  }
  
  const failures = results.filter(result => !result.success);
  if (failures.length > 0) {
    const errors = failures.map(f => f.error).join(', ');
    return { success: false, error: `Clear all storage failed: ${errors}` };
  }
  
  return { success: true, data: undefined };
};

/**
 * Validates storage integrity and reports any issues.
 * Useful for debugging storage-related problems.
 */
export const validateStorageIntegrity = () => {
  const report = {
    isValid: true,
    issues: [] as string[],
    warnings: [] as string[],
  };
  
  if (!isBrowser()) {
    report.isValid = false;
    report.issues.push('Not running in browser environment');
    return report;
  }
  
  // Check storage availability
  if (!isStorageAvailable('localStorage')) {
    report.issues.push('localStorage not available');
    report.isValid = false;
  }
  
  if (!isStorageAvailable('sessionStorage')) {
    report.warnings.push('sessionStorage not available');
  }
  
  if (!areCookiesAvailable()) {
    report.warnings.push('Cookies not available');
  }
  
  // Check for session data consistency
  const sessionToken = cookies.getItem(STORAGE_KEYS.SESSION_TOKEN);
  const userData = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  
  if (sessionToken && !userData) {
    report.warnings.push('Session token exists but user data is missing');
  }
  
  if (!sessionToken && userData) {
    report.warnings.push('User data exists but session token is missing');
  }
  
  // Check storage quota
  const usage = getStorageUsage();
  if (usage.localStorage.available < 500 * 1024) { // Less than 500KB available
    report.warnings.push('localStorage quota is nearly full');
  }
  
  return report;
};

// =============================================================================
// Export Default Storage API
// =============================================================================

/**
 * Main storage API that provides a unified interface for all storage operations.
 * This is the primary export that applications should use.
 */
export const storage = {
  // Environment detection
  isBrowser,
  isStorageAvailable,
  areCookiesAvailable,
  
  // Basic storage operations
  localStorage,
  sessionStorage,
  cookies,
  
  // High-level operations
  userSession,
  themePreferences,
  serviceState,
  
  // Migration utilities
  migrationUtils,
  
  // Utility functions
  getStorageUsage,
  clearAllStorage,
  validateStorageIntegrity,
};

// =============================================================================
// Default Export
// =============================================================================

export default storage;