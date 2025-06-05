'use client';

import { useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// Session storage keys
export const SESSION_STORAGE_KEYS = {
  SESSION_TOKEN: 'session_token',
  USER_DATA: 'currentUser',
  RESTRICTED_ACCESS: 'restrictedAccess',
  USER_SESSION: 'userSession',
} as const;

// User session interfaces based on Angular UserSession type
export interface UserSession {
  email: string;
  firstName: string;
  host: string;
  id: number;
  isRootAdmin: boolean;
  isSysAdmin: boolean;
  lastLoginDate: string;
  lastName: string;
  name: string;
  sessionId: string;
  sessionToken: string;
  tokenExpiryDate: Date;
  roleId: number;
  role_id?: number;
}

export interface UserProfile {
  adldap: string;
  defaultAppId: number;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  oauthProvider: string;
  phone: string;
  username: string;
  securityQuestion: string;
  securityAnswer?: string;
  currentPassword?: string;
  id: number;
  confirmed: boolean;
  createdById?: number;
  createdDate: string;
  expired: boolean;
  isActive: boolean;
  isRootAdmin: number;
  lastLoginDate: string;
  lastModifiedDate: string;
  lastModifiedById: number;
  ldapUsername: string;
  lookupByUserId: Array<{
    id: number;
    name: string;
    value: string;
    private: boolean;
    description: string;
    userId: number;
  }>;
  saml: string;
  userToAppToRoleByUserId: Array<{
    id: number;
    userId: number;
    appId: number;
    roleId: number;
  }>;
  password?: string;
}

export interface RoleType {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  accessibleTabs?: string[];
  roleServiceAccessByRoleId?: Array<any>;
}

// Browser environment detection for SSR compatibility
const isBrowser = typeof window !== 'undefined';

// Cookie utilities with secure configuration
const getCookie = (name: string): string | null => {
  if (!isBrowser) return null;
  
  const nameEQ = `${name}=`;
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(';');

  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(nameEQ) === 0) {
      return c.substring(nameEQ.length, c.length);
    }
  }
  return null;
};

const setCookie = (name: string, value: string): void => {
  if (!isBrowser) return;
  
  // Set cookie with SameSite=Strict for security
  document.cookie = `${name}=${value};expires=Session;path=/;SameSite=Strict`;
};

const clearCookie = (name: string): void => {
  if (!isBrowser) return;
  
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
};

// LocalStorage utilities with JSON serialization
const getStoredData = <T>(key: string): T | null => {
  if (!isBrowser) return null;
  
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error(`Error parsing stored data for key ${key}:`, error);
    localStorage.removeItem(key); // Clear corrupted data
    return null;
  }
};

const setStoredData = <T>(key: string, data: T): void => {
  if (!isBrowser) return;
  
  try {
    localStorage.setItem(key, JSON.stringify(data));
    
    // Trigger storage event for cross-tab synchronization
    window.dispatchEvent(new StorageEvent('storage', {
      key,
      newValue: JSON.stringify(data),
      storageArea: localStorage,
    }));
  } catch (error) {
    console.error(`Error storing data for key ${key}:`, error);
  }
};

const removeStoredData = (key: string): void => {
  if (!isBrowser) return;
  
  localStorage.removeItem(key);
  
  // Trigger storage event for cross-tab synchronization
  window.dispatchEvent(new StorageEvent('storage', {
    key,
    newValue: null,
    storageArea: localStorage,
  }));
};

/**
 * Session token management hook
 * Replaces Angular DfUserDataService cookie handling
 */
export const useSessionToken = () => {
  const [token, setTokenState] = useState<string | null>(() => 
    getCookie(SESSION_STORAGE_KEYS.SESSION_TOKEN)
  );

  const setToken = useCallback((newToken: string) => {
    setCookie(SESSION_STORAGE_KEYS.SESSION_TOKEN, newToken);
    setTokenState(newToken);
  }, []);

  const clearToken = useCallback(() => {
    clearCookie(SESSION_STORAGE_KEYS.SESSION_TOKEN);
    setTokenState(null);
  }, []);

  // Listen for storage changes across tabs
  useEffect(() => {
    const handleStorageChange = () => {
      const currentToken = getCookie(SESSION_STORAGE_KEYS.SESSION_TOKEN);
      setTokenState(currentToken);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return {
    token,
    setToken,
    clearToken,
    hasToken: Boolean(token),
  };
};

/**
 * User data storage hook with localStorage persistence
 * Replaces Angular UserService localStorage operations
 */
export const useUserStorage = () => {
  const [userData, setUserDataState] = useState<any>(() => 
    getStoredData(SESSION_STORAGE_KEYS.USER_DATA)
  );

  const setUserData = useCallback((user: any) => {
    setStoredData(SESSION_STORAGE_KEYS.USER_DATA, user);
    setUserDataState(user);
  }, []);

  const clearUserData = useCallback(() => {
    removeStoredData(SESSION_STORAGE_KEYS.USER_DATA);
    setUserDataState(null);
  }, []);

  // Listen for storage changes across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SESSION_STORAGE_KEYS.USER_DATA) {
        const newData = e.newValue ? JSON.parse(e.newValue) : null;
        setUserDataState(newData);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return {
    userData,
    setUserData,
    clearUserData,
    hasUserData: Boolean(userData),
  };
};

/**
 * User session management hook
 * Replaces Angular DfUserDataService BehaviorSubject patterns
 */
export const useUserSession = () => {
  const { token, setToken, clearToken, hasToken } = useSessionToken();
  const { userData, setUserData, clearUserData } = useUserStorage();
  const queryClient = useQueryClient();

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => Boolean(token));
  const [userSession, setUserSessionState] = useState<UserSession | null>(() => 
    getStoredData(SESSION_STORAGE_KEYS.USER_SESSION)
  );
  const [restrictedAccess, setRestrictedAccess] = useState<string[]>(() => 
    getStoredData(SESSION_STORAGE_KEYS.RESTRICTED_ACCESS) || []
  );

  // Session validation query for token refresh and user data fetching
  const sessionQuery = useQuery({
    queryKey: ['session', 'validation', token],
    queryFn: async () => {
      if (!token) return null;
      
      // This would typically call the DreamFactory session validation endpoint
      // For now, return the existing session data
      return getStoredData<UserSession>(SESSION_STORAGE_KEYS.USER_SESSION);
    },
    enabled: Boolean(token),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchInterval: 30 * 60 * 1000, // 30 minutes background refresh
    refetchOnWindowFocus: true,
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as any).status;
        if (status === 401 || status === 403) return false;
      }
      return failureCount < 3;
    },
  });

  // Role-based access control query
  const roleAccessQuery = useQuery({
    queryKey: ['role', 'access', userSession?.roleId, token],
    queryFn: async () => {
      if (!userSession?.roleId || !userSession.isSysAdmin || userSession.isRootAdmin) {
        return [];
      }

      // This would fetch role permissions from the DreamFactory API
      // /api/v2/system/role/{roleId}?related=role_service_access_by_role_id&accessible_tabs=true
      const mockRoleData: RoleType = {
        id: userSession.roleId,
        name: 'System Admin',
        description: 'System Administrator Role',
        isActive: true,
        accessibleTabs: ['services', 'schema', 'users'], // Mock data
      };

      return mockRoleData.accessibleTabs || [];
    },
    enabled: Boolean(userSession?.roleId && userSession.isSysAdmin && !userSession.isRootAdmin && token),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  // Update session state when data changes
  const setUserSession = useCallback((session: UserSession | null) => {
    setUserSessionState(session);
    if (session) {
      setStoredData(SESSION_STORAGE_KEYS.USER_SESSION, session);
      setToken(session.sessionToken);
      setIsLoggedIn(true);
    } else {
      removeStoredData(SESSION_STORAGE_KEYS.USER_SESSION);
      setIsLoggedIn(false);
    }
  }, [setToken]);

  // Update restricted access when role data changes
  useEffect(() => {
    if (roleAccessQuery.data) {
      setRestrictedAccess(roleAccessQuery.data);
      setStoredData(SESSION_STORAGE_KEYS.RESTRICTED_ACCESS, roleAccessQuery.data);
    }
  }, [roleAccessQuery.data]);

  // Session cleanup function
  const clearSession = useCallback(() => {
    clearToken();
    clearUserData();
    removeStoredData(SESSION_STORAGE_KEYS.USER_SESSION);
    removeStoredData(SESSION_STORAGE_KEYS.RESTRICTED_ACCESS);
    setUserSessionState(null);
    setRestrictedAccess([]);
    setIsLoggedIn(false);
    
    // Clear all cached queries on logout
    queryClient.clear();
  }, [clearToken, clearUserData, queryClient]);

  // Session validation and refresh logic
  const validateAndRefreshSession = useCallback(async () => {
    if (!token) {
      clearSession();
      return false;
    }

    try {
      // Force refetch session validation
      await sessionQuery.refetch();
      
      if (sessionQuery.error) {
        console.error('Session validation failed:', sessionQuery.error);
        clearSession();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Session validation error:', error);
      clearSession();
      return false;
    }
  }, [token, sessionQuery, clearSession]);

  // Check if user has specific access
  const hasAccess = useCallback((tabName: string): boolean => {
    if (!userSession) return false;
    if (userSession.isRootAdmin) return true;
    if (!userSession.isSysAdmin) return true; // Regular users have access to their permitted areas
    
    return !restrictedAccess.includes(tabName);
  }, [userSession, restrictedAccess]);

  // Listen for cross-tab session changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      switch (e.key) {
        case SESSION_STORAGE_KEYS.USER_SESSION:
          const newSession = e.newValue ? JSON.parse(e.newValue) : null;
          setUserSessionState(newSession);
          setIsLoggedIn(Boolean(newSession));
          break;
        case SESSION_STORAGE_KEYS.RESTRICTED_ACCESS:
          const newRestrictions = e.newValue ? JSON.parse(e.newValue) : [];
          setRestrictedAccess(newRestrictions);
          break;
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Token expiration check
  const isTokenExpired = useCallback((): boolean => {
    if (!userSession?.tokenExpiryDate) return false;
    
    const expiryDate = new Date(userSession.tokenExpiryDate);
    const now = new Date();
    return now >= expiryDate;
  }, [userSession]);

  // Auto-refresh on token expiration
  useEffect(() => {
    if (isTokenExpired() && token) {
      validateAndRefreshSession();
    }
  }, [isTokenExpired, token, validateAndRefreshSession]);

  return {
    // Session state
    isLoggedIn,
    userSession,
    userData,
    restrictedAccess,
    hasToken,
    
    // Session management
    setUserSession,
    clearSession,
    validateAndRefreshSession,
    
    // Access control
    hasAccess,
    isTokenExpired,
    
    // Query states
    isValidating: sessionQuery.isLoading || sessionQuery.isFetching,
    validationError: sessionQuery.error,
    isLoadingRoleAccess: roleAccessQuery.isLoading,
    roleAccessError: roleAccessQuery.error,
    
    // Legacy compatibility
    token,
    setToken,
    clearToken,
    setUserData,
    clearUserData,
  };
};

/**
 * Authentication state hook for components
 * Provides reactive authentication state with session management
 */
export const useAuthState = () => {
  const {
    isLoggedIn,
    userSession,
    hasAccess,
    isValidating,
    validationError,
    clearSession,
  } = useUserSession();

  return {
    isAuthenticated: isLoggedIn,
    user: userSession,
    isLoading: isValidating,
    error: validationError,
    hasAccess,
    logout: clearSession,
  };
};

/**
 * Session persistence utilities for Next.js middleware integration
 */
export const sessionUtils = {
  getToken: () => getCookie(SESSION_STORAGE_KEYS.SESSION_TOKEN),
  setToken: (token: string) => setCookie(SESSION_STORAGE_KEYS.SESSION_TOKEN, token),
  clearToken: () => clearCookie(SESSION_STORAGE_KEYS.SESSION_TOKEN),
  
  getUserSession: () => getStoredData<UserSession>(SESSION_STORAGE_KEYS.USER_SESSION),
  setUserSession: (session: UserSession) => setStoredData(SESSION_STORAGE_KEYS.USER_SESSION, session),
  clearUserSession: () => removeStoredData(SESSION_STORAGE_KEYS.USER_SESSION),
  
  getRestrictedAccess: () => getStoredData<string[]>(SESSION_STORAGE_KEYS.RESTRICTED_ACCESS) || [],
  setRestrictedAccess: (access: string[]) => setStoredData(SESSION_STORAGE_KEYS.RESTRICTED_ACCESS, access),
  
  // Complete session cleanup
  clearAllSessionData: () => {
    clearCookie(SESSION_STORAGE_KEYS.SESSION_TOKEN);
    removeStoredData(SESSION_STORAGE_KEYS.USER_SESSION);
    removeStoredData(SESSION_STORAGE_KEYS.USER_DATA);
    removeStoredData(SESSION_STORAGE_KEYS.RESTRICTED_ACCESS);
  },
  
  // Session validation helper for middleware
  isSessionValid: (session: UserSession | null): boolean => {
    if (!session?.tokenExpiryDate) return false;
    
    const expiryDate = new Date(session.tokenExpiryDate);
    const now = new Date();
    return now < expiryDate;
  },
};

// Default export for convenient importing
export default {
  useSessionToken,
  useUserStorage,
  useUserSession,
  useAuthState,
  sessionUtils,
  SESSION_STORAGE_KEYS,
};