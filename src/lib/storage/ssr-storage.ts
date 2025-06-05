/**
 * SSR-safe React hooks for storage operations that work correctly with Next.js
 * server-side rendering. Provides useLocalStorage, useSessionStorage, and useCookies
 * hooks with proper hydration handling and client-side-only storage access.
 * 
 * This module replaces Angular BehaviorSubject patterns with React hooks while
 * ensuring compatibility with Next.js SSR and preventing hydration mismatches.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// Types for storage operations
interface StorageHookOptions<T> {
  defaultValue: T;
  serializer?: {
    serialize: (value: T) => string;
    deserialize: (value: string) => T;
  };
  syncAcrossTabs?: boolean;
}

interface CookieOptions {
  maxAge?: number;
  expires?: Date;
  path?: string;
  domain?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

// Custom serializer for complex objects
const createSerializer = <T>() => ({
  serialize: (value: T): string => {
    try {
      return JSON.stringify(value);
    } catch (error) {
      console.warn('Storage serialization error:', error);
      return String(value);
    }
  },
  deserialize: (value: string): T => {
    try {
      return JSON.parse(value);
    } catch (error) {
      // Return the raw value if JSON parsing fails
      return value as unknown as T;
    }
  },
});

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Check if storage is available and accessible
const isStorageAvailable = (storage: Storage): boolean => {
  if (!isBrowser) return false;
  
  try {
    const testKey = '__storage_test__';
    storage.setItem(testKey, 'test');
    storage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

/**
 * SSR-safe localStorage hook with cross-tab synchronization
 * Replaces Angular BehaviorSubject localStorage patterns
 */
export function useLocalStorage<T>(
  key: string,
  options: StorageHookOptions<T>
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const { defaultValue, serializer = createSerializer<T>(), syncAcrossTabs = true } = options;
  
  // Track if component has hydrated to prevent SSR mismatches
  const [isHydrated, setIsHydrated] = useState(false);
  const [storedValue, setStoredValue] = useState<T>(defaultValue);
  const suppressStorageEvent = useRef(false);

  // Initialize value after hydration
  useEffect(() => {
    if (!isBrowser || !isStorageAvailable(localStorage)) {
      setIsHydrated(true);
      return;
    }

    try {
      const item = localStorage.getItem(key);
      if (item !== null) {
        setStoredValue(serializer.deserialize(item));
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
    }
    
    setIsHydrated(true);
  }, [key, serializer]);

  // Set up storage event listener for cross-tab synchronization
  useEffect(() => {
    if (!isBrowser || !syncAcrossTabs || !isStorageAvailable(localStorage)) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null && !suppressStorageEvent.current) {
        try {
          const newValue = serializer.deserialize(e.newValue);
          setStoredValue(newValue);
        } catch (error) {
          console.warn(`Error parsing storage event for key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, serializer, syncAcrossTabs]);

  // Update storage value
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    if (!isBrowser || !isStorageAvailable(localStorage)) {
      console.warn('localStorage is not available');
      return;
    }

    try {
      // Allow functional updates
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Prevent triggering storage event for this tab
      suppressStorageEvent.current = true;
      
      const serializedValue = serializer.serialize(valueToStore);
      localStorage.setItem(key, serializedValue);
      setStoredValue(valueToStore);
      
      // Re-enable storage events after a brief delay
      setTimeout(() => {
        suppressStorageEvent.current = false;
      }, 100);
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, serializer, storedValue]);

  // Remove value from storage
  const removeValue = useCallback(() => {
    if (!isBrowser || !isStorageAvailable(localStorage)) {
      console.warn('localStorage is not available');
      return;
    }

    try {
      suppressStorageEvent.current = true;
      localStorage.removeItem(key);
      setStoredValue(defaultValue);
      
      setTimeout(() => {
        suppressStorageEvent.current = false;
      }, 100);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, defaultValue]);

  // Return default value during SSR and before hydration
  if (!isHydrated) {
    return [defaultValue, setValue, removeValue];
  }

  return [storedValue, setValue, removeValue];
}

/**
 * SSR-safe sessionStorage hook for temporary storage needs
 * Provides session-scoped storage that's cleared when the tab is closed
 */
export function useSessionStorage<T>(
  key: string,
  options: StorageHookOptions<T>
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const { defaultValue, serializer = createSerializer<T>() } = options;
  
  const [isHydrated, setIsHydrated] = useState(false);
  const [storedValue, setStoredValue] = useState<T>(defaultValue);

  // Initialize value after hydration
  useEffect(() => {
    if (!isBrowser || !isStorageAvailable(sessionStorage)) {
      setIsHydrated(true);
      return;
    }

    try {
      const item = sessionStorage.getItem(key);
      if (item !== null) {
        setStoredValue(serializer.deserialize(item));
      }
    } catch (error) {
      console.warn(`Error reading sessionStorage key "${key}":`, error);
    }
    
    setIsHydrated(true);
  }, [key, serializer]);

  // Update storage value
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    if (!isBrowser || !isStorageAvailable(sessionStorage)) {
      console.warn('sessionStorage is not available');
      return;
    }

    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      const serializedValue = serializer.serialize(valueToStore);
      sessionStorage.setItem(key, serializedValue);
      setStoredValue(valueToStore);
    } catch (error) {
      console.error(`Error setting sessionStorage key "${key}":`, error);
    }
  }, [key, serializer, storedValue]);

  // Remove value from storage
  const removeValue = useCallback(() => {
    if (!isBrowser || !isStorageAvailable(sessionStorage)) {
      console.warn('sessionStorage is not available');
      return;
    }

    try {
      sessionStorage.removeItem(key);
      setStoredValue(defaultValue);
    } catch (error) {
      console.error(`Error removing sessionStorage key "${key}":`, error);
    }
  }, [key, defaultValue]);

  // Return default value during SSR and before hydration
  if (!isHydrated) {
    return [defaultValue, setValue, removeValue];
  }

  return [storedValue, setValue, removeValue];
}

/**
 * SSR-safe cookie management hook for session token management
 * Compatible with Next.js middleware for authentication workflows
 */
export function useCookies(): {
  getCookie: (name: string) => string | null;
  setCookie: (name: string, value: string, options?: CookieOptions) => void;
  removeCookie: (name: string, options?: Pick<CookieOptions, 'path' | 'domain'>) => void;
  getAllCookies: () => Record<string, string>;
} {
  const getCookie = useCallback((name: string): string | null => {
    if (!isBrowser) return null;

    try {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) {
        const cookieValue = parts.pop()?.split(';').shift();
        return cookieValue ? decodeURIComponent(cookieValue) : null;
      }
    } catch (error) {
      console.warn(`Error reading cookie "${name}":`, error);
    }
    
    return null;
  }, []);

  const setCookie = useCallback((
    name: string,
    value: string,
    options: CookieOptions = {}
  ) => {
    if (!isBrowser) {
      console.warn('Cannot set cookie during SSR');
      return;
    }

    try {
      const {
        maxAge,
        expires,
        path = '/',
        domain,
        secure = false,
        sameSite = 'strict'
      } = options;

      let cookieString = `${name}=${encodeURIComponent(value)}`;
      
      if (maxAge !== undefined) {
        cookieString += `; Max-Age=${maxAge}`;
      }
      
      if (expires) {
        cookieString += `; Expires=${expires.toUTCString()}`;
      }
      
      cookieString += `; Path=${path}`;
      
      if (domain) {
        cookieString += `; Domain=${domain}`;
      }
      
      if (secure) {
        cookieString += '; Secure';
      }
      
      cookieString += `; SameSite=${sameSite}`;
      
      document.cookie = cookieString;
    } catch (error) {
      console.error(`Error setting cookie "${name}":`, error);
    }
  }, []);

  const removeCookie = useCallback((
    name: string,
    options: Pick<CookieOptions, 'path' | 'domain'> = {}
  ) => {
    if (!isBrowser) {
      console.warn('Cannot remove cookie during SSR');
      return;
    }

    const { path = '/', domain } = options;
    
    try {
      let cookieString = `${name}=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=${path}`;
      
      if (domain) {
        cookieString += `; Domain=${domain}`;
      }
      
      document.cookie = cookieString;
    } catch (error) {
      console.error(`Error removing cookie "${name}":`, error);
    }
  }, []);

  const getAllCookies = useCallback((): Record<string, string> => {
    if (!isBrowser) return {};

    try {
      return document.cookie
        .split(';')
        .reduce((cookies, cookie) => {
          const [name, value] = cookie.trim().split('=');
          if (name && value) {
            cookies[name] = decodeURIComponent(value);
          }
          return cookies;
        }, {} as Record<string, string>);
    } catch (error) {
      console.warn('Error reading all cookies:', error);
      return {};
    }
  }, []);

  return {
    getCookie,
    setCookie,
    removeCookie,
    getAllCookies,
  };
}

/**
 * Hook for reactive cookie state with automatic updates
 * Useful for session token management and authentication state
 */
export function useCookieState(
  cookieName: string,
  defaultValue: string = '',
  options: CookieOptions = {}
): [string, (value: string) => void, () => void] {
  const [value, setValue] = useState<string>(defaultValue);
  const [isHydrated, setIsHydrated] = useState(false);
  const { getCookie, setCookie, removeCookie } = useCookies();

  // Initialize cookie value after hydration
  useEffect(() => {
    if (!isBrowser) {
      setIsHydrated(true);
      return;
    }

    const cookieValue = getCookie(cookieName);
    if (cookieValue !== null) {
      setValue(cookieValue);
    }
    
    setIsHydrated(true);
  }, [cookieName, getCookie]);

  // Update cookie value
  const updateValue = useCallback((newValue: string) => {
    setValue(newValue);
    setCookie(cookieName, newValue, {
      maxAge: 60 * 60 * 24 * 30, // 30 days default
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      ...options,
    });
  }, [cookieName, setCookie, options]);

  // Remove cookie
  const removeValue = useCallback(() => {
    setValue(defaultValue);
    removeCookie(cookieName, {
      path: options.path,
      domain: options.domain,
    });
  }, [cookieName, defaultValue, removeCookie, options.path, options.domain]);

  // Return default value during SSR and before hydration
  if (!isHydrated) {
    return [defaultValue, updateValue, removeValue];
  }

  return [value, updateValue, removeValue];
}

/**
 * Utility hook to check if the component has hydrated
 * Useful for conditional rendering of client-only content
 */
export function useIsHydrated(): boolean {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return isHydrated;
}

/**
 * Storage utility functions that can be used outside of React components
 * These provide fallback behavior for SSR environments
 */
export const storageUtils = {
  /**
   * Safe localStorage getter with SSR fallback
   */
  getLocalStorage: <T>(key: string, defaultValue: T, deserializer?: (value: string) => T): T => {
    if (!isBrowser || !isStorageAvailable(localStorage)) {
      return defaultValue;
    }

    try {
      const item = localStorage.getItem(key);
      if (item === null) return defaultValue;
      
      if (deserializer) {
        return deserializer(item);
      }
      
      return JSON.parse(item);
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  },

  /**
   * Safe localStorage setter with SSR fallback
   */
  setLocalStorage: <T>(key: string, value: T, serializer?: (value: T) => string): void => {
    if (!isBrowser || !isStorageAvailable(localStorage)) {
      console.warn('localStorage is not available');
      return;
    }

    try {
      const serializedValue = serializer ? serializer(value) : JSON.stringify(value);
      localStorage.setItem(key, serializedValue);
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  },

  /**
   * Safe sessionStorage getter with SSR fallback
   */
  getSessionStorage: <T>(key: string, defaultValue: T, deserializer?: (value: string) => T): T => {
    if (!isBrowser || !isStorageAvailable(sessionStorage)) {
      return defaultValue;
    }

    try {
      const item = sessionStorage.getItem(key);
      if (item === null) return defaultValue;
      
      if (deserializer) {
        return deserializer(item);
      }
      
      return JSON.parse(item);
    } catch (error) {
      console.warn(`Error reading sessionStorage key "${key}":`, error);
      return defaultValue;
    }
  },

  /**
   * Safe sessionStorage setter with SSR fallback
   */
  setSessionStorage: <T>(key: string, value: T, serializer?: (value: T) => string): void => {
    if (!isBrowser || !isStorageAvailable(sessionStorage)) {
      console.warn('sessionStorage is not available');
      return;
    }

    try {
      const serializedValue = serializer ? serializer(value) : JSON.stringify(value);
      sessionStorage.setItem(key, serializedValue);
    } catch (error) {
      console.error(`Error setting sessionStorage key "${key}":`, error);
    }
  },
};