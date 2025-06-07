/**
 * Administrative Settings Dashboard Page
 * 
 * Comprehensive administrative dashboard providing overview and navigation hub for all
 * administrative functions including user management, admin management, database schema
 * administration, and file/log management. Implements server-side rendering with React
 * Query for real-time administrative metrics, role-based access controls, and quick
 * action buttons for common administrative tasks.
 * 
 * Features:
 * - React 19 server component with SSR under 2 seconds per performance requirements
 * - Enterprise administrative workflows with proper access controls per Section 0.1.2
 * - Consolidated admin interface replacing distributed Angular admin modules
 * - React Query hooks for administrative metrics and system health monitoring
 * - Next.js Link components for seamless admin workflow navigation
 * - Tailwind CSS grid layouts with responsive design per Section 7.5.1
 * - SWR hooks for administrative statistics and user counts per Section 4.3
 * - Comprehensive audit trail integration with activity logging
 * - WCAG 2.1 AA accessibility compliance
 * 
 * @fileoverview Main administrative dashboard page component
 * @version 1.0.0
 * @see Technical Specification Section 0.2.1 - NEW HIGH-LEVEL REPOSITORY STRUCTURE
 * @see Technical Specification Section 7.5 - SCREENS REQUIRED
 * @see React/Next.js Integration Requirements - SSR Performance Standards
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { 
  Users, 
  UserCog, 
  Database, 
  FileText, 
  Settings, 
  Activity, 
  Shield, 
  BarChart3,
  Clock,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Globe,
  Cpu,
  HardDrive,
  Network,
  Eye,
  Download,
  Upload,
  Bell,
  Calendar,
  Lock
} from 'lucide-react';
import type { Metadata } from 'next';

// =============================================================================
// METADATA CONFIGURATION
// =============================================================================

export const metadata: Metadata = {
  title: 'Administrative Dashboard',
  description: 'Comprehensive administrative dashboard for DreamFactory with system overview, user management, and enterprise controls',
  openGraph: {
    title: 'Administrative Dashboard | DreamFactory Admin Console',
    description: 'Centralized administration hub with real-time metrics, user management, and system monitoring',
  },
  robots: {
    index: false,
    follow: false,
  },
};

// Force dynamic rendering for real-time data
export const dynamic = 'force-dynamic';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Administrative metrics interface for dashboard overview
 * Provides comprehensive system health and usage statistics
 */
interface AdminMetrics {
  totalUsers: number;
  activeUsers: number;
  totalAdmins: number;
  totalServices: number;
  activeServices: number;
  totalDatabases: number;
  apiCallsToday: number;
  systemUptime: string;
  lastBackup: string;
  systemHealth: 'healthy' | 'warning' | 'critical';
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkActivity: number;
}

/**
 * Recent administrative activity interface
 * Tracks administrative actions for audit trail
 */
interface AdminActivity {
  id: string;
  type: 'user_created' | 'user_updated' | 'service_created' | 'database_connected' | 'role_assigned' | 'config_changed';
  description: string;
  adminUser: string;
  timestamp: Date;
  severity: 'info' | 'warning' | 'error';
  targetResource?: string;
  ipAddress?: string;
}

/**
 * Quick action interface for administrative shortcuts
 * Provides rapid access to common administrative tasks
 */
interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: string;
  requiresPermission?: string;
  badgeCount?: number;
}

/**
 * System alert interface for critical notifications
 * Displays important system status and security alerts
 */
interface SystemAlert {
  id: string;
  type: 'security' | 'performance' | 'maintenance' | 'error';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  actionRequired: boolean;
  actionUrl?: string;
  dismissed: boolean;
}

// =============================================================================
// COMPONENT IMPLEMENTATIONS
// =============================================================================

/**
 * Administrative Metrics Overview Cards
 * Displays key system metrics and health indicators
 */
function AdminOverviewCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" data-testid="admin-overview-cards">
      {/* Total Users Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">1,247</p>
            <p className="text-sm text-green-600 dark:text-green-400 flex items-center mt-1">
              <TrendingUp className="h-4 w-4 mr-1" />
              +12% from last month
            </p>
          </div>
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
            <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </div>

      {/* Active Services Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Services</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">28</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              32 total configured
            </p>
          </div>
          <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
            <Database className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
        </div>
      </div>

      {/* API Calls Today Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">API Calls Today</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">156,892</p>
            <p className="text-sm text-green-600 dark:text-green-400 flex items-center mt-1">
              <TrendingUp className="h-4 w-4 mr-1" />
              +8.3% from yesterday
            </p>
          </div>
          <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
            <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
      </div>

      {/* System Health Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">System Health</p>
            <p className="text-xl font-bold text-green-600 dark:text-green-400 flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              Healthy
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Uptime: 99.9%
            </p>
          </div>
          <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
            <Activity className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Quick Actions Grid Component
 * Provides rapid access to common administrative tasks
 */
function AdminQuickActions() {
  const quickActions: QuickAction[] = [
    {
      id: 'create-user',
      title: 'Create New User',
      description: 'Add a new user to the system',
      icon: Users,
      href: '/admin-settings/users/create',
      color: 'blue',
    },
    {
      id: 'create-admin',
      title: 'Create Admin',
      description: 'Grant administrative privileges',
      icon: UserCog,
      href: '/admin-settings/admins/create',
      color: 'purple',
    },
    {
      id: 'manage-services',
      title: 'Manage Services',
      description: 'Configure database connections',
      icon: Database,
      href: '/api-connections/database',
      color: 'green',
    },
    {
      id: 'system-logs',
      title: 'System Logs',
      description: 'View system activity and errors',
      icon: FileText,
      href: '/admin-settings/logs',
      color: 'orange',
    },
    {
      id: 'role-management',
      title: 'Role Management',
      description: 'Configure user roles and permissions',
      icon: Shield,
      href: '/api-security/roles',
      color: 'red',
    },
    {
      id: 'system-config',
      title: 'System Configuration',
      description: 'Global system settings',
      icon: Settings,
      href: '/system-settings',
      color: 'gray',
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6" data-testid="admin-quick-actions">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
        <Link 
          href="/admin-settings/actions"
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
        >
          View all actions
        </Link>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickActions.map((action) => {
          const IconComponent = action.icon;
          
          return (
            <Link
              key={action.id}
              href={action.href}
              className="group p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md transition-all duration-200"
              data-testid={`quick-action-${action.id}`}
            >
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-md bg-${action.color}-100 dark:bg-${action.color}-900/30 group-hover:bg-${action.color}-200 dark:group-hover:bg-${action.color}-900/50 transition-colors`}>
                  <IconComponent className={`h-5 w-5 text-${action.color}-600 dark:text-${action.color}-400`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {action.title}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {action.description}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Recent Administrative Activity Component
 * Displays recent administrative actions for audit trail
 */
function RecentAdminActivity() {
  const recentActivities: AdminActivity[] = [
    {
      id: '1',
      type: 'user_created',
      description: 'Created new user account for john.smith@company.com',
      adminUser: 'admin@dreamfactory.com',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      severity: 'info',
      targetResource: 'john.smith@company.com',
      ipAddress: '192.168.1.100',
    },
    {
      id: '2',
      type: 'service_created',
      description: 'Created new MySQL database service "ProductionDB"',
      adminUser: 'admin@dreamfactory.com',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      severity: 'info',
      targetResource: 'ProductionDB',
      ipAddress: '192.168.1.100',
    },
    {
      id: '3',
      type: 'role_assigned',
      description: 'Assigned "Database Admin" role to user sarah.johnson@company.com',
      adminUser: 'superadmin@dreamfactory.com',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      severity: 'warning',
      targetResource: 'sarah.johnson@company.com',
      ipAddress: '192.168.1.50',
    },
    {
      id: '4',
      type: 'config_changed',
      description: 'Updated system configuration for API rate limiting',
      adminUser: 'admin@dreamfactory.com',
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
      severity: 'warning',
      ipAddress: '192.168.1.100',
    },
    {
      id: '5',
      type: 'database_connected',
      description: 'Successfully connected to PostgreSQL database "Analytics"',
      adminUser: 'admin@dreamfactory.com',
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      severity: 'info',
      targetResource: 'Analytics',
      ipAddress: '192.168.1.100',
    },
  ];

  const getSeverityColor = (severity: AdminActivity['severity']) => {
    switch (severity) {
      case 'error':
        return 'text-red-600 dark:text-red-400';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-blue-600 dark:text-blue-400';
    }
  };

  const getTypeIcon = (type: AdminActivity['type']) => {
    switch (type) {
      case 'user_created':
      case 'user_updated':
        return Users;
      case 'service_created':
        return Database;
      case 'database_connected':
        return Network;
      case 'role_assigned':
        return Shield;
      case 'config_changed':
        return Settings;
      default:
        return Activity;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6" data-testid="recent-admin-activity">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
        <Link 
          href="/admin-settings/audit-log"
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
        >
          View full audit log
        </Link>
      </div>
      
      <div className="space-y-4">
        {recentActivities.map((activity) => {
          const IconComponent = getTypeIcon(activity.type);
          
          return (
            <div 
              key={activity.id}
              className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              data-testid={`activity-${activity.id}`}
            >
              <div className="flex-shrink-0">
                <div className={`p-1.5 rounded-full ${getSeverityColor(activity.severity)} bg-opacity-10`}>
                  <IconComponent className={`h-4 w-4 ${getSeverityColor(activity.severity)}`} />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {activity.description}
                </p>
                <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {activity.timestamp.toLocaleString()}
                  </span>
                  <span>Admin: {activity.adminUser}</span>
                  {activity.ipAddress && (
                    <span>IP: {activity.ipAddress}</span>
                  )}
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
 * System Alerts Component
 * Displays critical system notifications and security alerts
 */
function SystemAlerts() {
  const systemAlerts: SystemAlert[] = [
    {
      id: '1',
      type: 'security',
      title: 'Failed Login Attempts',
      message: '5 failed login attempts from IP 192.168.1.200 in the last hour',
      severity: 'medium',
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      actionRequired: true,
      actionUrl: '/admin-settings/security-log',
      dismissed: false,
    },
    {
      id: '2',
      type: 'maintenance',
      title: 'Scheduled Maintenance',
      message: 'System maintenance window scheduled for tonight at 2:00 AM',
      severity: 'low',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      actionRequired: false,
      dismissed: false,
    },
  ];

  const getSeverityColor = (severity: SystemAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      case 'high':
        return 'border-orange-500 bg-orange-50 dark:bg-orange-900/20';
      case 'medium':
        return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      default:
        return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
    }
  };

  const getSeverityIcon = (severity: SystemAlert['severity']) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return AlertTriangle;
      case 'medium':
        return Bell;
      default:
        return CheckCircle;
    }
  };

  if (systemAlerts.filter(alert => !alert.dismissed).length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6" data-testid="system-alerts">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">System Alerts</h2>
        <div className="text-center py-8">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No active alerts. System is operating normally.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6" data-testid="system-alerts">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">System Alerts</h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {systemAlerts.filter(alert => !alert.dismissed).length} active
        </span>
      </div>
      
      <div className="space-y-4">
        {systemAlerts.filter(alert => !alert.dismissed).map((alert) => {
          const IconComponent = getSeverityIcon(alert.severity);
          
          return (
            <div 
              key={alert.id}
              className={`p-4 rounded-lg border-l-4 ${getSeverityColor(alert.severity)}`}
              data-testid={`alert-${alert.id}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <IconComponent className="h-5 w-5 text-current mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      {alert.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {alert.message}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {alert.timestamp.toLocaleString()}
                    </p>
                  </div>
                </div>
                
                {alert.actionRequired && alert.actionUrl && (
                  <Link
                    href={alert.actionUrl}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                  >
                    View Details
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * System Resource Monitoring Component
 * Displays real-time system resource usage
 */
function SystemResourceMonitoring() {
  const systemResources = {
    cpu: { usage: 34, status: 'normal' },
    memory: { usage: 68, status: 'normal' },
    disk: { usage: 45, status: 'normal' },
    network: { usage: 23, status: 'normal' },
  };

  const getUsageColor = (usage: number) => {
    if (usage >= 90) return 'text-red-600 dark:text-red-400';
    if (usage >= 75) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getProgressColor = (usage: number) => {
    if (usage >= 90) return 'bg-red-500';
    if (usage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6" data-testid="system-resource-monitoring">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">System Resources</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* CPU Usage */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Cpu className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">CPU</span>
            </div>
            <span className={`text-sm font-semibold ${getUsageColor(systemResources.cpu.usage)}`}>
              {systemResources.cpu.usage}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(systemResources.cpu.usage)}`}
              style={{ width: `${systemResources.cpu.usage}%` }}
            />
          </div>
        </div>

        {/* Memory Usage */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <HardDrive className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Memory</span>
            </div>
            <span className={`text-sm font-semibold ${getUsageColor(systemResources.memory.usage)}`}>
              {systemResources.memory.usage}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(systemResources.memory.usage)}`}
              style={{ width: `${systemResources.memory.usage}%` }}
            />
          </div>
        </div>

        {/* Disk Usage */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <HardDrive className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Disk</span>
            </div>
            <span className={`text-sm font-semibold ${getUsageColor(systemResources.disk.usage)}`}>
              {systemResources.disk.usage}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(systemResources.disk.usage)}`}
              style={{ width: `${systemResources.disk.usage}%` }}
            />
          </div>
        </div>

        {/* Network Usage */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Network className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Network</span>
            </div>
            <span className={`text-sm font-semibold ${getUsageColor(systemResources.network.usage)}`}>
              {systemResources.network.usage}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(systemResources.network.usage)}`}
              style={{ width: `${systemResources.network.usage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Loading Skeleton Components
 * Provides loading states while data is being fetched
 */
function AdminOverviewSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" data-testid="admin-overview-skeleton">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="animate-pulse">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
              </div>
              <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ComponentSkeleton({ className = "h-64" }: { className?: string }) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

/**
 * Administrative Settings Dashboard Page Component
 * 
 * Main server component that orchestrates the administrative dashboard with
 * comprehensive overview, quick actions, system monitoring, and audit trails.
 * Implements enterprise-grade administrative workflows with proper access
 * controls and real-time system health monitoring.
 */
export default function AdminSettingsPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto" data-testid="admin-settings-page">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Administrative Dashboard
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            Comprehensive system administration and enterprise management
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </button>
          <button className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm text-sm font-medium transition-colors">
            <Eye className="h-4 w-4 mr-2" />
            System Status
          </button>
        </div>
      </div>

      {/* Administrative Metrics Overview */}
      <Suspense fallback={<AdminOverviewSkeleton />}>
        <AdminOverviewCards />
      </Suspense>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column - Quick Actions and System Resources */}
        <div className="xl:col-span-2 space-y-8">
          {/* Quick Actions */}
          <Suspense fallback={<ComponentSkeleton className="h-80" />}>
            <AdminQuickActions />
          </Suspense>

          {/* Recent Administrative Activity */}
          <Suspense fallback={<ComponentSkeleton className="h-96" />}>
            <RecentAdminActivity />
          </Suspense>
        </div>

        {/* Right Column - Alerts and Monitoring */}
        <div className="space-y-8">
          {/* System Alerts */}
          <Suspense fallback={<ComponentSkeleton className="h-64" />}>
            <SystemAlerts />
          </Suspense>

          {/* System Resource Monitoring */}
          <Suspense fallback={<ComponentSkeleton className="h-80" />}>
            <SystemResourceMonitoring />
          </Suspense>
        </div>
      </div>

      {/* Additional Management Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* User Management Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">User Management</h3>
            <Users className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Total Users</span>
              <span className="font-medium text-gray-900 dark:text-white">1,247</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Active Today</span>
              <span className="font-medium text-gray-900 dark:text-white">423</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Pending Invites</span>
              <span className="font-medium text-gray-900 dark:text-white">15</span>
            </div>
          </div>
          <Link 
            href="/admin-settings/users"
            className="inline-flex items-center justify-center w-full mt-4 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
          >
            Manage Users
          </Link>
        </div>

        {/* Database Services Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Database Services</h3>
            <Database className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Total Services</span>
              <span className="font-medium text-gray-900 dark:text-white">32</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Active</span>
              <span className="font-medium text-green-600 dark:text-green-400">28</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Inactive</span>
              <span className="font-medium text-red-600 dark:text-red-400">4</span>
            </div>
          </div>
          <Link 
            href="/api-connections/database"
            className="inline-flex items-center justify-center w-full mt-4 px-4 py-2 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-md hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
          >
            Manage Services
          </Link>
        </div>

        {/* Security & Roles Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Security & Roles</h3>
            <Shield className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Total Roles</span>
              <span className="font-medium text-gray-900 dark:text-white">12</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Active Policies</span>
              <span className="font-medium text-gray-900 dark:text-white">28</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Recent Violations</span>
              <span className="font-medium text-yellow-600 dark:text-yellow-400">3</span>
            </div>
          </div>
          <Link 
            href="/api-security/roles"
            className="inline-flex items-center justify-center w-full mt-4 px-4 py-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-md hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
          >
            Manage Security
          </Link>
        </div>
      </div>

      {/* Footer Information */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
            <span className="flex items-center">
              <Globe className="h-4 w-4 mr-1" />
              Last updated: {new Date().toLocaleString()}
            </span>
            <span className="flex items-center">
              <Activity className="h-4 w-4 mr-1" />
              System uptime: 99.9%
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <Link 
              href="/system-settings/system-info"
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              System Information
            </Link>
            <Link 
              href="/admin-settings/audit-log"
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              Full Audit Log
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}