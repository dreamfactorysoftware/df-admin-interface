'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { LoadingSpinner } from '@/components/ui/loading';
import { Alert } from '@/components/ui/alert';

/**
 * SAML callback handler component that processes JWT tokens from SAML authentication providers
 * and manages automatic login flow. Migrated from Angular login component to use Next.js router
 * parameter handling, React hooks for token processing, and error handling with proper user feedback.
 * 
 * This component handles:
 * - JWT token extraction from URL query parameters for SAML authentication callback
 * - Automatic authentication processing with session establishment and user data loading
 * - Error handling for invalid tokens, expired sessions, and authentication failures
 * - Loading states during token validation and authentication process
 * - Automatic redirection to home page on successful authentication
 * - Error message display and redirection to login page on authentication failure
 * 
 * @returns JSX element for SAML callback processing interface
 */
export default function SamlCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginWithJwt } = useAuth();
  
  // Component state for tracking authentication process
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    /**
     * Handles SAML authentication callback by extracting JWT token and processing login
     */
    const handleSamlCallback = async () => {
      try {
        // Extract JWT token from query parameters
        const jwt = searchParams.get('jwt');
        
        if (!jwt) {
          console.error('SAML Callback: No JWT token found in query parameters');
          setError('No authentication token received from SAML provider. Please try logging in again.');
          setIsProcessing(false);
          
          // Redirect to login page after delay to show error message
          setTimeout(() => {
            router.push('/login');
          }, 3000);
          return;
        }

        console.log('SAML Callback: Processing JWT token authentication');
        
        // Attempt authentication with JWT token
        const result = await loginWithJwt(jwt);
        
        if (result && result.success) {
          console.log('SAML Callback: Authentication successful, redirecting to dashboard');
          
          // Successful authentication - redirect to home/dashboard
          router.push('/');
        } else {
          console.error('SAML Callback: Authentication failed - invalid session token received');
          setError('Authentication failed. The provided token is invalid or expired. Please try logging in again.');
          setIsProcessing(false);
          
          // Redirect to login page after delay
          setTimeout(() => {
            router.push('/login');
          }, 3000);
        }
      } catch (error) {
        console.error('SAML Callback: Authentication error occurred:', error);
        
        // Handle different types of authentication errors
        let errorMessage = 'An unexpected error occurred during authentication. Please try logging in again.';
        
        if (error instanceof Error) {
          // Check for specific error types and provide appropriate messages
          if (error.message.includes('token')) {
            errorMessage = 'The authentication token is invalid or has expired. Please try logging in again.';
          } else if (error.message.includes('network') || error.message.includes('fetch')) {
            errorMessage = 'Network error occurred during authentication. Please check your connection and try again.';
          } else if (error.message.includes('unauthorized') || error.message.includes('forbidden')) {
            errorMessage = 'Authentication failed. You do not have permission to access this application.';
          }
        }
        
        setError(errorMessage);
        setIsProcessing(false);
        
        // Redirect to login page after delay
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    };

    // Start the SAML callback processing
    handleSamlCallback();
  }, [searchParams, loginWithJwt, router]);

  // Render loading state during authentication processing
  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
              <LoadingSpinner className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
              Processing SAML Login
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Please wait while we complete your authentication...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Render error state with user-friendly message and retry guidance
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900 mb-4">
              <svg 
                className="h-8 w-8 text-red-600 dark:text-red-400" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
                />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
              Authentication Failed
            </h2>
            <Alert 
              variant="error" 
              className="mt-4 text-left"
              title="SAML Login Error"
            >
              {error}
            </Alert>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              You will be redirected to the login page shortly...
            </p>
            <button
              onClick={() => router.push('/login')}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors duration-200"
            >
              Return to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // This should never render since we handle all states above, but included for safety
  return null;
}