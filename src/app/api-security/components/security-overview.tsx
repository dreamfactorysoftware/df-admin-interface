/**
 * Security Overview Dashboard Component for React/Next.js refactor of DreamFactory Admin Interface
 * 
 * Unified security dashboard combining limits and roles overview per F-004 API Security Configuration.
 * Displays summary statistics, recent activity, and quick action buttons for security management.
 * Built with React Query for intelligent caching and real-time data synchronization.
 * 
 * Features:
 * - Real-time security statistics with React Query caching
 * - Interactive security metrics visualization with accessible charts
 * - Quick action buttons for limits and roles management
 * - Responsive dashboard layout with Tailwind CSS grid system
 * - WCAG 2.1 AA compliant design
 * - Cache hit responses under 50ms per requirements
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

'use client'

import React, { useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  StatsCard,
  ActionCard,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Chart } from '@/components/ui/chart'
import { useSecurityOverview } from '@/hooks/use-security-stats'
import type { 
  SecurityStats,
  SecurityViolation,
  SystemHealthIndicator,
  ChartDataPoint
} from '@/types/security'

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface SecurityOverviewProps {
  className?: string
  refreshInterval?: number
}

interface SecurityMetricCardProps {
  title: string
  value: string | number
  description?: string
  trend?: {
    value: number
    label: string
    direction: 'up' | 'down' | 'neutral'
  }
  icon: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error'
}

interface QuickActionProps {
  title: string
  description: string
  href: string
  icon: React.ReactNode
  count?: number
  disabled?: boolean
}

// ============================================================================
// SECURITY METRIC ICONS
// ============================================================================

const SecurityIcons = {
  Shield: () => (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  Users: () => (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
    </svg>
  ),
  Warning: () => (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  ),
  Clock: () => (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Limit: () => (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  Role: () => (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  Settings: () => (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Plus: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
  ),
  ChevronRight: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  ),
}

// ============================================================================
// SECURITY METRIC CARD COMPONENT
// ============================================================================

const SecurityMetricCard: React.FC<SecurityMetricCardProps> = ({ 
  title, 
  value, 
  description, 
  trend, 
  icon, 
  variant = 'default' 
}) => {
  const getVariantStyles = (variant: string) => {
    switch (variant) {
      case 'success':
        return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950'
      case 'error':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
      default:
        return ''
    }
  }

  return (
    <StatsCard
      title={title}
      value={value}
      description={description}
      trend={trend}
      icon={icon}
      className={getVariantStyles(variant)}
    />
  )
}

// ============================================================================
// QUICK ACTION COMPONENT
// ============================================================================

const QuickAction: React.FC<QuickActionProps> = ({ 
  title, 
  description, 
  href, 
  icon, 
  count, 
  disabled = false 
}) => {
  return (
    <Link href={disabled ? '#' : href} className={disabled ? 'pointer-events-none' : ''}>
      <ActionCard
        title={title}
        description={description}
        icon={icon}
        action={
          <div className="flex items-center space-x-2">
            {count !== undefined && (
              <span className="inline-flex items-center rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                {count}
              </span>
            )}
            <SecurityIcons.ChevronRight />
          </div>
        }
        className={disabled ? 'opacity-50 cursor-not-allowed' : ''}
      />
    </Link>
  )
}

// ============================================================================
// RECENT VIOLATIONS COMPONENT
// ============================================================================

interface RecentViolationsProps {
  violations: SecurityViolation[]
  loading: boolean
}

const RecentViolations: React.FC<RecentViolationsProps> = ({ violations, loading }) => {
  const getSeverityColor = (severity: SecurityViolation['severity']) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900'
      case 'high':
        return 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900'
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900'
      case 'low':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900'
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900'
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="flex-1 space-y-1">
                <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (violations.length === 0) {
    return (
      <div className="text-center py-6">
        <SecurityIcons.Shield />
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          No recent security violations
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {violations.slice(0, 5).map((violation) => (
        <div key={violation.id} className="flex items-start space-x-3">
          <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getSeverityColor(violation.severity)}`}>
            {violation.severity.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {violation.message}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(violation.timestamp).toLocaleString()} • {violation.type.replace('_', ' ')}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// SYSTEM HEALTH COMPONENT
// ============================================================================

interface SystemHealthProps {
  health: SystemHealthIndicator[]
  loading: boolean
}

const SystemHealth: React.FC<SystemHealthProps> = ({ health, loading }) => {
  const getStatusColor = (status: SystemHealthIndicator['status']) => {
    switch (status) {
      case 'operational':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900'
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900'
      case 'offline':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900'
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900'
    }
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse flex items-center justify-between">
            <div className="h-4 w-1/3 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-6 w-20 rounded-full bg-gray-200 dark:bg-gray-700" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {health.map((indicator) => (
        <div key={indicator.component} className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
            {indicator.component.replace('_', ' ')}
          </span>
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(indicator.status)}`}>
            {indicator.status}
          </span>
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// MAIN SECURITY OVERVIEW COMPONENT
// ============================================================================

const SecurityOverview: React.FC<SecurityOverviewProps> = ({ 
  className,
  refreshInterval = 60000 
}) => {
  const router = useRouter()
  
  // Fetch security overview data with React Query
  const {
    stats,
    violations,
    health,
    charts,
    metrics,
    isLoading,
    isError,
    error,
    refresh,
    isRefreshing,
    lastUpdated,
  } = useSecurityOverview()

  // Memoized chart data for performance optimization
  const violationTrendData = useMemo((): ChartDataPoint[] => {
    if (!charts || charts.length === 0) return []
    
    const violationChart = charts.find(chart => chart.id === 'violation-trend')
    return violationChart?.data || []
  }, [charts])

  const roleUtilizationData = useMemo((): ChartDataPoint[] => {
    if (!stats) return []
    
    return [
      { name: 'Assigned Users', value: stats.totalUsers - stats.unassignedUsers },
      { name: 'Unassigned Users', value: stats.unassignedUsers },
    ]
  }, [stats])

  // Quick action items with real-time counts
  const quickActions = useMemo((): QuickActionProps[] => [
    {
      title: 'Manage Rate Limits',
      description: 'Configure API rate limiting rules and thresholds',
      href: '/api-security/limits',
      icon: <SecurityIcons.Limit />,
      count: stats?.activeLimits || 0,
    },
    {
      title: 'Manage Roles',
      description: 'Create and configure user roles and permissions',
      href: '/api-security/roles',
      icon: <SecurityIcons.Role />,
      count: stats?.activeRoles || 0,
    },
    {
      title: 'Create New Limit',
      description: 'Add a new rate limiting rule',
      href: '/api-security/limits/create',
      icon: <SecurityIcons.Plus />,
    },
    {
      title: 'Create New Role',
      description: 'Define a new user role with permissions',
      href: '/api-security/roles/create',
      icon: <SecurityIcons.Plus />,
    },
  ], [stats])

  // Handle manual refresh
  const handleRefresh = () => {
    refresh()
  }

  // Error state
  if (isError) {
    return (
      <Card className={className}>
        <CardContent>
          <div className="text-center py-6">
            <SecurityIcons.Warning />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              Failed to load security overview
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {error?.message || 'An unexpected error occurred'}
            </p>
            <Button 
              onClick={handleRefresh}
              className="mt-3"
              size="sm"
              loading={isRefreshing}
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Security Overview
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Monitor API security metrics, violations, and system health
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {lastUpdated && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Last updated: {new Date(lastUpdated).toLocaleTimeString()}
            </span>
          )}
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            loading={isRefreshing}
            leftIcon={<SecurityIcons.Settings />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Security Metrics Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <SecurityMetricCard
          title="System Health Score"
          value={stats ? `${stats.healthScore}%` : '---'}
          description="Overall security health"
          trend={metrics ? {
            value: metrics.performanceScore > 80 ? 5 : -2,
            label: 'vs last week',
            direction: metrics.performanceScore > 80 ? 'up' : 'down'
          } : undefined}
          icon={<SecurityIcons.Shield />}
          variant={metrics?.isHealthy ? 'success' : metrics?.isCritical ? 'error' : 'warning'}
        />
        
        <SecurityMetricCard
          title="Active Rate Limits"
          value={stats ? `${stats.activeLimits}/${stats.totalLimits}` : '---'}
          description="Configured API limits"
          trend={metrics ? {
            value: Math.round(metrics.limitsUtilization),
            label: 'utilization',
            direction: metrics.limitsUtilization > 75 ? 'down' : 'neutral'
          } : undefined}
          icon={<SecurityIcons.Limit />}
          variant={metrics && metrics.limitsUtilization > 90 ? 'warning' : 'default'}
        />
        
        <SecurityMetricCard
          title="Recent Violations"
          value={stats?.violationsLast24h || 0}
          description="Last 24 hours"
          trend={metrics ? {
            value: Math.round(Math.abs(metrics.violationTrend * 100)),
            label: 'vs 7-day avg',
            direction: metrics.violationTrend > 0.1 ? 'up' : metrics.violationTrend < -0.1 ? 'down' : 'neutral'
          } : undefined}
          icon={<SecurityIcons.Warning />}
          variant={stats && stats.violationsLast24h > 10 ? 'error' : stats && stats.violationsLast24h > 5 ? 'warning' : 'default'}
        />
        
        <SecurityMetricCard
          title="User Role Coverage"
          value={stats && metrics ? `${Math.round(metrics.rolesCoverage)}%` : '---'}
          description="Users with assigned roles"
          trend={metrics ? {
            value: Math.round(metrics.rolesCoverage),
            label: 'coverage',
            direction: metrics.rolesCoverage > 90 ? 'up' : metrics.rolesCoverage < 70 ? 'down' : 'neutral'
          } : undefined}
          icon={<SecurityIcons.Users />}
          variant={metrics && metrics.rolesCoverage < 70 ? 'warning' : 'default'}
        />
      </div>

      {/* Charts and Activity Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Violation Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Security Violations Trend</CardTitle>
            <CardDescription>
              Violation activity over the last 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Chart
              type="line"
              data={violationTrendData}
              dataKey="value"
              height={300}
              loading={isLoading}
              title="Security Violations"
              className="w-full"
            />
          </CardContent>
        </Card>

        {/* Role Utilization Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Role Assignment Distribution</CardTitle>
            <CardDescription>
              User role assignment coverage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Chart
              type="pie"
              data={roleUtilizationData}
              dataKey="value"
              height={300}
              loading={isLoading}
              title="Role Distribution"
              className="w-full"
            />
          </CardContent>
        </Card>
      </div>

      {/* Activity and Health Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Violations */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Security Violations</CardTitle>
            <CardDescription>
              Latest security events and violations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecentViolations violations={violations || []} loading={isLoading} />
          </CardContent>
          <CardFooter>
            <Link href="/api-security/violations" className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
              View all violations →
            </Link>
          </CardFooter>
        </Card>

        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle>System Health Indicators</CardTitle>
            <CardDescription>
              Status of security components
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SystemHealth health={health || []} loading={isLoading} />
          </CardContent>
          <CardFooter>
            <Link href="/api-security/health" className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
              View detailed health →
            </Link>
          </CardFooter>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common security management tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action, index) => (
              <QuickAction key={index} {...action} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================================
// EXPORTS
// ============================================================================

export default SecurityOverview
export type { SecurityOverviewProps }