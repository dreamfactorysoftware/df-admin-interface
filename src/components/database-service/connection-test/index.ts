/**
 * Database Service Connection Test Module
 * 
 * Centralized export file for all connection testing components, hooks, and types.
 * Provides tree-shaking optimized exports following React 19 ecosystem best practices
 * with TypeScript 5.8+ module system integration for Turbopack build pipeline.
 * 
 * Features:
 * - Tree-shaking optimization for minimal bundle sizes
 * - Organized exports by category (components, hooks, types, utilities)
 * - Re-exports of commonly used types from parent database service module
 * - TypeScript 5.8+ module system compatibility
 * - Clear API surface for development experience
 * 
 * @fileoverview Connection testing module barrel exports for React/Next.js application
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1+, TypeScript 5.8+
 */

// =============================================================================
// COMPONENT EXPORTS
// =============================================================================

/**
 * Connection Test Button Component
 * Interactive button component with loading states, success/error feedback,
 * and integration with connection testing workflow
 */
export { 
  ConnectionTestButton,
  connectionTestButtonVariants,
  default as ConnectionTestButtonDefault 
} from './connection-test-button';

/**
 * Connection Status Indicator Component  
 * Real-time status display with visual indicators, progress animations,
 * and accessibility-compliant status messaging
 */
export { 
  ConnectionStatusIndicator,
  default as ConnectionStatusIndicatorDefault 
} from './connection-status-indicator';

/**
 * Test Result Display Component
 * Comprehensive test result presentation with success/error states,
 * troubleshooting information, and database-specific guidance
 */
export { 
  TestResultDisplay,
  default as TestResultDisplayDefault 
} from './test-result-display';

// =============================================================================
// HOOK EXPORTS
// =============================================================================

/**
 * Primary Connection Test Hook
 * SWR-powered connection testing with intelligent caching, automatic retries,
 * and comprehensive error handling for sub-5-second validation
 */
export { 
  useConnectionTest,
  default as useConnectionTestDefault 
} from './use-connection-test';

/**
 * Connection Test Hook with SWR Caching
 * Enhanced version with automatic revalidation and cached results
 */
export { useConnectionTestWithCache } from './use-connection-test';

/**
 * Batch Connection Test Hook
 * Concurrent testing of multiple database configurations with result aggregation
 */
export { useBatchConnectionTest } from './use-connection-test';

/**
 * Connection Status State Hook
 * Simplified state management for connection status operations
 */
export { useConnectionStatus } from './connection-status-indicator';

// =============================================================================
// TYPE EXPORTS - CONNECTION TEST HOOKS
// =============================================================================

/**
 * Hook Configuration and Return Types
 * TypeScript interfaces for connection test hook configuration and responses
 */
export type {
  UseConnectionTestOptions,
  UseConnectionTestReturn,
  ConnectionTestRequest,
  ConnectionTestResponse
} from './use-connection-test';

// =============================================================================
// TYPE EXPORTS - COMPONENT PROPS
// =============================================================================

/**
 * Connection Test Button Props
 * Component props interface with variant props from class-variance-authority
 */
export type { 
  ConnectionTestButtonProps,
  VariantProps
} from './connection-test-button';

/**
 * Connection Status Indicator Props
 * Component props interface for status display configuration
 */
export type { 
  ConnectionStatusProps 
} from './connection-status-indicator';

/**
 * Test Result Display Props
 * Component props interface for result presentation customization
 */
export type { 
  TestResultDisplayProps 
} from './test-result-display';

// =============================================================================
// TYPE EXPORTS - CONNECTION TEST TYPES
// =============================================================================

/**
 * Core Connection Test Types
 * Essential types for connection testing operations and results
 */
export type {
  ConnectionTestStatus,
  ConnectionTestResult
} from './connection-status-indicator';

// =============================================================================
// UTILITY FUNCTION EXPORTS
// =============================================================================

/**
 * Cache Key Generation Utility
 * Creates unique cache keys for connection test results with security considerations
 */
export { createCacheKey } from './use-connection-test';

/**
 * Connection Configuration Validator
 * Validates database configuration before testing with comprehensive checks
 */
export { validateConnectionConfig } from './use-connection-test';

/**
 * Exponential Backoff Calculator
 * Implements exponential backoff delay calculation for retry mechanisms
 */
export { calculateBackoffDelay } from './use-connection-test';

// =============================================================================
// RE-EXPORTS FROM PARENT DATABASE SERVICE MODULE
// =============================================================================

/**
 * Database Configuration Types
 * Core database service types commonly used in connection testing
 */
export type {
  DatabaseConfig,
  DatabaseDriver,
  DatabaseType,
  ConnectionMetadata,
  ApiErrorResponse,
  ServiceStatus,
  SSLConfig,
  PoolingConfig,
  DatabaseOptions,
  DatabaseConnectionInput,
  ConnectionTestInput
} from '../types';

/**
 * Database Service Validation Schemas
 * Zod schemas for form validation and data transformation
 */
export {
  DatabaseConnectionSchema,
  ConnectionTestSchema
} from '../types';

/**
 * Database Service Constants
 * Default ports, labels, and configuration constants for database types
 */
export {
  DATABASE_DEFAULT_PORTS,
  DATABASE_TYPE_LABELS,
  DATABASE_TYPE_DESCRIPTIONS,
  SERVICE_STATUS_LABELS,
  SERVICE_STATUS_COLORS,
  VALIDATION_MESSAGES
} from '../types';

/**
 * Database Service Utility Functions
 * Helper functions for database type checking and configuration
 */
export {
  isDatabaseDriver,
  isServiceStatus,
  getDefaultPort,
  formatServiceStatus,
  getServiceStatusColor,
  validateConnectionConfig as validateDatabaseConfig,
  createInitialFormData
} from '../types';

// =============================================================================
// OPTIMIZED DEFAULT EXPORTS FOR TREE-SHAKING
// =============================================================================

/**
 * Default export object for convenient imports while maintaining tree-shaking
 * 
 * Usage examples:
 * ```typescript
 * // Named imports (recommended for tree-shaking)
 * import { ConnectionTestButton, useConnectionTest } from './connection-test';
 * 
 * // Default import for multiple components
 * import ConnectionTest from './connection-test';
 * const { ConnectionTestButton, useConnectionTest } = ConnectionTest;
 * 
 * // Specific component default
 * import { ConnectionTestButtonDefault as ConnectionTestButton } from './connection-test';
 * ```
 */
const ConnectionTestModule = {
  // Components
  ConnectionTestButton,
  ConnectionStatusIndicator,
  TestResultDisplay,
  
  // Hooks
  useConnectionTest,
  useConnectionTestWithCache,
  useBatchConnectionTest,
  useConnectionStatus,
  
  // Utilities
  createCacheKey,
  validateConnectionConfig,
  calculateBackoffDelay,
  
  // Style variants
  connectionTestButtonVariants
} as const;

export default ConnectionTestModule;

// =============================================================================
// MODULE METADATA FOR DEVELOPMENT TOOLS
// =============================================================================

/**
 * Module information for development tools and documentation generation
 */
export const MODULE_INFO = {
  name: 'database-service-connection-test',
  version: '1.0.0',
  description: 'Connection testing components and hooks for database services',
  exports: {
    components: ['ConnectionTestButton', 'ConnectionStatusIndicator', 'TestResultDisplay'],
    hooks: ['useConnectionTest', 'useConnectionTestWithCache', 'useBatchConnectionTest', 'useConnectionStatus'],
    types: ['ConnectionTestButtonProps', 'ConnectionStatusProps', 'UseConnectionTestOptions', 'ConnectionTestResult'],
    utilities: ['createCacheKey', 'validateConnectionConfig', 'calculateBackoffDelay']
  },
  dependencies: {
    react: '>=19.0.0',
    'class-variance-authority': '^0.7.0',
    swr: '^2.2.0',
    zod: '^3.22.0'
  },
  features: [
    'Tree-shaking optimization',
    'TypeScript 5.8+ support',
    'React 19 concurrent features',
    'SWR intelligent caching',
    'Comprehensive error handling',
    'Accessibility compliance',
    'Turbopack build optimization'
  ]
} as const;

/**
 * Type-only export for module metadata
 */
export type ConnectionTestModuleInfo = typeof MODULE_INFO;