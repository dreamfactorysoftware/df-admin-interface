/**
 * Security types for React/Next.js refactor of DreamFactory Admin Interface
 * 
 * Provides comprehensive type definitions for security metrics, violations,
 * role assignments, and system health indicators used throughout the
 * security management interface.
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

import { z } from 'zod'

// =============================================================================
// SECURITY METRICS TYPES
// =============================================================================

/**
 * Security statistics overview for dashboard display
 */
export interface SecurityStats {
  // Limits tracking
  activeLimits: number
  totalLimits: number
  
  // Role assignments
  totalRoles: number
  activeRoles: number
  totalUsers: number
  unassignedUsers: number
  
  // Recent activity
  recentViolations: number
  violationsLast24h: number
  violationsLast7d: number
  
  // System health indicators
  healthScore: number // 0-100
  lastSecurityScan: string // ISO 8601 timestamp
  criticalAlerts: number
  systemStatus: 'healthy' | 'warning' | 'critical'
  
  // Performance metrics
  averageRuleEvaluationTime: number // milliseconds
  slowestRuleEvaluationTime: number // milliseconds
  ruleEvaluationsPerSecond: number
}

/**
 * Security violation record for tracking breaches
 */
export interface SecurityViolation {
  id: string
  timestamp: string // ISO 8601
  type: 'rate_limit' | 'unauthorized_access' | 'permission_denied' | 'invalid_token' | 'suspicious_activity'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  source: {
    ip?: string
    userId?: string | number
    endpoint?: string
    userAgent?: string
  }
  context?: Record<string, unknown>
  resolved: boolean
  resolvedAt?: string // ISO 8601
  resolvedBy?: string | number
}

/**
 * Role assignment tracking for security overview
 */
export interface RoleAssignment {
  id: string | number
  userId: string | number
  roleId: string | number
  roleName: string
  assignedAt: string // ISO 8601
  assignedBy: string | number
  active: boolean
  expiresAt?: string // ISO 8601
  permissions: string[]
}

/**
 * System health indicator for security monitoring
 */
export interface SystemHealthIndicator {
  component: 'authentication' | 'authorization' | 'rate_limiting' | 'audit_logging' | 'encryption'
  status: 'operational' | 'degraded' | 'offline'
  lastCheck: string // ISO 8601
  responseTime?: number // milliseconds
  errorRate?: number // percentage
  details?: string
  metrics?: Record<string, number>
}

/**
 * Rate limit configuration and status
 */
export interface RateLimit {
  id: string | number
  name: string
  type: 'user' | 'role' | 'service' | 'endpoint' | 'ip'
  rate: number
  period: 'minute' | 'hour' | 'day' | '7-day' | '30-day'
  current: number
  remaining: number
  resetTime: string // ISO 8601
  active: boolean
  violations: number
  lastViolation?: string // ISO 8601
}

/**
 * Security audit event for compliance tracking
 */
export interface SecurityAuditEvent {
  id: string
  timestamp: string // ISO 8601
  event: 'login' | 'logout' | 'permission_change' | 'role_assignment' | 'limit_modification' | 'violation'
  userId?: string | number
  adminId?: string | number
  resource?: string
  action: string
  result: 'success' | 'failure' | 'blocked'
  metadata?: Record<string, unknown>
  sessionId?: string
  ipAddress?: string
}

// =============================================================================
// CHART AND VISUALIZATION DATA TYPES
// =============================================================================

/**
 * Data point for time-series charts
 */
export interface TimeSeriesDataPoint {
  timestamp: string // ISO 8601
  value: number
  label?: string
  metadata?: Record<string, unknown>
}

/**
 * Chart data structure for security metrics visualization
 */
export interface SecurityChartData {
  id: string
  title: string
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'area'
  data: TimeSeriesDataPoint[]
  unit?: string
  period: 'hour' | 'day' | 'week' | 'month'
  lastUpdated: string // ISO 8601
}

/**
 * Progress indicator data for system health
 */
export interface ProgressIndicator {
  id: string
  label: string
  value: number
  max: number
  unit?: string
  color?: 'success' | 'warning' | 'error' | 'info'
  description?: string
}

// =============================================================================
// API REQUEST/RESPONSE TYPES
// =============================================================================

/**
 * Request parameters for security statistics
 */
export interface SecurityStatsRequest {
  period?: 'hour' | 'day' | 'week' | 'month'
  includeViolations?: boolean
  includeHealth?: boolean
  includePerformance?: boolean
  refresh?: boolean
}

/**
 * Response structure for security statistics API
 */
export interface SecurityStatsResponse {
  stats: SecurityStats
  violations?: SecurityViolation[]
  health?: SystemHealthIndicator[]
  charts?: SecurityChartData[]
  lastUpdated: string // ISO 8601
}

/**
 * Real-time security metrics update
 */
export interface SecurityMetricsUpdate {
  type: 'stats' | 'violation' | 'health' | 'audit'
  timestamp: string // ISO 8601
  data: SecurityStats | SecurityViolation | SystemHealthIndicator | SecurityAuditEvent
}

// =============================================================================
// FILTER AND SEARCH TYPES
// =============================================================================

/**
 * Filter options for security violations
 */
export interface ViolationFilters {
  type?: SecurityViolation['type'][]
  severity?: SecurityViolation['severity'][]
  dateRange?: {
    start: string // ISO 8601
    end: string // ISO 8601
  }
  resolved?: boolean
  userId?: string | number
  endpoint?: string
}

/**
 * Sort options for security data
 */
export interface SecuritySortOptions {
  field: 'timestamp' | 'severity' | 'type' | 'userId' | 'resolved'
  direction: 'asc' | 'desc'
}

// =============================================================================
// ZOD VALIDATION SCHEMAS
// =============================================================================

/**
 * Zod schema for security violation severity
 */
export const SecurityViolationSeveritySchema = z.enum(['low', 'medium', 'high', 'critical'])

/**
 * Zod schema for security violation type
 */
export const SecurityViolationTypeSchema = z.enum([
  'rate_limit',
  'unauthorized_access', 
  'permission_denied',
  'invalid_token',
  'suspicious_activity'
])

/**
 * Zod schema for system status
 */
export const SystemStatusSchema = z.enum(['healthy', 'warning', 'critical'])

/**
 * Zod schema for security statistics
 */
export const SecurityStatsSchema = z.object({
  activeLimits: z.number().min(0),
  totalLimits: z.number().min(0),
  totalRoles: z.number().min(0),
  activeRoles: z.number().min(0),
  totalUsers: z.number().min(0),
  unassignedUsers: z.number().min(0),
  recentViolations: z.number().min(0),
  violationsLast24h: z.number().min(0),
  violationsLast7d: z.number().min(0),
  healthScore: z.number().min(0).max(100),
  lastSecurityScan: z.string(),
  criticalAlerts: z.number().min(0),
  systemStatus: SystemStatusSchema,
  averageRuleEvaluationTime: z.number().min(0),
  slowestRuleEvaluationTime: z.number().min(0),
  ruleEvaluationsPerSecond: z.number().min(0)
})

/**
 * Zod schema for security violation
 */
export const SecurityViolationSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  type: SecurityViolationTypeSchema,
  severity: SecurityViolationSeveritySchema,
  message: z.string(),
  source: z.object({
    ip: z.string().optional(),
    userId: z.union([z.string(), z.number()]).optional(),
    endpoint: z.string().optional(),
    userAgent: z.string().optional()
  }),
  context: z.record(z.unknown()).optional(),
  resolved: z.boolean(),
  resolvedAt: z.string().optional(),
  resolvedBy: z.union([z.string(), z.number()]).optional()
})

/**
 * Zod schema for progress indicator
 */
export const ProgressIndicatorSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.number().min(0),
  max: z.number().min(0),
  unit: z.string().optional(),
  color: z.enum(['success', 'warning', 'error', 'info']).optional(),
  description: z.string().optional()
})

/**
 * Zod schema for security stats request
 */
export const SecurityStatsRequestSchema = z.object({
  period: z.enum(['hour', 'day', 'week', 'month']).optional(),
  includeViolations: z.boolean().optional(),
  includeHealth: z.boolean().optional(),
  includePerformance: z.boolean().optional(),
  refresh: z.boolean().optional()
})

// =============================================================================
// TYPE UTILITIES
// =============================================================================

/**
 * Union type for all security metric types
 */
export type SecurityMetric = SecurityStats | SecurityViolation | RateLimit | SecurityAuditEvent

/**
 * Extract violation severity levels
 */
export type ViolationSeverity = SecurityViolation['severity']

/**
 * Extract violation types
 */
export type ViolationType = SecurityViolation['type']

/**
 * Extract system status values
 */
export type SystemStatus = SecurityStats['systemStatus']

/**
 * Extract health component types
 */
export type HealthComponent = SystemHealthIndicator['component']

// =============================================================================
// EXPORTS
// =============================================================================

export type {
  SecurityStats,
  SecurityViolation,
  RoleAssignment,
  SystemHealthIndicator,
  RateLimit,
  SecurityAuditEvent,
  TimeSeriesDataPoint,
  SecurityChartData,
  ProgressIndicator,
  SecurityStatsRequest,
  SecurityStatsResponse,
  SecurityMetricsUpdate,
  ViolationFilters,
  SecuritySortOptions,
  SecurityMetric
}

export {
  SecurityViolationSeveritySchema,
  SecurityViolationTypeSchema,
  SystemStatusSchema,
  SecurityStatsSchema,
  SecurityViolationSchema,
  ProgressIndicatorSchema,
  SecurityStatsRequestSchema
}