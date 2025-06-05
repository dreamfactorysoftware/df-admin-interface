/**
 * @fileoverview Validation Library Barrel Exports
 * 
 * Centralized export hub for the comprehensive validation system that provides Zod schema
 * validators, React Hook Form integration utilities, and TypeScript type definitions.
 * Enables clean imports throughout the application while supporting tree-shaking
 * optimization for the Turbopack build pipeline.
 * 
 * Key Features:
 * - React Hook Form with Zod schema validators per React/Next.js integration requirements
 * - Real-time validation under 100ms performance requirement per Section 3.2.3
 * - Centralized validation exports following React 19 and TypeScript 5.8+ module patterns
 * - Tree-shaking optimization support for Turbopack build pipeline per Section 3.2.5
 * - Type-safe validation with runtime checking and compile-time inference per Section 3.2.3
 * 
 * Usage Examples:
 * ```typescript
 * // Basic schema imports
 * import { emailSchema, passwordSchema, createFormConfig } from '@/lib/validation';
 * 
 * // Advanced form utilities
 * import { 
 *   createZodResolver, 
 *   transformZodErrors, 
 *   useDebouncedValidation 
 * } from '@/lib/validation';
 * 
 * // Type-safe imports
 * import type { 
 *   ValidationResult, 
 *   FormConfig, 
 *   ValidationPerformanceMetrics 
 * } from '@/lib/validation';
 * 
 * // JSON validation
 * import { jsonSchema, validateJsonString } from '@/lib/validation';
 * 
 * // Cross-field validation
 * import { matchValidator, createUniqueNameSchema } from '@/lib/validation';
 * ```
 * 
 * @version 1.0.0
 * @since React 19 / Next.js 15.1 migration
 */

// =============================================================================
// CORE VALIDATION SCHEMAS - HIGH PRIORITY EXPORTS
// =============================================================================

/**
 * Common validation schemas for immediate use across the application.
 * These are the most frequently used validators that support the core
 * DreamFactory Admin Interface functionality.
 */
export {
  // Basic data type schemas
  createStringSchema,
  createNumberSchema,
  
  // Email validation with internationalization support
  emailSchema,
  optionalEmailSchema,
  emailListSchema,
  
  // Password validation with configurable strength requirements
  passwordSchema,
  adminPasswordSchema,
  passwordConfirmationSchema,
  createPasswordSchema,
  createPasswordConfirmationSchema,
  
  // URL and host validation for service connections
  urlSchema,
  hostSchema,
  optionalHostSchema,
  portSchema,
  optionalPortSchema,
  databasePortSchema,
  
  // Database and service type enumerations
  databaseDriverSchema,
  serviceTypeSchema,
  
  // Complex form schemas for DreamFactory workflows
  databaseConnectionSchema,
  userProfileSchema,
  apiEndpointConfigSchema,
  emailConfigSchema,
  rateLimitConfigSchema,
  
  // Utility schemas for common patterns
  createPaginatedRequestSchema,
  createFileUploadSchema,
  createUniqueNameArraySchema,
  createConditionalSchema,
  
  // Schema registry for dynamic lookup
  VALIDATION_SCHEMAS,
  getValidationSchema,
  getValidationPerformanceMetrics,
  
  // Schema creation utilities
  createPerformantSchema
} from './schemas';

/**
 * Export inferred types from common schemas for type-safe form handling.
 * Enables compile-time type safety for form values throughout the application.
 */
export type {
  EmailSchemaType,
  PasswordSchemaType,
  DatabaseConnectionSchemaType,
  UserProfileSchemaType,
  ApiEndpointConfigSchemaType,
  EmailConfigSchemaType,
  RateLimitConfigSchemaType,
  ValidationSchemaName
} from './schemas';

// =============================================================================
// JSON VALIDATION UTILITIES
// =============================================================================

/**
 * JSON validation utilities migrated from Angular JsonValidator.
 * Maintains exact functionality while providing enhanced performance
 * and React Hook Form integration.
 */
export {
  // Core JSON validation schemas
  jsonSchema,
  typedJsonSchema,
  jsonArraySchema,
  jsonObjectSchema,
  createTypedJsonSchema,
  createJsonValidator,
  
  // Validation utilities and functions
  validateJsonString,
  createValidationResult,
  createDebouncedJsonValidator,
  meetsPerformanceTarget,
  
  // Error handling and localization
  formatJsonErrorMessage,
  DEFAULT_ERROR_MESSAGES,
  
  // Performance and testing utilities
  testUtils as jsonTestUtils,
  ValidationPerformanceTracker
} from './json';

// =============================================================================
// CROSS-FIELD VALIDATION UTILITIES
// =============================================================================

/**
 * Cross-field validation utilities for password matching and field relationships.
 * Migrated from Angular matchValidator with enhanced React Hook Form integration.
 */
export {
  // React Hook Form integration
  createMatchValidator,
  createMatchValidationRules,
  
  // Zod schema refinements
  createMatchRefinement,
  createPasswordMatchSchema,
  
  // Legacy Angular compatibility
  matchValidator,
  isMatchError,
  
  // Performance optimization utilities
  createDebouncedMatchValidator,
  validateMultipleMatches
} from './match';

/**
 * Export match validation types and configurations.
 */
export type {
  MatchValidationConfig,
  MatchValidationResult,
  MatchValidator
} from './match';

// =============================================================================
// UNIQUE NAME VALIDATION UTILITIES
// =============================================================================

/**
 * Array uniqueness validation utilities for dynamic form arrays.
 * Migrated from Angular uniqueNameValidator with Map-based duplicate detection
 * and performance optimization for large datasets.
 */
export {
  // Core validation functions
  createUniqueNameSchema,
  createUniqueNameResolver,
  validateUniqueNames,
  
  // React Hook Form integration
  createFieldArrayValidator,
  useUniqueNameValidation,
  
  // Utility functions
  createUniqueNameErrorMessage,
  isUniqueNameError,
  normalizeFieldValue
} from './unique-name';

/**
 * Export unique name validation types and configurations.
 */
export type {
  UniqueNameValidationConfig,
  UniqueNameValidationResult
} from './unique-name';

// =============================================================================
// REACT HOOK FORM INTEGRATION UTILITIES
// =============================================================================

/**
 * Comprehensive React Hook Form integration utilities with Zod schema validation.
 * Provides form configuration, error handling, and performance optimization
 * to meet the 100ms real-time validation requirement.
 */
export {
  // Core form configuration and setup
  createFormConfig,
  createEnhancedForm,
  createZodResolver,
  createPerformantSchema,
  
  // Error handling and transformation
  transformZodErrors,
  transformFormErrors,
  formatErrorMessage,
  defaultErrorMessageProvider,
  
  // Performance measurement and optimization
  createPerformanceMeasurement,
  useDebouncedValidation,
  createDebouncedValidator,
  
  // Form management utilities
  createFormResetUtility,
  generateFormDefaults,
  createSubmissionHandler,
  
  // Testing utilities for comprehensive validation coverage
  formTestUtils,
  
  // Type-safe field path utilities
  fieldPathUtils,
  
  // Legacy Angular compatibility
  legacyCompatUtils
} from './form-utils';

// =============================================================================
// TYPESCRIPT TYPE DEFINITIONS - COMPREHENSIVE TYPE EXPORTS
// =============================================================================

/**
 * Complete TypeScript type definitions for type-safe validation throughout
 * the application. Supports React Hook Form integration, Zod schema inference,
 * and legacy Angular validation error compatibility.
 */
export type {
  // Legacy Angular validation error patterns
  DoesNotMatchError,
  NotUniqueError,
  JsonInvalidError,
  LegacyValidationError,
  
  // Zod schema integration types
  ZodInferredType,
  PerformantZodSchema,
  ZodValidatorConfig,
  
  // Validation result types
  ValidationResult,
  ValidationSuccess,
  ValidationFailure,
  ValidationErrorInfo,
  FieldValidationError,
  CrossFieldValidationError,
  SchemaValidationError,
  
  // React Hook Form integration types
  FormConfig,
  EnhancedFormReturn,
  
  // Generic validation utilities
  FieldValidator,
  CrossFieldValidator,
  ArrayValidationConfig,
  
  // Error message and localization types
  ErrorMessageConfig,
  ErrorMessageFormatter,
  ErrorMessageProvider,
  
  // Performance tracking types
  ValidationPerformanceMetrics,
  PerformanceTrackingConfig,
  PerformanceMeasurement,
  
  // Utility types for type safety
  FormFieldPaths,
  FormFieldValue,
  ValidationErrors,
  TypedValidationSchema,
  TypedFieldValidator,
  
  // Type guards and assertions
  isValidationSuccess,
  isValidationFailure,
  isLegacyValidationError
} from './types';

// =============================================================================
// CONVENIENCE EXPORTS AND DEFAULT PATTERNS
// =============================================================================

/**
 * Default export for the most common validation patterns.
 * Provides quick access to frequently used validation utilities.
 */
export { default as matchValidationDefaults } from './match';
export { default as formUtilsDefaults } from './form-utils';

/**
 * Convenience re-exports for common validation workflows.
 * Optimizes imports for typical DreamFactory Admin Interface use cases.
 */

/**
 * Database connection validation bundle for service configuration workflows.
 * Combines schemas, validation, and form utilities for database connections.
 */
export const databaseValidation = {
  // Core schema for database connections
  connectionSchema: databaseConnectionSchema,
  driverSchema: databaseDriverSchema,
  hostSchema,
  portSchema: databasePortSchema,
  
  // Form configuration helper
  createConnectionForm: (defaultValues?: Partial<any>) => 
    createFormConfig(databaseConnectionSchema, { defaultValues }),
  
  // Validation utilities
  validateConnection: validateJsonString,
  
  // Type definitions
  type ConnectionData: {} as any // Will be inferred from schema
};

/**
 * User management validation bundle for admin workflows.
 * Combines user profile, email, and password validation patterns.
 */
export const userValidation = {
  // Core schemas
  profileSchema: userProfileSchema,
  emailSchema,
  passwordSchema,
  
  // Form utilities
  createUserForm: (defaultValues?: Partial<any>) => 
    createFormConfig(userProfileSchema, { defaultValues }),
  
  // Password validation with confirmation
  createPasswordForm: () => createPasswordMatchSchema(),
  
  // Validation functions
  validateEmail: (email: string) => emailSchema.safeParse(email),
  validatePassword: (password: string) => passwordSchema.safeParse(password),
  
  // Type definitions
  type UserData: {} as any // Will be inferred from schema
};

/**
 * API endpoint validation bundle for API generation workflows.
 * Combines endpoint configuration, parameter validation, and security schemas.
 */
export const apiValidation = {
  // Core schemas
  endpointSchema: apiEndpointConfigSchema,
  rateLimitSchema: rateLimitConfigSchema,
  
  // Form utilities
  createEndpointForm: (defaultValues?: Partial<any>) => 
    createFormConfig(apiEndpointConfigSchema, { defaultValues }),
  
  // JSON validation for API parameters
  jsonSchema,
  validateApiParams: validateJsonString,
  
  // Type definitions
  type EndpointData: {} as any // Will be inferred from schema
};

/**
 * Performance monitoring utilities for validation optimization.
 * Tracks validation performance to ensure 100ms requirement compliance.
 */
export const performanceUtils = {
  // Measurement utilities
  createMeasurement: createPerformanceMeasurement,
  
  // Validation performance tracking
  validatePerformance: meetsPerformanceTarget,
  
  // Debouncing for real-time validation
  createDebouncedValidator,
  useDebouncedValidation,
  
  // Performance configuration
  DEFAULT_PERFORMANCE_TARGET: 100, // milliseconds
  
  // Monitoring functions
  warnOnSlowValidation: (metrics: ValidationPerformanceMetrics) => {
    if (!metrics.metPerformanceTarget) {
      console.warn(`Validation exceeded 100ms target: ${metrics.validationTime}ms`);
    }
  }
};

// =============================================================================
// VERSION AND MODULE INFORMATION
// =============================================================================

/**
 * Module metadata for debugging and version tracking.
 */
export const VALIDATION_MODULE_INFO = {
  version: '1.0.0',
  migration: 'Angular 16 to React 19 / Next.js 15.1',
  performanceTarget: '100ms real-time validation',
  frameworks: {
    react: '19.0.0',
    nextjs: '15.1+',
    zod: 'latest',
    'react-hook-form': '7.57.0'
  },
  features: [
    'React Hook Form with Zod schema validators',
    'Real-time validation under 100ms',
    'Tree-shaking optimization for Turbopack',
    'TypeScript 5.8+ type safety',
    'Legacy Angular validation compatibility'
  ]
} as const;

/**
 * Validation library initialization check.
 * Ensures all required dependencies are available and properly configured.
 */
export const validateLibrarySetup = (): boolean => {
  try {
    // Check for required dependencies
    if (typeof window !== 'undefined' && !window.performance) {
      console.warn('Performance API not available - validation timing may be inaccurate');
    }
    
    // Validate performance requirements are met
    const testMeasurement = createPerformanceMeasurement();
    testMeasurement.start('setup-test');
    const duration = testMeasurement.end('setup-test');
    
    if (duration > 10) {
      console.warn('Performance measurement overhead detected:', duration, 'ms');
    }
    
    return true;
  } catch (error) {
    console.error('Validation library setup failed:', error);
    return false;
  }
};

// =============================================================================
// TREE-SHAKING OPTIMIZATION METADATA
// =============================================================================

/**
 * Module export metadata for tree-shaking optimization.
 * Enables Turbopack to efficiently eliminate unused code.
 */
if (typeof module !== 'undefined' && module.exports) {
  // CommonJS metadata for Node.js environments
  module.exports.__esModule = true;
  module.exports.sideEffects = false;
}

/**
 * ES Module metadata for modern bundlers.
 */
export const __esModule = true;
export const sideEffects = false;