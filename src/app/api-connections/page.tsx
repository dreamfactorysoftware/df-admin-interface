/**
 * API Connections Overview Page Component
 * 
 * Main dashboard for managing all database service connections, providing centralized
 * access to connection statistics, service status monitoring, and navigation to
 * database services, schema discovery, and API generation workflows.
 * 
 * Implements Next.js server component with SSR capability and React Query
 * for intelligent data fetching and caching per React/Next.js integration requirements.
 */

import { Suspense } from 'react'
import { Metadata } from 'next'
import Link from 'next/link'
import { 
  DatabaseIcon, 
  DocumentTextIcon,
  ChartBarIcon,
  PlusIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

// Types and interfaces
interface DatabaseService {
  id: string
  name: string
  type: 'mysql' | 'postgresql' | 'oracle' | 'mongodb' | 'snowflake'
  status: 'connected' | 'error' | 'testing'
  lastTested: string
  tableCount?: number
  endpointCount?: number
}

interface ConnectionStats {
  totalServices: number
  activeConnections: number
  failedConnections: number
  totalEndpoints: number
  totalTables: number
}

// Page metadata for SEO and performance
export const metadata: Metadata = {
  title: 'API Connections | DreamFactory',
  description: 'Manage database service connections and monitor API endpoint status',
}

/**
 * Loading component for server-side rendering optimization
 */
function ConnectionStatsLoading() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg animate-pulse">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mt-2"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Connection Statistics Cards Component
 */
function ConnectionStats() {
  // Simulated stats - in real implementation, this would use React Query
  const stats: ConnectionStats = {
    totalServices: 12,
    activeConnections: 10,
    failedConnections: 2,
    totalEndpoints: 148,
    totalTables: 89
  }

  const statCards = [
    {
      name: 'Total Services',
      value: stats.totalServices,
      icon: DatabaseIcon,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      name: 'Active Connections',
      value: stats.activeConnections,
      icon: CheckCircleIcon,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      name: 'Failed Connections',
      value: stats.failedConnections,
      icon: ExclamationTriangleIcon,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20'
    },
    {
      name: 'Total Endpoints',
      value: stats.totalEndpoints,
      icon: DocumentTextIcon,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    }
  ]

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => (
        <div key={stat.name} className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`p-2 rounded-md ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} aria-hidden="true" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    {stat.name}
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {stat.value}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Recent Services Component
 */
function RecentServices() {
  // Simulated recent services - in real implementation, this would use React Query
  const recentServices: DatabaseService[] = [
    {
      id: '1',
      name: 'Production MySQL',
      type: 'mysql',
      status: 'connected',
      lastTested: '2024-01-15T10:30:00Z',
      tableCount: 45,
      endpointCount: 67
    },
    {
      id: '2',
      name: 'Analytics PostgreSQL',
      type: 'postgresql',
      status: 'connected',
      lastTested: '2024-01-15T10:25:00Z',
      tableCount: 23,
      endpointCount: 34
    },
    {
      id: '3',
      name: 'User Data MongoDB',
      type: 'mongodb',
      status: 'error',
      lastTested: '2024-01-15T09:45:00Z',
      tableCount: 0,
      endpointCount: 0
    }
  ]

  const getStatusBadge = (status: DatabaseService['status']) => {
    switch (status) {
      case 'connected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
            <CheckCircleIcon className="w-3 h-3 mr-1" />
            Connected
          </span>
        )
      case 'error':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
            <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
            Error
          </span>
        )
      case 'testing':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
            <ClockIcon className="w-3 h-3 mr-1" />
            Testing
          </span>
        )
      default:
        return null
    }
  }

  const getDatabaseIcon = (type: DatabaseService['type']) => {
    // In a real implementation, these would be specific database icons
    return <DatabaseIcon className="h-5 w-5 text-gray-400" />
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
            Recent Services
          </h3>
          <Link
            href="/api-connections/database"
            className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
          >
            View all
          </Link>
        </div>
        
        <div className="flow-root">
          <ul role="list" className="-my-5 divide-y divide-gray-200 dark:divide-gray-700">
            {recentServices.map((service) => (
              <li key={service.id} className="py-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {getDatabaseIcon(service.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {service.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                      {service.type} • {service.tableCount} tables • {service.endpointCount} endpoints
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    {getStatusBadge(service.status)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

/**
 * Quick Actions Component
 */
function QuickActions() {
  const actions = [
    {
      name: 'Create Database Service',
      description: 'Connect to a new database and generate APIs',
      href: '/api-connections/database/create',
      icon: PlusIcon,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      name: 'Browse Schema',
      description: 'Explore database tables and relationships',
      href: '/api-connections/database',
      icon: ChartBarIcon,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      name: 'API Documentation',
      description: 'View and test generated endpoints',
      href: '/adf-api-docs',
      icon: DocumentTextIcon,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    }
  ]

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {actions.map((action) => (
            <Link
              key={action.name}
              href={action.href}
              className="relative group rounded-lg p-6 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 transition-colors duration-200"
            >
              <div>
                <span className={`inline-flex p-3 rounded-lg ${action.bgColor}`}>
                  <action.icon className={`h-6 w-6 ${action.color}`} aria-hidden="true" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  <span className="absolute inset-0" aria-hidden="true" />
                  {action.name}
                </h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {action.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Page Header Component
 */
function PageHeader() {
  return (
    <div className="md:flex md:items-center md:justify-between">
      <div className="flex-1 min-w-0">
        <h1 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl sm:truncate">
          API Connections
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage database connections and monitor API endpoint status
        </p>
      </div>
      <div className="mt-4 flex md:mt-0 md:ml-4">
        <Link
          href="/api-connections/database/create"
          className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors duration-200"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          New Connection
        </Link>
      </div>
    </div>
  )
}

/**
 * Main API Connections Page Component
 * 
 * Next.js server component that provides SSR capability and serves as the
 * entry point for database service management workflows.
 */
export default function ApiConnectionsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="px-4 sm:px-0 mb-8">
          <PageHeader />
        </div>

        {/* Main Content */}
        <div className="px-4 sm:px-0 space-y-8">
          {/* Connection Statistics */}
          <section aria-labelledby="connection-stats-heading">
            <h2 id="connection-stats-heading" className="sr-only">
              Connection Statistics
            </h2>
            <Suspense fallback={<ConnectionStatsLoading />}>
              <ConnectionStats />
            </Suspense>
          </section>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Recent Services */}
            <section aria-labelledby="recent-services-heading">
              <h2 id="recent-services-heading" className="sr-only">
                Recent Services
              </h2>
              <RecentServices />
            </section>

            {/* Quick Actions */}
            <section aria-labelledby="quick-actions-heading">
              <h2 id="quick-actions-heading" className="sr-only">
                Quick Actions
              </h2>
              <QuickActions />
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}