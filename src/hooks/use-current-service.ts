'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useLocalStorage } from './use-local-storage'
import type { 
  DatabaseServiceRow, 
  DatabaseServiceConfig,
  DatabaseType 
} from '../types/database-service'

/**
 * Current service state interface for the hook
 */
export interface CurrentServiceState {
  /** Currently selected service ID */
  serviceId: number | null
  /** Currently selected service data (when available) */
  service: DatabaseServiceRow | null
  /** Loading state for service operations */
  isLoading: boolean
  /** Error state for service operations */
  error: string | null
  /** Whether the current service is valid */
  isValid: boolean
  /** Last validation timestamp */
  lastValidated: number | null
}

/**
 * Service validation result
 */
export interface ServiceValidationResult {
  isValid: boolean
  service?: DatabaseServiceRow
  error?: string
}

/**
 * Configuration options for the current service hook
 */
export interface UseCurrentServiceOptions {
  /** Enable automatic service validation */
  autoValidate?: boolean
  /** Validation interval in milliseconds */
  validationInterval?: number
  /** Enable automatic cleanup of invalid services */
  autoCleanupInvalid?: boolean
  /** Custom service validation function */
  customValidator?: (serviceId: number) => Promise<ServiceValidationResult>
  /** Enable debug logging */
  debug?: boolean
}

/**
 * Current service context hook return type
 */
export interface UseCurrentServiceReturn {
  /** Current service state */
  state: CurrentServiceState
  /** Select a service by ID */
  selectService: (serviceId: number, service?: DatabaseServiceRow) => Promise<void>
  /** Clear the current service selection */
  clearService: () => void
  /** Reset service state (clear + reset error states) */
  resetService: () => void
  /** Validate the current service */
  validateService: () => Promise<ServiceValidationResult>
  /** Refresh current service data */
  refreshService: () => Promise<void>
  /** Check if a specific service is currently selected */
  isServiceSelected: (serviceId: number) => boolean
  /** Get current service type */
  getCurrentServiceType: () => DatabaseType | null
}

/**
 * Storage key for current service persistence
 */
const CURRENT_SERVICE_STORAGE_KEY = 'dreamfactory_current_service_id'

/**
 * Default validation interval (5 minutes)
 */
const DEFAULT_VALIDATION_INTERVAL = 5 * 60 * 1000

/**
 * Current service context hook that manages selected database service state,
 * localStorage persistence, and service-related operations.
 * 
 * Replaces Angular DfCurrentServiceService with React state management and
 * localStorage synchronization for service selection workflows.
 * 
 * Features:
 * - Persistent service selection across browser sessions
 * - Automatic service validation and cleanup
 * - Real-time service state updates
 * - Error handling and fallback mechanisms
 * - Integration with service listing and validation
 * 
 * @param options - Configuration options for the hook
 * @returns Service state and management functions
 * 
 * @example
 * ```typescript
 * const { 
 *   state, 
 *   selectService, 
 *   clearService, 
 *   validateService 
 * } = useCurrentService({
 *   autoValidate: true,
 *   validationInterval: 300000 // 5 minutes
 * })
 * 
 * // Select a service
 * await selectService(123, serviceData)
 * 
 * // Check current state
 * if (state.serviceId && state.isValid) {
 *   console.log('Current service:', state.service?.name)
 * }
 * 
 * // Clear on logout
 * clearService()
 * ```
 */
export function useCurrentService(
  options: UseCurrentServiceOptions = {}
): UseCurrentServiceReturn {
  const {
    autoValidate = true,
    validationInterval = DEFAULT_VALIDATION_INTERVAL,
    autoCleanupInvalid = true,
    customValidator,
    debug = false
  } = options

  // localStorage integration for persistence
  const [persistedServiceId, setPersistedServiceId, removePersistedServiceId] = useLocalStorage<number>(
    CURRENT_SERVICE_STORAGE_KEY,
    {
      defaultValue: undefined,
      syncAcrossTabs: true,
      validator: (value): value is number => typeof value === 'number' && value > 0,
      enableCleanup: true
    }
  )

  // Internal state management
  const [state, setState] = useState<CurrentServiceState>({
    serviceId: null,
    service: null,
    isLoading: false,
    error: null,
    isValid: false,
    lastValidated: null
  })

  // Refs for preventing memory leaks and stale closures
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const mountedRef = useRef(true)

  /**
   * Debug logging utility
   */
  const debugLog = useCallback((message: string, data?: any) => {
    if (debug) {
      console.log(`[useCurrentService] ${message}`, data || '')
    }
  }, [debug])

  /**
   * Update internal state with proper error handling
   */
  const updateState = useCallback((updates: Partial<CurrentServiceState>) => {
    if (!mountedRef.current) return
    
    setState(prevState => {
      const newState = { ...prevState, ...updates }
      debugLog('State updated', newState)
      return newState
    })
  }, [debugLog])

  /**
   * Default service validation function using fetch
   */
  const defaultValidator = useCallback(async (serviceId: number): Promise<ServiceValidationResult> => {
    try {
      // Cancel any existing validation request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      const controller = new AbortController()
      abortControllerRef.current = controller

      debugLog('Validating service', serviceId)

      // In a real implementation, this would call the DreamFactory API
      // For now, we'll simulate validation
      const response = await fetch(`/api/database/services/${serviceId}`, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        if (response.status === 404) {
          return {
            isValid: false,
            error: 'Service not found or has been deleted'
          }
        }
        throw new Error(`Service validation failed: ${response.statusText}`)
      }

      const serviceData: DatabaseServiceRow = await response.json()
      
      // Validate service is active and accessible
      if (!serviceData.is_active) {
        return {
          isValid: false,
          service: serviceData,
          error: 'Service is inactive'
        }
      }

      return {
        isValid: true,
        service: serviceData
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        debugLog('Validation aborted')
        return { isValid: false, error: 'Validation cancelled' }
      }

      debugLog('Validation error', error)
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown validation error'
      }
    } finally {
      if (abortControllerRef.current?.signal.aborted) {
        abortControllerRef.current = null
      }
    }
  }, [debugLog])

  /**
   * Validate the current service
   */
  const validateService = useCallback(async (): Promise<ServiceValidationResult> => {
    const currentServiceId = state.serviceId || persistedServiceId

    if (!currentServiceId) {
      return { isValid: false, error: 'No service selected' }
    }

    updateState({ isLoading: true, error: null })

    try {
      const validator = customValidator || defaultValidator
      const result = await validator(currentServiceId)

      updateState({
        isLoading: false,
        isValid: result.isValid,
        service: result.service || null,
        error: result.error || null,
        lastValidated: Date.now()
      })

      // Auto-cleanup invalid services if enabled
      if (!result.isValid && autoCleanupInvalid) {
        debugLog('Auto-cleaning invalid service', currentServiceId)
        removePersistedServiceId()
        updateState({
          serviceId: null,
          service: null,
          isValid: false
        })
      }

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Validation failed'
      updateState({
        isLoading: false,
        error: errorMessage,
        isValid: false,
        lastValidated: Date.now()
      })

      return { isValid: false, error: errorMessage }
    }
  }, [
    state.serviceId,
    persistedServiceId,
    customValidator,
    defaultValidator,
    autoCleanupInvalid,
    updateState,
    removePersistedServiceId,
    debugLog
  ])

  /**
   * Select a service by ID with optional service data
   */
  const selectService = useCallback(async (
    serviceId: number, 
    service?: DatabaseServiceRow
  ): Promise<void> => {
    if (serviceId <= 0) {
      throw new Error('Invalid service ID')
    }

    debugLog('Selecting service', { serviceId, hasServiceData: !!service })

    // Update state immediately for optimistic UI
    updateState({
      serviceId,
      service: service || null,
      error: null,
      isValid: !!service, // If service data provided, assume valid initially
      lastValidated: service ? Date.now() : null
    })

    // Persist to localStorage
    setPersistedServiceId(serviceId)

    // Validate service if not provided or if auto-validation is enabled
    if (!service || autoValidate) {
      try {
        await validateService()
      } catch (error) {
        debugLog('Service selection validation failed', error)
        // Don't throw here - validation failure is handled in state
      }
    }
  }, [
    setPersistedServiceId,
    autoValidate,
    validateService,
    updateState,
    debugLog
  ])

  /**
   * Clear the current service selection
   */
  const clearService = useCallback(() => {
    debugLog('Clearing current service')

    // Cancel any ongoing validation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }

    // Clear validation timeout
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current)
      validationTimeoutRef.current = null
    }

    // Clear persisted data
    removePersistedServiceId()

    // Reset state
    updateState({
      serviceId: null,
      service: null,
      isLoading: false,
      error: null,
      isValid: false,
      lastValidated: null
    })
  }, [removePersistedServiceId, updateState, debugLog])

  /**
   * Reset service state (clear + reset error states)
   */
  const resetService = useCallback(() => {
    debugLog('Resetting service state')
    clearService()
  }, [clearService, debugLog])

  /**
   * Refresh current service data
   */
  const refreshService = useCallback(async (): Promise<void> => {
    const currentServiceId = state.serviceId || persistedServiceId

    if (!currentServiceId) {
      debugLog('No service to refresh')
      return
    }

    debugLog('Refreshing current service', currentServiceId)
    await validateService()
  }, [state.serviceId, persistedServiceId, validateService, debugLog])

  /**
   * Check if a specific service is currently selected
   */
  const isServiceSelected = useCallback((serviceId: number): boolean => {
    const currentId = state.serviceId || persistedServiceId
    return currentId === serviceId
  }, [state.serviceId, persistedServiceId])

  /**
   * Get current service type
   */
  const getCurrentServiceType = useCallback((): DatabaseType | null => {
    return state.service?.type || null
  }, [state.service?.type])

  /**
   * Setup automatic validation timer
   */
  const setupValidationTimer = useCallback(() => {
    if (!autoValidate || validationInterval <= 0) return

    const scheduleNextValidation = () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current)
      }

      validationTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current && (state.serviceId || persistedServiceId)) {
          debugLog('Auto-validating service')
          validateService().then(() => {
            if (mountedRef.current) {
              scheduleNextValidation()
            }
          })
        }
      }, validationInterval)
    }

    scheduleNextValidation()
  }, [
    autoValidate,
    validationInterval,
    state.serviceId,
    persistedServiceId,
    validateService,
    debugLog
  ])

  // Initialize state from localStorage on mount
  useEffect(() => {
    if (persistedServiceId && persistedServiceId !== state.serviceId) {
      debugLog('Initializing from localStorage', persistedServiceId)
      
      updateState({
        serviceId: persistedServiceId,
        service: null,
        isValid: false,
        lastValidated: null
      })

      // Validate on initialization if auto-validate is enabled
      if (autoValidate) {
        validateService()
      }
    }
  }, [persistedServiceId, state.serviceId, autoValidate, validateService, updateState, debugLog])

  // Setup automatic validation timer
  useEffect(() => {
    setupValidationTimer()

    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current)
        validationTimeoutRef.current = null
      }
    }
  }, [setupValidationTimer])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false

      // Cancel any ongoing validation
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Clear validation timeout
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current)
      }
    }
  }, [])

  return {
    state,
    selectService,
    clearService,
    resetService,
    validateService,
    refreshService,
    isServiceSelected,
    getCurrentServiceType
  }
}

/**
 * Utility hook for checking if any service is currently selected
 * 
 * @returns Boolean indicating if a service is selected
 */
export function useHasCurrentService(): boolean {
  const { state } = useCurrentService({ autoValidate: false })
  return !!state.serviceId && state.isValid
}

/**
 * Utility hook for getting only the current service ID
 * 
 * @returns Current service ID or null
 */
export function useCurrentServiceId(): number | null {
  const { state } = useCurrentService({ autoValidate: false })
  return state.serviceId
}

/**
 * Utility hook for getting only the current service data
 * 
 * @returns Current service data or null
 */
export function useCurrentServiceData(): DatabaseServiceRow | null {
  const { state } = useCurrentService({ autoValidate: false })
  return state.service
}

/**
 * Utility hook for current service operations without state
 * 
 * @returns Service management functions only
 */
export function useCurrentServiceActions(): Pick<
  UseCurrentServiceReturn,
  'selectService' | 'clearService' | 'resetService' | 'validateService' | 'refreshService'
> {
  const { 
    selectService, 
    clearService, 
    resetService, 
    validateService, 
    refreshService 
  } = useCurrentService({ autoValidate: false })

  return {
    selectService,
    clearService,
    resetService,
    validateService,
    refreshService
  }
}

export default useCurrentService