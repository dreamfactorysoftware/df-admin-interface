/**
 * Administrative Dashboard Loading Component
 * 
 * This component provides accessible skeleton loading states for the administrative 
 * dashboard during data fetching operations. Implements WCAG 2.1 AA compliance
 * with proper ARIA attributes and responsive design using Tailwind CSS.
 * 
 * Features:
 * - Comprehensive skeleton UI for admin metrics, user statistics, system health
 * - Theme-aware loading indicators supporting light and dark mode
 * - Responsive layout adapting to admin dashboard grid system
 * - Accessibility announcements for administrative data loading progress
 * - Loading states optimized for sub-100ms response time requirements
 */

'use client';

import { useEffect, useState } from 'react';

/**
 * Skeleton component for reusable loading placeholders
 * Implements WCAG 2.1 AA compliant loading animations
 */
interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  rounded?: boolean;
  pulse?: boolean;
  'data-testid'?: string;
}

function Skeleton({ 
  className = '', 
  width = 'w-full', 
  height = 'h-4', 
  rounded = true,
  pulse = true,
  'data-testid': testId
}: SkeletonProps) {
  const baseClasses = `
    bg-gray-200 dark:bg-gray-700 
    ${rounded ? 'rounded' : ''} 
    ${pulse ? 'animate-pulse' : ''}
    ${width} 
    ${height}
    ${className}
  `.trim();

  return (
    <div 
      className={baseClasses}
      data-testid={testId}
      aria-hidden="true"
    />
  );
}

/**
 * Card container for admin dashboard sections
 */
interface LoadingCardProps {
  children: React.ReactNode;
  className?: string;
  'data-testid'?: string;
}

function LoadingCard({ children, className = '', 'data-testid': testId }: LoadingCardProps) {
  return (
    <div 
      className={`
        bg-white dark:bg-gray-900 
        rounded-lg 
        border border-gray-200 dark:border-gray-700 
        shadow-sm 
        p-6 
        ${className}
      `.trim()}
      data-testid={testId}
    >
      {children}
    </div>
  );
}

/**
 * Admin overview cards loading skeleton
 */
function AdminOverviewCardsLoading() {
  const metrics = [
    { label: 'Total Users', icon: '👥' },
    { label: 'Active Services', icon: '🔌' },
    { label: 'API Calls Today', icon: '📊' },
    { label: 'System Health', icon: '💚' }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {metrics.map((metric, index) => (
        <LoadingCard 
          key={index} 
          className="min-h-[120px]"
          data-testid={`admin-metric-card-loading-${index}`}
        >
          <div className="flex items-center justify-between mb-4">
            <Skeleton width="w-16" height="h-8" />
            <div className="text-2xl opacity-30">{metric.icon}</div>
          </div>
          <div className="space-y-2">
            <Skeleton width="w-20" height="h-8" />
            <Skeleton width="w-full" height="h-4" />
          </div>
        </LoadingCard>
      ))}
    </div>
  );
}

/**
 * Recent admin activity loading skeleton
 */
function RecentActivityLoading() {
  return (
    <LoadingCard data-testid="recent-activity-loading">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton width="w-40" height="h-6" />
          <Skeleton width="w-20" height="h-4" />
        </div>
        
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center space-x-3 py-2">
              <Skeleton width="w-8" height="h-8" rounded />
              <div className="flex-1 space-y-1">
                <Skeleton width="w-3/4" height="h-4" />
                <Skeleton width="w-1/2" height="h-3" />
              </div>
              <Skeleton width="w-16" height="h-3" />
            </div>
          ))}
        </div>
      </div>
    </LoadingCard>
  );
}

/**
 * User management summary loading skeleton
 */
function UserManagementLoading() {
  return (
    <LoadingCard data-testid="user-management-loading">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton width="w-32" height="h-6" />
          <Skeleton width="w-24" height="h-8" />
        </div>
        
        {/* User statistics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton width="w-16" height="h-4" />
            <Skeleton width="w-12" height="h-6" />
          </div>
          <div className="space-y-2">
            <Skeleton width="w-20" height="h-4" />
            <Skeleton width="w-8" height="h-6" />
          </div>
        </div>
        
        {/* User table header */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="grid grid-cols-4 gap-4 mb-3">
            <Skeleton width="w-16" height="h-4" />
            <Skeleton width="w-12" height="h-4" />
            <Skeleton width="w-20" height="h-4" />
            <Skeleton width="w-14" height="h-4" />
          </div>
          
          {/* User table rows */}
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="grid grid-cols-4 gap-4 py-2">
              <Skeleton width="w-20" height="h-4" />
              <Skeleton width="w-16" height="h-4" />
              <Skeleton width="w-24" height="h-4" />
              <Skeleton width="w-12" height="h-4" />
            </div>
          ))}
        </div>
      </div>
    </LoadingCard>
  );
}

/**
 * System health monitoring loading skeleton
 */
function SystemHealthLoading() {
  return (
    <LoadingCard data-testid="system-health-loading">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton width="w-28" height="h-6" />
          <Skeleton width="w-16" height="h-4" />
        </div>
        
        {/* Health indicators */}
        <div className="space-y-3">
          {[
            'Database Connections',
            'API Response Time',
            'Memory Usage',
            'Cache Performance'
          ].map((_, index) => (
            <div key={index} className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-3">
                <Skeleton width="w-3" height="h-3" rounded />
                <Skeleton width="w-32" height="h-4" />
              </div>
              <Skeleton width="w-12" height="h-4" />
            </div>
          ))}
        </div>
        
        {/* Performance chart placeholder */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <Skeleton width="w-full" height="h-32" />
        </div>
      </div>
    </LoadingCard>
  );
}

/**
 * Quick actions loading skeleton
 */
function QuickActionsLoading() {
  return (
    <LoadingCard data-testid="quick-actions-loading">
      <div className="space-y-4">
        <Skeleton width="w-28" height="h-6" />
        
        <div className="grid grid-cols-1 gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 rounded-md border border-gray-200 dark:border-gray-700">
              <Skeleton width="w-5" height="h-5" />
              <Skeleton width="w-24" height="h-4" />
            </div>
          ))}
        </div>
      </div>
    </LoadingCard>
  );
}

/**
 * Main admin settings loading component
 * Implements comprehensive loading states for administrative dashboard
 */
export default function AdminSettingsLoading() {
  const [loadingAnnounced, setLoadingAnnounced] = useState(false);

  // Announce loading state to screen readers
  useEffect(() => {
    if (!loadingAnnounced) {
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = 'Loading administrative dashboard. Please wait while we fetch your admin metrics, user statistics, and system health information.';
      document.body.appendChild(announcement);
      
      setLoadingAnnounced(true);
      
      // Clean up announcement after screen reader has time to read it
      setTimeout(() => {
        if (document.body.contains(announcement)) {
          document.body.removeChild(announcement);
        }
      }, 2000);
    }
  }, [loadingAnnounced]);

  return (
    <div 
      className="space-y-6 md:space-y-8"
      data-testid="admin-settings-loading"
      role="status"
      aria-label="Loading administrative dashboard"
    >
      {/* Page Header Loading */}
      <div className="space-y-2">
        <Skeleton 
          width="w-64 md:w-80" 
          height="h-8 md:h-10" 
          data-testid="page-title-loading"
        />
        <Skeleton 
          width="w-96 md:w-[28rem]" 
          height="h-5 md:h-6" 
          data-testid="page-description-loading"
        />
      </div>

      {/* Admin Overview Cards */}
      <section 
        aria-labelledby="overview-heading" 
        className="space-y-4"
      >
        <div className="sr-only" id="overview-heading">
          Administrative Overview Metrics
        </div>
        <AdminOverviewCardsLoading />
      </section>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Admin Activity */}
          <section aria-labelledby="activity-heading">
            <div className="sr-only" id="activity-heading">
              Recent Administrative Activity
            </div>
            <RecentActivityLoading />
          </section>

          {/* User Management Summary */}
          <section aria-labelledby="users-heading">
            <div className="sr-only" id="users-heading">
              User Management Summary
            </div>
            <UserManagementLoading />
          </section>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          {/* System Health */}
          <section aria-labelledby="health-heading">
            <div className="sr-only" id="health-heading">
              System Health Monitoring
            </div>
            <SystemHealthLoading />
          </section>

          {/* Quick Actions */}
          <section aria-labelledby="actions-heading">
            <div className="sr-only" id="actions-heading">
              Quick Administrative Actions
            </div>
            <QuickActionsLoading />
          </section>
        </div>
      </div>

      {/* Audit Trail Section */}
      <section 
        aria-labelledby="audit-heading" 
        className="space-y-4"
      >
        <div className="sr-only" id="audit-heading">
          Administrative Audit Trail
        </div>
        <LoadingCard data-testid="audit-trail-loading">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton width="w-32" height="h-6" />
              <Skeleton width="w-20" height="h-8" />
            </div>
            
            {/* Audit log entries */}
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <Skeleton width="w-6" height="h-6" rounded />
                    <div className="space-y-1">
                      <Skeleton width="w-48" height="h-4" />
                      <Skeleton width="w-32" height="h-3" />
                    </div>
                  </div>
                  <Skeleton width="w-20" height="h-3" />
                </div>
              ))}
            </div>
          </div>
        </LoadingCard>
      </section>

      {/* Screen reader only loading completion message */}
      <div 
        className="sr-only" 
        aria-live="polite"
        data-testid="loading-status-message"
      >
        Administrative dashboard is loading. This page contains metrics, user management, system health monitoring, and audit information.
      </div>
    </div>
  );
}