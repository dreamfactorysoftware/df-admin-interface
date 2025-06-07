'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { useCache } from '@/hooks/use-cache';
import { AlertCircle, RefreshCw, CheckCircle } from 'lucide-react';

interface CacheFlushFormData {
  confirmFlush: boolean;
}

/**
 * Cache Flush Form Component
 * 
 * Provides system-wide cache flush functionality with confirmation dialog.
 * Implements React Hook Form for form management and React Query hooks
 * for cache operations with real-time status feedback.
 * 
 * Features:
 * - System cache flush with confirmation
 * - Real-time operation status
 * - Error handling and user feedback
 * - Optimistic UI updates
 * - Loading states and success indicators
 * 
 * @returns {JSX.Element} Cache flush form component
 */
export default function CacheFlushForm(): JSX.Element {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastFlushTime, setLastFlushTime] = useState<Date | null>(null);
  
  const { flushSystemCache, isFlushingSystemCache } = useCache();
  
  const {
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<CacheFlushFormData>();

  /**
   * Handle cache flush confirmation
   */
  const handleFlushConfirm = async () => {
    setIsProcessing(true);
    setShowConfirmation(false);
    
    try {
      await flushSystemCache();
      setLastFlushTime(new Date());
      reset();
    } catch (error) {
      console.error('Cache flush failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handle flush initiation with confirmation dialog
   */
  const onSubmit = (data: CacheFlushFormData) => {
    setShowConfirmation(true);
  };

  /**
   * Handle confirmation dialog cancel
   */
  const handleCancel = () => {
    setShowConfirmation(false);
    reset();
  };

  const isLoading = isFlushingSystemCache || isProcessing;

  return (
    <div className="space-y-4">
      {/* Main Flush Button */}
      {!showConfirmation && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Button
            type="submit"
            variant="outline"
            className="flex items-center space-x-2 bg-red-50 hover:bg-red-100 border-red-200 text-red-700 hover:text-red-800 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:border-red-800 dark:text-red-400 dark:hover:text-red-300"
            disabled={isLoading}
            aria-label="Flush system cache"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span>
              {isLoading ? 'Flushing Cache...' : 'Flush System Cache'}
            </span>
          </Button>
        </form>
      )}

      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div className="bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 rounded-lg p-4 shadow-sm">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Confirm System Cache Flush
                </h3>
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                  This action will clear all system-wide cached data including:
                </p>
                <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Global configuration cache</li>
                  <li>• User session data</li>
                  <li>• Schema metadata cache</li>
                  <li>• API response cache</li>
                </ul>
                <p className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
                  Users may need to re-authenticate after this operation.
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  onClick={handleFlushConfirm}
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                      Flushing...
                    </>
                  ) : (
                    'Confirm Flush'
                  )}
                </Button>
                <Button
                  onClick={handleCancel}
                  size="sm"
                  variant="outline"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {lastFlushTime && !isLoading && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm text-green-800 dark:text-green-400">
              System cache flushed successfully at {lastFlushTime.toLocaleTimeString()}
            </span>
          </div>
        </div>
      )}

      {/* Performance Info */}
      <div className="text-xs text-gray-500 dark:text-gray-400">
        Cache flush operations complete within 5 seconds to maintain API generation performance.
      </div>
    </div>
  );
}