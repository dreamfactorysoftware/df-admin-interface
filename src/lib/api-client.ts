/**
 * API Client Configuration
 * 
 * Centralized API client configuration for DreamFactory Admin Interface.
 * Provides base configuration for fetch-based HTTP client used throughout
 * the application with React Query integration.
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

// Base API configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v2'
export const SYSTEM_API_URL = process.env.NEXT_PUBLIC_SYSTEM_API_URL || '/system/api/v2'

/**
 * API client instance (placeholder)
 * 
 * This is a temporary export to satisfy import requirements.
 * The full API client implementation will be provided by the api-client
 * hook and utilities as part of the broader migration.
 */
export const apiClient = {
  // Placeholder - will be implemented by use-api hook
  get: async (url: string, options?: RequestInit) => {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    })
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }
    
    return response.json()
  },
  
  post: async (url: string, data?: any, options?: RequestInit) => {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    })
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }
    
    return response.json()
  }
}

export default apiClient