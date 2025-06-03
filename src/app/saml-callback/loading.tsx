/**
 * SAML Callback Loading Component
 * 
 * Next.js app router loading component for SAML authentication callback processing.
 * Displays a branded loading spinner with progress indicators while JWT tokens
 * are being validated and users are being authenticated through the SAML workflow.
 * 
 * Features:
 * - Next.js app router loading.tsx convention for segment-level loading states
 * - Tailwind CSS styling with DreamFactory brand colors and theme integration
 * - WCAG 2.1 AA accessibility compliance with proper ARIA labels
 * - Performance optimized for fast rendering under 100ms
 * - Responsive design with consistent visual feedback
 * 
 * @returns {JSX.Element} Loading component with branded spinner and progress feedback
 */

'use client';

import { useEffect, useState } from 'react';

export default function SAMLCallbackLoading(): JSX.Element {
  const [dots, setDots] = useState('');
  const [progress, setProgress] = useState(0);

  // Animate loading dots and progress for enhanced UX feedback
  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 500);

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return 90; // Cap at 90% for indeterminate loading
        return prev + Math.random() * 15;
      });
    }, 200);

    return () => {
      clearInterval(dotsInterval);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4"
      role="status"
      aria-live="polite"
      aria-label="SAML authentication in progress"
    >
      <div className="max-w-md w-full space-y-8">
        {/* Main Loading Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
          
          {/* DreamFactory Logo/Brand */}
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-primary-500 rounded-xl flex items-center justify-center mb-4">
              <div className="text-white font-bold text-2xl">DF</div>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              DreamFactory
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Admin Interface
            </p>
          </div>

          {/* Primary Spinner */}
          <div className="relative mb-6">
            <div 
              className="w-12 h-12 mx-auto"
              role="img"
              aria-label="Loading spinner"
            >
              {/* Outer spinning ring */}
              <div className="w-full h-full border-4 border-gray-200 dark:border-gray-600 rounded-full animate-pulse"></div>
              
              {/* Inner spinning element */}
              <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-primary-500 border-r-primary-500 rounded-full animate-spin"></div>
              
              {/* Center dot */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Authentication progress: ${Math.round(progress)}%`}
              ></div>
            </div>
          </div>

          {/* Status Messages */}
          <div className="space-y-3">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Authenticating via SAML{dots}
            </h2>
            
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Processing your security token and validating credentials
            </p>
            
            {/* Progress Steps */}
            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                <span>Token received</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse"></div>
                <span>Validating credentials</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-1.5 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                <span>Setting up session</span>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center space-x-1">
              <svg 
                className="w-3 h-3" 
                fill="currentColor" 
                viewBox="0 0 20 20"
                role="img"
                aria-label="Security shield icon"
              >
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Secure authentication in progress</span>
            </p>
          </div>
        </div>

        {/* Additional Context */}
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            This may take a few seconds while we verify your identity
          </p>
        </div>
      </div>

      {/* Screen Reader Only - Live Region for Updates */}
      <div 
        className="sr-only" 
        aria-live="polite" 
        aria-atomic="true"
        role="status"
      >
        SAML authentication in progress. Processing security token and validating credentials. Progress: {Math.round(progress)}%
      </div>
    </div>
  );
}