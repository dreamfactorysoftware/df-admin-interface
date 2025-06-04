/**
 * Roles Management Page for React/Next.js Migration
 * 
 * Main roles listing page component that displays a table of roles with
 * management capabilities including create, edit, and delete operations.
 * Serves as the entry point for role-based access control management,
 * replacing the Angular df-manage-roles component with React/Next.js
 * server component architecture.
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

import type { Metadata } from 'next'
import { RolesPageClient } from './roles-client'

// =============================================================================
// METADATA CONFIGURATION
// =============================================================================

export const metadata: Metadata = {
  title: 'Role Management',
  description: 'Manage user roles and permissions for API access control. Create, edit, and configure role-based access control for your DreamFactory APIs.',
  keywords: ['roles', 'permissions', 'access control', 'security', 'API management', 'RBAC'],
  openGraph: {
    title: 'Role Management | DreamFactory Admin Console',
    description: 'Configure and manage user roles with granular permissions for secure API access control.',
    type: 'website',
  },
  robots: {
    index: false,
    follow: false,
  },
}

// =============================================================================
// SERVER COMPONENT
// =============================================================================

/**
 * Server component for roles page with SSR support
 * Provides initial page structure and delegates interactive functionality
 * to client component for optimal performance per Next.js 15.1 patterns
 */
export default function RolesPage() {
  return <RolesPageClient />
}