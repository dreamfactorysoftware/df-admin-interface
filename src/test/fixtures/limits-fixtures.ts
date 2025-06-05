/**
 * API limits and rate limiting fixture factory functions that generate realistic 
 * limit configurations and cache data for testing React components.
 * 
 * Provides factory functions for creating limit types, limit table data, and cache 
 * statistics to support testing of API security and rate limiting interfaces.
 */

import { LimitTableRowData } from '../../app/adf-limits/types';

// Types for limit configurations
export interface LimitType {
  id: number;
  name: string;
  type: 'instance' | 'user' | 'service' | 'role';
  rate: number;
  period: 'minute' | 'hour' | 'day' | 'month';
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LimitCache {
  limitId: number;
  remaining: number;
  used: number;
  totalAllowed: number;
  resetTime: string;
  periodStart: string;
  periodEnd: string;
  hitRate: number;
  lastRequest: string;
}

export interface LimitUsageStats {
  limitId: number;
  requests: number;
  allowed: number;
  blocked: number;
  averageUsage: number;
  peakUsage: number;
  lastReset: string;
}

// Factory function options
export interface LimitTypeFactoryOptions {
  id?: number;
  name?: string;
  type?: 'instance' | 'user' | 'service' | 'role';
  rate?: number;
  period?: 'minute' | 'hour' | 'day' | 'month';
  active?: boolean;
  userId?: number | null;
  serviceId?: number | null;
  roleId?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface LimitTableRowDataFactoryOptions {
  id?: number;
  name?: string;
  limitType?: string;
  rate?: number;
  period?: string;
  counter?: number;
  user?: number | null;
  service?: number | null;
  role?: number | null;
  active?: boolean;
}

export interface LimitCacheFactoryOptions {
  limitId?: number;
  remaining?: number;
  used?: number;
  totalAllowed?: number;
  resetTime?: string;
  periodStart?: string;
  periodEnd?: string;
  hitRate?: number;
  lastRequest?: string;
}

// Utility functions
const generateRandomId = (): number => Math.floor(Math.random() * 10000) + 1;

const generateRandomName = (type: string): string => {
  const names = {
    instance: ['System-wide API Limit', 'Global Rate Limit', 'Instance-wide Throttle'],
    user: ['User API Quota', 'Per-User Rate Limit', 'User Request Limit'],
    service: ['Database Service Limit', 'API Service Throttle', 'Service Rate Control'],
    role: ['Admin Role Limit', 'User Role Quota', 'Role-based Throttle']
  };
  
  const typeNames = names[type as keyof typeof names] || names.instance;
  return typeNames[Math.floor(Math.random() * typeNames.length)];
};

const formatLimitRate = (rate: number, period: string): string => {
  return `${rate} requests per ${period}`;
};

const formatLimitCounter = (used: number, total: number): string => {
  return `${used}/${total} requests`;
};

const calculateResetTime = (period: string): string => {
  const now = new Date();
  switch (period) {
    case 'minute':
      now.setMinutes(now.getMinutes() + 1);
      now.setSeconds(0);
      break;
    case 'hour':
      now.setHours(now.getHours() + 1);
      now.setMinutes(0);
      now.setSeconds(0);
      break;
    case 'day':
      now.setDate(now.getDate() + 1);
      now.setHours(0);
      now.setMinutes(0);
      now.setSeconds(0);
      break;
    case 'month':
      now.setMonth(now.getMonth() + 1);
      now.setDate(1);
      now.setHours(0);
      now.setMinutes(0);
      now.setSeconds(0);
      break;
    default:
      now.setHours(now.getHours() + 1);
  }
  return now.toISOString();
};

const calculatePeriodStart = (period: string): string => {
  const now = new Date();
  switch (period) {
    case 'minute':
      now.setSeconds(0);
      break;
    case 'hour':
      now.setMinutes(0);
      now.setSeconds(0);
      break;
    case 'day':
      now.setHours(0);
      now.setMinutes(0);
      now.setSeconds(0);
      break;
    case 'month':
      now.setDate(1);
      now.setHours(0);
      now.setMinutes(0);
      now.setSeconds(0);
      break;
  }
  return now.toISOString();
};

/**
 * Factory function for creating LimitType objects with configurable parameters
 * Generates API rate limits with various period configurations (minute, hour, day)
 */
export const limitTypeFactory = (options: LimitTypeFactoryOptions = {}): LimitType => {
  const type = options.type || 'instance';
  const period = options.period || 'hour';
  const rate = options.rate || (period === 'minute' ? 60 : period === 'hour' ? 1000 : 10000);
  const now = new Date().toISOString();

  return {
    id: options.id ?? generateRandomId(),
    name: options.name ?? generateRandomName(type),
    type,
    rate,
    period,
    active: options.active ?? true,
    created_at: options.createdAt ?? now,
    updated_at: options.updatedAt ?? now,
  };
};

/**
 * Factory function for creating LimitTableRowData objects for table display
 * Generates table display data with proper formatting for UI components
 */
export const limitTableRowDataFactory = (options: LimitTableRowDataFactoryOptions = {}): LimitTableRowData => {
  const period = options.period || 'hour';
  const rate = options.rate || (period === 'minute' ? 60 : period === 'hour' ? 1000 : 10000);
  const used = options.counter || Math.floor(Math.random() * rate * 0.8);
  
  // Determine limit type based on which ID is provided
  let limitType = options.limitType;
  if (!limitType) {
    if (options.user) limitType = 'User';
    else if (options.service) limitType = 'Service';
    else if (options.role) limitType = 'Role';
    else limitType = 'Instance';
  }

  return {
    id: options.id ?? generateRandomId(),
    name: options.name ?? generateRandomName(limitType.toLowerCase()),
    limitType,
    limitRate: formatLimitRate(rate, period),
    limitCounter: formatLimitCounter(used, rate),
    user: options.user ?? null,
    service: options.service ?? null,
    role: options.role ?? null,
    active: options.active ?? true,
  };
};

/**
 * Factory function for creating LimitCache objects for cache statistics
 * Generates cache statistics and remaining quota calculations
 */
export const limitCacheFactory = (options: LimitCacheFactoryOptions = {}): LimitCache => {
  const limitId = options.limitId ?? generateRandomId();
  const totalAllowed = options.totalAllowed ?? 1000;
  const used = options.used ?? Math.floor(Math.random() * totalAllowed * 0.7);
  const remaining = options.remaining ?? (totalAllowed - used);
  const period = 'hour'; // Default period for cache calculations
  const now = new Date();

  return {
    limitId,
    remaining: Math.max(0, remaining),
    used,
    totalAllowed,
    resetTime: options.resetTime ?? calculateResetTime(period),
    periodStart: options.periodStart ?? calculatePeriodStart(period),
    periodEnd: options.resetTime ?? calculateResetTime(period),
    hitRate: options.hitRate ?? Math.round((used / totalAllowed) * 100),
    lastRequest: options.lastRequest ?? new Date(now.getTime() - Math.random() * 3600000).toISOString(),
  };
};

/**
 * Factory function for creating LimitUsageStats objects
 * Generates usage statistics for monitoring and analytics
 */
export const limitUsageStatsFactory = (limitId?: number): LimitUsageStats => {
  const requests = Math.floor(Math.random() * 10000) + 100;
  const blocked = Math.floor(requests * (Math.random() * 0.1)); // 0-10% blocked
  const allowed = requests - blocked;
  
  return {
    limitId: limitId ?? generateRandomId(),
    requests,
    allowed,
    blocked,
    averageUsage: Math.round((requests / 24) * 10) / 10, // Average per hour over 24 hours
    peakUsage: Math.round(requests * (1.5 + Math.random() * 0.5)), // 1.5-2x average
    lastReset: new Date(Date.now() - Math.random() * 86400000).toISOString(), // Within last 24 hours
  };
};

/**
 * Create multiple limit configurations for testing list scenarios
 */
export const createLimitsList = (count: number = 5): LimitTableRowData[] => {
  const limits: LimitTableRowData[] = [];
  const types = ['instance', 'user', 'service', 'role'] as const;
  const periods = ['minute', 'hour', 'day'] as const;

  for (let i = 0; i < count; i++) {
    const type = types[i % types.length];
    const period = periods[i % periods.length];
    
    limits.push(limitTableRowDataFactory({
      id: i + 1,
      period,
      active: Math.random() > 0.2, // 80% active
      user: type === 'user' ? Math.floor(Math.random() * 100) + 1 : null,
      service: type === 'service' ? Math.floor(Math.random() * 10) + 1 : null,
      role: type === 'role' ? Math.floor(Math.random() * 5) + 1 : null,
    }));
  }

  return limits;
};

/**
 * Create cache data for multiple limits
 */
export const createLimitCachesList = (limitIds: number[]): LimitCache[] => {
  return limitIds.map(limitId => limitCacheFactory({ limitId }));
};

/**
 * Create scenario-specific test data
 */
export const createLimitScenarios = () => {
  return {
    // Heavy usage scenario - near limits
    heavyUsage: limitTableRowDataFactory({
      name: 'Heavy API Usage',
      rate: 1000,
      period: 'hour',
      counter: 950, // 95% used
      active: true,
    }),

    // Exceeded limit scenario
    exceededLimit: limitTableRowDataFactory({
      name: 'Exceeded Limit',
      rate: 500,
      period: 'hour',
      counter: 500, // 100% used
      active: true,
    }),

    // Inactive limit scenario
    inactiveLimit: limitTableRowDataFactory({
      name: 'Inactive Limit',
      rate: 1000,
      period: 'day',
      counter: 0,
      active: false,
    }),

    // Low usage scenario
    lowUsage: limitTableRowDataFactory({
      name: 'Low API Usage',
      rate: 10000,
      period: 'day',
      counter: 100, // 1% used
      active: true,
    }),

    // User-specific limit
    userLimit: limitTableRowDataFactory({
      name: 'User John Doe Limit',
      limitType: 'User',
      rate: 200,
      period: 'hour',
      counter: 45,
      user: 123,
      active: true,
    }),

    // Service-specific limit
    serviceLimit: limitTableRowDataFactory({
      name: 'Database Service Limit',
      limitType: 'Service',
      rate: 5000,
      period: 'hour',
      counter: 1200,
      service: 456,
      active: true,
    }),

    // Role-based limit
    roleLimit: limitTableRowDataFactory({
      name: 'Admin Role Limit',
      limitType: 'Role',
      rate: 50000,
      period: 'day',
      counter: 8500,
      role: 1,
      active: true,
    }),
  };
};

/**
 * Create error scenarios for testing edge cases
 */
export const createLimitErrorScenarios = () => {
  return {
    // Zero rate limit
    zeroRate: limitTableRowDataFactory({
      name: 'Zero Rate Limit',
      rate: 0,
      period: 'hour',
      counter: 0,
      active: false,
    }),

    // Very high usage
    highUsage: limitTableRowDataFactory({
      name: 'High Usage Limit',
      rate: 100,
      period: 'minute',
      counter: 150, // Over limit
      active: true,
    }),

    // Expired limit cache
    expiredCache: limitCacheFactory({
      resetTime: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      remaining: 0,
      used: 1000,
      totalAllowed: 1000,
    }),
  };
};

/**
 * Default exports for common testing scenarios
 */
export const mockLimitTypes = (): LimitType[] => [
  limitTypeFactory({ id: 1, type: 'instance', rate: 10000, period: 'hour' }),
  limitTypeFactory({ id: 2, type: 'user', rate: 1000, period: 'hour' }),
  limitTypeFactory({ id: 3, type: 'service', rate: 5000, period: 'hour' }),
  limitTypeFactory({ id: 4, type: 'role', rate: 50000, period: 'day' }),
];

export const mockTableData = (): LimitTableRowData[] => createLimitsList(10);

export const mockLimitCache = (): LimitCache[] => createLimitCachesList([1, 2, 3, 4]);

// Export specific factory functions for external use
export { 
  limitTypeFactory,
  limitTableRowDataFactory, 
  limitCacheFactory,
  limitUsageStatsFactory,
  createLimitsList,
  createLimitCachesList,
  createLimitScenarios,
  createLimitErrorScenarios,
};