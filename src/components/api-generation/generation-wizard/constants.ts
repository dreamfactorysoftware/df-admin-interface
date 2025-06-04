/**
 * @fileoverview Constants for the API Generation Wizard
 * 
 * Provides centralized configuration constants for the multi-step API generation 
 * workflow including wizard step definitions, HTTP method configurations, endpoint 
 * parameter defaults, and validation rules. Supports React Hook Form validation 
 * and React Query caching optimization.
 * 
 * @module GenerationWizardConstants
 * @version 1.0.0
 */

// ============================================================================
// WIZARD STEP CONFIGURATION
// ============================================================================

/**
 * Wizard step identifiers for the API generation process
 * Replaces Angular route-based wizard navigation with React state-based flow
 */
export const WIZARD_STEPS = {
  TABLE_SELECTION: 'table-selection',
  METHOD_CONFIGURATION: 'method-configuration', 
  PARAMETER_CONFIGURATION: 'parameter-configuration',
  SECURITY_CONFIGURATION: 'security-configuration',
  PREVIEW_GENERATION: 'preview-generation',
  COMPLETION: 'completion'
} as const;

/**
 * Wizard step metadata configuration for navigation and validation
 * Supports React Hook Form multi-step validation workflow
 */
export const WIZARD_STEP_CONFIG = {
  [WIZARD_STEPS.TABLE_SELECTION]: {
    id: WIZARD_STEPS.TABLE_SELECTION,
    title: 'Select Tables',
    description: 'Choose database tables for API generation',
    order: 1,
    isRequired: true,
    validationFields: ['selectedTables'],
    nextStep: WIZARD_STEPS.METHOD_CONFIGURATION,
    prevStep: null,
  },
  [WIZARD_STEPS.METHOD_CONFIGURATION]: {
    id: WIZARD_STEPS.METHOD_CONFIGURATION,
    title: 'Configure HTTP Methods',
    description: 'Select and configure CRUD operations for each endpoint',
    order: 2,
    isRequired: true,
    validationFields: ['httpMethods'],
    nextStep: WIZARD_STEPS.PARAMETER_CONFIGURATION,
    prevStep: WIZARD_STEPS.TABLE_SELECTION,
  },
  [WIZARD_STEPS.PARAMETER_CONFIGURATION]: {
    id: WIZARD_STEPS.PARAMETER_CONFIGURATION,
    title: 'Configure Parameters',
    description: 'Set up endpoint parameters, filters, and pagination',
    order: 3,
    isRequired: false,
    validationFields: ['parameters', 'filters', 'pagination'],
    nextStep: WIZARD_STEPS.SECURITY_CONFIGURATION,
    prevStep: WIZARD_STEPS.METHOD_CONFIGURATION,
  },
  [WIZARD_STEPS.SECURITY_CONFIGURATION]: {
    id: WIZARD_STEPS.SECURITY_CONFIGURATION,
    title: 'Configure Security',
    description: 'Set up authentication and authorization rules',
    order: 4,
    isRequired: false,
    validationFields: ['securityRules', 'accessControls'],
    nextStep: WIZARD_STEPS.PREVIEW_GENERATION,
    prevStep: WIZARD_STEPS.PARAMETER_CONFIGURATION,
  },
  [WIZARD_STEPS.PREVIEW_GENERATION]: {
    id: WIZARD_STEPS.PREVIEW_GENERATION,
    title: 'Preview & Generate',
    description: 'Review configuration and generate OpenAPI specification',
    order: 5,
    isRequired: true,
    validationFields: ['finalConfiguration'],
    nextStep: WIZARD_STEPS.COMPLETION,
    prevStep: WIZARD_STEPS.SECURITY_CONFIGURATION,
  },
  [WIZARD_STEPS.COMPLETION]: {
    id: WIZARD_STEPS.COMPLETION,
    title: 'Complete',
    description: 'API generation successful',
    order: 6,
    isRequired: false,
    validationFields: [],
    nextStep: null,
    prevStep: WIZARD_STEPS.PREVIEW_GENERATION,
  },
} as const;

/**
 * Total number of wizard steps for progress calculation
 */
export const WIZARD_STEP_COUNT = Object.keys(WIZARD_STEP_CONFIG).length;

// ============================================================================
// HTTP METHOD CONFIGURATION
// ============================================================================

/**
 * HTTP methods supported for CRUD endpoint generation
 * Per F-003 REST API Endpoint Generation requirements
 */
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST', 
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE'
} as const;

/**
 * HTTP method configuration with CRUD operation mapping
 * Supports comprehensive REST API endpoint generation
 */
export const HTTP_METHOD_CONFIG = {
  [HTTP_METHODS.GET]: {
    method: HTTP_METHODS.GET,
    operation: 'READ',
    description: 'Retrieve records from the table',
    supportsPagination: true,
    supportsFiltering: true,
    supportsSorting: true,
    supportsFieldSelection: true,
    supportsRelatedData: true,
    isEnabledByDefault: true,
    endpoints: {
      collection: '/{tableName}',
      single: '/{tableName}/{id}',
      related: '/{tableName}/{id}/{relation}'
    }
  },
  [HTTP_METHODS.POST]: {
    method: HTTP_METHODS.POST,
    operation: 'CREATE',
    description: 'Create new records in the table',
    supportsPagination: false,
    supportsFiltering: false,
    supportsSorting: false,
    supportsFieldSelection: true,
    supportsRelatedData: true,
    isEnabledByDefault: true,
    endpoints: {
      collection: '/{tableName}',
      single: null,
      related: '/{tableName}/{id}/{relation}'
    }
  },
  [HTTP_METHODS.PUT]: {
    method: HTTP_METHODS.PUT,
    operation: 'UPDATE',
    description: 'Replace entire records in the table',
    supportsPagination: false,
    supportsFiltering: true,
    supportsSorting: false,
    supportsFieldSelection: true,
    supportsRelatedData: true,
    isEnabledByDefault: true,
    endpoints: {
      collection: '/{tableName}',
      single: '/{tableName}/{id}',
      related: '/{tableName}/{id}/{relation}'
    }
  },
  [HTTP_METHODS.PATCH]: {
    method: HTTP_METHODS.PATCH,
    operation: 'PARTIAL_UPDATE',
    description: 'Partially update records in the table',
    supportsPagination: false,
    supportsFiltering: true,
    supportsSorting: false,
    supportsFieldSelection: true,
    supportsRelatedData: true,
    isEnabledByDefault: false,
    endpoints: {
      collection: '/{tableName}',
      single: '/{tableName}/{id}',
      related: '/{tableName}/{id}/{relation}'
    }
  },
  [HTTP_METHODS.DELETE]: {
    method: HTTP_METHODS.DELETE,
    operation: 'DELETE',
    description: 'Delete records from the table',
    supportsPagination: false,
    supportsFiltering: true,
    supportsSorting: false,
    supportsFieldSelection: false,
    supportsRelatedData: false,
    isEnabledByDefault: true,
    endpoints: {
      collection: '/{tableName}',
      single: '/{tableName}/{id}',
      related: null
    }
  }
} as const;

/**
 * Default HTTP methods enabled for new API endpoints
 */
export const DEFAULT_ENABLED_METHODS = [
  HTTP_METHODS.GET,
  HTTP_METHODS.POST,
  HTTP_METHODS.PUT,
  HTTP_METHODS.DELETE
] as const;

// ============================================================================
// ENDPOINT PARAMETER CONFIGURATION
// ============================================================================

/**
 * Default pagination configuration for GET endpoints
 */
export const DEFAULT_PAGINATION_CONFIG = {
  enabled: true,
  defaultPageSize: 25,
  maxPageSize: 1000,
  pageParameter: 'page',
  limitParameter: 'limit',
  offsetParameter: 'offset',
  includeCount: true,
  countParameter: 'include_count'
} as const;

/**
 * Default filtering configuration for endpoints
 */
export const DEFAULT_FILTER_CONFIG = {
  enabled: true,
  filterParameter: 'filter',
  supportedOperators: [
    'eq', 'ne', 'gt', 'gte', 'lt', 'lte',
    'in', 'not_in', 'like', 'not_like',
    'is_null', 'is_not_null', 'between'
  ],
  caseSensitive: false,
  allowWildcards: true
} as const;

/**
 * Default sorting configuration for GET endpoints
 */
export const DEFAULT_SORT_CONFIG = {
  enabled: true,
  sortParameter: 'order',
  defaultDirection: 'asc',
  supportedDirections: ['asc', 'desc'],
  multipleSortFields: true,
  nullsHandling: 'last'
} as const;

/**
 * Default field selection configuration
 */
export const DEFAULT_FIELD_CONFIG = {
  enabled: true,
  fieldsParameter: 'fields',
  allowWildcards: true,
  supportRelatedFields: true,
  excludeParameter: 'exclude'
} as const;

/**
 * Default related data configuration
 */
export const DEFAULT_RELATED_CONFIG = {
  enabled: true,
  relatedParameter: 'related',
  maxDepth: 3,
  includeCount: false,
  supportFiltering: true
} as const;

/**
 * Comprehensive default endpoint configuration
 */
export const DEFAULT_ENDPOINT_CONFIG = {
  pagination: DEFAULT_PAGINATION_CONFIG,
  filtering: DEFAULT_FILTER_CONFIG,
  sorting: DEFAULT_SORT_CONFIG,
  fieldSelection: DEFAULT_FIELD_CONFIG,
  relatedData: DEFAULT_RELATED_CONFIG,
  caching: {
    enabled: false,
    ttl: 3600,
    varyBy: ['user_id']
  },
  rateLimit: {
    enabled: false,
    requestsPerMinute: 100,
    requestsPerHour: 1000
  }
} as const;

// ============================================================================
// VALIDATION RULES
// ============================================================================

/**
 * Validation constraints for wizard forms
 */
export const VALIDATION_RULES = {
  tableSelection: {
    minTables: 1,
    maxTables: 50,
    requireDescription: false
  },
  methodConfiguration: {
    minMethods: 1,
    maxMethods: Object.keys(HTTP_METHODS).length,
    requireAtLeastOneRead: true
  },
  parameterConfiguration: {
    maxPageSize: 10000,
    maxFilterDepth: 5,
    maxSortFields: 10,
    maxRelatedDepth: 5
  },
  securityConfiguration: {
    requireAuthentication: false,
    maxRolesPerEndpoint: 20,
    allowAnonymousAccess: true
  },
  apiGeneration: {
    maxEndpointsPerTable: 20,
    requireDocumentation: true,
    validateOpenAPISpec: true
  }
} as const;

/**
 * Error messages for validation failures
 */
export const VALIDATION_MESSAGES = {
  tableSelection: {
    required: 'At least one table must be selected',
    tooMany: 'Maximum of 50 tables can be selected',
    invalid: 'Selected table is not available'
  },
  methodConfiguration: {
    required: 'At least one HTTP method must be enabled',
    readRequired: 'At least one read operation (GET) must be enabled',
    invalid: 'Invalid HTTP method configuration'
  },
  parameterConfiguration: {
    pageSizeExceeded: 'Page size cannot exceed 10,000 records',
    filterDepthExceeded: 'Filter depth cannot exceed 5 levels',
    sortFieldsExceeded: 'Maximum of 10 sort fields allowed',
    relatedDepthExceeded: 'Related data depth cannot exceed 5 levels'
  },
  securityConfiguration: {
    tooManyRoles: 'Maximum of 20 roles per endpoint',
    invalidRole: 'Selected role does not exist',
    conflictingRules: 'Conflicting security rules detected'
  },
  apiGeneration: {
    endpointLimitExceeded: 'Maximum of 20 endpoints per table',
    invalidOpenAPISpec: 'Generated OpenAPI specification is invalid',
    generationFailed: 'API generation failed due to configuration errors'
  }
} as const;

// ============================================================================
// REACT QUERY CONFIGURATION
// ============================================================================

/**
 * React Query configuration for wizard data fetching optimization
 * Ensures optimal performance and caching behavior
 */
export const REACT_QUERY_CONFIG = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
  retry: 3,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000)
} as const;

/**
 * Query keys for wizard-related data fetching
 * Supports intelligent cache invalidation and updates
 */
export const WIZARD_QUERY_KEYS = {
  TABLES: (serviceId: string) => ['wizard', 'tables', serviceId] as const,
  TABLE_SCHEMA: (serviceId: string, tableName: string) => 
    ['wizard', 'table-schema', serviceId, tableName] as const,
  PREVIEW: (serviceId: string, config: object) => 
    ['wizard', 'preview', serviceId, config] as const,
  GENERATION: (serviceId: string, config: object) => 
    ['wizard', 'generation', serviceId, config] as const,
  SECURITY_ROLES: () => ['wizard', 'security-roles'] as const,
  SERVICE_INFO: (serviceId: string) => ['wizard', 'service-info', serviceId] as const
} as const;

/**
 * React Query mutation configuration for API generation
 */
export const WIZARD_MUTATION_CONFIG = {
  retry: 1,
  retryDelay: 2000,
  onError: (error: Error) => {
    console.error('Wizard mutation failed:', error);
  }
} as const;

// ============================================================================
// UI CONSTANTS
// ============================================================================

/**
 * UI constants for wizard interface consistency
 */
export const WIZARD_UI_CONFIG = {
  stepTransitionDuration: 300, // milliseconds
  autoSaveInterval: 30000, // 30 seconds
  progressBarAnimation: true,
  showStepNumbers: true,
  allowStepSkipping: false,
  confirmationRequired: true
} as const;

/**
 * Wizard loading states and timeouts
 */
export const WIZARD_LOADING_CONFIG = {
  tableLoadTimeout: 15000, // 15 seconds
  schemaLoadTimeout: 20000, // 20 seconds
  previewGenerationTimeout: 30000, // 30 seconds
  apiGenerationTimeout: 60000, // 60 seconds
  connectionTestTimeout: 5000 // 5 seconds
} as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

/**
 * Type definitions derived from constants for type safety
 */
export type WizardStep = typeof WIZARD_STEPS[keyof typeof WIZARD_STEPS];
export type HttpMethod = typeof HTTP_METHODS[keyof typeof HTTP_METHODS];
export type ValidationField = keyof typeof VALIDATION_MESSAGES;

/**
 * Type for wizard step configuration
 */
export type WizardStepConfig = typeof WIZARD_STEP_CONFIG[WizardStep];

/**
 * Type for HTTP method configuration
 */
export type HttpMethodConfig = typeof HTTP_METHOD_CONFIG[HttpMethod];

/**
 * Type for endpoint configuration
 */
export type EndpointConfig = typeof DEFAULT_ENDPOINT_CONFIG;

/**
 * Type for validation rules
 */
export type ValidationRules = typeof VALIDATION_RULES;

/**
 * Type for React Query keys
 */
export type WizardQueryKey = ReturnType<typeof WIZARD_QUERY_KEYS[keyof typeof WIZARD_QUERY_KEYS]>;