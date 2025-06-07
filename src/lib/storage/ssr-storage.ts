/**
 * SSR-Safe React Storage Hooks for DreamFactory Admin Interface
 * 
 * Provides useLocalStorage, useSessionStorage, and useCookies hooks with proper
 * hydration handling and client-side-only storage access. Replaces Angular
 * BehaviorSubject patterns with React hooks that work seamlessly with Next.js
 * server-side rendering.
 * 
 * Key Features:
 * - SSR compatibility with proper hydration handling
 * - Cross-tab storage synchronization via storage events
 * - Reactive state updates using React's useState
 * - Type-safe storage operations with error handling
 * - Session token management compatible with Next.js middleware
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  LocalStorage, 
  SessionStorage, 
  CookieStorage, 
  isBrowser,
  type StorageOptions,
  type CookieOptions,
  type StorageResult 
} from './storage-utils';
import { 
  type StorageKey, 
  type StorageHookState,
  type UserSession,
  STORAGE_KEYS 
} from './types';

// =============================================================================
// Hook Options and Configuration
// =============================================================================

/**
 * Configuration options for storage hooks
 */
export interface StorageHookOptions<T> extends StorageOptions {
  /** Default value to return during SSR and when key doesn't exist */
  defaultValue?: T;
  /** Whether to enable cross-tab synchronization */
  syncTabs?: boolean;
  /** Custom serializer for complex objects */
  serializer?: {
    serialize: (value: T) => string;
    deserialize: (value: string) => T;
  };
  /** Whether to enable debug logging */
  debug?: boolean;
  /** Delay in ms before initializing to avoid hydration mismatches */
  initDelay?: number;
}

/**
 * Cookie-specific options extending storage hook options
 */
export interface CookieHookOptions<T> extends StorageHookOptions<T> {
  /** Cookie configuration options */
  cookieOptions?: CookieOptions;
}

// =============================================================================
// Hydration Helper Hook
// =============================================================================

/**
 * Custom hook to handle SSR hydration safely
 * Prevents hydration mismatches by delaying client-side storage access
 */
function useSSRSafeHydration(initDelay: number = 0): boolean {
  const [isHydrated, setIsHydrated] = useState(false);
  
  useEffect(() => {
    if (initDelay > 0) {
      const timer = setTimeout(() => {
        setIsHydrated(true);
      }, initDelay);
      return () => clearTimeout(timer);
    } else {
      setIsHydrated(true);
    }
  }, [initDelay]);
  
  return isHydrated && isBrowser;
}

// =============================================================================
// Storage Event Management
// =============================================================================

/**
 * Hook for managing storage event listeners across tabs
 */
function useStorageEventListener<T>(
  key: string,
  onStorageChange: (newValue: T, oldValue: T) => void,
  enabled: boolean = true
): void {
  const callbackRef = useRef(onStorageChange);
  callbackRef.current = onStorageChange;

  useEffect(() => {
    if (!enabled || !isBrowser) return;

    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key === key && event.storageArea === window.localStorage) {
        try {
          const oldValue = event.oldValue ? JSON.parse(event.oldValue) : null;
          const newValue = event.newValue ? JSON.parse(event.newValue) : null;
          callbackRef.current(newValue, oldValue);
        } catch (error) {
          console.warn(`Failed to parse storage event for key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageEvent);
    return () => window.removeEventListener('storage', handleStorageEvent);
  }, [key, enabled]);
}

// =============================================================================
// useLocalStorage Hook
// =============================================================================

/**
 * SSR-safe localStorage hook with cross-tab synchronization
 * Replaces Angular BehaviorSubject patterns with reactive React state
 * 
 * @param key - Storage key to manage
 * @param options - Configuration options including default value and sync settings
 * @returns Hook state with value, loading, error, and control functions
 */
export function useLocalStorage<T = any>(
  key: string,
  options: StorageHookOptions<T> = {}
): StorageHookState<T> {
  const {
    defaultValue,
    syncTabs = true,
    debug = false,
    initDelay = 0,
    logErrors = true,
    serializer,
    ...storageOptions
  } = options;

  const isHydrated = useSSRSafeHydration(initDelay);
  const [state, setState] = useState<{
    value: T;
    loading: boolean;
    error: string | null;
  }>({
    value: defaultValue as T,
    loading: !isHydrated,
    error: null,
  });

  // Initialize storage value after hydration
  useEffect(() => {
    if (!isHydrated) return;

    const loadStoredValue = () => {
      try {
        const result = LocalStorage.getItem<T>(key, {
          defaultValue,
          logErrors,
          ...storageOptions,
        });

        if (debug) {
          console.log(`[useLocalStorage] Loaded key "${key}":`, result);
        }

        setState({
          value: result.success ? result.data! : defaultValue as T,
          loading: false,
          error: result.success ? null : result.error || 'Failed to load from storage',
        });
      } catch (error) {
        const errorMessage = `Failed to initialize localStorage for key "${key}": ${
          error instanceof Error ? error.message : 'Unknown error'
        }`;
        
        if (logErrors) {
          console.error(errorMessage, error);
        }

        setState({
          value: defaultValue as T,
          loading: false,
          error: errorMessage,
        });
      }
    };

    loadStoredValue();
  }, [isHydrated, key, defaultValue, debug, logErrors, JSON.stringify(storageOptions)]);

  // Handle cross-tab synchronization
  useStorageEventListener<T>(
    key,
    useCallback((newValue: T) => {
      if (debug) {
        console.log(`[useLocalStorage] Cross-tab update for key "${key}":`, newValue);
      }
      setState(prev => ({
        ...prev,
        value: newValue ?? defaultValue as T,
        error: null,
      }));
    }, [key, defaultValue, debug]),
    syncTabs && isHydrated
  );

  // Set value function with optimistic updates
  const setValue = useCallback((newValue: T) => {
    if (!isHydrated) {
      console.warn(`[useLocalStorage] Attempted to set value before hydration for key "${key}"`);
      return;
    }

    try {
      // Optimistic update
      setState(prev => ({
        ...prev,
        value: newValue,
        error: null,
      }));

      // Persist to storage
      const result = LocalStorage.setItem<T>(key, newValue, {
        logErrors,
        ...storageOptions,
      });

      if (!result.success) {
        // Rollback optimistic update on failure
        setState(prev => ({
          ...prev,
          value: prev.value, // Keep previous value
          error: result.error || 'Failed to save to storage',
        }));
      } else if (debug) {
        console.log(`[useLocalStorage] Set key "${key}":`, newValue);
      }
    } catch (error) {
      const errorMessage = `Failed to set localStorage value for key "${key}": ${
        error instanceof Error ? error.message : 'Unknown error'
      }`;
      
      if (logErrors) {
        console.error(errorMessage, error);
      }

      setState(prev => ({
        ...prev,
        error: errorMessage,
      }));
    }
  }, [isHydrated, key, debug, logErrors, JSON.stringify(storageOptions)]);

  // Remove value function
  const removeValue = useCallback(() => {
    if (!isHydrated) {
      console.warn(`[useLocalStorage] Attempted to remove value before hydration for key "${key}"`);
      return;
    }

    try {
      const result = LocalStorage.removeItem(key, { logErrors, ...storageOptions });
      
      setState({
        value: defaultValue as T,
        loading: false,
        error: result.success ? null : result.error || 'Failed to remove from storage',
      });

      if (debug && result.success) {
        console.log(`[useLocalStorage] Removed key "${key}"`);
      }
    } catch (error) {
      const errorMessage = `Failed to remove localStorage value for key "${key}": ${
        error instanceof Error ? error.message : 'Unknown error'
      }`;
      
      if (logErrors) {
        console.error(errorMessage, error);
      }

      setState(prev => ({
        ...prev,
        error: errorMessage,
      }));
    }
  }, [isHydrated, key, defaultValue, debug, logErrors, JSON.stringify(storageOptions)]);

  // Refresh value from storage
  const refresh = useCallback(() => {
    if (!isHydrated) return;

    try {
      const result = LocalStorage.getItem<T>(key, {
        defaultValue,
        logErrors,
        ...storageOptions,
      });

      setState({
        value: result.success ? result.data! : defaultValue as T,
        loading: false,
        error: result.success ? null : result.error || 'Failed to refresh from storage',
      });

      if (debug) {
        console.log(`[useLocalStorage] Refreshed key "${key}":`, result);
      }
    } catch (error) {
      const errorMessage = `Failed to refresh localStorage value for key "${key}": ${
        error instanceof Error ? error.message : 'Unknown error'
      }`;
      
      if (logErrors) {
        console.error(errorMessage, error);
      }

      setState(prev => ({
        ...prev,
        error: errorMessage,
      }));
    }
  }, [isHydrated, key, defaultValue, debug, logErrors, JSON.stringify(storageOptions)]);

  return {
    value: state.value,
    loading: state.loading,
    error: state.error,
    setValue,
    removeValue,
    refresh,
  };
}

// =============================================================================
// useSessionStorage Hook
// =============================================================================

/**
 * SSR-safe sessionStorage hook for temporary storage needs
 * Provides reactive state management for session-scoped data
 * 
 * @param key - Storage key to manage
 * @param options - Configuration options including default value
 * @returns Hook state with value, loading, error, and control functions
 */
export function useSessionStorage<T = any>(
  key: string,
  options: StorageHookOptions<T> = {}
): StorageHookState<T> {
  const {
    defaultValue,
    debug = false,
    initDelay = 0,
    logErrors = true,
    ...storageOptions
  } = options;

  const isHydrated = useSSRSafeHydration(initDelay);
  const [state, setState] = useState<{
    value: T;
    loading: boolean;
    error: string | null;
  }>({
    value: defaultValue as T,
    loading: !isHydrated,
    error: null,
  });

  // Initialize storage value after hydration
  useEffect(() => {
    if (!isHydrated) return;

    try {
      const result = SessionStorage.getItem<T>(key, {
        defaultValue,
        logErrors,
        ...storageOptions,
      });

      if (debug) {
        console.log(`[useSessionStorage] Loaded key "${key}":`, result);
      }

      setState({
        value: result.success ? result.data! : defaultValue as T,
        loading: false,
        error: result.success ? null : result.error || 'Failed to load from session storage',
      });
    } catch (error) {
      const errorMessage = `Failed to initialize sessionStorage for key "${key}": ${
        error instanceof Error ? error.message : 'Unknown error'
      }`;
      
      if (logErrors) {
        console.error(errorMessage, error);
      }

      setState({
        value: defaultValue as T,
        loading: false,
        error: errorMessage,
      });
    }
  }, [isHydrated, key, defaultValue, debug, logErrors, JSON.stringify(storageOptions)]);

  // Set value function
  const setValue = useCallback((newValue: T) => {
    if (!isHydrated) {
      console.warn(`[useSessionStorage] Attempted to set value before hydration for key "${key}"`);
      return;
    }

    try {
      setState(prev => ({
        ...prev,
        value: newValue,
        error: null,
      }));

      const result = SessionStorage.setItem<T>(key, newValue, {
        logErrors,
        ...storageOptions,
      });

      if (!result.success) {
        setState(prev => ({
          ...prev,
          error: result.error || 'Failed to save to session storage',
        }));
      } else if (debug) {
        console.log(`[useSessionStorage] Set key "${key}":`, newValue);
      }
    } catch (error) {
      const errorMessage = `Failed to set sessionStorage value for key "${key}": ${
        error instanceof Error ? error.message : 'Unknown error'
      }`;
      
      if (logErrors) {
        console.error(errorMessage, error);
      }

      setState(prev => ({
        ...prev,
        error: errorMessage,
      }));
    }
  }, [isHydrated, key, debug, logErrors, JSON.stringify(storageOptions)]);

  // Remove value function
  const removeValue = useCallback(() => {
    if (!isHydrated) {
      console.warn(`[useSessionStorage] Attempted to remove value before hydration for key "${key}"`);
      return;
    }

    try {
      const result = SessionStorage.removeItem(key, { logErrors, ...storageOptions });
      
      setState({
        value: defaultValue as T,
        loading: false,
        error: result.success ? null : result.error || 'Failed to remove from session storage',
      });

      if (debug && result.success) {
        console.log(`[useSessionStorage] Removed key "${key}"`);
      }
    } catch (error) {
      const errorMessage = `Failed to remove sessionStorage value for key "${key}": ${
        error instanceof Error ? error.message : 'Unknown error'
      }`;
      
      if (logErrors) {
        console.error(errorMessage, error);
      }

      setState(prev => ({
        ...prev,
        error: errorMessage,
      }));
    }
  }, [isHydrated, key, defaultValue, debug, logErrors, JSON.stringify(storageOptions)]);

  // Refresh value from storage
  const refresh = useCallback(() => {
    if (!isHydrated) return;

    try {
      const result = SessionStorage.getItem<T>(key, {
        defaultValue,
        logErrors,
        ...storageOptions,
      });

      setState({
        value: result.success ? result.data! : defaultValue as T,
        loading: false,
        error: result.success ? null : result.error || 'Failed to refresh from session storage',
      });

      if (debug) {
        console.log(`[useSessionStorage] Refreshed key "${key}":`, result);
      }
    } catch (error) {
      const errorMessage = `Failed to refresh sessionStorage value for key "${key}": ${
        error instanceof Error ? error.message : 'Unknown error'
      }`;
      
      if (logErrors) {
        console.error(errorMessage, error);
      }

      setState(prev => ({
        ...prev,
        error: errorMessage,
      }));
    }
  }, [isHydrated, key, defaultValue, debug, logErrors, JSON.stringify(storageOptions)]);

  return {
    value: state.value,
    loading: state.loading,
    error: state.error,
    setValue,
    removeValue,
    refresh,
  };
}

// =============================================================================
// useCookies Hook
// =============================================================================

/**
 * SSR-safe cookie management hook with Next.js middleware support
 * Optimized for session token management and authentication state
 * 
 * @param name - Cookie name to manage
 * @param options - Configuration options including default value and cookie settings
 * @returns Hook state with value, loading, error, and control functions
 */
export function useCookies<T = string>(
  name: string,
  options: CookieHookOptions<T> = {}
): StorageHookState<T> {
  const {
    defaultValue,
    cookieOptions = {},
    debug = false,
    initDelay = 0,
    logErrors = true,
    ...storageOptions
  } = options;

  const isHydrated = useSSRSafeHydration(initDelay);
  const [state, setState] = useState<{
    value: T;
    loading: boolean;
    error: string | null;
  }>({
    value: defaultValue as T,
    loading: !isHydrated,
    error: null,
  });

  // Default cookie options for security
  const secureOptions: CookieOptions = {
    maxAge: 1, // 1 day default
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    httpOnly: false, // Allow client access for React hooks
    ...cookieOptions,
  };

  // Initialize cookie value after hydration
  useEffect(() => {
    if (!isHydrated) return;

    try {
      const result = CookieStorage.getCookie(name, {
        defaultValue: defaultValue as string,
        logErrors,
        ...storageOptions,
      });

      if (debug) {
        console.log(`[useCookies] Loaded cookie "${name}":`, result);
      }

      let parsedValue: T;
      if (typeof result.data === 'string' && result.data !== defaultValue) {
        try {
          // Try to parse as JSON for complex objects
          parsedValue = JSON.parse(result.data) as T;
        } catch {
          // If parsing fails, use as-is (for simple strings)
          parsedValue = result.data as T;
        }
      } else {
        parsedValue = result.data as T;
      }

      setState({
        value: result.success ? parsedValue : defaultValue as T,
        loading: false,
        error: result.success ? null : result.error || 'Failed to load cookie',
      });
    } catch (error) {
      const errorMessage = `Failed to initialize cookie "${name}": ${
        error instanceof Error ? error.message : 'Unknown error'
      }`;
      
      if (logErrors) {
        console.error(errorMessage, error);
      }

      setState({
        value: defaultValue as T,
        loading: false,
        error: errorMessage,
      });
    }
  }, [isHydrated, name, defaultValue, debug, logErrors]);

  // Set cookie value function
  const setValue = useCallback((newValue: T) => {
    if (!isHydrated) {
      console.warn(`[useCookies] Attempted to set cookie before hydration for "${name}"`);
      return;
    }

    try {
      setState(prev => ({
        ...prev,
        value: newValue,
        error: null,
      }));

      // Serialize value for cookie storage
      const serializedValue = typeof newValue === 'string' 
        ? newValue 
        : JSON.stringify(newValue);

      const result = CookieStorage.setCookie(name, serializedValue, secureOptions);

      if (!result.success) {
        setState(prev => ({
          ...prev,
          error: result.error || 'Failed to save cookie',
        }));
      } else if (debug) {
        console.log(`[useCookies] Set cookie "${name}":`, newValue);
      }
    } catch (error) {
      const errorMessage = `Failed to set cookie "${name}": ${
        error instanceof Error ? error.message : 'Unknown error'
      }`;
      
      if (logErrors) {
        console.error(errorMessage, error);
      }

      setState(prev => ({
        ...prev,
        error: errorMessage,
      }));
    }
  }, [isHydrated, name, debug, logErrors, secureOptions]);

  // Remove cookie function
  const removeValue = useCallback(() => {
    if (!isHydrated) {
      console.warn(`[useCookies] Attempted to remove cookie before hydration for "${name}"`);
      return;
    }

    try {
      const result = CookieStorage.removeCookie(name, {
        path: secureOptions.path,
        domain: secureOptions.domain,
      });
      
      setState({
        value: defaultValue as T,
        loading: false,
        error: result.success ? null : result.error || 'Failed to remove cookie',
      });

      if (debug && result.success) {
        console.log(`[useCookies] Removed cookie "${name}"`);
      }
    } catch (error) {
      const errorMessage = `Failed to remove cookie "${name}": ${
        error instanceof Error ? error.message : 'Unknown error'
      }`;
      
      if (logErrors) {
        console.error(errorMessage, error);
      }

      setState(prev => ({
        ...prev,
        error: errorMessage,
      }));
    }
  }, [isHydrated, name, defaultValue, debug, logErrors, secureOptions.path, secureOptions.domain]);

  // Refresh cookie value
  const refresh = useCallback(() => {
    if (!isHydrated) return;

    try {
      const result = CookieStorage.getCookie(name, {
        defaultValue: defaultValue as string,
        logErrors,
        ...storageOptions,
      });

      let parsedValue: T;
      if (typeof result.data === 'string' && result.data !== defaultValue) {
        try {
          parsedValue = JSON.parse(result.data) as T;
        } catch {
          parsedValue = result.data as T;
        }
      } else {
        parsedValue = result.data as T;
      }

      setState({
        value: result.success ? parsedValue : defaultValue as T,
        loading: false,
        error: result.success ? null : result.error || 'Failed to refresh cookie',
      });

      if (debug) {
        console.log(`[useCookies] Refreshed cookie "${name}":`, result);
      }
    } catch (error) {
      const errorMessage = `Failed to refresh cookie "${name}": ${
        error instanceof Error ? error.message : 'Unknown error'
      }`;
      
      if (logErrors) {
        console.error(errorMessage, error);
      }

      setState(prev => ({
        ...prev,
        error: errorMessage,
      }));
    }
  }, [isHydrated, name, defaultValue, debug, logErrors]);

  return {
    value: state.value,
    loading: state.loading,
    error: state.error,
    setValue,
    removeValue,
    refresh,
  };
}

// =============================================================================
// Convenience Hooks for Common Use Cases
// =============================================================================

/**
 * Hook for managing session token with Next.js middleware compatibility
 * Provides secure cookie storage with strict SameSite policy
 */
export function useSessionToken(): StorageHookState<string> {
  return useCookies<string>(STORAGE_KEYS.SESSION_TOKEN, {
    defaultValue: '',
    cookieOptions: {
      maxAge: 1, // 1 day
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      httpOnly: false, // Allow client access for React hooks
    },
    debug: process.env.NODE_ENV === 'development',
  });
}

/**
 * Hook for managing user session data in localStorage
 * Provides reactive updates for authentication state
 */
export function useUserSession(): StorageHookState<UserSession | null> {
  return useLocalStorage<UserSession | null>(STORAGE_KEYS.CURRENT_USER, {
    defaultValue: null,
    syncTabs: true,
    debug: process.env.NODE_ENV === 'development',
  });
}

/**
 * Hook for managing theme preference in localStorage
 * Supports cross-tab synchronization for consistent theming
 */
export function useThemePreference(): StorageHookState<'light' | 'dark' | 'system'> {
  return useLocalStorage<'light' | 'dark' | 'system'>(STORAGE_KEYS.IS_DARK_MODE, {
    defaultValue: 'light',
    syncTabs: true,
    debug: process.env.NODE_ENV === 'development',
  });
}

/**
 * Hook for managing current service ID in localStorage
 * Maintains service selection across sessions
 */
export function useCurrentServiceId(): StorageHookState<number> {
  return useLocalStorage<number>(STORAGE_KEYS.CURRENT_SERVICE_ID, {
    defaultValue: -1,
    syncTabs: true,
    debug: process.env.NODE_ENV === 'development',
  });
}

/**
 * Hook for managing temporary wizard or form state in sessionStorage
 * Automatically cleared when tab/browser is closed
 */
export function useTempFormState<T = any>(key: string): StorageHookState<T> {
  return useSessionStorage<T>(`temp_${key}`, {
    defaultValue: null as T,
    debug: process.env.NODE_ENV === 'development',
  });
}

// =============================================================================
// Utility Functions for Storage Management
// =============================================================================

/**
 * Clear all application storage (localStorage, sessionStorage, and cookies)
 * Useful for logout scenarios or development reset
 */
export function clearAllStorage(): Promise<void> {
  return new Promise((resolve) => {
    if (!isBrowser) {
      resolve();
      return;
    }

    try {
      // Clear localStorage
      window.localStorage.clear();
      
      // Clear sessionStorage
      window.sessionStorage.clear();
      
      // Clear specific cookies
      const cookiesToClear = [
        STORAGE_KEYS.SESSION_TOKEN,
        STORAGE_KEYS.CURRENT_USER,
      ];
      
      cookiesToClear.forEach(cookieName => {
        CookieStorage.removeCookie(cookieName);
      });
      
      console.log('[SSR Storage] Cleared all application storage');
      resolve();
    } catch (error) {
      console.error('[SSR Storage] Failed to clear storage:', error);
      resolve(); // Don't reject to prevent app crashes
    }
  });
}

/**
 * Check if storage is available and working correctly
 * Returns capability information for debugging and monitoring
 */
export function getStorageCapabilities(): {
  localStorage: boolean;
  sessionStorage: boolean;
  cookies: boolean;
  crossTabSync: boolean;
  hydrated: boolean;
} {
  if (!isBrowser) {
    return {
      localStorage: false,
      sessionStorage: false,
      cookies: false,
      crossTabSync: false,
      hydrated: false,
    };
  }

  let localStorage = false;
  let sessionStorage = false;
  let cookies = false;

  // Test localStorage
  try {
    window.localStorage.setItem('test', 'test');
    window.localStorage.removeItem('test');
    localStorage = true;
  } catch {
    localStorage = false;
  }

  // Test sessionStorage
  try {
    window.sessionStorage.setItem('test', 'test');
    window.sessionStorage.removeItem('test');
    sessionStorage = true;
  } catch {
    sessionStorage = false;
  }

  // Test cookies
  try {
    document.cookie = 'test=test; path=/';
    cookies = document.cookie.includes('test=test');
    document.cookie = 'test=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
  } catch {
    cookies = false;
  }

  return {
    localStorage,
    sessionStorage,
    cookies,
    crossTabSync: localStorage && 'onstorage' in window,
    hydrated: true,
  };
}

// =============================================================================
// Export All Hooks and Utilities
// =============================================================================

export type {
  StorageHookOptions,
  CookieHookOptions,
  StorageHookState,
};

export {
  // Core hooks
  useLocalStorage,
  useSessionStorage,
  useCookies,
  
  // Convenience hooks
  useSessionToken,
  useUserSession,
  useThemePreference,
  useCurrentServiceId,
  useTempFormState,
  
  // Utilities
  clearAllStorage,
  getStorageCapabilities,
  
  // Re-export from dependencies
  STORAGE_KEYS,
};