/**
 * Loading UI component for email templates section that displays skeleton states and loading indicators
 * while email template data is being fetched. Implements Tailwind CSS animations and responsive design
 * patterns following Next.js app router loading.tsx convention.
 * 
 * This component provides loading feedback for slow network conditions and ensures WCAG 2.1 AA
 * compliance through proper accessibility attributes and animations.
 */

export default function Loading() {
  return (
    <div className="w-full h-full min-h-screen bg-background" role="status" aria-label="Loading email templates">
      {/* Page Header Skeleton */}
      <div className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center px-4">
          {/* Breadcrumb skeleton */}
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <div className="h-4 w-20 bg-muted animate-pulse rounded"></div>
            <div className="h-4 w-1 bg-muted/50"></div>
            <div className="h-4 w-28 bg-muted animate-pulse rounded"></div>
            <div className="h-4 w-1 bg-muted/50"></div>
            <div className="h-4 w-32 bg-muted animate-pulse rounded"></div>
          </div>
          <div className="ml-auto">
            {/* Action button skeleton */}
            <div className="h-9 w-24 bg-primary/20 animate-pulse rounded-md"></div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container py-6 px-4">
        {/* Page Title and Description */}
        <div className="mb-6">
          <div className="h-8 w-48 bg-muted animate-pulse rounded-md mb-2"></div>
          <div className="h-4 w-96 bg-muted/60 animate-pulse rounded"></div>
        </div>

        {/* Filter and Search Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            {/* Search input skeleton */}
            <div className="relative">
              <div className="h-10 w-72 bg-muted animate-pulse rounded-md"></div>
            </div>
            {/* Filter dropdown skeleton */}
            <div className="h-10 w-32 bg-muted animate-pulse rounded-md"></div>
          </div>
          <div className="flex items-center space-x-2">
            {/* Bulk actions skeleton */}
            <div className="h-9 w-20 bg-muted animate-pulse rounded-md"></div>
            <div className="h-9 w-28 bg-primary/20 animate-pulse rounded-md"></div>
          </div>
        </div>

        {/* Email Templates Table Skeleton */}
        <div className="rounded-md border border-border bg-card">
          {/* Table Header */}
          <div className="border-b border-border bg-muted/50 px-6 py-4">
            <div className="grid grid-cols-12 gap-4 items-center">
              {/* Checkbox column */}
              <div className="col-span-1">
                <div className="h-4 w-4 bg-muted animate-pulse rounded"></div>
              </div>
              {/* Name column */}
              <div className="col-span-3">
                <div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
              </div>
              {/* Subject column */}
              <div className="col-span-3">
                <div className="h-4 w-20 bg-muted animate-pulse rounded"></div>
              </div>
              {/* Type column */}
              <div className="col-span-2">
                <div className="h-4 w-12 bg-muted animate-pulse rounded"></div>
              </div>
              {/* Status column */}
              <div className="col-span-2">
                <div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
              </div>
              {/* Actions column */}
              <div className="col-span-1">
                <div className="h-4 w-12 bg-muted animate-pulse rounded"></div>
              </div>
            </div>
          </div>

          {/* Table Body - Multiple rows */}
          {Array.from({ length: 8 }).map((_, index) => (
            <div 
              key={index}
              className="border-b border-border last:border-b-0 px-6 py-4 hover:bg-muted/50 transition-colors"
            >
              <div className="grid grid-cols-12 gap-4 items-center">
                {/* Checkbox */}
                <div className="col-span-1">
                  <div className="h-4 w-4 bg-muted animate-pulse rounded border"></div>
                </div>
                {/* Name */}
                <div className="col-span-3">
                  <div className="space-y-1">
                    <div className="h-4 w-full bg-muted animate-pulse rounded" style={{ animationDelay: `${index * 0.1}s` }}></div>
                    <div className="h-3 w-3/4 bg-muted/60 animate-pulse rounded" style={{ animationDelay: `${index * 0.1 + 0.05}s` }}></div>
                  </div>
                </div>
                {/* Subject */}
                <div className="col-span-3">
                  <div className="h-4 w-5/6 bg-muted animate-pulse rounded" style={{ animationDelay: `${index * 0.1 + 0.02}s` }}></div>
                </div>
                {/* Type */}
                <div className="col-span-2">
                  <div className="h-6 w-16 bg-primary/20 animate-pulse rounded-full" style={{ animationDelay: `${index * 0.1 + 0.03}s` }}></div>
                </div>
                {/* Status */}
                <div className="col-span-2">
                  <div className="flex items-center space-x-2">
                    <div className="h-3 w-3 bg-green-500/50 animate-pulse rounded-full" style={{ animationDelay: `${index * 0.1 + 0.04}s` }}></div>
                    <div className="h-4 w-12 bg-muted animate-pulse rounded" style={{ animationDelay: `${index * 0.1 + 0.04}s` }}></div>
                  </div>
                </div>
                {/* Actions */}
                <div className="col-span-1">
                  <div className="flex items-center space-x-1">
                    <div className="h-8 w-8 bg-muted animate-pulse rounded" style={{ animationDelay: `${index * 0.1 + 0.05}s` }}></div>
                    <div className="h-8 w-8 bg-muted animate-pulse rounded" style={{ animationDelay: `${index * 0.1 + 0.06}s` }}></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Skeleton */}
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <div className="h-4 w-32 bg-muted animate-pulse rounded"></div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-9 w-20 bg-muted animate-pulse rounded-md"></div>
            <div className="flex items-center space-x-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-9 w-9 bg-muted animate-pulse rounded-md"></div>
              ))}
            </div>
            <div className="h-9 w-20 bg-muted animate-pulse rounded-md"></div>
          </div>
        </div>
      </div>

      {/* Loading Spinner Overlay for Slow Connections */}
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-none opacity-0 animate-fade-in animation-delay-[2s]">
        <div className="flex flex-col items-center space-y-4 bg-card p-6 rounded-lg border shadow-lg">
          <div className="relative">
            {/* Spinner */}
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary"></div>
            {/* Pulse effect */}
            <div className="absolute inset-0 h-8 w-8 animate-ping rounded-full border border-primary/25"></div>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">Loading email templates...</p>
            <p className="text-xs text-muted-foreground mt-1">This is taking longer than usual</p>
          </div>
        </div>
      </div>

      {/* Screen Reader Announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Loading email template data. Please wait while we fetch the latest information.
      </div>
      
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-in-out forwards;
        }
        
        .animation-delay-\\[2s\\] {
          animation-delay: 2s;
        }
        
        /* Enhanced pulse animation for accessibility */
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.4;
          }
        }
        
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        /* Respect prefers-reduced-motion */
        @media (prefers-reduced-motion: reduce) {
          .animate-pulse,
          .animate-spin,
          .animate-ping,
          .animate-fade-in {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}