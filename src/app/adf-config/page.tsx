import { Suspense } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { 
  Settings, 
  Database, 
  Mail, 
  Shield, 
  Key, 
  Info, 
  Zap,
  Globe,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

// Metadata for the configuration dashboard page
export const metadata: Metadata = {
  title: 'System Configuration',
  description: 'Manage DreamFactory system settings, cache, CORS, email templates, and security configuration',
  openGraph: {
    title: 'System Configuration | DreamFactory Admin Console',
    description: 'Central hub for all DreamFactory administrative configuration capabilities',
  },
};

// Force dynamic rendering for real-time configuration data
export const dynamic = 'force-dynamic';

// Configuration section definitions with navigation details
interface ConfigSection {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  href: string;
  status: 'active' | 'inactive' | 'warning';
  category: 'core' | 'security' | 'communication' | 'system';
}

const configSections: ConfigSection[] = [
  {
    id: 'cache',
    title: 'Cache Management',
    description: 'Configure and manage system cache settings, flush cache, and monitor cache performance',
    icon: Zap,
    href: '/system-settings/cache',
    status: 'active',
    category: 'core',
  },
  {
    id: 'cors',
    title: 'CORS Configuration',
    description: 'Configure Cross-Origin Resource Sharing (CORS) policies for API access control',
    icon: Globe,
    href: '/system-settings/cors',
    status: 'active',
    category: 'security',
  },
  {
    id: 'email-templates',
    title: 'Email Templates',
    description: 'Manage email templates for user registration, password reset, and system notifications',
    icon: Mail,
    href: '/system-settings/email-templates',
    status: 'active',
    category: 'communication',
  },
  {
    id: 'lookup-keys',
    title: 'Global Lookup Keys',
    description: 'Configure global lookup keys and constants used across the system',
    icon: Key,
    href: '/system-settings/lookup-keys',
    status: 'active',
    category: 'core',
  },
  {
    id: 'system-info',
    title: 'System Information',
    description: 'View system information, environment details, and platform configuration',
    icon: Info,
    href: '/system-settings/system-info',
    status: 'active',
    category: 'system',
  },
];

// Category groupings for organized display
const categoryConfig = {
  core: {
    title: 'Core Configuration',
    description: 'Essential system settings and cache management',
    color: 'blue',
  },
  security: {
    title: 'Security & Access',
    description: 'Authentication, authorization, and security policies',
    color: 'red',
  },
  communication: {
    title: 'Communication',
    description: 'Email templates and notification settings',
    color: 'green',
  },
  system: {
    title: 'System Information',
    description: 'Platform details and environment configuration',
    color: 'gray',
  },
};

// System status indicator component
function SystemStatusIndicator() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          System Status
        </h3>
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <span className="text-sm text-green-600 dark:text-green-400 font-medium">
            All Systems Operational
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {configSections.filter(s => s.status === 'active').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Active Modules
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
            100%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Uptime
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            Online
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Status
          </div>
        </div>
      </div>
    </div>
  );
}

// Configuration section card component
function ConfigSectionCard({ section }: { section: ConfigSection }) {
  const IconComponent = section.icon;
  
  const getStatusColor = (status: ConfigSection['status']) => {
    switch (status) {
      case 'active':
        return 'text-green-500';
      case 'warning':
        return 'text-yellow-500';
      case 'inactive':
        return 'text-gray-400';
      default:
        return 'text-gray-400';
    }
  };

  const getCategoryColor = (category: ConfigSection['category']) => {
    const colors = categoryConfig[category]?.color || 'gray';
    switch (colors) {
      case 'blue':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'red':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'green':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      default:
        return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  return (
    <Link 
      href={section.href}
      className="group block"
    >
      <div className={`
        p-6 rounded-lg border-2 transition-all duration-200
        hover:shadow-lg hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary-500
        ${getCategoryColor(section.category)}
      `}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
              <IconComponent className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                {section.title}
              </h3>
            </div>
          </div>
          <div className={`h-3 w-3 rounded-full ${getStatusColor(section.status)}`} />
        </div>
        
        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
          {section.description}
        </p>
        
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {categoryConfig[section.category]?.title}
          </span>
          <div className="text-primary-600 dark:text-primary-400 group-hover:translate-x-1 transition-transform">
            →
          </div>
        </div>
      </div>
    </Link>
  );
}

// Category section component
function CategorySection({ 
  category, 
  sections 
}: { 
  category: keyof typeof categoryConfig; 
  sections: ConfigSection[] 
}) {
  const config = categoryConfig[category];
  
  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {config.title}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {config.description}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {sections.map(section => (
          <ConfigSectionCard key={section.id} section={section} />
        ))}
      </div>
    </div>
  );
}

// Loading skeleton component
function ConfigurationLoading() {
  return (
    <div className="space-y-8" data-testid="configuration-loading">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-80 animate-pulse" />
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-96 animate-pulse" />
      </div>
      
      {/* Status card skeleton */}
      <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
      
      {/* Category sections skeleton */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-6">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Main configuration dashboard page component
export default function ConfigurationPage() {
  // Group sections by category for organized display
  const sectionsByCategory = configSections.reduce((acc, section) => {
    if (!acc[section.category]) {
      acc[section.category] = [];
    }
    acc[section.category].push(section);
    return acc;
  }, {} as Record<string, ConfigSection[]>);

  return (
    <div className="space-y-8" data-testid="configuration-page">
      {/* Page Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
        <div className="flex items-center space-x-3 mb-3">
          <div className="p-3 rounded-lg bg-primary-100 dark:bg-primary-900/30">
            <Settings className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              System Configuration
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">
              Manage DreamFactory system settings and administrative configuration
            </p>
          </div>
        </div>
        
        {/* Breadcrumb navigation */}
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <Link href="/" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                Dashboard
              </Link>
            </li>
            <li>
              <span className="text-gray-400">/</span>
            </li>
            <li>
              <span className="text-gray-900 dark:text-gray-100 font-medium">
                Configuration
              </span>
            </li>
          </ol>
        </nav>
      </div>

      {/* System Status Overview */}
      <Suspense fallback={<div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />}>
        <SystemStatusIndicator />
      </Suspense>

      {/* Configuration Sections by Category */}
      <Suspense fallback={<ConfigurationLoading />}>
        <div className="space-y-12">
          {Object.entries(sectionsByCategory).map(([category, sections]) => (
            <CategorySection 
              key={category} 
              category={category as keyof typeof categoryConfig}
              sections={sections} 
            />
          ))}
        </div>
      </Suspense>
      
      {/* Quick Actions Footer */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/system-settings/cache"
            className="flex items-center space-x-3 p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Zap className="h-5 w-5 text-orange-500" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Flush Cache
            </span>
          </Link>
          
          <Link
            href="/system-settings/system-info"
            className="flex items-center space-x-3 p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Info className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              System Info
            </span>
          </Link>
          
          <Link
            href="/system-settings/cors"
            className="flex items-center space-x-3 p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Shield className="h-5 w-5 text-red-500" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              CORS Settings
            </span>
          </Link>
          
          <Link
            href="/system-settings/email-templates"
            className="flex items-center space-x-3 p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Mail className="h-5 w-5 text-green-500" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Email Templates
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}