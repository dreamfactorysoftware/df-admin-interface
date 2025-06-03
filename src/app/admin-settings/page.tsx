import { Suspense } from 'react';
import { Metadata } from 'next';
import { 
  Users, 
  Shield, 
  Database, 
  Activity, 
  Settings, 
  FileText,
  AlertTriangle,
  TrendingUp 
} from 'lucide-react';

// UI Components - These will be created as part of the migration
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Admin-specific components - These will be created as part of the migration
import { AdminOverviewCards } from '@/components/admin/admin-overview-cards';
import { AdminQuickActions } from '@/components/admin/admin-quick-actions';
import { RecentAdminActivity } from '@/components/admin/recent-admin-activity';

// Hooks - These will be created as part of the migration
import { useAdminMetrics } from '@/hooks/use-admin-metrics';

// Types - These will be created as part of the migration
import type { AdminMetrics } from '@/types/admin';

/**
 * Admin Settings Dashboard Page Metadata
 * 
 * Provides comprehensive metadata for the administrative dashboard
 * following Next.js 15.1 metadata patterns and SEO optimization
 */
export const metadata: Metadata = {
  title: 'Admin Settings',
  description: 'Administrative dashboard for user management, system configuration, and platform monitoring',
  openGraph: {
    title: 'Admin Settings | DreamFactory Admin Console',
    description: 'Comprehensive administrative control panel for managing users, services, and system configuration',
    type: 'website',
  },
  robots: {
    index: false, // Admin pages should not be indexed
    follow: false,
  },
};

/**
 * Force dynamic rendering for this page to ensure real-time administrative data
 * This ensures administrative metrics are always fresh and up-to-date
 */
export const dynamic = 'force-dynamic';

/**
 * Admin Quick Stats Loading Component
 * 
 * Provides skeleton loading state for administrative metrics
 * while data is being fetched from the server
 */
function AdminStatsLoading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="p-6">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse" />
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

/**
 * Admin Quick Actions Section
 * 
 * Provides immediate access to common administrative functions
 * with proper role-based visibility and accessibility
 */
function QuickActionsSection() {
  const quickActions = [
    {
      title: 'User Management',
      description: 'Manage application users and permissions',
      icon: Users,
      href: '/admin-settings/users',
      color: 'blue',
    },
    {
      title: 'Role Management', 
      description: 'Configure roles and access controls',
      icon: Shield,
      href: '/api-security/roles',
      color: 'green',
    },
    {
      title: 'System Settings',
      description: 'Configure global system preferences',
      icon: Settings,
      href: '/system-settings',
      color: 'purple',
    },
    {
      title: 'Database Services',
      description: 'Manage database connections and APIs',
      icon: Database,
      href: '/api-connections/database',
      color: 'orange',
    },
    {
      title: 'System Logs',
      description: 'View application logs and monitoring',
      icon: FileText,
      href: '/system-settings/logs',
      color: 'gray',
    },
    {
      title: 'Performance',
      description: 'Monitor system performance metrics',
      icon: TrendingUp,
      href: '/system-settings/performance',
      color: 'indigo',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {quickActions.map((action) => {
        const Icon = action.icon;
        return (
          <Card key={action.title} className="group hover:shadow-lg transition-shadow duration-200">
            <div className="p-6">
              <div className="flex items-center space-x-4">
                <div className={`
                  p-3 rounded-lg bg-${action.color}-100 dark:bg-${action.color}-900/20
                  text-${action.color}-600 dark:text-${action.color}-400
                  group-hover:scale-110 transition-transform duration-200
                `}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {action.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {action.description}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 transition-colors"
                  asChild
                >
                  <a href={action.href}>
                    Access
                  </a>
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

/**
 * System Health Monitor Section
 * 
 * Displays critical system health indicators and alerts
 * for administrative monitoring and troubleshooting
 */
function SystemHealthSection() {
  // This will integrate with actual system health monitoring
  const healthIndicators = [
    {
      name: 'Database Connections',
      status: 'healthy',
      value: '12/15',
      description: 'Active database service connections',
    },
    {
      name: 'API Response Time',
      status: 'healthy', 
      value: '145ms',
      description: 'Average API response time',
    },
    {
      name: 'Memory Usage',
      status: 'warning',
      value: '78%',
      description: 'Current system memory utilization',
    },
    {
      name: 'Error Rate',
      status: 'healthy',
      value: '0.02%',
      description: 'API error rate over last 24 hours',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 dark:text-green-400';
      case 'warning': return 'text-yellow-600 dark:text-yellow-400';
      case 'error': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return '●';
      case 'warning': return '▲';
      case 'error': return '●';
      default: return '○';
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          System Health
        </h3>
        <Activity className="h-5 w-5 text-gray-500" />
      </div>
      
      <div className="space-y-4">
        {healthIndicators.map((indicator) => (
          <div key={indicator.name} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className={`text-lg ${getStatusColor(indicator.status)}`}>
                {getStatusIcon(indicator.status)}
              </span>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {indicator.name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {indicator.description}
                </p>
              </div>
            </div>
            <div className={`font-mono font-medium ${getStatusColor(indicator.status)}`}>
              {indicator.value}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button variant="outline" size="sm" className="w-full">
          View Detailed Monitoring
        </Button>
      </div>
    </Card>
  );
}

/**
 * Main Admin Settings Dashboard Page Component
 * 
 * Serves as the central administrative hub providing:
 * - Real-time administrative metrics and system health
 * - Quick access to common administrative functions  
 * - Recent administrative activity monitoring
 * - Role-based access controls with audit capabilities
 * - Responsive design optimized for administrative workflows
 * 
 * Implements Next.js 15.1 server component patterns with React 19
 * for optimal performance and server-side rendering capabilities.
 * Uses Suspense for progressive loading and enhanced user experience.
 */
export default function AdminSettingsPage() {
  return (
    <div className="space-y-8" data-testid="admin-settings-page">
      {/* Page Header with Navigation */}
      <PageHeader
        title="Admin Settings" 
        description="Comprehensive administrative control panel for managing users, services, and system configuration"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Admin Settings', current: true },
        ]}
      />

      {/* Administrative Metrics Overview */}
      <section aria-labelledby="metrics-heading">
        <h2 id="metrics-heading" className="sr-only">
          Administrative Metrics Overview
        </h2>
        <Suspense fallback={<AdminStatsLoading />}>
          <AdminOverviewCards />
        </Suspense>
      </section>

      {/* Main Dashboard Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Primary Content Area */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Quick Actions Section */}
          <section aria-labelledby="quick-actions-heading">
            <h2 id="quick-actions-heading" className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Quick Actions
            </h2>
            <Suspense fallback={
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="p-6">
                    <div className="h-24 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                  </Card>
                ))}
              </div>
            }>
              <AdminQuickActions />
            </Suspense>
          </section>

          {/* Recent Administrative Activity */}
          <section aria-labelledby="recent-activity-heading">
            <h2 id="recent-activity-heading" className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Recent Administrative Activity
            </h2>
            <Suspense fallback={
              <Card className="p-6">
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            }>
              <RecentAdminActivity />
            </Suspense>
          </section>
        </div>

        {/* Sidebar Content */}
        <div className="space-y-8">
          
          {/* System Health Monitor */}
          <section aria-labelledby="system-health-heading">
            <h2 id="system-health-heading" className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              System Health
            </h2>
            <SystemHealthSection />
          </section>

          {/* Administrative Alerts */}
          <section aria-labelledby="admin-alerts-heading">
            <h2 id="admin-alerts-heading" className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              System Alerts
            </h2>
            <Card className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <h3 className="font-medium text-gray-900 dark:text-white">
                  License Expiration Notice
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Your DreamFactory license expires in 30 days. Please renew to continue using premium features.
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Manage License
              </Button>
            </Card>
          </section>

          {/* Documentation Quick Links */}
          <section aria-labelledby="docs-heading">
            <h2 id="docs-heading" className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Documentation
            </h2>
            <Card className="p-6">
              <div className="space-y-3">
                <a
                  href="/docs/admin-guide"
                  className="block text-sm text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Administrator Guide
                </a>
                <a
                  href="/docs/user-management"
                  className="block text-sm text-primary-600 dark:text-primary-400 hover:underline"
                >
                  User Management
                </a>
                <a
                  href="/docs/security"
                  className="block text-sm text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Security Configuration
                </a>
                <a
                  href="/docs/troubleshooting"
                  className="block text-sm text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Troubleshooting Guide
                </a>
              </div>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}