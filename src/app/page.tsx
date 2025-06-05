import { Suspense } from 'react';
import { Metadata } from 'next';
import { Activity, Database, Users, Shield, Settings, Zap, FileText, Monitor } from 'lucide-react';
import Link from 'next/link';

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Dynamic imports for client components that need interactivity
import dynamic from 'next/dynamic';

// Dynamically imported client components for optimal loading
const SystemStatusIndicator = dynamic(() => import('@/components/dashboard/system-status'), {
  loading: () => (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
    </div>
  ),
  ssr: false,
});

const RecentActivityFeed = dynamic(() => import('@/components/dashboard/recent-activity'), {
  loading: () => (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="animate-pulse flex space-x-3">
          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  ),
  ssr: false,
});

const ServiceHealthMonitor = dynamic(() => import('@/components/dashboard/service-health'), {
  loading: () => (
    <div className="grid grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
        </div>
      ))}
    </div>
  ),
  ssr: false,
});

// Static overview stats component for SSR optimization
function StatsOverview() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Database Services</CardTitle>
          <Database className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="h-7 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>}>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">No services configured</p>
          </Suspense>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Generated APIs</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="h-7 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>}>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Ready to generate</p>
          </Suspense>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="h-7 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>}>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">Current session</p>
          </Suspense>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">System Status</CardTitle>
          <Monitor className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="h-7 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>}>
            <SystemStatusIndicator />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

// Quick actions component with navigation links
function QuickActions() {
  const actions = [
    {
      title: 'Connect Database',
      description: 'Create your first database service',
      href: '/api-connections/database/create',
      icon: Database,
      variant: 'default' as const,
    },
    {
      title: 'Manage Users',
      description: 'Add and configure user accounts',
      href: '/admin-settings/users',
      icon: Users,
      variant: 'outline' as const,
    },
    {
      title: 'Security Settings',
      description: 'Configure roles and permissions',
      href: '/api-security/roles',
      icon: Shield,
      variant: 'outline' as const,
    },
    {
      title: 'System Settings',
      description: 'Configure global settings',
      href: '/system-settings',
      icon: Settings,
      variant: 'outline' as const,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {actions.map((action) => (
        <Card key={action.href} className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href={action.href}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <action.icon className="h-4 w-4" />
                {action.title}
              </CardTitle>
              <CardDescription className="text-xs">
                {action.description}
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>
      ))}
    </div>
  );
}

// Welcome section for new users
function WelcomeSection() {
  return (
    <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 dark:border-blue-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
          <Zap className="h-5 w-5" />
          Welcome to DreamFactory
        </CardTitle>
        <CardDescription className="text-blue-700 dark:text-blue-200">
          Generate REST APIs from your databases in under 5 minutes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          Get started by connecting your first database and automatically generating comprehensive REST APIs 
          with authentication, documentation, and security features.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Link href="/api-connections/database/create">
              <Database className="h-4 w-4 mr-2" />
              Connect Database
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-200">
            <Link href="/adf-home/quickstart">
              <FileText className="h-4 w-4 mr-2" />
              View Guide
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Main dashboard component
export default function DashboardPage() {
  return (
    <div className="space-y-8" data-testid="dashboard-page">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            DreamFactory Admin Console
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            Manage your database APIs and services
          </p>
        </div>
      </div>

      {/* Welcome Section */}
      <WelcomeSection />

      {/* Stats Overview */}
      <StatsOverview />

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Quick Actions
        </h2>
        <QuickActions />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest system events and user actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense
                fallback={
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="animate-pulse flex space-x-3">
                        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                }
              >
                <RecentActivityFeed />
              </Suspense>
            </CardContent>
          </Card>

          {/* Service Health */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Service Health
              </CardTitle>
              <CardDescription>
                Monitor your database services and API performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense
                fallback={
                  <div className="grid grid-cols-2 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2"></div>
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                      </div>
                    ))}
                  </div>
                }
              >
                <ServiceHealthMonitor />
              </Suspense>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Quick Start Guide */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Getting Started</CardTitle>
              <CardDescription>
                Follow these steps to set up your first API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-900 dark:bg-blue-900 dark:text-blue-100">
                    1
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Connect Your Database</p>
                    <p className="text-xs text-muted-foreground">
                      Add your MySQL, PostgreSQL, or other database
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-900 dark:bg-gray-800 dark:text-gray-100">
                    2
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Explore Schema</p>
                    <p className="text-xs text-muted-foreground">
                      Browse your database tables and relationships
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-900 dark:bg-gray-800 dark:text-gray-100">
                    3
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Generate APIs</p>
                    <p className="text-xs text-muted-foreground">
                      Create REST endpoints with one click
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-900 dark:bg-gray-800 dark:text-gray-100">
                    4
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Test & Document</p>
                    <p className="text-xs text-muted-foreground">
                      Use built-in testing and documentation tools
                    </p>
                  </div>
                </div>
              </div>
              <Button asChild size="sm" className="w-full">
                <Link href="/adf-home/quickstart">
                  View Full Guide
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* System Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">System Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Version</span>
                <span className="font-medium">DreamFactory 5.0</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Platform</span>
                <span className="font-medium">React 19 / Next.js 15.1</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">License</span>
                <span className="font-medium">Open Source</span>
              </div>
              <div className="pt-2 border-t">
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href="/system-settings/system-info">
                    View Details
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Metadata for SEO and Next.js optimization
export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'DreamFactory Admin Console dashboard with system overview and quick actions',
  openGraph: {
    title: 'Dashboard | DreamFactory Admin Console',
    description: 'Monitor your APIs and database services from a unified dashboard',
  },
};

// Force dynamic rendering for real-time data
export const dynamic = 'force-dynamic';

// Ensure this page is server-side rendered with streaming
export const revalidate = 0;