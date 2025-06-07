/**
 * Database schema fixture factory functions for testing React components and schema discovery workflows
 * 
 * Provides comprehensive factory functions for creating realistic schema metadata to support testing of
 * schema management interfaces, hierarchical tree visualization with TanStack Virtual, and API generation
 * workflows. Supports large dataset scenarios with 1000+ tables for performance testing.
 * 
 * @see Section F-002 in technical specification for schema discovery requirements
 * @see Section 2.1 for functional requirements and performance criteria
 */

import { faker } from '@faker-js/faker';
import type {
  SchemaData,
  SchemaTable,
  SchemaField,
  TableRelated,
  ForeignKey,
  TableIndex,
  TableConstraint,
  SchemaView,
  StoredProcedure,
  DatabaseFunction,
  Sequence,
  FieldType,
  RelationshipType,
  FieldValidation,
  FieldConstraint,
  FieldFormat,
  TreeNodeType,
  SchemaTreeNode,
  SchemaLoadingState,
  ProgressiveSchemaData,
  SchemaChunk,
  ConstraintType,
  ReferentialAction,
  IndexType,
  TriggerEvent,
  Trigger,
  SchemaPerformanceMetrics,
  SchemaError,
  SchemaWarning,
  SchemaErrorType,
  SchemaWarningType,
} from '../../types/schema';
import type {
  DatabaseType,
  DatabaseConfig,
  DatabaseTable,
  DatabaseField,
  TableRelationship,
  ConnectionTestResult,
} from '../../types/database';

// =============================================================================
// BASE CONFIGURATION AND CONSTANTS
// =============================================================================

/**
 * Configuration options for schema fixture generation
 */
export interface SchemaFixtureConfig {
  /** Random seed for reproducible test data */
  seed?: number;
  /** Preferred locale for faker data generation */
  locale?: string;
  /** Database service type for type-specific behavior */
  databaseType?: DatabaseType;
  /** Include system/internal tables in schema */
  includeSystemTables?: boolean;
  /** Include views and stored procedures */
  includeViews?: boolean;
  /** Include stored procedures and functions */
  includeProcedures?: boolean;
  /** Enable virtual scrolling metadata */
  enableVirtualScrolling?: boolean;
  /** Enable progressive loading simulation */
  enableProgressiveLoading?: boolean;
}

/**
 * Common field type mappings for different database systems
 */
const DATABASE_TYPE_MAPPINGS: Record<DatabaseType, Record<FieldType, string[]>> = {
  mysql: {
    integer: ['int(11)', 'tinyint(4)', 'smallint(6)', 'mediumint(9)', 'bigint(20)'],
    bigint: ['bigint(20)', 'bigint(20) unsigned'],
    decimal: ['decimal(10,2)', 'decimal(8,4)', 'decimal(12,6)'],
    float: ['float', 'float(7,4)'],
    double: ['double', 'double(15,8)'],
    string: ['varchar(255)', 'varchar(100)', 'varchar(50)', 'char(36)'],
    text: ['text', 'longtext', 'mediumtext', 'tinytext'],
    boolean: ['tinyint(1)', 'boolean'],
    date: ['date'],
    datetime: ['datetime', 'datetime(6)'],
    timestamp: ['timestamp', 'timestamp(6)'],
    time: ['time'],
    binary: ['blob', 'longblob', 'varbinary(255)'],
    json: ['json'],
    xml: ['text'],
    uuid: ['char(36)', 'varchar(36)'],
    enum: ['enum'],
    set: ['set'],
    blob: ['blob', 'longblob', 'mediumblob', 'tinyblob'],
    clob: ['text', 'longtext'],
    geometry: ['geometry', 'point', 'linestring', 'polygon'],
    point: ['point'],
    linestring: ['linestring'],
    polygon: ['polygon'],
  },
  postgresql: {
    integer: ['integer', 'int4', 'smallint', 'int2', 'bigint', 'int8'],
    bigint: ['bigint', 'int8'],
    decimal: ['numeric(10,2)', 'decimal(8,4)', 'money'],
    float: ['real', 'float4'],
    double: ['double precision', 'float8'],
    string: ['varchar(255)', 'varchar(100)', 'character varying(255)', 'char(36)'],
    text: ['text', 'character varying'],
    boolean: ['boolean', 'bool'],
    date: ['date'],
    datetime: ['timestamp', 'timestamp without time zone'],
    timestamp: ['timestamp with time zone', 'timestamptz'],
    time: ['time', 'time without time zone'],
    binary: ['bytea'],
    json: ['json', 'jsonb'],
    xml: ['xml'],
    uuid: ['uuid'],
    enum: ['user_defined'],
    set: ['text[]'],
    blob: ['bytea'],
    clob: ['text'],
    geometry: ['geometry', 'point', 'line', 'polygon'],
    point: ['point'],
    linestring: ['line'],
    polygon: ['polygon'],
  },
  oracle: {
    integer: ['NUMBER(11)', 'NUMBER(10)', 'NUMBER(8)', 'INTEGER'],
    bigint: ['NUMBER(20)', 'NUMBER(19)'],
    decimal: ['NUMBER(10,2)', 'NUMBER(8,4)', 'DECIMAL(10,2)'],
    float: ['FLOAT', 'BINARY_FLOAT'],
    double: ['BINARY_DOUBLE', 'FLOAT(126)'],
    string: ['VARCHAR2(255)', 'VARCHAR2(100)', 'CHAR(36)', 'NVARCHAR2(255)'],
    text: ['CLOB', 'LONG', 'NCLOB'],
    boolean: ['NUMBER(1)', 'CHAR(1)'],
    date: ['DATE'],
    datetime: ['TIMESTAMP', 'TIMESTAMP(6)'],
    timestamp: ['TIMESTAMP WITH TIME ZONE', 'TIMESTAMP WITH LOCAL TIME ZONE'],
    time: ['TIMESTAMP'],
    binary: ['BLOB', 'RAW(2000)', 'LONG RAW'],
    json: ['CLOB', 'JSON'],
    xml: ['XMLType', 'CLOB'],
    uuid: ['RAW(16)', 'VARCHAR2(36)'],
    enum: ['VARCHAR2(50)'],
    set: ['VARCHAR2(1000)'],
    blob: ['BLOB'],
    clob: ['CLOB', 'NCLOB'],
    geometry: ['SDO_GEOMETRY'],
    point: ['SDO_GEOMETRY'],
    linestring: ['SDO_GEOMETRY'],
    polygon: ['SDO_GEOMETRY'],
  },
  mongodb: {
    integer: ['Int32', 'Int64', 'Number'],
    bigint: ['Int64', 'NumberLong'],
    decimal: ['Decimal128', 'NumberDecimal'],
    float: ['Double', 'Number'],
    double: ['Double', 'Number'],
    string: ['String', 'Text'],
    text: ['String', 'Text'],
    boolean: ['Boolean', 'Bool'],
    date: ['Date', 'ISODate'],
    datetime: ['Date', 'ISODate', 'Timestamp'],
    timestamp: ['Timestamp', 'Date'],
    time: ['String', 'Date'],
    binary: ['BinData', 'Binary'],
    json: ['Object', 'Document'],
    xml: ['String'],
    uuid: ['UUID', 'String'],
    enum: ['String'],
    set: ['Array'],
    blob: ['BinData'],
    clob: ['String'],
    geometry: ['GeoJSON'],
    point: ['Point'],
    linestring: ['LineString'],
    polygon: ['Polygon'],
  },
  snowflake: {
    integer: ['NUMBER(38,0)', 'INTEGER', 'BIGINT', 'SMALLINT', 'TINYINT'],
    bigint: ['NUMBER(38,0)', 'BIGINT'],
    decimal: ['NUMBER(10,2)', 'DECIMAL(8,4)', 'NUMERIC(12,6)'],
    float: ['FLOAT', 'FLOAT4', 'REAL'],
    double: ['FLOAT8', 'DOUBLE', 'DOUBLE PRECISION'],
    string: ['VARCHAR(255)', 'VARCHAR(100)', 'STRING', 'TEXT'],
    text: ['TEXT', 'STRING', 'VARCHAR'],
    boolean: ['BOOLEAN', 'BOOL'],
    date: ['DATE'],
    datetime: ['DATETIME', 'TIMESTAMP_NTZ'],
    timestamp: ['TIMESTAMP_LTZ', 'TIMESTAMP_TZ', 'TIMESTAMP'],
    time: ['TIME'],
    binary: ['BINARY', 'VARBINARY'],
    json: ['VARIANT', 'OBJECT'],
    xml: ['VARIANT', 'STRING'],
    uuid: ['STRING', 'VARCHAR(36)'],
    enum: ['VARCHAR(50)'],
    set: ['ARRAY'],
    blob: ['BINARY'],
    clob: ['TEXT'],
    geometry: ['GEOGRAPHY', 'GEOMETRY'],
    point: ['GEOGRAPHY'],
    linestring: ['GEOGRAPHY'],
    polygon: ['GEOGRAPHY'],
  },
};

/**
 * Common table names for realistic test data generation
 */
const COMMON_TABLE_NAMES = [
  'users', 'customers', 'products', 'orders', 'order_items', 'categories',
  'suppliers', 'invoices', 'payments', 'addresses', 'countries', 'states',
  'cities', 'companies', 'departments', 'employees', 'roles', 'permissions',
  'sessions', 'audit_logs', 'settings', 'configurations', 'notifications',
  'messages', 'files', 'images', 'documents', 'reports', 'analytics',
  'subscriptions', 'billing', 'transactions', 'accounts', 'balances',
  'projects', 'tasks', 'milestones', 'comments', 'attachments', 'tags',
  'reviews', 'ratings', 'feedback', 'surveys', 'questions', 'answers',
  'articles', 'pages', 'menus', 'widgets', 'themes', 'plugins'
];

/**
 * System table patterns for different database types
 */
const SYSTEM_TABLE_PATTERNS: Record<DatabaseType, string[]> = {
  mysql: ['information_schema', 'performance_schema', 'mysql', 'sys'],
  postgresql: ['information_schema', 'pg_catalog', 'pg_toast'],
  oracle: ['SYS', 'SYSTEM', 'APEX', 'CTXSYS', 'DBSNMP', 'DIP', 'FLOWS'],
  mongodb: ['admin', 'config', 'local'],
  snowflake: ['INFORMATION_SCHEMA', 'ACCOUNT_USAGE'],
};

// =============================================================================
// FIELD DEFINITION FACTORY
// =============================================================================

/**
 * Factory function for generating database field metadata with proper data types and constraints
 * 
 * @param overrides Partial field properties to override defaults
 * @param config Configuration options for field generation
 * @returns Complete SchemaField object with realistic metadata
 */
export function fieldDefinitionFactory(
  overrides: Partial<SchemaField> = {},
  config: SchemaFixtureConfig = {}
): SchemaField {
  // Set faker seed for reproducible data
  if (config.seed) {
    faker.seed(config.seed);
  }

  const databaseType = config.databaseType || 'mysql';
  const fieldType = overrides.type || faker.helpers.arrayElement([
    'integer', 'string', 'boolean', 'datetime', 'text', 'decimal'
  ] as FieldType[]);

  const dbTypeOptions = DATABASE_TYPE_MAPPINGS[databaseType][fieldType] || ['varchar(255)'];
  const dbType = overrides.dbType || faker.helpers.arrayElement(dbTypeOptions);

  const fieldName = overrides.name || faker.helpers.arrayElement([
    'id', 'name', 'email', 'password', 'created_at', 'updated_at',
    'is_active', 'status', 'description', 'title', 'content', 'value',
    'amount', 'quantity', 'price', 'date', 'time', 'url', 'phone'
  ]);

  const baseField: SchemaField = {
    id: faker.string.uuid(),
    name: fieldName,
    label: overrides.label || fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    description: overrides.description || faker.lorem.sentence(),
    alias: overrides.alias || fieldName,
    type: fieldType,
    dbType,
    length: getFieldLength(fieldType, dbType),
    precision: getFieldPrecision(fieldType),
    scale: getFieldScale(fieldType),
    defaultValue: getDefaultValue(fieldType),
    isNullable: overrides.isNullable ?? faker.datatype.boolean({ probability: 0.7 }),
    allowNull: overrides.allowNull ?? faker.datatype.boolean({ probability: 0.7 }),
    isPrimaryKey: overrides.isPrimaryKey ?? false,
    isForeignKey: overrides.isForeignKey ?? false,
    isUnique: overrides.isUnique ?? faker.datatype.boolean({ probability: 0.2 }),
    isIndex: overrides.isIndex ?? faker.datatype.boolean({ probability: 0.3 }),
    isAutoIncrement: overrides.isAutoIncrement ?? (fieldType === 'integer' && fieldName === 'id'),
    isComputed: overrides.isComputed ?? faker.datatype.boolean({ probability: 0.1 }),
    isVirtual: overrides.isVirtual ?? false,
    isAggregate: overrides.isAggregate ?? false,
    required: overrides.required ?? faker.datatype.boolean({ probability: 0.4 }),
    fixedLength: overrides.fixedLength ?? false,
    supportsMultibyte: overrides.supportsMultibyte ?? (fieldType === 'string' || fieldType === 'text'),
    hidden: overrides.hidden ?? false,
    
    // Optional relationship fields
    refTable: overrides.refTable,
    refField: overrides.refField,
    refOnUpdate: overrides.refOnUpdate,
    refOnDelete: overrides.refOnDelete,
    
    // Validation and constraints
    validation: overrides.validation || generateFieldValidation(fieldType),
    constraints: overrides.constraints || generateFieldConstraints(fieldType),
    picklist: overrides.picklist || generatePicklist(fieldType),
    format: overrides.format || generateFieldFormat(fieldType),
    
    // Database functions
    dbFunction: overrides.dbFunction || generateDbFunctions(fieldType),
    
    // Metadata arrays
    native: overrides.native || [],
    value: overrides.value || [],
  };

  return { ...baseField, ...overrides };
}

/**
 * Create a primary key field with appropriate configuration
 */
export function createPrimaryKeyField(
  name: string = 'id',
  config: SchemaFixtureConfig = {}
): SchemaField {
  return fieldDefinitionFactory({
    name,
    label: name.toUpperCase(),
    type: 'integer',
    isPrimaryKey: true,
    isAutoIncrement: true,
    isUnique: true,
    required: true,
    allowNull: false,
    isNullable: false,
  }, config);
}

/**
 * Create a foreign key field referencing another table
 */
export function createForeignKeyField(
  name: string,
  refTable: string,
  refField: string = 'id',
  config: SchemaFixtureConfig = {}
): SchemaField {
  return fieldDefinitionFactory({
    name,
    label: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    type: 'integer',
    isForeignKey: true,
    refTable,
    refField,
    refOnUpdate: faker.helpers.arrayElement(['CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION'] as ReferentialAction[]),
    refOnDelete: faker.helpers.arrayElement(['CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION'] as ReferentialAction[]),
    allowNull: faker.datatype.boolean({ probability: 0.5 }),
  }, config);
}

/**
 * Create a timestamp field for audit trails
 */
export function createTimestampField(
  name: string,
  config: SchemaFixtureConfig = {}
): SchemaField {
  return fieldDefinitionFactory({
    name,
    label: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    type: 'timestamp',
    defaultValue: name.includes('created') ? 'CURRENT_TIMESTAMP' : 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
    allowNull: false,
    isNullable: false,
  }, config);
}

/**
 * Create an email field with proper validation
 */
export function createEmailField(
  name: string = 'email',
  config: SchemaFixtureConfig = {}
): SchemaField {
  return fieldDefinitionFactory({
    name,
    label: 'Email Address',
    type: 'string',
    length: 255,
    isUnique: true,
    required: true,
    allowNull: false,
    validation: {
      required: true,
      pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
      messages: {
        required: 'Email address is required',
        pattern: 'Please enter a valid email address',
      },
    },
    format: {
      placeholder: 'user@example.com',
      lowercase: true,
    },
  }, config);
}

/**
 * Create a status field with enum values
 */
export function createStatusField(
  name: string = 'status',
  statuses: string[] = ['active', 'inactive', 'pending', 'archived'],
  config: SchemaFixtureConfig = {}
): SchemaField {
  return fieldDefinitionFactory({
    name,
    label: 'Status',
    type: 'enum',
    picklist: statuses,
    defaultValue: statuses[0],
    allowNull: false,
    validation: {
      enum: statuses,
      messages: {
        enum: `Status must be one of: ${statuses.join(', ')}`,
      },
    },
  }, config);
}

// =============================================================================
// HELPER FUNCTIONS FOR FIELD GENERATION
// =============================================================================

function getFieldLength(type: FieldType, dbType: string): number | undefined {
  if (type === 'string') {
    const match = dbType.match(/\((\d+)\)/);
    return match ? parseInt(match[1]) : 255;
  }
  if (type === 'integer') {
    const match = dbType.match(/\((\d+)\)/);
    return match ? parseInt(match[1]) : 11;
  }
  return undefined;
}

function getFieldPrecision(type: FieldType): number | undefined {
  if (type === 'decimal') {
    return faker.number.int({ min: 8, max: 15 });
  }
  return undefined;
}

function getFieldScale(type: FieldType): number | undefined {
  if (type === 'decimal') {
    return faker.number.int({ min: 2, max: 6 });
  }
  return undefined;
}

function getDefaultValue(type: FieldType): any {
  switch (type) {
    case 'boolean':
      return faker.datatype.boolean();
    case 'integer':
      return faker.number.int({ min: 0, max: 100 });
    case 'string':
      return faker.datatype.boolean({ probability: 0.3 }) ? faker.word.sample() : null;
    case 'timestamp':
    case 'datetime':
      return faker.datatype.boolean({ probability: 0.5 }) ? 'CURRENT_TIMESTAMP' : null;
    default:
      return null;
  }
}

function generateFieldValidation(type: FieldType): FieldValidation | undefined {
  const shouldHaveValidation = faker.datatype.boolean({ probability: 0.4 });
  if (!shouldHaveValidation) return undefined;

  const validation: FieldValidation = {};

  switch (type) {
    case 'string':
      validation.minLength = faker.number.int({ min: 1, max: 5 });
      validation.maxLength = faker.number.int({ min: 50, max: 255 });
      break;
    case 'integer':
      validation.min = faker.number.int({ min: 0, max: 10 });
      validation.max = faker.number.int({ min: 100, max: 1000 });
      break;
    case 'decimal':
      validation.min = faker.number.float({ min: 0, max: 10 });
      validation.max = faker.number.float({ min: 100, max: 10000 });
      break;
  }

  return validation;
}

function generateFieldConstraints(type: FieldType): FieldConstraint[] {
  const constraints: FieldConstraint[] = [];
  
  if (faker.datatype.boolean({ probability: 0.3 })) {
    constraints.push({
      type: 'check' as ConstraintType,
      definition: generateCheckConstraint(type),
      name: `chk_${faker.word.sample()}`,
      message: 'Constraint validation failed',
    });
  }

  return constraints;
}

function generateCheckConstraint(type: FieldType): string {
  switch (type) {
    case 'integer':
      return `${faker.word.sample()} > 0`;
    case 'string':
      return `LENGTH(${faker.word.sample()}) > 0`;
    case 'decimal':
      return `${faker.word.sample()} >= 0`;
    default:
      return `${faker.word.sample()} IS NOT NULL`;
  }
}

function generatePicklist(type: FieldType): string[] | undefined {
  if (type === 'enum' || faker.datatype.boolean({ probability: 0.2 })) {
    const count = faker.number.int({ min: 3, max: 8 });
    return Array.from({ length: count }, () => faker.word.sample());
  }
  return undefined;
}

function generateFieldFormat(type: FieldType): FieldFormat | undefined {
  if (faker.datatype.boolean({ probability: 0.3 })) {
    const format: FieldFormat = {};
    
    switch (type) {
      case 'string':
        format.placeholder = `Enter ${faker.word.sample()}`;
        if (faker.datatype.boolean()) format.uppercase = true;
        break;
      case 'decimal':
        format.prefix = '$';
        format.thousandsSeparator = ',';
        format.decimalSeparator = '.';
        break;
      case 'datetime':
        format.dateFormat = 'YYYY-MM-DD HH:mm:ss';
        break;
    }
    
    return Object.keys(format).length > 0 ? format : undefined;
  }
  return undefined;
}

function generateDbFunctions(type: FieldType): { use: string[]; function: string }[] | undefined {
  if (faker.datatype.boolean({ probability: 0.2 })) {
    const functions = [];
    const operations = ['SELECT', 'INSERT', 'UPDATE', 'FILTER'];
    
    functions.push({
      use: faker.helpers.arrayElements(operations, faker.number.int({ min: 1, max: 3 })),
      function: `${faker.helpers.arrayElement(['UPPER', 'LOWER', 'TRIM', 'MAX', 'MIN'])}(fieldname)`,
    });
    
    return functions;
  }
  return undefined;
}

// =============================================================================
// RELATIONSHIP FACTORY
// =============================================================================

/**
 * Factory for generating table relationships including foreign keys and associations
 * 
 * @param overrides Partial relationship properties to override defaults
 * @param config Configuration options for relationship generation
 * @returns Complete TableRelated object with realistic relationship metadata
 */
export function relationshipFactory(
  overrides: Partial<TableRelated> = {},
  config: SchemaFixtureConfig = {}
): TableRelated {
  if (config.seed) {
    faker.seed(config.seed);
  }

  const relationshipType = overrides.type || faker.helpers.arrayElement([
    'belongs_to', 'has_many', 'has_one', 'many_many'
  ] as RelationshipType[]);

  const refTable = overrides.refTable || faker.helpers.arrayElement(COMMON_TABLE_NAMES);
  const alias = overrides.alias || `${relationshipType}_${refTable}`;

  const baseRelationship: TableRelated = {
    id: faker.string.uuid(),
    alias,
    name: overrides.name || `${refTable}_by_${faker.word.sample()}`,
    label: overrides.label || alias.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    description: overrides.description || `${relationshipType} relationship to ${refTable}`,
    native: overrides.native || [],
    type: relationshipType,
    field: overrides.field || `${refTable.slice(0, -1)}_id`,
    isVirtual: overrides.isVirtual ?? faker.datatype.boolean({ probability: 0.3 }),
    refServiceId: overrides.refServiceId || faker.number.int({ min: 1, max: 100 }),
    refTable,
    refField: overrides.refField || 'id',
    refOnUpdate: overrides.refOnUpdate || faker.helpers.arrayElement(['CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION'] as ReferentialAction[]),
    refOnDelete: overrides.refOnDelete || faker.helpers.arrayElement(['CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION'] as ReferentialAction[]),
    alwaysFetch: overrides.alwaysFetch ?? faker.datatype.boolean({ probability: 0.3 }),
    flatten: overrides.flatten ?? faker.datatype.boolean({ probability: 0.2 }),
    flattenDropPrefix: overrides.flattenDropPrefix ?? faker.datatype.boolean({ probability: 0.1 }),
    expanded: overrides.expanded ?? false,
    loading: overrides.loading ?? false,
    cacheKey: overrides.cacheKey || `rel_${faker.string.uuid()}`,
    lastFetched: overrides.lastFetched || new Date().toISOString(),
  };

  // Add junction table configuration for many-to-many relationships
  if (relationshipType === 'many_many') {
    baseRelationship.junctionServiceId = overrides.junctionServiceId || baseRelationship.refServiceId;
    baseRelationship.junctionTable = overrides.junctionTable || `${faker.word.sample()}_${refTable}`;
    baseRelationship.junctionField = overrides.junctionField || `${faker.word.sample()}_id`;
    baseRelationship.junctionRefField = overrides.junctionRefField || `${refTable.slice(0, -1)}_id`;
  }

  return { ...baseRelationship, ...overrides };
}

/**
 * Create a belongs_to relationship (child to parent)
 */
export function createBelongsToRelationship(
  field: string,
  refTable: string,
  config: SchemaFixtureConfig = {}
): TableRelated {
  return relationshipFactory({
    type: 'belongs_to',
    field,
    refTable,
    alias: `${refTable.slice(0, -1)}`,
    name: `${refTable.slice(0, -1)}_by_${field}`,
    label: refTable.slice(0, -1).replace(/\b\w/g, l => l.toUpperCase()),
    alwaysFetch: false,
    flatten: false,
  }, config);
}

/**
 * Create a has_many relationship (parent to children)
 */
export function createHasManyRelationship(
  refTable: string,
  field: string,
  config: SchemaFixtureConfig = {}
): TableRelated {
  return relationshipFactory({
    type: 'has_many',
    field,
    refTable,
    alias: refTable,
    name: `${refTable}_by_${field}`,
    label: refTable.replace(/\b\w/g, l => l.toUpperCase()),
    alwaysFetch: false,
    flatten: false,
  }, config);
}

/**
 * Create a has_one relationship (parent to single child)
 */
export function createHasOneRelationship(
  refTable: string,
  field: string,
  config: SchemaFixtureConfig = {}
): TableRelated {
  return relationshipFactory({
    type: 'has_one',
    field,
    refTable,
    alias: refTable.slice(0, -1),
    name: `${refTable.slice(0, -1)}_by_${field}`,
    label: refTable.slice(0, -1).replace(/\b\w/g, l => l.toUpperCase()),
    alwaysFetch: false,
    flatten: true,
  }, config);
}

/**
 * Create a many_many relationship with junction table
 */
export function createManyManyRelationship(
  refTable: string,
  field: string,
  junctionTable: string,
  config: SchemaFixtureConfig = {}
): TableRelated {
  return relationshipFactory({
    type: 'many_many',
    field,
    refTable,
    alias: refTable,
    name: `${refTable}_by_${field}`,
    label: refTable.replace(/\b\w/g, l => l.toUpperCase()),
    junctionTable,
    junctionField: `${faker.word.sample()}_id`,
    junctionRefField: `${refTable.slice(0, -1)}_id`,
    alwaysFetch: false,
    flatten: false,
  }, config);
}

// =============================================================================
// TABLE SCHEMA FACTORY
// =============================================================================

/**
 * Factory function generating database table definitions with realistic field configurations
 * 
 * @param overrides Partial table properties to override defaults
 * @param config Configuration options for table generation
 * @returns Complete SchemaTable object with fields, relationships, and metadata
 */
export function tableSchemaFactory(
  overrides: Partial<SchemaTable> = {},
  config: SchemaFixtureConfig = {}
): SchemaTable {
  if (config.seed) {
    faker.seed(config.seed);
  }

  const tableName = overrides.name || faker.helpers.arrayElement(COMMON_TABLE_NAMES);
  const isSystemTable = config.includeSystemTables && 
    faker.datatype.boolean({ probability: 0.1 });

  const baseTable: SchemaTable = {
    id: faker.string.uuid(),
    name: tableName,
    label: overrides.label || tableName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    description: overrides.description || faker.lorem.sentence(),
    schema: overrides.schema || (config.databaseType === 'postgresql' ? 'public' : undefined),
    alias: overrides.alias || tableName,
    plural: overrides.plural || `${tableName}s`,
    isView: overrides.isView ?? false,
    
    // Generate realistic fields
    fields: overrides.fields || generateTableFields(tableName, config),
    primaryKey: overrides.primaryKey || ['id'],
    foreignKeys: overrides.foreignKeys || [],
    indexes: overrides.indexes || [],
    constraints: overrides.constraints || [],
    triggers: overrides.triggers || [],
    related: overrides.related || [],
    
    // Table metadata
    nameField: overrides.nameField || inferNameField(tableName),
    rowCount: overrides.rowCount || faker.number.int({ min: 0, max: 1000000 }),
    estimatedSize: overrides.estimatedSize || `${faker.number.int({ min: 1, max: 500 })} MB`,
    lastModified: overrides.lastModified || faker.date.recent().toISOString(),
    collation: overrides.collation || 'utf8mb4_unicode_ci',
    engine: overrides.engine || (config.databaseType === 'mysql' ? 'InnoDB' : undefined),
    access: overrides.access ?? 31, // Full CRUD access
    
    // Virtual scrolling properties
    virtualIndex: overrides.virtualIndex,
    virtualHeight: overrides.virtualHeight || 48,
    isVisible: overrides.isVisible ?? true,
    
    // UI state
    expanded: overrides.expanded ?? false,
    selected: overrides.selected ?? false,
    level: overrides.level ?? 1,
    hasChildren: overrides.hasChildren ?? true,
    isLoading: overrides.isLoading ?? false,
    
    // API generation state
    apiEnabled: overrides.apiEnabled ?? true,
    generatedEndpoints: overrides.generatedEndpoints || generateEndpoints(tableName),
    
    // Cache metadata
    cacheKey: overrides.cacheKey || `table_${faker.string.uuid()}`,
    lastCacheUpdate: overrides.lastCacheUpdate || new Date().toISOString(),
  };

  // Generate foreign keys and relationships
  if (!overrides.foreignKeys) {
    baseTable.foreignKeys = generateForeignKeys(baseTable.fields, config);
  }

  if (!overrides.related) {
    baseTable.related = generateTableRelationships(tableName, config);
  }

  if (!overrides.indexes) {
    baseTable.indexes = generateTableIndexes(baseTable.fields, config);
  }

  if (!overrides.constraints) {
    baseTable.constraints = generateTableConstraints(baseTable.fields, config);
  }

  return { ...baseTable, ...overrides };
}

/**
 * Create a users table with common user fields
 */
export function createUsersTable(config: SchemaFixtureConfig = {}): SchemaTable {
  const fields = [
    createPrimaryKeyField('id', config),
    fieldDefinitionFactory({ name: 'first_name', type: 'string', length: 100, required: true }, config),
    fieldDefinitionFactory({ name: 'last_name', type: 'string', length: 100, required: true }, config),
    createEmailField('email', config),
    fieldDefinitionFactory({ name: 'password', type: 'string', length: 255, required: true, hidden: true }, config),
    fieldDefinitionFactory({ name: 'is_active', type: 'boolean', defaultValue: true }, config),
    createTimestampField('created_at', config),
    createTimestampField('updated_at', config),
  ];

  const relationships = [
    createHasManyRelationship('orders', 'user_id', config),
    createHasManyRelationship('reviews', 'user_id', config),
    createHasOneRelationship('profiles', 'user_id', config),
  ];

  return tableSchemaFactory({
    name: 'users',
    label: 'Users',
    description: 'User account information',
    fields,
    related: relationships,
    nameField: 'email',
  }, config);
}

/**
 * Create an orders table with foreign key relationships
 */
export function createOrdersTable(config: SchemaFixtureConfig = {}): SchemaTable {
  const fields = [
    createPrimaryKeyField('id', config),
    createForeignKeyField('user_id', 'users', 'id', config),
    fieldDefinitionFactory({ name: 'order_number', type: 'string', length: 50, isUnique: true }, config),
    fieldDefinitionFactory({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2 }, config),
    createStatusField('status', ['pending', 'processing', 'shipped', 'delivered', 'cancelled'], config),
    createTimestampField('created_at', config),
    createTimestampField('updated_at', config),
  ];

  const relationships = [
    createBelongsToRelationship('user_id', 'users', config),
    createHasManyRelationship('order_items', 'order_id', config),
  ];

  return tableSchemaFactory({
    name: 'orders',
    label: 'Orders',
    description: 'Customer order information',
    fields,
    related: relationships,
    nameField: 'order_number',
  }, config);
}

/**
 * Create a products table with categories relationship
 */
export function createProductsTable(config: SchemaFixtureConfig = {}): SchemaTable {
  const fields = [
    createPrimaryKeyField('id', config),
    fieldDefinitionFactory({ name: 'name', type: 'string', length: 255, required: true }, config),
    fieldDefinitionFactory({ name: 'description', type: 'text' }, config),
    fieldDefinitionFactory({ name: 'sku', type: 'string', length: 50, isUnique: true }, config),
    fieldDefinitionFactory({ name: 'price', type: 'decimal', precision: 10, scale: 2 }, config),
    createForeignKeyField('category_id', 'categories', 'id', config),
    fieldDefinitionFactory({ name: 'is_active', type: 'boolean', defaultValue: true }, config),
    createTimestampField('created_at', config),
    createTimestampField('updated_at', config),
  ];

  const relationships = [
    createBelongsToRelationship('category_id', 'categories', config),
    createHasManyRelationship('order_items', 'product_id', config),
    createManyManyRelationship('tags', 'product_id', 'product_tags', config),
  ];

  return tableSchemaFactory({
    name: 'products',
    label: 'Products',
    description: 'Product catalog information',
    fields,
    related: relationships,
    nameField: 'name',
  }, config);
}

// =============================================================================
// HELPER FUNCTIONS FOR TABLE GENERATION
// =============================================================================

function generateTableFields(tableName: string, config: SchemaFixtureConfig): SchemaField[] {
  const fields: SchemaField[] = [];
  
  // Always include primary key
  fields.push(createPrimaryKeyField('id', config));
  
  // Common fields based on table name patterns
  if (tableName.includes('user') || tableName.includes('customer') || tableName.includes('person')) {
    fields.push(
      fieldDefinitionFactory({ name: 'first_name', type: 'string' }, config),
      fieldDefinitionFactory({ name: 'last_name', type: 'string' }, config),
      createEmailField('email', config)
    );
  } else if (tableName.includes('product') || tableName.includes('item')) {
    fields.push(
      fieldDefinitionFactory({ name: 'name', type: 'string', required: true }, config),
      fieldDefinitionFactory({ name: 'description', type: 'text' }, config),
      fieldDefinitionFactory({ name: 'price', type: 'decimal' }, config)
    );
  } else {
    // Generic table fields
    fields.push(
      fieldDefinitionFactory({ name: 'name', type: 'string' }, config),
      fieldDefinitionFactory({ name: 'description', type: 'text' }, config)
    );
  }
  
  // Common utility fields
  fields.push(
    fieldDefinitionFactory({ name: 'is_active', type: 'boolean', defaultValue: true }, config),
    createTimestampField('created_at', config),
    createTimestampField('updated_at', config)
  );
  
  // Add random additional fields
  const additionalFieldCount = faker.number.int({ min: 0, max: 5 });
  for (let i = 0; i < additionalFieldCount; i++) {
    fields.push(fieldDefinitionFactory({}, config));
  }
  
  return fields;
}

function inferNameField(tableName: string): string | undefined {
  if (tableName.includes('user') || tableName.includes('customer')) {
    return 'email';
  } else if (tableName.includes('product') || tableName.includes('category')) {
    return 'name';
  } else if (tableName.includes('order')) {
    return 'order_number';
  }
  return 'name';
}

function generateEndpoints(tableName: string): string[] {
  return [
    `/api/v2/${tableName}`,
    `/api/v2/${tableName}/{id}`,
    `/api/v2/${tableName}?filter={field}={value}`,
    `/api/v2/${tableName}?limit=100&offset=0`,
  ];
}

function generateForeignKeys(fields: SchemaField[], config: SchemaFixtureConfig): ForeignKey[] {
  const foreignKeys: ForeignKey[] = [];
  
  fields.filter(field => field.isForeignKey).forEach(field => {
    if (field.refTable && field.refField) {
      foreignKeys.push({
        name: `fk_${field.name}`,
        field: field.name,
        referencedTable: field.refTable,
        referencedField: field.refField,
        onDelete: field.refOnDelete,
        onUpdate: field.refOnUpdate,
      });
    }
  });
  
  return foreignKeys;
}

function generateTableRelationships(tableName: string, config: SchemaFixtureConfig): TableRelated[] {
  const relationships: TableRelated[] = [];
  const relationshipCount = faker.number.int({ min: 0, max: 3 });
  
  for (let i = 0; i < relationshipCount; i++) {
    relationships.push(relationshipFactory({}, config));
  }
  
  return relationships;
}

function generateTableIndexes(fields: SchemaField[], config: SchemaFixtureConfig): TableIndex[] {
  const indexes: TableIndex[] = [];
  
  // Primary key index
  const primaryField = fields.find(f => f.isPrimaryKey);
  if (primaryField) {
    indexes.push({
      name: 'PRIMARY',
      fields: [primaryField.name],
      unique: true,
      type: 'btree' as IndexType,
    });
  }
  
  // Unique field indexes
  fields.filter(f => f.isUnique && !f.isPrimaryKey).forEach(field => {
    indexes.push({
      name: `idx_${field.name}_unique`,
      fields: [field.name],
      unique: true,
      type: 'btree' as IndexType,
    });
  });
  
  // Foreign key indexes
  fields.filter(f => f.isForeignKey).forEach(field => {
    indexes.push({
      name: `idx_${field.name}`,
      fields: [field.name],
      unique: false,
      type: 'btree' as IndexType,
    });
  });
  
  return indexes;
}

function generateTableConstraints(fields: SchemaField[], config: SchemaFixtureConfig): TableConstraint[] {
  const constraints: TableConstraint[] = [];
  
  // Primary key constraint
  const primaryField = fields.find(f => f.isPrimaryKey);
  if (primaryField) {
    constraints.push({
      name: 'PRIMARY',
      type: 'primary_key' as ConstraintType,
      definition: `PRIMARY KEY (${primaryField.name})`,
      fields: [primaryField.name],
    });
  }
  
  // Check constraints
  fields.forEach(field => {
    if (field.constraints) {
      field.constraints.forEach(constraint => {
        constraints.push({
          name: constraint.name || `chk_${field.name}`,
          type: constraint.type,
          definition: constraint.definition,
          fields: [field.name],
        });
      });
    }
  });
  
  return constraints;
}

// =============================================================================
// FIELD VALIDATION FACTORY
// =============================================================================

/**
 * Factory for generating field validation rules and constraint configurations
 * 
 * @param fieldType The type of field to generate validation for
 * @param config Configuration options for validation generation
 * @returns Complete FieldValidation object with realistic validation rules
 */
export function fieldValidationFactory(
  fieldType: FieldType,
  config: SchemaFixtureConfig = {}
): FieldValidation {
  if (config.seed) {
    faker.seed(config.seed);
  }

  const validation: FieldValidation = {
    validateOnChange: faker.datatype.boolean({ probability: 0.6 }),
    validateOnBlur: faker.datatype.boolean({ probability: 0.8 }),
    debounceMs: faker.number.int({ min: 100, max: 1000 }),
    messages: {},
  };

  // Type-specific validation rules
  switch (fieldType) {
    case 'string':
      validation.required = faker.datatype.boolean({ probability: 0.5 });
      validation.minLength = faker.number.int({ min: 1, max: 10 });
      validation.maxLength = faker.number.int({ min: 50, max: 255 });
      if (faker.datatype.boolean({ probability: 0.3 })) {
        validation.pattern = faker.helpers.arrayElement([
          '^[a-zA-Z0-9]+$',
          '^[a-zA-Z\\s]+$',
          '^\\d{3}-\\d{2}-\\d{4}$',
          '^[A-Z]{2,3}\\d{3,6}$',
        ]);
      }
      validation.messages = {
        required: 'This field is required',
        minLength: `Minimum length is ${validation.minLength} characters`,
        maxLength: `Maximum length is ${validation.maxLength} characters`,
        pattern: 'Invalid format',
      };
      break;

    case 'integer':
    case 'bigint':
      validation.required = faker.datatype.boolean({ probability: 0.3 });
      validation.min = faker.number.int({ min: 0, max: 100 });
      validation.max = faker.number.int({ min: 1000, max: 100000 });
      validation.messages = {
        required: 'This field is required',
        min: `Minimum value is ${validation.min}`,
        max: `Maximum value is ${validation.max}`,
      };
      break;

    case 'decimal':
    case 'float':
    case 'double':
      validation.required = faker.datatype.boolean({ probability: 0.3 });
      validation.min = faker.number.float({ min: 0, max: 100, fractionDigits: 2 });
      validation.max = faker.number.float({ min: 1000, max: 100000, fractionDigits: 2 });
      validation.messages = {
        required: 'This field is required',
        min: `Minimum value is ${validation.min}`,
        max: `Maximum value is ${validation.max}`,
      };
      break;

    case 'boolean':
      validation.required = faker.datatype.boolean({ probability: 0.2 });
      validation.messages = {
        required: 'Please select an option',
      };
      break;

    case 'date':
    case 'datetime':
    case 'timestamp':
      validation.required = faker.datatype.boolean({ probability: 0.4 });
      validation.format = 'date';
      validation.messages = {
        required: 'Date is required',
        format: 'Please enter a valid date',
      };
      break;

    case 'text':
      validation.required = faker.datatype.boolean({ probability: 0.3 });
      validation.maxLength = faker.number.int({ min: 1000, max: 10000 });
      validation.messages = {
        required: 'This field is required',
        maxLength: `Maximum length is ${validation.maxLength} characters`,
      };
      break;

    case 'enum':
      validation.required = faker.datatype.boolean({ probability: 0.6 });
      validation.enum = Array.from({ length: faker.number.int({ min: 3, max: 8 }) }, 
        () => faker.word.sample());
      validation.messages = {
        required: 'Please select an option',
        enum: `Value must be one of: ${validation.enum?.join(', ')}`,
      };
      break;

    default:
      validation.required = faker.datatype.boolean({ probability: 0.3 });
      validation.messages = {
        required: 'This field is required',
      };
  }

  // Add custom validator occasionally
  if (faker.datatype.boolean({ probability: 0.2 })) {
    validation.customValidator = faker.helpers.arrayElement([
      'validateUniqueEmail',
      'validatePhoneNumber',
      'validateCreditCard',
      'validateUrl',
      'validateComplexPassword',
    ]);
    validation.messages!.custom = 'Custom validation failed';
  }

  return validation;
}

/**
 * Create email validation configuration
 */
export function createEmailValidation(): FieldValidation {
  return {
    required: true,
    pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
    maxLength: 255,
    validateOnChange: true,
    validateOnBlur: true,
    debounceMs: 300,
    messages: {
      required: 'Email address is required',
      pattern: 'Please enter a valid email address',
      maxLength: 'Email address is too long',
    },
  };
}

/**
 * Create password validation configuration
 */
export function createPasswordValidation(): FieldValidation {
  return {
    required: true,
    minLength: 8,
    maxLength: 128,
    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]+$',
    validateOnChange: false,
    validateOnBlur: true,
    debounceMs: 500,
    messages: {
      required: 'Password is required',
      minLength: 'Password must be at least 8 characters long',
      maxLength: 'Password is too long',
      pattern: 'Password must contain uppercase, lowercase, number, and special character',
    },
  };
}

/**
 * Create numeric range validation
 */
export function createNumericRangeValidation(min: number, max: number): FieldValidation {
  return {
    required: false,
    min,
    max,
    validateOnChange: true,
    validateOnBlur: true,
    debounceMs: 200,
    messages: {
      min: `Value must be at least ${min}`,
      max: `Value must be no more than ${max}`,
    },
  };
}

// =============================================================================
// SCHEMA DISCOVERY FACTORY
// =============================================================================

/**
 * Factory for generating schema introspection results with hierarchical data structures
 * Optimized for React Query caching and TanStack Virtual scrolling performance
 * 
 * @param overrides Partial schema data properties to override defaults
 * @param config Configuration options for schema generation
 * @returns Complete SchemaData object with tables, views, and metadata
 */
export function schemaDiscoveryFactory(
  overrides: Partial<SchemaData> = {},
  config: SchemaFixtureConfig = {}
): SchemaData {
  if (config.seed) {
    faker.seed(config.seed);
  }

  const serviceName = overrides.serviceName || `${config.databaseType || 'mysql'}_service`;
  const serviceId = overrides.serviceId || faker.number.int({ min: 1, max: 100 });
  const databaseName = overrides.databaseName || faker.company.name().toLowerCase().replace(/\s+/g, '_');

  // Generate tables
  const tableCount = overrides.tables?.length || faker.number.int({ min: 5, max: 50 });
  const tables = overrides.tables || Array.from({ length: tableCount }, () => 
    tableSchemaFactory({}, config)
  );

  // Generate views if enabled
  const views = config.includeViews ? 
    (overrides.views || generateSchemaViews(faker.number.int({ min: 0, max: 5 }), config)) : 
    [];

  // Generate procedures if enabled
  const procedures = config.includeProcedures ? 
    (overrides.procedures || generateStoredProcedures(faker.number.int({ min: 0, max: 3 }), config)) : 
    [];

  const functions = config.includeProcedures ? 
    (overrides.functions || generateDatabaseFunctions(faker.number.int({ min: 0, max: 3 }), config)) : 
    [];

  const sequences = config.includeProcedures ? 
    (overrides.sequences || generateSequences(faker.number.int({ min: 0, max: 2 }), config)) : 
    [];

  // Calculate metadata
  const totalFields = tables.reduce((sum, table) => sum + table.fields.length, 0);
  const totalRelationships = tables.reduce((sum, table) => sum + table.related.length, 0);

  const baseSchema: SchemaData = {
    serviceName,
    serviceId,
    databaseName,
    schemaName: overrides.schemaName || (config.databaseType === 'postgresql' ? 'public' : undefined),
    tables,
    views,
    procedures,
    functions,
    sequences,
    lastDiscovered: overrides.lastDiscovered || new Date().toISOString(),
    totalTables: tables.length,
    totalFields,
    totalRelationships,
    
    // Virtual scrolling configuration
    virtualScrollingEnabled: config.enableVirtualScrolling ?? true,
    pageSize: overrides.pageSize || 100,
    estimatedRowHeight: overrides.estimatedRowHeight || 48,
    
    // Loading state
    loadingState: overrides.loadingState || generateLoadingState(tables.length),
    progressiveData: config.enableProgressiveLoading ? 
      (overrides.progressiveData || generateProgressiveData(tables, config)) : 
      undefined,
  };

  return { ...baseSchema, ...overrides };
}

/**
 * Create a large schema for performance testing with 1000+ tables
 * Designed for TanStack Virtual integration testing
 */
export function createLargeSchemaDataset(
  tableCount: number = 1000,
  config: SchemaFixtureConfig = {}
): SchemaData {
  console.log(`Generating large schema dataset with ${tableCount} tables...`);
  
  const tables: SchemaTable[] = [];
  const batchSize = 100;
  
  // Generate tables in batches for better performance
  for (let i = 0; i < tableCount; i += batchSize) {
    const remainingCount = Math.min(batchSize, tableCount - i);
    const batch = Array.from({ length: remainingCount }, (_, batchIndex) => {
      const tableIndex = i + batchIndex;
      return tableSchemaFactory({
        name: `large_table_${String(tableIndex + 1).padStart(4, '0')}`,
        label: `Large Table ${tableIndex + 1}`,
        description: `Generated table ${tableIndex + 1} for performance testing`,
        virtualIndex: tableIndex,
        level: 1,
        rowCount: faker.number.int({ min: 100, max: 1000000 }),
      }, config);
    });
    
    tables.push(...batch);
    
    // Log progress for large datasets
    if (tableCount > 500 && (i + batchSize) % 500 === 0) {
      console.log(`Generated ${i + batchSize}/${tableCount} tables...`);
    }
  }

  return schemaDiscoveryFactory({
    serviceName: 'large_test_database',
    serviceId: 999,
    databaseName: 'performance_test_db',
    tables,
    virtualScrollingEnabled: true,
    pageSize: 50,
    estimatedRowHeight: 48,
    loadingState: {
      isLoading: false,
      isError: false,
      loadedTables: tableCount,
      totalTables: tableCount,
      currentPage: Math.ceil(tableCount / 50),
      hasNextPage: false,
      isFetchingNextPage: false,
    },
    progressiveData: {
      chunks: generateSchemaChunks(tables, 50),
      chunkSize: 50,
      totalChunks: Math.ceil(tableCount / 50),
      loadedChunks: Math.ceil(tableCount / 50),
      lastLoadTime: new Date().toISOString(),
    },
  }, config);
}

/**
 * Create a schema with realistic e-commerce table structure
 */
export function createEcommerceSchema(config: SchemaFixtureConfig = {}): SchemaData {
  const tables = [
    createUsersTable(config),
    createProductsTable(config),
    createOrdersTable(config),
    tableSchemaFactory({ name: 'categories', label: 'Categories' }, config),
    tableSchemaFactory({ name: 'order_items', label: 'Order Items' }, config),
    tableSchemaFactory({ name: 'reviews', label: 'Product Reviews' }, config),
    tableSchemaFactory({ name: 'addresses', label: 'Customer Addresses' }, config),
    tableSchemaFactory({ name: 'payments', label: 'Payment Methods' }, config),
    tableSchemaFactory({ name: 'coupons', label: 'Discount Coupons' }, config),
    tableSchemaFactory({ name: 'inventory', label: 'Product Inventory' }, config),
  ];

  return schemaDiscoveryFactory({
    serviceName: 'ecommerce_db',
    serviceId: 1,
    databaseName: 'ecommerce_platform',
    tables,
  }, config);
}

/**
 * Create a schema with hierarchical relationships for testing
 */
export function createHierarchicalSchema(config: SchemaFixtureConfig = {}): SchemaData {
  const tables = [
    // Organizations hierarchy
    tableSchemaFactory({ name: 'organizations', label: 'Organizations' }, config),
    tableSchemaFactory({ name: 'departments', label: 'Departments' }, config),
    tableSchemaFactory({ name: 'teams', label: 'Teams' }, config),
    tableSchemaFactory({ name: 'positions', label: 'Job Positions' }, config),
    
    // Employee structure
    tableSchemaFactory({ name: 'employees', label: 'Employees' }, config),
    tableSchemaFactory({ name: 'employee_positions', label: 'Employee Positions' }, config),
    tableSchemaFactory({ name: 'employee_hierarchy', label: 'Reporting Structure' }, config),
    
    // Project management
    tableSchemaFactory({ name: 'projects', label: 'Projects' }, config),
    tableSchemaFactory({ name: 'project_members', label: 'Project Members' }, config),
    tableSchemaFactory({ name: 'tasks', label: 'Tasks' }, config),
    tableSchemaFactory({ name: 'task_dependencies', label: 'Task Dependencies' }, config),
  ];

  return schemaDiscoveryFactory({
    serviceName: 'enterprise_system',
    serviceId: 2,
    databaseName: 'enterprise_db',
    tables,
  }, config);
}

// =============================================================================
// HELPER FUNCTIONS FOR SCHEMA DISCOVERY
// =============================================================================

function generateLoadingState(totalTables: number): SchemaLoadingState {
  const isLoading = faker.datatype.boolean({ probability: 0.1 });
  const isError = isLoading ? false : faker.datatype.boolean({ probability: 0.05 });
  
  return {
    isLoading,
    isError,
    error: isError ? faker.helpers.arrayElement([
      'Connection timeout',
      'Access denied',
      'Schema not found',
      'Database server unavailable',
    ]) : undefined,
    loadedTables: isLoading ? 
      faker.number.int({ min: 0, max: totalTables }) : 
      totalTables,
    totalTables,
    currentPage: faker.number.int({ min: 1, max: Math.ceil(totalTables / 100) }),
    hasNextPage: isLoading || faker.datatype.boolean({ probability: 0.3 }),
    isFetchingNextPage: isLoading && faker.datatype.boolean({ probability: 0.5 }),
  };
}

function generateProgressiveData(tables: SchemaTable[], config: SchemaFixtureConfig): ProgressiveSchemaData {
  const chunkSize = 50;
  const chunks = generateSchemaChunks(tables, chunkSize);
  
  return {
    chunks,
    chunkSize,
    totalChunks: chunks.length,
    loadedChunks: faker.number.int({ min: 1, max: chunks.length }),
    lastLoadTime: new Date().toISOString(),
  };
}

function generateSchemaChunks(tables: SchemaTable[], chunkSize: number): SchemaChunk[] {
  const chunks: SchemaChunk[] = [];
  
  for (let i = 0; i < tables.length; i += chunkSize) {
    const chunkTables = tables.slice(i, i + chunkSize);
    const chunkId = Math.floor(i / chunkSize);
    
    chunks.push({
      chunkId,
      startIndex: i,
      endIndex: Math.min(i + chunkSize - 1, tables.length - 1),
      tables: chunkTables,
      loadedAt: faker.date.recent().toISOString(),
      isStale: faker.datatype.boolean({ probability: 0.1 }),
    });
  }
  
  return chunks;
}

function generateSchemaViews(count: number, config: SchemaFixtureConfig): SchemaView[] {
  return Array.from({ length: count }, () => ({
    name: `view_${faker.word.sample()}`,
    label: faker.company.buzzPhrase(),
    description: faker.lorem.sentence(),
    definition: `SELECT * FROM ${faker.helpers.arrayElement(COMMON_TABLE_NAMES)} WHERE is_active = 1`,
    fields: Array.from({ length: faker.number.int({ min: 3, max: 8 }) }, () => 
      fieldDefinitionFactory({}, config)
    ),
    updatable: faker.datatype.boolean({ probability: 0.3 }),
    checkOption: faker.helpers.arrayElement(['CASCADED', 'LOCAL', 'NONE']),
    securityType: faker.helpers.arrayElement(['DEFINER', 'INVOKER']),
    algorithm: faker.helpers.arrayElement(['MERGE', 'TEMPTABLE', 'UNDEFINED']),
    expanded: false,
    selected: false,
  }));
}

function generateStoredProcedures(count: number, config: SchemaFixtureConfig): StoredProcedure[] {
  return Array.from({ length: count }, () => ({
    name: `sp_${faker.word.sample()}`,
    label: faker.company.buzzPhrase(),
    description: faker.lorem.sentence(),
    parameters: Array.from({ length: faker.number.int({ min: 0, max: 5 }) }, () => ({
      name: faker.word.sample(),
      type: faker.helpers.arrayElement(['INT', 'VARCHAR(255)', 'DATETIME', 'DECIMAL(10,2)']),
      mode: faker.helpers.arrayElement(['IN', 'OUT', 'INOUT']),
      defaultValue: faker.datatype.boolean({ probability: 0.3 }) ? 'NULL' : undefined,
      description: faker.lorem.words(3),
    })),
    returnType: faker.helpers.arrayElement(['INT', 'VARCHAR(255)', 'BOOLEAN']),
    definition: `BEGIN\n  ${faker.lorem.sentence()}\nEND`,
    language: 'SQL',
    securityType: faker.helpers.arrayElement(['DEFINER', 'INVOKER']),
    deterministic: faker.datatype.boolean({ probability: 0.6 }),
    sqlDataAccess: faker.helpers.arrayElement(['CONTAINS SQL', 'NO SQL', 'READS SQL DATA', 'MODIFIES SQL DATA']),
  }));
}

function generateDatabaseFunctions(count: number, config: SchemaFixtureConfig): DatabaseFunction[] {
  return Array.from({ length: count }, () => ({
    name: `fn_${faker.word.sample()}`,
    label: faker.company.buzzPhrase(),
    description: faker.lorem.sentence(),
    parameters: Array.from({ length: faker.number.int({ min: 0, max: 3 }) }, () => ({
      name: faker.word.sample(),
      type: faker.helpers.arrayElement(['INT', 'VARCHAR(255)', 'DATETIME']),
      defaultValue: faker.datatype.boolean({ probability: 0.3 }) ? 'NULL' : undefined,
      description: faker.lorem.words(3),
    })),
    returnType: faker.helpers.arrayElement(['INT', 'VARCHAR(255)', 'BOOLEAN', 'DECIMAL(10,2)']),
    definition: `RETURN ${faker.lorem.sentence()};`,
    language: 'SQL',
    immutable: faker.datatype.boolean({ probability: 0.7 }),
    strict: faker.datatype.boolean({ probability: 0.5 }),
    securityDefiner: faker.datatype.boolean({ probability: 0.3 }),
    cost: faker.number.int({ min: 1, max: 1000 }),
    rows: faker.number.int({ min: 1, max: 1000 }),
  }));
}

function generateSequences(count: number, config: SchemaFixtureConfig): Sequence[] {
  return Array.from({ length: count }, () => ({
    name: `seq_${faker.word.sample()}`,
    label: faker.company.buzzPhrase(),
    description: faker.lorem.sentence(),
    increment: faker.number.int({ min: 1, max: 10 }),
    minValue: faker.number.int({ min: 1, max: 100 }),
    maxValue: faker.number.int({ min: 1000, max: 999999999 }),
    startValue: faker.number.int({ min: 1, max: 100 }),
    cache: faker.number.int({ min: 1, max: 100 }),
    cycle: faker.datatype.boolean({ probability: 0.2 }),
    ownedBy: faker.datatype.boolean({ probability: 0.5 }) ? 
      `${faker.helpers.arrayElement(COMMON_TABLE_NAMES)}.id` : 
      undefined,
  }));
}

// =============================================================================
// PERFORMANCE TESTING FACTORIES
// =============================================================================

/**
 * Create performance metrics for schema operations testing
 */
export function createSchemaPerformanceMetrics(
  overrides: Partial<SchemaPerformanceMetrics> = {}
): SchemaPerformanceMetrics {
  return {
    discoveryTime: overrides.discoveryTime || faker.number.int({ min: 100, max: 5000 }),
    renderTime: overrides.renderTime || faker.number.int({ min: 10, max: 200 }),
    cacheHitRate: overrides.cacheHitRate || faker.number.float({ min: 0.7, max: 1.0, fractionDigits: 2 }),
    totalTables: overrides.totalTables || faker.number.int({ min: 10, max: 1000 }),
    loadedTables: overrides.loadedTables || faker.number.int({ min: 10, max: 1000 }),
    averageTableSize: overrides.averageTableSize || faker.number.int({ min: 5, max: 50 }),
    virtualItemsRendered: overrides.virtualItemsRendered || faker.number.int({ min: 10, max: 100 }),
    virtualScrollPosition: overrides.virtualScrollPosition || faker.number.int({ min: 0, max: 10000 }),
    virtualScrollHeight: overrides.virtualScrollHeight || faker.number.int({ min: 1000, max: 50000 }),
    estimatedMemoryUsage: overrides.estimatedMemoryUsage || faker.number.int({ min: 10, max: 500 }),
    cacheSize: overrides.cacheSize || faker.number.int({ min: 5, max: 100 }),
    errors: overrides.errors || generateSchemaErrors(),
    warnings: overrides.warnings || generateSchemaWarnings(),
  };
}

function generateSchemaErrors(): SchemaError[] {
  const errorCount = faker.number.int({ min: 0, max: 3 });
  return Array.from({ length: errorCount }, () => ({
    type: faker.helpers.arrayElement([
      'connection_failed', 'discovery_timeout', 'permission_denied',
      'table_not_found', 'field_not_found', 'relationship_invalid',
      'cache_error', 'validation_error', 'unknown_error'
    ] as SchemaErrorType[]),
    message: faker.lorem.sentence(),
    details: faker.lorem.paragraph(),
    timestamp: faker.date.recent().toISOString(),
    tableName: faker.datatype.boolean({ probability: 0.5 }) ? 
      faker.helpers.arrayElement(COMMON_TABLE_NAMES) : undefined,
    fieldName: faker.datatype.boolean({ probability: 0.3 }) ? faker.word.sample() : undefined,
    recoverable: faker.datatype.boolean({ probability: 0.7 }),
  }));
}

function generateSchemaWarnings(): SchemaWarning[] {
  const warningCount = faker.number.int({ min: 0, max: 5 });
  return Array.from({ length: warningCount }, () => ({
    type: faker.helpers.arrayElement([
      'large_table', 'missing_primary_key', 'unused_index',
      'circular_reference', 'performance_concern', 'compatibility_issue'
    ] as SchemaWarningType[]),
    message: faker.lorem.sentence(),
    timestamp: faker.date.recent().toISOString(),
    tableName: faker.datatype.boolean({ probability: 0.7 }) ? 
      faker.helpers.arrayElement(COMMON_TABLE_NAMES) : undefined,
    fieldName: faker.datatype.boolean({ probability: 0.4 }) ? faker.word.sample() : undefined,
    suggestion: faker.lorem.sentence(),
  }));
}

// =============================================================================
// EXPORT COLLECTION AND VERSIONING FACTORIES
// =============================================================================

/**
 * Create fixtures for testing schema import/export workflows
 */
export function createSchemaExportData(schema: SchemaData): {
  exportData: any;
  metadata: any;
  checksum: string;
} {
  const exportData = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    source: {
      serviceName: schema.serviceName,
      databaseName: schema.databaseName,
      schemaName: schema.schemaName,
    },
    tables: schema.tables.map(table => ({
      name: table.name,
      fields: table.fields.map(field => ({
        name: field.name,
        type: field.type,
        dbType: field.dbType,
        length: field.length,
        precision: field.precision,
        scale: field.scale,
        nullable: field.allowNull,
        primaryKey: field.isPrimaryKey,
        foreignKey: field.isForeignKey,
        unique: field.isUnique,
        defaultValue: field.defaultValue,
      })),
      relationships: table.related.map(rel => ({
        name: rel.name,
        type: rel.type,
        field: rel.field,
        refTable: rel.refTable,
        refField: rel.refField,
      })),
    })),
    views: schema.views?.map(view => ({
      name: view.name,
      definition: view.definition,
      updatable: view.updatable,
    })) || [],
  };

  const metadata = {
    tableCount: schema.tables.length,
    fieldCount: schema.totalFields,
    relationshipCount: schema.totalRelationships,
    exportSize: JSON.stringify(exportData).length,
    compatibility: ['mysql', 'postgresql', 'oracle'],
  };

  const checksum = faker.string.alphanumeric(32);

  return { exportData, metadata, checksum };
}

/**
 * Create fixtures for testing schema versioning scenarios
 */
export function createSchemaVersionHistory(baseSchema: SchemaData, versionCount: number = 5): Array<{
  version: string;
  timestamp: string;
  changes: string[];
  schema: SchemaData;
}> {
  const versions = [];
  let currentSchema = baseSchema;

  for (let i = 0; i < versionCount; i++) {
    const version = `v${i + 1}.${faker.number.int({ min: 0, max: 9 })}.${faker.number.int({ min: 0, max: 9 })}`;
    const timestamp = faker.date.past().toISOString();
    
    const changes = faker.helpers.arrayElements([
      'Added new table: ' + faker.helpers.arrayElement(COMMON_TABLE_NAMES),
      'Modified field: ' + faker.word.sample(),
      'Added relationship: ' + faker.word.sample(),
      'Updated table constraints',
      'Added index for performance',
      'Renamed field: ' + faker.word.sample(),
      'Removed deprecated table',
    ], faker.number.int({ min: 1, max: 4 }));

    // Create a modified version of the schema
    const modifiedSchema = {
      ...currentSchema,
      lastDiscovered: timestamp,
      tables: currentSchema.tables.map(table => ({
        ...table,
        lastCacheUpdate: timestamp,
      })),
    };

    versions.push({
      version,
      timestamp,
      changes,
      schema: modifiedSchema,
    });

    currentSchema = modifiedSchema;
  }

  return versions.reverse(); // Most recent first
}

// =============================================================================
// COMPREHENSIVE TEST DATA FACTORIES
// =============================================================================

/**
 * Create a complete test dataset with all schema components
 */
export function createCompleteSchemaTestDataset(config: SchemaFixtureConfig = {}): {
  smallSchema: SchemaData;
  mediumSchema: SchemaData;
  largeSchema: SchemaData;
  ecommerceSchema: SchemaData;
  hierarchicalSchema: SchemaData;
  performanceMetrics: SchemaPerformanceMetrics;
  validationRules: FieldValidation[];
  exportData: any;
  versionHistory: any[];
} {
  const smallSchema = schemaDiscoveryFactory({}, { ...config, enableVirtualScrolling: false });
  const mediumSchema = createEcommerceSchema(config);
  const largeSchema = createLargeSchemaDataset(1000, config);
  const ecommerceSchema = createEcommerceSchema(config);
  const hierarchicalSchema = createHierarchicalSchema(config);
  
  const performanceMetrics = createSchemaPerformanceMetrics();
  
  const validationRules = [
    createEmailValidation(),
    createPasswordValidation(),
    createNumericRangeValidation(0, 100),
    fieldValidationFactory('string'),
    fieldValidationFactory('integer'),
  ];
  
  const exportData = createSchemaExportData(ecommerceSchema);
  const versionHistory = createSchemaVersionHistory(ecommerceSchema);

  return {
    smallSchema,
    mediumSchema,
    largeSchema,
    ecommerceSchema,
    hierarchicalSchema,
    performanceMetrics,
    validationRules,
    exportData,
    versionHistory,
  };
}

/**
 * Create test scenario-specific data
 */
export function createSchemaTestScenario(scenario: string, config: SchemaFixtureConfig = {}): any {
  switch (scenario) {
    case 'large-schema-virtualization':
      return {
        schema: createLargeSchemaDataset(1500, { ...config, enableVirtualScrolling: true }),
        metrics: createSchemaPerformanceMetrics({ 
          totalTables: 1500,
          virtualItemsRendered: 50,
          renderTime: 150,
        }),
      };

    case 'relationship-testing':
      return {
        schema: createHierarchicalSchema(config),
        relationships: [
          createBelongsToRelationship('department_id', 'departments'),
          createHasManyRelationship('employees', 'department_id'),
          createManyManyRelationship('projects', 'employee_id', 'employee_projects'),
        ],
      };

    case 'field-validation-comprehensive':
      return {
        fields: [
          createEmailField('email'),
          createForeignKeyField('user_id', 'users'),
          createTimestampField('created_at'),
          createStatusField('status', ['active', 'inactive', 'pending']),
        ],
        validations: [
          createEmailValidation(),
          createPasswordValidation(),
          createNumericRangeValidation(1, 1000),
        ],
      };

    case 'performance-stress-test':
      return {
        schema: createLargeSchemaDataset(5000, config),
        metrics: createSchemaPerformanceMetrics({
          totalTables: 5000,
          discoveryTime: 15000,
          renderTime: 500,
          cacheHitRate: 0.95,
        }),
      };

    case 'import-export-workflow':
      const schema = createEcommerceSchema(config);
      return {
        schema,
        exportData: createSchemaExportData(schema),
        versionHistory: createSchemaVersionHistory(schema, 10),
      };

    default:
      throw new Error(`Unknown schema test scenario: ${scenario}`);
  }
}

// Re-export key types for convenience
export type {
  SchemaData,
  SchemaTable,
  SchemaField,
  TableRelated,
  FieldValidation,
  SchemaFixtureConfig,
};