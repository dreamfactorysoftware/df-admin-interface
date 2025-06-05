/**
 * LocalStorage Management Hook
 * 
 * Provides type-safe localStorage operations with automatic JSON serialization,
 * cross-tab synchronization via storage events, and comprehensive error handling.
 * Replaces Angular localStorage patterns with React state synchronization and
 * proper storage management for persistent application state.
 * 
 * @fileoverview Type-safe localStorage hook for the DreamFactory Admin Interface
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1+, TypeScript 5.8+
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// =============================================================================
// STORAGE TYPES AND INTERFACES
// =============================================================================

/**
 * Storage value wrapper with metadata for validation and migration
 */
export interface StorageValue<T = unknown> {
  /** The actual stored value */
  value: T;
  /** Timestamp when the value was stored */
  timestamp: number;
  /** Schema version for migration support */
  version: number;
  /** Optional expiration timestamp */
  expiresAt?: number;
  /** Value type for runtime validation */
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null';
}

/**
 * Storage configuration options
 */
export interface StorageOptions<T> {
  /** Default value if no stored value exists */
  defaultValue?: T;
  /** Enable cross-tab synchronization (default: true) */
  syncAcrossTabs?: boolean;
  /** Auto-serialize objects to JSON (default: true) */
  serialize?: boolean;
  /** Expiration time in milliseconds */
  expiresIn?: number;
  /** Schema version for migration support */
  version?: number;
  /** Custom serializer function */
  serializer?: {
    parse: (value: string) => T;
    stringify: (value: T) => string;
  };
  /** Migration function for schema updates */
  migrator?: (oldValue: StorageValue<any>, newVersion: number) => T;
  /** Validation function for stored values */
  validator?: (value: unknown) => value is T;
}

/**
 * Storage operation result
 */
export interface StorageResult<T> {
  /** Whether the operation was successful */
  success: boolean;
  /** The resulting value (if successful) */
  value?: T;
  /** Error message (if failed) */
  error?: string;
  /** Whether a migration was performed */
  migrated?: boolean;
}

/**
 * Storage error types
 */
export type StorageError = 
  | 'QUOTA_EXCEEDED'
  | 'INVALID_JSON'
  | 'EXPIRED_VALUE'
  | 'VALIDATION_FAILED'
  | 'MIGRATION_FAILED'
  | 'STORAGE_DISABLED'
  | 'CORRUPTION_DETECTED'
  | 'UNKNOWN_ERROR';

/**
 * Storage cleanup configuration
 */
export interface CleanupOptions {
  /** Remove expired items (default: true) */
  removeExpired?: boolean;
  /** Maximum age in milliseconds for cleanup */
  maxAge?: number;
  /** Pattern to match keys for cleanup */
  keyPattern?: RegExp;
  /** Force cleanup regardless of errors */
  force?: boolean;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Checks if localStorage is available and functional
 */
const isStorageAvailable = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, 'test');
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
};

/**
 * Safely parse JSON with error handling
 */
const safeParse = <T>(value: string, fallback: T): StorageResult<T> => {
  try {
    const parsed = JSON.parse(value);
    return { success: true, value: parsed };
  } catch (error) {
    return { 
      success: false, 
      error: 'INVALID_JSON',
      value: fallback 
    };
  }
};

/**
 * Detect the type of a value
 */
const getValueType = (value: unknown): StorageValue['type'] => {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value as StorageValue['type'];
};

/**
 * Validate storage quota and available space
 */
const checkStorageQuota = (): { available: boolean; error?: StorageError } => {
  if (!isStorageAvailable()) {
    return { available: false, error: 'STORAGE_DISABLED' };
  }

  try {
    // Test with a large string to check quota
    const testKey = '__quota_test__';
    const testValue = 'x'.repeat(1024 * 1024); // 1MB test
    localStorage.setItem(testKey, testValue);
    localStorage.removeItem(testKey);
    return { available: true };
  } catch (error) {
    if (error instanceof DOMException && error.code === 22) {
      return { available: false, error: 'QUOTA_EXCEEDED' };
    }
    return { available: false, error: 'UNKNOWN_ERROR' };
  }
};

/**
 * Generate a wrapped storage value with metadata
 */
const createStorageValue = <T>(
  value: T, 
  version: number = 1, 
  expiresIn?: number
): StorageValue<T> => ({
  value,
  timestamp: Date.now(),
  version,
  expiresAt: expiresIn ? Date.now() + expiresIn : undefined,
  type: getValueType(value),
});

// =============================================================================
// MAIN HOOK IMPLEMENTATION
// =============================================================================

/**
 * Type-safe localStorage hook with React state synchronization
 * 
 * @param key - Storage key
 * @param options - Configuration options
 * @returns Tuple of [value, setValue, removeValue, isLoading, error]
 * 
 * @example
 * ```typescript
 * // Basic usage
 * const [theme, setTheme] = useLocalStorage('theme', {
 *   defaultValue: 'light' as const,
 *   syncAcrossTabs: true
 * });
 * 
 * // With validation and migration
 * const [user, setUser] = useLocalStorage('currentUser', {
 *   defaultValue: null,
 *   version: 2,
 *   validator: (value): value is User => {
 *     return typeof value === 'object' && value !== null && 'id' in value;
 *   },
 *   migrator: (oldValue, newVersion) => {
 *     if (newVersion === 2 && oldValue.version === 1) {
 *       return { ...oldValue.value, updatedAt: Date.now() };
 *     }
 *     return oldValue.value;
 *   }
 * });
 * ```
 */
export function useLocalStorage<T>(
  key: string,
  options: StorageOptions<T> = {}
): [
  T | undefined,
  (value: T) => StorageResult<T>,
  () => StorageResult<boolean>,
  boolean,
  StorageError | null,
  {
    refresh: () => void;
    isExpired: () => boolean;
    cleanup: (options?: CleanupOptions) => number;
    migrate: (newVersion: number) => StorageResult<T>;
    getMetadata: () => Omit<StorageValue<T>, 'value'> | null;
  }
] {
  const {
    defaultValue,
    syncAcrossTabs = true,
    serialize = true,
    expiresIn,
    version = 1,
    serializer,
    migrator,
    validator,
  } = options;

  // State management
  const [storedValue, setStoredValue] = useState<T | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<StorageError | null>(null);

  // Refs for avoiding stale closures
  const keyRef = useRef(key);
  const optionsRef = useRef(options);
  
  // Update refs when props change
  useEffect(() => {
    keyRef.current = key;
    optionsRef.current = options;
  }, [key, options]);

  /**
   * Get value from localStorage with validation and migration
   */
  const getValue = useCallback((): StorageResult<T> => {
    setError(null);

    if (!isStorageAvailable()) {
      setError('STORAGE_DISABLED');
      return { 
        success: false, 
        error: 'STORAGE_DISABLED',
        value: defaultValue 
      };
    }

    try {
      const rawValue = localStorage.getItem(keyRef.current);
      
      if (rawValue === null) {
        return { 
          success: true, 
          value: defaultValue 
        };
      }

      // Handle direct string values (backward compatibility)
      if (!serialize || !rawValue.startsWith('{')) {
        const directValue = serializer?.parse(rawValue) ?? JSON.parse(rawValue);
        return { success: true, value: directValue };
      }

      // Parse wrapped storage value
      const parseResult = safeParse<StorageValue<T>>(rawValue, null);
      if (!parseResult.success || !parseResult.value) {
        setError('INVALID_JSON');
        return { 
          success: false, 
          error: 'INVALID_JSON',
          value: defaultValue 
        };
      }

      const storageValue = parseResult.value;

      // Check expiration
      if (storageValue.expiresAt && Date.now() > storageValue.expiresAt) {
        localStorage.removeItem(keyRef.current);
        setError('EXPIRED_VALUE');
        return { 
          success: false, 
          error: 'EXPIRED_VALUE',
          value: defaultValue 
        };
      }

      // Handle migration
      let finalValue = storageValue.value;
      let migrated = false;

      if (storageValue.version < version && migrator) {
        try {
          finalValue = migrator(storageValue, version);
          migrated = true;
        } catch (migrationError) {
          setError('MIGRATION_FAILED');
          return { 
            success: false, 
            error: 'MIGRATION_FAILED',
            value: defaultValue 
          };
        }
      }

      // Validate the value
      if (validator && !validator(finalValue)) {
        setError('VALIDATION_FAILED');
        return { 
          success: false, 
          error: 'VALIDATION_FAILED',
          value: defaultValue 
        };
      }

      // Update storage with migrated value if needed
      if (migrated) {
        const newStorageValue = createStorageValue(finalValue, version, expiresIn);
        try {
          localStorage.setItem(keyRef.current, JSON.stringify(newStorageValue));
        } catch {
          // Ignore migration storage errors
        }
      }

      return { 
        success: true, 
        value: finalValue,
        migrated 
      };

    } catch (catchError) {
      setError('CORRUPTION_DETECTED');
      return { 
        success: false, 
        error: 'CORRUPTION_DETECTED',
        value: defaultValue 
      };
    }
  }, [defaultValue, serialize, expiresIn, version, serializer, migrator, validator]);

  /**
   * Set value in localStorage with error handling
   */
  const setValue = useCallback((value: T): StorageResult<T> => {
    setError(null);

    if (!isStorageAvailable()) {
      setError('STORAGE_DISABLED');
      return { 
        success: false, 
        error: 'STORAGE_DISABLED'
      };
    }

    // Check storage quota before attempting to store
    const quotaCheck = checkStorageQuota();
    if (!quotaCheck.available) {
      setError(quotaCheck.error!);
      return { 
        success: false, 
        error: quotaCheck.error 
      };
    }

    try {
      const stringValue = serialize
        ? JSON.stringify(createStorageValue(value, version, expiresIn))
        : serializer?.stringify(value) ?? JSON.stringify(value);

      localStorage.setItem(keyRef.current, stringValue);
      setStoredValue(value);
      
      return { success: true, value };
    } catch (storageError) {
      if (storageError instanceof DOMException && storageError.code === 22) {
        setError('QUOTA_EXCEEDED');
        return { 
          success: false, 
          error: 'QUOTA_EXCEEDED'
        };
      }
      
      setError('UNKNOWN_ERROR');
      return { 
        success: false, 
        error: 'UNKNOWN_ERROR'
      };
    }
  }, [serialize, version, expiresIn, serializer]);

  /**
   * Remove value from localStorage
   */
  const removeValue = useCallback((): StorageResult<boolean> => {
    setError(null);

    if (!isStorageAvailable()) {
      setError('STORAGE_DISABLED');
      return { 
        success: false, 
        error: 'STORAGE_DISABLED'
      };
    }

    try {
      localStorage.removeItem(keyRef.current);
      setStoredValue(defaultValue);
      return { success: true, value: true };
    } catch {
      setError('UNKNOWN_ERROR');
      return { 
        success: false, 
        error: 'UNKNOWN_ERROR'
      };
    }
  }, [defaultValue]);

  /**
   * Refresh value from storage
   */
  const refresh = useCallback(() => {
    const result = getValue();
    if (result.success) {
      setStoredValue(result.value);
    }
  }, [getValue]);

  /**
   * Check if current value is expired
   */
  const isExpired = useCallback((): boolean => {
    if (!isStorageAvailable()) return false;

    try {
      const rawValue = localStorage.getItem(keyRef.current);
      if (!rawValue) return false;

      const parseResult = safeParse<StorageValue<T>>(rawValue, null);
      if (!parseResult.success || !parseResult.value) return false;

      const storageValue = parseResult.value;
      return !!(storageValue.expiresAt && Date.now() > storageValue.expiresAt);
    } catch {
      return true; // Consider corrupted data as expired
    }
  }, []);

  /**
   * Clean up storage with various strategies
   */
  const cleanup = useCallback((cleanupOptions: CleanupOptions = {}): number => {
    if (!isStorageAvailable()) return 0;

    const {
      removeExpired = true,
      maxAge,
      keyPattern,
      force = false
    } = cleanupOptions;

    let removedCount = 0;

    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const storageKey = localStorage.key(i);
        if (!storageKey) continue;

        // Skip if key doesn't match pattern
        if (keyPattern && !keyPattern.test(storageKey)) continue;

        try {
          const rawValue = localStorage.getItem(storageKey);
          if (!rawValue) continue;

          const parseResult = safeParse<StorageValue<any>>(rawValue, null);
          if (!parseResult.success || !parseResult.value) {
            if (force) keysToRemove.push(storageKey);
            continue;
          }

          const storageValue = parseResult.value;
          const now = Date.now();

          // Remove expired items
          if (removeExpired && storageValue.expiresAt && now > storageValue.expiresAt) {
            keysToRemove.push(storageKey);
            continue;
          }

          // Remove items older than maxAge
          if (maxAge && (now - storageValue.timestamp) > maxAge) {
            keysToRemove.push(storageKey);
            continue;
          }
        } catch {
          if (force) keysToRemove.push(storageKey);
        }
      }

      // Remove identified keys
      keysToRemove.forEach(k => {
        try {
          localStorage.removeItem(k);
          removedCount++;
        } catch {
          // Ignore removal errors
        }
      });

    } catch {
      // Ignore cleanup errors unless forced
    }

    return removedCount;
  }, []);

  /**
   * Migrate storage to new version
   */
  const migrate = useCallback((newVersion: number): StorageResult<T> => {
    if (!migrator) {
      return { 
        success: false, 
        error: 'MIGRATION_FAILED'
      };
    }

    const currentResult = getValue();
    if (!currentResult.success) return currentResult;

    try {
      const rawValue = localStorage.getItem(keyRef.current);
      if (!rawValue) {
        return { success: true, value: defaultValue };
      }

      const parseResult = safeParse<StorageValue<T>>(rawValue, null);
      if (!parseResult.success || !parseResult.value) {
        return { 
          success: false, 
          error: 'INVALID_JSON'
        };
      }

      const migratedValue = migrator(parseResult.value, newVersion);
      return setValue(migratedValue);
    } catch {
      return { 
        success: false, 
        error: 'MIGRATION_FAILED'
      };
    }
  }, [migrator, getValue, setValue, defaultValue]);

  /**
   * Get storage metadata without the value
   */
  const getMetadata = useCallback((): Omit<StorageValue<T>, 'value'> | null => {
    if (!isStorageAvailable()) return null;

    try {
      const rawValue = localStorage.getItem(keyRef.current);
      if (!rawValue) return null;

      const parseResult = safeParse<StorageValue<T>>(rawValue, null);
      if (!parseResult.success || !parseResult.value) return null;

      const { value, ...metadata } = parseResult.value;
      return metadata;
    } catch {
      return null;
    }
  }, []);

  // Initialize value on mount
  useEffect(() => {
    const result = getValue();
    setStoredValue(result.value);
    setIsLoading(false);
  }, [getValue]);

  // Set up cross-tab synchronization
  useEffect(() => {
    if (!syncAcrossTabs || !isStorageAvailable()) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === keyRef.current) {
        if (e.newValue === null) {
          setStoredValue(optionsRef.current.defaultValue);
        } else {
          const result = getValue();
          if (result.success) {
            setStoredValue(result.value);
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [syncAcrossTabs, getValue]);

  // Automatic cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up expired items when component unmounts
      cleanup({ removeExpired: true });
    };
  }, [cleanup]);

  return [
    storedValue,
    setValue,
    removeValue,
    isLoading,
    error,
    {
      refresh,
      isExpired,
      cleanup,
      migrate,
      getMetadata,
    }
  ];
}

// =============================================================================
// ADDITIONAL UTILITY HOOKS
// =============================================================================

/**
 * Simple localStorage hook for basic string values
 */
export function useSimpleLocalStorage(
  key: string,
  defaultValue: string = ''
): [string, (value: string) => void, () => void] {
  const [value, setValue, removeValue] = useLocalStorage(key, {
    defaultValue,
    serialize: false,
    syncAcrossTabs: true,
  });

  const setStringValue = useCallback((newValue: string) => {
    setValue(newValue);
  }, [setValue]);

  const removeStringValue = useCallback(() => {
    removeValue();
  }, [removeValue]);

  return [value || defaultValue, setStringValue, removeStringValue];
}

/**
 * Hook for managing storage cleanup across the application
 */
export function useStorageManager() {
  const globalCleanup = useCallback((options: CleanupOptions = {}) => {
    if (!isStorageAvailable()) return 0;

    const {
      removeExpired = true,
      maxAge = 30 * 24 * 60 * 60 * 1000, // 30 days default
      keyPattern,
      force = false
    } = options;

    let totalRemoved = 0;

    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;

        if (keyPattern && !keyPattern.test(key)) continue;

        try {
          const rawValue = localStorage.getItem(key);
          if (!rawValue) continue;

          // Try to parse as wrapped storage value
          if (rawValue.startsWith('{')) {
            const parseResult = safeParse<StorageValue<any>>(rawValue, null);
            if (!parseResult.success) {
              if (force) keysToRemove.push(key);
              continue;
            }

            const storageValue = parseResult.value!;
            const now = Date.now();

            if (removeExpired && storageValue.expiresAt && now > storageValue.expiresAt) {
              keysToRemove.push(key);
            } else if (maxAge && (now - storageValue.timestamp) > maxAge) {
              keysToRemove.push(key);
            }
          }
        } catch {
          if (force) keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
          totalRemoved++;
        } catch {
          // Ignore individual removal errors
        }
      });

    } catch {
      // Ignore global cleanup errors
    }

    return totalRemoved;
  }, []);

  const getStorageInfo = useCallback(() => {
    if (!isStorageAvailable()) {
      return {
        available: false,
        totalKeys: 0,
        estimatedSize: 0,
        quotaExceeded: false
      };
    }

    try {
      let totalSize = 0;
      const keyCount = localStorage.length;

      for (let i = 0; i < keyCount; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value) {
            totalSize += key.length + value.length;
          }
        }
      }

      const quotaCheck = checkStorageQuota();

      return {
        available: true,
        totalKeys: keyCount,
        estimatedSize: totalSize,
        quotaExceeded: !quotaCheck.available
      };
    } catch {
      return {
        available: false,
        totalKeys: 0,
        estimatedSize: 0,
        quotaExceeded: true
      };
    }
  }, []);

  return {
    cleanup: globalCleanup,
    getStorageInfo,
    isAvailable: isStorageAvailable(),
  };
}

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type {
  StorageValue,
  StorageOptions,
  StorageResult,
  StorageError,
  CleanupOptions,
};