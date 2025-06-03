/**
 * @fileoverview Custom React hook providing field type dropdown options and type-specific 
 * configuration data with memoized performance optimization. Manages the comprehensive list 
 * of database field types and their associated constraints, validation rules, and UI 
 * configuration requirements for the DreamFactory field management interface.
 * 
 * @version 1.0.0
 * @created 2024-12-28
 * 
 * Key Features:
 * - Comprehensive field type support per existing Angular type dropdown functionality
 * - Memoized performance optimization for dropdown options per React best practices
 * - Type-safe field type configuration per Section 5.2 Component Details
 * - Consistent field type handling across all field management components
 * - Field type categorization and grouping for enhanced UX per Section 7.2 UI Use Cases
 * - TypeScript interfaces for type-safe field type management per React/Next.js Integration Requirements
 */

import { useMemo } from 'react'
import type { DreamFactoryFieldType } from '../field.types'

// =============================================================================
// FIELD TYPE INTERFACES AND TYPES
// =============================================================================

/**
 * Field type option for dropdown display with enhanced categorization
 */
export interface FieldTypeOption {
  /** Field type value matching DreamFactory types */
  value: DreamFactoryFieldType | 'manual'
  /** Display label for UI */
  label: string
  /** Field type description for tooltips and help text */
  description: string
  /** Category for grouping in dropdowns */
  category: FieldTypeCategory
  /** Whether this type is commonly used */
  isCommon: boolean
  /** Icon name for visual representation */
  icon?: string
}

/**
 * Field type categories for enhanced UX organization
 */
export type FieldTypeCategory = 
  | 'text'
  | 'numeric'
  | 'datetime'
  | 'boolean'
  | 'binary'
  | 'reference'
  | 'special'
  | 'manual'

/**
 * Field configuration state determining which form controls are enabled/disabled
 */
export interface FieldTypeConfiguration {
  /** Whether manual database type entry is enabled */
  dbTypeEnabled: boolean
  /** Whether length constraint input is enabled */
  lengthEnabled: boolean
  /** Whether precision input is enabled */
  precisionEnabled: boolean
  /** Whether scale input is enabled */
  scaleEnabled: boolean
  /** Whether fixed length toggle is enabled */
  fixedLengthEnabled: boolean
  /** Whether multibyte support toggle is enabled */
  supportsMultibyteEnabled: boolean
  /** Whether picklist input is enabled */
  picklistEnabled: boolean
  /** Whether aggregate field toggle is enabled (for virtual fields) */
  isAggregateEnabled: boolean
  /** Default scale value when scale is enabled */
  defaultScale?: number
  /** Maximum length value for validation */
  maxLength?: number
  /** Supported constraints for this field type */
  supportedConstraints: string[]
  /** Validation rules specific to this field type */
  validationRules: FieldValidationRule[]
}

/**
 * Validation rule for field type-specific validation
 */
export interface FieldValidationRule {
  /** Rule identifier */
  rule: string
  /** Human-readable message */
  message: string
  /** Rule parameters */
  params?: Record<string, unknown>
}

/**
 * Field type metadata including supported features and constraints
 */
export interface FieldTypeMetadata {
  /** Field type configuration */
  configuration: FieldTypeConfiguration
  /** Supported database types for this field type */
  supportedDbTypes: string[]
  /** Default database type mapping */
  defaultDbType?: string
  /** Whether this type supports foreign key relationships */
  supportsForeignKey: boolean
  /** Whether this type supports primary key constraints */
  supportsPrimaryKey: boolean
  /** Whether this type supports unique constraints */
  supportsUnique: boolean
  /** Whether this type supports auto-increment */
  supportsAutoIncrement: boolean
  /** Whether this type supports default values */
  supportsDefault: boolean
  /** Example values for documentation */
  examples: string[]
}

/**
 * Complete field type information combining option, configuration, and metadata
 */
export interface FieldTypeInfo extends FieldTypeOption {
  /** Type-specific metadata and configuration */
  metadata: FieldTypeMetadata
}

/**
 * Hook return type providing all field type functionality
 */
export interface UseFieldTypesReturn {
  /** All available field type options */
  fieldTypeOptions: FieldTypeOption[]
  /** Field type options grouped by category */
  fieldTypesByCategory: Record<FieldTypeCategory, FieldTypeOption[]>
  /** Commonly used field types for quick access */
  commonFieldTypes: FieldTypeOption[]
  /** Get configuration for a specific field type */
  getFieldTypeConfiguration: (fieldType: DreamFactoryFieldType | 'manual') => FieldTypeConfiguration
  /** Get complete metadata for a specific field type */
  getFieldTypeMetadata: (fieldType: DreamFactoryFieldType | 'manual') => FieldTypeMetadata
  /** Get field type info including option and metadata */
  getFieldTypeInfo: (fieldType: DreamFactoryFieldType | 'manual') => FieldTypeInfo | undefined
  /** Check if a field type supports a specific feature */
  supportsFeature: (fieldType: DreamFactoryFieldType | 'manual', feature: keyof FieldTypeMetadata) => boolean
}

// =============================================================================
// FIELD TYPE DEFINITIONS AND CONFIGURATIONS
// =============================================================================

/**
 * Comprehensive field type options with categorization and metadata
 * Based on Angular implementation typeDropdownMenuOptions with enhanced organization
 */
const FIELD_TYPE_OPTIONS: FieldTypeOption[] = [
  // Manual Type Entry
  {
    value: 'manual',
    label: 'I will manually enter a type',
    description: 'Manually specify the database-specific field type',
    category: 'manual',
    isCommon: false,
    icon: 'pencil'
  },
  
  // Text Types
  {
    value: 'string',
    label: 'String',
    description: 'Variable-length character data with optional length limit',
    category: 'text',
    isCommon: true,
    icon: 'text'
  },
  {
    value: 'text',
    label: 'Text',
    description: 'Large text data for long content and descriptions',
    category: 'text',
    isCommon: true,
    icon: 'document-text'
  },
  {
    value: 'password',
    label: 'Password',
    description: 'Encrypted password field with special handling',
    category: 'text',
    isCommon: false,
    icon: 'lock-closed'
  },
  {
    value: 'email',
    label: 'Email',
    description: 'Email address with built-in validation',
    category: 'text',
    isCommon: true,
    icon: 'at-symbol'
  },
  {
    value: 'url',
    label: 'URL',
    description: 'Web URL with validation',
    category: 'text',
    isCommon: false,
    icon: 'link'
  },

  // Numeric Types
  {
    value: 'integer',
    label: 'Integer',
    description: 'Whole numbers without decimal places',
    category: 'numeric',
    isCommon: true,
    icon: 'hashtag'
  },
  {
    value: 'bigint',
    label: 'Big Integer',
    description: 'Large whole numbers for high-precision counting',
    category: 'numeric',
    isCommon: false,
    icon: 'hashtag'
  },
  {
    value: 'smallint',
    label: 'Small Integer',
    description: 'Small whole numbers with limited range',
    category: 'numeric',
    isCommon: false,
    icon: 'hashtag'
  },
  {
    value: 'decimal',
    label: 'Decimal',
    description: 'Fixed-point decimal numbers with specified precision',
    category: 'numeric',
    isCommon: true,
    icon: 'calculator'
  },
  {
    value: 'float',
    label: 'Float',
    description: 'Single-precision floating-point numbers',
    category: 'numeric',
    isCommon: false,
    icon: 'calculator'
  },
  {
    value: 'double',
    label: 'Double',
    description: 'Double-precision floating-point numbers',
    category: 'numeric',
    isCommon: false,
    icon: 'calculator'
  },
  {
    value: 'money',
    label: 'Money',
    description: 'Currency values with appropriate precision',
    category: 'numeric',
    isCommon: true,
    icon: 'currency-dollar'
  },

  // Date/Time Types
  {
    value: 'date',
    label: 'Date',
    description: 'Date values without time component',
    category: 'datetime',
    isCommon: true,
    icon: 'calendar'
  },
  {
    value: 'time',
    label: 'Time',
    description: 'Time values without date component',
    category: 'datetime',
    isCommon: false,
    icon: 'clock'
  },
  {
    value: 'datetime',
    label: 'DateTime',
    description: 'Combined date and time values',
    category: 'datetime',
    isCommon: true,
    icon: 'calendar'
  },
  {
    value: 'timestamp',
    label: 'Timestamp',
    description: 'Precise timestamp with timezone support',
    category: 'datetime',
    isCommon: true,
    icon: 'clock'
  },
  {
    value: 'timestamp_on_create',
    label: 'Timestamp on Create',
    description: 'Automatically set timestamp when record is created',
    category: 'special',
    isCommon: true,
    icon: 'plus-circle'
  },
  {
    value: 'timestamp_on_update',
    label: 'Timestamp on Update',
    description: 'Automatically updated timestamp when record is modified',
    category: 'special',
    isCommon: true,
    icon: 'pencil-square'
  },

  // Boolean Types
  {
    value: 'boolean',
    label: 'Boolean',
    description: 'True/false values',
    category: 'boolean',
    isCommon: true,
    icon: 'check-circle'
  },

  // Binary Types
  {
    value: 'binary',
    label: 'Binary',
    description: 'Fixed-length binary data',
    category: 'binary',
    isCommon: false,
    icon: 'document'
  },
  {
    value: 'varbinary',
    label: 'Variable Binary',
    description: 'Variable-length binary data',
    category: 'binary',
    isCommon: false,
    icon: 'document'
  },
  {
    value: 'blob',
    label: 'BLOB',
    description: 'Binary large object for file storage',
    category: 'binary',
    isCommon: false,
    icon: 'document'
  },
  {
    value: 'medium_blob',
    label: 'Medium BLOB',
    description: 'Medium-sized binary large object',
    category: 'binary',
    isCommon: false,
    icon: 'document'
  },
  {
    value: 'long_blob',
    label: 'Long BLOB',
    description: 'Large binary large object for big files',
    category: 'binary',
    isCommon: false,
    icon: 'document'
  },

  // Reference Types
  {
    value: 'reference',
    label: 'Reference',
    description: 'Foreign key reference to another table',
    category: 'reference',
    isCommon: true,
    icon: 'link'
  },
  {
    value: 'user_id',
    label: 'User ID',
    description: 'Reference to user table',
    category: 'reference',
    isCommon: true,
    icon: 'user'
  },
  {
    value: 'user_id_on_create',
    label: 'User ID on Create',
    description: 'Automatically set user ID when record is created',
    category: 'special',
    isCommon: true,
    icon: 'user-plus'
  },
  {
    value: 'user_id_on_update',
    label: 'User ID on Update',
    description: 'Automatically updated user ID when record is modified',
    category: 'special',
    isCommon: true,
    icon: 'user-circle'
  }
]

/**
 * Field type configurations determining form control states
 * Based on Angular component field enabling/disabling logic
 */
const FIELD_TYPE_CONFIGURATIONS: Record<DreamFactoryFieldType | 'manual', FieldTypeConfiguration> = {
  // Manual type entry configuration
  manual: {
    dbTypeEnabled: true,
    lengthEnabled: false,
    precisionEnabled: false,
    scaleEnabled: false,
    fixedLengthEnabled: false,
    supportsMultibyteEnabled: false,
    picklistEnabled: false,
    isAggregateEnabled: false,
    supportedConstraints: ['not_null', 'default', 'unique', 'primary_key'],
    validationRules: [
      {
        rule: 'required',
        message: 'Database type is required when manual type is selected'
      }
    ]
  },

  // Text type configurations
  string: {
    dbTypeEnabled: false,
    lengthEnabled: true,
    precisionEnabled: false,
    scaleEnabled: false,
    fixedLengthEnabled: true,
    supportsMultibyteEnabled: true,
    picklistEnabled: true,
    isAggregateEnabled: false,
    maxLength: 65535,
    supportedConstraints: ['not_null', 'default', 'unique', 'primary_key'],
    validationRules: [
      {
        rule: 'maxLength',
        message: 'String length cannot exceed database limits',
        params: { max: 65535 }
      }
    ]
  },

  text: {
    dbTypeEnabled: false,
    lengthEnabled: true,
    precisionEnabled: false,
    scaleEnabled: false,
    fixedLengthEnabled: false,
    supportsMultibyteEnabled: false,
    picklistEnabled: false,
    isAggregateEnabled: false,
    supportedConstraints: ['not_null', 'default'],
    validationRules: []
  },

  password: {
    dbTypeEnabled: false,
    lengthEnabled: true,
    precisionEnabled: false,
    scaleEnabled: false,
    fixedLengthEnabled: true,
    supportsMultibyteEnabled: false,
    picklistEnabled: false,
    isAggregateEnabled: false,
    supportedConstraints: ['not_null'],
    validationRules: [
      {
        rule: 'minLength',
        message: 'Password fields should have minimum length',
        params: { min: 8 }
      }
    ]
  },

  email: {
    dbTypeEnabled: false,
    lengthEnabled: true,
    precisionEnabled: false,
    scaleEnabled: false,
    fixedLengthEnabled: false,
    supportsMultibyteEnabled: false,
    picklistEnabled: false,
    isAggregateEnabled: false,
    maxLength: 320,
    supportedConstraints: ['not_null', 'default', 'unique'],
    validationRules: [
      {
        rule: 'email',
        message: 'Must be a valid email address format'
      }
    ]
  },

  url: {
    dbTypeEnabled: false,
    lengthEnabled: true,
    precisionEnabled: false,
    scaleEnabled: false,
    fixedLengthEnabled: false,
    supportsMultibyteEnabled: false,
    picklistEnabled: false,
    isAggregateEnabled: false,
    maxLength: 2048,
    supportedConstraints: ['not_null', 'default'],
    validationRules: [
      {
        rule: 'url',
        message: 'Must be a valid URL format'
      }
    ]
  },

  // Numeric type configurations
  integer: {
    dbTypeEnabled: false,
    lengthEnabled: true,
    precisionEnabled: false,
    scaleEnabled: false,
    fixedLengthEnabled: false,
    supportsMultibyteEnabled: false,
    picklistEnabled: true,
    isAggregateEnabled: false,
    supportedConstraints: ['not_null', 'default', 'unique', 'primary_key'],
    validationRules: [
      {
        rule: 'integer',
        message: 'Must be a valid integer'
      }
    ]
  },

  bigint: {
    dbTypeEnabled: false,
    lengthEnabled: false,
    precisionEnabled: false,
    scaleEnabled: false,
    fixedLengthEnabled: false,
    supportsMultibyteEnabled: false,
    picklistEnabled: false,
    isAggregateEnabled: false,
    supportedConstraints: ['not_null', 'default', 'unique', 'primary_key'],
    validationRules: [
      {
        rule: 'bigint',
        message: 'Must be a valid big integer'
      }
    ]
  },

  smallint: {
    dbTypeEnabled: false,
    lengthEnabled: false,
    precisionEnabled: false,
    scaleEnabled: false,
    fixedLengthEnabled: false,
    supportsMultibyteEnabled: false,
    picklistEnabled: false,
    isAggregateEnabled: false,
    supportedConstraints: ['not_null', 'default', 'unique'],
    validationRules: [
      {
        rule: 'smallint',
        message: 'Must be a valid small integer'
      }
    ]
  },

  decimal: {
    dbTypeEnabled: false,
    lengthEnabled: false,
    precisionEnabled: true,
    scaleEnabled: true,
    defaultScale: 0,
    fixedLengthEnabled: false,
    supportsMultibyteEnabled: false,
    picklistEnabled: false,
    isAggregateEnabled: false,
    supportedConstraints: ['not_null', 'default', 'unique'],
    validationRules: [
      {
        rule: 'decimal',
        message: 'Must be a valid decimal number'
      },
      {
        rule: 'precision',
        message: 'Precision must be greater than scale'
      }
    ]
  },

  float: {
    dbTypeEnabled: false,
    lengthEnabled: false,
    precisionEnabled: true,
    scaleEnabled: true,
    defaultScale: 0,
    fixedLengthEnabled: false,
    supportsMultibyteEnabled: false,
    picklistEnabled: false,
    isAggregateEnabled: false,
    supportedConstraints: ['not_null', 'default'],
    validationRules: [
      {
        rule: 'float',
        message: 'Must be a valid floating-point number'
      }
    ]
  },

  double: {
    dbTypeEnabled: false,
    lengthEnabled: false,
    precisionEnabled: true,
    scaleEnabled: true,
    defaultScale: 0,
    fixedLengthEnabled: false,
    supportsMultibyteEnabled: false,
    picklistEnabled: false,
    isAggregateEnabled: false,
    supportedConstraints: ['not_null', 'default'],
    validationRules: [
      {
        rule: 'double',
        message: 'Must be a valid double-precision number'
      }
    ]
  },

  money: {
    dbTypeEnabled: false,
    lengthEnabled: false,
    precisionEnabled: true,
    scaleEnabled: true,
    defaultScale: 2,
    fixedLengthEnabled: false,
    supportsMultibyteEnabled: false,
    picklistEnabled: false,
    isAggregateEnabled: false,
    supportedConstraints: ['not_null', 'default'],
    validationRules: [
      {
        rule: 'money',
        message: 'Must be a valid currency amount'
      }
    ]
  },

  // Date/Time type configurations
  date: {
    dbTypeEnabled: false,
    lengthEnabled: false,
    precisionEnabled: false,
    scaleEnabled: false,
    fixedLengthEnabled: false,
    supportsMultibyteEnabled: false,
    picklistEnabled: false,
    isAggregateEnabled: false,
    supportedConstraints: ['not_null', 'default'],
    validationRules: [
      {
        rule: 'date',
        message: 'Must be a valid date'
      }
    ]
  },

  time: {
    dbTypeEnabled: false,
    lengthEnabled: false,
    precisionEnabled: false,
    scaleEnabled: false,
    fixedLengthEnabled: false,
    supportsMultibyteEnabled: false,
    picklistEnabled: false,
    isAggregateEnabled: false,
    supportedConstraints: ['not_null', 'default'],
    validationRules: [
      {
        rule: 'time',
        message: 'Must be a valid time'
      }
    ]
  },

  datetime: {
    dbTypeEnabled: false,
    lengthEnabled: false,
    precisionEnabled: false,
    scaleEnabled: false,
    fixedLengthEnabled: false,
    supportsMultibyteEnabled: false,
    picklistEnabled: false,
    isAggregateEnabled: false,
    supportedConstraints: ['not_null', 'default'],
    validationRules: [
      {
        rule: 'datetime',
        message: 'Must be a valid date and time'
      }
    ]
  },

  timestamp: {
    dbTypeEnabled: false,
    lengthEnabled: false,
    precisionEnabled: false,
    scaleEnabled: false,
    fixedLengthEnabled: false,
    supportsMultibyteEnabled: false,
    picklistEnabled: false,
    isAggregateEnabled: false,
    supportedConstraints: ['not_null', 'default'],
    validationRules: [
      {
        rule: 'timestamp',
        message: 'Must be a valid timestamp'
      }
    ]
  },

  // Boolean type configuration
  boolean: {
    dbTypeEnabled: false,
    lengthEnabled: false,
    precisionEnabled: false,
    scaleEnabled: false,
    fixedLengthEnabled: false,
    supportsMultibyteEnabled: false,
    picklistEnabled: false,
    isAggregateEnabled: false,
    supportedConstraints: ['not_null', 'default'],
    validationRules: [
      {
        rule: 'boolean',
        message: 'Must be true or false'
      }
    ]
  },

  // Binary type configurations
  binary: {
    dbTypeEnabled: false,
    lengthEnabled: true,
    precisionEnabled: false,
    scaleEnabled: false,
    fixedLengthEnabled: false,
    supportsMultibyteEnabled: false,
    picklistEnabled: false,
    isAggregateEnabled: false,
    supportedConstraints: ['not_null'],
    validationRules: []
  },

  varbinary: {
    dbTypeEnabled: false,
    lengthEnabled: true,
    precisionEnabled: false,
    scaleEnabled: false,
    fixedLengthEnabled: false,
    supportsMultibyteEnabled: false,
    picklistEnabled: false,
    isAggregateEnabled: false,
    supportedConstraints: ['not_null'],
    validationRules: []
  },

  blob: {
    dbTypeEnabled: false,
    lengthEnabled: false,
    precisionEnabled: false,
    scaleEnabled: false,
    fixedLengthEnabled: false,
    supportsMultibyteEnabled: false,
    picklistEnabled: false,
    isAggregateEnabled: false,
    supportedConstraints: ['not_null'],
    validationRules: []
  },

  medium_blob: {
    dbTypeEnabled: false,
    lengthEnabled: false,
    precisionEnabled: false,
    scaleEnabled: false,
    fixedLengthEnabled: false,
    supportsMultibyteEnabled: false,
    picklistEnabled: false,
    isAggregateEnabled: false,
    supportedConstraints: ['not_null'],
    validationRules: []
  },

  long_blob: {
    dbTypeEnabled: false,
    lengthEnabled: false,
    precisionEnabled: false,
    scaleEnabled: false,
    fixedLengthEnabled: false,
    supportsMultibyteEnabled: false,
    picklistEnabled: false,
    isAggregateEnabled: false,
    supportedConstraints: ['not_null'],
    validationRules: []
  },

  // Reference type configurations
  reference: {
    dbTypeEnabled: false,
    lengthEnabled: false,
    precisionEnabled: false,
    scaleEnabled: false,
    fixedLengthEnabled: false,
    supportsMultibyteEnabled: false,
    picklistEnabled: false,
    isAggregateEnabled: false,
    supportedConstraints: ['not_null', 'foreign_key'],
    validationRules: [
      {
        rule: 'foreignKey',
        message: 'Must reference a valid table and field'
      }
    ]
  },

  user_id: {
    dbTypeEnabled: false,
    lengthEnabled: false,
    precisionEnabled: false,
    scaleEnabled: false,
    fixedLengthEnabled: false,
    supportsMultibyteEnabled: false,
    picklistEnabled: false,
    isAggregateEnabled: false,
    supportedConstraints: ['not_null', 'foreign_key'],
    validationRules: [
      {
        rule: 'userReference',
        message: 'Must reference a valid user'
      }
    ]
  },

  // Special automatic type configurations
  user_id_on_create: {
    dbTypeEnabled: false,
    lengthEnabled: false,
    precisionEnabled: false,
    scaleEnabled: false,
    fixedLengthEnabled: false,
    supportsMultibyteEnabled: false,
    picklistEnabled: false,
    isAggregateEnabled: false,
    supportedConstraints: ['not_null'],
    validationRules: []
  },

  user_id_on_update: {
    dbTypeEnabled: false,
    lengthEnabled: false,
    precisionEnabled: false,
    scaleEnabled: false,
    fixedLengthEnabled: false,
    supportsMultibyteEnabled: false,
    picklistEnabled: false,
    isAggregateEnabled: false,
    supportedConstraints: ['not_null'],
    validationRules: []
  },

  timestamp_on_create: {
    dbTypeEnabled: false,
    lengthEnabled: false,
    precisionEnabled: false,
    scaleEnabled: false,
    fixedLengthEnabled: false,
    supportsMultibyteEnabled: false,
    picklistEnabled: false,
    isAggregateEnabled: false,
    supportedConstraints: ['not_null'],
    validationRules: []
  },

  timestamp_on_update: {
    dbTypeEnabled: false,
    lengthEnabled: false,
    precisionEnabled: false,
    scaleEnabled: false,
    fixedLengthEnabled: false,
    supportsMultibyteEnabled: false,
    picklistEnabled: false,
    isAggregateEnabled: false,
    supportedConstraints: ['not_null'],
    validationRules: []
  }
}

/**
 * Field type metadata including database support and feature compatibility
 */
const FIELD_TYPE_METADATA: Record<DreamFactoryFieldType | 'manual', FieldTypeMetadata> = {
  manual: {
    configuration: FIELD_TYPE_CONFIGURATIONS.manual,
    supportedDbTypes: ['*'], // All database types
    supportsForeignKey: false,
    supportsPrimaryKey: true,
    supportsUnique: true,
    supportsAutoIncrement: false,
    supportsDefault: true,
    examples: ['VARCHAR(255)', 'BIGINT UNSIGNED', 'ENUM("active","inactive")']
  },

  string: {
    configuration: FIELD_TYPE_CONFIGURATIONS.string,
    supportedDbTypes: ['VARCHAR', 'CHAR', 'TEXT', 'NVARCHAR', 'NCHAR'],
    defaultDbType: 'VARCHAR',
    supportsForeignKey: false,
    supportsPrimaryKey: true,
    supportsUnique: true,
    supportsAutoIncrement: false,
    supportsDefault: true,
    examples: ['John Doe', 'Product Name', 'ABC123']
  },

  text: {
    configuration: FIELD_TYPE_CONFIGURATIONS.text,
    supportedDbTypes: ['TEXT', 'LONGTEXT', 'MEDIUMTEXT', 'CLOB'],
    defaultDbType: 'TEXT',
    supportsForeignKey: false,
    supportsPrimaryKey: false,
    supportsUnique: false,
    supportsAutoIncrement: false,
    supportsDefault: true,
    examples: ['Long description text', 'Article content', 'JSON data']
  },

  password: {
    configuration: FIELD_TYPE_CONFIGURATIONS.password,
    supportedDbTypes: ['VARCHAR', 'CHAR'],
    defaultDbType: 'VARCHAR',
    supportsForeignKey: false,
    supportsPrimaryKey: false,
    supportsUnique: false,
    supportsAutoIncrement: false,
    supportsDefault: false,
    examples: ['$2b$10$...', 'hashed_password_string']
  },

  email: {
    configuration: FIELD_TYPE_CONFIGURATIONS.email,
    supportedDbTypes: ['VARCHAR'],
    defaultDbType: 'VARCHAR',
    supportsForeignKey: false,
    supportsPrimaryKey: false,
    supportsUnique: true,
    supportsAutoIncrement: false,
    supportsDefault: true,
    examples: ['user@example.com', 'admin@company.org']
  },

  url: {
    configuration: FIELD_TYPE_CONFIGURATIONS.url,
    supportedDbTypes: ['VARCHAR', 'TEXT'],
    defaultDbType: 'VARCHAR',
    supportsForeignKey: false,
    supportsPrimaryKey: false,
    supportsUnique: false,
    supportsAutoIncrement: false,
    supportsDefault: true,
    examples: ['https://example.com', 'https://api.service.com/endpoint']
  },

  integer: {
    configuration: FIELD_TYPE_CONFIGURATIONS.integer,
    supportedDbTypes: ['INT', 'INTEGER', 'BIGINT', 'SMALLINT'],
    defaultDbType: 'INT',
    supportsForeignKey: true,
    supportsPrimaryKey: true,
    supportsUnique: true,
    supportsAutoIncrement: true,
    supportsDefault: true,
    examples: ['42', '1000', '-5']
  },

  bigint: {
    configuration: FIELD_TYPE_CONFIGURATIONS.bigint,
    supportedDbTypes: ['BIGINT'],
    defaultDbType: 'BIGINT',
    supportsForeignKey: true,
    supportsPrimaryKey: true,
    supportsUnique: true,
    supportsAutoIncrement: true,
    supportsDefault: true,
    examples: ['9223372036854775807', '1000000000000']
  },

  smallint: {
    configuration: FIELD_TYPE_CONFIGURATIONS.smallint,
    supportedDbTypes: ['SMALLINT', 'TINYINT'],
    defaultDbType: 'SMALLINT',
    supportsForeignKey: true,
    supportsPrimaryKey: true,
    supportsUnique: true,
    supportsAutoIncrement: true,
    supportsDefault: true,
    examples: ['32767', '100', '0']
  },

  decimal: {
    configuration: FIELD_TYPE_CONFIGURATIONS.decimal,
    supportedDbTypes: ['DECIMAL', 'NUMERIC'],
    defaultDbType: 'DECIMAL',
    supportsForeignKey: false,
    supportsPrimaryKey: false,
    supportsUnique: true,
    supportsAutoIncrement: false,
    supportsDefault: true,
    examples: ['999.99', '12345.678', '0.001']
  },

  float: {
    configuration: FIELD_TYPE_CONFIGURATIONS.float,
    supportedDbTypes: ['FLOAT', 'REAL'],
    defaultDbType: 'FLOAT',
    supportsForeignKey: false,
    supportsPrimaryKey: false,
    supportsUnique: false,
    supportsAutoIncrement: false,
    supportsDefault: true,
    examples: ['3.14159', '2.718', '1.414']
  },

  double: {
    configuration: FIELD_TYPE_CONFIGURATIONS.double,
    supportedDbTypes: ['DOUBLE', 'DOUBLE PRECISION'],
    defaultDbType: 'DOUBLE',
    supportsForeignKey: false,
    supportsPrimaryKey: false,
    supportsUnique: false,
    supportsAutoIncrement: false,
    supportsDefault: true,
    examples: ['3.141592653589793', '2.718281828459045']
  },

  money: {
    configuration: FIELD_TYPE_CONFIGURATIONS.money,
    supportedDbTypes: ['DECIMAL', 'MONEY', 'CURRENCY'],
    defaultDbType: 'DECIMAL',
    supportsForeignKey: false,
    supportsPrimaryKey: false,
    supportsUnique: false,
    supportsAutoIncrement: false,
    supportsDefault: true,
    examples: ['99.99', '1234.56', '0.01']
  },

  date: {
    configuration: FIELD_TYPE_CONFIGURATIONS.date,
    supportedDbTypes: ['DATE'],
    defaultDbType: 'DATE',
    supportsForeignKey: false,
    supportsPrimaryKey: false,
    supportsUnique: true,
    supportsAutoIncrement: false,
    supportsDefault: true,
    examples: ['2024-12-28', '1990-01-01', '2025-06-15']
  },

  time: {
    configuration: FIELD_TYPE_CONFIGURATIONS.time,
    supportedDbTypes: ['TIME'],
    defaultDbType: 'TIME',
    supportsForeignKey: false,
    supportsPrimaryKey: false,
    supportsUnique: false,
    supportsAutoIncrement: false,
    supportsDefault: true,
    examples: ['14:30:00', '09:15:30', '23:59:59']
  },

  datetime: {
    configuration: FIELD_TYPE_CONFIGURATIONS.datetime,
    supportedDbTypes: ['DATETIME', 'TIMESTAMP'],
    defaultDbType: 'DATETIME',
    supportsForeignKey: false,
    supportsPrimaryKey: false,
    supportsUnique: true,
    supportsAutoIncrement: false,
    supportsDefault: true,
    examples: ['2024-12-28 14:30:00', '1990-01-01 00:00:00']
  },

  timestamp: {
    configuration: FIELD_TYPE_CONFIGURATIONS.timestamp,
    supportedDbTypes: ['TIMESTAMP'],
    defaultDbType: 'TIMESTAMP',
    supportsForeignKey: false,
    supportsPrimaryKey: false,
    supportsUnique: false,
    supportsAutoIncrement: false,
    supportsDefault: true,
    examples: ['2024-12-28 14:30:00.123456', '1990-01-01 00:00:00.000000']
  },

  boolean: {
    configuration: FIELD_TYPE_CONFIGURATIONS.boolean,
    supportedDbTypes: ['BOOLEAN', 'TINYINT', 'BIT'],
    defaultDbType: 'BOOLEAN',
    supportsForeignKey: false,
    supportsPrimaryKey: false,
    supportsUnique: false,
    supportsAutoIncrement: false,
    supportsDefault: true,
    examples: ['true', 'false', '1', '0']
  },

  binary: {
    configuration: FIELD_TYPE_CONFIGURATIONS.binary,
    supportedDbTypes: ['BINARY', 'BYTEA'],
    defaultDbType: 'BINARY',
    supportsForeignKey: false,
    supportsPrimaryKey: false,
    supportsUnique: false,
    supportsAutoIncrement: false,
    supportsDefault: false,
    examples: ['Binary data', 'Fixed-length binary']
  },

  varbinary: {
    configuration: FIELD_TYPE_CONFIGURATIONS.varbinary,
    supportedDbTypes: ['VARBINARY', 'BYTEA'],
    defaultDbType: 'VARBINARY',
    supportsForeignKey: false,
    supportsPrimaryKey: false,
    supportsUnique: false,
    supportsAutoIncrement: false,
    supportsDefault: false,
    examples: ['Variable binary data', 'Image data']
  },

  blob: {
    configuration: FIELD_TYPE_CONFIGURATIONS.blob,
    supportedDbTypes: ['BLOB', 'BYTEA'],
    defaultDbType: 'BLOB',
    supportsForeignKey: false,
    supportsPrimaryKey: false,
    supportsUnique: false,
    supportsAutoIncrement: false,
    supportsDefault: false,
    examples: ['File contents', 'Image binary']
  },

  medium_blob: {
    configuration: FIELD_TYPE_CONFIGURATIONS.medium_blob,
    supportedDbTypes: ['MEDIUMBLOB', 'BYTEA'],
    defaultDbType: 'MEDIUMBLOB',
    supportsForeignKey: false,
    supportsPrimaryKey: false,
    supportsUnique: false,
    supportsAutoIncrement: false,
    supportsDefault: false,
    examples: ['Medium file contents', 'Document data']
  },

  long_blob: {
    configuration: FIELD_TYPE_CONFIGURATIONS.long_blob,
    supportedDbTypes: ['LONGBLOB', 'BYTEA'],
    defaultDbType: 'LONGBLOB',
    supportsForeignKey: false,
    supportsPrimaryKey: false,
    supportsUnique: false,
    supportsAutoIncrement: false,
    supportsDefault: false,
    examples: ['Large file contents', 'Video data']
  },

  reference: {
    configuration: FIELD_TYPE_CONFIGURATIONS.reference,
    supportedDbTypes: ['INT', 'BIGINT', 'UUID'],
    defaultDbType: 'INT',
    supportsForeignKey: true,
    supportsPrimaryKey: false,
    supportsUnique: true,
    supportsAutoIncrement: false,
    supportsDefault: false,
    examples: ['123', '456789', 'uuid-string']
  },

  user_id: {
    configuration: FIELD_TYPE_CONFIGURATIONS.user_id,
    supportedDbTypes: ['INT', 'BIGINT', 'UUID'],
    defaultDbType: 'INT',
    supportsForeignKey: true,
    supportsPrimaryKey: false,
    supportsUnique: false,
    supportsAutoIncrement: false,
    supportsDefault: false,
    examples: ['101', '202303', 'user-uuid']
  },

  user_id_on_create: {
    configuration: FIELD_TYPE_CONFIGURATIONS.user_id_on_create,
    supportedDbTypes: ['INT', 'BIGINT', 'UUID'],
    defaultDbType: 'INT',
    supportsForeignKey: true,
    supportsPrimaryKey: false,
    supportsUnique: false,
    supportsAutoIncrement: false,
    supportsDefault: false,
    examples: ['Auto-set on creation']
  },

  user_id_on_update: {
    configuration: FIELD_TYPE_CONFIGURATIONS.user_id_on_update,
    supportedDbTypes: ['INT', 'BIGINT', 'UUID'],
    defaultDbType: 'INT',
    supportsForeignKey: true,
    supportsPrimaryKey: false,
    supportsUnique: false,
    supportsAutoIncrement: false,
    supportsDefault: false,
    examples: ['Auto-updated on modification']
  },

  timestamp_on_create: {
    configuration: FIELD_TYPE_CONFIGURATIONS.timestamp_on_create,
    supportedDbTypes: ['TIMESTAMP', 'DATETIME'],
    defaultDbType: 'TIMESTAMP',
    supportsForeignKey: false,
    supportsPrimaryKey: false,
    supportsUnique: false,
    supportsAutoIncrement: false,
    supportsDefault: false,
    examples: ['Auto-set on creation']
  },

  timestamp_on_update: {
    configuration: FIELD_TYPE_CONFIGURATIONS.timestamp_on_update,
    supportedDbTypes: ['TIMESTAMP', 'DATETIME'],
    defaultDbType: 'TIMESTAMP',
    supportsForeignKey: false,
    supportsPrimaryKey: false,
    supportsUnique: false,
    supportsAutoIncrement: false,
    supportsDefault: false,
    examples: ['Auto-updated on modification']
  }
}

// =============================================================================
// REACT HOOK IMPLEMENTATION
// =============================================================================

/**
 * Custom React hook providing comprehensive field type management functionality
 * 
 * Features:
 * - Memoized field type options for optimal performance
 * - Type-specific configuration for form control management
 * - Field type categorization for enhanced UX
 * - Comprehensive metadata and validation rules
 * - Type-safe API with full TypeScript support
 * 
 * @returns {UseFieldTypesReturn} Complete field type management functionality
 */
export function useFieldTypes(): UseFieldTypesReturn {
  /**
   * Memoized field type options to prevent unnecessary re-renders
   * Includes all available field types with categorization and metadata
   */
  const fieldTypeOptions = useMemo(() => FIELD_TYPE_OPTIONS, [])

  /**
   * Memoized field types grouped by category for enhanced UX
   * Enables category-based dropdown organization and filtering
   */
  const fieldTypesByCategory = useMemo(() => {
    const categories: Record<FieldTypeCategory, FieldTypeOption[]> = {
      manual: [],
      text: [],
      numeric: [],
      datetime: [],
      boolean: [],
      binary: [],
      reference: [],
      special: []
    }

    fieldTypeOptions.forEach(option => {
      categories[option.category].push(option)
    })

    return categories
  }, [fieldTypeOptions])

  /**
   * Memoized commonly used field types for quick access
   * Provides frequently used types for improved user experience
   */
  const commonFieldTypes = useMemo(() => 
    fieldTypeOptions.filter(option => option.isCommon),
    [fieldTypeOptions]
  )

  /**
   * Get field type configuration for form control management
   * 
   * @param fieldType - The field type to get configuration for
   * @returns Field type configuration determining enabled/disabled controls
   */
  const getFieldTypeConfiguration = useMemo(() => 
    (fieldType: DreamFactoryFieldType | 'manual'): FieldTypeConfiguration => {
      return FIELD_TYPE_CONFIGURATIONS[fieldType] || FIELD_TYPE_CONFIGURATIONS.manual
    },
    []
  )

  /**
   * Get complete metadata for a specific field type
   * 
   * @param fieldType - The field type to get metadata for
   * @returns Complete field type metadata including database support and features
   */
  const getFieldTypeMetadata = useMemo(() =>
    (fieldType: DreamFactoryFieldType | 'manual'): FieldTypeMetadata => {
      return FIELD_TYPE_METADATA[fieldType] || FIELD_TYPE_METADATA.manual
    },
    []
  )

  /**
   * Get complete field type information including option and metadata
   * 
   * @param fieldType - The field type to get info for
   * @returns Complete field type information or undefined if not found
   */
  const getFieldTypeInfo = useMemo(() =>
    (fieldType: DreamFactoryFieldType | 'manual'): FieldTypeInfo | undefined => {
      const option = fieldTypeOptions.find(opt => opt.value === fieldType)
      if (!option) return undefined

      const metadata = getFieldTypeMetadata(fieldType)
      return {
        ...option,
        metadata
      }
    },
    [fieldTypeOptions, getFieldTypeMetadata]
  )

  /**
   * Check if a field type supports a specific feature
   * 
   * @param fieldType - The field type to check
   * @param feature - The feature property to check
   * @returns Whether the field type supports the specified feature
   */
  const supportsFeature = useMemo(() =>
    (fieldType: DreamFactoryFieldType | 'manual', feature: keyof FieldTypeMetadata): boolean => {
      const metadata = getFieldTypeMetadata(fieldType)
      const featureValue = metadata[feature]
      
      // Handle boolean features
      if (typeof featureValue === 'boolean') {
        return featureValue
      }
      
      // Handle array features (check if not empty)
      if (Array.isArray(featureValue)) {
        return featureValue.length > 0
      }
      
      // Handle other features (check if truthy)
      return Boolean(featureValue)
    },
    [getFieldTypeMetadata]
  )

  return {
    fieldTypeOptions,
    fieldTypesByCategory,
    commonFieldTypes,
    getFieldTypeConfiguration,
    getFieldTypeMetadata,
    getFieldTypeInfo,
    supportsFeature
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export default useFieldTypes

/**
 * Re-export types for convenient importing
 */
export type {
  FieldTypeOption,
  FieldTypeCategory,
  FieldTypeConfiguration,
  FieldValidationRule,
  FieldTypeMetadata,
  FieldTypeInfo,
  UseFieldTypesReturn
}