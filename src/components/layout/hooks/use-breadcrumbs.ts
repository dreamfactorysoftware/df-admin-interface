/**
 * Custom React hook for dynamic breadcrumb navigation generation.
 * Replaces Angular breadcrumb utility functions with React patterns and Next.js integration.
 * 
 * Features:
 * - Dynamic breadcrumb generation from Next.js router state
 * - Support for nested routes and parameterized paths
 * - Edit page state handling with breadcrumb modification
 * - Route metadata integration for accurate labeling
 * - Next.js Link integration for optimized navigation
 * - Breadcrumb state persistence during navigation and form editing
 */

'use client';

import { usePathname, useParams } from 'next/navigation';
import { useMemo, useCallback } from 'react';
import { useAppStore } from '@/stores/app-store';

/**
 * Breadcrumb item interface defining structure for navigation items.
 */
export interface BreadcrumbItem {
  /** Display label for the breadcrumb */
  label: string;
  /** Route path for navigation (undefined for current/non-clickable items) */
  href?: string;
  /** Icon component or icon name for the breadcrumb */
  icon?: string;
  /** Whether this is the current/active breadcrumb item */
  isCurrent: boolean;
  /** Whether this breadcrumb represents an edit page state */
  isEditMode?: boolean;
  /** Additional metadata for the breadcrumb */
  metadata?: {
    /** Entity ID for dynamic routes */
    id?: string;
    /** Entity type (service, table, user, etc.) */
    type?: string;
    /** Display name for dynamic entities */
    displayName?: string;
  };
}

/**
 * Route metadata configuration for breadcrumb generation.
 */
interface RouteMetadata {
  /** Static label for the route */
  label: string;
  /** Icon for the route */
  icon?: string;
  /** Whether this route should be shown in breadcrumbs */
  showInBreadcrumbs?: boolean;
  /** Custom label function for dynamic routes */
  dynamicLabel?: (params: Record<string, string>) => Promise<string> | string;
  /** Parent route override for non-standard hierarchies */
  parentRoute?: string;
}

/**
 * Route metadata configuration mapping route patterns to metadata.
 */
const ROUTE_METADATA: Record<string, RouteMetadata> = {
  // Root routes
  '/': {
    label: 'Dashboard',
    icon: 'home',
    showInBreadcrumbs: true,
  },
  
  // API Connections
  '/api-connections': {
    label: 'API Connections',
    icon: 'link',
    showInBreadcrumbs: true,
  },
  '/api-connections/database': {
    label: 'Database Services',
    icon: 'database',
    showInBreadcrumbs: true,
  },
  '/api-connections/database/create': {
    label: 'Create Service',
    icon: 'plus',
    showInBreadcrumbs: true,
  },
  '/api-connections/database/[service]': {
    label: 'Service Details',
    icon: 'database',
    showInBreadcrumbs: true,
    dynamicLabel: async (params) => {
      // Fetch service name from API or cache
      try {
        const response = await fetch(`/api/v2/system/service/${params.service}`);
        if (response.ok) {
          const service = await response.json();
          return service.name || params.service;
        }
      } catch (error) {
        console.warn('Failed to fetch service details for breadcrumb:', error);
      }
      return params.service;
    },
  },
  '/api-connections/database/[service]/schema': {
    label: 'Schema Discovery',
    icon: 'folder-tree',
    showInBreadcrumbs: true,
  },
  '/api-connections/database/[service]/generate': {
    label: 'API Generation',
    icon: 'zap',
    showInBreadcrumbs: true,
  },
  
  // Admin Settings
  '/admin-settings': {
    label: 'Admin Settings',
    icon: 'settings',
    showInBreadcrumbs: true,
  },
  '/admin-settings/users': {
    label: 'User Management',
    icon: 'users',
    showInBreadcrumbs: true,
  },
  '/admin-settings/users/create': {
    label: 'Create User',
    icon: 'user-plus',
    showInBreadcrumbs: true,
  },
  '/admin-settings/users/[id]': {
    label: 'User Details',
    icon: 'user',
    showInBreadcrumbs: true,
    dynamicLabel: async (params) => {
      try {
        const response = await fetch(`/api/v2/system/user/${params.id}`);
        if (response.ok) {
          const user = await response.json();
          return user.display_name || user.username || `User ${params.id}`;
        }
      } catch (error) {
        console.warn('Failed to fetch user details for breadcrumb:', error);
      }
      return `User ${params.id}`;
    },
  },
  
  // API Security
  '/api-security': {
    label: 'API Security',
    icon: 'shield',
    showInBreadcrumbs: true,
  },
  '/api-security/roles': {
    label: 'Roles',
    icon: 'key',
    showInBreadcrumbs: true,
  },
  '/api-security/roles/create': {
    label: 'Create Role',
    icon: 'key-plus',
    showInBreadcrumbs: true,
  },
  '/api-security/roles/[id]': {
    label: 'Role Details',
    icon: 'key',
    showInBreadcrumbs: true,
    dynamicLabel: async (params) => {
      try {
        const response = await fetch(`/api/v2/system/role/${params.id}`);
        if (response.ok) {
          const role = await response.json();
          return role.display_name || role.name || `Role ${params.id}`;
        }
      } catch (error) {
        console.warn('Failed to fetch role details for breadcrumb:', error);
      }
      return `Role ${params.id}`;
    },
  },
  
  // System Settings
  '/system-settings': {
    label: 'System Settings',
    icon: 'cog',
    showInBreadcrumbs: true,
  },
  '/system-settings/config': {
    label: 'Configuration',
    icon: 'settings-2',
    showInBreadcrumbs: true,
  },
  '/system-settings/email-templates': {
    label: 'Email Templates',
    icon: 'mail',
    showInBreadcrumbs: true,
  },
  '/system-settings/email-templates/create': {
    label: 'Create Template',
    icon: 'mail-plus',
    showInBreadcrumbs: true,
  },
  '/system-settings/email-templates/[id]': {
    label: 'Template Details',
    icon: 'mail',
    showInBreadcrumbs: true,
    dynamicLabel: async (params) => {
      try {
        const response = await fetch(`/api/v2/system/email_template/${params.id}`);
        if (response.ok) {
          const template = await response.json();
          return template.name || `Template ${params.id}`;
        }
      } catch (error) {
        console.warn('Failed to fetch email template details for breadcrumb:', error);
      }
      return `Template ${params.id}`;
    },
  },
  
  // Profile
  '/profile': {
    label: 'Profile',
    icon: 'user-circle',
    showInBreadcrumbs: true,
  },
};

/**
 * Parse a route path into segments, handling dynamic segments.
 */
function parsePathSegments(pathname: string, params: Record<string, string>): string[] {
  const segments = pathname.split('/').filter(Boolean);
  
  return segments.map(segment => {
    // Handle dynamic segments [param]
    if (segment.startsWith('[') && segment.endsWith(']')) {
      const paramName = segment.slice(1, -1);
      return params[paramName] || segment;
    }
    return segment;
  });
}

/**
 * Build a route path from segments up to a specific index.
 */
function buildRoutePath(segments: string[], upToIndex: number): string {
  const pathSegments = segments.slice(0, upToIndex + 1);
  return '/' + pathSegments.join('/');
}

/**
 * Get route metadata for a given path pattern.
 */
function getRouteMetadata(pathname: string): RouteMetadata | null {
  // Try exact match first
  if (ROUTE_METADATA[pathname]) {
    return ROUTE_METADATA[pathname];
  }
  
  // Try pattern matching for dynamic routes
  for (const pattern in ROUTE_METADATA) {
    if (pattern.includes('[') && pattern.includes(']')) {
      const regex = new RegExp(
        '^' + pattern.replace(/\[([^\]]+)\]/g, '([^/]+)') + '$'
      );
      if (regex.test(pathname)) {
        return ROUTE_METADATA[pattern];
      }
    }
  }
  
  return null;
}

/**
 * Check if the current route represents an edit page scenario.
 */
function isEditPageRoute(pathname: string, searchParams?: URLSearchParams): boolean {
  // Check for edit parameter in URL
  if (searchParams?.has('edit') || searchParams?.has('mode')) {
    return searchParams.get('edit') === 'true' || searchParams.get('mode') === 'edit';
  }
  
  // Check for edit path segments
  const segments = pathname.split('/').filter(Boolean);
  return segments.includes('edit') || segments.some(segment => segment.endsWith('-edit'));
}

/**
 * Custom hook for generating dynamic breadcrumb navigation.
 * 
 * @returns Object containing breadcrumb items and utility functions
 */
export function useBreadcrumbs() {
  const pathname = usePathname();
  const params = useParams();
  const { error, setError } = useAppStore();
  
  // Parse current URL for edit state detection
  const searchParams = typeof window !== 'undefined' 
    ? new URLSearchParams(window.location.search) 
    : new URLSearchParams();
  
  const isEditMode = isEditPageRoute(pathname, searchParams);
  
  /**
   * Generate breadcrumb items from current route state.
   */
  const breadcrumbItems = useMemo(async (): Promise<BreadcrumbItem[]> => {
    const segments = parsePathSegments(pathname, params as Record<string, string>);
    const items: BreadcrumbItem[] = [];
    
    // Always add dashboard as root if not already there
    if (pathname !== '/') {
      items.push({
        label: 'Dashboard',
        href: '/',
        icon: 'home',
        isCurrent: false,
      });
    }
    
    // Build breadcrumbs for each path segment
    for (let i = 0; i < segments.length; i++) {
      const currentPath = buildRoutePath(segments, i);
      const isLastSegment = i === segments.length - 1;
      const metadata = getRouteMetadata(currentPath);
      
      // Skip segments that shouldn't be shown in breadcrumbs
      if (metadata?.showInBreadcrumbs === false) {
        continue;
      }
      
      let label = metadata?.label || segments[i];
      
      // Handle dynamic labels for parameterized routes
      if (metadata?.dynamicLabel) {
        try {
          label = await metadata.dynamicLabel(params as Record<string, string>);
        } catch (error) {
          console.warn(`Failed to generate dynamic label for ${currentPath}:`, error);
          setError(`Failed to load breadcrumb data: ${error}`);
        }
      }
      
      // Handle edit mode modification
      if (isLastSegment && isEditMode) {
        label = `Edit ${label}`;
      }
      
      const breadcrumbItem: BreadcrumbItem = {
        label,
        href: isLastSegment ? undefined : currentPath,
        icon: metadata?.icon,
        isCurrent: isLastSegment,
        isEditMode: isLastSegment && isEditMode,
        metadata: {
          type: segments[i],
          id: Object.values(params)[0] as string,
          displayName: label,
        },
      };
      
      items.push(breadcrumbItem);
    }
    
    return items;
  }, [pathname, params, isEditMode, setError]);
  
  /**
   * Generate a breadcrumb link with Next.js Link optimization.
   */
  const generateBreadcrumbLink = useCallback((item: BreadcrumbItem) => {
    if (!item.href || item.isCurrent) {
      return null;
    }
    
    return {
      href: item.href,
      label: item.label,
      prefetch: true, // Enable Next.js prefetching
      replace: false, // Use normal navigation
      scroll: true,   // Scroll to top on navigation
    };
  }, []);
  
  /**
   * Navigate to a specific breadcrumb item.
   */
  const navigateToBreadcrumb = useCallback((item: BreadcrumbItem) => {
    if (!item.href || item.isCurrent) {
      return;
    }
    
    // Use Next.js router for optimized navigation
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', item.href);
    }
  }, []);
  
  /**
   * Get the current page title from breadcrumbs.
   */
  const getCurrentPageTitle = useCallback(() => {
    return breadcrumbItems.then(items => {
      const currentItem = items.find(item => item.isCurrent);
      return currentItem?.label || 'DreamFactory Admin';
    });
  }, [breadcrumbItems]);
  
  /**
   * Update breadcrumb for edit mode scenarios.
   */
  const updateBreadcrumbForEdit = useCallback((editLabel?: string) => {
    // This would trigger a re-computation of breadcrumbs with edit state
    const url = new URL(window.location.href);
    if (editLabel) {
      url.searchParams.set('edit', 'true');
      url.searchParams.set('editLabel', editLabel);
    } else {
      url.searchParams.delete('edit');
      url.searchParams.delete('editLabel');
    }
    
    window.history.replaceState(null, '', url.toString());
  }, []);
  
  /**
   * Reset breadcrumb state (useful for form cancellation).
   */
  const resetBreadcrumbState = useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete('edit');
    url.searchParams.delete('editLabel');
    url.searchParams.delete('mode');
    
    window.history.replaceState(null, '', url.toString());
  }, []);
  
  return {
    /** Current breadcrumb items */
    breadcrumbItems,
    /** Current pathname */
    pathname,
    /** Whether currently in edit mode */
    isEditMode,
    /** Generate Next.js Link props for breadcrumb navigation */
    generateBreadcrumbLink,
    /** Navigate to a specific breadcrumb item */
    navigateToBreadcrumb,
    /** Get current page title from breadcrumbs */
    getCurrentPageTitle,
    /** Update breadcrumb for edit mode scenarios */
    updateBreadcrumbForEdit,
    /** Reset breadcrumb state */
    resetBreadcrumbState,
    /** Route metadata configuration */
    routeMetadata: ROUTE_METADATA,
  };
}

/**
 * Hook specifically for edit page breadcrumb handling.
 * Provides utilities for managing breadcrumb state during form workflows.
 */
export function useEditPageBreadcrumbs() {
  const {
    breadcrumbItems,
    isEditMode,
    updateBreadcrumbForEdit,
    resetBreadcrumbState,
    getCurrentPageTitle,
  } = useBreadcrumbs();
  
  /**
   * Enter edit mode and update breadcrumbs accordingly.
   */
  const enterEditMode = useCallback((editLabel?: string) => {
    updateBreadcrumbForEdit(editLabel);
  }, [updateBreadcrumbForEdit]);
  
  /**
   * Exit edit mode and restore normal breadcrumb state.
   */
  const exitEditMode = useCallback(() => {
    resetBreadcrumbState();
  }, [resetBreadcrumbState]);
  
  /**
   * Toggle edit mode state.
   */
  const toggleEditMode = useCallback((editLabel?: string) => {
    if (isEditMode) {
      exitEditMode();
    } else {
      enterEditMode(editLabel);
    }
  }, [isEditMode, enterEditMode, exitEditMode]);
  
  return {
    breadcrumbItems,
    isEditMode,
    enterEditMode,
    exitEditMode,
    toggleEditMode,
    getCurrentPageTitle,
  };
}

/**
 * Type export for external usage
 */
export type { BreadcrumbItem };