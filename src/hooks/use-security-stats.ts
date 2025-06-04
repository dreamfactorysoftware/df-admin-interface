/**
 * useSecurityStats Hook for React/Next.js refactor of DreamFactory Admin Interface
 * 
 * React Query hook for managing security statistics and metrics with intelligent
 * caching, real-time updates, and performance optimizations. Supports automatic
 * refresh intervals and cache invalidation for security dashboards.
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

'use client'

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useMemo, useCallback } from 'react'
import type { 
  SecurityStats,
  SecurityStatsRequest,
  SecurityStatsResponse,
  SecurityViolation,
  SystemHealthIndicator,
  SecurityChartData
} from '@/types/security'
import type { ApiErrorResponse } from '@/types/api'

// =============================================================================
// QUERY KEY FACTORIES
// =============================================================================

/**
 * Query key factory for security statistics
 */
export const securityStatsKeys = {
  all: ['security-stats'] as const,
  lists: () => [...securityStatsKeys.all, 'list'] as const,
  list: (params: SecurityStatsRequest) => [...securityStatsKeys.lists(), params] as const,
  details: () => [...securityStatsKeys.all, 'detail'] as const,
  detail: (id: string) => [...securityStatsKeys.details(), id] as const,
  violations: () => [...securityStatsKeys.all, 'violations'] as const,
  health: () => [...securityStatsKeys.all, 'health'] as const,
  charts: () => [...securityStatsKeys.all, 'charts'] as const,
}

// =============================================================================
// API CLIENT FUNCTIONS
// =============================================================================

/**
 * Fetch security statistics from the API
 */
async function fetchSecurityStats(params: SecurityStatsRequest = {}): Promise<SecurityStatsResponse> {
  const searchParams = new URLSearchParams()
  
  if (params.period) searchParams.set('period', params.period)
  if (params.includeViolations) searchParams.set('includeViolations', 'true')
  if (params.includeHealth) searchParams.set('includeHealth', 'true')
  if (params.includePerformance) searchParams.set('includePerformance', 'true')
  if (params.refresh) searchParams.set('refresh', 'true')

  const url = `/api/v2/system/security/stats?${searchParams.toString()}`
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    cache: params.refresh ? 'no-cache' : 'default',
  })

  if (!response.ok) {
    const error: ApiErrorResponse = await response.json()
    throw new Error(error.error.message || 'Failed to fetch security statistics')
  }

  return response.json()
}

/**
 * Refresh security statistics cache
 */
async function refreshSecurityStats(): Promise<SecurityStatsResponse> {
  return fetchSecurityStats({ refresh: true })
}

// =============================================================================
// MAIN HOOK
// =============================================================================

/**
 * Hook for managing security statistics with React Query
 */
export function useSecurityStats(params: SecurityStatsRequest = {}) {
  const queryClient = useQueryClient()

  // Main security stats query
  const query = useQuery({
    queryKey: securityStatsKeys.list(params),
    queryFn: () => fetchSecurityStats(params),
    staleTime: 30_000, // 30 seconds for cache hit under 50ms requirement
    cacheTime: 5 * 60_000, // 5 minutes
    refetchInterval: 60_000, // Auto-refresh every minute
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: true,
    suspense: false,
    useErrorBoundary: false,
  })

  // Memoized data extractors
  const stats = useMemo(() => query.data?.stats, [query.data?.stats])
  const violations = useMemo(() => query.data?.violations || [], [query.data?.violations])
  const health = useMemo(() => query.data?.health || [], [query.data?.health])
  const charts = useMemo(() => query.data?.charts || [], [query.data?.charts])

  // Computed metrics for dashboard display
  const metrics = useMemo(() => {
    if (!stats) return null

    return {
      limitsUtilization: stats.totalLimits > 0 ? (stats.activeLimits / stats.totalLimits) * 100 : 0,
      rolesCoverage: stats.totalUsers > 0 ? ((stats.totalUsers - stats.unassignedUsers) / stats.totalUsers) * 100 : 0,
      violationTrend: stats.violationsLast24h > 0 && stats.violationsLast7d > 0 
        ? ((stats.violationsLast24h * 7) / stats.violationsLast7d) - 1 
        : 0,
      performanceScore: Math.max(0, 100 - (stats.averageRuleEvaluationTime / 10)), // 100ms = 0 score
      isHealthy: stats.systemStatus === 'healthy' && stats.criticalAlerts === 0,
      needsAttention: stats.systemStatus === 'warning' || stats.criticalAlerts > 0,
      isCritical: stats.systemStatus === 'critical' || stats.criticalAlerts > 5,
    }
  }, [stats])

  // Refresh mutation for manual cache invalidation
  const refreshMutation = useMutation({
    mutationFn: refreshSecurityStats,
    onSuccess: (data) => {
      // Update all related queries
      queryClient.setQueryData(securityStatsKeys.list(params), data)
      queryClient.invalidateQueries({ queryKey: securityStatsKeys.all })
    },
    onError: (error) => {
      console.error('Failed to refresh security stats:', error)
    },
  })

  // Cache invalidation utilities
  const invalidateStats = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: securityStatsKeys.all })
  }, [queryClient])

  const invalidateSpecific = useCallback((type: 'violations' | 'health' | 'charts') => {
    queryClient.invalidateQueries({ queryKey: securityStatsKeys[type]() })
  }, [queryClient])

  // Optimistic updates for real-time metrics
  const updateStats = useCallback((updater: (current: SecurityStats) => SecurityStats) => {
    queryClient.setQueryData(
      securityStatsKeys.list(params),
      (old: SecurityStatsResponse | undefined) => {
        if (!old) return old
        return {
          ...old,
          stats: updater(old.stats),
          lastUpdated: new Date().toISOString(),
        }
      }
    )
  }, [queryClient, params])

  // Real-time violation updates
  const addViolation = useCallback((violation: SecurityViolation) => {
    queryClient.setQueryData(
      securityStatsKeys.list(params),
      (old: SecurityStatsResponse | undefined) => {
        if (!old) return old
        return {
          ...old,
          violations: [violation, ...(old.violations || [])],
          stats: {
            ...old.stats,
            recentViolations: old.stats.recentViolations + 1,
            violationsLast24h: old.stats.violationsLast24h + 1,
          },
          lastUpdated: new Date().toISOString(),
        }
      }
    )
  }, [queryClient, params])

  // Health indicator updates
  const updateHealthIndicator = useCallback((component: string, indicator: SystemHealthIndicator) => {
    queryClient.setQueryData(
      securityStatsKeys.list(params),
      (old: SecurityStatsResponse | undefined) => {
        if (!old) return old
        const updatedHealth = old.health?.map(h => 
          h.component === component ? indicator : h
        ) || []
        return {
          ...old,
          health: updatedHealth,
          lastUpdated: new Date().toISOString(),
        }
      }
    )
  }, [queryClient, params])

  return {
    // Query state
    ...query,
    
    // Data
    stats,
    violations,
    health,
    charts,
    metrics,
    
    // Computed states
    isLoading: query.isLoading,
    isError: query.isError,
    isRefreshing: refreshMutation.isLoading,
    error: query.error,
    lastUpdated: query.data?.lastUpdated,
    
    // Actions
    refresh: refreshMutation.mutate,
    invalidateStats,
    invalidateSpecific,
    updateStats,
    addViolation,
    updateHealthIndicator,
    
    // Query utilities
    refetch: query.refetch,
    remove: () => queryClient.removeQueries({ queryKey: securityStatsKeys.list(params) }),
  }
}

// =============================================================================
// SPECIALIZED HOOKS
// =============================================================================

/**
 * Hook for real-time security metrics with faster refresh
 */
export function useRealTimeSecurityStats(params: SecurityStatsRequest = {}) {
  return useSecurityStats({
    ...params,
    includeViolations: true,
    includeHealth: true,
    includePerformance: true,
  })
}

/**
 * Hook for security overview dashboard
 */
export function useSecurityOverview() {
  return useSecurityStats({
    period: 'day',
    includeViolations: true,
    includeHealth: true,
    includePerformance: false,
  })
}

/**
 * Hook for performance metrics only
 */
export function useSecurityPerformance() {
  return useSecurityStats({
    period: 'hour',
    includeViolations: false,
    includeHealth: false,
    includePerformance: true,
  })
}

// =============================================================================
// PREFETCH UTILITIES
// =============================================================================

/**
 * Prefetch security statistics for improved performance
 */
export function prefetchSecurityStats(
  queryClient: ReturnType<typeof useQueryClient>,
  params: SecurityStatsRequest = {}
) {
  return queryClient.prefetchQuery({
    queryKey: securityStatsKeys.list(params),
    queryFn: () => fetchSecurityStats(params),
    staleTime: 30_000,
  })
}

/**
 * Prefetch security overview data
 */
export function prefetchSecurityOverview(queryClient: ReturnType<typeof useQueryClient>) {
  return prefetchSecurityStats(queryClient, {
    period: 'day',
    includeViolations: true,
    includeHealth: true,
  })
}

// =============================================================================
// EXPORTS
// =============================================================================

export { securityStatsKeys }
export type { SecurityStatsRequest, SecurityStatsResponse }