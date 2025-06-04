/**
 * Rate Limiting Types for React/Next.js refactor of DreamFactory Admin Interface
 * 
 * Provides comprehensive type definitions for API rate limiting configurations,
 * cache management, and enforcement rules. Supports all DreamFactory limit types
 * with React Query optimization and server-side rendering capabilities.
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

import { z } from 'zod'
import type { ApiListResponse, ApiCreateResponse, ApiUpdateResponse, ApiDeleteResponse } from './api'
import type { RoleType } from './user'
import type { ServiceType } from './services'
import type { UserProfile } from './user'

// =============================================================================
// CORE LIMIT TYPES
// =============================================================================

/**
 * Cache limit entry for tracking rate limit usage
 */
export interface CacheLimitType {
  id: number
  key: string
  max: number
  attempts: number
  remaining: number
  reset_time?: string  // ISO 8601 timestamp
  window_start?: string  // ISO 8601 timestamp
}

/**
 * Complete limit configuration with relationships
 * Extends the original Angular interface with enhanced React Query support
 */
export interface LimitType {
  // Core identification
  id: number
  name: string
  description: string
  
  // Timing and enforcement
  isActive: boolean
  rate: number
  period: string  // 'minute', 'hour', 'day', '7-day', '30-day'
  type: string    // 'api', 'user', 'role', 'service', 'endpoint'
  
  // Target configuration
  endpoint: string | null
  verb: string | null     // HTTP method restriction
  serviceId: number | null
  roleId: number | null
  userId: number | null
  
  // Metadata
  keyText: string
  createdDate: string      // ISO 8601 timestamp
  lastModifiedDate: string // ISO 8601 timestamp
  
  // Relationships (populated with 'related' parameter)
  limitCacheByLimitId: CacheLimitType[]
  roleByRoleId: RoleType | null
  serviceByServiceId: ServiceType | null
  userByUserId: UserProfile | null
}

/**
 * Simplified limit data for table display
 * Used by manage limits table and list components
 */
export interface LimitTableRowData {
  id: number
  name: string
  limitType: string
  limitRate: string
  limitCounter: string
  user: number | null
  service: number | null
  role: number | null
  active: boolean
  
  // Enhanced fields for React components
  description?: string
  period?: string
  endpoint?: string
  verb?: string
  createdDate?: string
  lastModifiedDate?: string
}

/**
 * Payload for creating new rate limits
 */
export interface CreateLimitPayload {
  name: string
  description: string | null
  type: string
  rate: string                // String to support form validation
  period: string
  isActive: boolean
  
  // Target configuration
  endpoint: string | null
  verb: string | null
  serviceId: number | null
  roleId: number | null
  userId: number | null
  
  // Cache initialization
  cacheData: object
}

/**
 * Payload for updating existing rate limits
 */
export interface UpdateLimitPayload extends Omit<CreateLimitPayload, 'cacheData' | 'rate'> {
  id: number
  rate: number               // Numeric for actual updates
  createdDate: string
  lastModifiedDate: string
}

/**
 * Partial update payload for optimistic updates
 */
export interface PatchLimitPayload extends Partial<Omit<UpdateLimitPayload, 'id'>> {
  id: number
}

// =============================================================================
// RATE LIMITING CONFIGURATION
// =============================================================================

/**
 * Rate limit periods with descriptive labels
 */
export const RATE_LIMIT_PERIODS = {
  'minute': { label: 'Per Minute', seconds: 60 },
  'hour': { label: 'Per Hour', seconds: 3600 },
  'day': { label: 'Per Day', seconds: 86400 },
  '7-day': { label: 'Per Week', seconds: 604800 },
  '30-day': { label: 'Per Month', seconds: 2592000 },
} as const

export type RateLimitPeriod = keyof typeof RATE_LIMIT_PERIODS

/**
 * Rate limit types with configuration
 */
export const RATE_LIMIT_TYPES = {
  'api': { label: 'API-wide', requires: [] },
  'user': { label: 'Per User', requires: ['userId'] },
  'role': { label: 'Per Role', requires: ['roleId'] },
  'service': { label: 'Per Service', requires: ['serviceId'] },
  'endpoint': { label: 'Per Endpoint', requires: ['endpoint', 'verb'] },
} as const

export type RateLimitType = keyof typeof RATE_LIMIT_TYPES

/**
 * HTTP verbs for endpoint-specific limits
 */
export const HTTP_VERBS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const
export type HttpVerb = typeof HTTP_VERBS[number]

// =============================================================================
// QUERY AND MUTATION TYPES
// =============================================================================

/**
 * Query parameters for limit listing
 */
export interface LimitListParams {
  limit?: number
  offset?: number
  sort?: string
  filter?: string
  search?: string
  related?: string | string[]
  include_count?: boolean
  
  // Rate limiting specific filters
  active_only?: boolean
  limit_type?: RateLimitType
  service_id?: number
  role_id?: number
  user_id?: number
}

/**
 * Query key factory for React Query
 */
export const limitQueryKeys = {
  all: ['limits'] as const,
  lists: () => [...limitQueryKeys.all, 'list'] as const,
  list: (params: LimitListParams) => [...limitQueryKeys.lists(), params] as const,
  details: () => [...limitQueryKeys.all, 'detail'] as const,
  detail: (id: number | string) => [...limitQueryKeys.details(), id] as const,
  cache: () => [...limitQueryKeys.all, 'cache'] as const,
  cacheByLimit: (limitId: number) => [...limitQueryKeys.cache(), limitId] as const,
} as const

/**
 * Mutation types for React Query
 */
export interface LimitMutations {
  create: (payload: CreateLimitPayload) => Promise<ApiCreateResponse>
  update: (payload: UpdateLimitPayload) => Promise<ApiUpdateResponse>
  patch: (payload: PatchLimitPayload) => Promise<ApiUpdateResponse>
  delete: (id: number) => Promise<ApiDeleteResponse>
  toggle: (id: number, isActive: boolean) => Promise<ApiUpdateResponse>
  clearCache: (id: number) => Promise<ApiDeleteResponse>
}

// =============================================================================
// PAYWALL INTEGRATION
// =============================================================================

/**
 * Paywall status for rate limiting features
 */
export interface PaywallStatus {
  isLocked: boolean
  licenseType: 'OPEN_SOURCE' | 'SILVER' | 'GOLD'
  feature: string
  upgradeUrl?: string
  message?: string
}

/**
 * Subscription hook configuration
 */
export interface SubscriptionConfig {
  feature: string
  resource?: string | string[]
  required_license?: 'SILVER' | 'GOLD'
  fallback_component?: React.ComponentType
}

// =============================================================================
// HOOK CONFIGURATION
// =============================================================================

/**
 * Rate limiting hook configuration
 */
export interface RateLimitingConfig {
  // Cache configuration
  staleTime?: number      // 5 minutes default
  cacheTime?: number      // 15 minutes default
  
  // Query configuration
  refetchOnWindowFocus?: boolean
  refetchOnReconnect?: boolean
  retry?: number | boolean
  retryDelay?: number
  
  // Optimistic updates
  enableOptimisticUpdates?: boolean
  
  // Error handling
  throwOnError?: boolean
  
  // Paywall integration
  enforcePaywall?: boolean
  paywallFeature?: string
}

/**
 * Default configuration for rate limiting operations
 */
export const DEFAULT_RATE_LIMITING_CONFIG: Required<RateLimitingConfig> = {
  staleTime: 300000,        // 5 minutes in milliseconds
  cacheTime: 900000,        // 15 minutes in milliseconds
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
  retry: 3,
  retryDelay: 1000,
  enableOptimisticUpdates: true,
  throwOnError: false,
  enforcePaywall: true,
  paywallFeature: 'rate-limiting',
}

// =============================================================================
// ERROR TYPES
// =============================================================================

/**
 * Rate limiting specific errors
 */
export interface RateLimitError extends Error {
  code: 'RATE_LIMIT_EXCEEDED' | 'INVALID_LIMIT_CONFIG' | 'PAYWALL_BLOCKED' | 'CACHE_ERROR'
  limitId?: number
  remaining?: number
  resetTime?: string
  retryAfter?: number
}

/**
 * Cache operation errors
 */
export interface CacheError extends Error {
  code: 'CACHE_MISS' | 'CACHE_EXPIRED' | 'CACHE_INVALID'
  key?: string
  ttl?: number
}

// =============================================================================
// ZOD VALIDATION SCHEMAS
// =============================================================================

/**
 * Zod schema for rate limit periods
 */
export const RateLimitPeriodSchema = z.enum(['minute', 'hour', 'day', '7-day', '30-day'])

/**
 * Zod schema for rate limit types
 */
export const RateLimitTypeSchema = z.enum(['api', 'user', 'role', 'service', 'endpoint'])

/**
 * Zod schema for HTTP verbs
 */
export const HttpVerbSchema = z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'])

/**
 * Zod schema for cache limit entries
 */
export const CacheLimitTypeSchema = z.object({
  id: z.number(),
  key: z.string(),
  max: z.number().min(0),
  attempts: z.number().min(0),
  remaining: z.number().min(0),
  reset_time: z.string().optional(),
  window_start: z.string().optional(),
})

/**
 * Zod schema for complete limit configuration
 */
export const LimitTypeSchema = z.object({
  id: z.number(),
  name: z.string().min(1).max(100),
  description: z.string(),
  isActive: z.boolean(),
  rate: z.number().min(1),
  period: RateLimitPeriodSchema,
  type: RateLimitTypeSchema,
  endpoint: z.string().nullable(),
  verb: HttpVerbSchema.nullable(),
  serviceId: z.number().nullable(),
  roleId: z.number().nullable(),
  userId: z.number().nullable(),
  keyText: z.string(),
  createdDate: z.string(),
  lastModifiedDate: z.string(),
  limitCacheByLimitId: z.array(CacheLimitTypeSchema),
  roleByRoleId: z.any().nullable(),    // Reference to role type
  serviceByServiceId: z.any().nullable(), // Reference to service type
  userByUserId: z.any().nullable(),    // Reference to user type
})

/**
 * Zod schema for create limit payload
 */
export const CreateLimitPayloadSchema = z.object({
  name: z.string().min(1, 'Limit name is required').max(100, 'Limit name must be less than 100 characters'),
  description: z.string().nullable(),
  type: RateLimitTypeSchema,
  rate: z.string().min(1, 'Rate is required'),
  period: RateLimitPeriodSchema,
  isActive: z.boolean(),
  endpoint: z.string().nullable(),
  verb: HttpVerbSchema.nullable(),
  serviceId: z.number().nullable(),
  roleId: z.number().nullable(),
  userId: z.number().nullable(),
  cacheData: z.object({}).optional(),
}).refine((data) => {
  const typeConfig = RATE_LIMIT_TYPES[data.type]
  if (typeConfig.requires.includes('userId') && !data.userId) {
    return false
  }
  if (typeConfig.requires.includes('roleId') && !data.roleId) {
    return false
  }
  if (typeConfig.requires.includes('serviceId') && !data.serviceId) {
    return false
  }
  if (typeConfig.requires.includes('endpoint') && !data.endpoint) {
    return false
  }
  if (typeConfig.requires.includes('verb') && !data.verb) {
    return false
  }
  return true
}, {
  message: "Missing required fields for the selected limit type",
  path: ['type']
})

/**
 * Zod schema for update limit payload
 */
export const UpdateLimitPayloadSchema = CreateLimitPayloadSchema
  .omit({ cacheData: true, rate: true })
  .extend({
    id: z.number(),
    rate: z.number().min(1),
    createdDate: z.string(),
    lastModifiedDate: z.string(),
  })

/**
 * Zod schema for limit list parameters
 */
export const LimitListParamsSchema = z.object({
  limit: z.number().min(1).max(1000).optional(),
  offset: z.number().min(0).optional(),
  sort: z.string().optional(),
  filter: z.string().optional(),
  search: z.string().optional(),
  related: z.union([z.string(), z.array(z.string())]).optional(),
  include_count: z.boolean().optional(),
  active_only: z.boolean().optional(),
  limit_type: RateLimitTypeSchema.optional(),
  service_id: z.number().optional(),
  role_id: z.number().optional(),
  user_id: z.number().optional(),
})

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Format rate display text
 */
export function formatRateDisplay(rate: number, period: RateLimitPeriod): string {
  const periodConfig = RATE_LIMIT_PERIODS[period]
  return `${rate} ${periodConfig.label.toLowerCase()}`
}

/**
 * Calculate reset time for rate limit
 */
export function calculateResetTime(period: RateLimitPeriod, startTime?: Date): Date {
  const now = startTime || new Date()
  const periodConfig = RATE_LIMIT_PERIODS[period]
  return new Date(now.getTime() + (periodConfig.seconds * 1000))
}

/**
 * Check if limit configuration is valid
 */
export function validateLimitConfig(limit: Partial<LimitType>): boolean {
  try {
    LimitTypeSchema.parse(limit)
    return true
  } catch {
    return false
  }
}

/**
 * Generate cache key for rate limit
 */
export function generateCacheKey(limit: LimitType, context?: { userId?: number, sessionId?: string }): string {
  const parts = [limit.type, limit.id.toString()]
  
  if (limit.userId) parts.push(`user:${limit.userId}`)
  if (limit.roleId) parts.push(`role:${limit.roleId}`)
  if (limit.serviceId) parts.push(`service:${limit.serviceId}`)
  if (limit.endpoint) parts.push(`endpoint:${limit.endpoint}`)
  if (limit.verb) parts.push(`verb:${limit.verb}`)
  if (context?.userId) parts.push(`context_user:${context.userId}`)
  if (context?.sessionId) parts.push(`session:${context.sessionId}`)
  
  return parts.join(':')
}

// =============================================================================
// EXPORTS
// =============================================================================

export type {
  CacheLimitType,
  LimitType,
  LimitTableRowData,
  CreateLimitPayload,
  UpdateLimitPayload,
  PatchLimitPayload,
  LimitListParams,
  LimitMutations,
  PaywallStatus,
  SubscriptionConfig,
  RateLimitingConfig,
  RateLimitError,
  CacheError,
}

export {
  RATE_LIMIT_PERIODS,
  RATE_LIMIT_TYPES,
  HTTP_VERBS,
  limitQueryKeys,
  DEFAULT_RATE_LIMITING_CONFIG,
  RateLimitPeriodSchema,
  RateLimitTypeSchema,
  HttpVerbSchema,
  CacheLimitTypeSchema,
  LimitTypeSchema,
  CreateLimitPayloadSchema,
  UpdateLimitPayloadSchema,
  LimitListParamsSchema,
  formatRateDisplay,
  calculateResetTime,
  validateLimitConfig,
  generateCacheKey,
}