/**
 * Security Statistics Component for React/Next.js refactor of DreamFactory Admin Interface
 * 
 * Statistics display component for security metrics including active limits count,
 * role assignments, recent violations, and system health indicators. Implements
 * real-time updates with React Query and accessible data visualization using
 * charts and progress indicators.
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

'use client'

import React, { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { useSecurityStats } from '@/hooks/use-security-stats'
import { Chart } from '@/components/ui/chart'
import { Progress, CircularProgress } from '@/components/ui/progress'
import { Badge, StatusBadge, CountBadge } from '@/components/ui/badge'
import type { SecurityStats, SecurityViolation, SystemHealthIndicator } from '@/types/security'

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface SecurityStatsProps {
  /**
   * Additional CSS classes
   */
  className?: string
  
  /**
   * Time period for statistics
   */
  period?: 'hour' | 'day' | 'week' | 'month'
  
  /**
   * Auto-refresh interval in milliseconds
   */
  refreshInterval?: number
  
  /**
   * Whether to show detailed performance metrics
   */
  showPerformance?: boolean
  
  /**
   * Whether to show recent violations
   */
  showViolations?: boolean
  
  /**
   * Whether to show system health indicators
   */
  showHealth?: boolean
  
  /**
   * Whether to show charts
   */
  showCharts?: boolean
  
  /**
   * Compact layout for smaller spaces
   */
  compact?: boolean
  
  /**
   * Custom title for the component
   */
  title?: string
  
  /**
   * Custom description
   */
  description?: string
  
  /**
   * Callback when user clicks refresh
   */
  onRefresh?: () => void
  
  /**
   * Callback when user clicks on a violation
   */
  onViolationClick?: (violation: SecurityViolation) => void
  
  /**
   * Callback when user clicks on a health indicator
   */
  onHealthClick?: (indicator: SystemHealthIndicator) => void
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get status color based on health score
 */
function getHealthColor(score: number): 'success' | 'warning' | 'error' {
  if (score >= 80) return 'success'
  if (score >= 50) return 'warning'
  return 'error'
}

/**
 * Get severity color for violations
 */
function getSeverityColor(severity: SecurityViolation['severity']): string {
  switch (severity) {
    case 'critical':
      return 'destructive'
    case 'high':
      return 'warning'
    case 'medium':
      return 'info'
    case 'low':
      return 'secondary'
    default:
      return 'default'
  }
}

/**
 * Format time duration
 */
function formatDuration(milliseconds: number): string {
  if (milliseconds < 1000) {
    return `${Math.round(milliseconds)}ms`
  }
  return `${(milliseconds / 1000).toFixed(1)}s`
}

/**
 * Format large numbers with abbreviations
 */
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  return num.toString()
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/**
 * Metric Card Component
 */
const MetricCard: React.FC<{
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  color?: 'default' | 'success' | 'warning' | 'error' | 'info'
  trend?: {
    value: number
    label: string
  }
  onClick?: () => void
  className?: string
}> = ({ title, value, subtitle, icon, color = 'default', trend, onClick, className }) => {
  const colorClasses = {
    default: 'border-gray-200 dark:border-gray-700',
    success: 'border-success-200 dark:border-success-800',
    warning: 'border-warning-200 dark:border-warning-800',
    error: 'border-error-200 dark:border-error-800',
    info: 'border-primary-200 dark:border-primary-800',
  }

  const trendColor = trend ? (trend.value > 0 ? 'error' : 'success') : undefined

  return (
    <div
      className={cn(
        'rounded-lg border bg-white p-4 shadow-sm transition-all hover:shadow-md dark:bg-gray-800',
        colorClasses[color],
        onClick && 'cursor-pointer hover:border-primary-300 dark:hover:border-primary-600',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick()
              }
            }
          : undefined
      }
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            {icon && (
              <div className="flex-shrink-0 text-gray-400 dark:text-gray-500">
                {icon}
              </div>
            )}
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {title}
            </h3>
          </div>
          
          <div className="mt-2">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {typeof value === 'number' ? formatNumber(value) : value}
            </div>
            {subtitle && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        
        {trend && (
          <div className="flex-shrink-0">
            <Badge
              variant={trendColor === 'error' ? 'destructive' : 'success'}
              size="sm"
            >
              {trend.value > 0 ? '+' : ''}
              {trend.value.toFixed(1)}%
            </Badge>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Health Indicator Component
 */
const HealthIndicator: React.FC<{
  indicator: SystemHealthIndicator
  onClick?: (indicator: SystemHealthIndicator) => void
}> = ({ indicator, onClick }) => {
  const statusColors = {
    operational: 'success',
    degraded: 'warning',
    offline: 'error',
  } as const

  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-lg border p-3 transition-colors',
        'border-gray-200 dark:border-gray-700',
        onClick && 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750'
      )}
      onClick={() => onClick?.(indicator)}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="flex items-center space-x-3">
        <StatusBadge
          status={indicator.status === 'operational' ? 'online' : 
                  indicator.status === 'degraded' ? 'away' : 'offline'}
          dot
          size="sm"
        />
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
            {indicator.component.replace(/_/g, ' ')}
          </h4>
          {indicator.details && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {indicator.details}
            </p>
          )}
        </div>
      </div>
      
      <div className="text-right">
        {indicator.responseTime && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {formatDuration(indicator.responseTime)}
          </div>
        )}
        {indicator.errorRate !== undefined && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {indicator.errorRate.toFixed(1)}% errors
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Violation Item Component
 */
const ViolationItem: React.FC<{
  violation: SecurityViolation
  onClick?: (violation: SecurityViolation) => void
}> = ({ violation, onClick }) => {
  const timeAgo = useMemo(() => {
    const now = new Date()
    const violationTime = new Date(violation.timestamp)
    const diffMinutes = Math.floor((now.getTime() - violationTime.getTime()) / (1000 * 60))
    
    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }, [violation.timestamp])

  return (
    <div
      className={cn(
        'flex items-start space-x-3 rounded-lg border p-3 transition-colors',
        'border-gray-200 dark:border-gray-700',
        onClick && 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750',
        !violation.resolved && 'bg-error-50 border-error-200 dark:bg-error-950 dark:border-error-800'
      )}
      onClick={() => onClick?.(violation)}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <Badge
        variant={getSeverityColor(violation.severity) as any}
        size="sm"
        className="flex-shrink-0"
      >
        {violation.severity}
      </Badge>
      
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
          {violation.message}
        </h4>
        <div className="mt-1 flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="capitalize">{violation.type.replace(/_/g, ' ')}</span>
          {violation.source.ip && (
            <>
              <span>•</span>
              <span>{violation.source.ip}</span>
            </>
          )}
          {violation.source.endpoint && (
            <>
              <span>•</span>
              <span>{violation.source.endpoint}</span>
            </>
          )}
          <span>•</span>
          <span>{timeAgo}</span>
        </div>
      </div>
      
      {violation.resolved && (
        <Badge variant="success" size="sm" className="flex-shrink-0">
          Resolved
        </Badge>
      )}
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * Security Statistics Component
 */
export const SecurityStats: React.FC<SecurityStatsProps> = ({
  className,
  period = 'day',
  refreshInterval = 60000,
  showPerformance = true,
  showViolations = true,
  showHealth = true,
  showCharts = true,
  compact = false,
  title = 'Security Overview',
  description,
  onRefresh,
  onViolationClick,
  onHealthClick,
}) => {
  // Fetch security statistics
  const {
    stats,
    violations = [],
    health = [],
    charts = [],
    metrics,
    isLoading,
    isError,
    isRefreshing,
    error,
    lastUpdated,
    refresh,
  } = useSecurityStats({
    period,
    includeViolations: showViolations,
    includeHealth: showHealth,
    includePerformance: showPerformance,
  })

  // Handle refresh
  const handleRefresh = () => {
    refresh()
    onRefresh?.()
  }

  // Memoized chart data
  const chartData = useMemo(() => {
    if (!charts.length) return []
    
    return charts.map(chart => ({
      ...chart,
      data: chart.data.map(point => ({
        name: new Date(point.timestamp).toLocaleTimeString(),
        value: point.value,
        ...point,
      })),
    }))
  }, [charts])

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-gray-200 rounded dark:bg-gray-700 mb-2" />
          <div className="h-4 w-96 bg-gray-200 rounded dark:bg-gray-700" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-24 bg-gray-200 rounded-lg dark:bg-gray-700" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (isError) {
    return (
      <div className={cn('text-center py-8', className)}>
        <div className="rounded-lg border border-error-200 bg-error-50 p-6 dark:border-error-800 dark:bg-error-950">
          <h3 className="text-lg font-semibold text-error-800 dark:text-error-200 mb-2">
            Failed to Load Security Statistics
          </h3>
          <p className="text-error-600 dark:text-error-400 mb-4">
            {error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-error-600 hover:bg-error-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-error-500 disabled:opacity-50"
          >
            {isRefreshing ? 'Retrying...' : 'Retry'}
          </button>
        </div>
      </div>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <div className={cn('space-y-6', className)} role="region" aria-label="Security statistics">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {title}
          </h2>
          {description && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {description}
            </p>
          )}
          {lastUpdated && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Last updated: {new Date(lastUpdated).toLocaleString()}
            </p>
          )}
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          aria-label="Refresh security statistics"
        >
          <svg
            className={cn('h-4 w-4 mr-2', isRefreshing && 'animate-spin')}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh
        </button>
      </div>

      {/* Key Metrics Grid */}
      <div className={cn(
        'grid gap-4',
        compact ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
      )}>
        {/* Active Limits */}
        <MetricCard
          title="Active Limits"
          value={stats.activeLimits}
          subtitle={`of ${stats.totalLimits} total`}
          color={metrics?.limitsUtilization && metrics.limitsUtilization > 80 ? 'warning' : 'default'}
          icon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          }
        />

        {/* Role Coverage */}
        <MetricCard
          title="Role Coverage"
          value={`${Math.round(metrics?.rolesCoverage || 0)}%`}
          subtitle={`${stats.totalUsers - stats.unassignedUsers} of ${stats.totalUsers} users`}
          color={metrics?.rolesCoverage && metrics.rolesCoverage < 80 ? 'warning' : 'success'}
          icon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />

        {/* Recent Violations */}
        <MetricCard
          title="Recent Violations"
          value={stats.recentViolations}
          subtitle={`${stats.violationsLast24h} in last 24h`}
          color={stats.recentViolations > 10 ? 'error' : stats.recentViolations > 5 ? 'warning' : 'default'}
          trend={metrics?.violationTrend ? {
            value: metrics.violationTrend * 100,
            label: 'vs last period'
          } : undefined}
          icon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          }
        />

        {/* System Health */}
        <MetricCard
          title="System Health"
          value={`${stats.healthScore}%`}
          subtitle={stats.systemStatus}
          color={getHealthColor(stats.healthScore)}
          icon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          }
        />
      </div>

      {/* Performance Metrics */}
      {showPerformance && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Performance Metrics
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Average Rule Evaluation
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDuration(stats.averageRuleEvaluationTime)}
                </span>
              </div>
              <Progress
                value={Math.min(stats.averageRuleEvaluationTime, 100)}
                max={100}
                variant={stats.averageRuleEvaluationTime > 80 ? 'error' : 
                        stats.averageRuleEvaluationTime > 50 ? 'warning' : 'success'}
                showPercentage={false}
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Evaluations per Second
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {stats.ruleEvaluationsPerSecond.toFixed(1)}
                </span>
              </div>
              <Progress
                value={stats.ruleEvaluationsPerSecond}
                max={1000}
                variant="info"
                showPercentage={false}
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Performance Score
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {Math.round(metrics?.performanceScore || 0)}%
                </span>
              </div>
              <Progress
                value={metrics?.performanceScore || 0}
                max={100}
                variant={getHealthColor(metrics?.performanceScore || 0)}
                showPercentage={false}
              />
            </div>
          </div>
        </div>
      )}

      {/* Charts and Health Indicators */}
      <div className={cn(
        'grid gap-6',
        compact ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'
      )}>
        {/* Charts */}
        {showCharts && chartData.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Security Trends
            </h3>
            
            <div className="space-y-6">
              {chartData.slice(0, 2).map((chart) => (
                <Chart
                  key={chart.id}
                  type={chart.type}
                  data={chart.data}
                  dataKey="value"
                  title={chart.title}
                  height={200}
                  showGrid
                  showTooltip
                />
              ))}
            </div>
          </div>
        )}

        {/* System Health */}
        {showHealth && health.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              System Health
            </h3>
            
            <div className="space-y-3">
              {health.map((indicator) => (
                <HealthIndicator
                  key={indicator.component}
                  indicator={indicator}
                  onClick={onHealthClick}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recent Violations */}
      {showViolations && violations.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Recent Security Violations
            </h3>
            <CountBadge
              count={violations.filter(v => !v.resolved).length}
              variant="destructive"
            />
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {violations.slice(0, 10).map((violation) => (
              <ViolationItem
                key={violation.id}
                violation={violation}
                onClick={onViolationClick}
              />
            ))}
          </div>
          
          {violations.length > 10 && (
            <div className="mt-4 text-center">
              <button className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
                View all {violations.length} violations
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// EXPORTS
// =============================================================================

export type { SecurityStatsProps }
export default SecurityStats