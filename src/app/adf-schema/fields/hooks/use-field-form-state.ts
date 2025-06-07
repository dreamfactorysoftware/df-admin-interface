/**
 * Field Form State Management Hook for React/Next.js DreamFactory Admin Interface
 * 
 * Custom React hook managing dynamic form field state and control enabling/disabling 
 * logic based on field type selections and relationships. Implements the complex form 
 * control management patterns from the Angular component using React state management 
 * with automatic field configuration updates.
 * 
 * Features:
 * - Dynamic form field management per existing Angular reactive form patterns
 * - Real-time form state updates under 100ms per React/Next.js Integration Requirements
 * - Type-safe form state management per Section 5.2 Component Details
 * - React Hook Form integration for optimal performance per React/Next.js Integration Requirements
 * - Conditional field visibility based on field type and relationship selections
 * - Automatic form control updates when field properties change
 * - Support for complex field configurations (picklist, virtual fields, foreign keys)
 * 
 * @fileoverview Field form state management hook for database schema field configuration
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm, useWatch, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Import field types and validation schemas
import type {
  DatabaseSchemaFieldType,
  FieldFormData,
  FieldDataType,
  TableReference,
  FieldDbFunctionFormData,
  FunctionUseOperation,
  ReferentialAction
} from '../field.types';
import {
  FieldFormDataSchema,
  DEFAULT_FIELD_CONFIG,
  FIELD_TYPE_OPTIONS
} from '../field.types';

// =============================================================================
// HOOK CONFIGURATION TYPES
// =============================================================================

/**
 * Configuration options for the field form state hook
 */
export interface UseFieldFormStateConfig {
  /** Initial field data for editing (null for new fields) */
  initialField?: DatabaseSchemaFieldType | null;
  /** Available reference tables for foreign key configuration */
  referenceTables?: TableReference[];
  /** Database type for type-specific features */
  databaseType?: string;
  /** Enable real-time validation (default: true) */
  realTimeValidation?: boolean;
  /** Validation debounce delay in milliseconds (default: 100) */
  validationDebounce?: number;
  /** Form submission handler */
  onSubmit?: (data: FieldFormData) => Promise<void>;
  /** Form cancellation handler */
  onCancel?: () => void;
}

/**
 * Return type for the field form state hook
 */
export interface UseFieldFormStateReturn {
  /** React Hook Form methods and state */
  form: UseFormReturn<FieldFormData>;
  /** Current form values with real-time updates */
  formValues: FieldFormData;
  /** Dynamic field visibility and enabling state */
  fieldState: FieldControlState;
  /** Field control helper functions */
  controls: FieldControlHelpers;
  /** Form submission state */
  submission: SubmissionState;
  /** Field configuration utilities */
  utils: FieldFormUtilities;
}

/**
 * Dynamic field control state interface
 * Manages which form controls are visible and enabled
 */
export interface FieldControlState {
  /** Whether manual type input should be shown */
  showManualType: boolean;
  /** Whether length field should be enabled */
  enableLength: boolean;
  /** Whether precision field should be enabled */
  enablePrecision: boolean;
  /** Whether scale field should be enabled */
  enableScale: boolean;
  /** Whether picklist configuration should be shown */
  showPicklist: boolean;
  /** Whether foreign key configuration should be shown */
  showForeignKey: boolean;
  /** Whether default value field should be enabled */
  enableDefault: boolean;
  /** Whether validation configuration should be shown */
  showValidation: boolean;
  /** Whether database function configuration should be shown */
  showDbFunctions: boolean;
  /** Whether auto-increment should be enabled */
  enableAutoIncrement: boolean;
  /** Whether allow null should be enabled */
  enableAllowNull: boolean;
  /** Whether virtual field options should be shown */
  showVirtualOptions: boolean;
  /** Whether constraint options should be enabled */
  enableConstraints: boolean;
}

/**
 * Field control helper functions interface
 */
export interface FieldControlHelpers {
  /** Add a new database function configuration */
  addDbFunction: () => void;
  /** Remove a database function configuration by index */
  removeDbFunction: (index: number) => void;
  /** Update picklist values from CSV string */
  updatePicklistFromCsv: (csvValues: string) => void;
  /** Update picklist values from JSON array */
  updatePicklistFromJson: (jsonValues: string[]) => void;
  /** Reset form to initial state */
  resetForm: () => void;
  /** Set field type and update dependent controls */
  setFieldType: (type: FieldDataType | 'manual') => void;
  /** Toggle virtual field mode */
  toggleVirtual: (enabled: boolean) => void;
  /** Toggle foreign key mode */
  toggleForeignKey: (enabled: boolean) => void;
  /** Validate field name uniqueness */
  validateFieldName: (name: string) => Promise<boolean>;
}

/**
 * Form submission state interface
 */
export interface SubmissionState {
  /** Whether form is currently being submitted */
  isSubmitting: boolean;
  /** Submission error if any */
  error: string | null;
  /** Whether form has been successfully submitted */
  isSuccess: boolean;
  /** Submit form with validation */
  submit: () => Promise<void>;
}

/**
 * Field form utility functions interface
 */
export interface FieldFormUtilities {
  /** Get field type options for current database */
  getFieldTypeOptions: () => typeof FIELD_TYPE_OPTIONS;
  /** Get available reference tables */
  getReferenceTableOptions: () => { label: string; value: string }[];
  /** Get available reference fields for selected table */
  getReferenceFieldOptions: (tableName: string) => { label: string; value: string }[];
  /** Check if field type supports length */
  typeSupportsLength: (type: FieldDataType) => boolean;
  /** Check if field type supports precision/scale */
  typeSupportsPrecision: (type: FieldDataType) => boolean;
  /** Check if field type supports picklist */
  typeSupportsPicklist: (type: FieldDataType) => boolean;
  /** Check if field type supports default values */
  typeSupportsDefault: (type: FieldDataType) => boolean;
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

/**
 * Custom React hook for managing dynamic field form state
 * 
 * Provides comprehensive form state management for database field configuration
 * including dynamic control enabling/disabling, real-time validation, and
 * complex field relationship handling.
 * 
 * @param config - Hook configuration options
 * @returns Complete field form state management interface
 */
export function useFieldFormState(
  config: UseFieldFormStateConfig = {}
): UseFieldFormStateReturn {
  const {
    initialField = null,
    referenceTables = [],
    databaseType = 'mysql',
    realTimeValidation = true,
    validationDebounce = 100,
    onSubmit,
    onCancel
  } = config;

  // =============================================================================
  // FORM INITIALIZATION
  // =============================================================================

  /**
   * Convert initial field data to form data format
   */
  const getInitialFormData = useCallback((): FieldFormData => {
    if (!initialField) {
      return {
        ...DEFAULT_FIELD_CONFIG,
        name: '',
        label: '',
        type: 'string',
        typeSelection: 'predefined',
        onDeleteAction: 'RESTRICT',
        onUpdateAction: 'RESTRICT',
        dbFunctions: []
      } as FieldFormData;
    }

    // Convert database field to form data
    const formData: FieldFormData = {
      name: initialField.name,
      label: initialField.label || initialField.name,
      alias: initialField.alias || undefined,
      description: initialField.description || undefined,
      
      // Type configuration
      typeSelection: initialField.dbType && !FIELD_TYPE_OPTIONS.find(opt => opt.value === initialField.type) 
        ? 'manual' 
        : 'predefined',
      type: initialField.type,
      dbType: initialField.dbType || undefined,
      manualType: initialField.dbType && !FIELD_TYPE_OPTIONS.find(opt => opt.value === initialField.type) 
        ? initialField.dbType 
        : undefined,
      
      // Size and precision
      length: initialField.length || undefined,
      precision: initialField.precision || undefined,
      scale: initialField.scale || 0,
      fixedLength: initialField.fixedLength || false,
      supportsMultibyte: initialField.supportsMultibyte || false,
      
      // Constraints
      required: initialField.required || false,
      allowNull: initialField.allowNull !== false, // Default to true if not explicitly false
      isPrimaryKey: initialField.isPrimaryKey || false,
      isForeignKey: initialField.isForeignKey || false,
      isUnique: initialField.isUnique || false,
      autoIncrement: initialField.autoIncrement || false,
      isVirtual: initialField.isVirtual || false,
      isAggregate: initialField.isAggregate || false,
      
      // Default value
      default: initialField.default || undefined,
      hasDefaultValue: !!initialField.default,
      
      // Validation (simplified for form)
      enableValidation: !!initialField.validation,
      validationRules: initialField.validation ? {
        validateOnChange: true,
        validateOnBlur: true,
        debounceMs: validationDebounce
      } : undefined,
      
      // Picklist
      enablePicklist: !!initialField.picklist,
      picklistType: 'csv' as const,
      picklistValues: initialField.picklist || undefined,
      picklistOptions: initialField.picklist ? initialField.picklist.split(',').map(v => v.trim()) : undefined,
      
      // Foreign key
      referenceTable: initialField.refTable || undefined,
      referenceField: initialField.refField || undefined,
      onDeleteAction: (initialField.refOnDelete as ReferentialAction) || 'RESTRICT',
      onUpdateAction: (initialField.refOnUpdate as ReferentialAction) || 'RESTRICT',
      
      // Database functions
      enableDbFunctions: !!initialField.dbFunction && initialField.dbFunction.length > 0,
      dbFunctions: initialField.dbFunction ? initialField.dbFunction.map((fn, index) => ({
        id: `fn-${index}`,
        use: fn.use,
        function: fn.function,
        enabled: true
      })) : []
    };

    return formData;
  }, [initialField, validationDebounce]);

  // Initialize React Hook Form with Zod validation
  const form = useForm<FieldFormData>({
    resolver: zodResolver(FieldFormDataSchema),
    defaultValues: getInitialFormData(),
    mode: realTimeValidation ? 'onChange' : 'onSubmit',
    reValidateMode: 'onChange',
    shouldFocusError: true,
    shouldUnregister: false
  });

  // Watch form values for real-time updates
  const formValues = useWatch({ control: form.control });

  // =============================================================================
  // SUBMISSION STATE MANAGEMENT
  // =============================================================================

  const [submissionState, setSubmissionState] = useState<{
    isSubmitting: boolean;
    error: string | null;
    isSuccess: boolean;
  }>({
    isSubmitting: false,
    error: null,
    isSuccess: false
  });

  // =============================================================================
  // DYNAMIC FIELD CONTROL STATE
  // =============================================================================

  /**
   * Calculate dynamic field control state based on current form values
   */
  const fieldState = useMemo((): FieldControlState => {
    const currentType = formValues?.type;
    const typeSelection = formValues?.typeSelection;
    const isVirtual = formValues?.isVirtual;
    const isForeignKey = formValues?.isForeignKey;
    const isPrimaryKey = formValues?.isPrimaryKey;
    const autoIncrement = formValues?.autoIncrement;

    return {
      // Show manual type input when manual type selection is chosen
      showManualType: typeSelection === 'manual',
      
      // Enable length for string, binary, and related types
      enableLength: !isVirtual && ['string', 'binary', 'text'].includes(currentType || ''),
      
      // Enable precision for decimal and float types
      enablePrecision: !isVirtual && ['decimal', 'float', 'double'].includes(currentType || ''),
      
      // Enable scale for decimal types
      enableScale: !isVirtual && currentType === 'decimal',
      
      // Show picklist for string and integer types (not virtual or foreign key)
      showPicklist: !isVirtual && !isForeignKey && ['string', 'integer', 'enum'].includes(currentType || ''),
      
      // Show foreign key configuration when enabled
      showForeignKey: isForeignKey && !isVirtual,
      
      // Enable default value for most types (not virtual, auto-increment, or timestamp types)
      enableDefault: !isVirtual && !autoIncrement && 
        !['timestamp_on_create', 'timestamp_on_update', 'user_id_on_create', 'user_id_on_update'].includes(currentType || ''),
      
      // Show validation for non-virtual fields
      showValidation: !isVirtual,
      
      // Show database functions for virtual or computed fields
      showDbFunctions: isVirtual || formValues?.isAggregate,
      
      // Enable auto-increment for integer and id types (not virtual or foreign key)
      enableAutoIncrement: !isVirtual && !isForeignKey && ['integer', 'id'].includes(currentType || ''),
      
      // Enable allow null for non-primary key fields
      enableAllowNull: !isPrimaryKey,
      
      // Show virtual options for computed fields
      showVirtualOptions: isVirtual,
      
      // Enable constraints for non-virtual fields
      enableConstraints: !isVirtual
    };
  }, [formValues]);

  // =============================================================================
  // FIELD CONTROL HELPERS
  // =============================================================================

  const controls = useMemo((): FieldControlHelpers => ({
    /**
     * Add a new database function configuration
     */
    addDbFunction: () => {
      const currentFunctions = form.getValues('dbFunctions') || [];
      const newFunction: FieldDbFunctionFormData = {
        id: `fn-${Date.now()}`,
        use: ['SELECT'] as FunctionUseOperation[],
        function: '',
        enabled: true
      };
      
      form.setValue('dbFunctions', [...currentFunctions, newFunction], {
        shouldValidate: true,
        shouldDirty: true
      });
    },

    /**
     * Remove a database function configuration by index
     */
    removeDbFunction: (index: number) => {
      const currentFunctions = form.getValues('dbFunctions') || [];
      const updatedFunctions = currentFunctions.filter((_, i) => i !== index);
      
      form.setValue('dbFunctions', updatedFunctions, {
        shouldValidate: true,
        shouldDirty: true
      });
    },

    /**
     * Update picklist values from CSV string
     */
    updatePicklistFromCsv: (csvValues: string) => {
      const options = csvValues.split(',').map(v => v.trim()).filter(v => v.length > 0);
      
      form.setValue('picklistValues', csvValues, { shouldValidate: true });
      form.setValue('picklistOptions', options, { shouldValidate: true });
    },

    /**
     * Update picklist values from JSON array
     */
    updatePicklistFromJson: (jsonValues: string[]) => {
      const csvValues = jsonValues.join(', ');
      
      form.setValue('picklistValues', csvValues, { shouldValidate: true });
      form.setValue('picklistOptions', jsonValues, { shouldValidate: true });
    },

    /**
     * Reset form to initial state
     */
    resetForm: () => {
      form.reset(getInitialFormData());
      setSubmissionState({
        isSubmitting: false,
        error: null,
        isSuccess: false
      });
    },

    /**
     * Set field type and update dependent controls
     */
    setFieldType: (type: FieldDataType | 'manual') => {
      if (type === 'manual') {
        form.setValue('typeSelection', 'manual', { shouldValidate: true });
        form.setValue('manualType', '', { shouldValidate: true });
      } else {
        form.setValue('typeSelection', 'predefined', { shouldValidate: true });
        form.setValue('type', type, { shouldValidate: true });
        form.setValue('manualType', undefined, { shouldValidate: true });
        
        // Auto-configure based on type
        if (type === 'id') {
          form.setValue('isPrimaryKey', true, { shouldValidate: true });
          form.setValue('autoIncrement', true, { shouldValidate: true });
          form.setValue('allowNull', false, { shouldValidate: true });
        }
        
        if (['timestamp_on_create', 'timestamp_on_update', 'user_id_on_create', 'user_id_on_update'].includes(type)) {
          form.setValue('hasDefaultValue', false, { shouldValidate: true });
          form.setValue('default', undefined, { shouldValidate: true });
        }
      }
    },

    /**
     * Toggle virtual field mode
     */
    toggleVirtual: (enabled: boolean) => {
      form.setValue('isVirtual', enabled, { shouldValidate: true });
      
      if (enabled) {
        // Disable incompatible options for virtual fields
        form.setValue('isPrimaryKey', false, { shouldValidate: true });
        form.setValue('isForeignKey', false, { shouldValidate: true });
        form.setValue('autoIncrement', false, { shouldValidate: true });
        form.setValue('enablePicklist', false, { shouldValidate: true });
        form.setValue('hasDefaultValue', false, { shouldValidate: true });
      }
    },

    /**
     * Toggle foreign key mode
     */
    toggleForeignKey: (enabled: boolean) => {
      form.setValue('isForeignKey', enabled, { shouldValidate: true });
      
      if (enabled) {
        // Disable incompatible options for foreign keys
        form.setValue('isVirtual', false, { shouldValidate: true });
        form.setValue('isPrimaryKey', false, { shouldValidate: true });
        form.setValue('autoIncrement', false, { shouldValidate: true });
        form.setValue('enablePicklist', false, { shouldValidate: true });
      } else {
        // Clear foreign key configuration
        form.setValue('referenceTable', undefined, { shouldValidate: true });
        form.setValue('referenceField', undefined, { shouldValidate: true });
      }
    },

    /**
     * Validate field name uniqueness (placeholder implementation)
     */
    validateFieldName: async (name: string): Promise<boolean> => {
      // This would typically check against existing fields in the table
      // For now, just check against reserved words
      const reservedWords = ['id', 'created_date', 'last_modified_date', 'created_by_id', 'last_modified_by_id'];
      return !reservedWords.includes(name.toLowerCase());
    }
  }), [form, getInitialFormData]);

  // =============================================================================
  // FORM UTILITIES
  // =============================================================================

  const utils = useMemo((): FieldFormUtilities => ({
    /**
     * Get field type options for current database
     */
    getFieldTypeOptions: () => {
      // Could filter options based on database type in the future
      return FIELD_TYPE_OPTIONS;
    },

    /**
     * Get available reference tables
     */
    getReferenceTableOptions: () => {
      return referenceTables.map(table => ({
        label: table.label || table.name,
        value: table.name
      }));
    },

    /**
     * Get available reference fields for selected table
     */
    getReferenceFieldOptions: (tableName: string) => {
      const table = referenceTables.find(t => t.name === tableName);
      if (!table) return [];
      
      return table.fields.map(field => ({
        label: field.label || field.name,
        value: field.name
      }));
    },

    /**
     * Check if field type supports length
     */
    typeSupportsLength: (type: FieldDataType) => {
      return ['string', 'binary', 'text'].includes(type);
    },

    /**
     * Check if field type supports precision/scale
     */
    typeSupportsPrecision: (type: FieldDataType) => {
      return ['decimal', 'float', 'double'].includes(type);
    },

    /**
     * Check if field type supports picklist
     */
    typeSupportsPicklist: (type: FieldDataType) => {
      return ['string', 'integer', 'enum'].includes(type);
    },

    /**
     * Check if field type supports default values
     */
    typeSupportsDefault: (type: FieldDataType) => {
      return !['timestamp_on_create', 'timestamp_on_update', 'user_id_on_create', 'user_id_on_update'].includes(type);
    }
  }), [referenceTables]);

  // =============================================================================
  // SUBMISSION HANDLING
  // =============================================================================

  const submission = useMemo((): SubmissionState => ({
    ...submissionState,
    
    /**
     * Submit form with validation
     */
    submit: async () => {
      if (submissionState.isSubmitting || !onSubmit) return;

      setSubmissionState(prev => ({
        ...prev,
        isSubmitting: true,
        error: null,
        isSuccess: false
      }));

      try {
        const isValid = await form.trigger();
        if (!isValid) {
          throw new Error('Form validation failed');
        }

        const formData = form.getValues();
        await onSubmit(formData);

        setSubmissionState(prev => ({
          ...prev,
          isSubmitting: false,
          isSuccess: true
        }));
      } catch (error) {
        setSubmissionState(prev => ({
          ...prev,
          isSubmitting: false,
          error: error instanceof Error ? error.message : 'Submission failed'
        }));
      }
    }
  }), [submissionState, form, onSubmit]);

  // =============================================================================
  // EFFECT HOOKS FOR DYNAMIC FORM CONTROL
  // =============================================================================

  /**
   * Effect to handle form control updates when field state changes
   */
  useEffect(() => {
    const subscription = form.watch((data, { name, type }) => {
      if (type !== 'change') return;

      // Handle cascading updates when certain fields change
      switch (name) {
        case 'isPrimaryKey':
          if (data.isPrimaryKey) {
            form.setValue('allowNull', false, { shouldValidate: true });
            form.setValue('isUnique', true, { shouldValidate: true });
          }
          break;

        case 'autoIncrement':
          if (data.autoIncrement) {
            form.setValue('hasDefaultValue', false, { shouldValidate: true });
            form.setValue('default', undefined, { shouldValidate: true });
          }
          break;

        case 'isVirtual':
          if (data.isVirtual) {
            form.setValue('isPrimaryKey', false, { shouldValidate: true });
            form.setValue('isForeignKey', false, { shouldValidate: true });
            form.setValue('autoIncrement', false, { shouldValidate: true });
            form.setValue('enablePicklist', false, { shouldValidate: true });
          }
          break;

        case 'isForeignKey':
          if (data.isForeignKey) {
            form.setValue('isVirtual', false, { shouldValidate: true });
            form.setValue('isPrimaryKey', false, { shouldValidate: true });
            form.setValue('autoIncrement', false, { shouldValidate: true });
            form.setValue('enablePicklist', false, { shouldValidate: true });
          }
          break;

        case 'enablePicklist':
          if (!data.enablePicklist) {
            form.setValue('picklistValues', undefined, { shouldValidate: true });
            form.setValue('picklistOptions', undefined, { shouldValidate: true });
          }
          break;

        case 'hasDefaultValue':
          if (!data.hasDefaultValue) {
            form.setValue('default', undefined, { shouldValidate: true });
          }
          break;
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  // =============================================================================
  // RETURN HOOK INTERFACE
  // =============================================================================

  return {
    form,
    formValues: formValues as FieldFormData,
    fieldState,
    controls,
    submission,
    utils
  };
}

/**
 * Export hook for external consumption
 */
export default useFieldFormState;

/**
 * Export related types for external use
 */
export type {
  UseFieldFormStateConfig,
  UseFieldFormStateReturn,
  FieldControlState,
  FieldControlHelpers,
  SubmissionState,
  FieldFormUtilities
};