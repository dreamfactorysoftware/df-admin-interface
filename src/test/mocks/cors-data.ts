/**
 * CORS Configuration Mock Data
 * 
 * Comprehensive mock data fixtures for CORS (Cross-Origin Resource Sharing)
 * configuration testing and development. Provides realistic CORS configuration
 * scenarios that match DreamFactory's CORS management capabilities.
 * 
 * Data Structures:
 * - CorsConfiguration interface with comprehensive typing
 * - Mock CORS entries covering common use cases
 * - Factory functions for generating test data
 * - Validation test scenarios
 * - Performance testing datasets
 * 
 * Use Cases Covered:
 * - API endpoint CORS configuration (/api/v2/*)
 * - Database service CORS rules (/api/v2/db/*)
 * - System endpoint configuration (/api/v2/system/*)
 * - File service CORS settings (/api/v2/files/*)
 * - Custom application CORS rules
 * - Wildcard and restricted origin scenarios
 * - Method-specific configurations
 * - Header allowlist scenarios
 * - Credential handling configurations
 * 
 * Performance Considerations:
 * - Optimized for large dataset testing (1000+ entries)
 * - Memory-efficient data structures
 * - Factory pattern for dynamic data generation
 * - Realistic data distribution for performance testing
 */

/**
 * CORS Configuration Interface
 * 
 * Defines the complete structure of a CORS configuration entry
 * as used in DreamFactory's CORS management system.
 */
export interface CorsConfiguration {
  id: number;
  path: string;
  origin: string;
  host?: string;
  methods: string[];
  headers: string[];
  supports_credentials: boolean;
  max_age: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
  description?: string;
  tags?: string[];
}

/**
 * CORS Configuration Creation Parameters
 * 
 * Subset of CorsConfiguration used for creating new entries
 */
export type CorsConfigurationCreate = Omit<CorsConfiguration, 'id' | 'created_at' | 'updated_at'>;

/**
 * CORS Configuration Update Parameters
 * 
 * Partial configuration for updating existing entries
 */
export type CorsConfigurationUpdate = Partial<Omit<CorsConfiguration, 'id' | 'created_at'>>;

// ============================================================================
// MOCK DATA STORE
// ============================================================================

/**
 * Global mock CORS entries store
 * 
 * This array serves as the in-memory database for MSW handlers
 * and can be modified during testing scenarios.
 */
export const mockCorsEntries: CorsConfiguration[] = [];

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a mock CORS configuration entry with defaults
 * 
 * Provides intelligent defaults for all required fields while allowing
 * customization of specific properties for testing scenarios.
 */
export const createMockCorsEntry = (overrides: Partial<CorsConfiguration> = {}): CorsConfiguration => {
  const now = new Date().toISOString();
  
  const defaults: CorsConfiguration = {
    id: Math.floor(Math.random() * 10000) + 1,
    path: '/api/v2/*',
    origin: 'https://localhost:3000',
    host: 'api.dreamfactory.local',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    headers: ['Content-Type', 'Authorization', 'X-Requested-With'],
    supports_credentials: true,
    max_age: 3600, // 1 hour
    enabled: true,
    created_at: now,
    updated_at: now,
    created_by: 1,
    updated_by: 1,
    description: 'Auto-generated CORS configuration for API access',
    tags: ['api', 'cors'],
  };
  
  return { ...defaults, ...overrides };
};

/**
 * Generate realistic CORS configurations for different scenarios
 */
export const createCorsScenarios = () => {
  return [
    // Production API CORS
    createMockCorsEntry({
      id: 1,
      path: '/api/v2/*',
      origin: 'https://app.production.com',
      host: 'api.production.com',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      headers: ['Content-Type', 'Authorization', 'X-API-Key'],
      supports_credentials: true,
      max_age: 86400, // 24 hours
      enabled: true,
      description: 'Production API CORS configuration',
      tags: ['production', 'api', 'secure'],
    }),
    
    // Development environment CORS
    createMockCorsEntry({
      id: 2,
      path: '/api/v2/db/*',
      origin: 'http://localhost:3000',
      host: 'localhost',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      headers: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Debug-Token'],
      supports_credentials: true,
      max_age: 600, // 10 minutes for development
      enabled: true,
      description: 'Development database API access',
      tags: ['development', 'database', 'localhost'],
    }),
    
    // Public API with restricted methods
    createMockCorsEntry({
      id: 3,
      path: '/api/v2/public/*',
      origin: '*',
      host: 'api.example.com',
      methods: ['GET', 'OPTIONS'],
      headers: ['Content-Type'],
      supports_credentials: false,
      max_age: 7200, // 2 hours
      enabled: true,
      description: 'Public read-only API access',
      tags: ['public', 'readonly', 'unrestricted'],
    }),
    
    // Admin panel CORS
    createMockCorsEntry({
      id: 4,
      path: '/api/v2/system/*',
      origin: 'https://admin.example.com',
      host: 'api.example.com',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      headers: ['Content-Type', 'Authorization', 'X-Admin-Token'],
      supports_credentials: true,
      max_age: 1800, // 30 minutes
      enabled: true,
      description: 'Admin panel system access',
      tags: ['admin', 'system', 'restricted'],
    }),
    
    // File upload CORS
    createMockCorsEntry({
      id: 5,
      path: '/api/v2/files/*',
      origin: 'https://upload.example.com',
      host: 'files.example.com',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      headers: ['Content-Type', 'Authorization', 'Content-Length', 'X-File-Name'],
      supports_credentials: true,
      max_age: 3600,
      enabled: true,
      description: 'File upload and management CORS',
      tags: ['files', 'upload', 'media'],
    }),
    
    // Mobile app CORS
    createMockCorsEntry({
      id: 6,
      path: '/api/v2/mobile/*',
      origin: 'capacitor://localhost',
      host: 'mobile-api.example.com',
      methods: ['GET', 'POST', 'PUT'],
      headers: ['Content-Type', 'Authorization', 'X-Device-ID'],
      supports_credentials: true,
      max_age: 86400,
      enabled: true,
      description: 'Mobile application API access',
      tags: ['mobile', 'capacitor', 'ionic'],
    }),
    
    // Webhook endpoint CORS
    createMockCorsEntry({
      id: 7,
      path: '/api/v2/webhooks/*',
      origin: 'https://webhook-sender.example.com',
      host: 'webhooks.example.com',
      methods: ['POST'],
      headers: ['Content-Type', 'X-Webhook-Signature'],
      supports_credentials: false,
      max_age: 300, // 5 minutes
      enabled: true,
      description: 'Webhook endpoint CORS configuration',
      tags: ['webhooks', 'integration', 'callbacks'],
    }),
    
    // Testing environment CORS
    createMockCorsEntry({
      id: 8,
      path: '/api/v2/test/*',
      origin: 'https://test.example.com',
      host: 'test-api.example.com',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      headers: ['Content-Type', 'Authorization', 'X-Test-Run-ID'],
      supports_credentials: true,
      max_age: 60, // 1 minute for testing
      enabled: false, // Disabled by default
      description: 'Testing environment API access',
      tags: ['testing', 'qa', 'automation'],
    }),
    
    // Legacy application CORS
    createMockCorsEntry({
      id: 9,
      path: '/api/v1/*',
      origin: 'https://legacy.example.com',
      host: 'legacy-api.example.com',
      methods: ['GET', 'POST'],
      headers: ['Content-Type', 'X-Legacy-Token'],
      supports_credentials: false,
      max_age: 86400,
      enabled: true,
      description: 'Legacy API version support',
      tags: ['legacy', 'v1', 'deprecated'],
    }),
    
    // CDN/Static resources CORS
    createMockCorsEntry({
      id: 10,
      path: '/api/v2/static/*',
      origin: '*',
      host: 'cdn.example.com',
      methods: ['GET', 'HEAD', 'OPTIONS'],
      headers: ['Content-Type', 'Cache-Control'],
      supports_credentials: false,
      max_age: 604800, // 1 week
      enabled: true,
      description: 'CDN and static resource access',
      tags: ['cdn', 'static', 'assets'],
    }),
  ];
};

/**
 * Generate large dataset for performance testing
 */
export const generateLargeCorsDataset = (count: number = 1000): CorsConfiguration[] => {
  const entries: CorsConfiguration[] = [];
  const domains = [
    'example.com', 'test.com', 'app.org', 'demo.net', 'api.io',
    'service.co', 'platform.dev', 'localhost', 'staging.com', 'prod.com'
  ];
  
  const pathPrefixes = [
    '/api/v1', '/api/v2', '/api/v3', '/api/admin', '/api/public',
    '/api/db', '/api/files', '/api/system', '/api/mobile', '/api/webhook'
  ];
  
  const methodCombinations = [
    ['GET'],
    ['GET', 'POST'],
    ['GET', 'POST', 'PUT'],
    ['GET', 'POST', 'PUT', 'DELETE'],
    ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    ['POST'],
    ['GET', 'OPTIONS'],
  ];
  
  for (let i = 1; i <= count; i++) {
    const domain = domains[i % domains.length];
    const pathPrefix = pathPrefixes[i % pathPrefixes.length];
    const methods = methodCombinations[i % methodCombinations.length];
    
    entries.push(createMockCorsEntry({
      id: i,
      path: `${pathPrefix}/${Math.floor(i / 100)}/*`,
      origin: i % 10 === 0 ? '*' : `https://app${i}.${domain}`,
      host: `api${Math.floor(i / 100)}.${domain}`,
      methods: [...methods],
      headers: ['Content-Type', 'Authorization'],
      supports_credentials: i % 3 !== 0,
      max_age: [300, 600, 1800, 3600, 7200, 86400][i % 6],
      enabled: i % 20 !== 0, // 95% enabled
      description: `Generated CORS entry ${i} for performance testing`,
      tags: ['generated', 'performance', `batch-${Math.floor(i / 100)}`],
    }));
  }
  
  return entries;
};

// ============================================================================
// VALIDATION TEST DATA
// ============================================================================

/**
 * Invalid CORS configurations for validation testing
 */
export const invalidCorsConfigurations = [
  {
    description: 'Missing required path',
    data: {
      origin: 'https://example.com',
      methods: ['GET'],
      headers: ['Content-Type'],
      supports_credentials: false,
      max_age: 3600,
      enabled: true,
    },
    expectedErrors: ['path'],
  },
  {
    description: 'Invalid path format',
    data: {
      path: 'invalid-path',
      origin: 'https://example.com',
      methods: ['GET'],
      headers: ['Content-Type'],
      supports_credentials: false,
      max_age: 3600,
      enabled: true,
    },
    expectedErrors: ['path'],
  },
  {
    description: 'Missing required origin',
    data: {
      path: '/api/v2/*',
      methods: ['GET'],
      headers: ['Content-Type'],
      supports_credentials: false,
      max_age: 3600,
      enabled: true,
    },
    expectedErrors: ['origin'],
  },
  {
    description: 'Invalid origin format',
    data: {
      path: '/api/v2/*',
      origin: 'invalid-origin',
      methods: ['GET'],
      headers: ['Content-Type'],
      supports_credentials: false,
      max_age: 3600,
      enabled: true,
    },
    expectedErrors: ['origin'],
  },
  {
    description: 'Missing HTTP methods',
    data: {
      path: '/api/v2/*',
      origin: 'https://example.com',
      methods: [],
      headers: ['Content-Type'],
      supports_credentials: false,
      max_age: 3600,
      enabled: true,
    },
    expectedErrors: ['methods'],
  },
  {
    description: 'Invalid HTTP method',
    data: {
      path: '/api/v2/*',
      origin: 'https://example.com',
      methods: ['GET', 'INVALID'],
      headers: ['Content-Type'],
      supports_credentials: false,
      max_age: 3600,
      enabled: true,
    },
    expectedErrors: ['methods'],
  },
  {
    description: 'Invalid max_age value',
    data: {
      path: '/api/v2/*',
      origin: 'https://example.com',
      methods: ['GET'],
      headers: ['Content-Type'],
      supports_credentials: false,
      max_age: -1,
      enabled: true,
    },
    expectedErrors: ['max_age'],
  },
  {
    description: 'Invalid host format',
    data: {
      path: '/api/v2/*',
      origin: 'https://example.com',
      host: 'invalid host name',
      methods: ['GET'],
      headers: ['Content-Type'],
      supports_credentials: false,
      max_age: 3600,
      enabled: true,
    },
    expectedErrors: ['host'],
  },
];

// ============================================================================
// EDGE CASE SCENARIOS
// ============================================================================

/**
 * Edge case CORS configurations for comprehensive testing
 */
export const edgeCaseCorsConfigurations = [
  // Wildcard origin with credentials (should be invalid)
  createMockCorsEntry({
    id: 1001,
    path: '/api/v2/dangerous/*',
    origin: '*',
    methods: ['GET', 'POST'],
    headers: ['Content-Type'],
    supports_credentials: true, // This combination is invalid
    max_age: 3600,
    enabled: true,
    description: 'Invalid wildcard origin with credentials',
    tags: ['invalid', 'security-risk'],
  }),
  
  // Extremely long max_age
  createMockCorsEntry({
    id: 1002,
    path: '/api/v2/long-cache/*',
    origin: 'https://cache.example.com',
    methods: ['GET'],
    headers: ['Content-Type'],
    supports_credentials: false,
    max_age: 86400 * 365, // 1 year (very long)
    enabled: true,
    description: 'Very long cache duration',
    tags: ['long-cache', 'edge-case'],
  }),
  
  // Complex path with wildcards
  createMockCorsEntry({
    id: 1003,
    path: '/api/v2/complex/*/sub/*/endpoint/*',
    origin: 'https://complex.example.com',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
    headers: ['Content-Type', 'Authorization', 'X-Custom-Header-1', 'X-Custom-Header-2'],
    supports_credentials: true,
    max_age: 1,
    enabled: true,
    description: 'Complex path pattern with all methods',
    tags: ['complex', 'all-methods'],
  }),
  
  // Minimal configuration
  createMockCorsEntry({
    id: 1004,
    path: '/minimal',
    origin: 'https://minimal.example.com',
    methods: ['GET'],
    headers: [],
    supports_credentials: false,
    max_age: 0,
    enabled: true,
    description: 'Minimal CORS configuration',
    tags: ['minimal', 'basic'],
  }),
  
  // IPv4 origin
  createMockCorsEntry({
    id: 1005,
    path: '/api/v2/ip/*',
    origin: 'http://192.168.1.100:8080',
    methods: ['GET', 'POST'],
    headers: ['Content-Type'],
    supports_credentials: false,
    max_age: 300,
    enabled: true,
    description: 'IPv4 address origin',
    tags: ['ipv4', 'local'],
  }),
  
  // File protocol origin (for local development)
  createMockCorsEntry({
    id: 1006,
    path: '/api/v2/file/*',
    origin: 'file://',
    methods: ['GET'],
    headers: ['Content-Type'],
    supports_credentials: false,
    max_age: 0,
    enabled: false,
    description: 'File protocol origin (development only)',
    tags: ['file-protocol', 'development'],
  }),
];

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize mock data store with default scenarios
 */
export const initializeMockCorsData = () => {
  mockCorsEntries.length = 0; // Clear existing data
  mockCorsEntries.push(...createCorsScenarios());
};

/**
 * Reset mock data to initial state
 */
export const resetMockCorsData = () => {
  initializeMockCorsData();
};

/**
 * Add edge case scenarios to mock data
 */
export const addEdgeCaseScenarios = () => {
  mockCorsEntries.push(...edgeCaseCorsConfigurations);
};

/**
 * Generate performance test dataset
 */
export const initializePerformanceDataset = (count: number = 1000) => {
  mockCorsEntries.length = 0;
  mockCorsEntries.push(...generateLargeCorsDataset(count));
};

// Initialize with default data
initializeMockCorsData();

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  mockCorsEntries,
  createMockCorsEntry,
  createCorsScenarios,
  generateLargeCorsDataset,
  invalidCorsConfigurations,
  edgeCaseCorsConfigurations,
  initializeMockCorsData,
  resetMockCorsData,
  addEdgeCaseScenarios,
  initializePerformanceDataset,
};