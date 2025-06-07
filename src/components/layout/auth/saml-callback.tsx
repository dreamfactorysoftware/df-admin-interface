/**
 * SAML Callback Handler Component
 * 
 * React SAML callback handler component processing JWT tokens from SAML authentication
 * providers and managing automatic login flow. Migrated from Angular login component
 * to use Next.js router parameter handling, React hooks for token processing, and
 * error handling with proper user feedback.
 * 
 * Features:
 * - JWT token extraction from URL query parameters for SAML authentication callback
 * - Automatic authentication processing with session establishment and user data loading
 * - Error handling for invalid tokens, expired sessions, and authentication failures
 * - Loading states during token validation and authentication process
 * - Automatic redirection to home page on successful authentication
 * - Error message display and redirection to login page on authentication failure
 * - Integration with existing SAML authentication flow and backend token validation
 * 
 * Migration Details:
 * - Replaces Angular ActivatedRoute query parameter subscription with useSearchParams
 * - Converts Angular authentication service injection to useAuth hook pattern
 * - Migrates from RxJS observable error handling to React Query mutation patterns
 * - Transforms Angular router navigation to Next.js useRouter for redirection
 * - Converts Angular component lifecycle (ngOnInit) to React useEffect patterns
 * - Replaces Angular notification service with custom toast/alert system
 * - Implements loading states and error boundaries for SAML authentication flow
 * 
 * @fileoverview SAML callback handler for SSO authentication workflows
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1+, TypeScript 5.8+
 * @see Technical Specification Section 0 - SUMMARY OF CHANGES
 * @see Technical Specification Section 4.5 - SECURITY AND AUTHENTICATION FLOWS
 */

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../hooks/use-auth';
import { Alert } from '../../ui/alert';
import type { AuthError } from '../../../types/auth';

// ============================================================================
// COMPONENT INTERFACES
// ============================================================================

interface SAMLCallbackProps {
  /** Optional redirect URL to use instead of default home page */
  redirectUrl?: string;
  
  /** Optional login redirect URL to use instead of default login page */
  loginRedirectUrl?: string;
  
  /** Optional custom error message to display on authentication failure */
  errorMessage?: string;
  
  /** Whether to show detailed error information for debugging */
  showDetailedErrors?: boolean;
  
  /** Custom loading message to display during authentication */
  loadingMessage?: string;
}

// ============================================================================
// COMPONENT CONSTANTS
// ============================================================================

const DEFAULT_CONFIG = {
  redirectUrl: '/adf-home',
  loginRedirectUrl: '/login',
  loadingMessage: 'Processing authentication...',
  errorMessage: 'Authentication failed. Please try again.',
  showDetailedErrors: false,
  tokenParam: 'jwt',
  authTimeout: 30000, // 30 seconds timeout for authentication
} as const;

// ============================================================================
// COMPONENT IMPLEMENTATION
// ============================================================================

/**
 * SAML Callback Handler Component
 * 
 * Handles SAML authentication callback by extracting JWT tokens from URL parameters,
 * processing authentication with the backend, and managing the authentication flow
 * including success and error states with appropriate user feedback and redirection.
 * 
 * Replaces Angular login component's SAML handling functionality with modern React
 * patterns including hooks, suspense, and Next.js routing capabilities.
 */
export function SAMLCallback({
  redirectUrl = DEFAULT_CONFIG.redirectUrl,
  loginRedirectUrl = DEFAULT_CONFIG.loginRedirectUrl,
  errorMessage = DEFAULT_CONFIG.errorMessage,
  showDetailedErrors = DEFAULT_CONFIG.showDetailedErrors,
  loadingMessage = DEFAULT_CONFIG.loadingMessage,
}: SAMLCallbackProps = {}) {
  // ============================================================================
  // HOOKS AND STATE MANAGEMENT
  // ============================================================================
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const { loginWithToken, isLoading, error, clearError } = useAuth();
  
  // Local component state for managing authentication flow
  const [authState, setAuthState] = useState<{
    status: 'idle' | 'processing' | 'success' | 'error';
    message?: string;
    details?: string;
  }>({
    status: 'idle',
  });

  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  // ============================================================================
  // AUTHENTICATION PROCESSING
  // ============================================================================

  /**
   * Process SAML authentication with JWT token
   * Handles the complete authentication flow including token validation,
   * session establishment, and error handling with user feedback.
   */
  const processSAMLAuthentication = useCallback(async (token: string) => {
    try {
      // Clear any previous authentication errors
      clearError();
      
      // Set processing state with loading message
      setAuthState({
        status: 'processing',
        message: loadingMessage,
      });

      // Set authentication timeout to prevent hanging
      const timeout = setTimeout(() => {
        setAuthState({
          status: 'error',
          message: 'Authentication timeout. Please try again.',
          details: showDetailedErrors ? 'Request exceeded 30 second timeout limit' : undefined,
        });
      }, DEFAULT_CONFIG.authTimeout);
      
      setTimeoutId(timeout);

      // Process authentication with JWT token
      await loginWithToken(token);
      
      // Clear timeout on successful authentication
      clearTimeout(timeout);
      setTimeoutId(null);
      
      // Set success state
      setAuthState({
        status: 'success',
        message: 'Authentication successful! Redirecting...',
      });
      
      // Redirect to home page after successful authentication
      // Use replace to prevent users from navigating back to callback URL
      router.replace(redirectUrl);
      
    } catch (authError) {
      // Clear timeout on error
      if (timeoutId) {
        clearTimeout(timeoutId);
        setTimeoutId(null);
      }
      
      console.error('SAML authentication failed:', authError);
      
      // Determine error message and details
      const errorDetails = authError as AuthError;
      const displayMessage = errorDetails?.message || errorMessage;
      const displayDetails = showDetailedErrors 
        ? errorDetails?.context || errorDetails?.code || 'Unknown error'
        : undefined;
      
      // Set error state with appropriate messaging
      setAuthState({
        status: 'error',
        message: displayMessage,
        details: displayDetails,
      });
      
      // Redirect to login page after a delay to allow user to read error
      setTimeout(() => {
        router.replace(loginRedirectUrl);
      }, 3000);
    }
  }, [
    loginWithToken,
    clearError,
    loadingMessage,
    errorMessage,
    showDetailedErrors,
    redirectUrl,
    loginRedirectUrl,
    router,
    timeoutId,
  ]);

  /**
   * Extract and validate JWT token from URL parameters
   * Implements the same token extraction logic as Angular ActivatedRoute
   * but using Next.js useSearchParams for URL parameter access.
   */
  const extractAndProcessToken = useCallback(() => {
    const token = searchParams.get(DEFAULT_CONFIG.tokenParam);
    
    if (!token) {
      // No JWT token found in URL parameters
      setAuthState({
        status: 'error',
        message: 'No authentication token found in URL.',
        details: showDetailedErrors ? `Expected '${DEFAULT_CONFIG.tokenParam}' parameter in URL` : undefined,
      });
      
      // Redirect to login page if no token is present
      setTimeout(() => {
        router.replace(loginRedirectUrl);
      }, 2000);
      
      return;
    }
    
    // Validate token format (basic JWT structure check)
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      setAuthState({
        status: 'error',
        message: 'Invalid token format.',
        details: showDetailedErrors ? 'JWT token must have 3 parts separated by dots' : undefined,
      });
      
      setTimeout(() => {
        router.replace(loginRedirectUrl);
      }, 2000);
      
      return;
    }
    
    // Process authentication with valid token
    processSAMLAuthentication(token);
  }, [
    searchParams,
    showDetailedErrors,
    loginRedirectUrl,
    router,
    processSAMLAuthentication,
  ]);

  // ============================================================================
  // COMPONENT LIFECYCLE
  // ============================================================================

  /**
   * Handle initial component mount and token processing
   * Replaces Angular ngOnInit lifecycle with React useEffect pattern
   * for automatic authentication processing when component loads.
   */
  useEffect(() => {
    // Only process authentication if we're in idle state
    if (authState.status === 'idle') {
      extractAndProcessToken();
    }
  }, [authState.status, extractAndProcessToken]);

  /**
   * Cleanup timeout on component unmount
   * Prevents memory leaks and unnecessary timeout executions
   */
  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  /**
   * Handle authentication hook error state
   * Synchronizes component error state with useAuth hook error state
   */
  useEffect(() => {
    if (error && authState.status === 'processing') {
      setAuthState({
        status: 'error',
        message: error.message || errorMessage,
        details: showDetailedErrors ? error.context || error.code : undefined,
      });
    }
  }, [error, authState.status, errorMessage, showDetailedErrors]);

  // ============================================================================
  // RENDER LOGIC
  // ============================================================================

  /**
   * Render loading state during authentication processing
   * Shows loading spinner and message while token validation is in progress
   */
  const renderLoadingState = () => (
    <div className="flex flex-col items-center justify-center min-h-[200px] space-y-4">
      {/* Loading spinner */}
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      
      {/* Loading message */}
      <div className="text-center">
        <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
          {authState.message || loadingMessage}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Please wait while we complete your authentication...
        </p>
      </div>
    </div>
  );

  /**
   * Render success state after successful authentication
   * Shows success message and redirection information
   */
  const renderSuccessState = () => (
    <div className="flex flex-col items-center justify-center min-h-[200px] space-y-4">
      {/* Success icon */}
      <div className="rounded-full bg-success-100 p-3">
        <svg
          className="h-6 w-6 text-success-600"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.5 12.75l6 6 9-13.5"
          />
        </svg>
      </div>
      
      {/* Success message */}
      <div className="text-center">
        <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
          {authState.message}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          You will be redirected to the dashboard shortly.
        </p>
      </div>
    </div>
  );

  /**
   * Render error state for authentication failures
   * Shows error message with optional details and manual navigation options
   */
  const renderErrorState = () => (
    <div className="space-y-4">
      <Alert
        type="error"
        title="Authentication Failed"
        description={authState.message}
        dismissible={false}
        showIcon={true}
        variant="soft"
        size="md"
      >
        {authState.details && (
          <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
            <p className="text-xs text-gray-600 dark:text-gray-400 font-mono">
              {authState.details}
            </p>
          </div>
        )}
      </Alert>
      
      {/* Manual navigation options */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <button
          onClick={() => router.replace(loginRedirectUrl)}
          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          Return to Login
        </button>
        
        <button
          onClick={() => window.location.reload()}
          className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Try Again
        </button>
      </div>
    </div>
  );

  // ============================================================================
  // MAIN COMPONENT RENDER
  // ============================================================================

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            SAML Authentication
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Processing your single sign-on authentication
          </p>
        </div>
        
        {/* Content based on authentication state */}
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
          {authState.status === 'processing' && renderLoadingState()}
          {authState.status === 'success' && renderSuccessState()}
          {authState.status === 'error' && renderErrorState()}
          {authState.status === 'idle' && renderLoadingState()}
        </div>
        
        {/* Footer information */}
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            If you continue to experience issues, please contact your system administrator.
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENT EXPORT AND METADATA
// ============================================================================

SAMLCallback.displayName = 'SAMLCallback';

export default SAMLCallback;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type { SAMLCallbackProps };