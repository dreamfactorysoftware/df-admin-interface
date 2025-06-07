import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { TableDetailsPageClient } from './table-details-page-client';

/**
 * Table Details Page - Next.js Server Component
 * 
 * Main entry point for table details management implementing tabbed interface for:
 * - Table metadata editing (name, alias, label, plural, description)
 * - Fields management (CRUD operations for table fields)
 * - Relationships configuration (table relationship management)
 * 
 * This server component provides initial page structure and metadata while delegating
 * client-side interactivity to the TableDetailsPageClient component.
 * 
 * Performance Requirements:
 * - SSR pages under 2 seconds per React/Next.js Integration Requirements
 * - Next.js server components for initial page loads per React/Next.js Integration Requirements
 * - Tailwind CSS 4.1+ with consistent theme injection per React/Next.js Integration Requirements
 * 
 * Features Implementation:
 * - Schema Discovery and Browsing feature F-002 per Section 2.1 Feature Catalog
 * - Angular to Next.js routing migration per Section 4.7.1.1 routing migration strategy
 * - Next.js middleware authentication integration per Section 4.7.1.2 interceptor migration architecture
 * 
 * @example
 * URL: /adf-schema/df-table-details?dbName=mysql_service&tableName=users
 */

interface PageProps {
  searchParams: {
    dbName?: string;
    tableName?: string;
    tab?: 'details' | 'fields' | 'relationships';
  };
}

/**
 * Generate metadata for the table details page
 * Includes proper SEO and social sharing metadata
 */
export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { dbName, tableName } = searchParams;
  
  if (!dbName || !tableName) {
    return {
      title: 'Table Details - DreamFactory Admin',
      description: 'Manage database table schema, fields, and relationships',
    };
  }

  return {
    title: `${tableName} - Table Details | ${dbName} | DreamFactory Admin`,
    description: `Manage ${tableName} table schema including fields, relationships, and metadata in ${dbName} database service`,
    keywords: [
      'database management',
      'table schema',
      'field management',
      'relationships',
      dbName,
      tableName,
    ],
    robots: {
      index: false, // Admin interface - no indexing
      follow: false,
    },
  };
}

/**
 * Server Component for Table Details Page
 * 
 * Validates route parameters and provides initial page structure.
 * Authentication is handled by Next.js middleware per migration strategy.
 * 
 * @param props - Page props containing search parameters
 * @returns React server component with table details interface
 */
export default async function TableDetailsPage({ searchParams }: PageProps) {
  const { dbName, tableName, tab = 'details' } = searchParams;

  // Validate required parameters - redirect to 404 if missing
  if (!dbName || !tableName) {
    notFound();
  }

  // Validate tab parameter - default to 'details' for invalid values
  const validTabs = ['details', 'fields', 'relationships'] as const;
  const activeTab = validTabs.includes(tab as any) ? tab : 'details';

  // Server-side rendered page structure
  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Schema</span>
              <span>/</span>
              <span className="font-medium text-primary">{dbName}</span>
              <span>/</span>
              <span>Tables</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              {tableName}
            </h1>
            <p className="text-muted-foreground">
              Manage table schema, fields, and relationships for {tableName} in {dbName}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 py-6">
        {/* 
          Suspense boundary for client-side components
          Provides loading fallback while components hydrate
        */}
        <Suspense 
          fallback={
            <TableDetailsLoadingState 
              dbName={dbName} 
              tableName={tableName}
              activeTab={activeTab}
            />
          }
        >
          <TableDetailsPageClient
            dbName={dbName}
            tableName={tableName}
            initialTab={activeTab}
          />
        </Suspense>
      </div>
    </div>
  );
}

/**
 * Loading State Component for Server-Side Rendering
 * 
 * Provides skeleton UI that matches the final component structure
 * to prevent layout shift during hydration
 */
function TableDetailsLoadingState({ 
  dbName, 
  tableName, 
  activeTab 
}: { 
  dbName: string; 
  tableName: string; 
  activeTab: string;
}) {
  return (
    <div className="space-y-6">
      {/* Tab Navigation Skeleton */}
      <div className="border-b border-border">
        <nav className="flex space-x-8" aria-label="Table management tabs">
          {['Table Details', 'Fields', 'Relationships'].map((tabName, index) => (
            <div
              key={tabName}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                ${index === 0 ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}
              `}
            >
              <div className="h-5 w-24 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </nav>
      </div>

      {/* Content Area Skeleton */}
      <div className="space-y-4">
        {activeTab === 'details' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                <div className="h-10 bg-muted animate-pulse rounded" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                <div className="h-10 bg-muted animate-pulse rounded" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-24 bg-muted animate-pulse rounded" />
            </div>
          </div>
        )}

        {activeTab === 'fields' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="h-8 w-32 bg-muted animate-pulse rounded" />
              <div className="h-10 w-24 bg-muted animate-pulse rounded" />
            </div>
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="h-12 bg-muted/50 border-b border-border" />
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted/20 border-b border-border animate-pulse" />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'relationships' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="h-8 w-32 bg-muted animate-pulse rounded" />
              <div className="h-10 w-36 bg-muted animate-pulse rounded" />
            </div>
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="h-12 bg-muted/50 border-b border-border" />
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted/20 border-b border-border animate-pulse" />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}