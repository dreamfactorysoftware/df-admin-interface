/**
 * Configuration constants and default values for the API generation wizard.
 * 
 * Provides centralized configuration for the multi-step API generation workflow including:
 * - Wizard step definitions replacing Angular route-based navigation
 * - HTTP method configurations for comprehensive CRUD endpoint generation (F-003)
 * - Default endpoint parameters and validation rules
 * - React Query caching configuration for optimal wizard performance
 * - Virtual scrolling settings for handling 1000+ tables per Section 4.1 System Workflows
 * 
 * Supports React/Next.js Integration Requirements with SWR/React Query intelligent caching
 * and real-time validation under 100ms performance targets.
 */

import { 
  WizardStep, 
  HTTPMethod, 
  ParameterType, 
  FilterOperator, 
  GenerationStatus,
  FieldType,
  ReferentialAction
} from './types';

// ============================================================================
// Wizard Step Configuration - Replacing Angular Route-Based Navigation
// ============================================================================

/**
 * Wizard step definitions for API generation workflow
 * Replaces Angular router-based wizard navigation with React state management
 */
export const WIZARD_STEPS = {
  [WizardStep.TABLE_SELECTION]: {
    id: WizardStep.TABLE_SELECTION,
    title: 'Select Tables',
    description: 'Choose database tables for API generation',
    path: '/table-selection',
    stepNumber: 1,
    totalSteps: 4,
    allowBack: false,
    allowNext: true,
    requiresValidation: true,
    minSelectionRequired: 1,
    icon: 'table',
    estimatedDuration: '30 seconds'
  },
  [WizardStep.ENDPOINT_CONFIGURATION]: {
    id: WizardStep.ENDPOINT_CONFIGURATION,
    title: 'Configure Endpoints',
    description: 'Set up REST API endpoints and parameters',
    path: '/endpoint-configuration',
    stepNumber: 2,
    totalSteps: 4,
    allowBack: true,
    allowNext: true,
    requiresValidation: true,
    icon: 'cog',
    estimatedDuration: '2-3 minutes'
  },
  [WizardStep.GENERATION_PREVIEW]: {
    id: WizardStep.GENERATION_PREVIEW,
    title: 'Preview & Validate',
    description: 'Review generated OpenAPI specification',
    path: '/generation-preview',
    stepNumber: 3,
    totalSteps: 4,
    allowBack: true,
    allowNext: true,
    requiresValidation: false,
    icon: 'eye',
    estimatedDuration: '1 minute'
  },
  [WizardStep.GENERATION_PROGRESS]: {
    id: WizardStep.GENERATION_PROGRESS,
    title: 'Generate APIs',
    description: 'API endpoint generation in progress',
    path: '/generation-progress',
    stepNumber: 4,
    totalSteps: 4,
    allowBack: false,
    allowNext: false,
    requiresValidation: false,
    icon: 'loading',
    estimatedDuration: 'Under 5 minutes'
  }
} as const;

/**
 * Wizard navigation configuration constants
 */
export const WIZARD_NAVIGATION = {
  /** Animation duration for step transitions in milliseconds */
  TRANSITION_DURATION: 300,
  /** Auto-save interval for draft configurations in milliseconds */
  AUTO_SAVE_INTERVAL: 30000,
  /** Validation debounce delay in milliseconds */
  VALIDATION_DEBOUNCE: 500,
  /** Maximum time to wait for validation in milliseconds */
  VALIDATION_TIMEOUT: 5000,
  /** Enable wizard progress persistence across sessions */
  PERSIST_PROGRESS: true,
  /** Local storage key for wizard state persistence */
  STORAGE_KEY: 'df-wizard-state'
} as const;

// ============================================================================
// HTTP Method Configuration - F-003 REST API Endpoint Generation
// ============================================================================

/**
 * Default configurations for each HTTP method supporting comprehensive CRUD operations
 * Per F-003 REST API Endpoint Generation requirements in Section 2.1 Feature Catalog
 */
export const HTTP_METHOD_DEFAULTS = {
  [HTTPMethod.GET]: {
    enabled: true,
    description: 'Retrieve records from the table',
    operationId: 'get{TableName}',
    tags: ['read'],
    parameters: {
      query: {
        limit: {
          type: ParameterType.QUERY,
          dataType: FieldType.INTEGER,
          defaultValue: 25,
          minimum: 1,
          maximum: 1000,
          description: 'Maximum number of records to return'
        },
        offset: {
          type: ParameterType.QUERY,
          dataType: FieldType.INTEGER,
          defaultValue: 0,
          minimum: 0,
          description: 'Number of records to skip for pagination'
        },
        filter: {
          type: ParameterType.QUERY,
          dataType: FieldType.STRING,
          description: 'SQL WHERE clause filter conditions'
        },
        order: {
          type: ParameterType.QUERY,
          dataType: FieldType.STRING,
          description: 'SQL ORDER BY clause for sorting'
        },
        group: {
          type: ParameterType.QUERY,
          dataType: FieldType.STRING,
          description: 'SQL GROUP BY clause for aggregation'
        },
        having: {
          type: ParameterType.QUERY,
          dataType: FieldType.STRING,
          description: 'SQL HAVING clause for group filtering'
        },
        fields: {
          type: ParameterType.QUERY,
          dataType: FieldType.STRING,
          description: 'Comma-separated list of fields to return'
        },
        include_count: {
          type: ParameterType.QUERY,
          dataType: FieldType.BOOLEAN,
          defaultValue: false,
          description: 'Include total record count in response'
        }
      }
    },
    responses: {
      '200': {
        description: 'Successful response with records',
        schema: {
          type: 'object',
          properties: {
            resource: {
              type: 'array',
              items: { $ref: '#/components/schemas/{TableName}' }
            },
            meta: {
              type: 'object',
              properties: {
                count: { type: 'integer' },
                offset: { type: 'integer' },
                limit: { type: 'integer' }
              }
            }
          }
        }
      }
    },
    security: {
      requireAuth: true,
      requiredRoles: ['read'],
      rateLimiting: {
        requestsPerMinute: 60,
        requestsPerHour: 1000,
        requestsPerDay: 10000,
        burstAllowance: 10
      }
    }
  },
  [HTTPMethod.POST]: {
    enabled: true,
    description: 'Create new records in the table',
    operationId: 'create{TableName}',
    tags: ['create'],
    parameters: {
      body: {
        type: ParameterType.BODY,
        dataType: FieldType.JSON,
        description: 'Record data to create',
        required: true,
        schema: { $ref: '#/components/schemas/{TableName}Create' }
      },
      query: {
        fields: {
          type: ParameterType.QUERY,
          dataType: FieldType.STRING,
          description: 'Comma-separated list of fields to return'
        },
        continue: {
          type: ParameterType.QUERY,
          dataType: FieldType.BOOLEAN,
          defaultValue: false,
          description: 'Continue processing on validation errors'
        }
      }
    },
    responses: {
      '201': {
        description: 'Record created successfully',
        schema: {
          type: 'object',
          properties: {
            resource: {
              type: 'array',
              items: { $ref: '#/components/schemas/{TableName}' }
            }
          }
        }
      }
    },
    security: {
      requireAuth: true,
      requiredRoles: ['create'],
      rateLimiting: {
        requestsPerMinute: 30,
        requestsPerHour: 500,
        requestsPerDay: 2000,
        burstAllowance: 5
      }
    }
  },
  [HTTPMethod.PUT]: {
    enabled: true,
    description: 'Update or replace records in the table',
    operationId: 'update{TableName}',
    tags: ['update'],
    parameters: {
      path: {
        id: {
          type: ParameterType.PATH,
          dataType: FieldType.STRING,
          required: true,
          description: 'Record identifier for update'
        }
      },
      body: {
        type: ParameterType.BODY,
        dataType: FieldType.JSON,
        description: 'Complete record data for replacement',
        required: true,
        schema: { $ref: '#/components/schemas/{TableName}Update' }
      },
      query: {
        fields: {
          type: ParameterType.QUERY,
          dataType: FieldType.STRING,
          description: 'Comma-separated list of fields to return'
        }
      }
    },
    responses: {
      '200': {
        description: 'Record updated successfully',
        schema: {
          type: 'object',
          properties: {
            resource: {
              type: 'array',
              items: { $ref: '#/components/schemas/{TableName}' }
            }
          }
        }
      }
    },
    security: {
      requireAuth: true,
      requiredRoles: ['update'],
      rateLimiting: {
        requestsPerMinute: 30,
        requestsPerHour: 500,
        requestsPerDay: 2000,
        burstAllowance: 5
      }
    }
  },
  [HTTPMethod.PATCH]: {
    enabled: true,
    description: 'Partially update records in the table',
    operationId: 'patch{TableName}',
    tags: ['update'],
    parameters: {
      path: {
        id: {
          type: ParameterType.PATH,
          dataType: FieldType.STRING,
          required: true,
          description: 'Record identifier for partial update'
        }
      },
      body: {
        type: ParameterType.BODY,
        dataType: FieldType.JSON,
        description: 'Partial record data for update',
        required: true,
        schema: { $ref: '#/components/schemas/{TableName}Patch' }
      },
      query: {
        fields: {
          type: ParameterType.QUERY,
          dataType: FieldType.STRING,
          description: 'Comma-separated list of fields to return'
        }
      }
    },
    responses: {
      '200': {
        description: 'Record patched successfully',
        schema: {
          type: 'object',
          properties: {
            resource: {
              type: 'array',
              items: { $ref: '#/components/schemas/{TableName}' }
            }
          }
        }
      }
    },
    security: {
      requireAuth: true,
      requiredRoles: ['update'],
      rateLimiting: {
        requestsPerMinute: 30,
        requestsPerHour: 500,
        requestsPerDay: 2000,
        burstAllowance: 5
      }
    }
  },
  [HTTPMethod.DELETE]: {
    enabled: false, // Disabled by default for safety
    description: 'Delete records from the table',
    operationId: 'delete{TableName}',
    tags: ['delete'],
    parameters: {
      path: {
        id: {
          type: ParameterType.PATH,
          dataType: FieldType.STRING,
          required: true,
          description: 'Record identifier for deletion'
        }
      },
      query: {
        force: {
          type: ParameterType.QUERY,
          dataType: FieldType.BOOLEAN,
          defaultValue: false,
          description: 'Force deletion ignoring referential constraints'
        }
      }
    },
    responses: {
      '200': {
        description: 'Record deleted successfully',
        schema: {
          type: 'object',
          properties: {
            resource: {
              type: 'array',
              items: { $ref: '#/components/schemas/{TableName}' }
            }
          }
        }
      }
    },
    security: {
      requireAuth: true,
      requiredRoles: ['delete', 'admin'],
      rateLimiting: {
        requestsPerMinute: 10,
        requestsPerHour: 100,
        requestsPerDay: 500,
        burstAllowance: 2
      }
    }
  }
} as const;

/**
 * HTTP method enablement defaults - conservative security approach
 */
export const DEFAULT_ENABLED_METHODS = [
  HTTPMethod.GET,
  HTTPMethod.POST,
  HTTPMethod.PUT,
  HTTPMethod.PATCH
] as const;

/**
 * HTTP method priority order for UI display
 */
export const METHOD_DISPLAY_ORDER = [
  HTTPMethod.GET,
  HTTPMethod.POST,
  HTTPMethod.PUT,
  HTTPMethod.PATCH,
  HTTPMethod.DELETE
] as const;

// ============================================================================
// Default Endpoint Configuration Parameters
// ============================================================================

/**
 * Default endpoint configuration values for new table APIs
 */
export const DEFAULT_ENDPOINT_CONFIG = {
  /** Enable API endpoint by default */
  enabled: true,
  /** Default base path pattern */
  basePathPattern: '/api/{serviceName}/{tableName}',
  /** Enable pagination by default */
  paginationEnabled: true,
  /** Default page size limit */
  defaultPageSize: 25,
  /** Maximum allowed page size */
  maxPageSize: 1000,
  /** Enable filtering by default */
  filteringEnabled: true,
  /** Enable sorting by default */
  sortingEnabled: true,
  /** Enable field selection by default */
  fieldSelectionEnabled: true,
  /** Include metadata in responses by default */
  includeMetadata: true,
  /** Default response format */
  responseFormat: 'application/json',
  /** Request timeout in milliseconds */
  requestTimeout: 30000,
  /** Enable request caching */
  cachingEnabled: true,
  /** Default cache TTL in seconds */
  cacheTTL: 300
} as const;

/**
 * Standard query parameter configurations
 */
export const STANDARD_QUERY_PARAMETERS = {
  limit: {
    name: 'limit',
    type: ParameterType.QUERY,
    dataType: FieldType.INTEGER,
    required: false,
    description: 'Maximum number of records to return',
    defaultValue: 25,
    minimum: 1,
    maximum: 1000
  },
  offset: {
    name: 'offset',
    type: ParameterType.QUERY,
    dataType: FieldType.INTEGER,
    required: false,
    description: 'Number of records to skip for pagination',
    defaultValue: 0,
    minimum: 0
  },
  filter: {
    name: 'filter',
    type: ParameterType.QUERY,
    dataType: FieldType.STRING,
    required: false,
    description: 'SQL WHERE clause filter conditions'
  },
  order: {
    name: 'order',
    type: ParameterType.QUERY,
    dataType: FieldType.STRING,
    required: false,
    description: 'SQL ORDER BY clause for sorting'
  },
  fields: {
    name: 'fields',
    type: ParameterType.QUERY,
    dataType: FieldType.STRING,
    required: false,
    description: 'Comma-separated list of fields to return'
  },
  include_count: {
    name: 'include_count',
    type: ParameterType.QUERY,
    dataType: FieldType.BOOLEAN,
    required: false,
    description: 'Include total record count in response',
    defaultValue: false
  }
} as const;

// ============================================================================
// Validation Rules and Constraints
// ============================================================================

/**
 * Validation rule constants for wizard form validation
 * Integrates with React Hook Form and Zod schema validators per React/Next.js Integration Requirements
 */
export const VALIDATION_RULES = {
  /** Table selection validation */
  tableSelection: {
    minTablesRequired: 1,
    maxTablesAllowed: 50,
    maxTableNameLength: 64
  },
  /** Endpoint configuration validation */
  endpointConfiguration: {
    minMethodsRequired: 1,
    maxMethodsAllowed: 5,
    basePathPattern: /^\/[a-zA-Z0-9_\-\/{}]+$/,
    maxBasePathLength: 255,
    maxDescriptionLength: 500,
    maxTagLength: 50,
    maxTagsPerEndpoint: 10
  },
  /** Parameter validation */
  parameters: {
    namePattern: /^[a-zA-Z][a-zA-Z0-9_]*$/,
    maxNameLength: 64,
    maxDescriptionLength: 255,
    maxDefaultValueLength: 255,
    maxPatternLength: 255
  },
  /** Security configuration validation */
  security: {
    maxRoleNameLength: 64,
    maxApiKeyLength: 128,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    maxRolesPerEndpoint: 20
  },
  /** Rate limiting validation */
  rateLimiting: {
    minRequestsPerMinute: 1,
    maxRequestsPerMinute: 1000,
    minRequestsPerHour: 1,
    maxRequestsPerHour: 100000,
    minRequestsPerDay: 1,
    maxRequestsPerDay: 1000000,
    maxBurstAllowance: 100
  }
} as const;

/**
 * Validation error messages for consistent user feedback
 */
export const VALIDATION_MESSAGES = {
  required: 'This field is required',
  invalidFormat: 'Invalid format',
  tooShort: 'Value is too short',
  tooLong: 'Value is too long',
  invalidPattern: 'Value does not match required pattern',
  outOfRange: 'Value is out of allowed range',
  duplicateValue: 'Duplicate value detected',
  invalidSelection: 'Invalid selection',
  noTablesSelected: 'At least one table must be selected',
  noMethodsEnabled: 'At least one HTTP method must be enabled',
  invalidBasePath: 'Base path must start with / and contain only valid characters',
  invalidParameterName: 'Parameter name must start with a letter and contain only letters, numbers, and underscores'
} as const;

// ============================================================================
// React Query Configuration - Caching Optimization
// ============================================================================

/**
 * React Query configuration constants for optimal wizard performance
 * Supports cache hit responses under 50ms per React/Next.js Integration Requirements
 */
export const REACT_QUERY_CONFIG = {
  /** Default query options for wizard data fetching */
  defaultOptions: {
    queries: {
      /** Cache data for 5 minutes */
      staleTime: 5 * 60 * 1000,
      /** Keep data in cache for 10 minutes */
      cacheTime: 10 * 60 * 1000,
      /** Retry failed requests 3 times with exponential backoff */
      retry: 3,
      /** Retry delay function for exponential backoff */
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
      /** Refetch on window focus */
      refetchOnWindowFocus: false,
      /** Refetch on reconnect */
      refetchOnReconnect: true,
      /** Refetch on mount if data is stale */
      refetchOnMount: true
    },
    mutations: {
      /** Retry failed mutations once */
      retry: 1,
      /** Retry delay for mutations */
      retryDelay: 1000
    }
  },
  /** Query keys for consistent caching */
  queryKeys: {
    /** Database tables for a service */
    databaseTables: (serviceName: string) => ['database-tables', serviceName] as const,
    /** Table schema details */
    tableSchema: (serviceName: string, tableName: string) => ['table-schema', serviceName, tableName] as const,
    /** Service types for connection creation */
    serviceTypes: () => ['service-types'] as const,
    /** OpenAPI preview for endpoint configuration */
    openApiPreview: (serviceName: string, config: any) => ['openapi-preview', serviceName, config] as const,
    /** Generation progress */
    generationProgress: (jobId: string) => ['generation-progress', jobId] as const
  },
  /** Mutation keys for optimistic updates */
  mutationKeys: {
    /** Create service configuration */
    createService: () => ['create-service'] as const,
    /** Update endpoint configuration */
    updateEndpointConfig: () => ['update-endpoint-config'] as const,
    /** Generate API endpoints */
    generateApis: () => ['generate-apis'] as const
  },
  /** Background refetch intervals */
  refetchIntervals: {
    /** Generation progress polling interval in milliseconds */
    generationProgress: 1000,
    /** Service status check interval in milliseconds */
    serviceStatus: 30000,
    /** Schema refresh interval in milliseconds */
    schemaRefresh: 5 * 60 * 1000
  }
} as const;

// ============================================================================
// Virtual Scrolling Configuration - Large Dataset Support
// ============================================================================

/**
 * Virtual scrolling configuration for handling 1000+ tables
 * Per F-002 requirements in Section 2.1 Feature Catalog and Section 4.1 System Workflows
 */
export const VIRTUAL_SCROLL_CONFIG = {
  /** Default configuration for table selection lists */
  tableSelection: {
    /** Render 20 items above and below visible area */
    overscan: 20,
    /** Fixed item height in pixels */
    itemHeight: 48,
    /** Container height in pixels */
    containerHeight: 400,
    /** Enable virtual scrolling for lists with more than this many items */
    enableThreshold: 100,
    /** Scroll behavior */
    scrollBehavior: 'smooth' as const,
    /** Estimated item size for dynamic sizing */
    estimateSize: () => 48
  },
  /** Configuration for schema tree view */
  schemaTree: {
    /** Render 15 items above and below visible area */
    overscan: 15,
    /** Base item height for tree nodes */
    itemHeight: 32,
    /** Nested item indent in pixels */
    indentSize: 20,
    /** Container height in pixels */
    containerHeight: 500,
    /** Enable for trees with more than this many nodes */
    enableThreshold: 50,
    /** Maximum nesting depth to render */
    maxDepth: 10
  },
  /** Configuration for field lists */
  fieldList: {
    /** Render 25 items above and below visible area */
    overscan: 25,
    /** Field item height */
    itemHeight: 40,
    /** Container height in pixels */
    containerHeight: 300,
    /** Enable for lists with more than this many fields */
    enableThreshold: 75
  }
} as const;

// ============================================================================
// Security Configuration Defaults
// ============================================================================

/**
 * Default security configurations for generated APIs
 * Supports Next.js middleware-based authentication per React/Next.js Integration Requirements
 */
export const DEFAULT_SECURITY_CONFIG = {
  /** Authentication requirements */
  authentication: {
    /** Require authentication by default */
    requireAuth: true,
    /** Default authentication methods */
    methods: ['session_token', 'api_key'],
    /** Session timeout in seconds */
    sessionTimeout: 3600,
    /** API key timeout in seconds */
    apiKeyTimeout: 86400
  },
  /** Default roles and permissions */
  authorization: {
    /** Default roles for read operations */
    readRoles: ['user', 'admin'],
    /** Default roles for create operations */
    createRoles: ['admin'],
    /** Default roles for update operations */
    updateRoles: ['admin'],
    /** Default roles for delete operations */
    deleteRoles: ['admin'],
    /** Enable role inheritance */
    roleInheritance: true
  },
  /** CORS configuration defaults */
  cors: {
    /** Default allowed origins */
    allowedOrigins: ['*'],
    /** Default allowed methods */
    allowedMethods: [HTTPMethod.GET, HTTPMethod.POST, HTTPMethod.PUT, HTTPMethod.PATCH],
    /** Default allowed headers */
    allowedHeaders: ['Content-Type', 'Authorization', 'X-DreamFactory-Session-Token'],
    /** Allow credentials by default */
    allowCredentials: true,
    /** Preflight cache duration in seconds */
    maxAge: 86400
  },
  /** Rate limiting defaults */
  rateLimiting: {
    /** Default requests per minute */
    requestsPerMinute: 60,
    /** Default requests per hour */
    requestsPerHour: 1000,
    /** Default requests per day */
    requestsPerDay: 10000,
    /** Default burst allowance */
    burstAllowance: 10,
    /** Enable rate limiting by default */
    enabled: true
  }
} as const;

// ============================================================================
// OpenAPI Generation Configuration
// ============================================================================

/**
 * OpenAPI specification generation settings
 * Supports real-time preview with Next.js serverless functions per F-003 requirements
 */
export const OPENAPI_CONFIG = {
  /** OpenAPI specification version */
  version: '3.0.3',
  /** Default API information */
  defaultInfo: {
    version: '1.0.0',
    title: 'Generated Database API',
    description: 'Automatically generated REST API for database operations',
    contact: {
      name: 'DreamFactory Support',
      url: 'https://www.dreamfactory.com/support',
      email: 'support@dreamfactory.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  /** Server configuration */
  servers: [
    {
      url: '/api/v2',
      description: 'DreamFactory API Server'
    }
  ],
  /** Security schemes */
  securitySchemes: {
    session_token: {
      type: 'apiKey',
      name: 'X-DreamFactory-Session-Token',
      in: 'header',
      description: 'Session token for authenticated requests'
    },
    api_key: {
      type: 'apiKey',
      name: 'X-DreamFactory-API-Key',
      in: 'header',
      description: 'API key for application access'
    }
  },
  /** Default tags */
  defaultTags: [
    {
      name: 'read',
      description: 'Read operations for retrieving data'
    },
    {
      name: 'create',
      description: 'Create operations for adding new data'
    },
    {
      name: 'update',
      description: 'Update operations for modifying existing data'
    },
    {
      name: 'delete',
      description: 'Delete operations for removing data'
    }
  ],
  /** Generation options */
  generation: {
    /** Include examples in the specification */
    includeExamples: true,
    /** Include response schemas */
    includeResponseSchemas: true,
    /** Include request schemas */
    includeRequestSchemas: true,
    /** Include parameter validation */
    includeValidation: true,
    /** Include security definitions */
    includeSecurity: true,
    /** Include deprecated endpoint warnings */
    includeDeprecated: false,
    /** Maximum schema depth to prevent circular references */
    maxSchemaDepth: 10
  }
} as const;

// ============================================================================
// Generation Progress and Status Configuration
// ============================================================================

/**
 * Configuration for API generation progress tracking
 * Supports the generation progress step of the wizard workflow
 */
export const GENERATION_PROGRESS_CONFIG = {
  /** Progress polling configuration */
  polling: {
    /** Polling interval in milliseconds */
    interval: 1000,
    /** Maximum polling duration in milliseconds */
    maxDuration: 300000, // 5 minutes
    /** Exponential backoff multiplier */
    backoffMultiplier: 1.1,
    /** Maximum polling interval in milliseconds */
    maxInterval: 5000
  },
  /** Progress stages and their weight percentages */
  stages: {
    [GenerationStatus.CONFIGURING]: {
      weight: 10,
      message: 'Validating configuration...',
      estimatedDuration: 5000
    },
    [GenerationStatus.VALIDATING]: {
      weight: 20,
      message: 'Validating database schema...',
      estimatedDuration: 10000
    },
    [GenerationStatus.GENERATING]: {
      weight: 60,
      message: 'Generating API endpoints...',
      estimatedDuration: 30000
    },
    [GenerationStatus.COMPLETED]: {
      weight: 10,
      message: 'Finalizing documentation...',
      estimatedDuration: 5000
    }
  },
  /** Status messages for different states */
  statusMessages: {
    [GenerationStatus.IDLE]: 'Ready to generate APIs',
    [GenerationStatus.CONFIGURING]: 'Preparing API configuration',
    [GenerationStatus.VALIDATING]: 'Validating database connectivity and schema',
    [GenerationStatus.GENERATING]: 'Creating REST API endpoints',
    [GenerationStatus.COMPLETED]: 'API generation completed successfully',
    [GenerationStatus.ERROR]: 'An error occurred during API generation'
  }
} as const;

// ============================================================================
// Field Type Mapping and Defaults
// ============================================================================

/**
 * Default configurations for different database field types
 * Used for automatic parameter type inference and validation
 */
export const FIELD_TYPE_DEFAULTS = {
  [FieldType.STRING]: {
    openApiType: 'string',
    format: undefined,
    defaultValidation: {
      maxLength: 255
    }
  },
  [FieldType.INTEGER]: {
    openApiType: 'integer',
    format: 'int32',
    defaultValidation: {
      minimum: -2147483648,
      maximum: 2147483647
    }
  },
  [FieldType.BIGINT]: {
    openApiType: 'integer',
    format: 'int64',
    defaultValidation: {
      minimum: -9223372036854775808,
      maximum: 9223372036854775807
    }
  },
  [FieldType.DECIMAL]: {
    openApiType: 'number',
    format: 'decimal',
    defaultValidation: {}
  },
  [FieldType.FLOAT]: {
    openApiType: 'number',
    format: 'float',
    defaultValidation: {}
  },
  [FieldType.DOUBLE]: {
    openApiType: 'number',
    format: 'double',
    defaultValidation: {}
  },
  [FieldType.BOOLEAN]: {
    openApiType: 'boolean',
    format: undefined,
    defaultValidation: {}
  },
  [FieldType.DATE]: {
    openApiType: 'string',
    format: 'date',
    defaultValidation: {}
  },
  [FieldType.DATETIME]: {
    openApiType: 'string',
    format: 'date-time',
    defaultValidation: {}
  },
  [FieldType.TIMESTAMP]: {
    openApiType: 'string',
    format: 'date-time',
    defaultValidation: {}
  },
  [FieldType.TIME]: {
    openApiType: 'string',
    format: 'time',
    defaultValidation: {}
  },
  [FieldType.TEXT]: {
    openApiType: 'string',
    format: undefined,
    defaultValidation: {
      maxLength: 65535
    }
  },
  [FieldType.JSON]: {
    openApiType: 'object',
    format: undefined,
    defaultValidation: {}
  },
  [FieldType.BINARY]: {
    openApiType: 'string',
    format: 'binary',
    defaultValidation: {}
  },
  [FieldType.UUID]: {
    openApiType: 'string',
    format: 'uuid',
    defaultValidation: {
      pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    }
  }
} as const;

// ============================================================================
// Filter Operator Configurations
// ============================================================================

/**
 * Configuration for filter operators supported in API endpoints
 * Enables flexible query capabilities for generated APIs
 */
export const FILTER_OPERATOR_CONFIG = {
  [FilterOperator.EQUALS]: {
    symbol: '=',
    description: 'Equals',
    sqlOperator: '=',
    supportedTypes: [FieldType.STRING, FieldType.INTEGER, FieldType.BIGINT, FieldType.DECIMAL, FieldType.FLOAT, FieldType.DOUBLE, FieldType.BOOLEAN, FieldType.DATE, FieldType.DATETIME, FieldType.TIMESTAMP, FieldType.UUID]
  },
  [FilterOperator.NOT_EQUALS]: {
    symbol: '!=',
    description: 'Not equals',
    sqlOperator: '!=',
    supportedTypes: [FieldType.STRING, FieldType.INTEGER, FieldType.BIGINT, FieldType.DECIMAL, FieldType.FLOAT, FieldType.DOUBLE, FieldType.BOOLEAN, FieldType.DATE, FieldType.DATETIME, FieldType.TIMESTAMP, FieldType.UUID]
  },
  [FilterOperator.CONTAINS]: {
    symbol: 'contains',
    description: 'Contains',
    sqlOperator: 'LIKE',
    supportedTypes: [FieldType.STRING, FieldType.TEXT]
  },
  [FilterOperator.STARTS_WITH]: {
    symbol: 'starts_with',
    description: 'Starts with',
    sqlOperator: 'LIKE',
    supportedTypes: [FieldType.STRING, FieldType.TEXT]
  },
  [FilterOperator.ENDS_WITH]: {
    symbol: 'ends_with',
    description: 'Ends with',
    sqlOperator: 'LIKE',
    supportedTypes: [FieldType.STRING, FieldType.TEXT]
  },
  [FilterOperator.GREATER_THAN]: {
    symbol: '>',
    description: 'Greater than',
    sqlOperator: '>',
    supportedTypes: [FieldType.INTEGER, FieldType.BIGINT, FieldType.DECIMAL, FieldType.FLOAT, FieldType.DOUBLE, FieldType.DATE, FieldType.DATETIME, FieldType.TIMESTAMP]
  },
  [FilterOperator.LESS_THAN]: {
    symbol: '<',
    description: 'Less than',
    sqlOperator: '<',
    supportedTypes: [FieldType.INTEGER, FieldType.BIGINT, FieldType.DECIMAL, FieldType.FLOAT, FieldType.DOUBLE, FieldType.DATE, FieldType.DATETIME, FieldType.TIMESTAMP]
  },
  [FilterOperator.GREATER_EQUAL]: {
    symbol: '>=',
    description: 'Greater than or equal',
    sqlOperator: '>=',
    supportedTypes: [FieldType.INTEGER, FieldType.BIGINT, FieldType.DECIMAL, FieldType.FLOAT, FieldType.DOUBLE, FieldType.DATE, FieldType.DATETIME, FieldType.TIMESTAMP]
  },
  [FilterOperator.LESS_EQUAL]: {
    symbol: '<=',
    description: 'Less than or equal',
    sqlOperator: '<=',
    supportedTypes: [FieldType.INTEGER, FieldType.BIGINT, FieldType.DECIMAL, FieldType.FLOAT, FieldType.DOUBLE, FieldType.DATE, FieldType.DATETIME, FieldType.TIMESTAMP]
  },
  [FilterOperator.IN]: {
    symbol: 'in',
    description: 'In list',
    sqlOperator: 'IN',
    supportedTypes: [FieldType.STRING, FieldType.INTEGER, FieldType.BIGINT, FieldType.UUID]
  },
  [FilterOperator.NOT_IN]: {
    symbol: 'not_in',
    description: 'Not in list',
    sqlOperator: 'NOT IN',
    supportedTypes: [FieldType.STRING, FieldType.INTEGER, FieldType.BIGINT, FieldType.UUID]
  },
  [FilterOperator.IS_NULL]: {
    symbol: 'is_null',
    description: 'Is null',
    sqlOperator: 'IS NULL',
    supportedTypes: [FieldType.STRING, FieldType.INTEGER, FieldType.BIGINT, FieldType.DECIMAL, FieldType.FLOAT, FieldType.DOUBLE, FieldType.BOOLEAN, FieldType.DATE, FieldType.DATETIME, FieldType.TIMESTAMP, FieldType.TEXT, FieldType.JSON, FieldType.UUID]
  },
  [FilterOperator.IS_NOT_NULL]: {
    symbol: 'is_not_null',
    description: 'Is not null',
    sqlOperator: 'IS NOT NULL',
    supportedTypes: [FieldType.STRING, FieldType.INTEGER, FieldType.BIGINT, FieldType.DECIMAL, FieldType.FLOAT, FieldType.DOUBLE, FieldType.BOOLEAN, FieldType.DATE, FieldType.DATETIME, FieldType.TIMESTAMP, FieldType.TEXT, FieldType.JSON, FieldType.UUID]
  }
} as const;

// ============================================================================
// Performance and Optimization Constants
// ============================================================================

/**
 * Performance optimization constants for wizard components
 * Ensures real-time validation under 100ms per React/Next.js Integration Requirements
 */
export const PERFORMANCE_CONFIG = {
  /** Debounce delays for various operations */
  debounce: {
    /** Search input debounce in milliseconds */
    search: 300,
    /** Form validation debounce in milliseconds */
    validation: 500,
    /** Auto-save debounce in milliseconds */
    autoSave: 2000,
    /** API preview generation debounce in milliseconds */
    preview: 1000
  },
  /** Throttle limits for API calls */
  throttle: {
    /** Connection test throttle in milliseconds */
    connectionTest: 5000,
    /** Schema refresh throttle in milliseconds */
    schemaRefresh: 10000,
    /** Preview generation throttle in milliseconds */
    previewGeneration: 3000
  },
  /** Timeout values */
  timeouts: {
    /** Connection test timeout in milliseconds */
    connectionTest: 10000,
    /** Schema discovery timeout in milliseconds */
    schemaDiscovery: 30000,
    /** API generation timeout in milliseconds */
    apiGeneration: 300000,
    /** Preview generation timeout in milliseconds */
    previewGeneration: 15000
  },
  /** Batch processing limits */
  batching: {
    /** Maximum tables to process in a single batch */
    maxTablesPerBatch: 10,
    /** Maximum fields to process in a single batch */
    maxFieldsPerBatch: 100,
    /** Batch processing delay in milliseconds */
    batchDelay: 100
  }
} as const;

// Export all constants as a single object for convenience
export default {
  WIZARD_STEPS,
  WIZARD_NAVIGATION,
  HTTP_METHOD_DEFAULTS,
  DEFAULT_ENABLED_METHODS,
  METHOD_DISPLAY_ORDER,
  DEFAULT_ENDPOINT_CONFIG,
  STANDARD_QUERY_PARAMETERS,
  VALIDATION_RULES,
  VALIDATION_MESSAGES,
  REACT_QUERY_CONFIG,
  VIRTUAL_SCROLL_CONFIG,
  DEFAULT_SECURITY_CONFIG,
  OPENAPI_CONFIG,
  GENERATION_PROGRESS_CONFIG,
  FIELD_TYPE_DEFAULTS,
  FILTER_OPERATOR_CONFIG,
  PERFORMANCE_CONFIG
} as const;