/**
 * Component Factory Functions for React/Next.js Testing
 * 
 * Provides standardized factory functions for creating reusable test components
 * and mock data structures that mirror the patterns from Angular TestBed.
 * 
 * This factory module creates realistic mock data for:
 * - Database service configurations and connection testing
 * - Schema discovery metadata for tables, fields, and relationships
 * - User and admin profiles with role-based permission scenarios
 * - Form validation test data for React Hook Form integration
 * - API endpoint configuration data for OpenAPI testing
 * - System configuration settings and environment data
 * 
 * All factories support:
 * - React Query/SWR caching patterns
 * - Virtual scrolling for large datasets (1000+ tables)
 * - Zod schema validation integration
 * - Real-time form validation scenarios
 * - Performance optimization patterns
 */

import { faker } from '@faker-js/faker';
import type {
  DatabaseService,
  DatabaseConfig,
  MySQLConfig,
  PostgreSQLConfig,
  MongoDBConfig,
  ConnectionTestResult,
  DatabaseType,
  SSLConfig,
  PoolingConfig,
} from '../../types/database';
import type {
  SchemaData,
  SchemaTable,
  SchemaField,
  ForeignKey,
  TableIndex,
  TableConstraint,
  TableRelated,
  SchemaTreeNode,
  TreeNodeType,
  FieldType,
  RelationshipType,
} from '../../types/schema';
import { mockData } from '../mocks/mock-data';

// ============================================================================
// DATABASE SERVICE FACTORY FUNCTIONS
// ============================================================================

/**
 * Factory for creating database service configurations
 * Replaces Angular service mocks with React Query-compatible data
 */
export class DatabaseServiceFactory {
  /**
   * Creates a complete database service with realistic configuration
   */
  static create(overrides: Partial<DatabaseService> = {}): DatabaseService {
    const type = overrides.type || faker.helpers.arrayElement(['mysql', 'postgresql', 'mongodb'] as DatabaseType[]);
    const id = overrides.id || faker.number.int({ min: 1, max: 1000 });
    const name = overrides.name || `${type}_${faker.company.buzzNoun().toLowerCase()}`;
    
    return {
      id,
      name,
      label: overrides.label || faker.company.buzzPhrase(),
      description: overrides.description || faker.lorem.sentence(),
      type,
      config: this.createConfig(type, overrides.config),
      is_active: overrides.is_active ?? faker.datatype.boolean({ probability: 0.8 }),
      created_date: overrides.created_date || faker.date.past({ years: 2 }).toISOString(),
      last_modified_date: overrides.last_modified_date || faker.date.recent({ days: 30 }).toISOString(),
      created_by_id: overrides.created_by_id || faker.number.int({ min: 1, max: 10 }),
      last_modified_by_id: overrides.last_modified_by_id || faker.number.int({ min: 1, max: 10 }),
      status: overrides.status || 'active',
      lastConnectionTest: this.createConnectionTestResult(overrides.lastConnectionTest),
      schemaLastDiscovered: overrides.schemaLastDiscovered || faker.date.recent({ hours: 24 }).toISOString(),
      apiEndpointsCount: overrides.apiEndpointsCount || faker.number.int({ min: 0, max: 100 }),
      ...overrides,
    };
  }

  /**
   * Creates database configuration based on type
   */
  static createConfig(type: DatabaseType, overrides: Partial<DatabaseConfig> = {}): DatabaseConfig {
    const baseConfig = {
      name: overrides.name || `${type}_service_${faker.number.int({ min: 100, max: 999 })}`,
      label: overrides.label || faker.company.buzzPhrase(),
      description: overrides.description || faker.lorem.sentence(),
      type,
      host: overrides.host || faker.internet.domainName(),
      port: this.getDefaultPort(type),
      database: overrides.database || faker.database.name(),
      username: overrides.username || faker.internet.userName(),
      password: overrides.password || faker.internet.password(),
      isActive: overrides.isActive ?? true,
      ssl: this.createSSLConfig(),
      pooling: this.createPoolingConfig(),
      connectionTimeout: 5000,
      ...overrides,
    };

    // Type-specific configurations
    switch (type) {
      case 'mysql':
        return {
          ...baseConfig,
          type: 'mysql',
          charset: 'utf8mb4',
          timezone: 'UTC',
          strictMode: true,
          flags: ['FOUND_ROWS'],
        } as MySQLConfig;

      case 'postgresql':
        return {
          ...baseConfig,
          type: 'postgresql',
          searchPath: ['public'],
          applicationName: 'DreamFactory',
          statementTimeout: 30000,
          sslVerification: true,
        } as PostgreSQLConfig;

      case 'mongodb':
        return {
          ...baseConfig,
          type: 'mongodb',
          port: 27017,
          uri: `mongodb://${baseConfig.host}:27017/${baseConfig.database}`,
          defaultDatabase: baseConfig.database,
          authDatabase: 'admin',
          readPreference: 'primary',
          writeConcern: {
            w: 1,
            j: true,
            wtimeout: 5000,
          },
        } as MongoDBConfig;

      default:
        return baseConfig as DatabaseConfig;
    }
  }

  /**
   * Creates SSL configuration for secure connections
   */
  static createSSLConfig(overrides: Partial<SSLConfig> = {}): SSLConfig {
    return {
      enabled: overrides.enabled ?? faker.datatype.boolean({ probability: 0.7 }),
      mode: overrides.mode || faker.helpers.arrayElement(['require', 'prefer', 'verify-full']),
      rejectUnauthorized: overrides.rejectUnauthorized ?? true,
      serverName: overrides.serverName || faker.internet.domainName(),
      ...overrides,
    };
  }

  /**
   * Creates connection pooling configuration
   */
  static createPoolingConfig(overrides: Partial<PoolingConfig> = {}): PoolingConfig {
    return {
      enabled: overrides.enabled ?? true,
      min: overrides.min || faker.number.int({ min: 2, max: 5 }),
      max: overrides.max || faker.number.int({ min: 10, max: 50 }),
      idleTimeoutMillis: overrides.idleTimeoutMillis || 600000,
      acquireTimeoutMillis: overrides.acquireTimeoutMillis || 30000,
      testOnBorrow: overrides.testOnBorrow ?? true,
      testWhileIdle: overrides.testWhileIdle ?? true,
      validationQuery: overrides.validationQuery || 'SELECT 1',
      ...overrides,
    };
  }

  /**
   * Creates connection test results for different scenarios
   */
  static createConnectionTestResult(overrides: Partial<ConnectionTestResult> = {}): ConnectionTestResult {
    const success = overrides.success ?? faker.datatype.boolean({ probability: 0.8 });
    const duration = faker.number.int({ min: 100, max: 5000 });
    
    if (success) {
      return {
        success: true,
        duration,
        timestamp: faker.date.recent({ minutes: 30 }).toISOString(),
        message: 'Connection successful',
        serverVersion: this.generateServerVersion(),
        availableSchemas: faker.helpers.multiple(() => faker.database.name(), { count: { min: 1, max: 5 } }),
        capabilities: this.createConnectionCapabilities(),
        ...overrides,
      };
    } else {
      const errorTypes = ['CONNECTION_TIMEOUT', 'AUTHENTICATION_FAILED', 'HOST_UNREACHABLE', 'DATABASE_NOT_FOUND'];
      return {
        success: false,
        duration,
        timestamp: faker.date.recent({ minutes: 30 }).toISOString(),
        message: 'Connection failed',
        error: {
          code: faker.helpers.arrayElement(errorTypes),
          message: faker.lorem.sentence(),
          details: faker.lorem.paragraph(),
        },
        ...overrides,
      };
    }
  }

  /**
   * Creates connection capabilities based on database type
   */
  static createConnectionCapabilities() {
    return {
      transactions: faker.datatype.boolean({ probability: 0.9 }),
      foreignKeys: faker.datatype.boolean({ probability: 0.8 }),
      storedProcedures: faker.datatype.boolean({ probability: 0.7 }),
      views: faker.datatype.boolean({ probability: 0.9 }),
      fullTextSearch: faker.datatype.boolean({ probability: 0.6 }),
      jsonSupport: faker.datatype.boolean({ probability: 0.8 }),
      maxConnections: faker.number.int({ min: 50, max: 1000 }),
      charsets: ['utf8', 'utf8mb4', 'latin1'],
    };
  }

  /**
   * Creates multiple database services for testing large datasets
   */
  static createMany(count: number, overrides: Partial<DatabaseService> = {}): DatabaseService[] {
    return Array.from({ length: count }, (_, index) => 
      this.create({ 
        id: index + 1,
        name: `service_${index + 1}`,
        ...overrides 
      })
    );
  }

  /**
   * Creates services with different connection states for testing scenarios
   */
  static createWithStates(): Record<string, DatabaseService> {
    return {
      connected: this.create({
        lastConnectionTest: this.createConnectionTestResult({ success: true }),
        status: 'active',
      }),
      disconnected: this.create({
        lastConnectionTest: this.createConnectionTestResult({ success: false }),
        status: 'inactive',
      }),
      connecting: this.create({
        lastConnectionTest: undefined,
        status: 'active',
      }),
    };
  }

  private static getDefaultPort(type: DatabaseType): number {
    const ports = {
      mysql: 3306,
      postgresql: 5432,
      oracle: 1521,
      mongodb: 27017,
      snowflake: 443,
    };
    return ports[type] || 3306;
  }

  private static generateServerVersion(): string {
    const major = faker.number.int({ min: 8, max: 15 });
    const minor = faker.number.int({ min: 0, max: 9 });
    const patch = faker.number.int({ min: 0, max: 20 });
    return `${major}.${minor}.${patch}`;
  }
}

// ============================================================================
// SCHEMA DISCOVERY FACTORY FUNCTIONS
// ============================================================================

/**
 * Factory for creating schema metadata for testing schema discovery functionality
 * Supports virtual scrolling for large datasets (1000+ tables)
 */
export class SchemaDiscoveryFactory {
  /**
   * Creates complete schema data with realistic metadata
   */
  static createSchemaData(overrides: Partial<SchemaData> = {}): SchemaData {
    const serviceName = overrides.serviceName || `mysql_${faker.company.buzzNoun().toLowerCase()}`;
    const tableCount = overrides.totalTables || faker.number.int({ min: 10, max: 50 });
    
    return {
      serviceName,
      serviceId: overrides.serviceId || faker.number.int({ min: 1, max: 100 }),
      databaseName: overrides.databaseName || faker.database.name(),
      schemaName: overrides.schemaName || 'public',
      tables: this.createTables(tableCount),
      views: this.createViews(faker.number.int({ min: 0, max: 10 })),
      procedures: this.createProcedures(faker.number.int({ min: 0, max: 5 })),
      functions: this.createFunctions(faker.number.int({ min: 0, max: 5 })),
      sequences: this.createSequences(faker.number.int({ min: 0, max: 3 })),
      lastDiscovered: overrides.lastDiscovered || faker.date.recent({ hours: 2 }).toISOString(),
      totalTables: tableCount,
      totalFields: tableCount * faker.number.int({ min: 3, max: 15 }),
      totalRelationships: faker.number.int({ min: 0, max: tableCount }),
      virtualScrollingEnabled: overrides.virtualScrollingEnabled ?? true,
      pageSize: overrides.pageSize || 50,
      estimatedRowHeight: overrides.estimatedRowHeight || 48,
      loadingState: this.createLoadingState(),
      progressiveData: this.createProgressiveData(tableCount),
      ...overrides,
    };
  }

  /**
   * Creates schema tables with realistic field structures
   */
  static createTables(count: number): SchemaTable[] {
    const tableTypes = ['users', 'products', 'orders', 'categories', 'reviews', 'sessions', 'logs'];
    
    return Array.from({ length: count }, (_, index) => {
      const baseType = faker.helpers.arrayElement(tableTypes);
      const tableName = count > 10 ? `${baseType}_${index + 1}` : baseType;
      
      return this.createTable({
        id: `table_${index + 1}`,
        name: tableName,
        level: 0,
        virtualIndex: index,
        cacheKey: `schema:table:${tableName}`,
      });
    });
  }

  /**
   * Creates a single table with complete metadata
   */
  static createTable(overrides: Partial<SchemaTable> = {}): SchemaTable {
    const tableName = overrides.name || faker.database.table();
    const fieldCount = faker.number.int({ min: 3, max: 15 });
    const fields = this.createFields(fieldCount, tableName);
    
    return {
      id: overrides.id || `table_${faker.string.uuid()}`,
      name: tableName,
      label: overrides.label || this.generateLabel(tableName),
      description: overrides.description || faker.lorem.sentence(),
      schema: overrides.schema || 'public',
      alias: overrides.alias || tableName,
      plural: overrides.plural || `${tableName}s`,
      isView: overrides.isView ?? false,
      fields,
      primaryKey: this.extractPrimaryKey(fields),
      foreignKeys: this.createForeignKeys(fields),
      indexes: this.createIndexes(fields),
      constraints: this.createConstraints(fields),
      triggers: this.createTriggers(),
      related: this.createRelationships(tableName),
      nameField: this.findNameField(fields),
      rowCount: overrides.rowCount || faker.number.int({ min: 0, max: 1000000 }),
      estimatedSize: overrides.estimatedSize || this.generateSize(),
      lastModified: overrides.lastModified || faker.date.recent({ days: 30 }).toISOString(),
      collation: overrides.collation || 'utf8mb4_unicode_ci',
      engine: overrides.engine || 'InnoDB',
      access: overrides.access || 0,
      virtualIndex: overrides.virtualIndex,
      virtualHeight: overrides.virtualHeight || 48,
      isVisible: overrides.isVisible ?? true,
      expanded: overrides.expanded ?? false,
      selected: overrides.selected ?? false,
      level: overrides.level ?? 0,
      hasChildren: overrides.hasChildren ?? true,
      isLoading: overrides.isLoading ?? false,
      apiEnabled: overrides.apiEnabled ?? true,
      generatedEndpoints: overrides.generatedEndpoints || this.generateEndpoints(tableName),
      cacheKey: overrides.cacheKey || `schema:table:${tableName}`,
      lastCacheUpdate: overrides.lastCacheUpdate || faker.date.recent({ minutes: 5 }).toISOString(),
      ...overrides,
    };
  }

  /**
   * Creates schema fields with realistic types and constraints
   */
  static createFields(count: number, tableName: string): SchemaField[] {
    const fields: SchemaField[] = [];
    
    // Always include an ID field
    fields.push(this.createField({
      name: 'id',
      type: 'integer',
      isPrimaryKey: true,
      isAutoIncrement: true,
      required: true,
      allowNull: false,
    }));

    // Add realistic fields based on table type
    const commonFields = this.getCommonFieldsForTable(tableName);
    
    for (let i = 1; i < count; i++) {
      const fieldConfig = commonFields[i] || this.generateRandomField();
      fields.push(this.createField({
        ...fieldConfig,
        id: `field_${fields.length + 1}`,
      }));
    }

    return fields;
  }

  /**
   * Creates a single field with complete metadata
   */
  static createField(overrides: Partial<SchemaField> = {}): SchemaField {
    const fieldName = overrides.name || faker.database.column();
    const fieldType = overrides.type || this.getRandomFieldType();
    
    return {
      id: overrides.id || `field_${faker.string.uuid()}`,
      name: fieldName,
      label: overrides.label || this.generateLabel(fieldName),
      description: overrides.description || faker.lorem.sentence(),
      alias: overrides.alias || fieldName,
      type: fieldType,
      dbType: overrides.dbType || this.getDbType(fieldType),
      length: overrides.length || this.getFieldLength(fieldType),
      precision: overrides.precision,
      scale: overrides.scale,
      defaultValue: overrides.defaultValue,
      isNullable: overrides.isNullable ?? !overrides.required,
      allowNull: overrides.allowNull ?? !overrides.required,
      isPrimaryKey: overrides.isPrimaryKey ?? false,
      isForeignKey: overrides.isForeignKey ?? false,
      isUnique: overrides.isUnique ?? false,
      isIndex: overrides.isIndex ?? false,
      isAutoIncrement: overrides.isAutoIncrement ?? false,
      isComputed: overrides.isComputed ?? false,
      isVirtual: overrides.isVirtual ?? false,
      isAggregate: overrides.isAggregate ?? false,
      required: overrides.required ?? faker.datatype.boolean({ probability: 0.3 }),
      fixedLength: overrides.fixedLength ?? false,
      supportsMultibyte: overrides.supportsMultibyte ?? true,
      refTable: overrides.refTable,
      refField: overrides.refField,
      refOnUpdate: overrides.refOnUpdate,
      refOnDelete: overrides.refOnDelete,
      validation: this.createFieldValidation(fieldType, overrides.required),
      constraints: this.createFieldConstraints(),
      picklist: overrides.picklist,
      format: this.createFieldFormat(fieldType),
      hidden: overrides.hidden ?? false,
      dbFunction: overrides.dbFunction,
      native: overrides.native,
      value: overrides.value,
      ...overrides,
    };
  }

  /**
   * Creates field validation rules for React Hook Form integration
   */
  static createFieldValidation(type: FieldType, required?: boolean) {
    const validation: any = {
      required: required ?? false,
      validateOnChange: true,
      validateOnBlur: true,
      debounceMs: 300,
    };

    switch (type) {
      case 'string':
        validation.maxLength = faker.number.int({ min: 50, max: 255 });
        if (required) validation.minLength = 1;
        break;
      case 'integer':
        validation.min = 0;
        validation.max = faker.number.int({ min: 1000, max: 2147483647 });
        break;
      case 'decimal':
        validation.min = 0;
        validation.max = 999999.99;
        break;
    }

    return validation;
  }

  /**
   * Creates hierarchical tree nodes for virtual scrolling
   */
  static createTreeNodes(schemaData: SchemaData): SchemaTreeNode[] {
    const nodes: SchemaTreeNode[] = [];
    let index = 0;

    // Root database node
    nodes.push({
      id: 'root',
      type: 'database',
      name: schemaData.databaseName,
      label: schemaData.databaseName,
      parentId: undefined,
      children: [],
      level: 0,
      index: index++,
      expanded: true,
      selected: false,
      isLoading: false,
      hasChildren: true,
      virtualIndex: 0,
      virtualHeight: 48,
      isVisible: true,
      cacheKey: `tree:database:${schemaData.databaseName}`,
      lastUpdated: faker.date.recent({ minutes: 1 }).toISOString(),
    });

    // Tables node
    const tablesNode: SchemaTreeNode = {
      id: 'tables',
      type: 'tables',
      name: 'Tables',
      label: `Tables (${schemaData.tables.length})`,
      parentId: 'root',
      children: [],
      level: 1,
      index: index++,
      expanded: false,
      selected: false,
      isLoading: false,
      hasChildren: schemaData.tables.length > 0,
      virtualIndex: 1,
      virtualHeight: 48,
      isVisible: true,
      cacheKey: 'tree:tables',
      lastUpdated: faker.date.recent({ minutes: 1 }).toISOString(),
    };
    nodes.push(tablesNode);

    // Individual table nodes
    schemaData.tables.forEach((table, tableIndex) => {
      const tableNode: SchemaTreeNode = {
        id: `table:${table.name}`,
        type: 'table',
        name: table.name,
        label: table.label,
        description: table.description,
        parentId: 'tables',
        children: [],
        level: 2,
        index: index++,
        expanded: table.expanded,
        selected: table.selected,
        isLoading: table.isLoading,
        hasChildren: table.fields.length > 0,
        virtualIndex: tableIndex + 2,
        virtualHeight: 48,
        isVisible: true,
        data: table,
        cacheKey: table.cacheKey,
        lastUpdated: table.lastCacheUpdate,
      };
      nodes.push(tableNode);
      tablesNode.children.push(tableNode);
    });

    return nodes;
  }

  /**
   * Creates large dataset for virtual scrolling testing (1000+ tables)
   */
  static createLargeDataset(tableCount: number = 1500): SchemaData {
    return this.createSchemaData({
      totalTables: tableCount,
      virtualScrollingEnabled: true,
      pageSize: 100,
      estimatedRowHeight: 40,
      progressiveData: this.createProgressiveData(tableCount),
    });
  }

  /**
   * Creates progressive loading state for large schemas
   */
  static createLoadingState() {
    return {
      isLoading: faker.datatype.boolean({ probability: 0.2 }),
      isError: faker.datatype.boolean({ probability: 0.1 }),
      error: undefined,
      loadedTables: faker.number.int({ min: 0, max: 100 }),
      totalTables: faker.number.int({ min: 50, max: 200 }),
      currentPage: faker.number.int({ min: 1, max: 10 }),
      hasNextPage: faker.datatype.boolean({ probability: 0.6 }),
      isFetchingNextPage: faker.datatype.boolean({ probability: 0.3 }),
    };
  }

  /**
   * Creates progressive data chunks for large schemas
   */
  static createProgressiveData(totalTables: number) {
    const chunkSize = 50;
    const totalChunks = Math.ceil(totalTables / chunkSize);
    const loadedChunks = faker.number.int({ min: 1, max: totalChunks });

    return {
      chunks: Array.from({ length: loadedChunks }, (_, index) => ({
        chunkId: index,
        startIndex: index * chunkSize,
        endIndex: Math.min((index + 1) * chunkSize, totalTables),
        tables: this.createTables(Math.min(chunkSize, totalTables - index * chunkSize)),
        loadedAt: faker.date.recent({ hours: 1 }).toISOString(),
        isStale: faker.datatype.boolean({ probability: 0.1 }),
      })),
      chunkSize,
      totalChunks,
      loadedChunks,
      lastLoadTime: faker.date.recent({ minutes: 30 }).toISOString(),
    };
  }

  // Helper methods for realistic data generation
  private static getRandomFieldType(): FieldType {
    return faker.helpers.arrayElement([
      'integer', 'string', 'text', 'boolean', 'date', 'datetime', 
      'timestamp', 'decimal', 'json', 'uuid'
    ]);
  }

  private static getDbType(type: FieldType): string {
    const typeMap = {
      integer: 'INT',
      bigint: 'BIGINT',
      string: 'VARCHAR',
      text: 'TEXT',
      boolean: 'BOOLEAN',
      date: 'DATE',
      datetime: 'DATETIME',
      timestamp: 'TIMESTAMP',
      decimal: 'DECIMAL',
      json: 'JSON',
      uuid: 'CHAR',
    };
    return typeMap[type] || 'VARCHAR';
  }

  private static getFieldLength(type: FieldType): number | undefined {
    if (type === 'string') return faker.number.int({ min: 50, max: 255 });
    if (type === 'uuid') return 36;
    return undefined;
  }

  private static generateLabel(name: string): string {
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private static generateSize(): string {
    const sizeKb = faker.number.int({ min: 16, max: 10240 });
    return sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;
  }

  private static generateEndpoints(tableName: string): string[] {
    return [
      `GET /api/v2/mysql/${tableName}`,
      `POST /api/v2/mysql/${tableName}`,
      `PUT /api/v2/mysql/${tableName}/{id}`,
      `DELETE /api/v2/mysql/${tableName}/{id}`,
    ];
  }

  private static getCommonFieldsForTable(tableName: string): Partial<SchemaField>[] {
    const baseFields = [
      { name: 'created_at', type: 'timestamp' as FieldType, required: true },
      { name: 'updated_at', type: 'timestamp' as FieldType, required: true },
    ];

    if (tableName.includes('user')) {
      return [
        ...baseFields,
        { name: 'email', type: 'string' as FieldType, required: true, isUnique: true },
        { name: 'first_name', type: 'string' as FieldType, required: true },
        { name: 'last_name', type: 'string' as FieldType, required: true },
        { name: 'is_active', type: 'boolean' as FieldType, required: true },
      ];
    }

    if (tableName.includes('product')) {
      return [
        ...baseFields,
        { name: 'name', type: 'string' as FieldType, required: true },
        { name: 'sku', type: 'string' as FieldType, required: true, isUnique: true },
        { name: 'price', type: 'decimal' as FieldType, required: true },
        { name: 'category_id', type: 'integer' as FieldType, isForeignKey: true },
      ];
    }

    return baseFields;
  }

  private static generateRandomField(): Partial<SchemaField> {
    const type = this.getRandomFieldType();
    return {
      name: faker.database.column(),
      type,
      required: faker.datatype.boolean({ probability: 0.3 }),
    };
  }

  private static extractPrimaryKey(fields: SchemaField[]): string[] {
    return fields.filter(field => field.isPrimaryKey).map(field => field.name);
  }

  private static createForeignKeys(fields: SchemaField[]): ForeignKey[] {
    return fields
      .filter(field => field.isForeignKey)
      .map(field => ({
        name: `fk_${field.name}`,
        field: field.name,
        referencedTable: field.refTable || 'referenced_table',
        referencedField: field.refField || 'id',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }));
  }

  private static createIndexes(fields: SchemaField[]): TableIndex[] {
    const indexes: TableIndex[] = [];
    
    fields.forEach(field => {
      if (field.isUnique || field.isIndex) {
        indexes.push({
          name: `idx_${field.name}`,
          fields: [field.name],
          unique: field.isUnique,
          type: 'btree',
        });
      }
    });

    return indexes;
  }

  private static createConstraints(fields: SchemaField[]): TableConstraint[] {
    const constraints: TableConstraint[] = [];
    
    const pkFields = fields.filter(f => f.isPrimaryKey);
    if (pkFields.length > 0) {
      constraints.push({
        name: 'pk_constraint',
        type: 'primary_key',
        definition: `PRIMARY KEY (${pkFields.map(f => f.name).join(', ')})`,
        fields: pkFields.map(f => f.name),
      });
    }

    return constraints;
  }

  private static createTriggers() {
    return faker.helpers.maybe(() => [
      {
        name: 'update_timestamp',
        timing: 'BEFORE' as const,
        events: ['UPDATE' as const],
        definition: 'SET NEW.updated_at = NOW()',
        enabled: true,
      },
    ], { probability: 0.3 }) || [];
  }

  private static createRelationships(tableName: string): TableRelated[] {
    const relationshipCount = faker.number.int({ min: 0, max: 3 });
    
    return Array.from({ length: relationshipCount }, (_, index) => ({
      id: `rel_${index + 1}`,
      alias: `${tableName}_relation_${index + 1}`,
      name: faker.database.table(),
      label: faker.company.buzzPhrase(),
      type: faker.helpers.arrayElement(['belongs_to', 'has_many', 'has_one', 'many_many'] as RelationshipType[]),
      field: 'id',
      isVirtual: faker.datatype.boolean({ probability: 0.2 }),
      refServiceId: faker.number.int({ min: 1, max: 10 }),
      refTable: faker.database.table(),
      refField: 'id',
      alwaysFetch: faker.datatype.boolean({ probability: 0.3 }),
      flatten: faker.datatype.boolean({ probability: 0.2 }),
      flattenDropPrefix: false,
    }));
  }

  private static createViews(count: number) {
    return Array.from({ length: count }, () => ({
      name: `${faker.database.table()}_view`,
      definition: `SELECT * FROM ${faker.database.table()}`,
      fields: this.createFields(faker.number.int({ min: 3, max: 8 }), 'view'),
      updatable: faker.datatype.boolean({ probability: 0.3 }),
    }));
  }

  private static createProcedures(count: number) {
    return Array.from({ length: count }, () => ({
      name: `sp_${faker.database.column()}`,
      parameters: Array.from({ length: faker.number.int({ min: 0, max: 3 }) }, () => ({
        name: faker.database.column(),
        type: 'VARCHAR(255)',
        mode: faker.helpers.arrayElement(['IN', 'OUT', 'INOUT'] as const),
      })),
      definition: `SELECT * FROM ${faker.database.table()}`,
      language: 'SQL',
    }));
  }

  private static createFunctions(count: number) {
    return Array.from({ length: count }, () => ({
      name: `fn_${faker.database.column()}`,
      parameters: Array.from({ length: faker.number.int({ min: 0, max: 2 }) }, () => ({
        name: faker.database.column(),
        type: 'VARCHAR(255)',
      })),
      returnType: 'VARCHAR(255)',
      definition: `RETURN 'result'`,
      language: 'SQL',
    }));
  }

  private static createSequences(count: number) {
    return Array.from({ length: count }, () => ({
      name: `seq_${faker.database.column()}`,
      increment: 1,
      startValue: 1,
      cache: 1,
      cycle: false,
    }));
  }

  private static findNameField(fields: SchemaField[]): string | undefined {
    const nameFields = ['name', 'title', 'label', 'email'];
    return fields.find(field => nameFields.includes(field.name))?.name;
  }

  private static createFieldConstraints() {
    return faker.helpers.maybe(() => [
      {
        type: 'check' as const,
        definition: 'CHECK (value > 0)',
        name: 'positive_value',
        fields: ['value'],
      },
    ], { probability: 0.2 }) || [];
  }

  private static createFieldFormat(type: FieldType) {
    if (type === 'date' || type === 'datetime') {
      return {
        dateFormat: 'YYYY-MM-DD',
      };
    }
    
    if (type === 'decimal') {
      return {
        thousandsSeparator: ',',
        decimalSeparator: '.',
      };
    }

    return undefined;
  }
}

// ============================================================================
// USER PROFILE AND ROLE FACTORY FUNCTIONS
// ============================================================================

/**
 * Factory for creating user and admin profiles with role-based permission scenarios
 */
export class UserProfileFactory {
  /**
   * Creates user profiles with different permission levels
   */
  static createUserWithRole(roleName: string, overrides: any = {}) {
    const role = mockData.roles.find(r => r.name === roleName) || mockData.roles[0];
    
    return {
      id: overrides.id || faker.number.int({ min: 1, max: 1000 }),
      email: overrides.email || faker.internet.email(),
      first_name: overrides.first_name || faker.person.firstName(),
      last_name: overrides.last_name || faker.person.lastName(),
      username: overrides.username || faker.internet.userName(),
      is_active: overrides.is_active ?? true,
      is_verified: overrides.is_verified ?? true,
      role_id: role.id,
      created_date: overrides.created_date || faker.date.past({ years: 1 }).toISOString(),
      last_modified_date: overrides.last_modified_date || faker.date.recent({ days: 7 }).toISOString(),
      last_login_date: overrides.last_login_date || faker.date.recent({ hours: 24 }).toISOString(),
      phone: overrides.phone || faker.phone.number(),
      profile: this.createUserProfile(overrides.profile),
      permissions: role.permissions,
      session: this.createUserSession(),
      ...overrides,
    };
  }

  /**
   * Creates user profile settings
   */
  static createUserProfile(overrides: any = {}) {
    return {
      avatar_url: overrides.avatar_url || faker.image.avatar(),
      timezone: overrides.timezone || faker.location.timeZone(),
      locale: overrides.locale || 'en-US',
      theme: overrides.theme || faker.helpers.arrayElement(['light', 'dark', 'auto']),
      notifications_enabled: overrides.notifications_enabled ?? faker.datatype.boolean({ probability: 0.8 }),
      two_factor_enabled: overrides.two_factor_enabled ?? faker.datatype.boolean({ probability: 0.4 }),
      ...overrides,
    };
  }

  /**
   * Creates user session data
   */
  static createUserSession(overrides: any = {}) {
    return {
      token: overrides.token || faker.string.alphanumeric(128),
      expires_at: overrides.expires_at || faker.date.future({ years: 1 }).toISOString(),
      created_at: overrides.created_at || faker.date.recent({ hours: 1 }).toISOString(),
      ip_address: overrides.ip_address || faker.internet.ip(),
      user_agent: overrides.user_agent || faker.internet.userAgent(),
      ...overrides,
    };
  }

  /**
   * Creates multiple users with different roles for testing
   */
  static createUsersWithDifferentRoles(): Record<string, any> {
    return {
      superAdmin: this.createUserWithRole('super_admin'),
      admin: this.createUserWithRole('admin'),
      developer: this.createUserWithRole('developer'),
      analyst: this.createUserWithRole('analyst'),
      viewer: this.createUserWithRole('viewer'),
    };
  }

  /**
   * Creates admin profiles for system administration
   */
  static createAdmin(overrides: any = {}) {
    return {
      id: overrides.id || faker.number.int({ min: 1, max: 100 }),
      email: overrides.email || faker.internet.email({ provider: 'dreamfactory.com' }),
      first_name: overrides.first_name || faker.person.firstName(),
      last_name: overrides.last_name || faker.person.lastName(),
      username: overrides.username || faker.internet.userName(),
      is_active: overrides.is_active ?? true,
      is_verified: overrides.is_verified ?? true,
      role_id: overrides.role_id || 1,
      created_date: overrides.created_date || faker.date.past({ years: 2 }).toISOString(),
      last_modified_date: overrides.last_modified_date || faker.date.recent({ days: 30 }).toISOString(),
      last_login_date: overrides.last_login_date || faker.date.recent({ hours: 2 }).toISOString(),
      is_sys_admin: overrides.is_sys_admin ?? true,
      permissions: overrides.permissions || ['*'],
      ...overrides,
    };
  }
}

// ============================================================================
// FORM VALIDATION FACTORY FUNCTIONS
// ============================================================================

/**
 * Factory for creating form validation test data for React Hook Form integration
 */
export class FormValidationFactory {
  /**
   * Creates form field configuration for testing validation scenarios
   */
  static createFormField(type: string, overrides: any = {}) {
    const baseField = {
      id: overrides.id || faker.string.uuid(),
      name: overrides.name || faker.database.column(),
      type,
      label: overrides.label || this.generateLabel(overrides.name || 'field'),
      placeholder: overrides.placeholder || `Enter ${type}`,
      description: overrides.description || faker.lorem.sentence(),
      required: overrides.required ?? false,
      disabled: overrides.disabled ?? false,
      readOnly: overrides.readOnly ?? false,
      grid: overrides.grid || { xs: 12, md: 6 },
      section: overrides.section || 'general',
      order: overrides.order || faker.number.int({ min: 1, max: 20 }),
      ...overrides,
    };

    // Add type-specific validation
    switch (type) {
      case 'text':
      case 'email':
      case 'password':
        return {
          ...baseField,
          validation: {
            required: baseField.required,
            minLength: overrides.minLength || (baseField.required ? 1 : undefined),
            maxLength: overrides.maxLength || 255,
            pattern: this.getPatternForType(type),
            ...overrides.validation,
          },
        };

      case 'number':
        return {
          ...baseField,
          validation: {
            required: baseField.required,
            min: overrides.min || 0,
            max: overrides.max || 999999,
            ...overrides.validation,
          },
        };

      case 'select':
        return {
          ...baseField,
          options: overrides.options || this.generateSelectOptions(),
          validation: {
            required: baseField.required,
            ...overrides.validation,
          },
        };

      case 'switch':
      case 'checkbox':
        return {
          ...baseField,
          validation: {
            required: baseField.required,
            ...overrides.validation,
          },
        };

      default:
        return baseField;
    }
  }

  /**
   * Creates complete form schema for testing
   */
  static createFormSchema(formType: string, overrides: any = {}) {
    const schemas = {
      databaseConnection: this.createDatabaseConnectionForm(),
      userProfile: this.createUserProfileForm(),
      apiEndpoint: this.createApiEndpointForm(),
      systemSettings: this.createSystemSettingsForm(),
    };

    return schemas[formType as keyof typeof schemas] || schemas.databaseConnection;
  }

  /**
   * Creates database connection form schema
   */
  static createDatabaseConnectionForm() {
    return {
      id: 'database-connection-form',
      title: 'Database Connection Configuration',
      description: 'Configure database connection settings',
      fields: [
        this.createFormField('text', {
          name: 'name',
          label: 'Service Name',
          required: true,
          validation: {
            required: true,
            minLength: 3,
            maxLength: 50,
            pattern: '^[a-zA-Z0-9_-]+$',
          },
        }),
        this.createFormField('select', {
          name: 'type',
          label: 'Database Type',
          required: true,
          options: [
            { value: 'mysql', label: 'MySQL' },
            { value: 'postgresql', label: 'PostgreSQL' },
            { value: 'mongodb', label: 'MongoDB' },
          ],
        }),
        this.createFormField('text', {
          name: 'host',
          label: 'Host',
          required: true,
          placeholder: 'localhost',
        }),
        this.createFormField('number', {
          name: 'port',
          label: 'Port',
          placeholder: '3306',
          min: 1,
          max: 65535,
        }),
        this.createFormField('text', {
          name: 'database',
          label: 'Database Name',
          required: true,
        }),
        this.createFormField('text', {
          name: 'username',
          label: 'Username',
          required: true,
        }),
        this.createFormField('password', {
          name: 'password',
          label: 'Password',
          required: true,
        }),
        this.createFormField('switch', {
          name: 'ssl_enabled',
          label: 'Enable SSL',
        }),
      ],
      validation: {
        mode: 'onChange',
        reValidateMode: 'onChange',
        shouldFocusError: true,
      },
    };
  }

  /**
   * Creates validation test scenarios
   */
  static createValidationScenarios() {
    return {
      required_field_empty: {
        field: this.createFormField('text', { name: 'email', required: true }),
        value: '',
        expectedError: 'Email is required',
      },
      email_invalid_format: {
        field: this.createFormField('email', { name: 'email', required: true }),
        value: 'invalid-email',
        expectedError: 'Please enter a valid email address',
      },
      password_too_short: {
        field: this.createFormField('password', { 
          name: 'password', 
          required: true,
          minLength: 8,
        }),
        value: '123',
        expectedError: 'Password must be at least 8 characters',
      },
      number_out_of_range: {
        field: this.createFormField('number', { 
          name: 'port', 
          min: 1,
          max: 65535,
        }),
        value: 70000,
        expectedError: 'Port must be between 1 and 65535',
      },
    };
  }

  /**
   * Creates form field validation error messages
   */
  static createValidationErrors(fieldName: string, errorType: string) {
    const errorMessages = {
      required: `${this.generateLabel(fieldName)} is required`,
      minLength: `${this.generateLabel(fieldName)} is too short`,
      maxLength: `${this.generateLabel(fieldName)} is too long`,
      pattern: `${this.generateLabel(fieldName)} format is invalid`,
      min: `${this.generateLabel(fieldName)} value is too small`,
      max: `${this.generateLabel(fieldName)} value is too large`,
      email: 'Please enter a valid email address',
      url: 'Please enter a valid URL',
    };

    return errorMessages[errorType as keyof typeof errorMessages] || 'Invalid value';
  }

  // Helper methods
  private static generateLabel(name: string): string {
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private static getPatternForType(type: string): string | undefined {
    const patterns = {
      email: '^[^@]+@[^@]+\\.[^@]+$',
      password: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d@$!%*?&]{8,}$',
      phone: '^[+]?[0-9\\s\\-\\(\\)]{10,}$',
    };
    return patterns[type as keyof typeof patterns];
  }

  private static generateSelectOptions() {
    return Array.from({ length: faker.number.int({ min: 3, max: 8 }) }, () => ({
      value: faker.string.alphanumeric(8),
      label: faker.company.buzzNoun(),
      description: faker.lorem.sentence(),
    }));
  }

  private static createUserProfileForm() {
    return {
      id: 'user-profile-form',
      title: 'User Profile',
      fields: [
        this.createFormField('text', { name: 'first_name', required: true }),
        this.createFormField('text', { name: 'last_name', required: true }),
        this.createFormField('email', { name: 'email', required: true }),
        this.createFormField('text', { name: 'phone' }),
        this.createFormField('select', { 
          name: 'timezone',
          options: [
            { value: 'UTC', label: 'UTC' },
            { value: 'America/New_York', label: 'Eastern Time' },
            { value: 'America/Los_Angeles', label: 'Pacific Time' },
          ],
        }),
        this.createFormField('switch', { name: 'notifications_enabled' }),
      ],
    };
  }

  private static createApiEndpointForm() {
    return {
      id: 'api-endpoint-form',
      title: 'API Endpoint Configuration',
      fields: [
        this.createFormField('text', { name: 'path', required: true }),
        this.createFormField('select', {
          name: 'method',
          required: true,
          options: [
            { value: 'GET', label: 'GET' },
            { value: 'POST', label: 'POST' },
            { value: 'PUT', label: 'PUT' },
            { value: 'DELETE', label: 'DELETE' },
          ],
        }),
        this.createFormField('textarea', { name: 'description' }),
        this.createFormField('switch', { name: 'require_auth' }),
      ],
    };
  }

  private static createSystemSettingsForm() {
    return {
      id: 'system-settings-form',
      title: 'System Configuration',
      fields: [
        this.createFormField('text', { name: 'app_name', required: true }),
        this.createFormField('text', { name: 'app_url', required: true }),
        this.createFormField('number', { name: 'session_timeout', min: 60, max: 86400 }),
        this.createFormField('switch', { name: 'maintenance_mode' }),
      ],
    };
  }
}

// ============================================================================
// API ENDPOINT CONFIGURATION FACTORY
// ============================================================================

/**
 * Factory for creating API endpoint configuration mock data for OpenAPI testing scenarios
 */
export class ApiEndpointFactory {
  /**
   * Creates OpenAPI specification for testing
   */
  static createOpenApiSpec(serviceName: string, overrides: any = {}) {
    return {
      openapi: '3.0.3',
      info: {
        title: overrides.title || `${serviceName} API`,
        description: overrides.description || `Auto-generated REST API for ${serviceName}`,
        version: overrides.version || '1.0.0',
        contact: {
          name: 'DreamFactory Support',
          email: 'support@dreamfactory.com',
        },
      },
      servers: [
        {
          url: `https://api.dreamfactory.local/api/v2`,
          description: 'Production server',
        },
      ],
      paths: this.createApiPaths(serviceName),
      components: this.createApiComponents(),
      ...overrides,
    };
  }

  /**
   * Creates API endpoint configuration for testing
   */
  static createEndpointConfig(overrides: any = {}) {
    return {
      id: overrides.id || faker.string.uuid(),
      path: overrides.path || `/api/v2/${faker.database.table()}`,
      method: overrides.method || faker.helpers.arrayElement(['GET', 'POST', 'PUT', 'DELETE']),
      summary: overrides.summary || faker.lorem.sentence(),
      description: overrides.description || faker.lorem.paragraph(),
      operationId: overrides.operationId || faker.string.alphanumeric(16),
      tags: overrides.tags || [faker.company.buzzNoun()],
      parameters: this.createEndpointParameters(),
      requestBody: this.createRequestBody(),
      responses: this.createEndpointResponses(),
      security: overrides.security || [{ apiKey: [] }],
      ...overrides,
    };
  }

  /**
   * Creates endpoint parameters for testing
   */
  static createEndpointParameters() {
    return [
      {
        name: 'fields',
        in: 'query',
        description: 'Comma-separated list of fields to return',
        required: false,
        schema: { type: 'string' },
      },
      {
        name: 'filter',
        in: 'query',
        description: 'SQL WHERE clause filter',
        required: false,
        schema: { type: 'string' },
      },
      {
        name: 'limit',
        in: 'query',
        description: 'Number of records to return',
        required: false,
        schema: { 
          type: 'integer',
          minimum: 1,
          maximum: 1000,
          default: 25,
        },
      },
    ];
  }

  /**
   * Creates request body schema for testing
   */
  static createRequestBody() {
    return {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: this.generateSchemaProperties(),
          },
        },
      },
    };
  }

  /**
   * Creates endpoint responses for testing
   */
  static createEndpointResponses() {
    return {
      '200': {
        description: 'Success',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                resource: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Resource' },
                },
                meta: { $ref: '#/components/schemas/Meta' },
              },
            },
          },
        },
      },
      '400': {
        description: 'Bad Request',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
          },
        },
      },
      '401': {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
          },
        },
      },
    };
  }

  // Helper methods
  private static createApiPaths(serviceName: string) {
    const paths: any = {};
    const resources = ['users', 'products', 'orders'];
    
    resources.forEach(resource => {
      const path = `/${serviceName}/${resource}`;
      paths[path] = {
        get: this.createEndpointConfig({ 
          method: 'GET',
          summary: `Retrieve ${resource}`,
          operationId: `get${resource.charAt(0).toUpperCase() + resource.slice(1)}`,
        }),
        post: this.createEndpointConfig({ 
          method: 'POST',
          summary: `Create ${resource}`,
          operationId: `create${resource.charAt(0).toUpperCase() + resource.slice(1)}`,
        }),
      };

      paths[`${path}/{id}`] = {
        get: this.createEndpointConfig({ 
          method: 'GET',
          summary: `Retrieve ${resource} by ID`,
          operationId: `get${resource.charAt(0).toUpperCase() + resource.slice(1)}ById`,
        }),
        put: this.createEndpointConfig({ 
          method: 'PUT',
          summary: `Update ${resource}`,
          operationId: `update${resource.charAt(0).toUpperCase() + resource.slice(1)}`,
        }),
        delete: this.createEndpointConfig({ 
          method: 'DELETE',
          summary: `Delete ${resource}`,
          operationId: `delete${resource.charAt(0).toUpperCase() + resource.slice(1)}`,
        }),
      };
    });

    return paths;
  }

  private static createApiComponents() {
    return {
      schemas: {
        Resource: {
          type: 'object',
          properties: this.generateSchemaProperties(),
        },
        Meta: {
          type: 'object',
          properties: {
            count: { type: 'integer' },
            total: { type: 'integer' },
            limit: { type: 'integer' },
            offset: { type: 'integer' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                code: { type: 'integer' },
                message: { type: 'string' },
                details: { type: 'string' },
              },
            },
          },
        },
      },
      securitySchemes: {
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-DreamFactory-Api-Key',
        },
      },
    };
  }

  private static generateSchemaProperties() {
    return {
      id: { type: 'integer', readOnly: true },
      name: { type: 'string', maxLength: 255 },
      description: { type: 'string' },
      created_at: { type: 'string', format: 'date-time', readOnly: true },
      updated_at: { type: 'string', format: 'date-time', readOnly: true },
    };
  }
}

// ============================================================================
// SYSTEM CONFIGURATION FACTORY
// ============================================================================

/**
 * Factory for creating system configuration mock data for environment and service settings
 */
export class SystemConfigFactory {
  /**
   * Creates complete system configuration
   */
  static createSystemConfig(overrides: any = {}) {
    return {
      platform: this.createPlatformConfig(overrides.platform),
      environment: this.createEnvironmentConfig(overrides.environment),
      database: this.createDatabaseConfig(overrides.database),
      security: this.createSecurityConfig(overrides.security),
      cors: this.createCorsConfig(overrides.cors),
      cache: this.createCacheConfig(overrides.cache),
      email: this.createEmailConfig(overrides.email),
      lookupKeys: this.createLookupKeys(overrides.lookupKeys),
      ...overrides,
    };
  }

  /**
   * Creates platform configuration
   */
  static createPlatformConfig(overrides: any = {}) {
    return {
      name: 'DreamFactory',
      version: '5.2.1',
      build: faker.date.recent({ days: 30 }).toISOString().split('T')[0].replace(/-/g, '.'),
      edition: faker.helpers.arrayElement(['Open Source', 'Silver', 'Gold']),
      license_key: overrides.license_key || faker.string.alphanumeric(32),
      host_os: faker.helpers.arrayElement(['Linux', 'Windows', 'macOS']),
      server_type: 'Apache/2.4.41',
      php_version: '8.2.15',
      database_driver: 'mysql',
      cache_driver: 'redis',
      queue_driver: 'database',
      ...overrides,
    };
  }

  /**
   * Creates environment configuration
   */
  static createEnvironmentConfig(overrides: any = {}) {
    return {
      app_name: 'DreamFactory Admin Interface',
      app_env: faker.helpers.arrayElement(['production', 'staging', 'development']),
      app_debug: faker.datatype.boolean({ probability: 0.2 }),
      app_url: faker.internet.url(),
      timezone: faker.location.timeZone(),
      locale: 'en',
      log_level: faker.helpers.arrayElement(['debug', 'info', 'warning', 'error']),
      log_max_files: faker.number.int({ min: 7, max: 90 }),
      session_driver: 'database',
      session_lifetime: faker.number.int({ min: 120, max: 1440 }),
      cache_default: 'redis',
      queue_default: 'database',
      ...overrides,
    };
  }

  /**
   * Creates database configuration
   */
  static createDatabaseConfig(overrides: any = {}) {
    return {
      default_connection: 'mysql',
      connections: {
        mysql: {
          driver: 'mysql',
          host: 'localhost',
          port: 3306,
          database: 'dreamfactory',
          username: 'df_admin',
          charset: 'utf8mb4',
          collation: 'utf8mb4_unicode_ci',
          prefix: 'df_',
          strict: true,
          engine: 'InnoDB',
        },
      },
      ...overrides,
    };
  }

  /**
   * Creates security configuration
   */
  static createSecurityConfig(overrides: any = {}) {
    return {
      jwt_ttl: faker.number.int({ min: 30, max: 120 }),
      jwt_refresh_ttl: faker.number.int({ min: 10080, max: 40320 }),
      jwt_algo: 'HS256',
      password_min_length: faker.number.int({ min: 6, max: 12 }),
      password_require_numbers: faker.datatype.boolean({ probability: 0.8 }),
      password_require_symbols: faker.datatype.boolean({ probability: 0.7 }),
      password_require_mixed_case: faker.datatype.boolean({ probability: 0.8 }),
      session_timeout: faker.number.int({ min: 30, max: 1440 }),
      max_login_attempts: faker.number.int({ min: 3, max: 10 }),
      lockout_duration: faker.number.int({ min: 300, max: 3600 }),
      two_factor_enabled: faker.datatype.boolean({ probability: 0.6 }),
      api_rate_limit: faker.number.int({ min: 100, max: 5000 }),
      api_rate_limit_window: faker.number.int({ min: 60, max: 300 }),
      ...overrides,
    };
  }

  /**
   * Creates CORS configuration
   */
  static createCorsConfig(overrides: any = {}) {
    return {
      enabled: faker.datatype.boolean({ probability: 0.9 }),
      allowed_origins: ['*'],
      allowed_methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowed_headers: ['*'],
      exposed_headers: ['X-Total-Count', 'X-Dreamfactory-Api-Version'],
      max_age: 86400,
      supports_credentials: faker.datatype.boolean({ probability: 0.7 }),
      ...overrides,
    };
  }

  /**
   * Creates cache configuration
   */
  static createCacheConfig(overrides: any = {}) {
    return {
      default: 'redis',
      stores: {
        redis: {
          driver: 'redis',
          host: 'localhost',
          port: 6379,
          database: 0,
          prefix: 'df_cache:',
        },
        file: {
          driver: 'file',
          path: '/storage/framework/cache/data',
        },
      },
      prefix: 'df',
      default_ttl: faker.number.int({ min: 300, max: 7200 }),
      ...overrides,
    };
  }

  /**
   * Creates email configuration
   */
  static createEmailConfig(overrides: any = {}) {
    return {
      default: 'smtp',
      mailers: {
        smtp: {
          transport: 'smtp',
          host: faker.internet.domainName(),
          port: faker.helpers.arrayElement([587, 465, 25]),
          encryption: faker.helpers.arrayElement(['tls', 'ssl']),
          username: faker.internet.email(),
          timeout: 30,
        },
      },
      from: {
        address: `noreply@${faker.internet.domainName()}`,
        name: 'DreamFactory Admin',
      },
      templates: this.createEmailTemplates(),
      ...overrides,
    };
  }

  /**
   * Creates lookup keys configuration
   */
  static createLookupKeys(overrides: any = {}) {
    return {
      global: {
        'app.name': 'DreamFactory Admin Interface',
        'app.description': 'Comprehensive REST API generation platform',
        'support.email': 'support@dreamfactory.com',
        'support.phone': '+1-800-555-0199',
        'company.name': 'DreamFactory Software Inc.',
        'company.website': 'https://www.dreamfactory.com',
      },
      user_defined: {
        'custom.brand_color': faker.color.rgb(),
        'custom.logo_url': faker.image.url(),
        'custom.footer_text': `© ${new Date().getFullYear()} DreamFactory Software Inc.`,
        'api.timeout': '30000',
        'ui.page_size': '25',
      },
      ...overrides,
    };
  }

  // Helper methods
  private static createEmailTemplates() {
    return {
      user_invite: {
        subject: 'Welcome to DreamFactory',
        content_type: 'text/html',
        body_text: 'Welcome to DreamFactory! Click here to activate your account: {activation_link}',
        body_html: '<h1>Welcome to DreamFactory!</h1><p>Click <a href="{activation_link}">here</a> to activate your account.</p>',
      },
      password_reset: {
        subject: 'Password Reset Request',
        content_type: 'text/html',
        body_text: 'Click here to reset your password: {reset_link}',
        body_html: '<h1>Password Reset</h1><p>Click <a href="{reset_link}">here</a> to reset your password.</p>',
      },
    };
  }
}

// ============================================================================
// EXPORT ALL FACTORIES
// ============================================================================

export const ComponentFactories = {
  DatabaseService: DatabaseServiceFactory,
  SchemaDiscovery: SchemaDiscoveryFactory,
  UserProfile: UserProfileFactory,
  FormValidation: FormValidationFactory,
  ApiEndpoint: ApiEndpointFactory,
  SystemConfig: SystemConfigFactory,
};

export default ComponentFactories;

// Export individual factories for convenience
export {
  DatabaseServiceFactory,
  SchemaDiscoveryFactory,
  UserProfileFactory,
  FormValidationFactory,
  ApiEndpointFactory,
  SystemConfigFactory,
};