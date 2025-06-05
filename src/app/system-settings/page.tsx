/**
 * @fileoverview System Settings Dashboard Page
 * 
 * Main system settings dashboard that provides centralized navigation and overview 
 * for all system administration features including cache management, CORS configuration,
 * email templates, global lookup keys, scheduler management, and service reporting.
 * 
 * Implements Next.js server component with React Query for real-time system status 
 * monitoring and Tailwind CSS responsive design.
 * 
 * @version 1.0.0
 * @since Next.js 15.1.0 / React 19.0.0
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { 
  Settings, 
  Database, 
  Mail, 
  Globe,
  Clock,
  BarChart3,
  Key,
  Shield,
  Zap,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Activity,
  Server,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import type { Metadata } from 'next';

// UI Components
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

// System Configuration Hook
import { useSystemConfig } from '@/hooks/use-system-config';

// =============================================================================
// METADATA CONFIGURATION
// =============================================================================

export const metadata: Metadata = {
  title: 'System Settings',
  description: 'Centralized system administration dashboard for DreamFactory configuration management',
  openGraph: {
    title: 'System Settings | DreamFactory Admin Console',
    description: 'Manage cache, CORS, email templates, scheduler, and global system configuration',
  },
};

// Force dynamic rendering for real-time system status
export const dynamic = 'force-dynamic';

// =============================================================================
// SYSTEM SETTINGS CONFIGURATION
// =============================================================================

/**
 * System settings sections configuration
 * Defines all available system administration areas with navigation and status
 */
const SYSTEM_SETTINGS_SECTIONS = [
  {
    id: 'cache',
    title: 'Cache Management',
    description: 'Configure and monitor application caching strategies',
    icon: Zap,
    path: '/system-settings/cache',
    color: 'bg-blue-500',
    lightColor: 'bg-blue-50',
    darkColor: 'dark:bg-blue-900/20',
    textColor: 'text-blue-600',
    features: [
      'Redis cache configuration',
      'Cache performance metrics',
      'Cache key management',
      'TTL configuration'
    ],
    status: 'healthy',
    lastUpdate: '2 minutes ago'
  },
  {
    id: 'cors',
    title: 'CORS Configuration',
    description: 'Manage Cross-Origin Resource Sharing policies',
    icon: Globe,
    path: '/system-settings/cors',
    color: 'bg-green-500',
    lightColor: 'bg-green-50',
    darkColor: 'dark:bg-green-900/20',
    textColor: 'text-green-600',
    features: [
      'Origin whitelist management',
      'HTTP methods configuration',
      'Headers and credentials',
      'Preflight handling'
    ],
    status: 'healthy',
    lastUpdate: '5 minutes ago'
  },
  {
    id: 'email-templates',
    title: 'Email Templates',
    description: 'Design and manage system email templates',
    icon: Mail,
    path: '/system-settings/email-templates',
    color: 'bg-purple-500',
    lightColor: 'bg-purple-50',
    darkColor: 'dark:bg-purple-900/20',
    textColor: 'text-purple-600',
    features: [
      'Template editor with variables',
      'Multi-language support',
      'HTML and plain text formats',
      'Preview and testing'
    ],
    status: 'healthy',
    lastUpdate: '1 hour ago'
  },
  {
    id: 'lookup-keys',
    title: 'Global Lookup Keys',
    description: 'Manage application-wide lookup values and constants',
    icon: Key,
    path: '/system-settings/lookup-keys',
    color: 'bg-amber-500',
    lightColor: 'bg-amber-50',
    darkColor: 'dark:bg-amber-900/20',
    textColor: 'text-amber-600',
    features: [
      'Key-value pair management',
      'Environment-specific values',
      'Configuration inheritance',
      'Validation and constraints'
    ],
    status: 'healthy',
    lastUpdate: '30 minutes ago'
  },
  {
    id: 'scheduler',
    title: 'Task Scheduler',
    description: 'Schedule and monitor automated system tasks',
    icon: Clock,
    path: '/system-settings/scheduler',
    color: 'bg-indigo-500',
    lightColor: 'bg-indigo-50',
    darkColor: 'dark:bg-indigo-900/20',
    textColor: 'text-indigo-600',
    features: [
      'Cron job management',
      'Task execution monitoring',
      'Error handling and retries',
      'Performance analytics'
    ],
    status: 'warning',
    lastUpdate: '10 minutes ago'
  },
  {
    id: 'reports',
    title: 'Service Reports',
    description: 'Generate and view system and service analytics',
    icon: BarChart3,
    path: '/system-settings/reports',
    color: 'bg-rose-500',
    lightColor: 'bg-rose-50',
    darkColor: 'dark:bg-rose-900/20',
    textColor: 'text-rose-600',
    features: [
      'API usage analytics',
      'Performance dashboards',
      'Error rate monitoring',
      'Custom report builder'
    ],
    status: 'healthy',
    lastUpdate: '15 minutes ago'
  },
  {
    id: 'system-info',
    title: 'System Information',
    description: 'View platform, server, and environment details',
    icon: Server,
    path: '/system-settings/system-info',
    color: 'bg-gray-500',
    lightColor: 'bg-gray-50',
    darkColor: 'dark:bg-gray-900/20',
    textColor: 'text-gray-600',
    features: [
      'Platform version info',
      'Server specifications',
      'PHP configuration',
      'Database driver status'
    ],
    status: 'healthy',
    lastUpdate: 'Just now'
  }
] as const;

// =============================================================================
// CLIENT COMPONENTS
// =============================================================================

/**
 * System Status Overview Component
 * Displays real-time system health metrics
 */
function SystemStatusOverview() {
  const { environment, system, isLoading, error, isFetching } = useSystemConfig();

  if (isLoading) {
    return (
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        data-testid="system-status-loading"
      >
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="error" className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <div>
          <h3 className="font-semibold">System Status Unavailable</h3>
          <p className="text-sm mt-1">
            Unable to fetch system configuration. Please check your connection and try again.
          </p>
        </div>
      </Alert>
    );
  }

  // Calculate system health metrics
  const totalServices = system?.resource?.length || 0;
  const platform = environment?.platform;
  const serverInfo = environment?.server;
  
  const statusMetrics = [
    {
      label: 'Platform Status',
      value: platform?.version ? 'Online' : 'Unknown',
      status: platform?.version ? 'healthy' : 'warning',
      icon: CheckCircle,
      details: platform?.version ? `Version ${platform.version}` : 'Unable to determine version'
    },
    {
      label: 'Active Services',
      value: totalServices.toString(),
      status: totalServices > 0 ? 'healthy' : 'warning',
      icon: Database,
      details: `${totalServices} registered services`
    },
    {
      label: 'Server Health',
      value: serverInfo?.host ? 'Running' : 'Unknown',
      status: serverInfo?.host ? 'healthy' : 'warning',
      icon: Server,
      details: serverInfo?.serverOs || 'Server information unavailable'
    },
    {
      label: 'Cache Driver',
      value: platform?.cacheDriver || 'Unknown',
      status: platform?.cacheDriver ? 'healthy' : 'warning',
      icon: Activity,
      details: platform?.cacheDriver ? `Using ${platform.cacheDriver}` : 'Cache driver not configured'
    }
  ];

  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
      data-testid="system-status-overview"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          System Status Overview
        </h2>
        <div className="flex items-center space-x-2">
          {isFetching && (
            <RefreshCw className="h-4 w-4 text-gray-400 animate-spin" />
          )}
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statusMetrics.map((metric) => {
          const Icon = metric.icon;
          const isHealthy = metric.status === 'healthy';
          
          return (
            <div 
              key={metric.label}
              className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${isHealthy ? 'bg-green-100 dark:bg-green-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
                  <Icon className={`h-5 w-5 ${isHealthy ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {metric.label}
                  </p>
                  <p className={`text-lg font-semibold ${isHealthy ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {metric.value}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={metric.details}>
                    {metric.details}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Settings Section Card Component
 * Displays individual system setting sections with status and navigation
 */
function SettingsSectionCard({ section }: { section: typeof SYSTEM_SETTINGS_SECTIONS[0] }) {
  const Icon = section.icon;
  const isHealthy = section.status === 'healthy';
  const isWarning = section.status === 'warning';
  
  return (
    <Link 
      href={section.path}
      className="group block h-full"
      data-testid={`settings-section-${section.id}`}
    >
      <div className={`
        h-full p-6 rounded-lg border transition-all duration-200
        bg-white dark:bg-gray-800 
        border-gray-200 dark:border-gray-700
        group-hover:border-gray-300 dark:group-hover:border-gray-600
        group-hover:shadow-md group-hover:shadow-gray-200/50 dark:group-hover:shadow-gray-900/50
        group-hover:-translate-y-1
      `}>
        <div className="flex items-start justify-between mb-4">
          <div className={`
            p-3 rounded-lg 
            ${section.lightColor} ${section.darkColor}
            group-hover:scale-110 transition-transform duration-200
          `}>
            <Icon className={`h-6 w-6 ${section.textColor} dark:text-white`} />
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Status indicator */}
            <div className={`
              w-3 h-3 rounded-full
              ${isHealthy ? 'bg-green-400' : isWarning ? 'bg-amber-400' : 'bg-red-400'}
            `} />
            
            {/* External link icon */}
            <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transform group-hover:translate-x-1 transition-transform duration-200" />
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-gray-700 dark:group-hover:text-gray-200">
              {section.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {section.description}
            </p>
          </div>

          {/* Features list */}
          <div className="space-y-1">
            {section.features.slice(0, 3).map((feature, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500" />
                <span className="text-xs text-gray-500 dark:text-gray-400">{feature}</span>
              </div>
            ))}
            {section.features.length > 3 && (
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500" />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  +{section.features.length - 3} more features
                </span>
              </div>
            )}
          </div>

          {/* Last update info */}
          <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className={`
                text-xs font-medium
                ${isHealthy ? 'text-green-600 dark:text-green-400' : isWarning ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}
              `}>
                {isHealthy ? 'Healthy' : isWarning ? 'Warning' : 'Error'}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {section.lastUpdate}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

/**
 * Quick Actions Component
 * Provides rapid access to common system administration tasks
 */
function QuickActions() {
  const quickActions = [
    {
      label: 'Clear All Cache',
      action: 'cache-clear',
      icon: RefreshCw,
      variant: 'outline' as const,
      description: 'Clear all application caches'
    },
    {
      label: 'System Health Check',
      action: 'health-check',
      icon: Activity,
      variant: 'outline' as const,
      description: 'Run comprehensive system diagnostics'
    },
    {
      label: 'Backup Settings',
      action: 'backup',
      icon: Shield,
      variant: 'outline' as const,
      description: 'Create configuration backup'
    },
    {
      label: 'View System Logs',
      action: 'logs',
      icon: ExternalLink,
      variant: 'primary' as const,
      description: 'Open system log viewer'
    }
  ];

  const handleQuickAction = (action: string) => {
    // TODO: Implement quick actions using React Hook Form and mutations
    console.log(`Executing quick action: ${action}`);
    
    // This would typically trigger:
    // - React Query mutations for API calls
    // - Zustand store updates for UI state
    // - React Hook Form for any configuration forms
    // - Next.js API routes for server-side operations
  };

  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
      data-testid="quick-actions"
    >
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        Quick Actions
      </h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          
          return (
            <Button
              key={action.action}
              variant={action.variant}
              size="sm"
              onClick={() => handleQuickAction(action.action)}
              className="h-auto p-4 flex flex-col items-center space-y-2 group"
              title={action.description}
            >
              <Icon className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
              <span className="text-xs font-medium text-center leading-tight">
                {action.label}
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

/**
 * System Settings Dashboard Page
 * 
 * Main entry point for system administration featuring:
 * - Real-time system status monitoring
 * - Centralized navigation to all settings sections
 * - Quick actions for common tasks
 * - Responsive design with Tailwind CSS
 * - Server-side rendering with Next.js
 * - Intelligent caching with React Query
 */
export default function SystemSettingsPage() {
  return (
    <div className="space-y-8" data-testid="system-settings-page">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            System Settings
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            Centralized administration for DreamFactory configuration and monitoring
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Global Config
          </Button>
          <Button variant="primary" size="sm">
            <ExternalLink className="h-4 w-4 mr-2" />
            View Logs
          </Button>
        </div>
      </div>

      {/* System Status Overview - Client Component with React Query */}
      <Suspense 
        fallback={
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        }
      >
        <SystemStatusOverview />
      </Suspense>

      {/* Quick Actions */}
      <QuickActions />

      {/* Settings Sections Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Configuration Areas
          </h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {SYSTEM_SETTINGS_SECTIONS.length} sections available
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SYSTEM_SETTINGS_SECTIONS.map((section) => (
            <SettingsSectionCard key={section.id} section={section} />
          ))}
        </div>
      </div>

      {/* Help and Documentation */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start space-x-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <ExternalLink className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Need Help with System Configuration?
            </h3>
            <p className="text-blue-800 dark:text-blue-200 mb-4">
              Access comprehensive documentation, tutorials, and best practices for managing your DreamFactory instance.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-900/30">
                <ExternalLink className="h-4 w-4 mr-2" />
                Documentation
              </Button>
              <Button variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-900/30">
                <Activity className="h-4 w-4 mr-2" />
                Health Guide
              </Button>
              <Button variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-900/30">
                <Settings className="h-4 w-4 mr-2" />
                Best Practices
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}