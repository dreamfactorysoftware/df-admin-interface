import { Suspense } from 'react';
import { Metadata } from 'next';
import { Plus, Package, Key, ExternalLink, Copy, RefreshCw, Settings } from 'lucide-react';
import Link from 'next/link';

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Dynamic imports for client components that need interactivity
import dynamic from 'next/dynamic';

// Dynamically imported client components for optimal loading
const AppManagementTable = dynamic(() => import('@/components/app-management/app-table'), {
  loading: () => (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        </div>
      ))}
    </div>
  ),
  ssr: false,
});

const AppMetrics = dynamic(() => import('@/components/app-management/app-metrics'), {
  loading: () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        </div>
      ))}
    </div>
  ),
  ssr: false,
});

const RecentAppActivity = dynamic(() => import('@/components/app-management/recent-activity'), {
  loading: () => (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="animate-pulse flex space-x-3">
          <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
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

// Static app overview component for SSR optimization
function AppOverview() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="h-7 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>}>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">No applications configured</p>
          </Suspense>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Applications</CardTitle>
          <Settings className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="h-7 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>}>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">All applications inactive</p>
          </Suspense>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">API Keys</CardTitle>
          <Key className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="h-7 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>}>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Ready to generate</p>
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

// Quick actions component for app management
function AppQuickActions() {
  const actions = [
    {
      title: 'Create New App',
      description: 'Set up a new application with hosting and configuration',
      href: '/adf-apps/create',
      icon: Plus,
      variant: 'default' as const,
    },
    {
      title: 'Manage API Keys',
      description: 'View and refresh application API keys',
      href: '/adf-apps/api-keys',
      icon: Key,
      variant: 'outline' as const,
    },
    {
      title: 'App Settings',
      description: 'Configure global application settings',
      href: '/adf-apps/settings',
      icon: Settings,
      variant: 'outline' as const,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {actions.map((action) => (
        <Card key={action.href} className="hover:shadow-md transition-shadow cursor-pointer group">
          <Link href={action.href}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm group-hover:text-primary-600 transition-colors">
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

// Getting started guide for app management
function AppGettingStarted() {
  return (
    <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 dark:border-green-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-900 dark:text-green-100">
          <Package className="h-5 w-5" />
          Application Management
        </CardTitle>
        <CardDescription className="text-green-700 dark:text-green-200">
          Create and manage web applications hosted on DreamFactory
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-green-800 dark:text-green-200">
          Applications in DreamFactory can be hosted in various ways including file storage, 
          web server paths, or remote URLs. Each application gets its own API key and role-based access control.
        </p>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-xs font-medium text-green-900 dark:bg-green-900 dark:text-green-100">
              1
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-green-900 dark:text-green-100">Create Application</p>
              <p className="text-xs text-green-700 dark:text-green-200">
                Set up your app with name, description, and hosting location
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-900 dark:bg-gray-800 dark:text-gray-100">
              2
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Configure Security</p>
              <p className="text-xs text-muted-foreground">
                Assign default roles and generate API keys for access control
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-900 dark:bg-gray-800 dark:text-gray-100">
              3
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Deploy & Launch</p>
              <p className="text-xs text-muted-foreground">
                Activate your application and share the launch URL
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" className="bg-green-600 hover:bg-green-700">
            <Link href="/adf-apps/create">
              <Plus className="h-4 w-4 mr-2" />
              Create First App
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="border-green-300 text-green-700 hover:bg-green-50 dark:border-green-600 dark:text-green-200">
            <Link href="/adf-home/quickstart">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Documentation
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Application features showcase
function AppFeatures() {
  const features = [
    {
      icon: Package,
      title: 'Multiple Hosting Options',
      description: 'Host apps on file storage, web servers, or remote URLs with flexible configuration',
    },
    {
      icon: Key,
      title: 'API Key Management',
      description: 'Generate, copy, and refresh API keys with fine-grained access control',
    },
    {
      icon: Settings,
      title: 'Role-Based Security',
      description: 'Assign default roles and configure security settings per application',
    },
    {
      icon: ExternalLink,
      title: 'Launch Integration',
      description: 'Direct launch URLs for seamless application access and sharing',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Application Features</CardTitle>
        <CardDescription>
          Comprehensive tools for managing web applications on DreamFactory
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {features.map((feature, index) => (
            <div key={index} className="flex gap-3">
              <feature.icon className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium">{feature.title}</p>
                <p className="text-xs text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Main application management page component
export default function ApplicationManagementPage() {
  return (
    <div className="space-y-8" data-testid="app-management-page">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Application Management
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            Create, configure, and manage web applications
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/adf-apps/create">
            <Plus className="h-4 w-4 mr-2" />
            Create Application
          </Link>
        </Button>
      </div>

      {/* Getting Started Section */}
      <AppGettingStarted />

      {/* App Overview Stats */}
      <AppOverview />

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Quick Actions
        </h2>
        <AppQuickActions />
      </div>

      {/* App Metrics */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Application Metrics
        </h2>
        <Suspense fallback={
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
            ))}
          </div>
        }>
          <AppMetrics />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Applications Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Applications
              </CardTitle>
              <CardDescription>
                View and manage all configured applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense
                fallback={
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
                    ))}
                  </div>
                }
              >
                <AppManagementTable />
              </Suspense>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest application management events and changes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense
                fallback={
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="animate-pulse flex space-x-3">
                        <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                }
              >
                <RecentAppActivity />
              </Suspense>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* App Features */}
          <AppFeatures />

          {/* Application Types Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Application Types</CardTitle>
              <CardDescription>
                Different hosting options available
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-900 dark:bg-blue-900 dark:text-blue-100">
                    0
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">No Storage</p>
                    <p className="text-xs text-muted-foreground">
                      Application without file hosting requirements
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-xs font-medium text-green-900 dark:bg-green-900 dark:text-green-100">
                    1
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">File Storage</p>
                    <p className="text-xs text-muted-foreground">
                      Hosted on DreamFactory file storage services
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-xs font-medium text-purple-900 dark:bg-purple-900 dark:text-purple-100">
                    2
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Remote URL</p>
                    <p className="text-xs text-muted-foreground">
                      Application hosted on external servers
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-xs font-medium text-orange-900 dark:bg-orange-900 dark:text-orange-100">
                    3
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Web Server</p>
                    <p className="text-xs text-muted-foreground">
                      Hosted on DreamFactory web server paths
                    </p>
                  </div>
                </div>
              </div>
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href="/adf-apps/create">
                  Create New App
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* API Key Management Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">API Key Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Total Keys</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Active Keys</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Last Refresh</span>
                <span className="font-medium">Never</span>
              </div>
              <div className="pt-2 border-t space-y-2">
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href="/adf-apps/api-keys">
                    <Key className="h-4 w-4 mr-2" />
                    Manage Keys
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="w-full" disabled>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh All Keys
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
  title: 'Application Management',
  description: 'Create, configure, and manage web applications hosted on DreamFactory with API key management and role-based security',
  openGraph: {
    title: 'Application Management | DreamFactory Admin Console',
    description: 'Comprehensive application hosting and management tools for DreamFactory platform',
  },
};

// Force dynamic rendering for real-time data
export const dynamic = 'force-dynamic';

// Ensure this page is server-side rendered with streaming
export const revalidate = 0;