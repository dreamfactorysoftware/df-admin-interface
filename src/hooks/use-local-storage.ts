'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Configuration options for the localStorage hook
 */
interface UseLocalStorageOptions<T> {
  /** Default value when storage key doesn't exist */
  defaultValue?: T
  /** Enable cross-tab synchronization via storage events */
  syncAcrossTabs?: boolean
  /** Custom serializer function */
  serializer?: {
    stringify: (value: T) => string
    parse: (value: string) => T
  }
  /** Validation function to check if stored data is valid */
  validator?: (value: unknown) => value is T
  /** Migration function for handling schema changes */
  migrator?: {
    version: number
    migrate: (oldData: unknown, oldVersion: number) => T
  }
  /** Storage quota limit in bytes */
  quotaLimit?: number
  /** Enable automatic cleanup of expired data */
  enableCleanup?: boolean
  /** Expiration time in milliseconds */
  expirationTime?: number
}

/**
 * Internal storage wrapper that includes metadata
 */
interface StorageWrapper<T> {
  data: T
  version: number
  timestamp: number
  expires?: number
}

/**
 * Storage error types for comprehensive error handling
 */
export class StorageError extends Error {
  constructor(
    message: string,
    public readonly code: 'QUOTA_EXCEEDED' | 'PARSE_ERROR' | 'VALIDATION_ERROR' | 'MIGRATION_ERROR' | 'BROWSER_NOT_SUPPORTED'
  ) {
    super(message)
    this.name = 'StorageError'
  }
}

/**
 * Type-safe localStorage hook with comprehensive state management
 * 
 * Provides type-safe localStorage operations with automatic serialization,
 * cross-tab synchronization, error handling, and React state integration.
 * 
 * @template T - The type of data to store
 * @param key - Storage key
 * @param options - Configuration options
 * @returns Tuple of [value, setValue, removeValue, error, isLoading]
 * 
 * @example
 * ```typescript
 * const [theme, setTheme] = useLocalStorage('theme', {
 *   defaultValue: 'light',
 *   syncAcrossTabs: true,
 *   validator: (value): value is 'light' | 'dark' => 
 *     typeof value === 'string' && ['light', 'dark'].includes(value)
 * })
 * ```
 */
export function useLocalStorage<T>(
  key: string,
  options: UseLocalStorageOptions<T> = {}
): [
  T | undefined,
  (value: T | ((prev: T | undefined) => T)) => void,
  () => void,
  StorageError | null,
  boolean
] {
  const {
    defaultValue,
    syncAcrossTabs = true,
    serializer = JSON,
    validator,
    migrator,
    quotaLimit = 5 * 1024 * 1024, // 5MB default
    enableCleanup = true,
    expirationTime
  } = options

  // State management
  const [storedValue, setStoredValue] = useState<T | undefined>(undefined)
  const [error, setError] = useState<StorageError | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Refs for preventing unnecessary re-renders
  const initializeRef = useRef(false)
  const listenerRef = useRef<((e: StorageEvent) => void) | null>(null)

  /**
   * Check if localStorage is available and supported
   */
  const isStorageAvailable = useCallback((): boolean => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false
      }
      
      // Test storage availability
      const testKey = '__test_storage__'
      window.localStorage.setItem(testKey, 'test')
      window.localStorage.removeItem(testKey)
      return true
    } catch {
      return false
    }
  }, [])

  /**
   * Get storage usage in bytes
   */
  const getStorageUsage = useCallback((): number => {
    if (!isStorageAvailable()) return 0
    
    let total = 0
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        const value = localStorage.getItem(key)
        if (value) {
          total += key.length + value.length
        }
      }
    }
    return total
  }, [isStorageAvailable])

  /**
   * Clean up expired storage entries
   */
  const cleanupExpiredEntries = useCallback(() => {
    if (!isStorageAvailable() || !enableCleanup) return
    
    try {
      const now = Date.now()
      const keysToRemove: string[] = []
      
      for (let i = 0; i < localStorage.length; i++) {
        const storageKey = localStorage.key(i)
        if (storageKey?.startsWith('__storage_')) {
          try {
            const value = localStorage.getItem(storageKey)
            if (value) {
              const parsed = JSON.parse(value) as StorageWrapper<unknown>
              if (parsed.expires && parsed.expires < now) {
                keysToRemove.push(storageKey)
              }
            }
          } catch {
            // Invalid format, mark for removal
            keysToRemove.push(storageKey)
          }
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key))
    } catch (err) {
      console.warn('Failed to cleanup expired storage entries:', err)
    }
  }, [isStorageAvailable, enableCleanup])

  /**
   * Get the internal storage key with prefix
   */
  const getStorageKey = useCallback((key: string): string => {
    return `__storage_${key}`
  }, [])

  /**
   * Read value from localStorage with comprehensive error handling
   */
  const readValue = useCallback((): T | undefined => {
    if (!isStorageAvailable()) {
      setError(new StorageError('localStorage is not supported in this environment', 'BROWSER_NOT_SUPPORTED'))
      return defaultValue
    }

    try {
      setError(null)
      const storageKey = getStorageKey(key)
      const item = window.localStorage.getItem(storageKey)
      
      if (item === null) {
        return defaultValue
      }

      // Parse the wrapped storage data
      const wrapper = JSON.parse(item) as StorageWrapper<unknown>
      
      // Check expiration
      if (wrapper.expires && wrapper.expires < Date.now()) {
        window.localStorage.removeItem(storageKey)
        return defaultValue
      }

      // Handle migration if needed
      if (migrator && wrapper.version < migrator.version) {
        try {
          const migratedData = migrator.migrate(wrapper.data, wrapper.version)
          
          // Update storage with migrated data
          const newWrapper: StorageWrapper<T> = {
            data: migratedData,
            version: migrator.version,
            timestamp: Date.now(),
            expires: expirationTime ? Date.now() + expirationTime : undefined
          }
          
          window.localStorage.setItem(storageKey, JSON.stringify(newWrapper))
          return migratedData
        } catch (err) {
          setError(new StorageError(`Migration failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'MIGRATION_ERROR'))
          return defaultValue
        }
      }

      // Parse the actual data
      const parsedData = serializer.parse(JSON.stringify(wrapper.data))
      
      // Validate if validator is provided
      if (validator && !validator(parsedData)) {
        setError(new StorageError('Stored data failed validation', 'VALIDATION_ERROR'))
        return defaultValue
      }

      return parsedData
    } catch (err) {
      setError(new StorageError(
        `Failed to parse stored data: ${err instanceof Error ? err.message : 'Unknown error'}`,
        'PARSE_ERROR'
      ))
      return defaultValue
    }
  }, [key, defaultValue, serializer, validator, migrator, expirationTime, isStorageAvailable, getStorageKey])

  /**
   * Write value to localStorage with quota management
   */
  const writeValue = useCallback((value: T): void => {
    if (!isStorageAvailable()) {
      setError(new StorageError('localStorage is not supported in this environment', 'BROWSER_NOT_SUPPORTED'))
      return
    }

    try {
      setError(null)
      
      // Check quota before writing
      const currentUsage = getStorageUsage()
      const serializedData = serializer.stringify(value)
      const wrapper: StorageWrapper<T> = {
        data: value,
        version: migrator?.version || 1,
        timestamp: Date.now(),
        expires: expirationTime ? Date.now() + expirationTime : undefined
      }
      
      const wrappedData = JSON.stringify(wrapper)
      const estimatedSize = wrappedData.length + getStorageKey(key).length
      
      if (currentUsage + estimatedSize > quotaLimit) {
        // Try cleanup first
        cleanupExpiredEntries()
        
        // Check again after cleanup
        const newUsage = getStorageUsage()
        if (newUsage + estimatedSize > quotaLimit) {
          setError(new StorageError('Storage quota exceeded', 'QUOTA_EXCEEDED'))
          return
        }
      }

      const storageKey = getStorageKey(key)
      window.localStorage.setItem(storageKey, wrappedData)
      setStoredValue(value)
    } catch (err) {
      if (err instanceof Error && err.name === 'QuotaExceededError') {
        setError(new StorageError('Storage quota exceeded', 'QUOTA_EXCEEDED'))
      } else {
        setError(new StorageError(
          `Failed to write to storage: ${err instanceof Error ? err.message : 'Unknown error'}`,
          'PARSE_ERROR'
        ))
      }
    }
  }, [key, serializer, migrator, expirationTime, quotaLimit, isStorageAvailable, getStorageKey, getStorageUsage, cleanupExpiredEntries])

  /**
   * Remove value from localStorage
   */
  const removeValue = useCallback((): void => {
    if (!isStorageAvailable()) {
      setError(new StorageError('localStorage is not supported in this environment', 'BROWSER_NOT_SUPPORTED'))
      return
    }

    try {
      setError(null)
      const storageKey = getStorageKey(key)
      window.localStorage.removeItem(storageKey)
      setStoredValue(defaultValue)
    } catch (err) {
      setError(new StorageError(
        `Failed to remove from storage: ${err instanceof Error ? err.message : 'Unknown error'}`,
        'PARSE_ERROR'
      ))
    }
  }, [key, defaultValue, isStorageAvailable, getStorageKey])

  /**
   * Set value with functional update support
   */
  const setValue = useCallback((value: T | ((prev: T | undefined) => T)): void => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      writeValue(valueToStore)
    } catch (err) {
      setError(new StorageError(
        `Failed to set value: ${err instanceof Error ? err.message : 'Unknown error'}`,
        'PARSE_ERROR'
      ))
    }
  }, [storedValue, writeValue])

  /**
   * Handle storage events for cross-tab synchronization
   */
  const handleStorageChange = useCallback((e: StorageEvent) => {
    const storageKey = getStorageKey(key)
    
    if (e.key !== storageKey || e.storageArea !== window.localStorage) {
      return
    }

    try {
      if (e.newValue === null) {
        setStoredValue(defaultValue)
      } else {
        const wrapper = JSON.parse(e.newValue) as StorageWrapper<unknown>
        const parsedData = serializer.parse(JSON.stringify(wrapper.data))
        
        if (validator && !validator(parsedData)) {
          console.warn('Cross-tab synchronized data failed validation')
          return
        }
        
        setStoredValue(parsedData)
      }
      setError(null)
    } catch (err) {
      setError(new StorageError(
        `Failed to sync cross-tab change: ${err instanceof Error ? err.message : 'Unknown error'}`,
        'PARSE_ERROR'
      ))
    }
  }, [key, defaultValue, serializer, validator, getStorageKey])

  // Initialize the hook
  useEffect(() => {
    if (initializeRef.current) return
    
    setIsLoading(true)
    
    // Cleanup expired entries on initialization
    if (enableCleanup) {
      cleanupExpiredEntries()
    }
    
    // Read initial value
    const initialValue = readValue()
    setStoredValue(initialValue)
    
    initializeRef.current = true
    setIsLoading(false)
  }, [readValue, cleanupExpiredEntries, enableCleanup])

  // Set up storage event listener for cross-tab synchronization
  useEffect(() => {
    if (!syncAcrossTabs || !isStorageAvailable()) return

    const handleChange = (e: StorageEvent) => handleStorageChange(e)
    listenerRef.current = handleChange
    
    window.addEventListener('storage', handleChange)
    
    return () => {
      if (listenerRef.current) {
        window.removeEventListener('storage', listenerRef.current)
        listenerRef.current = null
      }
    }
  }, [syncAcrossTabs, handleStorageChange, isStorageAvailable])

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (listenerRef.current) {
        window.removeEventListener('storage', listenerRef.current)
      }
    }
  }, [])

  return [storedValue, setValue, removeValue, error, isLoading]
}

/**
 * Utility hook for managing multiple localStorage keys
 * 
 * @param keys - Array of storage keys to manage
 * @returns Object with methods for batch operations
 */
export function useLocalStorageBatch(keys: string[]) {
  const [errors, setErrors] = useState<Record<string, StorageError | null>>({})
  
  const clearAll = useCallback(() => {
    keys.forEach(key => {
      try {
        localStorage.removeItem(`__storage_${key}`)
      } catch (err) {
        setErrors(prev => ({
          ...prev,
          [key]: new StorageError(
            `Failed to clear key ${key}: ${err instanceof Error ? err.message : 'Unknown error'}`,
            'PARSE_ERROR'
          )
        }))
      }
    })
  }, [keys])
  
  const getUsage = useCallback(() => {
    let total = 0
    keys.forEach(key => {
      try {
        const value = localStorage.getItem(`__storage_${key}`)
        if (value) {
          total += key.length + value.length
        }
      } catch {
        // Ignore individual key errors for usage calculation
      }
    })
    return total
  }, [keys])
  
  return {
    clearAll,
    getUsage,
    errors
  }
}

/**
 * Hook for managing storage migrations across application updates
 * 
 * @param version - Current application version
 * @param migrations - Migration functions keyed by version
 */
export function useStorageMigration(
  version: number,
  migrations: Record<number, (data: unknown) => unknown>
) {
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'running' | 'complete' | 'error'>('idle')
  const [migrationError, setMigrationError] = useState<string | null>(null)
  
  const runMigrations = useCallback(async () => {
    setMigrationStatus('running')
    setMigrationError(null)
    
    try {
      const currentVersion = parseInt(localStorage.getItem('__storage_version') || '0')
      
      if (currentVersion < version) {
        // Run migrations in sequence
        for (let v = currentVersion + 1; v <= version; v++) {
          if (migrations[v]) {
            // Apply migration to all storage items
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i)
              if (key?.startsWith('__storage_')) {
                try {
                  const value = localStorage.getItem(key)
                  if (value) {
                    const wrapper = JSON.parse(value)
                    wrapper.data = migrations[v](wrapper.data)
                    wrapper.version = v
                    localStorage.setItem(key, JSON.stringify(wrapper))
                  }
                } catch (err) {
                  console.warn(`Failed to migrate key ${key}:`, err)
                }
              }
            }
          }
        }
        
        localStorage.setItem('__storage_version', version.toString())
      }
      
      setMigrationStatus('complete')
    } catch (err) {
      setMigrationError(err instanceof Error ? err.message : 'Unknown migration error')
      setMigrationStatus('error')
    }
  }, [version, migrations])
  
  useEffect(() => {
    if (migrationStatus === 'idle') {
      runMigrations()
    }
  }, [runMigrations, migrationStatus])
  
  return {
    migrationStatus,
    migrationError,
    runMigrations
  }
}

export default useLocalStorage