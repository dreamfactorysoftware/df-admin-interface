/**
 * Field Types Management Hook for React/Next.js DreamFactory Admin Interface
 * 
 * Custom React hook providing field type dropdown options and type-specific configuration
 * data with memoized performance optimization. Manages the comprehensive list of database
 * field types and their associated constraints, validation rules, and UI configuration
 * requirements while maintaining compatibility with existing Angular functionality.
 * 
 * Migrated from Angular df-field-details component type management with enhanced React
 * patterns, performance optimization through useMemo, and comprehensive TypeScript interfaces
 * for type-safe field type management across all field management components.
 * 
 * @fileoverview Field type management hook for database schema field configuration
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import { useMemo, useCallback } from 'react';
import type { 
  FieldDataType, 
  FieldFormData,
  FIELD_TYPE_OPTIONS,
  DatabaseSchemaFieldType
} from '../field.types';
import type { DatabaseType } from '../../../../types/database';

// =============================================================================
// FIELD TYPE CONFIGURATION INTERFACES
// =============================================================================

/**
 * Field type configuration interface defining constraints and UI behavior
 */
export interface FieldTypeConfig {
  /** Field type identifier */
  type: FieldDataType | 'manual';
  /** Display label for dropdown */
  label: string;
  /** Field type category for grouping */
  category: 'Core' | 'Numeric' | 'Date/Time' | 'User' | 'Relationships' | 'Advanced' | 'Custom';
  /** Description for help text */
  description: string;
  
  // Form control configuration
  /** Controls that should be enabled for this type */
  enabledControls: FieldControlConfig;
  /** Default values for form fields */
  defaultValues: Partial<FieldFormData>;
  /** Field validation requirements */
  validationRules: FieldValidationRules;
  /** Database-specific configurations */
  databaseSupport: DatabaseTypeSupport;
  
  // UI behavior configuration
  /** Whether this type supports length specification */
  supportsLength: boolean;
  /** Whether this type supports precision/scale */
  supportsPrecision: boolean;
  /** Whether this type can be auto-increment */
  supportsAutoIncrement: boolean;
  /** Whether this type can be primary key */
  supportsPrimaryKey: boolean;
  /** Whether this type can be foreign key */
  supportsForeignKey: boolean;
  /** Whether this type supports default values */
  supportsDefault: boolean;
  /** Whether this type supports picklist */
  supportsPicklist: boolean;
}

/**
 * Form control configuration for dynamic field enabling/disabling
 */
export interface FieldControlConfig {
  /** Length input control */
  length: boolean;
  /** Precision input control */
  precision: boolean;
  /** Scale input control */
  scale: boolean;
  /** Fixed length toggle */
  fixedLength: boolean;
  /** Auto-increment toggle */
  autoIncrement: boolean;
  /** Default value input */
  defaultValue: boolean;
  /** Picklist configuration */
  picklist: boolean;
  /** Database function configuration */
  dbFunctions: boolean;
  /** Custom type input (for manual selection) */
  customType: boolean;
}

/**
 * Field validation rules for type-specific constraints
 */
export interface FieldValidationRules {
  /** Minimum length value */
  minLength?: number;
  /** Maximum length value */
  maxLength?: number;
  /** Minimum precision value */
  minPrecision?: number;
  /** Maximum precision value */
  maxPrecision?: number;
  /** Maximum scale value (relative to precision) */
  maxScale?: number;
  /** Required form fields for this type */
  requiredFields: (keyof FieldFormData)[];
  /** Incompatible constraint combinations */
  incompatibleConstraints: Array<{
    field: keyof FieldFormData;
    value: any;
    conflictsWith: Array<{ field: keyof FieldFormData; values: any[] }>;
  }>;
}

/**
 * Database-specific type support configuration
 */
export interface DatabaseTypeSupport {
  /** Supported database types */
  supportedDatabases: DatabaseType[];
  /** Database-specific type mappings */
  nativeTypes: Partial<Record<DatabaseType, string>>;
  /** Database-specific constraints */
  constraints: Partial<Record<DatabaseType, {
    maxLength?: number;
    maxPrecision?: number;
    supportsUnicode?: boolean;
    supportsBinary?: boolean;
  }>>;
}

/**
 * Field type category configuration for UI grouping
 */
export interface FieldTypeCategory {
  /** Category identifier */
  id: string;
  /** Category display label */
  label: string;
  /** Category description */
  description: string;
  /** Category icon identifier */
  icon?: string;
  /** Field types in this category */
  types: (FieldDataType | 'manual')[];
  /** Display order in UI */
  order: number;
}

/**
 * Field type metadata for enhanced UI functionality
 */
export interface FieldTypeMetadata {
  /** Type identifier */
  type: FieldDataType | 'manual';
  /** Whether type requires specific database features */
  requiresFeatures?: string[];
  /** Performance considerations for this type */
  performanceNotes?: string;
  /** Common use cases and examples */
  useCases?: string[];
  /** Related types and migration paths */
  relatedTypes?: FieldDataType[];
  /** Version compatibility information */
  compatibility?: {
    dreamfactoryMinVersion?: string;
    databaseVersions?: Partial<Record<DatabaseType, string>>;
  };
}

// =============================================================================
// FIELD TYPE CONFIGURATION DATA
// =============================================================================

/**
 * Comprehensive field type configurations with enhanced metadata
 * Migrated and enhanced from Angular component type management
 */
const FIELD_TYPE_CONFIGURATIONS: Record<FieldDataType | 'manual', FieldTypeConfig> = {
  // Manual type selection
  manual: {
    type: 'manual',
    label: 'I will manually enter a type',
    category: 'Custom',
    description: 'Define a custom database-specific type',
    enabledControls: {
      length: true,
      precision: true,
      scale: true,
      fixedLength: true,
      autoIncrement: true,
      defaultValue: true,
      picklist: true,
      dbFunctions: true,
      customType: true,
    },
    defaultValues: {
      typeSelection: 'manual',
      manualType: '',
      supportsMultibyte: false,
    },
    validationRules: {
      requiredFields: ['manualType'],
      incompatibleConstraints: [],
    },
    databaseSupport: {
      supportedDatabases: ['mysql', 'postgresql', 'oracle', 'mongodb', 'snowflake'],
      nativeTypes: {},
      constraints: {},
    },
    supportsLength: true,
    supportsPrecision: true,
    supportsAutoIncrement: true,
    supportsPrimaryKey: true,
    supportsForeignKey: true,
    supportsDefault: true,
    supportsPicklist: true,
  },

  // Core types
  id: {
    type: 'id',
    label: 'ID (Auto-increment)',
    category: 'Core',
    description: 'Auto-incrementing primary key',
    enabledControls: {
      length: false,
      precision: false,
      scale: false,
      fixedLength: false,
      autoIncrement: true,
      defaultValue: false,
      picklist: false,
      dbFunctions: false,
      customType: false,
    },
    defaultValues: {
      typeSelection: 'predefined',
      type: 'id',
      isPrimaryKey: true,
      autoIncrement: true,
      required: true,
      allowNull: false,
    },
    validationRules: {
      requiredFields: ['name', 'label', 'type'],
      incompatibleConstraints: [
        {
          field: 'allowNull',
          value: true,
          conflictsWith: [{ field: 'isPrimaryKey', values: [true] }],
        },
      ],
    },
    databaseSupport: {
      supportedDatabases: ['mysql', 'postgresql', 'oracle'],
      nativeTypes: {
        mysql: 'INT AUTO_INCREMENT',
        postgresql: 'SERIAL',
        oracle: 'NUMBER GENERATED BY DEFAULT AS IDENTITY',
      },
      constraints: {
        mysql: { maxLength: 11 },
        postgresql: { maxLength: 10 },
        oracle: { maxPrecision: 38 },
      },
    },
    supportsLength: false,
    supportsPrecision: false,
    supportsAutoIncrement: true,
    supportsPrimaryKey: true,
    supportsForeignKey: false,
    supportsDefault: false,
    supportsPicklist: false,
  },

  string: {
    type: 'string',
    label: 'String',
    category: 'Core',
    description: 'Variable-length text field',
    enabledControls: {
      length: true,
      precision: false,
      scale: false,
      fixedLength: true,
      autoIncrement: false,
      defaultValue: true,
      picklist: true,
      dbFunctions: true,
      customType: false,
    },
    defaultValues: {
      typeSelection: 'predefined',
      type: 'string',
      length: 255,
      supportsMultibyte: true,
    },
    validationRules: {
      minLength: 1,
      maxLength: 65535,
      requiredFields: ['name', 'label', 'type'],
      incompatibleConstraints: [],
    },
    databaseSupport: {
      supportedDatabases: ['mysql', 'postgresql', 'oracle', 'mongodb', 'snowflake'],
      nativeTypes: {
        mysql: 'VARCHAR',
        postgresql: 'VARCHAR',
        oracle: 'VARCHAR2',
        mongodb: 'string',
        snowflake: 'VARCHAR',
      },
      constraints: {
        mysql: { maxLength: 65535, supportsUnicode: true },
        postgresql: { maxLength: 65535, supportsUnicode: true },
        oracle: { maxLength: 4000, supportsUnicode: true },
        snowflake: { maxLength: 16777216, supportsUnicode: true },
      },
    },
    supportsLength: true,
    supportsPrecision: false,
    supportsAutoIncrement: false,
    supportsPrimaryKey: true,
    supportsForeignKey: true,
    supportsDefault: true,
    supportsPicklist: true,
  },

  integer: {
    type: 'integer',
    label: 'Integer',
    category: 'Core',
    description: 'Whole number field',
    enabledControls: {
      length: true,
      precision: false,
      scale: false,
      fixedLength: false,
      autoIncrement: true,
      defaultValue: true,
      picklist: true,
      dbFunctions: true,
      customType: false,
    },
    defaultValues: {
      typeSelection: 'predefined',
      type: 'integer',
      length: 11,
    },
    validationRules: {
      minLength: 1,
      maxLength: 20,
      requiredFields: ['name', 'label', 'type'],
      incompatibleConstraints: [],
    },
    databaseSupport: {
      supportedDatabases: ['mysql', 'postgresql', 'oracle', 'mongodb', 'snowflake'],
      nativeTypes: {
        mysql: 'INT',
        postgresql: 'INTEGER',
        oracle: 'NUMBER',
        mongodb: 'int',
        snowflake: 'INTEGER',
      },
      constraints: {
        mysql: { maxLength: 11 },
        postgresql: { maxLength: 10 },
        oracle: { maxPrecision: 38 },
      },
    },
    supportsLength: true,
    supportsPrecision: false,
    supportsAutoIncrement: true,
    supportsPrimaryKey: true,
    supportsForeignKey: true,
    supportsDefault: true,
    supportsPicklist: true,
  },

  text: {
    type: 'text',
    label: 'Text',
    category: 'Core',
    description: 'Large text content',
    enabledControls: {
      length: false,
      precision: false,
      scale: false,
      fixedLength: false,
      autoIncrement: false,
      defaultValue: true,
      picklist: false,
      dbFunctions: true,
      customType: false,
    },
    defaultValues: {
      typeSelection: 'predefined',
      type: 'text',
      supportsMultibyte: true,
    },
    validationRules: {
      requiredFields: ['name', 'label', 'type'],
      incompatibleConstraints: [
        {
          field: 'isPrimaryKey',
          value: true,
          conflictsWith: [{ field: 'type', values: ['text'] }],
        },
      ],
    },
    databaseSupport: {
      supportedDatabases: ['mysql', 'postgresql', 'oracle', 'mongodb', 'snowflake'],
      nativeTypes: {
        mysql: 'TEXT',
        postgresql: 'TEXT',
        oracle: 'CLOB',
        mongodb: 'string',
        snowflake: 'VARCHAR',
      },
      constraints: {
        mysql: { supportsUnicode: true },
        postgresql: { supportsUnicode: true },
        oracle: { supportsUnicode: true },
        snowflake: { maxLength: 16777216, supportsUnicode: true },
      },
    },
    supportsLength: false,
    supportsPrecision: false,
    supportsAutoIncrement: false,
    supportsPrimaryKey: false,
    supportsForeignKey: false,
    supportsDefault: true,
    supportsPicklist: false,
  },

  boolean: {
    type: 'boolean',
    label: 'Boolean',
    category: 'Core',
    description: 'True/false value',
    enabledControls: {
      length: false,
      precision: false,
      scale: false,
      fixedLength: false,
      autoIncrement: false,
      defaultValue: true,
      picklist: false,
      dbFunctions: true,
      customType: false,
    },
    defaultValues: {
      typeSelection: 'predefined',
      type: 'boolean',
      default: 'false',
    },
    validationRules: {
      requiredFields: ['name', 'label', 'type'],
      incompatibleConstraints: [],
    },
    databaseSupport: {
      supportedDatabases: ['mysql', 'postgresql', 'oracle', 'mongodb', 'snowflake'],
      nativeTypes: {
        mysql: 'TINYINT(1)',
        postgresql: 'BOOLEAN',
        oracle: 'NUMBER(1)',
        mongodb: 'bool',
        snowflake: 'BOOLEAN',
      },
      constraints: {},
    },
    supportsLength: false,
    supportsPrecision: false,
    supportsAutoIncrement: false,
    supportsPrimaryKey: false,
    supportsForeignKey: false,
    supportsDefault: true,
    supportsPicklist: false,
  },

  binary: {
    type: 'binary',
    label: 'Binary',
    category: 'Core',
    description: 'Binary data storage',
    enabledControls: {
      length: true,
      precision: false,
      scale: false,
      fixedLength: true,
      autoIncrement: false,
      defaultValue: false,
      picklist: false,
      dbFunctions: false,
      customType: false,
    },
    defaultValues: {
      typeSelection: 'predefined',
      type: 'binary',
      length: 255,
    },
    validationRules: {
      minLength: 1,
      maxLength: 65535,
      requiredFields: ['name', 'label', 'type'],
      incompatibleConstraints: [],
    },
    databaseSupport: {
      supportedDatabases: ['mysql', 'postgresql', 'oracle'],
      nativeTypes: {
        mysql: 'BINARY',
        postgresql: 'BYTEA',
        oracle: 'RAW',
      },
      constraints: {
        mysql: { maxLength: 255, supportsBinary: true },
        postgresql: { supportsBinary: true },
        oracle: { maxLength: 2000, supportsBinary: true },
      },
    },
    supportsLength: true,
    supportsPrecision: false,
    supportsAutoIncrement: false,
    supportsPrimaryKey: false,
    supportsForeignKey: false,
    supportsDefault: false,
    supportsPicklist: false,
  },

  // Numeric types
  float: {
    type: 'float',
    label: 'Float',
    category: 'Numeric',
    description: 'Single precision floating point',
    enabledControls: {
      length: false,
      precision: true,
      scale: true,
      fixedLength: false,
      autoIncrement: false,
      defaultValue: true,
      picklist: false,
      dbFunctions: true,
      customType: false,
    },
    defaultValues: {
      typeSelection: 'predefined',
      type: 'float',
      precision: 7,
      scale: 2,
    },
    validationRules: {
      minPrecision: 1,
      maxPrecision: 24,
      maxScale: 23,
      requiredFields: ['name', 'label', 'type'],
      incompatibleConstraints: [],
    },
    databaseSupport: {
      supportedDatabases: ['mysql', 'postgresql', 'oracle', 'snowflake'],
      nativeTypes: {
        mysql: 'FLOAT',
        postgresql: 'REAL',
        oracle: 'BINARY_FLOAT',
        snowflake: 'FLOAT',
      },
      constraints: {
        mysql: { maxPrecision: 24 },
        postgresql: { maxPrecision: 24 },
        oracle: { maxPrecision: 38 },
        snowflake: { maxPrecision: 38 },
      },
    },
    supportsLength: false,
    supportsPrecision: true,
    supportsAutoIncrement: false,
    supportsPrimaryKey: false,
    supportsForeignKey: true,
    supportsDefault: true,
    supportsPicklist: false,
  },

  double: {
    type: 'double',
    label: 'Double',
    category: 'Numeric',
    description: 'Double precision floating point',
    enabledControls: {
      length: false,
      precision: true,
      scale: true,
      fixedLength: false,
      autoIncrement: false,
      defaultValue: true,
      picklist: false,
      dbFunctions: true,
      customType: false,
    },
    defaultValues: {
      typeSelection: 'predefined',
      type: 'double',
      precision: 15,
      scale: 2,
    },
    validationRules: {
      minPrecision: 1,
      maxPrecision: 53,
      maxScale: 52,
      requiredFields: ['name', 'label', 'type'],
      incompatibleConstraints: [],
    },
    databaseSupport: {
      supportedDatabases: ['mysql', 'postgresql', 'oracle', 'snowflake'],
      nativeTypes: {
        mysql: 'DOUBLE',
        postgresql: 'DOUBLE PRECISION',
        oracle: 'BINARY_DOUBLE',
        snowflake: 'DOUBLE',
      },
      constraints: {
        mysql: { maxPrecision: 53 },
        postgresql: { maxPrecision: 53 },
        oracle: { maxPrecision: 38 },
        snowflake: { maxPrecision: 38 },
      },
    },
    supportsLength: false,
    supportsPrecision: true,
    supportsAutoIncrement: false,
    supportsPrimaryKey: false,
    supportsForeignKey: true,
    supportsDefault: true,
    supportsPicklist: false,
  },

  decimal: {
    type: 'decimal',
    label: 'Decimal',
    category: 'Numeric',
    description: 'Fixed precision decimal',
    enabledControls: {
      length: false,
      precision: true,
      scale: true,
      fixedLength: false,
      autoIncrement: false,
      defaultValue: true,
      picklist: false,
      dbFunctions: true,
      customType: false,
    },
    defaultValues: {
      typeSelection: 'predefined',
      type: 'decimal',
      precision: 10,
      scale: 2,
    },
    validationRules: {
      minPrecision: 1,
      maxPrecision: 65,
      maxScale: 30,
      requiredFields: ['name', 'label', 'type', 'precision'],
      incompatibleConstraints: [],
    },
    databaseSupport: {
      supportedDatabases: ['mysql', 'postgresql', 'oracle', 'snowflake'],
      nativeTypes: {
        mysql: 'DECIMAL',
        postgresql: 'DECIMAL',
        oracle: 'NUMBER',
        snowflake: 'DECIMAL',
      },
      constraints: {
        mysql: { maxPrecision: 65 },
        postgresql: { maxPrecision: 1000 },
        oracle: { maxPrecision: 38 },
        snowflake: { maxPrecision: 38 },
      },
    },
    supportsLength: false,
    supportsPrecision: true,
    supportsAutoIncrement: false,
    supportsPrimaryKey: true,
    supportsForeignKey: true,
    supportsDefault: true,
    supportsPicklist: false,
  },

  // Date/time types
  datetime: {
    type: 'datetime',
    label: 'DateTime',
    category: 'Date/Time',
    description: 'Date and time value',
    enabledControls: {
      length: false,
      precision: false,
      scale: false,
      fixedLength: false,
      autoIncrement: false,
      defaultValue: true,
      picklist: false,
      dbFunctions: true,
      customType: false,
    },
    defaultValues: {
      typeSelection: 'predefined',
      type: 'datetime',
    },
    validationRules: {
      requiredFields: ['name', 'label', 'type'],
      incompatibleConstraints: [],
    },
    databaseSupport: {
      supportedDatabases: ['mysql', 'postgresql', 'oracle', 'snowflake'],
      nativeTypes: {
        mysql: 'DATETIME',
        postgresql: 'TIMESTAMP',
        oracle: 'TIMESTAMP',
        snowflake: 'TIMESTAMP',
      },
      constraints: {},
    },
    supportsLength: false,
    supportsPrecision: false,
    supportsAutoIncrement: false,
    supportsPrimaryKey: false,
    supportsForeignKey: false,
    supportsDefault: true,
    supportsPicklist: false,
  },

  date: {
    type: 'date',
    label: 'Date',
    category: 'Date/Time',
    description: 'Date only value',
    enabledControls: {
      length: false,
      precision: false,
      scale: false,
      fixedLength: false,
      autoIncrement: false,
      defaultValue: true,
      picklist: false,
      dbFunctions: true,
      customType: false,
    },
    defaultValues: {
      typeSelection: 'predefined',
      type: 'date',
    },
    validationRules: {
      requiredFields: ['name', 'label', 'type'],
      incompatibleConstraints: [],
    },
    databaseSupport: {
      supportedDatabases: ['mysql', 'postgresql', 'oracle', 'snowflake'],
      nativeTypes: {
        mysql: 'DATE',
        postgresql: 'DATE',
        oracle: 'DATE',
        snowflake: 'DATE',
      },
      constraints: {},
    },
    supportsLength: false,
    supportsPrecision: false,
    supportsAutoIncrement: false,
    supportsPrimaryKey: false,
    supportsForeignKey: false,
    supportsDefault: true,
    supportsPicklist: false,
  },

  time: {
    type: 'time',
    label: 'Time',
    category: 'Date/Time',
    description: 'Time only value',
    enabledControls: {
      length: false,
      precision: false,
      scale: false,
      fixedLength: false,
      autoIncrement: false,
      defaultValue: true,
      picklist: false,
      dbFunctions: true,
      customType: false,
    },
    defaultValues: {
      typeSelection: 'predefined',
      type: 'time',
    },
    validationRules: {
      requiredFields: ['name', 'label', 'type'],
      incompatibleConstraints: [],
    },
    databaseSupport: {
      supportedDatabases: ['mysql', 'postgresql', 'oracle'],
      nativeTypes: {
        mysql: 'TIME',
        postgresql: 'TIME',
        oracle: 'TIMESTAMP',
      },
      constraints: {},
    },
    supportsLength: false,
    supportsPrecision: false,
    supportsAutoIncrement: false,
    supportsPrimaryKey: false,
    supportsForeignKey: false,
    supportsDefault: true,
    supportsPicklist: false,
  },

  timestamp: {
    type: 'timestamp',
    label: 'Timestamp',
    category: 'Date/Time',
    description: 'Unix timestamp',
    enabledControls: {
      length: false,
      precision: false,
      scale: false,
      fixedLength: false,
      autoIncrement: false,
      defaultValue: true,
      picklist: false,
      dbFunctions: true,
      customType: false,
    },
    defaultValues: {
      typeSelection: 'predefined',
      type: 'timestamp',
    },
    validationRules: {
      requiredFields: ['name', 'label', 'type'],
      incompatibleConstraints: [],
    },
    databaseSupport: {
      supportedDatabases: ['mysql', 'postgresql', 'oracle', 'snowflake'],
      nativeTypes: {
        mysql: 'TIMESTAMP',
        postgresql: 'TIMESTAMP',
        oracle: 'TIMESTAMP',
        snowflake: 'TIMESTAMP',
      },
      constraints: {},
    },
    supportsLength: false,
    supportsPrecision: false,
    supportsAutoIncrement: false,
    supportsPrimaryKey: false,
    supportsForeignKey: false,
    supportsDefault: true,
    supportsPicklist: false,
  },

  timestamp_on_create: {
    type: 'timestamp_on_create',
    label: 'Timestamp (On Create)',
    category: 'Date/Time',
    description: 'Automatically set on record creation',
    enabledControls: {
      length: false,
      precision: false,
      scale: false,
      fixedLength: false,
      autoIncrement: false,
      defaultValue: false,
      picklist: false,
      dbFunctions: false,
      customType: false,
    },
    defaultValues: {
      typeSelection: 'predefined',
      type: 'timestamp_on_create',
      required: true,
    },
    validationRules: {
      requiredFields: ['name', 'label', 'type'],
      incompatibleConstraints: [
        {
          field: 'hasDefaultValue',
          value: true,
          conflictsWith: [{ field: 'type', values: ['timestamp_on_create'] }],
        },
      ],
    },
    databaseSupport: {
      supportedDatabases: ['mysql', 'postgresql', 'oracle'],
      nativeTypes: {
        mysql: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        postgresql: 'TIMESTAMP DEFAULT NOW()',
        oracle: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
      },
      constraints: {},
    },
    supportsLength: false,
    supportsPrecision: false,
    supportsAutoIncrement: false,
    supportsPrimaryKey: false,
    supportsForeignKey: false,
    supportsDefault: false,
    supportsPicklist: false,
  },

  timestamp_on_update: {
    type: 'timestamp_on_update',
    label: 'Timestamp (On Update)',
    category: 'Date/Time',
    description: 'Automatically set on record update',
    enabledControls: {
      length: false,
      precision: false,
      scale: false,
      fixedLength: false,
      autoIncrement: false,
      defaultValue: false,
      picklist: false,
      dbFunctions: false,
      customType: false,
    },
    defaultValues: {
      typeSelection: 'predefined',
      type: 'timestamp_on_update',
      required: true,
    },
    validationRules: {
      requiredFields: ['name', 'label', 'type'],
      incompatibleConstraints: [
        {
          field: 'hasDefaultValue',
          value: true,
          conflictsWith: [{ field: 'type', values: ['timestamp_on_update'] }],
        },
      ],
    },
    databaseSupport: {
      supportedDatabases: ['mysql', 'postgresql'],
      nativeTypes: {
        mysql: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
        postgresql: 'TIMESTAMP DEFAULT NOW()',
      },
      constraints: {},
    },
    supportsLength: false,
    supportsPrecision: false,
    supportsAutoIncrement: false,
    supportsPrimaryKey: false,
    supportsForeignKey: false,
    supportsDefault: false,
    supportsPicklist: false,
  },

  // User-related types
  user_id: {
    type: 'user_id',
    label: 'User ID',
    category: 'User',
    description: 'Reference to user ID',
    enabledControls: {
      length: false,
      precision: false,
      scale: false,
      fixedLength: false,
      autoIncrement: false,
      defaultValue: true,
      picklist: false,
      dbFunctions: true,
      customType: false,
    },
    defaultValues: {
      typeSelection: 'predefined',
      type: 'user_id',
      isForeignKey: true,
      refTable: 'user',
      refField: 'id',
    },
    validationRules: {
      requiredFields: ['name', 'label', 'type'],
      incompatibleConstraints: [],
    },
    databaseSupport: {
      supportedDatabases: ['mysql', 'postgresql', 'oracle'],
      nativeTypes: {
        mysql: 'INT',
        postgresql: 'INTEGER',
        oracle: 'NUMBER',
      },
      constraints: {},
    },
    supportsLength: false,
    supportsPrecision: false,
    supportsAutoIncrement: false,
    supportsPrimaryKey: false,
    supportsForeignKey: true,
    supportsDefault: true,
    supportsPicklist: false,
  },

  user_id_on_create: {
    type: 'user_id_on_create',
    label: 'User ID (On Create)',
    category: 'User',
    description: 'Set to current user on creation',
    enabledControls: {
      length: false,
      precision: false,
      scale: false,
      fixedLength: false,
      autoIncrement: false,
      defaultValue: false,
      picklist: false,
      dbFunctions: false,
      customType: false,
    },
    defaultValues: {
      typeSelection: 'predefined',
      type: 'user_id_on_create',
      required: true,
      isForeignKey: true,
      refTable: 'user',
      refField: 'id',
    },
    validationRules: {
      requiredFields: ['name', 'label', 'type'],
      incompatibleConstraints: [],
    },
    databaseSupport: {
      supportedDatabases: ['mysql', 'postgresql', 'oracle'],
      nativeTypes: {
        mysql: 'INT',
        postgresql: 'INTEGER',
        oracle: 'NUMBER',
      },
      constraints: {},
    },
    supportsLength: false,
    supportsPrecision: false,
    supportsAutoIncrement: false,
    supportsPrimaryKey: false,
    supportsForeignKey: true,
    supportsDefault: false,
    supportsPicklist: false,
  },

  user_id_on_update: {
    type: 'user_id_on_update',
    label: 'User ID (On Update)',
    category: 'User',
    description: 'Set to current user on update',
    enabledControls: {
      length: false,
      precision: false,
      scale: false,
      fixedLength: false,
      autoIncrement: false,
      defaultValue: false,
      picklist: false,
      dbFunctions: false,
      customType: false,
    },
    defaultValues: {
      typeSelection: 'predefined',
      type: 'user_id_on_update',
      required: true,
      isForeignKey: true,
      refTable: 'user',
      refField: 'id',
    },
    validationRules: {
      requiredFields: ['name', 'label', 'type'],
      incompatibleConstraints: [],
    },
    databaseSupport: {
      supportedDatabases: ['mysql', 'postgresql', 'oracle'],
      nativeTypes: {
        mysql: 'INT',
        postgresql: 'INTEGER',
        oracle: 'NUMBER',
      },
      constraints: {},
    },
    supportsLength: false,
    supportsPrecision: false,
    supportsAutoIncrement: false,
    supportsPrimaryKey: false,
    supportsForeignKey: true,
    supportsDefault: false,
    supportsPicklist: false,
  },

  // Reference and advanced types
  reference: {
    type: 'reference',
    label: 'Reference',
    category: 'Relationships',
    description: 'Foreign key reference',
    enabledControls: {
      length: false,
      precision: false,
      scale: false,
      fixedLength: false,
      autoIncrement: false,
      defaultValue: true,
      picklist: false,
      dbFunctions: true,
      customType: false,
    },
    defaultValues: {
      typeSelection: 'predefined',
      type: 'reference',
      isForeignKey: true,
      onDeleteAction: 'RESTRICT',
      onUpdateAction: 'RESTRICT',
    },
    validationRules: {
      requiredFields: ['name', 'label', 'type', 'referenceTable', 'referenceField'],
      incompatibleConstraints: [],
    },
    databaseSupport: {
      supportedDatabases: ['mysql', 'postgresql', 'oracle'],
      nativeTypes: {
        mysql: 'INT',
        postgresql: 'INTEGER',
        oracle: 'NUMBER',
      },
      constraints: {},
    },
    supportsLength: false,
    supportsPrecision: false,
    supportsAutoIncrement: false,
    supportsPrimaryKey: false,
    supportsForeignKey: true,
    supportsDefault: true,
    supportsPicklist: false,
  },

  json: {
    type: 'json',
    label: 'JSON',
    category: 'Advanced',
    description: 'JSON document storage',
    enabledControls: {
      length: false,
      precision: false,
      scale: false,
      fixedLength: false,
      autoIncrement: false,
      defaultValue: true,
      picklist: false,
      dbFunctions: true,
      customType: false,
    },
    defaultValues: {
      typeSelection: 'predefined',
      type: 'json',
    },
    validationRules: {
      requiredFields: ['name', 'label', 'type'],
      incompatibleConstraints: [],
    },
    databaseSupport: {
      supportedDatabases: ['mysql', 'postgresql', 'mongodb'],
      nativeTypes: {
        mysql: 'JSON',
        postgresql: 'JSONB',
        mongodb: 'object',
      },
      constraints: {},
    },
    supportsLength: false,
    supportsPrecision: false,
    supportsAutoIncrement: false,
    supportsPrimaryKey: false,
    supportsForeignKey: false,
    supportsDefault: true,
    supportsPicklist: false,
  },

  xml: {
    type: 'xml',
    label: 'XML',
    category: 'Advanced',
    description: 'XML document storage',
    enabledControls: {
      length: false,
      precision: false,
      scale: false,
      fixedLength: false,
      autoIncrement: false,
      defaultValue: true,
      picklist: false,
      dbFunctions: true,
      customType: false,
    },
    defaultValues: {
      typeSelection: 'predefined',
      type: 'xml',
    },
    validationRules: {
      requiredFields: ['name', 'label', 'type'],
      incompatibleConstraints: [],
    },
    databaseSupport: {
      supportedDatabases: ['mysql', 'postgresql', 'oracle'],
      nativeTypes: {
        mysql: 'TEXT',
        postgresql: 'XML',
        oracle: 'XMLTYPE',
      },
      constraints: {},
    },
    supportsLength: false,
    supportsPrecision: false,
    supportsAutoIncrement: false,
    supportsPrimaryKey: false,
    supportsForeignKey: false,
    supportsDefault: true,
    supportsPicklist: false,
  },

  uuid: {
    type: 'uuid',
    label: 'UUID',
    category: 'Advanced',
    description: 'Universally unique identifier',
    enabledControls: {
      length: false,
      precision: false,
      scale: false,
      fixedLength: false,
      autoIncrement: false,
      defaultValue: true,
      picklist: false,
      dbFunctions: true,
      customType: false,
    },
    defaultValues: {
      typeSelection: 'predefined',
      type: 'uuid',
      length: 36,
      fixedLength: true,
    },
    validationRules: {
      requiredFields: ['name', 'label', 'type'],
      incompatibleConstraints: [],
    },
    databaseSupport: {
      supportedDatabases: ['postgresql', 'mysql'],
      nativeTypes: {
        postgresql: 'UUID',
        mysql: 'CHAR(36)',
      },
      constraints: {
        mysql: { maxLength: 36 },
        postgresql: { maxLength: 36 },
      },
    },
    supportsLength: false,
    supportsPrecision: false,
    supportsAutoIncrement: false,
    supportsPrimaryKey: true,
    supportsForeignKey: true,
    supportsDefault: true,
    supportsPicklist: false,
  },

  // Additional advanced types for completeness
  blob: {
    type: 'blob',
    label: 'BLOB',
    category: 'Advanced',
    description: 'Binary large object storage',
    enabledControls: {
      length: true,
      precision: false,
      scale: false,
      fixedLength: false,
      autoIncrement: false,
      defaultValue: false,
      picklist: false,
      dbFunctions: false,
      customType: false,
    },
    defaultValues: {
      typeSelection: 'predefined',
      type: 'blob',
    },
    validationRules: {
      requiredFields: ['name', 'label', 'type'],
      incompatibleConstraints: [],
    },
    databaseSupport: {
      supportedDatabases: ['mysql', 'oracle'],
      nativeTypes: {
        mysql: 'BLOB',
        oracle: 'BLOB',
      },
      constraints: {
        mysql: { supportsBinary: true },
        oracle: { supportsBinary: true },
      },
    },
    supportsLength: true,
    supportsPrecision: false,
    supportsAutoIncrement: false,
    supportsPrimaryKey: false,
    supportsForeignKey: false,
    supportsDefault: false,
    supportsPicklist: false,
  },

  clob: {
    type: 'clob',
    label: 'CLOB',
    category: 'Advanced',
    description: 'Character large object storage',
    enabledControls: {
      length: false,
      precision: false,
      scale: false,
      fixedLength: false,
      autoIncrement: false,
      defaultValue: false,
      picklist: false,
      dbFunctions: true,
      customType: false,
    },
    defaultValues: {
      typeSelection: 'predefined',
      type: 'clob',
    },
    validationRules: {
      requiredFields: ['name', 'label', 'type'],
      incompatibleConstraints: [],
    },
    databaseSupport: {
      supportedDatabases: ['oracle'],
      nativeTypes: {
        oracle: 'CLOB',
      },
      constraints: {
        oracle: { supportsUnicode: true },
      },
    },
    supportsLength: false,
    supportsPrecision: false,
    supportsAutoIncrement: false,
    supportsPrimaryKey: false,
    supportsForeignKey: false,
    supportsDefault: false,
    supportsPicklist: false,
  },

  // Geometric types (primarily PostgreSQL)
  geometry: {
    type: 'geometry',
    label: 'Geometry',
    category: 'Advanced',
    description: 'Geometric data type',
    enabledControls: {
      length: false,
      precision: false,
      scale: false,
      fixedLength: false,
      autoIncrement: false,
      defaultValue: false,
      picklist: false,
      dbFunctions: true,
      customType: false,
    },
    defaultValues: {
      typeSelection: 'predefined',
      type: 'geometry',
    },
    validationRules: {
      requiredFields: ['name', 'label', 'type'],
      incompatibleConstraints: [],
    },
    databaseSupport: {
      supportedDatabases: ['postgresql'],
      nativeTypes: {
        postgresql: 'GEOMETRY',
      },
      constraints: {},
    },
    supportsLength: false,
    supportsPrecision: false,
    supportsAutoIncrement: false,
    supportsPrimaryKey: false,
    supportsForeignKey: false,
    supportsDefault: false,
    supportsPicklist: false,
  },

  point: {
    type: 'point',
    label: 'Point',
    category: 'Advanced',
    description: 'Geometric point data type',
    enabledControls: {
      length: false,
      precision: false,
      scale: false,
      fixedLength: false,
      autoIncrement: false,
      defaultValue: false,
      picklist: false,
      dbFunctions: true,
      customType: false,
    },
    defaultValues: {
      typeSelection: 'predefined',
      type: 'point',
    },
    validationRules: {
      requiredFields: ['name', 'label', 'type'],
      incompatibleConstraints: [],
    },
    databaseSupport: {
      supportedDatabases: ['postgresql'],
      nativeTypes: {
        postgresql: 'POINT',
      },
      constraints: {},
    },
    supportsLength: false,
    supportsPrecision: false,
    supportsAutoIncrement: false,
    supportsPrimaryKey: false,
    supportsForeignKey: false,
    supportsDefault: false,
    supportsPicklist: false,
  },

  linestring: {
    type: 'linestring',
    label: 'LineString',
    category: 'Advanced',
    description: 'Geometric line string data type',
    enabledControls: {
      length: false,
      precision: false,
      scale: false,
      fixedLength: false,
      autoIncrement: false,
      defaultValue: false,
      picklist: false,
      dbFunctions: true,
      customType: false,
    },
    defaultValues: {
      typeSelection: 'predefined',
      type: 'linestring',
    },
    validationRules: {
      requiredFields: ['name', 'label', 'type'],
      incompatibleConstraints: [],
    },
    databaseSupport: {
      supportedDatabases: ['postgresql'],
      nativeTypes: {
        postgresql: 'LINESTRING',
      },
      constraints: {},
    },
    supportsLength: false,
    supportsPrecision: false,
    supportsAutoIncrement: false,
    supportsPrimaryKey: false,
    supportsForeignKey: false,
    supportsDefault: false,
    supportsPicklist: false,
  },

  polygon: {
    type: 'polygon',
    label: 'Polygon',
    category: 'Advanced',
    description: 'Geometric polygon data type',
    enabledControls: {
      length: false,
      precision: false,
      scale: false,
      fixedLength: false,
      autoIncrement: false,
      defaultValue: false,
      picklist: false,
      dbFunctions: true,
      customType: false,
    },
    defaultValues: {
      typeSelection: 'predefined',
      type: 'polygon',
    },
    validationRules: {
      requiredFields: ['name', 'label', 'type'],
      incompatibleConstraints: [],
    },
    databaseSupport: {
      supportedDatabases: ['postgresql'],
      nativeTypes: {
        postgresql: 'POLYGON',
      },
      constraints: {},
    },
    supportsLength: false,
    supportsPrecision: false,
    supportsAutoIncrement: false,
    supportsPrimaryKey: false,
    supportsForeignKey: false,
    supportsDefault: false,
    supportsPicklist: false,
  },

  // MySQL specific types
  enum: {
    type: 'enum',
    label: 'Enum',
    category: 'Advanced',
    description: 'Enumeration data type',
    enabledControls: {
      length: false,
      precision: false,
      scale: false,
      fixedLength: false,
      autoIncrement: false,
      defaultValue: true,
      picklist: true,
      dbFunctions: false,
      customType: false,
    },
    defaultValues: {
      typeSelection: 'predefined',
      type: 'enum',
      enablePicklist: true,
      picklistType: 'csv',
    },
    validationRules: {
      requiredFields: ['name', 'label', 'type', 'picklistValues'],
      incompatibleConstraints: [],
    },
    databaseSupport: {
      supportedDatabases: ['mysql'],
      nativeTypes: {
        mysql: 'ENUM',
      },
      constraints: {},
    },
    supportsLength: false,
    supportsPrecision: false,
    supportsAutoIncrement: false,
    supportsPrimaryKey: false,
    supportsForeignKey: false,
    supportsDefault: true,
    supportsPicklist: true,
  },

  set: {
    type: 'set',
    label: 'Set',
    category: 'Advanced',
    description: 'Set data type',
    enabledControls: {
      length: false,
      precision: false,
      scale: false,
      fixedLength: false,
      autoIncrement: false,
      defaultValue: true,
      picklist: true,
      dbFunctions: false,
      customType: false,
    },
    defaultValues: {
      typeSelection: 'predefined',
      type: 'set',
      enablePicklist: true,
      picklistType: 'csv',
    },
    validationRules: {
      requiredFields: ['name', 'label', 'type', 'picklistValues'],
      incompatibleConstraints: [],
    },
    databaseSupport: {
      supportedDatabases: ['mysql'],
      nativeTypes: {
        mysql: 'SET',
      },
      constraints: {},
    },
    supportsLength: false,
    supportsPrecision: false,
    supportsAutoIncrement: false,
    supportsPrimaryKey: false,
    supportsForeignKey: false,
    supportsDefault: true,
    supportsPicklist: true,
  },
};

/**
 * Field type categories for UI organization and grouping
 */
const FIELD_TYPE_CATEGORIES: FieldTypeCategory[] = [
  {
    id: 'custom',
    label: 'Custom',
    description: 'User-defined types and manual configuration',
    icon: 'gear',
    types: ['manual'],
    order: 1,
  },
  {
    id: 'core',
    label: 'Core Types',
    description: 'Fundamental data types for most use cases',
    icon: 'database',
    types: ['id', 'string', 'integer', 'text', 'boolean', 'binary'],
    order: 2,
  },
  {
    id: 'numeric',
    label: 'Numeric Types',
    description: 'Decimal, floating point, and precision numbers',
    icon: 'calculator',
    types: ['float', 'double', 'decimal'],
    order: 3,
  },
  {
    id: 'datetime',
    label: 'Date/Time Types',
    description: 'Date, time, and timestamp handling',
    icon: 'calendar',
    types: ['datetime', 'date', 'time', 'timestamp', 'timestamp_on_create', 'timestamp_on_update'],
    order: 4,
  },
  {
    id: 'user',
    label: 'User Types',
    description: 'User identification and tracking',
    icon: 'user',
    types: ['user_id', 'user_id_on_create', 'user_id_on_update'],
    order: 5,
  },
  {
    id: 'relationships',
    label: 'Relationships',
    description: 'Foreign keys and references',
    icon: 'link',
    types: ['reference'],
    order: 6,
  },
  {
    id: 'advanced',
    label: 'Advanced Types',
    description: 'Specialized data types and storage',
    icon: 'puzzle',
    types: ['json', 'xml', 'uuid', 'blob', 'clob', 'geometry', 'point', 'linestring', 'polygon', 'enum', 'set'],
    order: 7,
  },
];

// =============================================================================
// REACT HOOK IMPLEMENTATION
// =============================================================================

/**
 * Return type interface for the useFieldTypes hook
 */
export interface UseFieldTypesReturn {
  /** Dropdown options for field type selection */
  fieldTypeOptions: Array<{
    label: string;
    value: FieldDataType | 'manual';
    category: string;
    description: string;
  }>;
  
  /** Grouped field type options by category */
  groupedFieldTypeOptions: Array<{
    category: FieldTypeCategory;
    options: Array<{
      label: string;
      value: FieldDataType | 'manual';
      description: string;
    }>;
  }>;
  
  /** Get configuration for a specific field type */
  getFieldTypeConfig: (type: FieldDataType | 'manual') => FieldTypeConfig | null;
  
  /** Get enabled controls for a field type */
  getEnabledControls: (type: FieldDataType | 'manual') => FieldControlConfig;
  
  /** Get default values for a field type */
  getDefaultValues: (type: FieldDataType | 'manual') => Partial<FieldFormData>;
  
  /** Check if a field type supports a specific capability */
  supportsCapability: (
    type: FieldDataType | 'manual',
    capability: keyof Pick<FieldTypeConfig, 
      'supportsLength' | 'supportsPrecision' | 'supportsAutoIncrement' | 
      'supportsPrimaryKey' | 'supportsForeignKey' | 'supportsDefault' | 'supportsPicklist'
    >
  ) => boolean;
  
  /** Get field types supported by a specific database */
  getTypesForDatabase: (databaseType: DatabaseType) => (FieldDataType | 'manual')[];
  
  /** Get native database type for a field type */
  getNativeType: (fieldType: FieldDataType | 'manual', databaseType: DatabaseType) => string | null;
  
  /** Validate field type constraints */
  validateFieldTypeConstraints: (
    type: FieldDataType | 'manual',
    formData: Partial<FieldFormData>
  ) => Array<{ field: string; message: string }>;
  
  /** Get validation rules for a field type */
  getValidationRules: (type: FieldDataType | 'manual') => FieldValidationRules;
  
  /** Field type categories for UI organization */
  fieldTypeCategories: FieldTypeCategory[];
}

/**
 * Custom React hook for field type management with memoized performance optimization
 * 
 * Provides comprehensive field type configuration data, dropdown options, and utility
 * functions for type-safe field type management across all field management components.
 * Implements memoization for optimal performance and prevents unnecessary re-renders.
 * 
 * @returns UseFieldTypesReturn - Memoized field type configuration and utility functions
 * 
 * @example
 * ```tsx
 * const {
 *   fieldTypeOptions,
 *   groupedFieldTypeOptions,
 *   getFieldTypeConfig,
 *   supportsCapability,
 *   getTypesForDatabase
 * } = useFieldTypes();
 * 
 * // Use in field type dropdown
 * <Select options={fieldTypeOptions} />
 * 
 * // Check if type supports length
 * const canSetLength = supportsCapability('string', 'supportsLength');
 * 
 * // Get types for MySQL
 * const mysqlTypes = getTypesForDatabase('mysql');
 * ```
 */
export function useFieldTypes(): UseFieldTypesReturn {
  /**
   * Memoized field type dropdown options
   * Based on FIELD_TYPE_OPTIONS from field.types.ts with enhanced categorization
   */
  const fieldTypeOptions = useMemo(() => {
    return Object.values(FIELD_TYPE_CONFIGURATIONS).map(config => ({
      label: config.label,
      value: config.type,
      category: config.category,
      description: config.description,
    }));
  }, []);

  /**
   * Memoized grouped field type options organized by category
   * Enhances UX with logical type grouping per Section 7.2 UI Use Cases
   */
  const groupedFieldTypeOptions = useMemo(() => {
    return FIELD_TYPE_CATEGORIES.map(category => ({
      category,
      options: category.types.map(type => {
        const config = FIELD_TYPE_CONFIGURATIONS[type];
        return {
          label: config.label,
          value: config.type,
          description: config.description,
        };
      }),
    }));
  }, []);

  /**
   * Memoized field type categories for UI organization
   */
  const fieldTypeCategories = useMemo(() => FIELD_TYPE_CATEGORIES, []);

  /**
   * Get configuration for a specific field type
   * Provides type-safe access to field type configuration data
   */
  const getFieldTypeConfig = useCallback((type: FieldDataType | 'manual'): FieldTypeConfig | null => {
    return FIELD_TYPE_CONFIGURATIONS[type] || null;
  }, []);

  /**
   * Get enabled controls for a field type
   * Determines which form controls should be enabled/disabled based on type
   */
  const getEnabledControls = useCallback((type: FieldDataType | 'manual'): FieldControlConfig => {
    const config = FIELD_TYPE_CONFIGURATIONS[type];
    return config?.enabledControls || {
      length: false,
      precision: false,
      scale: false,
      fixedLength: false,
      autoIncrement: false,
      defaultValue: false,
      picklist: false,
      dbFunctions: false,
      customType: false,
    };
  }, []);

  /**
   * Get default values for a field type
   * Provides intelligent form defaults based on field type selection
   */
  const getDefaultValues = useCallback((type: FieldDataType | 'manual'): Partial<FieldFormData> => {
    const config = FIELD_TYPE_CONFIGURATIONS[type];
    return config?.defaultValues || {};
  }, []);

  /**
   * Check if a field type supports a specific capability
   * Type-safe capability checking for dynamic UI behavior
   */
  const supportsCapability = useCallback((
    type: FieldDataType | 'manual',
    capability: keyof Pick<FieldTypeConfig, 
      'supportsLength' | 'supportsPrecision' | 'supportsAutoIncrement' | 
      'supportsPrimaryKey' | 'supportsForeignKey' | 'supportsDefault' | 'supportsPicklist'
    >
  ): boolean => {
    const config = FIELD_TYPE_CONFIGURATIONS[type];
    return config?.[capability] || false;
  }, []);

  /**
   * Get field types supported by a specific database
   * Filters available types based on database compatibility
   */
  const getTypesForDatabase = useCallback((databaseType: DatabaseType): (FieldDataType | 'manual')[] => {
    return Object.values(FIELD_TYPE_CONFIGURATIONS)
      .filter(config => config.databaseSupport.supportedDatabases.includes(databaseType))
      .map(config => config.type);
  }, []);

  /**
   * Get native database type for a field type
   * Provides database-specific type mapping for DDL generation
   */
  const getNativeType = useCallback((
    fieldType: FieldDataType | 'manual',
    databaseType: DatabaseType
  ): string | null => {
    const config = FIELD_TYPE_CONFIGURATIONS[fieldType];
    return config?.databaseSupport.nativeTypes[databaseType] || null;
  }, []);

  /**
   * Validate field type constraints
   * Comprehensive validation based on type-specific rules and constraints
   */
  const validateFieldTypeConstraints = useCallback((
    type: FieldDataType | 'manual',
    formData: Partial<FieldFormData>
  ): Array<{ field: string; message: string }> => {
    const config = FIELD_TYPE_CONFIGURATIONS[type];
    const errors: Array<{ field: string; message: string }> = [];

    if (!config) {
      return [{ field: 'type', message: 'Invalid field type selected' }];
    }

    const { validationRules } = config;

    // Check required fields
    for (const requiredField of validationRules.requiredFields) {
      const value = formData[requiredField];
      if (value === undefined || value === null || value === '') {
        errors.push({
          field: requiredField,
          message: `${requiredField} is required for ${config.label} type`
        });
      }
    }

    // Check length constraints
    if (validationRules.minLength && formData.length && formData.length < validationRules.minLength) {
      errors.push({
        field: 'length',
        message: `Length must be at least ${validationRules.minLength} for ${config.label} type`
      });
    }

    if (validationRules.maxLength && formData.length && formData.length > validationRules.maxLength) {
      errors.push({
        field: 'length',
        message: `Length cannot exceed ${validationRules.maxLength} for ${config.label} type`
      });
    }

    // Check precision constraints
    if (validationRules.minPrecision && formData.precision && formData.precision < validationRules.minPrecision) {
      errors.push({
        field: 'precision',
        message: `Precision must be at least ${validationRules.minPrecision} for ${config.label} type`
      });
    }

    if (validationRules.maxPrecision && formData.precision && formData.precision > validationRules.maxPrecision) {
      errors.push({
        field: 'precision',
        message: `Precision cannot exceed ${validationRules.maxPrecision} for ${config.label} type`
      });
    }

    // Check scale constraints
    if (validationRules.maxScale && formData.scale && formData.scale > validationRules.maxScale) {
      errors.push({
        field: 'scale',
        message: `Scale cannot exceed ${validationRules.maxScale} for ${config.label} type`
      });
    }

    // Check scale relative to precision
    if (formData.precision && formData.scale && formData.scale > formData.precision) {
      errors.push({
        field: 'scale',
        message: 'Scale cannot be greater than precision'
      });
    }

    // Check incompatible constraints
    for (const constraint of validationRules.incompatibleConstraints) {
      if (formData[constraint.field] === constraint.value) {
        for (const conflict of constraint.conflictsWith) {
          if (conflict.values.includes(formData[conflict.field] as any)) {
            errors.push({
              field: constraint.field,
              message: `${constraint.field} is incompatible with ${conflict.field} for ${config.label} type`
            });
          }
        }
      }
    }

    return errors;
  }, []);

  /**
   * Get validation rules for a field type
   * Provides access to type-specific validation constraints
   */
  const getValidationRules = useCallback((type: FieldDataType | 'manual'): FieldValidationRules => {
    const config = FIELD_TYPE_CONFIGURATIONS[type];
    return config?.validationRules || {
      requiredFields: [],
      incompatibleConstraints: [],
    };
  }, []);

  // Return memoized hook interface
  return useMemo(() => ({
    fieldTypeOptions,
    groupedFieldTypeOptions,
    getFieldTypeConfig,
    getEnabledControls,
    getDefaultValues,
    supportsCapability,
    getTypesForDatabase,
    getNativeType,
    validateFieldTypeConstraints,
    getValidationRules,
    fieldTypeCategories,
  }), [
    fieldTypeOptions,
    groupedFieldTypeOptions,
    getFieldTypeConfig,
    getEnabledControls,
    getDefaultValues,
    supportsCapability,
    getTypesForDatabase,
    getNativeType,
    validateFieldTypeConstraints,
    getValidationRules,
    fieldTypeCategories,
  ]);
}

/**
 * Export field type configuration constants for external use
 */
export { FIELD_TYPE_CONFIGURATIONS, FIELD_TYPE_CATEGORIES };

/**
 * Export type definitions for external consumption
 */
export type {
  FieldTypeConfig,
  FieldControlConfig,
  FieldValidationRules,
  DatabaseTypeSupport,
  FieldTypeCategory,
  FieldTypeMetadata,
};