/**
 * Mock useCorsOperations Hook for Testing
 * 
 * Provides a mock implementation of the useCorsOperations hook for testing
 * CORS management functionality without the need for the actual hook implementation.
 * This mock simulates all the expected operations and state management patterns.
 */

import { vi } from 'vitest';
import { mockCorsEntries } from '@/test/mocks/cors-data';

/**
 * Mock implementation of useCorsOperations hook
 */
export const useCorsOperations = vi.fn(() => ({
  // Data fetching state
  data: { resource: mockCorsEntries },
  isLoading: false,
  error: null,
  
  // Mutation operations
  createCors: {
    mutate: vi.fn(),
    isLoading: false,
    isSuccess: false,
    error: null,
  },
  
  updateCors: {
    mutate: vi.fn(),
    isLoading: false,
    isSuccess: false,
    error: null,
  },
  
  deleteCors: {
    mutate: vi.fn(),
    isLoading: false,
    isSuccess: false,
    error: null,
  },
  
  // State flags
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
}));

export default useCorsOperations;