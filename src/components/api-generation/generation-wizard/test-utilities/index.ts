/**
 * API Generation Wizard Test Utilities
 * 
 * Central export file for all API generation wizard test utilities, providing clean imports
 * for test utilities, MSW handlers, mock data, and testing components. Enables consistent
 * testing patterns across the wizard component test suite with tree-shaking friendly exports.
 * 
 * This module follows React/Next.js Integration Requirements for modular test utility
 * organization with clean import patterns and supports Turbopack build optimization
 * for enhanced test bundle efficiency.
 * 
 * @see {@link https://vitest.dev/guide/} - Vitest testing framework configuration
 * @see {@link https://mswjs.io/} - Mock Service Worker for API mocking
 * @see {@link https://testing-library.com/docs/react-testing-library/intro/} - React Testing Library patterns
 * 
 * @example
 * ```typescript
 * // Import specific utilities
 * import { renderWizardWithProviders, mockWizardData } from './test-utilities';
 * 
 * // Import MSW handlers
 * import { wizardHandlers } from './test-utilities';
 * 
 * // Import all test utilities
 * import * as WizardTestUtils from './test-utilities';
 * ```
 */

// MSW Handlers for API mocking during development and testing
// Provides comprehensive mock handlers for wizard API endpoints including
// database services, schema discovery, and OpenAPI generation workflows
export * from './msw-handlers';

// Mock Data and Fixtures
// Comprehensive mock data for wizard testing including OpenAPI specifications,
// database schemas, service configurations, and wizard state objects
export * from './mock-data';

// React Testing Library Render Utilities  
// Custom render functions with wizard context, React Query client, and
// routing setup for consistent component testing environment
export * from './render-utils';

// Vitest Test Configuration and Setup
// Test configuration utilities with MSW server integration, React Query
// client setup, and global test utilities for wizard component testing
export * from './test-setup';

// Comprehensive Test Suite
// Complete Vitest test suite for wizard components with React Testing Library
// patterns, MSW integration, and comprehensive workflow testing
export * from './wizard-tests';

/**
 * Re-export common testing utilities for convenience
 * These provide direct access to frequently used testing functions
 * without requiring separate imports from test utilities modules
 */
export type {
  // Core testing types from Vitest and React Testing Library
  MockInstance,
  SpyInstance,
  Mock,
} from 'vitest';

export type {
  // React Testing Library types for component testing
  RenderResult,
  RenderOptions,
  Queries,
  BoundFunction,
} from '@testing-library/react';

export type {
  // MSW types for API mocking
  RestHandler,
  HttpResponse,
  HttpResolver,
  RequestHandler,
} from 'msw';

/**
 * Test utilities configuration object
 * Provides centralized configuration for wizard test utilities
 * with optimal defaults for React/Next.js testing patterns
 */
export const WIZARD_TEST_CONFIG = {
  /**
   * Default test timeout for wizard component tests
   * Accounts for React Query cache operations and MSW response times
   */
  defaultTimeout: 10000,
  
  /**
   * MSW request timeout for realistic API simulation
   * Balances test speed with realistic network conditions
   */
  mswTimeout: 100,
  
  /**
   * React Query test client configuration
   * Optimized for test isolation and fast execution
   */
  queryClientConfig: {
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  },
  
  /**
   * Vitest test environment settings
   * Configured for React component testing with JSDOM
   */
  vitestEnvironment: {
    environment: 'jsdom',
    setupFiles: ['./test-setup.ts'],
    testTimeout: 10000,
  },
} as const;

/**
 * Common test patterns and utilities
 * Provides standardized testing patterns for wizard components
 * following React Testing Library best practices
 */
export const WIZARD_TEST_PATTERNS = {
  /**
   * Standard selectors for wizard components
   * Promotes consistent element selection across tests
   */
  selectors: {
    wizardContainer: '[data-testid="wizard-container"]',
    stepIndicator: '[data-testid="step-indicator"]',
    nextButton: '[data-testid="wizard-next"]',
    previousButton: '[data-testid="wizard-previous"]',
    submitButton: '[data-testid="wizard-submit"]',
    cancelButton: '[data-testid="wizard-cancel"]',
    formError: '[data-testid="form-error"]',
    loadingSpinner: '[data-testid="loading-spinner"]',
  },
  
  /**
   * Common user interactions for wizard testing
   * Standardized interaction patterns for wizard workflows
   */
  interactions: {
    /**
     * Navigation actions
     */
    navigation: {
      nextStep: 'click next button',
      previousStep: 'click previous button',
      goToStep: 'navigate to specific step',
      cancel: 'cancel wizard workflow',
    },
    
    /**
     * Form interactions
     */
    forms: {
      fillField: 'fill form field',
      selectOption: 'select dropdown option',
      toggleCheckbox: 'toggle checkbox',
      uploadFile: 'upload file input',
      submitForm: 'submit form data',
    },
    
    /**
     * API interactions
     */
    api: {
      waitForQuery: 'wait for React Query response',
      triggerMutation: 'trigger API mutation',
      handleError: 'handle API error response',
      verifyRequest: 'verify MSW request received',
    },
  },
  
  /**
   * Test data validation patterns
   * Consistent validation approaches for wizard testing
   */
  validation: {
    /**
     * Form validation patterns
     */
    forms: {
      requiredFields: 'validate required field errors',
      formatValidation: 'validate input format rules',
      asyncValidation: 'validate server-side validation',
      conditionalFields: 'validate conditional field visibility',
    },
    
    /**
     * State validation patterns
     */
    state: {
      wizardProgress: 'validate wizard step progression',
      formData: 'validate form data persistence',
      apiState: 'validate API loading/error states',
      routingState: 'validate router state changes',
    },
    
    /**
     * Integration validation patterns
     */
    integration: {
      apiCalls: 'validate API request/response flow',
      cacheUpdates: 'validate React Query cache updates',
      stateSync: 'validate state synchronization',
      errorHandling: 'validate error boundary behavior',
    },
  },
} as const;

/**
 * Performance testing utilities
 * Specialized utilities for testing wizard performance characteristics
 * aligned with Turbopack optimization requirements
 */
export const WIZARD_PERFORMANCE_UTILS = {
  /**
   * Bundle size validation
   * Ensures wizard components meet bundle size requirements
   */
  bundleSize: {
    maxComponentSize: '50kb', // Individual component bundle limit
    maxUtilitySize: '10kb',   // Utility function bundle limit
    treeShakingEfficiency: 0.9, // Tree-shaking efficiency target
  },
  
  /**
   * Runtime performance metrics
   * Validates wizard performance during test execution
   */
  runtime: {
    maxRenderTime: 100,     // Component render time in ms
    maxQueryTime: 500,      // React Query response time in ms
    maxMutationTime: 1000,  // API mutation time in ms
    maxNavigationTime: 200, // Step navigation time in ms
  },
  
  /**
   * Memory usage validation
   * Prevents memory leaks in wizard components
   */
  memory: {
    maxHeapIncrease: '10mb', // Maximum heap increase per test
    gcEfficiency: 0.95,     // Garbage collection efficiency
    leakDetection: true,    // Enable memory leak detection
  },
} as const;