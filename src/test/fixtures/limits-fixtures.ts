/**
 * API Limits and Rate Limiting Test Fixtures
 * 
 * Factory functions for generating realistic limit configurations and cache data 
 * for testing React components. Provides comprehensive fixture support for API 
 * security and rate limiting interfaces with configurable parameters and realistic 
 * data scenarios.
 * 
 * Supports testing of limits management UI components, rate limit calculations,
 * cache statistics, and various limit types including user, service, role-based,
 * and global API limits with different period configurations.
 * 
 * @fileoverview Limit fixtures for DreamFactory admin interface testing
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import type {
  LimitTableRowData,
  LimitConfiguration,
  LimitUsageStats,
  LimitType,
  LimitCounterType,
  LimitPeriodUnit
} from '../../app/adf-limits/types';

// ============================================================================
// Configuration Types and Constants
// ============================================================================

/**
 * Factory configuration options for limit generation
 */
export interface LimitFactoryOptions {
  /** Generate active or inactive limits */
  active?: boolean;
  /** Include usage statistics */
  includeUsage?: boolean;
  /** Specific limit type to generate */
  limitType?: LimitType;
  /** Period configuration */
  period?: {
    value: number;
    unit: LimitPeriodUnit;
  };
  /** Rate value override */
  rateValue?: number;
  /** Associated user ID */
  userId?: number | null;
  /** Associated service ID */
  serviceId?: number | null;
  /** Associated role ID */
  roleId?: number | null;
  /** Current usage percentage (0-100) */
  usagePercentage?: number;
  /** Include advanced options */
  includeAdvancedOptions?: boolean;
  /** Include scope configuration */
  includeScope?: boolean;
}

/**
 * Cache statistics generation options
 */
export interface CacheFactoryOptions {
  /** Limit ID for cache association */
  limitId: number;
  /** Current usage percentage (0-100) */
  usagePercentage?: number;
  /** Time until reset in seconds */
  timeUntilReset?: number;
  /** Number of violations */
  violations?: number;
  /** Include historical data */
  includeHistory?: boolean;
  /** History period count */
  historyPeriods?: number;
}

/**
 * Bulk table data generation options
 */
export interface BulkTableDataOptions {
  /** Number of records to generate */
  count?: number;
  /** Mix of active/inactive limits */
  activeMix?: boolean;
  /** Include different limit types */
  typeMix?: boolean;
  /** Include user/service/role associations */
  associationMix?: boolean;
  /** Include current usage data */
  includeUsage?: boolean;
}

// Default values for various configurations
const DEFAULT_RATE_VALUES = [10, 50, 100, 500, 1000, 5000, 10000];
const DEFAULT_PERIOD_VALUES = [1, 5, 15, 30, 60];
const AVAILABLE_LIMIT_TYPES: LimitType[] = [
  'api.calls_per_period',
  'api.calls_per_minute',
  'api.calls_per_hour',
  'api.calls_per_day',
  'db.calls_per_period',
  'service.calls_per_period',
  'user.calls_per_period'
];
const AVAILABLE_COUNTER_TYPES: LimitCounterType[] = [
  'api.calls_made',
  'db.calls_made',
  'service.calls_made',
  'user.calls_made'
];
const AVAILABLE_PERIOD_UNITS: LimitPeriodUnit[] = ['minute', 'hour', 'day', 'week', 'month'];

// ============================================================================
// Core Factory Functions
// ============================================================================

/**
 * Creates a base limit table row with default values
 * Provides foundation for all other limit factories
 */
export const createBaseLimitTableRow = (
  id: number,
  overrides: Partial<LimitTableRowData> = {}
): LimitTableRowData => {
  const now = new Date().toISOString();
  
  const baseLimit: LimitTableRowData = {
    id,
    name: `api-limit-${id}`,
    limitType: 'api.calls_per_hour',
    limitRate: '1000 per hour',
    limitCounter: 'api.calls_made',
    user: null,
    service: null,
    role: null,
    active: true,
    description: `API rate limit ${id} for testing purposes`,
    createdAt: now,
    updatedAt: now,
    createdBy: 'system',
    currentUsage: 0,
    period: {
      value: 1,
      unit: 'hour'
    }
  };

  return { ...baseLimit, ...overrides };
};

/**
 * Factory function for generating API rate limit types with various configurations
 * Supports minute, hour, day, week, and month periods with realistic rate values
 */
export const limitTypeFactory = (options: LimitFactoryOptions = {}): LimitTableRowData => {
  const {
    active = true,
    limitType = 'api.calls_per_hour',
    period = { value: 1, unit: 'hour' },
    rateValue = 1000,
    userId = null,
    serviceId = null,
    roleId = null,
    usagePercentage = 0
  } = options;

  // Determine counter type based on limit type
  const counterType: LimitCounterType = limitType.includes('api.') ? 'api.calls_made' :
                                       limitType.includes('db.') ? 'db.calls_made' :
                                       limitType.includes('service.') ? 'service.calls_made' :
                                       'user.calls_made';

  // Generate realistic limit name based on type and associations
  let limitName = 'API Rate Limit';
  if (userId) limitName = `User ${userId} API Limit`;
  if (serviceId) limitName = `Service ${serviceId} Limit`;
  if (roleId) limitName = `Role ${roleId} API Limit`;
  if (!userId && !serviceId && !roleId) limitName = 'Global API Limit';

  // Format rate string
  const pluralUnit = period.value === 1 ? period.unit : `${period.unit}s`;
  const rateString = `${rateValue} per ${period.value > 1 ? `${period.value} ` : ''}${pluralUnit}`;

  // Calculate current usage
  const currentUsage = Math.floor((rateValue * usagePercentage) / 100);

  // Generate unique ID based on associations
  const id = userId || serviceId || roleId || Math.floor(Math.random() * 1000) + 1;

  return createBaseLimitTableRow(id, {
    name: limitName,
    limitType,
    limitRate: rateString,
    limitCounter: counterType,
    user: userId,
    service: serviceId,
    role: roleId,
    active,
    currentUsage,
    period,
    description: `${limitType} limit for ${userId ? 'user' : serviceId ? 'service' : roleId ? 'role' : 'global'} access`
  });
};

/**
 * Factory function for generating table display data with proper formatting
 * Creates realistic limit table rows for testing UI components
 */
export const limitTableRowDataFactory = (
  count: number = 1,
  options: BulkTableDataOptions = {}
): LimitTableRowData[] => {
  const {
    activeMix = true,
    typeMix = true,
    associationMix = true,
    includeUsage = true
  } = options;

  const limits: LimitTableRowData[] = [];

  for (let i = 1; i <= count; i++) {
    const factoryOptions: LimitFactoryOptions = {
      active: activeMix ? i % 3 !== 0 : true, // ~33% inactive when mixed
      includeUsage,
      usagePercentage: includeUsage ? Math.floor(Math.random() * 100) : 0
    };

    // Mix limit types if requested
    if (typeMix) {
      factoryOptions.limitType = AVAILABLE_LIMIT_TYPES[i % AVAILABLE_LIMIT_TYPES.length];
    }

    // Mix period configurations
    if (typeMix) {
      const periodUnit = AVAILABLE_PERIOD_UNITS[i % AVAILABLE_PERIOD_UNITS.length];
      const periodValue = DEFAULT_PERIOD_VALUES[i % DEFAULT_PERIOD_VALUES.length];
      factoryOptions.period = { value: periodValue, unit: periodUnit };
      factoryOptions.rateValue = DEFAULT_RATE_VALUES[i % DEFAULT_RATE_VALUES.length];
    }

    // Mix associations if requested
    if (associationMix) {
      const associationType = i % 4;
      switch (associationType) {
        case 0: // Global limit
          break;
        case 1: // User limit
          factoryOptions.userId = i;
          break;
        case 2: // Service limit
          factoryOptions.serviceId = i;
          break;
        case 3: // Role limit
          factoryOptions.roleId = i;
          break;
      }
    }

    limits.push(limitTypeFactory(factoryOptions));
  }

  return limits;
};

/**
 * Factory function for generating cache statistics and remaining quota calculations
 * Provides realistic usage metrics for testing quota tracking interfaces
 */
export const limitCacheFactory = (options: CacheFactoryOptions): LimitUsageStats => {
  const {
    limitId,
    usagePercentage = 25,
    timeUntilReset = 3600,
    violations = 0,
    includeHistory = false,
    historyPeriods = 7
  } = options;

  // Calculate realistic usage values
  const maxAllowed = DEFAULT_RATE_VALUES[Math.floor(Math.random() * DEFAULT_RATE_VALUES.length)];
  const currentUsage = Math.floor((maxAllowed * usagePercentage) / 100);

  const cacheStats: LimitUsageStats = {
    limitId,
    currentUsage,
    maxAllowed,
    usagePercentage,
    timeUntilReset,
    violations
  };

  // Generate historical data if requested
  if (includeHistory) {
    cacheStats.history = [];
    for (let i = historyPeriods; i > 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      cacheStats.history.push({
        period: date.toISOString().split('T')[0],
        usage: Math.floor(Math.random() * maxAllowed),
        violations: Math.floor(Math.random() * 5)
      });
    }
  }

  return cacheStats;
};

/**
 * Factory function for generating comprehensive limit configurations
 * Supports advanced options and scope configurations for detailed testing
 */
export const limitConfigurationFactory = (options: LimitFactoryOptions = {}): LimitConfiguration => {
  const {
    limitType = 'api.calls_per_hour',
    period = { value: 1, unit: 'hour' },
    rateValue = 1000,
    userId = null,
    serviceId = null,
    roleId = null,
    active = true,
    includeAdvancedOptions = false,
    includeScope = false
  } = options;

  const counterType: LimitCounterType = limitType.includes('api.') ? 'api.calls_made' :
                                       limitType.includes('db.') ? 'db.calls_made' :
                                       limitType.includes('service.') ? 'service.calls_made' :
                                       'user.calls_made';

  // Generate limit name based on associations
  let name = 'API Rate Limit';
  if (userId) name = `User ${userId} API Limit`;
  if (serviceId) name = `Service ${serviceId} Limit`;
  if (roleId) name = `Role ${roleId} API Limit`;

  const config: LimitConfiguration = {
    name,
    limitType,
    limitCounter: counterType,
    rateValue,
    period,
    user: userId,
    service: serviceId,
    role: roleId,
    active,
    description: `${limitType} configuration for testing purposes`
  };

  // Add advanced options if requested
  if (includeAdvancedOptions) {
    config.options = {
      allowBurst: true,
      burstMultiplier: 2,
      resetTime: '00:00',
      errorMessage: 'Rate limit exceeded. Please try again later.',
      priority: 5
    };
  }

  // Add scope configuration if requested
  if (includeScope) {
    config.scope = {
      endpoints: ['/api/v2/users', '/api/v2/data'],
      methods: ['GET', 'POST'],
      ipRestrictions: ['192.168.1.0/24']
    };
  }

  return config;
};

// ============================================================================
// Specialized Factory Functions
// ============================================================================

/**
 * Creates user-specific API limits with realistic configurations
 */
export const createUserLimit = (
  userId: number,
  options: Partial<LimitFactoryOptions> = {}
): LimitTableRowData => {
  return limitTypeFactory({
    limitType: 'user.calls_per_period',
    period: { value: 1, unit: 'hour' },
    rateValue: 1000,
    userId,
    active: true,
    usagePercentage: 30,
    ...options
  });
};

/**
 * Creates service-specific API limits with database call tracking
 */
export const createServiceLimit = (
  serviceId: number,
  options: Partial<LimitFactoryOptions> = {}
): LimitTableRowData => {
  return limitTypeFactory({
    limitType: 'service.calls_per_period',
    period: { value: 1, unit: 'hour' },
    rateValue: 5000,
    serviceId,
    active: true,
    usagePercentage: 45,
    ...options
  });
};

/**
 * Creates role-based API limits for group permissions
 */
export const createRoleLimit = (
  roleId: number,
  options: Partial<LimitFactoryOptions> = {}
): LimitTableRowData => {
  return limitTypeFactory({
    limitType: 'api.calls_per_hour',
    period: { value: 1, unit: 'hour' },
    rateValue: 2000,
    roleId,
    active: true,
    usagePercentage: 60,
    ...options
  });
};

/**
 * Creates global API limits for instance-wide rate limiting
 */
export const createInstanceLimit = (options: Partial<LimitFactoryOptions> = {}): LimitTableRowData => {
  return limitTypeFactory({
    limitType: 'api.calls_per_minute',
    period: { value: 1, unit: 'minute' },
    rateValue: 100,
    active: true,
    usagePercentage: 15,
    ...options
  });
};

/**
 * Creates database-specific limits for protecting database resources
 */
export const createDatabaseLimit = (
  serviceId: number,
  options: Partial<LimitFactoryOptions> = {}
): LimitTableRowData => {
  return limitTypeFactory({
    limitType: 'db.calls_per_period',
    period: { value: 1, unit: 'hour' },
    rateValue: 10000,
    serviceId,
    active: true,
    usagePercentage: 25,
    ...options
  });
};

// ============================================================================
// Rate Limit Calculation Utilities
// ============================================================================

/**
 * Calculates remaining quota for a given limit and current usage
 */
export const calculateRemainingQuota = (limit: LimitTableRowData): number => {
  const rateValue = extractRateValue(limit.limitRate);
  return Math.max(0, rateValue - (limit.currentUsage || 0));
};

/**
 * Calculates usage percentage for display purposes
 */
export const calculateUsagePercentage = (limit: LimitTableRowData): number => {
  const rateValue = extractRateValue(limit.limitRate);
  if (rateValue === 0) return 0;
  return Math.min(100, Math.round(((limit.currentUsage || 0) / rateValue) * 100));
};

/**
 * Determines if a limit is near its threshold (>80% usage)
 */
export const isLimitNearThreshold = (limit: LimitTableRowData): boolean => {
  return calculateUsagePercentage(limit) >= 80;
};

/**
 * Determines if a limit has been exceeded
 */
export const isLimitExceeded = (limit: LimitTableRowData): boolean => {
  return calculateUsagePercentage(limit) >= 100;
};

/**
 * Estimates time until limit reset based on period configuration
 */
export const estimateResetTime = (limit: LimitTableRowData): number => {
  if (!limit.period) return 3600; // Default 1 hour

  const { value, unit } = limit.period;
  const multipliers = {
    minute: 60,
    hour: 3600,
    day: 86400,
    week: 604800,
    month: 2592000
  };

  return value * multipliers[unit];
};

/**
 * Extracts numeric rate value from formatted rate string
 */
export const extractRateValue = (rateString: string): number => {
  const match = rateString.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
};

/**
 * Formats rate value and period into human-readable string
 */
export const formatRateString = (
  rateValue: number,
  period: { value: number; unit: LimitPeriodUnit }
): string => {
  const pluralUnit = period.value === 1 ? period.unit : `${period.unit}s`;
  return `${rateValue} per ${period.value > 1 ? `${period.value} ` : ''}${pluralUnit}`;
};

// ============================================================================
// Scenario-Based Test Data Collections
// ============================================================================

/**
 * Creates a collection of limits for testing different states and scenarios
 */
export const createLimitTestScenarios = () => {
  return {
    // Active limits with different usage levels
    lowUsage: createUserLimit(1, { usagePercentage: 10 }),
    moderateUsage: createServiceLimit(1, { usagePercentage: 50 }),
    highUsage: createRoleLimit(1, { usagePercentage: 85 }),
    exceeded: createInstanceLimit({ usagePercentage: 100 }),

    // Inactive limits
    inactiveUser: createUserLimit(2, { active: false }),
    inactiveService: createServiceLimit(2, { active: false }),

    // Different time periods
    minuteLimit: limitTypeFactory({
      limitType: 'api.calls_per_minute',
      period: { value: 1, unit: 'minute' },
      rateValue: 10
    }),
    hourlyLimit: limitTypeFactory({
      limitType: 'api.calls_per_hour',
      period: { value: 1, unit: 'hour' },
      rateValue: 1000
    }),
    dailyLimit: limitTypeFactory({
      limitType: 'api.calls_per_day',
      period: { value: 1, unit: 'day' },
      rateValue: 10000
    }),
    weeklyLimit: limitTypeFactory({
      limitType: 'api.calls_per_period',
      period: { value: 1, unit: 'week' },
      rateValue: 50000
    }),
    monthlyLimit: limitTypeFactory({
      limitType: 'api.calls_per_period',
      period: { value: 1, unit: 'month' },
      rateValue: 200000
    }),

    // Database-specific limits
    databaseLimit: createDatabaseLimit(3),
    
    // Custom period configurations
    customPeriod: limitTypeFactory({
      period: { value: 15, unit: 'minute' },
      rateValue: 150
    }),

    // Limits with advanced options
    advancedLimit: limitConfigurationFactory({
      includeAdvancedOptions: true,
      includeScope: true
    }),

    // Global limits
    globalApiLimit: createInstanceLimit(),
    globalDbLimit: limitTypeFactory({
      limitType: 'db.calls_per_period',
      period: { value: 1, unit: 'hour' },
      rateValue: 50000
    })
  };
};

/**
 * Creates cache statistics for testing quota monitoring interfaces
 */
export const createCacheTestScenarios = () => {
  const scenarios = createLimitTestScenarios();
  
  return {
    lowUsageCache: limitCacheFactory({
      limitId: scenarios.lowUsage.id,
      usagePercentage: 10,
      timeUntilReset: 3540,
      violations: 0,
      includeHistory: true
    }),
    moderateUsageCache: limitCacheFactory({
      limitId: scenarios.moderateUsage.id,
      usagePercentage: 50,
      timeUntilReset: 1800,
      violations: 2,
      includeHistory: true
    }),
    highUsageCache: limitCacheFactory({
      limitId: scenarios.highUsage.id,
      usagePercentage: 85,
      timeUntilReset: 900,
      violations: 15,
      includeHistory: true
    }),
    exceededCache: limitCacheFactory({
      limitId: scenarios.exceeded.id,
      usagePercentage: 100,
      timeUntilReset: 300,
      violations: 50,
      includeHistory: true,
      historyPeriods: 14
    })
  };
};

/**
 * Creates comprehensive test data for limits management table testing
 */
export const createLimitsTableTestData = (options: BulkTableDataOptions = {}) => {
  const { count = 20 } = options;
  
  return {
    // Standard mixed data
    mixedLimits: limitTableRowDataFactory(count, {
      activeMix: true,
      typeMix: true,
      associationMix: true,
      includeUsage: true
    }),
    
    // All active limits
    activeLimits: limitTableRowDataFactory(10, {
      activeMix: false,
      typeMix: true,
      associationMix: true,
      includeUsage: true
    }),
    
    // User-only limits
    userLimits: Array.from({ length: 5 }, (_, i) => 
      createUserLimit(i + 1, { usagePercentage: (i + 1) * 20 })
    ),
    
    // Service-only limits
    serviceLimits: Array.from({ length: 5 }, (_, i) =>
      createServiceLimit(i + 1, { usagePercentage: (i + 1) * 15 })
    ),
    
    // High-usage limits for alert testing
    alertLimits: Array.from({ length: 3 }, (_, i) =>
      limitTypeFactory({ usagePercentage: 90 + i * 3 })
    ),
    
    // Empty state
    emptyLimits: []
  };
};

// ============================================================================
// Legacy Support and Migration Helpers
// ============================================================================

/**
 * Legacy mock data structure for backward compatibility
 * @deprecated Use factory functions instead
 */
export const mockLimitTypes = createLimitTestScenarios();

/**
 * Legacy table data structure for backward compatibility
 * @deprecated Use limitTableRowDataFactory instead
 */
export const mockTableData = limitTableRowDataFactory(10);

// Export all factory functions and utilities for comprehensive testing support
export {
  // Core factories
  limitTypeFactory,
  limitTableRowDataFactory,
  limitCacheFactory,
  limitConfigurationFactory,
  
  // Specialized factories
  createUserLimit,
  createServiceLimit,
  createRoleLimit,
  createInstanceLimit,
  createDatabaseLimit,
  
  // Utility functions
  calculateRemainingQuota,
  calculateUsagePercentage,
  isLimitNearThreshold,
  isLimitExceeded,
  estimateResetTime,
  extractRateValue,
  formatRateString,
  
  // Test scenario collections
  createLimitTestScenarios,
  createCacheTestScenarios,
  createLimitsTableTestData
};