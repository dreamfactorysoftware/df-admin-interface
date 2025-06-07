"use client";

/**
 * Scheduler Management Page Component
 * 
 * Next.js app router page component that serves as the main scheduler management interface,
 * replacing the Angular DfManageSchedulerComponent and template files. This page implements
 * React Query for scheduler task data fetching, Tailwind CSS styling with Headless UI components,
 * and React Hook Form for scheduler configuration. It integrates with Next.js middleware for
 * paywall enforcement and maintains the same scheduler management functionality as the original
 * Angular implementation while leveraging React 19 patterns for enhanced performance.
 * 
 * Key Features:
 * - Next.js App Router file-based routing structure replacing Angular programmatic routes per Section 4.7.1.1
 * - React Query server state management for scheduler task data with TTL configuration per Section 4.3.2
 * - Paywall enforcement via Next.js middleware rather than Angular guards per Section 4.7.1.2
 * - Functional parity with existing scheduler management capabilities
 * - Tailwind CSS with Headless UI replacing Angular Material components per Section 5.2
 * - React Hook Form with Zod validation replacing Angular reactive forms per Section 3.2.3
 * 
 * @fileoverview Main scheduler management page for DreamFactory Admin Interface
 * @version 1.0.0
 */

import React, { 
  useEffect, 
  useMemo, 
  useState,
  type ComponentProps,
  type ReactNode
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  useQuery, 
  useQueryClient,
  type UseQueryResult 
} from '@tanstack/react-query';
import { 
  ExclamationTriangleIcon,
  ShieldExclamationIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

// Import scheduler components and utilities
import { SchedulerTable } from './SchedulerTable';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Import hooks and types
import { useAuth } from '@/hooks/use-auth';
import { usePaywall } from '@/hooks/use-paywall';
import { useSchedulerTasks } from '@/hooks/useSchedulerTasks';
import { useNotifications } from '@/hooks/use-notifications';
import { useSystemConfig } from '@/hooks/use-system-config';

// Import types
import type { 
  SchedulerTask, 
  SchedulerTaskListResponse,
  SchedulerPermissions
} from '@/types/scheduler';
import type { User, UserPermissions } from '@/types/user';
import type { SystemConfig } from '@/types/system';

/**
 * Interface for scheduler management page props
 */
interface SchedulerManagementPageProps {
  className?: string;
  children?: ReactNode;
}

/**
 * Interface for paywall component props
 */
interface PaywallComponentProps {
  feature?: string;
  requiredLicense?: string;
  className?: string;
}

/**
 * Paywall Component
 * 
 * Displays paywall interface when user doesn't have access to scheduler features.
 * Replaces Angular DfPaywallComponent with React implementation.
 */
const PaywallComponent: React.FC<PaywallComponentProps> = ({ 
  feature = 'scheduler',
  requiredLicense = 'Gold',
  className 
}) => {
  const router = useRouter();
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  const handleUpgradeClick = useCallback(() => {
    addNotification({
      type: 'info',
      title: 'Upgrade Required',
      message: `The scheduler feature requires a ${requiredLicense} license or higher.`,
    });
    
    // Navigate to upgrade page or external link
    router.push('/upgrade');
  }, [addNotification, requiredLicense, router]);

  return (
    <div className={cn(
      "flex flex-col items-center justify-center min-h-[400px] p-8 bg-gray-50 rounded-lg border border-gray-200",
      className
    )}>
      <div className="text-center max-w-md">
        <ShieldExclamationIcon className="w-16 h-16 mx-auto mb-4 text-orange-500" />
        
        <h2 className="text-2xl font-semibold text-gray-900 mb-3">
          Premium Feature
        </h2>
        
        <p className="text-gray-600 mb-6 leading-relaxed">
          The scheduler management feature is available with {requiredLicense} license 
          or higher. Upgrade your license to access advanced scheduling capabilities 
          for automated database operations.
        </p>
        
        <div className="space-y-3">
          <Button 
            variant="primary" 
            size="lg"
            onClick={handleUpgradeClick}
            className="w-full"
          >
            <CogIcon className="w-5 h-5 mr-2" />
            Upgrade License
          </Button>
          
          <Button 
            variant="outline" 
            size="md"
            onClick={() => router.back()}
            className="w-full"
          >
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

/**
 * Scheduler Management Page Component
 * 
 * Main component that handles paywall logic and renders either the paywall
 * or the scheduler table based on user permissions and license status.
 */
const SchedulerManagementPage: React.FC<SchedulerManagementPageProps> = ({ 
  className,
  children 
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  
  // Authentication and permissions
  const { user, isAuthenticated, permissions } = useAuth();
  const { 
    hasFeatureAccess, 
    isLoading: paywallLoading,
    licenseType,
    checkFeatureAccess 
  } = usePaywall();
  
  // System configuration
  const { 
    data: systemConfig, 
    isLoading: configLoading 
  } = useSystemConfig();
  
  // Notifications
  const { addNotification } = useNotifications();
  
  // State management
  const [paywallRequired, setPaywallRequired] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  /**
   * Check if scheduler feature access is allowed
   * Implements paywall logic replacing Angular route-based checks per Section 4.7.1.2
   */
  const checkSchedulerAccess = useCallback(async (): Promise<boolean> => {
    try {
      // Check authentication first
      if (!isAuthenticated || !user) {
        router.push('/login');
        return false;
      }

      // Check feature access through paywall hook
      const hasAccess = await checkFeatureAccess('scheduler');
      
      if (!hasAccess) {
        setPaywallRequired(true);
        return false;
      }

      // Check specific scheduler permissions
      const hasSchedulerPermission = permissions?.scheduler?.manage === true ||
                                   permissions?.admin === true ||
                                   user?.is_sys_admin === true;

      if (!hasSchedulerPermission) {
        addNotification({
          type: 'error',
          title: 'Access Denied',
          message: 'You do not have permission to access the scheduler management.',
        });
        router.push('/');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking scheduler access:', error);
      addNotification({
        type: 'error',
        title: 'Access Check Failed',
        message: 'Unable to verify scheduler access. Please try again.',
      });
      return false;
    }
  }, [
    isAuthenticated, 
    user, 
    permissions, 
    checkFeatureAccess, 
    addNotification, 
    router
  ]);

  /**
   * Initialize component and check access permissions
   * Replaces Angular constructor and ActivatedRoute.data subscription
   */
  useEffect(() => {
    const initializeComponent = async () => {
      if (paywallLoading || configLoading) {
        return;
      }

      try {
        const hasAccess = await checkSchedulerAccess();
        
        if (hasAccess) {
          setPaywallRequired(false);
        }
      } catch (error) {
        console.error('Error initializing scheduler page:', error);
        setPaywallRequired(true);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeComponent();
  }, [
    paywallLoading, 
    configLoading, 
    checkSchedulerAccess
  ]);

  /**
   * Handle URL parameters for paywall state
   * Replicates Angular ActivatedRoute.data subscription pattern
   */
  useEffect(() => {
    const paywallParam = searchParams.get('paywall');
    const accessDenied = searchParams.get('access') === 'denied';
    
    if (paywallParam === 'true' || accessDenied) {
      setPaywallRequired(true);
      setIsInitialized(true);
    }
  }, [searchParams]);

  /**
   * Memoized component content based on access status
   */
  const pageContent = useMemo(() => {
    // Show loading state during initialization
    if (!isInitialized || paywallLoading || configLoading) {
      return (
        <div className="flex items-center justify-center min-h-[300px]">
          <LoadingSpinner size="lg" />
          <span className="ml-3 text-lg text-gray-600">
            Initializing scheduler management...
          </span>
        </div>
      );
    }

    // Show paywall if access is restricted
    if (paywallRequired) {
      return (
        <PaywallComponent 
          feature="scheduler"
          requiredLicense={licenseType === 'silver' ? 'Gold' : 'Silver'}
          className="my-6"
        />
      );
    }

    // Show main scheduler table interface
    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                Scheduler Management
              </h1>
              <p className="text-gray-600">
                Manage and monitor your scheduled database operations and tasks.
              </p>
            </div>
            
            {/* Quick Actions */}
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['scheduler-tasks'] })}
                title="Refresh scheduler tasks"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              
              <Button
                variant="primary"
                onClick={() => router.push('/adf-scheduler/create')}
                title="Create new scheduled task"
              >
                Create Task
              </Button>
            </div>
          </div>
        </div>

        {/* Main Scheduler Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <SchedulerTable />
        </div>
      </div>
    );
  }, [
    isInitialized,
    paywallLoading,
    configLoading,
    paywallRequired,
    licenseType,
    queryClient,
    router
  ]);

  return (
    <div className={cn(
      "min-h-screen bg-gray-50",
      className
    )}>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {pageContent}
        {children}
      </div>
    </div>
  );
};

// Export component as default for Next.js page routing
export default SchedulerManagementPage;

/**
 * Metadata for Next.js page
 * Provides SEO and accessibility information
 */
export const metadata = {
  title: 'Scheduler Management | DreamFactory Admin',
  description: 'Manage and monitor scheduled database operations and automated tasks in DreamFactory.',
  keywords: ['scheduler', 'automation', 'database', 'tasks', 'cron', 'DreamFactory'],
};