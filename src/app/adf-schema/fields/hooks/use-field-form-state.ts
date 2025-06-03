/**
 * @fileoverview Custom React hook for managing dynamic field form state and control logic.
 * Provides comprehensive form state management with automatic field configuration updates
 * based on field type selections and relationships. Implements complex form control 
 * enabling/disabling patterns migrated from Angular reactive forms to React Hook Form.
 * 
 * @version 1.0.0
 * @created 2024-12-28
 * 
 * Key Features:
 * - Dynamic form field management per existing Angular reactive form patterns
 * - Real-time form state updates under 100ms per React/Next.js Integration Requirements  
 * - Type-safe form state management per Section 5.2 Component Details
 * - React Hook Form integration for optimal performance per React/Next.js Integration Requirements
 * - Automatic field configuration based on type selection and relationships
 * - Conditional field visibility and validation management
 * - Foreign key relationship handling with dependent field updates
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useWatch, type UseFormReturn, type FieldPath } from 'react-hook-form'
import type { 
  FieldFormData, 
  DreamFactoryFieldType,
  DatabaseSchemaFieldType 
} from '../field.types'

/**
 * Configuration options for field form state management
 */
interface FieldFormStateOptions {
  /** Whether to enable automatic type-based field configuration */
  enableAutoConfiguration?: boolean
  /** Whether to enable real-time validation updates */
  enableRealtimeValidation?: boolean
  /** Performance mode for faster updates */
  performanceMode?: 'standard' | 'fast' | 'ultra'
  /** Maximum update delay in milliseconds */
  maxUpdateDelay?: number
}

/**
 * Field configuration state interface for dynamic control management
 */
interface FieldConfigState {
  /** Whether the field is enabled/disabled */
  enabled: boolean
  /** Whether the field is visible in the form */
  visible: boolean
  /** Whether the field is required */
  required: boolean
  /** Default value when field becomes enabled */
  defaultValue?: any
}

/**
 * Field configuration map for all form fields
 */
interface FieldConfigMap {
  alias: FieldConfigState
  label: FieldConfigState
  description: FieldConfigState
  type: FieldConfigState
  dbType: FieldConfigState
  length: FieldConfigState
  precision: FieldConfigState
  scale: FieldConfigState
  fixedLength: FieldConfigState
  supportsMultibyte: FieldConfigState
  allowNull: FieldConfigState
  autoIncrement: FieldConfigState
  default: FieldConfigState
  isAggregate: FieldConfigState
  isForeignKey: FieldConfigState
  isPrimaryKey: FieldConfigState
  isUnique: FieldConfigState
  isVirtual: FieldConfigState
  required: FieldConfigState
  refTable: FieldConfigState
  refField: FieldConfigState
  refOnDelete: FieldConfigState
  refOnUpdate: FieldConfigState
  picklist: FieldConfigState
  validation: FieldConfigState
  dbFunction: FieldConfigState
}

/**
 * Return type for the field form state hook
 */
interface UseFieldFormStateReturn {
  /** Current field configuration map */
  fieldConfig: FieldConfigMap
  /** Function to check if a field is enabled */
  isFieldEnabled: (fieldName: keyof FieldFormData) => boolean
  /** Function to check if a field is visible */
  isFieldVisible: (fieldName: keyof FieldFormData) => boolean
  /** Function to check if a field is required */
  isFieldRequired: (fieldName: keyof FieldFormData) => boolean
  /** Function to get default value for a field */
  getFieldDefaultValue: (fieldName: keyof FieldFormData) => any
  /** Function to update field configuration */
  updateFieldConfig: (fieldName: keyof FieldFormData, config: Partial<FieldConfigState>) => void
  /** Function to reset field configuration to defaults */
  resetFieldConfig: () => void
  /** Function to apply field type configuration */
  applyTypeConfiguration: (type: DreamFactoryFieldType) => void
  /** Function to handle virtual field toggle */
  handleVirtualToggle: (isVirtual: boolean) => void
  /** Function to handle foreign key toggle */
  handleForeignKeyToggle: (isForeignKey: boolean) => void
  /** Current performance metrics */
  performanceMetrics: {
    lastUpdateTime: number
    updateCount: number
    averageUpdateTime: number
  }
}

/**
 * Type dropdown menu options available for field selection
 * Migrated from Angular component constant
 */
const TYPE_DROPDOWN_OPTIONS = [
  'I will manually enter a type',
  'id',
  'string',
  'integer',
  'text',
  'boolean',
  'binary',
  'float',
  'double',
  'decimal',
  'datetime',
  'date',
  'time',
  'reference',
  'user_id',
  'user_id_on_create',
  'user_id_on_update',
  'timestamp',
  'timestamp_on_create',
  'timestamp_on_update',
] as const

/**
 * Default field configuration state
 */
const DEFAULT_FIELD_CONFIG: FieldConfigState = {
  enabled: true,
  visible: true,
  required: false,
  defaultValue: undefined
}

/**
 * Default configuration map for all form fields
 */
const DEFAULT_CONFIG_MAP: FieldConfigMap = {
  alias: { ...DEFAULT_FIELD_CONFIG },
  label: { ...DEFAULT_FIELD_CONFIG },
  description: { ...DEFAULT_FIELD_CONFIG },
  type: { ...DEFAULT_FIELD_CONFIG, required: true },
  dbType: { ...DEFAULT_FIELD_CONFIG, enabled: false },
  length: { ...DEFAULT_FIELD_CONFIG, enabled: false },
  precision: { ...DEFAULT_FIELD_CONFIG, enabled: false },
  scale: { ...DEFAULT_FIELD_CONFIG, enabled: false, defaultValue: 0 },
  fixedLength: { ...DEFAULT_FIELD_CONFIG, enabled: false },
  supportsMultibyte: { ...DEFAULT_FIELD_CONFIG, enabled: false },
  allowNull: { ...DEFAULT_FIELD_CONFIG },
  autoIncrement: { ...DEFAULT_FIELD_CONFIG },
  default: { ...DEFAULT_FIELD_CONFIG },
  isAggregate: { ...DEFAULT_FIELD_CONFIG, enabled: false },
  isForeignKey: { ...DEFAULT_FIELD_CONFIG },
  isPrimaryKey: { ...DEFAULT_FIELD_CONFIG, enabled: false },
  isUnique: { ...DEFAULT_FIELD_CONFIG },
  isVirtual: { ...DEFAULT_FIELD_CONFIG },
  required: { ...DEFAULT_FIELD_CONFIG },
  refTable: { ...DEFAULT_FIELD_CONFIG, enabled: false },
  refField: { ...DEFAULT_FIELD_CONFIG, enabled: false },
  refOnDelete: { ...DEFAULT_FIELD_CONFIG, enabled: false },
  refOnUpdate: { ...DEFAULT_FIELD_CONFIG, enabled: false },
  picklist: { ...DEFAULT_FIELD_CONFIG, visible: false },
  validation: { ...DEFAULT_FIELD_CONFIG },
  dbFunction: { ...DEFAULT_FIELD_CONFIG }
}

/**
 * Custom hook for managing dynamic field form state and control logic.
 * Implements all Angular reactive form patterns for field configuration management.
 * 
 * @param form - React Hook Form instance
 * @param options - Configuration options for the hook
 * @returns Object containing field configuration state and management functions
 * 
 * @example
 * ```typescript
 * const form = useForm<FieldFormData>()
 * const {
 *   fieldConfig,
 *   isFieldEnabled,
 *   isFieldVisible,
 *   applyTypeConfiguration
 * } = useFieldFormState(form)
 * 
 * // Use in component
 * <Input 
 *   disabled={!isFieldEnabled('length')}
 *   style={{ display: isFieldVisible('length') ? 'block' : 'none' }}
 * />
 * ```
 */
export function useFieldFormState(
  form: UseFormReturn<FieldFormData>,
  options: FieldFormStateOptions = {}
): UseFieldFormStateReturn {
  const {
    enableAutoConfiguration = true,
    enableRealtimeValidation = true,
    performanceMode = 'standard',
    maxUpdateDelay = 100
  } = options

  // Performance tracking for monitoring sub-100ms requirement
  const [performanceMetrics, setPerformanceMetrics] = useState({
    lastUpdateTime: 0,
    updateCount: 0,
    averageUpdateTime: 0
  })

  // Internal state for field configuration
  const [fieldConfig, setFieldConfig] = useState<FieldConfigMap>(() => {
    // Deep clone to prevent mutations
    return JSON.parse(JSON.stringify(DEFAULT_CONFIG_MAP))
  })

  // Watch critical form fields for automatic configuration updates
  const watchedType = useWatch({ 
    control: form.control, 
    name: 'type',
    defaultValue: '' as DreamFactoryFieldType
  })
  
  const watchedIsVirtual = useWatch({ 
    control: form.control, 
    name: 'isVirtual',
    defaultValue: false
  })
  
  const watchedIsForeignKey = useWatch({ 
    control: form.control, 
    name: 'isForeignKey',
    defaultValue: false
  })

  const watchedRefTable = useWatch({
    control: form.control,
    name: 'refTable',
    defaultValue: null
  })

  /**
   * Performance-optimized update function that tracks timing
   */
  const performanceUpdate = useCallback((updateFn: () => void) => {
    const startTime = performance.now()
    
    updateFn()
    
    const endTime = performance.now()
    const updateTime = endTime - startTime
    
    setPerformanceMetrics(prev => {
      const newUpdateCount = prev.updateCount + 1
      const newAverageUpdateTime = 
        (prev.averageUpdateTime * prev.updateCount + updateTime) / newUpdateCount

      return {
        lastUpdateTime: updateTime,
        updateCount: newUpdateCount,
        averageUpdateTime: newAverageUpdateTime
      }
    })

    // Warn if exceeding 100ms requirement
    if (updateTime > maxUpdateDelay) {
      console.warn(`Field form state update exceeded ${maxUpdateDelay}ms: ${updateTime.toFixed(2)}ms`)
    }
  }, [maxUpdateDelay])

  /**
   * Utility function to check if a field is enabled
   */
  const isFieldEnabled = useCallback((fieldName: keyof FieldFormData): boolean => {
    return fieldConfig[fieldName]?.enabled ?? true
  }, [fieldConfig])

  /**
   * Utility function to check if a field is visible
   */
  const isFieldVisible = useCallback((fieldName: keyof FieldFormData): boolean => {
    return fieldConfig[fieldName]?.visible ?? true
  }, [fieldConfig])

  /**
   * Utility function to check if a field is required
   */
  const isFieldRequired = useCallback((fieldName: keyof FieldFormData): boolean => {
    return fieldConfig[fieldName]?.required ?? false
  }, [fieldConfig])

  /**
   * Utility function to get default value for a field
   */
  const getFieldDefaultValue = useCallback((fieldName: keyof FieldFormData): any => {
    return fieldConfig[fieldName]?.defaultValue
  }, [fieldConfig])

  /**
   * Function to update specific field configuration
   */
  const updateFieldConfig = useCallback((
    fieldName: keyof FieldFormData, 
    config: Partial<FieldConfigState>
  ) => {
    performanceUpdate(() => {
      setFieldConfig(prev => ({
        ...prev,
        [fieldName]: {
          ...prev[fieldName],
          ...config
        }
      }))

      // Update form field state based on configuration
      if (config.enabled !== undefined) {
        if (!config.enabled) {
          // Disable field and clear value
          form.setValue(fieldName, config.defaultValue ?? null)
        } else if (config.defaultValue !== undefined) {
          // Enable field and set default value
          form.setValue(fieldName, config.defaultValue)
        }
      }
    })
  }, [form, performanceUpdate])

  /**
   * Function to enable a form field with optional default value
   * Replicates Angular enableFormField method
   */
  const enableField = useCallback((fieldName: keyof FieldFormData, value?: any) => {
    updateFieldConfig(fieldName, {
      enabled: true,
      ...(value !== undefined && { defaultValue: value })
    })
  }, [updateFieldConfig])

  /**
   * Function to disable a form field and clear its value
   * Replicates Angular disableFormField method
   */
  const disableField = useCallback((fieldName: keyof FieldFormData) => {
    updateFieldConfig(fieldName, {
      enabled: false
    })
  }, [updateFieldConfig])

  /**
   * Function to add a form field (make it visible)
   * Replicates Angular addFormField method
   */
  const addField = useCallback((fieldName: keyof FieldFormData) => {
    updateFieldConfig(fieldName, {
      visible: true,
      enabled: true
    })
  }, [updateFieldConfig])

  /**
   * Function to remove a form field (make it invisible)
   * Replicates Angular removeFormField method
   */
  const removeField = useCallback((fieldName: keyof FieldFormData) => {
    updateFieldConfig(fieldName, {
      visible: false
    })
    form.setValue(fieldName, null as any)
  }, [updateFieldConfig, form])

  /**
   * Apply field type-specific configuration
   * Replicates Angular type change subscription logic
   */
  const applyTypeConfiguration = useCallback((type: DreamFactoryFieldType) => {
    performanceUpdate(() => {
      switch (type) {
        case TYPE_DROPDOWN_OPTIONS[0]: // 'I will manually enter a type'
          if (!watchedIsVirtual) {
            enableField('dbType')
          } else {
            disableField('dbType')
          }
          disableField('length')
          disableField('precision')
          disableField('scale')
          removeField('picklist')
          disableField('fixedLength')
          disableField('supportsMultibyte')
          break

        case 'string':
          addField('picklist')
          disableField('dbType')
          enableField('length')
          disableField('precision')
          disableField('scale')
          enableField('fixedLength')
          enableField('supportsMultibyte')
          break

        case 'integer':
          addField('picklist')
          disableField('dbType')
          enableField('length')
          disableField('precision')
          disableField('scale')
          disableField('fixedLength')
          disableField('supportsMultibyte')
          break

        case 'text':
        case 'binary':
          disableField('dbType')
          enableField('length')
          disableField('precision')
          disableField('scale')
          removeField('picklist')
          disableField('fixedLength')
          disableField('supportsMultibyte')
          break

        case 'float':
        case 'double':
        case 'decimal':
          disableField('dbType')
          disableField('length')
          enableField('precision')
          enableField('scale', 0)
          removeField('picklist')
          disableField('fixedLength')
          disableField('supportsMultibyte')
          break

        default:
          disableField('dbType')
          disableField('length')
          disableField('precision')
          disableField('scale')
          removeField('picklist')
          disableField('fixedLength')
          disableField('supportsMultibyte')
      }
    })
  }, [
    watchedIsVirtual, 
    enableField, 
    disableField, 
    addField, 
    removeField, 
    performanceUpdate
  ])

  /**
   * Handle virtual field toggle changes
   * Replicates Angular isVirtual change subscription logic
   */
  const handleVirtualToggle = useCallback((isVirtual: boolean) => {
    performanceUpdate(() => {
      if (isVirtual) {
        disableField('dbType')
        enableField('isAggregate')
      } else {
        if (watchedType === TYPE_DROPDOWN_OPTIONS[0]) {
          enableField('dbType')
        }
        disableField('isAggregate')
      }
    })
  }, [watchedType, enableField, disableField, performanceUpdate])

  /**
   * Handle foreign key toggle changes
   * Replicates Angular isForeignKey change subscription logic
   */
  const handleForeignKeyToggle = useCallback((isForeignKey: boolean) => {
    performanceUpdate(() => {
      if (isForeignKey) {
        enableField('refTable')
        // Note: refField will be enabled when refTable is selected
        updateFieldConfig('refField', { enabled: false }) // Initially disabled until table is selected
        enableField('refOnDelete')
        enableField('refOnUpdate')
      } else {
        disableField('refTable')
        disableField('refField')
        disableField('refOnDelete')
        disableField('refOnUpdate')
      }
    })
  }, [enableField, disableField, updateFieldConfig, performanceUpdate])

  /**
   * Handle reference table selection changes
   * Enables refField when a reference table is selected
   */
  const handleRefTableChange = useCallback(() => {
    if (watchedRefTable && watchedIsForeignKey) {
      enableField('refField')
    }
  }, [watchedRefTable, watchedIsForeignKey, enableField])

  /**
   * Reset all field configuration to defaults
   */
  const resetFieldConfig = useCallback(() => {
    performanceUpdate(() => {
      setFieldConfig(JSON.parse(JSON.stringify(DEFAULT_CONFIG_MAP)))
    })
  }, [performanceUpdate])

  // Effect for automatic type configuration when type changes
  useEffect(() => {
    if (enableAutoConfiguration && watchedType) {
      applyTypeConfiguration(watchedType)
    }
  }, [watchedType, enableAutoConfiguration, applyTypeConfiguration])

  // Effect for virtual field toggle
  useEffect(() => {
    if (enableAutoConfiguration) {
      handleVirtualToggle(watchedIsVirtual)
    }
  }, [watchedIsVirtual, enableAutoConfiguration, handleVirtualToggle])

  // Effect for foreign key toggle
  useEffect(() => {
    if (enableAutoConfiguration) {
      handleForeignKeyToggle(watchedIsForeignKey)
    }
  }, [watchedIsForeignKey, enableAutoConfiguration, handleForeignKeyToggle])

  // Effect for reference table changes
  useEffect(() => {
    if (enableAutoConfiguration) {
      handleRefTableChange()
    }
  }, [watchedRefTable, enableAutoConfiguration, handleRefTableChange])

  return {
    fieldConfig,
    isFieldEnabled,
    isFieldVisible,
    isFieldRequired,
    getFieldDefaultValue,
    updateFieldConfig,
    resetFieldConfig,
    applyTypeConfiguration,
    handleVirtualToggle,
    handleForeignKeyToggle,
    performanceMetrics
  }
}

/**
 * Utility hook for field validation state management
 * Provides additional validation-specific functionality
 */
export function useFieldValidationState(
  form: UseFormReturn<FieldFormData>
) {
  const {
    formState: { errors, isValidating, isDirty, isValid }
  } = form

  /**
   * Check if a specific field has validation errors
   */
  const hasFieldError = useCallback((fieldName: keyof FieldFormData): boolean => {
    return !!errors[fieldName]
  }, [errors])

  /**
   * Get validation error message for a field
   */
  const getFieldError = useCallback((fieldName: keyof FieldFormData): string | undefined => {
    return errors[fieldName]?.message
  }, [errors])

  /**
   * Check if a field is currently being validated
   */
  const isFieldValidating = useCallback((fieldName: keyof FieldFormData): boolean => {
    // React Hook Form doesn't provide per-field validation state,
    // so we return the global validation state
    return isValidating
  }, [isValidating])

  return {
    hasFieldError,
    getFieldError,
    isFieldValidating,
    isDirty,
    isValid,
    errors
  }
}

/**
 * Export types for external usage
 */
export type {
  FieldFormStateOptions,
  FieldConfigState,
  FieldConfigMap,
  UseFieldFormStateReturn
}

/**
 * Export constants for external usage
 */
export {
  TYPE_DROPDOWN_OPTIONS,
  DEFAULT_FIELD_CONFIG,
  DEFAULT_CONFIG_MAP
}