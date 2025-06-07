/**
 * React Query-based Profile Data Hook for DreamFactory Admin Interface
 * 
 * Replaces Angular profileResolver with modern React Query implementation providing
 * intelligent caching, automatic revalidation, and optimized performance for user
 * profile management workflows. Integrates with DreamFactory API endpoints while
 * maintaining backward compatibility and type safety.
 * 
 * Key Features:
 * - TanStack React Query 5.79.2 for server-state management
 * - TTL configuration (staleTime: 300s, cacheTime: 900s) for optimal performance
 * - Cache responses under 50ms per React/Next.js Integration Requirements
 * - Automatic background revalidation for real-time profile updates
 * - Comprehensive error handling with React Error Boundary integration
 * - Type-safe UserProfile return type with full interface compliance
 * 
 * @fileoverview Profile data fetching hook with React Query integration
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { apiGet, API_ENDPOINTS } from '../../../lib/api-client';
import type { UserProfile, ApiResponse } from '../../../types/user';

// ============================================================================
// REACT QUERY CONFIGURATION
// ============================================================================

/**
 * Query key factory for profile-related queries
 * Enables consistent cache management and invalidation patterns
 */
export const profileQueryKeys = {
  all: ['profile'] as const,
  current: () => [...profileQueryKeys.all, 'current'] as const,
  user: (userId: number) => [...profileQueryKeys.all, 'user', userId] as const,
} as const;

/**
 * Cache configuration constants for optimal performance
 * Aligned with React/Next.js Integration Requirements for sub-50ms responses
 */
const PROFILE_CACHE_CONFIG = {
  // Data considered fresh for 5 minutes (300 seconds)
  staleTime: 5 * 60 * 1000,
  
  // Data kept in cache for 15 minutes (900 seconds)
  cacheTime: 15 * 60 * 1000,
  
  // Retry configuration for network resilience
  retry: 3,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  
  // Background refetch configuration for real-time updates
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
  refetchOnMount: true,
  
  // Performance optimization
  refetchInterval: false, // Manual control over background updates
  refetchIntervalInBackground: false,
} as const;

// ============================================================================
// API INTEGRATION FUNCTIONS
// ============================================================================

/**
 * Fetches current user profile data from DreamFactory API
 * 
 * Maintains compatibility with existing DreamFactory API endpoints while
 * providing enhanced error handling and response validation. Uses the
 * standardized API client for consistent request handling across the application.
 * 
 * @returns Promise resolving to UserProfile data
 * @throws Error with structured error information for React Query error handling
 */
async function fetchCurrentUserProfile(): Promise<UserProfile> {
  try {
    // Use system user endpoint for current profile data
    // Maintains compatibility with existing DreamFactory API patterns
    const response = await apiGet<ApiResponse<UserProfile>>(
      `${API_ENDPOINTS.SYSTEM_USER}/profile`,
      {
        // Optimize for profile data retrieval
        fields: '*',
        related: 'lookup_by_user_id,user_to_app_to_role_by_user_id.role',
        
        // Enhanced error handling headers
        snackbarError: 'Failed to load user profile',
        showSpinner: false, // React Query handles loading states
        
        // Cache optimization
        includeCacheControl: true,
      }
    );

    // Validate response structure for type safety
    if (!response || typeof response !== 'object') {
      throw new Error('Invalid profile response format');
    }

    // Handle both direct data and wrapped response formats
    const profileData = 'data' in response ? response.data : response;
    
    if (!profileData || typeof profileData !== 'object') {
      throw new Error('Profile data not found in response');
    }

    // Type assertion with runtime validation
    const profile = profileData as UserProfile;
    
    // Validate required profile fields
    if (!profile.id || !profile.username || !profile.email) {
      throw new Error('Invalid profile data: missing required fields');
    }

    return profile;
  } catch (error) {
    // Enhanced error handling for React Query error boundaries
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error occurred while fetching profile';
    
    // Create structured error for better debugging and user feedback
    const structuredError = new Error(errorMessage);
    structuredError.name = 'ProfileFetchError';
    
    // Preserve original error details for debugging
    if (error instanceof Error && error.stack) {
      (structuredError as any).originalStack = error.stack;
    }
    
    throw structuredError;
  }
}

/**
 * Fetches specific user profile data by user ID
 * 
 * Provides administrative capability to fetch any user's profile data
 * with appropriate permission checks handled by the backend API.
 * 
 * @param userId - Unique identifier for the user profile to fetch
 * @returns Promise resolving to UserProfile data
 * @throws Error with structured error information for React Query error handling
 */
async function fetchUserProfile(userId: number): Promise<UserProfile> {
  try {
    if (!userId || userId <= 0) {
      throw new Error('Invalid user ID provided');
    }

    const response = await apiGet<ApiResponse<UserProfile>>(
      `${API_ENDPOINTS.SYSTEM_USER}/${userId}`,
      {
        // Comprehensive profile data retrieval
        fields: '*',
        related: 'lookup_by_user_id,user_to_app_to_role_by_user_id.role',
        
        // Error handling configuration
        snackbarError: `Failed to load user profile for ID: ${userId}`,
        showSpinner: false,
        
        // Cache optimization for user-specific data
        includeCacheControl: true,
      }
    );

    // Validate and extract profile data
    const profileData = 'data' in response ? response.data : response;
    
    if (!profileData) {
      throw new Error(`User profile not found for ID: ${userId}`);
    }

    const profile = profileData as UserProfile;
    
    // Validate profile data integrity
    if (!profile.id || profile.id !== userId) {
      throw new Error('Profile data integrity validation failed');
    }

    return profile;
  } catch (error) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : `Unknown error occurred while fetching user profile ${userId}`;
    
    const structuredError = new Error(errorMessage);
    structuredError.name = 'UserProfileFetchError';
    
    throw structuredError;
  }
}

// ============================================================================
// REACT QUERY HOOKS
// ============================================================================

/**
 * React Query hook for current user profile data
 * 
 * Primary hook for accessing the currently authenticated user's profile information.
 * Implements intelligent caching with TTL configuration for optimal performance
 * while providing real-time updates through background revalidation.
 * 
 * Features:
 * - Automatic caching with 5-minute stale time and 15-minute cache time
 * - Background revalidation for real-time profile updates
 * - Comprehensive error handling with React Error Boundary integration
 * - Loading and error states for enhanced user experience
 * - Type-safe UserProfile return with full interface compliance
 * 
 * @returns UseQueryResult with UserProfile data and query state management
 */
export function useProfile(): UseQueryResult<UserProfile, Error> {
  return useQuery({
    // Use consistent query key for cache management
    queryKey: profileQueryKeys.current(),
    
    // Fetch function with comprehensive error handling
    queryFn: fetchCurrentUserProfile,
    
    // Apply optimized cache configuration
    ...PROFILE_CACHE_CONFIG,
    
    // Enhanced error handling for React Error Boundaries
    useErrorBoundary: (error: Error) => {
      // Use error boundary for critical profile fetch failures
      return error.name === 'ProfileFetchError' || error.message.includes('authentication');
    },
    
    // Data transformation and validation
    select: (data: UserProfile) => {
      // Ensure consistent data structure
      return {
        ...data,
        // Normalize display name fallback
        display_name: data.display_name || data.username || data.email,
        // Ensure boolean flags are properly typed
        is_active: Boolean(data.is_active),
        confirmed: Boolean(data.confirmed),
      };
    },
    
    // Metadata for debugging and monitoring
    meta: {
      purpose: 'current-user-profile',
      component: 'useProfile',
      feature: 'F-005 User and Role Management',
    },
  });
}

/**
 * React Query hook for specific user profile data by ID
 * 
 * Administrative hook for accessing any user's profile information with
 * appropriate permission handling. Provides the same caching and performance
 * benefits as the current user profile hook while supporting user-specific queries.
 * 
 * @param userId - User ID to fetch profile data for
 * @param options - Additional query options for customization
 * @returns UseQueryResult with UserProfile data and query state management
 */
export function useUserProfile(
  userId: number,
  options: {
    enabled?: boolean;
    refetchInterval?: number | false;
    onSuccess?: (data: UserProfile) => void;
    onError?: (error: Error) => void;
  } = {}
): UseQueryResult<UserProfile, Error> {
  const { enabled = true, refetchInterval, onSuccess, onError } = options;

  return useQuery({
    // User-specific query key for individual cache management
    queryKey: profileQueryKeys.user(userId),
    
    // Fetch function with user ID parameter
    queryFn: () => fetchUserProfile(userId),
    
    // Apply base cache configuration with custom options
    ...PROFILE_CACHE_CONFIG,
    
    // Custom configuration overrides
    enabled: enabled && Boolean(userId && userId > 0),
    refetchInterval: refetchInterval !== undefined ? refetchInterval : PROFILE_CACHE_CONFIG.refetchInterval,
    
    // Enhanced error handling
    useErrorBoundary: (error: Error) => {
      return error.name === 'UserProfileFetchError' || error.message.includes('authentication');
    },
    
    // Data transformation for consistency
    select: (data: UserProfile) => ({
      ...data,
      display_name: data.display_name || data.username || data.email,
      is_active: Boolean(data.is_active),
      confirmed: Boolean(data.confirmed),
    }),
    
    // Callback handling
    onSuccess,
    onError,
    
    // Metadata for debugging
    meta: {
      purpose: 'user-profile-by-id',
      component: 'useUserProfile',
      feature: 'F-005 User and Role Management',
      userId: userId,
    },
  });
}

// ============================================================================
// UTILITY HOOKS AND HELPERS
// ============================================================================

/**
 * Hook for pre-fetching user profile data
 * 
 * Enables proactive loading of user profile data to enhance user experience
 * by reducing perceived loading times. Useful for pre-loading profile data
 * when navigation to profile-related pages is anticipated.
 * 
 * @returns Object with prefetch functions for different profile query types
 */
export function useProfilePrefetch() {
  const { queryClient } = useQuery.prototype.constructor as any;

  return {
    /**
     * Pre-fetch current user profile data
     */
    prefetchCurrentProfile: () => {
      return queryClient?.prefetchQuery({
        queryKey: profileQueryKeys.current(),
        queryFn: fetchCurrentUserProfile,
        staleTime: PROFILE_CACHE_CONFIG.staleTime,
      });
    },
    
    /**
     * Pre-fetch specific user profile data
     * 
     * @param userId - User ID to pre-fetch profile data for
     */
    prefetchUserProfile: (userId: number) => {
      return queryClient?.prefetchQuery({
        queryKey: profileQueryKeys.user(userId),
        queryFn: () => fetchUserProfile(userId),
        staleTime: PROFILE_CACHE_CONFIG.staleTime,
      });
    },
  };
}

/**
 * Utility function to invalidate profile cache
 * 
 * Provides centralized cache invalidation for profile data when updates occur.
 * Ensures data consistency across the application after profile modifications.
 * 
 * @param queryClient - React Query client instance
 * @param userId - Optional specific user ID to invalidate (invalidates all if not provided)
 */
export function invalidateProfileCache(queryClient: any, userId?: number) {
  if (userId) {
    // Invalidate specific user profile cache
    return queryClient.invalidateQueries({
      queryKey: profileQueryKeys.user(userId),
    });
  } else {
    // Invalidate all profile-related caches
    return queryClient.invalidateQueries({
      queryKey: profileQueryKeys.all,
    });
  }
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

/**
 * Re-export types for convenience and consistency
 */
export type { UserProfile } from '../../../types/user';

/**
 * Query configuration type for external reference
 */
export type ProfileCacheConfig = typeof PROFILE_CACHE_CONFIG;

/**
 * Query keys type for external reference
 */
export type ProfileQueryKeys = typeof profileQueryKeys;

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

/**
 * Default export providing the primary useProfile hook
 * Maintains consistency with React hook patterns and enables
 * simplified imports for the most common use case
 */
export default useProfile;