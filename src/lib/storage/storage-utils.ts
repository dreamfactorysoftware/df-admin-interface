/**
 * Storage Utilities for DreamFactory Admin Interface
 * 
 * Provides type-safe browser storage abstractions with SSR compatibility,
 * JSON serialization, error handling, and secure cookie management.
 * 
 * This module replaces Angular localStorage usage with modern React/Next.js
 * compatible storage utilities that work seamlessly with server-side rendering.
 */

/**
 * Browser environment detection for SSR compatibility
 */
export const isBrowser = typeof window !== 'undefined';

/**
 * Storage operation options
 */
export interface StorageOptions {
  /** Default value to return if key doesn't exist or parsing fails */
  defaultValue?: any;
  /** Whether to log errors (default: false) */
  logErrors?: boolean;
}

/**
 * Cookie options for secure configuration
 */
export interface CookieOptions {
  /** Expiration in days (default: 7) */
  maxAge?: number;
  /** Cookie path (default: '/') */
  path?: string;
  /** Secure flag for HTTPS (default: true in production) */
  secure?: boolean;
  /** SameSite attribute (default: 'strict') */
  sameSite?: 'strict' | 'lax' | 'none';
  /** HttpOnly flag (default: false for client access) */
  httpOnly?: boolean;
  /** Domain for cookie (optional) */
  domain?: string;
}

/**
 * Storage operation result
 */
export type StorageResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Type-safe localStorage wrapper with JSON serialization and error handling
 */
export class LocalStorage {
  /**
   * Sets a value in localStorage with JSON serialization
   * @param key - Storage key
   * @param value - Value to store (will be JSON stringified)
   * @param options - Storage options
   * @returns Success status
   */
  static setItem<T>(
    key: string,
    value: T,
    options: StorageOptions = {}
  ): StorageResult<T> {
    if (!isBrowser) {
      return { success: false, error: 'localStorage not available in SSR' };
    }

    try {
      const serializedValue = JSON.stringify(value);
      window.localStorage.setItem(key, serializedValue);
      return { success: true, data: value };
    } catch (error) {
      const errorMessage = `Failed to set localStorage item "${key}": ${
        error instanceof Error ? error.message : 'Unknown error'
      }`;
      
      if (options.logErrors) {
        console.error(errorMessage, error);
      }
      
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Gets a value from localStorage with JSON deserialization
   * @param key - Storage key
   * @param options - Storage options including default value
   * @returns Parsed value or default
   */
  static getItem<T>(
    key: string,
    options: StorageOptions = {}
  ): StorageResult<T> {
    if (!isBrowser) {
      return {
        success: false,
        data: options.defaultValue,
        error: 'localStorage not available in SSR'
      };
    }

    try {
      const item = window.localStorage.getItem(key);
      
      if (item === null) {
        return {
          success: true,
          data: options.defaultValue,
        };
      }

      const parsedValue = JSON.parse(item) as T;
      return { success: true, data: parsedValue };
    } catch (error) {
      const errorMessage = `Failed to get localStorage item "${key}": ${
        error instanceof Error ? error.message : 'Unknown error'
      }`;
      
      if (options.logErrors) {
        console.error(errorMessage, error);
      }
      
      return {
        success: false,
        data: options.defaultValue,
        error: errorMessage
      };
    }
  }

  /**
   * Removes an item from localStorage
   * @param key - Storage key to remove
   * @param options - Storage options
   * @returns Success status
   */
  static removeItem(
    key: string,
    options: StorageOptions = {}
  ): StorageResult<void> {
    if (!isBrowser) {
      return { success: false, error: 'localStorage not available in SSR' };
    }

    try {
      window.localStorage.removeItem(key);
      return { success: true };
    } catch (error) {
      const errorMessage = `Failed to remove localStorage item "${key}": ${
        error instanceof Error ? error.message : 'Unknown error'
      }`;
      
      if (options.logErrors) {
        console.error(errorMessage, error);
      }
      
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Clears all localStorage items
   * @param options - Storage options
   * @returns Success status
   */
  static clear(options: StorageOptions = {}): StorageResult<void> {
    if (!isBrowser) {
      return { success: false, error: 'localStorage not available in SSR' };
    }

    try {
      window.localStorage.clear();
      return { success: true };
    } catch (error) {
      const errorMessage = `Failed to clear localStorage: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`;
      
      if (options.logErrors) {
        console.error(errorMessage, error);
      }
      
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Gets all localStorage keys
   * @returns Array of storage keys
   */
  static getKeys(): string[] {
    if (!isBrowser) {
      return [];
    }

    try {
      return Object.keys(window.localStorage);
    } catch (error) {
      console.error('Failed to get localStorage keys:', error);
      return [];
    }
  }

  /**
   * Checks if a key exists in localStorage
   * @param key - Storage key to check
   * @returns True if key exists
   */
  static hasItem(key: string): boolean {
    if (!isBrowser) {
      return false;
    }

    try {
      return window.localStorage.getItem(key) !== null;
    } catch (error) {
      console.error(`Failed to check localStorage item "${key}":`, error);
      return false;
    }
  }
}

/**
 * Type-safe sessionStorage wrapper with JSON serialization and error handling
 */
export class SessionStorage {
  /**
   * Sets a value in sessionStorage with JSON serialization
   * @param key - Storage key
   * @param value - Value to store (will be JSON stringified)
   * @param options - Storage options
   * @returns Success status
   */
  static setItem<T>(
    key: string,
    value: T,
    options: StorageOptions = {}
  ): StorageResult<T> {
    if (!isBrowser) {
      return { success: false, error: 'sessionStorage not available in SSR' };
    }

    try {
      const serializedValue = JSON.stringify(value);
      window.sessionStorage.setItem(key, serializedValue);
      return { success: true, data: value };
    } catch (error) {
      const errorMessage = `Failed to set sessionStorage item "${key}": ${
        error instanceof Error ? error.message : 'Unknown error'
      }`;
      
      if (options.logErrors) {
        console.error(errorMessage, error);
      }
      
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Gets a value from sessionStorage with JSON deserialization
   * @param key - Storage key
   * @param options - Storage options including default value
   * @returns Parsed value or default
   */
  static getItem<T>(
    key: string,
    options: StorageOptions = {}
  ): StorageResult<T> {
    if (!isBrowser) {
      return {
        success: false,
        data: options.defaultValue,
        error: 'sessionStorage not available in SSR'
      };
    }

    try {
      const item = window.sessionStorage.getItem(key);
      
      if (item === null) {
        return {
          success: true,
          data: options.defaultValue,
        };
      }

      const parsedValue = JSON.parse(item) as T;
      return { success: true, data: parsedValue };
    } catch (error) {
      const errorMessage = `Failed to get sessionStorage item "${key}": ${
        error instanceof Error ? error.message : 'Unknown error'
      }`;
      
      if (options.logErrors) {
        console.error(errorMessage, error);
      }
      
      return {
        success: false,
        data: options.defaultValue,
        error: errorMessage
      };
    }
  }

  /**
   * Removes an item from sessionStorage
   * @param key - Storage key to remove
   * @param options - Storage options
   * @returns Success status
   */
  static removeItem(
    key: string,
    options: StorageOptions = {}
  ): StorageResult<void> {
    if (!isBrowser) {
      return { success: false, error: 'sessionStorage not available in SSR' };
    }

    try {
      window.sessionStorage.removeItem(key);
      return { success: true };
    } catch (error) {
      const errorMessage = `Failed to remove sessionStorage item "${key}": ${
        error instanceof Error ? error.message : 'Unknown error'
      }`;
      
      if (options.logErrors) {
        console.error(errorMessage, error);
      }
      
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Clears all sessionStorage items
   * @param options - Storage options
   * @returns Success status
   */
  static clear(options: StorageOptions = {}): StorageResult<void> {
    if (!isBrowser) {
      return { success: false, error: 'sessionStorage not available in SSR' };
    }

    try {
      window.sessionStorage.clear();
      return { success: true };
    } catch (error) {
      const errorMessage = `Failed to clear sessionStorage: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`;
      
      if (options.logErrors) {
        console.error(errorMessage, error);
      }
      
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Gets all sessionStorage keys
   * @returns Array of storage keys
   */
  static getKeys(): string[] {
    if (!isBrowser) {
      return [];
    }

    try {
      return Object.keys(window.sessionStorage);
    } catch (error) {
      console.error('Failed to get sessionStorage keys:', error);
      return [];
    }
  }

  /**
   * Checks if a key exists in sessionStorage
   * @param key - Storage key to check
   * @returns True if key exists
   */
  static hasItem(key: string): boolean {
    if (!isBrowser) {
      return false;
    }

    try {
      return window.sessionStorage.getItem(key) !== null;
    } catch (error) {
      console.error(`Failed to check sessionStorage item "${key}":`, error);
      return false;
    }
  }
}

/**
 * Cookie management utilities with secure configurations
 * Optimized for session token storage with SameSite=Strict support
 */
export class CookieStorage {
  /**
   * Default cookie options for secure session management
   */
  private static defaultOptions: CookieOptions = {
    maxAge: 7, // 7 days
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    httpOnly: false, // Set to false for client access, true for HTTP-only cookies
  };

  /**
   * Sets a cookie with secure configuration
   * @param name - Cookie name
   * @param value - Cookie value (will be URL encoded)
   * @param options - Cookie options
   * @returns Success status
   */
  static setCookie(
    name: string,
    value: string,
    options: CookieOptions = {}
  ): StorageResult<string> {
    if (!isBrowser) {
      return { success: false, error: 'Cookies not available in SSR' };
    }

    try {
      const config = { ...this.defaultOptions, ...options };
      const encodedValue = encodeURIComponent(value);
      
      let cookieString = `${name}=${encodedValue}`;
      
      if (config.maxAge) {
        const expirationDate = new Date();
        expirationDate.setTime(
          expirationDate.getTime() + config.maxAge * 24 * 60 * 60 * 1000
        );
        cookieString += `; expires=${expirationDate.toUTCString()}`;
      }
      
      if (config.path) {
        cookieString += `; path=${config.path}`;
      }
      
      if (config.domain) {
        cookieString += `; domain=${config.domain}`;
      }
      
      if (config.secure) {
        cookieString += '; secure';
      }
      
      if (config.httpOnly) {
        cookieString += '; httponly';
      }
      
      if (config.sameSite) {
        cookieString += `; samesite=${config.sameSite}`;
      }

      document.cookie = cookieString;
      return { success: true, data: value };
    } catch (error) {
      const errorMessage = `Failed to set cookie "${name}": ${
        error instanceof Error ? error.message : 'Unknown error'
      }`;
      
      console.error(errorMessage, error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Gets a cookie value
   * @param name - Cookie name
   * @param options - Storage options including default value
   * @returns Cookie value or default
   */
  static getCookie(
    name: string,
    options: StorageOptions = {}
  ): StorageResult<string> {
    if (!isBrowser) {
      return {
        success: false,
        data: options.defaultValue,
        error: 'Cookies not available in SSR'
      };
    }

    try {
      const nameEQ = name + '=';
      const cookies = document.cookie.split(';');
      
      for (let cookie of cookies) {
        let c = cookie.trim();
        if (c.indexOf(nameEQ) === 0) {
          const value = decodeURIComponent(c.substring(nameEQ.length));
          return { success: true, data: value };
        }
      }
      
      return {
        success: true,
        data: options.defaultValue,
      };
    } catch (error) {
      const errorMessage = `Failed to get cookie "${name}": ${
        error instanceof Error ? error.message : 'Unknown error'
      }`;
      
      if (options.logErrors) {
        console.error(errorMessage, error);
      }
      
      return {
        success: false,
        data: options.defaultValue,
        error: errorMessage
      };
    }
  }

  /**
   * Removes a cookie
   * @param name - Cookie name to remove
   * @param options - Cookie options (path and domain should match the original)
   * @returns Success status
   */
  static removeCookie(
    name: string,
    options: Pick<CookieOptions, 'path' | 'domain'> = {}
  ): StorageResult<void> {
    if (!isBrowser) {
      return { success: false, error: 'Cookies not available in SSR' };
    }

    try {
      const config = { ...this.defaultOptions, ...options };
      let cookieString = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC`;
      
      if (config.path) {
        cookieString += `; path=${config.path}`;
      }
      
      if (config.domain) {
        cookieString += `; domain=${config.domain}`;
      }

      document.cookie = cookieString;
      return { success: true };
    } catch (error) {
      const errorMessage = `Failed to remove cookie "${name}": ${
        error instanceof Error ? error.message : 'Unknown error'
      }`;
      
      console.error(errorMessage, error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Checks if a cookie exists
   * @param name - Cookie name to check
   * @returns True if cookie exists
   */
  static hasCookie(name: string): boolean {
    if (!isBrowser) {
      return false;
    }

    try {
      const result = this.getCookie(name);
      return result.success && result.data !== undefined;
    } catch (error) {
      console.error(`Failed to check cookie "${name}":`, error);
      return false;
    }
  }

  /**
   * Gets all cookie names
   * @returns Array of cookie names
   */
  static getCookieNames(): string[] {
    if (!isBrowser) {
      return [];
    }

    try {
      const cookies = document.cookie.split(';');
      return cookies
        .map(cookie => cookie.trim().split('=')[0])
        .filter(name => name.length > 0);
    } catch (error) {
      console.error('Failed to get cookie names:', error);
      return [];
    }
  }

  /**
   * Sets a JSON object as a cookie with automatic serialization
   * @param name - Cookie name
   * @param value - Object to store (will be JSON stringified)
   * @param options - Cookie options
   * @returns Success status
   */
  static setJSONCookie<T>(
    name: string,
    value: T,
    options: CookieOptions = {}
  ): StorageResult<T> {
    try {
      const serializedValue = JSON.stringify(value);
      const result = this.setCookie(name, serializedValue, options);
      
      if (result.success) {
        return { success: true, data: value };
      }
      
      return { success: false, error: result.error };
    } catch (error) {
      const errorMessage = `Failed to set JSON cookie "${name}": ${
        error instanceof Error ? error.message : 'Unknown error'
      }`;
      
      console.error(errorMessage, error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Gets a JSON object from a cookie with automatic parsing
   * @param name - Cookie name
   * @param options - Storage options including default value
   * @returns Parsed object or default
   */
  static getJSONCookie<T>(
    name: string,
    options: StorageOptions = {}
  ): StorageResult<T> {
    try {
      const result = this.getCookie(name, options);
      
      if (!result.success || result.data === undefined) {
        return {
          success: result.success,
          data: options.defaultValue,
          error: result.error
        };
      }

      const parsedValue = JSON.parse(result.data) as T;
      return { success: true, data: parsedValue };
    } catch (error) {
      const errorMessage = `Failed to get JSON cookie "${name}": ${
        error instanceof Error ? error.message : 'Unknown error'
      }`;
      
      if (options.logErrors) {
        console.error(errorMessage, error);
      }
      
      return {
        success: false,
        data: options.defaultValue,
        error: errorMessage
      };
    }
  }
}

/**
 * Unified storage interface providing convenience methods for common storage operations
 */
export class Storage {
  /**
   * Clears all client-side storage (localStorage, sessionStorage, and specific cookies)
   * Useful for logout scenarios where all user data should be removed
   * @param cookiesToClear - Array of cookie names to remove
   * @param options - Storage options
   * @returns Success status
   */
  static clearAll(
    cookiesToClear: string[] = [],
    options: StorageOptions = {}
  ): StorageResult<void> {
    const results = [];

    // Clear localStorage
    const localResult = LocalStorage.clear(options);
    results.push(localResult);

    // Clear sessionStorage
    const sessionResult = SessionStorage.clear(options);
    results.push(sessionResult);

    // Clear specified cookies
    cookiesToClear.forEach(cookieName => {
      const cookieResult = CookieStorage.removeCookie(cookieName);
      results.push(cookieResult);
    });

    const hasErrors = results.some(result => !result.success);
    
    if (hasErrors) {
      const errors = results
        .filter(result => !result.success)
        .map(result => result.error)
        .join('; ');
      
      return { success: false, error: `Storage clear errors: ${errors}` };
    }

    return { success: true };
  }

  /**
   * Checks storage availability and quota
   * @returns Storage information and availability
   */
  static getStorageInfo(): {
    available: boolean;
    localStorage: boolean;
    sessionStorage: boolean;
    cookies: boolean;
    quota?: StorageEstimate;
  } {
    const info = {
      available: isBrowser,
      localStorage: false,
      sessionStorage: false,
      cookies: false,
      quota: undefined as StorageEstimate | undefined,
    };

    if (!isBrowser) {
      return info;
    }

    // Check localStorage
    try {
      window.localStorage.setItem('test', 'test');
      window.localStorage.removeItem('test');
      info.localStorage = true;
    } catch (error) {
      console.warn('localStorage not available:', error);
    }

    // Check sessionStorage
    try {
      window.sessionStorage.setItem('test', 'test');
      window.sessionStorage.removeItem('test');
      info.sessionStorage = true;
    } catch (error) {
      console.warn('sessionStorage not available:', error);
    }

    // Check cookies
    try {
      document.cookie = 'test=test; path=/';
      info.cookies = document.cookie.includes('test=test');
      document.cookie = 'test=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
    } catch (error) {
      console.warn('Cookies not available:', error);
    }

    // Get storage quota (if available)
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      navigator.storage.estimate().then(estimate => {
        info.quota = estimate;
      }).catch(error => {
        console.warn('Storage quota estimation failed:', error);
      });
    }

    return info;
  }
}

/**
 * Constants for common storage keys used throughout the application
 */
export const STORAGE_KEYS = {
  // Session and authentication
  SESSION_TOKEN: 'df_session_token',
  REFRESH_TOKEN: 'df_refresh_token',
  USER_DATA: 'df_user_data',
  USER_PREFERENCES: 'df_user_preferences',
  
  // UI state
  SIDEBAR_COLLAPSED: 'df_sidebar_collapsed',
  THEME_PREFERENCE: 'df_theme',
  LAST_VISITED_ROUTE: 'df_last_route',
  
  // Application state
  API_CONNECTIONS: 'df_api_connections',
  RECENT_DATABASES: 'df_recent_databases',
  FORM_DRAFTS: 'df_form_drafts',
  
  // Temporary session data
  TEMP_CONFIG: 'df_temp_config',
  WIZARD_STATE: 'df_wizard_state',
  CONNECTION_TEST_RESULTS: 'df_connection_tests',
} as const;

/**
 * Type for storage keys to ensure type safety
 */
export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

/**
 * Convenience functions for common storage operations with predefined keys
 */
export const storageHelpers = {
  // Session management
  setSessionToken: (token: string, options?: CookieOptions) =>
    CookieStorage.setCookie(STORAGE_KEYS.SESSION_TOKEN, token, {
      ...options,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1, // 1 day for session tokens
    }),

  getSessionToken: (options?: StorageOptions) =>
    CookieStorage.getCookie(STORAGE_KEYS.SESSION_TOKEN, options),

  clearSessionToken: () =>
    CookieStorage.removeCookie(STORAGE_KEYS.SESSION_TOKEN),

  // User preferences
  setUserPreferences: <T>(preferences: T, options?: StorageOptions) =>
    LocalStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, preferences, options),

  getUserPreferences: <T>(options?: StorageOptions) =>
    LocalStorage.getItem<T>(STORAGE_KEYS.USER_PREFERENCES, options),

  // Theme management
  setTheme: (theme: string, options?: StorageOptions) =>
    LocalStorage.setItem(STORAGE_KEYS.THEME_PREFERENCE, theme, options),

  getTheme: (options?: StorageOptions) =>
    LocalStorage.getItem<string>(STORAGE_KEYS.THEME_PREFERENCE, {
      defaultValue: 'light',
      ...options,
    }),

  // Temporary session data
  setTempData: <T>(key: string, data: T, options?: StorageOptions) =>
    SessionStorage.setItem(key, data, options),

  getTempData: <T>(key: string, options?: StorageOptions) =>
    SessionStorage.getItem<T>(key, options),

  clearTempData: (key: string, options?: StorageOptions) =>
    SessionStorage.removeItem(key, options),
};

export default {
  LocalStorage,
  SessionStorage,
  CookieStorage,
  Storage,
  storageHelpers,
  STORAGE_KEYS,
  isBrowser,
};