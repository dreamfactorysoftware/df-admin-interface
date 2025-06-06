'use client';

/**
 * @fileoverview Security Overview Dashboard Component
 * 
 * Unified security configuration interface combining limits and roles management
 * with real-time statistics, recent activity monitoring, and quick action buttons.
 * Replaces Angular Material cards with responsive Tailwind CSS grid layout.
 * 
 * Features:
 * - Real-time security statistics with React Query caching (<50ms cache hits)
 * - Unified limits and roles overview per F-004 API Security Configuration
 * - Interactive quick action buttons for security management
 * - Accessible chart components with WCAG 2.1 AA compliance
 * - Responsive dashboard layout with Tailwind CSS grid system
 * 
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1.0
 */

import React, { useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Shield, 
  Users, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Lock,
  Unlock,
  Settings,
  Plus,
  Activity,
  BarChart3,
  PieChart,
  Eye,
  RefreshCw
} from 'lucide-react';

// UI Components (will be created as part of the broader migration)
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Chart } from '@/components/ui/chart';

// Custom hooks for security data management
import { useSecurityStats } from '@/hooks/use-security-stats';

// Type definitions for security data
import type { 
  SecurityStats, 
  SecurityLimit, 
  SecurityRole,
  SecurityActivity,
  SecurityMetrics 
} from '@/types/security';

// Utility functions
import { cn } from '@/lib/utils';

/**
 * Props interface for SecurityOverview component
 */
interface SecurityOverviewProps {
  className?: string;
  refreshInterval?: number;
  'data-testid'?: string;
}

/**
 * Security statistic card configuration
 */
interface StatCardConfig {
  id: string;
  title: string;
  value: string | number;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  status: 'success' | 'warning' | 'error' | 'info';
  action?: {
    label: string;
    href: string;
  };
}

/**
 * Quick action button configuration
 */
interface QuickActionConfig {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  variant: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
}

/**
 * Security Overview Dashboard Component
 * 
 * Provides a unified interface for monitoring and managing API security
 * with real-time statistics, activity monitoring, and quick actions.
 */
export function SecurityOverview({ 
  className,
  refreshInterval = 30000, // 30 seconds default refresh
  'data-testid': testId = 'security-overview-dashboard'
}: SecurityOverviewProps) {
  const router = useRouter();

  // Fetch security statistics with React Query intelligent caching
  const {
    data: securityStats,
    isLoading,
    isError,
    error,
    refetch,
    lastUpdated
  } = useSecurityStats({
    refetchInterval: refreshInterval,
    staleTime: 50, // 50ms cache hit requirement per React/Next.js Integration Requirements
    cacheTime: 300000, // 5 minutes cache time
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Navigation handlers for quick actions
  const handleNavigation = useCallback((href: string) => {
    router.push(href);
  }, [router]);

  // Manual refresh handler
  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  // Compute security statistics cards
  const statCards = useMemo((): StatCardConfig[] => {
    if (!securityStats) return [];

    const {
      totalLimits,
      activeLimits,
      totalRoles,
      activeRoles,
      securityEvents,
      accessAttempts,
      blockedRequests,
      averageResponseTime,
      uptime
    } = securityStats;

    return [
      {
        id: 'security-limits',
        title: 'Active Limits',
        value: `${activeLimits}/${totalLimits}`,
        trend: activeLimits > 0 ? 'up' : 'stable',
        trendValue: activeLimits > 0 ? `${Math.round((activeLimits / totalLimits) * 100)}% active` : 'None active',
        icon: Shield,
        description: `${activeLimits} rate limits currently enforced across API endpoints`,
        status: activeLimits > 0 ? 'success' : 'warning',
        action: {
          label: 'Manage Limits',
          href: '/api-security/limits'
        }
      },
      {
        id: 'security-roles',
        title: 'Active Roles',
        value: `${activeRoles}/${totalRoles}`,
        trend: activeRoles > 0 ? 'up' : 'stable',
        trendValue: activeRoles > 0 ? `${Math.round((activeRoles / totalRoles) * 100)}% active` : 'None active',
        icon: Users,
        description: `${activeRoles} user roles with configured permissions`,
        status: activeRoles > 0 ? 'success' : 'warning',
        action: {
          label: 'Manage Roles',
          href: '/api-security/roles'
        }
      },
      {
        id: 'security-events',
        title: 'Security Events',
        value: securityEvents.total,
        trend: securityEvents.trend === 'increasing' ? 'up' : securityEvents.trend === 'decreasing' ? 'down' : 'stable',
        trendValue: `${securityEvents.changePercent}% ${securityEvents.trend === 'increasing' ? 'increase' : securityEvents.trend === 'decreasing' ? 'decrease' : 'stable'} (24h)`,
        icon: AlertTriangle,
        description: `Security events logged in the last 24 hours`,
        status: securityEvents.severity === 'high' ? 'error' : securityEvents.severity === 'medium' ? 'warning' : 'info',
        action: {
          label: 'View Events',
          href: '/api-security/audit'
        }
      },
      {
        id: 'access-attempts',
        title: 'Access Attempts',
        value: accessAttempts.successful,
        trend: accessAttempts.trend === 'increasing' ? 'up' : accessAttempts.trend === 'decreasing' ? 'down' : 'stable',
        trendValue: `${accessAttempts.failureRate}% failure rate`,
        icon: Lock,
        description: `Successful API access attempts (${accessAttempts.failed} failed)`,
        status: accessAttempts.failureRate < 5 ? 'success' : accessAttempts.failureRate < 15 ? 'warning' : 'error',
        action: {
          label: 'View Logs',
          href: '/api-security/logs'
        }
      },
      {
        id: 'response-time',
        title: 'Avg Response Time',
        value: `${averageResponseTime}ms`,
        trend: averageResponseTime <= 100 ? 'down' : 'up',
        trendValue: averageResponseTime <= 100 ? 'Optimal' : 'Above threshold',
        icon: Clock,
        description: 'Average API response time including security checks',
        status: averageResponseTime <= 100 ? 'success' : averageResponseTime <= 200 ? 'warning' : 'error',
        action: {
          label: 'Performance',
          href: '/api-security/performance'
        }
      },
      {
        id: 'blocked-requests',
        title: 'Blocked Requests',
        value: blockedRequests.count,
        trend: blockedRequests.trend === 'increasing' ? 'up' : blockedRequests.trend === 'decreasing' ? 'down' : 'stable',
        trendValue: `${blockedRequests.percentage}% of total requests`,
        icon: Unlock,
        description: 'Requests blocked by security rules in the last 24 hours',
        status: blockedRequests.percentage < 1 ? 'success' : blockedRequests.percentage < 5 ? 'warning' : 'error',
        action: {
          label: 'Review Rules',
          href: '/api-security/rules'
        }
      }
    ];
  }, [securityStats]);

  // Quick action buttons configuration
  const quickActions = useMemo((): QuickActionConfig[] => [
    {
      id: 'create-limit',
      title: 'Create Rate Limit',
      description: 'Set up new API rate limiting rules',
      icon: Plus,
      href: '/api-security/limits/create',
      variant: 'primary'
    },
    {
      id: 'create-role',
      title: 'Create Role',
      description: 'Define new user role with permissions',
      icon: Users,
      href: '/api-security/roles/create',
      variant: 'primary'
    },
    {
      id: 'security-settings',
      title: 'Security Settings',
      description: 'Configure global security policies',
      icon: Settings,
      href: '/api-security/settings',
      variant: 'secondary'
    },
    {
      id: 'audit-logs',
      title: 'Audit Logs',
      description: 'Review security event history',
      icon: Activity,
      href: '/api-security/audit',
      variant: 'outline'
    }
  ], []);

  // Chart data for security metrics visualization
  const chartData = useMemo(() => {
    if (!securityStats?.metrics) return null;

    return {
      securityEvents: {
        labels: securityStats.metrics.timeline.map(item => item.timestamp),
        datasets: [
          {
            label: 'Security Events',
            data: securityStats.metrics.timeline.map(item => item.events),
            borderColor: 'rgb(239, 68, 68)', // red-500
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            tension: 0.4
          },
          {
            label: 'Blocked Requests',
            data: securityStats.metrics.timeline.map(item => item.blocked),
            borderColor: 'rgb(249, 115, 22)', // orange-500
            backgroundColor: 'rgba(249, 115, 22, 0.1)',
            tension: 0.4
          }
        ]
      },
      accessPatterns: {
        labels: ['Successful', 'Failed', 'Blocked', 'Rate Limited'],
        datasets: [
          {
            data: [
              securityStats.accessAttempts.successful,
              securityStats.accessAttempts.failed,
              securityStats.blockedRequests.count,
              securityStats.rateLimitedRequests || 0
            ],
            backgroundColor: [
              'rgb(34, 197, 94)',   // green-500
              'rgb(239, 68, 68)',   // red-500
              'rgb(249, 115, 22)',  // orange-500
              'rgb(168, 85, 247)'   // purple-500
            ],
            borderWidth: 2,
            borderColor: 'rgb(255, 255, 255)'
          }
        ]
      }
    };
  }, [securityStats]);

  // Loading state
  if (isLoading) {
    return (
      <div 
        className={cn(
          "animate-pulse space-y-6",
          className
        )}
        data-testid={`${testId}-loading`}
        aria-label="Loading security overview dashboard"
      >
        {/* Loading skeleton */}
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div 
        className={cn(
          "flex flex-col items-center justify-center py-12 px-4 text-center",
          className
        )}
        data-testid={`${testId}-error`}
        role="alert"
        aria-live="polite"
      >
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" aria-hidden="true" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Failed to Load Security Overview
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
          {error?.message || 'Unable to fetch security statistics. Please check your connection and try again.'}
        </p>
        <Button
          onClick={handleRefresh}
          variant="primary"
          size="md"
          className="min-w-32"
          data-testid="retry-button"
          aria-label="Retry loading security overview"
        >
          <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "space-y-8 p-6 bg-gray-50 dark:bg-gray-900 min-h-screen",
        className
      )}
      data-testid={testId}
      role="main"
      aria-label="Security overview dashboard"
    >
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Security Overview
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor API security status, rate limits, and access control
          </p>
          {lastUpdated && (
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              Last updated: {new Date(lastUpdated).toLocaleTimeString()}
            </p>
          )}
        </div>
        
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="md"
          disabled={isLoading}
          data-testid="refresh-button"
          aria-label="Refresh security statistics"
        >
          <RefreshCw className={cn(
            "h-4 w-4 mr-2",
            isLoading && "animate-spin"
          )} aria-hidden="true" />
          Refresh
        </Button>
      </div>

      {/* Security Statistics Grid */}
      <section aria-labelledby="security-stats-heading">
        <h2 id="security-stats-heading" className="sr-only">
          Security Statistics
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((stat) => {
            const TrendIcon = stat.trend === 'up' ? TrendingUp : stat.trend === 'down' ? TrendingDown : Activity;
            const StatusIcon = stat.status === 'success' ? CheckCircle : 
                              stat.status === 'warning' ? AlertTriangle : 
                              stat.status === 'error' ? AlertTriangle : stat.icon;

            return (
              <Card
                key={stat.id}
                className={cn(
                  "p-6 hover:shadow-md transition-shadow duration-200",
                  "border-l-4",
                  stat.status === 'success' && "border-l-green-500",
                  stat.status === 'warning' && "border-l-yellow-500",
                  stat.status === 'error' && "border-l-red-500",
                  stat.status === 'info' && "border-l-blue-500"
                )}
                data-testid={`stat-card-${stat.id}`}
                role="article"
                aria-labelledby={`${stat.id}-title`}
                aria-describedby={`${stat.id}-description`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      stat.status === 'success' && "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400",
                      stat.status === 'warning' && "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400",
                      stat.status === 'error' && "bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400",
                      stat.status === 'info' && "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                    )}>
                      <stat.icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <StatusIcon className={cn(
                      "h-4 w-4",
                      stat.status === 'success' && "text-green-500",
                      stat.status === 'warning' && "text-yellow-500",
                      stat.status === 'error' && "text-red-500",
                      stat.status === 'info' && "text-blue-500"
                    )} aria-hidden="true" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 
                    id={`${stat.id}-title`}
                    className="text-sm font-medium text-gray-600 dark:text-gray-400"
                  >
                    {stat.title}
                  </h3>
                  
                  <div className="flex items-end justify-between">
                    <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {stat.value}
                    </span>
                    
                    {stat.trend && stat.trendValue && (
                      <div className="flex items-center space-x-1 text-sm">
                        <TrendIcon className={cn(
                          "h-4 w-4",
                          stat.trend === 'up' && "text-green-500",
                          stat.trend === 'down' && "text-red-500",
                          stat.trend === 'stable' && "text-gray-400"
                        )} aria-hidden="true" />
                        <span className={cn(
                          "text-sm",
                          stat.trend === 'up' && "text-green-600 dark:text-green-400",
                          stat.trend === 'down' && "text-red-600 dark:text-red-400",
                          stat.trend === 'stable' && "text-gray-500"
                        )}>
                          {stat.trendValue}
                        </span>
                      </div>
                    )}
                  </div>

                  <p 
                    id={`${stat.id}-description`}
                    className="text-sm text-gray-600 dark:text-gray-400"
                  >
                    {stat.description}
                  </p>

                  {stat.action && (
                    <div className="pt-3">
                      <Button
                        onClick={() => handleNavigation(stat.action!.href)}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start p-0 h-auto text-sm"
                        data-testid={`${stat.id}-action`}
                        aria-label={`${stat.action.label} for ${stat.title}`}
                      >
                        <Eye className="h-3 w-3 mr-2" aria-hidden="true" />
                        {stat.action.label}
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Charts Section */}
      {chartData && (
        <section aria-labelledby="security-charts-heading">
          <h2 id="security-charts-heading" className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
            Security Metrics
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Security Events Timeline */}
            <Card className="p-6" data-testid="security-events-chart">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">
                  Security Events Timeline
                </h3>
                <BarChart3 className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              
              <div className="h-64" aria-label="Security events timeline chart">
                <Chart
                  type="line"
                  data={chartData.securityEvents}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom' as const,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: {
                          color: 'rgba(156, 163, 175, 0.2)', // gray-400 with opacity
                        },
                      },
                      x: {
                        grid: {
                          color: 'rgba(156, 163, 175, 0.2)',
                        },
                      },
                    },
                  }}
                  aria-label="Line chart showing security events and blocked requests over time"
                />
              </div>
            </Card>

            {/* Access Patterns Distribution */}
            <Card className="p-6" data-testid="access-patterns-chart">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">
                  Access Patterns
                </h3>
                <PieChart className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              
              <div className="h-64" aria-label="Access patterns distribution chart">
                <Chart
                  type="doughnut"
                  data={chartData.accessPatterns}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom' as const,
                      },
                    },
                  }}
                  aria-label="Doughnut chart showing distribution of successful, failed, blocked, and rate-limited access attempts"
                />
              </div>
            </Card>
          </div>
        </section>
      )}

      {/* Quick Actions Section */}
      <section aria-labelledby="quick-actions-heading">
        <h2 id="quick-actions-heading" className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
          Quick Actions
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Card
              key={action.id}
              className="group hover:shadow-md transition-all duration-200 cursor-pointer"
              onClick={() => !action.disabled && handleNavigation(action.href)}
              data-testid={`quick-action-${action.id}`}
              role="button"
              tabIndex={action.disabled ? -1 : 0}
              aria-label={`${action.title}: ${action.description}`}
              aria-disabled={action.disabled}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && !action.disabled) {
                  e.preventDefault();
                  handleNavigation(action.href);
                }
              }}
            >
              <div className="p-6 text-center">
                <div className={cn(
                  "inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 transition-colors",
                  action.variant === 'primary' && "bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 group-hover:bg-primary-200 dark:group-hover:bg-primary-900/30",
                  action.variant === 'secondary' && "bg-secondary-100 dark:bg-secondary-900/20 text-secondary-600 dark:text-secondary-400 group-hover:bg-secondary-200 dark:group-hover:bg-secondary-900/30",
                  action.variant === 'outline' && "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-gray-700",
                  action.disabled && "opacity-50"
                )}>
                  <action.icon className="h-6 w-6" aria-hidden="true" />
                </div>
                
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {action.title}
                </h3>
                
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {action.description}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Recent Activity Preview */}
      {securityStats?.recentActivity && (
        <section aria-labelledby="recent-activity-heading">
          <h2 id="recent-activity-heading" className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
            Recent Security Activity
          </h2>
          
          <Card className="p-6" data-testid="recent-activity-preview">
            <div className="space-y-4">
              {securityStats.recentActivity.slice(0, 5).map((activity, index) => (
                <div 
                  key={`${activity.id}-${index}`}
                  className="flex items-start space-x-3 py-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                  role="listitem"
                >
                  <div className={cn(
                    "flex-shrink-0 w-2 h-2 rounded-full mt-2",
                    activity.severity === 'high' && "bg-red-500",
                    activity.severity === 'medium' && "bg-yellow-500",
                    activity.severity === 'low' && "bg-green-500",
                    activity.severity === 'info' && "bg-blue-500"
                  )} aria-hidden="true" />
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {activity.message}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {new Date(activity.timestamp).toLocaleString()} • {activity.source}
                    </p>
                  </div>
                </div>
              ))}
              
              <div className="pt-3 text-center">
                <Button
                  onClick={() => handleNavigation('/api-security/audit')}
                  variant="ghost"
                  size="sm"
                  data-testid="view-all-activity"
                  aria-label="View all security activity logs"
                >
                  View All Activity
                </Button>
              </div>
            </div>
          </Card>
        </section>
      )}
    </div>
  );
}

// Export the component as default
export default SecurityOverview;

// Component display name for debugging
SecurityOverview.displayName = 'SecurityOverview';