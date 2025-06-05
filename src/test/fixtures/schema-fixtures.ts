/**
 * Database schema fixture factory functions for testing React components and schema discovery workflows
 * 
 * Provides comprehensive factory functions for creating table definitions, field configurations,
 * relationships, and schema validation data to support testing of schema management interfaces.
 * 
 * Features:
 * - Support for large schema scenarios (1000+ tables) with TanStack Virtual integration
 * - Realistic database field metadata with proper data types and constraints
 * - Table relationships including foreign keys and associations
 * - Schema introspection results with hierarchical data structures
 * - Field validation rules and constraint configurations
 * - Schema import/export workflow testing data
 * 
 * @see Technical Specification Section F-002: Schema Discovery and Browsing
 */

import { faker } from '@faker-js/faker';

// Core schema types - these will be imported once the type files are created
export interface SchemaData {
  serviceName: string;
  databaseName: string;
  schemaName?: string;
  tables: SchemaTable[];
  views: SchemaView[];
  procedures?: StoredProcedure[];
  functions?: DatabaseFunction[];
  sequences?: Sequence[];
  lastDiscovered: string;
  totalTables: number;
  totalFields: number;
}

export interface SchemaTable {
  name: string;
  label?: string;
  description?: string;
  schema?: string;
  fields: SchemaField[];
  primaryKey?: string[];
  foreignKeys: ForeignKey[];
  indexes: TableIndex[];
  constraints: TableConstraint[];
  triggers?: Trigger[];
  
  // Metadata
  rowCount?: number;
  estimatedSize?: string;
  lastModified?: string;
  collation?: string;
  engine?: string;
  
  // UI state
  expanded?: boolean;
  selected?: boolean;
  apiEnabled?: boolean;
}

export interface SchemaField {
  name: string;
  type: FieldType;
  dbType: string;
  length?: number;
  precision?: number;
  scale?: number;
  defaultValue?: any;
  isNullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  isUnique: boolean;
  isAutoIncrement?: boolean;
  isComputed?: boolean;
  
  // Validation and constraints
  validation?: FieldValidation;
  constraints?: FieldConstraint[];
  
  // UI metadata
  label?: string;
  description?: string;
  format?: FieldFormat;
  hidden?: boolean;
}

export type FieldType = 
  | 'integer'
  | 'bigint'
  | 'decimal'
  | 'float'
  | 'double'
  | 'string'
  | 'text'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'timestamp'
  | 'time'
  | 'binary'
  | 'json'
  | 'xml'
  | 'uuid'
  | 'enum'
  | 'set';

export interface FieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  min?: number;
  max?: number;
  enum?: string[];
  format?: string;
  customValidator?: string;
}

export interface FieldConstraint {
  type: ConstraintType;
  definition: string;
  name?: string;
  message?: string;
}

export type ConstraintType = 
  | 'check'
  | 'unique'
  | 'foreign_key'
  | 'primary_key'
  | 'default'
  | 'not_null';

export interface FieldFormat {
  mask?: string;
  placeholder?: string;
  prefix?: string;
  suffix?: string;
  uppercase?: boolean;
  lowercase?: boolean;
  capitalize?: boolean;
}

export interface ForeignKey {
  name: string;
  field: string;
  referencedTable: string;
  referencedField: string;
  onDelete?: ReferentialAction;
  onUpdate?: ReferentialAction;
  deferrable?: boolean;
}

export type ReferentialAction = 
  | 'NO ACTION'
  | 'RESTRICT'
  | 'CASCADE'
  | 'SET NULL'
  | 'SET DEFAULT';

export interface TableIndex {
  name: string;
  fields: string[];
  unique: boolean;
  type?: IndexType;
  method?: string;
  condition?: string;
}

export type IndexType = 
  | 'btree'
  | 'hash'
  | 'gist'
  | 'gin'
  | 'brin'
  | 'spgist';

export interface TableConstraint {
  name: string;
  type: ConstraintType;
  definition: string;
  fields: string[];
}

export interface SchemaView {
  name: string;
  definition: string;
  fields: SchemaField[];
  updatable: boolean;
  checkOption?: string;
}

export interface StoredProcedure {
  name: string;
  parameters: ProcedureParameter[];
  returnType?: string;
  definition: string;
  language?: string;
}

export interface ProcedureParameter {
  name: string;
  type: string;
  mode: 'IN' | 'OUT' | 'INOUT';
  defaultValue?: string;
}

export interface DatabaseFunction {
  name: string;
  parameters: FunctionParameter[];
  returnType: string;
  definition: string;
  language?: string;
  immutable?: boolean;
}

export interface FunctionParameter {
  name: string;
  type: string;
  defaultValue?: string;
}

export interface Sequence {
  name: string;
  increment: number;
  minValue?: number;
  maxValue?: number;
  startValue: number;
  cache?: number;
  cycle?: boolean;
}

export interface Trigger {
  name: string;
  timing: 'BEFORE' | 'AFTER' | 'INSTEAD OF';
  events: TriggerEvent[];
  definition: string;
}

export type TriggerEvent = 'INSERT' | 'UPDATE' | 'DELETE';

/**
 * Configuration options for schema factory functions
 */
export interface SchemaFactoryOptions {
  // Basic configuration
  serviceName?: string;
  databaseName?: string;
  schemaName?: string;
  
  // Scale configuration
  tableCount?: number;
  avgFieldsPerTable?: number;
  relationshipDensity?: number; // 0-1, percentage of tables with relationships
  
  // Database type configuration
  databaseType?: 'mysql' | 'postgresql' | 'sqlserver' | 'oracle' | 'mongodb' | 'snowflake';
  
  // Feature toggles
  includeViews?: boolean;
  includeProcedures?: boolean;
  includeFunctions?: boolean;
  includeSequences?: boolean;
  includeTriggers?: boolean;
  
  // UI testing options
  expandedTables?: string[];
  selectedTables?: string[];
  apiEnabledTables?: string[];
  
  // Performance testing
  largeDataset?: boolean; // Generates 1000+ tables for TanStack Virtual testing
}

/**
 * Field type configurations by database type
 */
const DATABASE_FIELD_TYPES = {
  mysql: ['INT', 'VARCHAR', 'TEXT', 'DATETIME', 'DECIMAL', 'BOOLEAN', 'JSON', 'BLOB'],
  postgresql: ['INTEGER', 'VARCHAR', 'TEXT', 'TIMESTAMP', 'NUMERIC', 'BOOLEAN', 'JSONB', 'BYTEA', 'UUID'],
  sqlserver: ['INT', 'NVARCHAR', 'NTEXT', 'DATETIME2', 'DECIMAL', 'BIT', 'VARBINARY'],
  oracle: ['NUMBER', 'VARCHAR2', 'CLOB', 'DATE', 'TIMESTAMP', 'RAW', 'XMLType'],
  mongodb: ['ObjectId', 'String', 'Number', 'Date', 'Boolean', 'Array', 'Object'],
  snowflake: ['INTEGER', 'VARCHAR', 'TEXT', 'TIMESTAMP_NTZ', 'NUMBER', 'BOOLEAN', 'VARIANT', 'BINARY']
};

/**
 * Common table name patterns for realistic data generation
 */
const COMMON_TABLE_PATTERNS = [
  'users', 'customers', 'orders', 'products', 'categories', 'transactions', 'payments',
  'invoices', 'addresses', 'employees', 'departments', 'roles', 'permissions',
  'sessions', 'logs', 'events', 'notifications', 'settings', 'configurations',
  'reports', 'analytics', 'metrics', 'audits', 'backups', 'migrations'
];

/**
 * Field name patterns for realistic field generation
 */
const FIELD_NAME_PATTERNS = {
  id: ['id', 'uuid', 'pk', 'primary_key'],
  string: ['name', 'title', 'description', 'email', 'phone', 'address', 'code', 'status'],
  number: ['price', 'quantity', 'amount', 'count', 'total', 'score', 'rating', 'version'],
  date: ['created_at', 'updated_at', 'deleted_at', 'published_at', 'expires_at', 'date_created'],
  boolean: ['is_active', 'is_enabled', 'is_deleted', 'is_published', 'is_verified', 'enabled'],
  foreign: ['user_id', 'customer_id', 'order_id', 'product_id', 'category_id', 'parent_id']
};

/**
 * Factory function for generating database field definitions with realistic metadata
 * 
 * @param options Configuration options for field generation
 * @returns SchemaField with proper data types and constraints
 */
export function fieldDefinitionFactory(options: {
  name?: string;
  type?: FieldType;
  dbType?: string;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  isUnique?: boolean;
  isNullable?: boolean;
  databaseType?: string;
  validation?: Partial<FieldValidation>;
} = {}): SchemaField {
  const databaseType = options.databaseType || 'mysql';
  const availableDbTypes = DATABASE_FIELD_TYPES[databaseType as keyof typeof DATABASE_FIELD_TYPES] || DATABASE_FIELD_TYPES.mysql;
  
  // Generate appropriate field name if not provided
  const fieldName = options.name || (() => {
    if (options.isPrimaryKey) return faker.helpers.arrayElement(FIELD_NAME_PATTERNS.id);
    if (options.isForeignKey) return faker.helpers.arrayElement(FIELD_NAME_PATTERNS.foreign);
    
    const typePatterns = {
      string: FIELD_NAME_PATTERNS.string,
      integer: FIELD_NAME_PATTERNS.number,
      bigint: FIELD_NAME_PATTERNS.number,
      decimal: FIELD_NAME_PATTERNS.number,
      float: FIELD_NAME_PATTERNS.number,
      boolean: FIELD_NAME_PATTERNS.boolean,
      date: FIELD_NAME_PATTERNS.date,
      datetime: FIELD_NAME_PATTERNS.date,
      timestamp: FIELD_NAME_PATTERNS.date
    };
    
    const patternType = options.type || 'string';
    const patterns = typePatterns[patternType as keyof typeof typePatterns] || FIELD_NAME_PATTERNS.string;
    return faker.helpers.arrayElement(patterns);
  })();
  
  // Determine field type based on name pattern if not provided
  const fieldType = options.type || (() => {
    if (fieldName.includes('id') || fieldName.includes('pk')) return 'integer';
    if (fieldName.includes('_at') || fieldName.includes('date')) return 'datetime';
    if (fieldName.includes('is_') || fieldName.includes('enabled')) return 'boolean';
    if (fieldName.includes('count') || fieldName.includes('quantity') || fieldName.includes('amount')) return 'integer';
    if (fieldName.includes('price') || fieldName.includes('total')) return 'decimal';
    return 'string';
  })();
  
  // Map field type to database-specific type
  const dbType = options.dbType || (() => {
    const typeMapping = {
      mysql: {
        integer: 'INT',
        bigint: 'BIGINT',
        decimal: 'DECIMAL',
        float: 'FLOAT',
        double: 'DOUBLE',
        string: 'VARCHAR',
        text: 'TEXT',
        boolean: 'BOOLEAN',
        date: 'DATE',
        datetime: 'DATETIME',
        timestamp: 'TIMESTAMP',
        binary: 'BLOB',
        json: 'JSON',
        uuid: 'VARCHAR'
      },
      postgresql: {
        integer: 'INTEGER',
        bigint: 'BIGINT',
        decimal: 'NUMERIC',
        float: 'REAL',
        double: 'DOUBLE PRECISION',
        string: 'VARCHAR',
        text: 'TEXT',
        boolean: 'BOOLEAN',
        date: 'DATE',
        datetime: 'TIMESTAMP',
        timestamp: 'TIMESTAMP',
        binary: 'BYTEA',
        json: 'JSONB',
        uuid: 'UUID'
      }
    };
    
    const mapping = typeMapping[databaseType as keyof typeof typeMapping] || typeMapping.mysql;
    return mapping[fieldType as keyof typeof mapping] || 'VARCHAR';
  })();
  
  // Generate field properties
  const isPrimaryKey = options.isPrimaryKey ?? (fieldName === 'id' && Math.random() > 0.3);
  const isForeignKey = options.isForeignKey ?? (fieldName.endsWith('_id') && !isPrimaryKey && Math.random() > 0.5);
  const isUnique = options.isUnique ?? (isPrimaryKey || Math.random() > 0.8);
  const isNullable = options.isNullable ?? (!isPrimaryKey && Math.random() > 0.3);
  
  // Generate length/precision based on type
  const length = (() => {
    if (fieldType === 'string') return faker.number.int({ min: 50, max: 255 });
    if (fieldType === 'decimal') return faker.number.int({ min: 8, max: 15 });
    return undefined;
  })();
  
  const precision = fieldType === 'decimal' ? faker.number.int({ min: 2, max: 4 }) : undefined;
  const scale = fieldType === 'decimal' ? faker.number.int({ min: 0, max: precision || 2 }) : undefined;
  
  // Generate default value
  const defaultValue = (() => {
    if (isNullable && Math.random() > 0.7) return null;
    if (fieldType === 'boolean') return faker.datatype.boolean();
    if (fieldType === 'integer') return isPrimaryKey ? undefined : faker.number.int({ min: 0, max: 1000 });
    if (fieldType === 'string' && Math.random() > 0.8) return faker.lorem.word();
    if (fieldType === 'datetime' && fieldName.includes('created_at')) return 'CURRENT_TIMESTAMP';
    return undefined;
  })();
  
  // Generate validation rules
  const validation: FieldValidation = {
    required: !isNullable,
    ...options.validation
  };
  
  if (fieldType === 'string' && length) {
    validation.maxLength = length;
    if (fieldName.includes('email')) {
      validation.pattern = '^[^@]+@[^@]+\\.[^@]+$';
      validation.format = 'email';
    }
    if (fieldName.includes('phone')) {
      validation.pattern = '^\\+?[1-9]\\d{1,14}$';
      validation.format = 'phone';
    }
  }
  
  if (fieldType === 'integer' || fieldType === 'decimal') {
    if (fieldName.includes('price') || fieldName.includes('amount')) {
      validation.min = 0;
    }
    if (fieldType === 'integer') {
      validation.max = 2147483647; // INT max value
    }
  }
  
  // Generate constraints
  const constraints: FieldConstraint[] = [];
  
  if (!isNullable) {
    constraints.push({
      type: 'not_null',
      definition: `${fieldName} IS NOT NULL`,
      name: `${fieldName}_not_null`
    });
  }
  
  if (isUnique && !isPrimaryKey) {
    constraints.push({
      type: 'unique',
      definition: `UNIQUE (${fieldName})`,
      name: `${fieldName}_unique`
    });
  }
  
  if (fieldName.includes('email')) {
    constraints.push({
      type: 'check',
      definition: `${fieldName} LIKE '%@%'`,
      name: `${fieldName}_email_check`
    });
  }
  
  return {
    name: fieldName,
    type: fieldType,
    dbType,
    length,
    precision,
    scale,
    defaultValue,
    isNullable,
    isPrimaryKey,
    isForeignKey,
    isUnique,
    isAutoIncrement: isPrimaryKey && fieldType === 'integer',
    isComputed: false,
    validation,
    constraints,
    label: fieldName.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' '),
    description: faker.lorem.sentence()
  };
}

/**
 * Factory function for generating table relationships including foreign keys and associations
 * 
 * @param options Configuration options for relationship generation
 * @returns ForeignKey relationship definition
 */
export function relationshipFactory(options: {
  fieldName?: string;
  referencedTable?: string;
  referencedField?: string;
  onDelete?: ReferentialAction;
  onUpdate?: ReferentialAction;
  deferrable?: boolean;
} = {}): ForeignKey {
  const fieldName = options.fieldName || faker.helpers.arrayElement(FIELD_NAME_PATTERNS.foreign);
  const referencedTable = options.referencedTable || (() => {
    // Extract base name from foreign key field (e.g., 'user_id' -> 'users')
    const baseName = fieldName.replace(/_id$/, '');
    return COMMON_TABLE_PATTERNS.find(pattern => pattern.startsWith(baseName)) || 
           faker.helpers.arrayElement(COMMON_TABLE_PATTERNS);
  })();
  
  const referencedField = options.referencedField || 'id';
  const onDelete = options.onDelete || faker.helpers.arrayElement(['CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION'] as ReferentialAction[]);
  const onUpdate = options.onUpdate || faker.helpers.arrayElement(['CASCADE', 'RESTRICT', 'NO ACTION'] as ReferentialAction[]);
  
  return {
    name: `fk_${fieldName}_${referencedTable}`,
    field: fieldName,
    referencedTable,
    referencedField,
    onDelete,
    onUpdate,
    deferrable: options.deferrable ?? Math.random() > 0.8
  };
}

/**
 * Factory function for generating database table definitions with realistic field configurations
 * 
 * @param options Configuration options for table generation
 * @returns SchemaTable with comprehensive metadata
 */
export function tableSchemaFactory(options: {
  name?: string;
  fieldCount?: number;
  includeRelationships?: boolean;
  databaseType?: string;
  schema?: string;
  apiEnabled?: boolean;
  expanded?: boolean;
  selected?: boolean;
} = {}): SchemaTable {
  const tableName = options.name || faker.helpers.arrayElement(COMMON_TABLE_PATTERNS);
  const fieldCount = options.fieldCount || faker.number.int({ min: 3, max: 15 });
  const databaseType = options.databaseType || 'mysql';
  
  // Generate fields
  const fields: SchemaField[] = [];
  
  // Always include an ID field as primary key
  fields.push(fieldDefinitionFactory({
    name: 'id',
    type: 'integer',
    isPrimaryKey: true,
    isUnique: true,
    isNullable: false,
    databaseType
  }));
  
  // Generate additional fields
  for (let i = 1; i < fieldCount; i++) {
    const isForeignKey = options.includeRelationships !== false && Math.random() > 0.7 && i < 3;
    fields.push(fieldDefinitionFactory({
      isForeignKey,
      databaseType,
      isNullable: Math.random() > 0.3
    }));
  }
  
  // Generate foreign keys based on foreign key fields
  const foreignKeys: ForeignKey[] = [];
  if (options.includeRelationships !== false) {
    fields.filter(field => field.isForeignKey).forEach(field => {
      foreignKeys.push(relationshipFactory({
        fieldName: field.name
      }));
    });
  }
  
  // Generate indexes
  const indexes: TableIndex[] = [];
  
  // Primary key index
  indexes.push({
    name: `pk_${tableName}`,
    fields: ['id'],
    unique: true,
    type: 'btree'
  });
  
  // Additional indexes
  const uniqueFields = fields.filter(field => field.isUnique && !field.isPrimaryKey);
  uniqueFields.forEach(field => {
    indexes.push({
      name: `idx_${tableName}_${field.name}`,
      fields: [field.name],
      unique: true,
      type: 'btree'
    });
  });
  
  // Foreign key indexes
  foreignKeys.forEach(fk => {
    indexes.push({
      name: `idx_${tableName}_${fk.field}`,
      fields: [fk.field],
      unique: false,
      type: 'btree'
    });
  });
  
  // Generate constraints
  const constraints: TableConstraint[] = [];
  
  // Primary key constraint
  constraints.push({
    name: `pk_${tableName}`,
    type: 'primary_key',
    definition: `PRIMARY KEY (id)`,
    fields: ['id']
  });
  
  // Foreign key constraints
  foreignKeys.forEach(fk => {
    constraints.push({
      name: fk.name,
      type: 'foreign_key',
      definition: `FOREIGN KEY (${fk.field}) REFERENCES ${fk.referencedTable}(${fk.referencedField})`,
      fields: [fk.field]
    });
  });
  
  // Generate triggers (optional)
  const triggers: Trigger[] = [];
  if (Math.random() > 0.7) {
    triggers.push({
      name: `trg_${tableName}_updated_at`,
      timing: 'BEFORE',
      events: ['UPDATE'],
      definition: `SET NEW.updated_at = CURRENT_TIMESTAMP`
    });
  }
  
  return {
    name: tableName,
    label: tableName.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' '),
    description: faker.lorem.sentence(),
    schema: options.schema,
    fields,
    primaryKey: ['id'],
    foreignKeys,
    indexes,
    constraints,
    triggers,
    
    // Metadata
    rowCount: faker.number.int({ min: 0, max: 1000000 }),
    estimatedSize: faker.helpers.arrayElement(['< 1MB', '1-10MB', '10-100MB', '100MB-1GB', '> 1GB']),
    lastModified: faker.date.recent().toISOString(),
    collation: databaseType === 'mysql' ? 'utf8mb4_unicode_ci' : 'en_US.UTF-8',
    engine: databaseType === 'mysql' ? 'InnoDB' : undefined,
    
    // UI state
    expanded: options.expanded ?? false,
    selected: options.selected ?? false,
    apiEnabled: options.apiEnabled ?? faker.datatype.boolean()
  };
}

/**
 * Factory function for generating field validation rules and constraint configurations
 * 
 * @param fieldType The type of field to generate validation for
 * @param options Additional validation options
 * @returns FieldValidation configuration
 */
export function fieldValidationFactory(
  fieldType: FieldType = 'string',
  options: Partial<FieldValidation> = {}
): FieldValidation {
  const baseValidation: FieldValidation = {
    required: Math.random() > 0.3,
    ...options
  };
  
  switch (fieldType) {
    case 'string':
      return {
        ...baseValidation,
        minLength: faker.number.int({ min: 1, max: 5 }),
        maxLength: faker.number.int({ min: 50, max: 255 }),
        pattern: Math.random() > 0.7 ? '^[a-zA-Z0-9_-]+$' : undefined
      };
      
    case 'integer':
    case 'bigint':
      return {
        ...baseValidation,
        min: faker.number.int({ min: 0, max: 100 }),
        max: faker.number.int({ min: 1000, max: 999999 })
      };
      
    case 'decimal':
    case 'float':
    case 'double':
      return {
        ...baseValidation,
        min: parseFloat(faker.finance.amount({ min: 0, max: 100, dec: 2 })),
        max: parseFloat(faker.finance.amount({ min: 1000, max: 999999, dec: 2 }))
      };
      
    case 'enum':
      return {
        ...baseValidation,
        enum: Array.from({ length: faker.number.int({ min: 2, max: 6 }) }, () => 
          faker.helpers.arrayElement(['active', 'inactive', 'pending', 'completed', 'cancelled', 'draft'])
        )
      };
      
    default:
      return baseValidation;
  }
}

/**
 * Factory function for generating schema introspection results with hierarchical data structures
 * 
 * @param options Configuration options for schema generation
 * @returns Complete SchemaData with tables, views, and relationships
 */
export function schemaDiscoveryFactory(options: SchemaFactoryOptions = {}): SchemaData {
  const serviceName = options.serviceName || faker.company.name().toLowerCase().replace(/\s+/g, '_');
  const databaseName = options.databaseName || faker.database.type().toLowerCase();
  const databaseType = options.databaseType || 'mysql';
  
  // Determine table count
  const tableCount = options.largeDataset 
    ? faker.number.int({ min: 1000, max: 2500 }) // Large dataset for TanStack Virtual testing
    : options.tableCount || faker.number.int({ min: 5, max: 25 });
  
  const avgFieldsPerTable = options.avgFieldsPerTable || faker.number.int({ min: 5, max: 12 });
  const relationshipDensity = options.relationshipDensity || 0.6;
  
  // Generate tables
  const tables: SchemaTable[] = [];
  const tableNames: string[] = [];
  
  for (let i = 0; i < tableCount; i++) {
    const tableName = options.largeDataset 
      ? `${faker.helpers.arrayElement(COMMON_TABLE_PATTERNS)}_${i.toString().padStart(4, '0')}`
      : faker.helpers.arrayElement(COMMON_TABLE_PATTERNS.filter(name => !tableNames.includes(name))) || 
        `${faker.helpers.arrayElement(COMMON_TABLE_PATTERNS)}_${i}`;
    
    tableNames.push(tableName);
    
    const includeRelationships = Math.random() < relationshipDensity;
    const table = tableSchemaFactory({
      name: tableName,
      fieldCount: avgFieldsPerTable,
      includeRelationships,
      databaseType,
      schema: options.schemaName,
      expanded: options.expandedTables?.includes(tableName),
      selected: options.selectedTables?.includes(tableName),
      apiEnabled: options.apiEnabledTables?.includes(tableName)
    });
    
    tables.push(table);
  }
  
  // Generate views if requested
  const views: SchemaView[] = [];
  if (options.includeViews !== false && Math.random() > 0.3) {
    const viewCount = faker.number.int({ min: 1, max: Math.min(5, Math.floor(tableCount / 3)) });
    for (let i = 0; i < viewCount; i++) {
      const baseTable = faker.helpers.arrayElement(tables);
      views.push({
        name: `v_${baseTable.name}_summary`,
        definition: `SELECT id, name, created_at FROM ${baseTable.name} WHERE is_active = 1`,
        fields: baseTable.fields.slice(0, 3),
        updatable: false,
        checkOption: 'NONE'
      });
    }
  }
  
  // Generate stored procedures if requested
  const procedures: StoredProcedure[] = [];
  if (options.includeProcedures && Math.random() > 0.5) {
    const procCount = faker.number.int({ min: 1, max: 3 });
    for (let i = 0; i < procCount; i++) {
      procedures.push({
        name: `sp_${faker.hacker.verb()}_${faker.hacker.noun()}`,
        parameters: [
          {
            name: 'p_id',
            type: 'INT',
            mode: 'IN'
          },
          {
            name: 'p_result',
            type: 'VARCHAR(255)',
            mode: 'OUT'
          }
        ],
        returnType: 'INT',
        definition: 'BEGIN\n  SELECT COUNT(*) INTO p_result FROM users WHERE id = p_id;\n  RETURN 1;\nEND',
        language: 'SQL'
      });
    }
  }
  
  // Generate functions if requested
  const functions: DatabaseFunction[] = [];
  if (options.includeFunctions && Math.random() > 0.5) {
    const funcCount = faker.number.int({ min: 1, max: 3 });
    for (let i = 0; i < funcCount; i++) {
      functions.push({
        name: `fn_${faker.hacker.verb()}_${faker.hacker.noun()}`,
        parameters: [
          {
            name: 'input_value',
            type: 'VARCHAR(255)'
          }
        ],
        returnType: 'VARCHAR(255)',
        definition: 'BEGIN\n  RETURN UPPER(input_value);\nEND',
        language: 'SQL',
        immutable: true
      });
    }
  }
  
  // Generate sequences if requested (PostgreSQL-specific)
  const sequences: Sequence[] = [];
  if (options.includeSequences && databaseType === 'postgresql' && Math.random() > 0.7) {
    const seqCount = faker.number.int({ min: 1, max: 3 });
    for (let i = 0; i < seqCount; i++) {
      sequences.push({
        name: `seq_${faker.helpers.arrayElement(tableNames)}_id`,
        increment: 1,
        minValue: 1,
        maxValue: 9223372036854775807,
        startValue: 1,
        cache: 1,
        cycle: false
      });
    }
  }
  
  // Calculate totals
  const totalFields = tables.reduce((sum, table) => sum + table.fields.length, 0);
  
  return {
    serviceName,
    databaseName,
    schemaName: options.schemaName,
    tables,
    views,
    procedures,
    functions,
    sequences,
    lastDiscovered: faker.date.recent().toISOString(),
    totalTables: tableCount,
    totalFields
  };
}

/**
 * Factory function for generating large schema datasets specifically for TanStack Virtual performance testing
 * 
 * @param tableCount Number of tables to generate (default: 1000+)
 * @returns Large SchemaData optimized for virtual scrolling tests
 */
export function largeSchemaDatasetFactory(tableCount: number = 1500): SchemaData {
  return schemaDiscoveryFactory({
    largeDataset: true,
    tableCount,
    avgFieldsPerTable: 8, // Optimized for performance
    relationshipDensity: 0.3, // Reduced for performance
    includeViews: false,
    includeProcedures: false,
    includeFunctions: false,
    includeSequences: false
  });
}

/**
 * Factory function for generating schema import/export workflow testing data
 * 
 * @param options Configuration for import/export scenarios
 * @returns Schema data with versioning and migration metadata
 */
export function schemaVersioningFactory(options: {
  version?: string;
  previousVersion?: string;
  changes?: Array<{
    type: 'table_added' | 'table_removed' | 'field_added' | 'field_removed' | 'field_modified';
    target: string;
    details?: any;
  }>;
} = {}) {
  const schema = schemaDiscoveryFactory();
  
  return {
    ...schema,
    version: options.version || '1.0.0',
    previousVersion: options.previousVersion,
    migrationId: faker.string.uuid(),
    changes: options.changes || [
      {
        type: 'table_added' as const,
        target: 'new_feature_table',
        details: { reason: 'Feature enhancement' }
      },
      {
        type: 'field_added' as const,
        target: 'users.email_verified_at',
        details: { type: 'timestamp', nullable: true }
      }
    ],
    exportedAt: faker.date.recent().toISOString(),
    exportedBy: faker.person.fullName(),
    checksum: faker.string.alphanumeric(32)
  };
}

/**
 * Preset factory configurations for common testing scenarios
 */
export const schemaFixturePresets = {
  /**
   * Small development schema for basic component testing
   */
  small: (): SchemaData => schemaDiscoveryFactory({
    serviceName: 'dev_db',
    databaseName: 'development',
    tableCount: 5,
    avgFieldsPerTable: 6,
    relationshipDensity: 0.8,
    includeViews: true
  }),
  
  /**
   * Medium enterprise schema for integration testing
   */
  medium: (): SchemaData => schemaDiscoveryFactory({
    serviceName: 'enterprise_db',
    databaseName: 'production',
    tableCount: 50,
    avgFieldsPerTable: 10,
    relationshipDensity: 0.7,
    includeViews: true,
    includeProcedures: true,
    includeFunctions: true
  }),
  
  /**
   * Large schema for performance and TanStack Virtual testing
   */
  large: (): SchemaData => largeSchemaDatasetFactory(1200),
  
  /**
   * PostgreSQL-specific schema with advanced features
   */
  postgresql: (): SchemaData => schemaDiscoveryFactory({
    databaseType: 'postgresql',
    includeSequences: true,
    includeFunctions: true,
    includeViews: true
  }),
  
  /**
   * MySQL schema with common e-commerce patterns
   */
  ecommerce: (): SchemaData => schemaDiscoveryFactory({
    serviceName: 'ecommerce_db',
    databaseType: 'mysql',
    tableCount: 15,
    relationshipDensity: 0.9,
    selectedTables: ['products', 'orders', 'customers'],
    apiEnabledTables: ['products', 'orders', 'customers', 'categories']
  }),
  
  /**
   * Complex schema with versioning for migration testing
   */
  versioned: () => schemaVersioningFactory({
    version: '2.1.0',
    previousVersion: '2.0.3'
  })
};

/**
 * Utility function to generate schema data matching existing DreamFactory patterns
 * 
 * @param pattern The type of schema pattern to generate
 * @returns SchemaData configured for the specified pattern
 */
export function generateSchemaByPattern(pattern: keyof typeof schemaFixturePresets): SchemaData {
  return schemaFixturePresets[pattern]();
}

/**
 * Factory for creating test data specifically for React component prop validation
 * 
 * @param componentType The type of schema component being tested
 * @returns Appropriate fixture data for the component
 */
export function schemaComponentTestFactory(componentType: 'table-list' | 'field-details' | 'relationship-manager' | 'schema-tree') {
  const baseSchema = schemaDiscoveryFactory({ tableCount: 3, avgFieldsPerTable: 5 });
  
  switch (componentType) {
    case 'table-list':
      return {
        tables: baseSchema.tables,
        loading: false,
        error: null,
        onTableSelect: () => {},
        onTableExpand: () => {}
      };
      
    case 'field-details':
      return {
        field: baseSchema.tables[0].fields[0],
        onFieldUpdate: () => {},
        validation: fieldValidationFactory('string'),
        constraints: baseSchema.tables[0].fields[0].constraints || []
      };
      
    case 'relationship-manager':
      return {
        relationships: baseSchema.tables.flatMap(table => table.foreignKeys),
        tables: baseSchema.tables.map(table => table.name),
        onRelationshipAdd: () => {},
        onRelationshipRemove: () => {}
      };
      
    case 'schema-tree':
      return {
        schema: baseSchema,
        expandedNodes: [baseSchema.tables[0].name],
        selectedNodes: [],
        onNodeExpand: () => {},
        onNodeSelect: () => {},
        virtualScrolling: false
      };
      
    default:
      return baseSchema;
  }
}