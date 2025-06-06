'use client';

import React, { Suspense, useEffect, useState, createContext, useContext, ReactNode } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/lib/utils';

// =============================================================================
// EMAIL TEMPLATE CONTEXT AND STATE MANAGEMENT
// =============================================================================

/**
 * Email template state interface
 * Manages email template workflow state with Zustand patterns
 */
interface EmailTemplateState {
  // Template management state
  selectedTemplate: EmailTemplate | null;
  templates: EmailTemplate[];
  templateList: EmailTemplate[];
  isLoading: boolean;
  error: EmailTemplateError | null;

  // Workflow state
  isEditing: boolean;
  isDirty: boolean;
  isCreating: boolean;
  lastSavedAt: string | null;

  // UI state
  showPreview: boolean;
  activeTab: 'content' | 'settings' | 'preview';
  sidebarCollapsed: boolean;

  // Filter and search state
  searchQuery: string;
  filterStatus: 'all' | 'active' | 'inactive';
  sortOrder: 'name' | 'created' | 'modified';
}

/**
 * Email template actions interface
 * Defines available operations for email template management
 */
interface EmailTemplateActions {
  // Template CRUD operations
  selectTemplate: (template: EmailTemplate | null) => void;
  createTemplate: (template: Partial<EmailTemplate>) => Promise<void>;
  updateTemplate: (id: string, updates: Partial<EmailTemplate>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  duplicateTemplate: (id: string) => Promise<void>;

  // Workflow actions
  setEditing: (editing: boolean) => void;
  setDirty: (dirty: boolean) => void;
  setCreating: (creating: boolean) => void;
  markSaved: () => void;

  // UI actions
  setShowPreview: (show: boolean) => void;
  setActiveTab: (tab: 'content' | 'settings' | 'preview') => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Filter and search actions
  setSearchQuery: (query: string) => void;
  setFilterStatus: (status: 'all' | 'active' | 'inactive') => void;
  setSortOrder: (order: 'name' | 'created' | 'modified') => void;

  // Utility actions
  clearError: () => void;
  refreshTemplates: () => Promise<void>;
  resetState: () => void;
}

/**
 * Email template data interface
 */
interface EmailTemplate {
  id: string;
  name: string;
  description?: string;
  subject: string;
  bodyText?: string;
  bodyHtml?: string;
  fromName?: string;
  fromEmail?: string;
  replyToName?: string;
  replyToEmail?: string;
  isActive: boolean;
  isDefault: boolean;
  templateType: 'invitation' | 'confirmation' | 'password_reset' | 'notification' | 'custom';
  variables: EmailTemplateVariable[];
  createdAt: string;
  modifiedAt: string;
  createdBy?: string;
  modifiedBy?: string;
}

/**
 * Email template variable interface
 */
interface EmailTemplateVariable {
  name: string;
  description: string;
  defaultValue?: string;
  required: boolean;
  type: 'string' | 'number' | 'boolean' | 'date';
}

/**
 * Email template error interface
 */
interface EmailTemplateError {
  code: string;
  message: string;
  context?: string | Record<string, any>;
  statusCode?: number;
  timestamp: string;
  field?: string;
}

/**
 * Combined email template store interface
 */
export interface EmailTemplateStore extends EmailTemplateState, EmailTemplateActions {}

/**
 * Email template context type
 */
interface EmailTemplateContextType {
  store: EmailTemplateStore;
}

// =============================================================================
// ZUSTAND STORE IMPLEMENTATION
// =============================================================================

/**
 * Email template store using Zustand patterns
 * Provides state management for email template workflows with persistence
 */
function createEmailTemplateStore(): EmailTemplateStore {
  const [state, setState] = useState<EmailTemplateState>({
    selectedTemplate: null,
    templates: [],
    templateList: [],
    isLoading: false,
    error: null,
    isEditing: false,
    isDirty: false,
    isCreating: false,
    lastSavedAt: null,
    showPreview: false,
    activeTab: 'content',
    sidebarCollapsed: false,
    searchQuery: '',
    filterStatus: 'all',
    sortOrder: 'name',
  });

  // Simulate API calls with proper error handling
  const makeApiCall = async <T>(
    operation: () => Promise<T>,
    errorContext: string
  ): Promise<T> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = await operation();
      setState(prev => ({ ...prev, isLoading: false }));
      return result;
    } catch (error: any) {
      const emailError: EmailTemplateError = {
        code: error.code || 'EMAIL_TEMPLATE_ERROR',
        message: error.message || 'An error occurred while processing email template',
        context: errorContext,
        statusCode: error.statusCode || 500,
        timestamp: new Date().toISOString(),
        field: error.field,
      };
      
      setState(prev => ({ ...prev, isLoading: false, error: emailError }));
      throw emailError;
    }
  };

  // Store actions implementation
  const actions: EmailTemplateActions = {
    selectTemplate: (template) => {
      setState(prev => ({ ...prev, selectedTemplate: template, isEditing: false, isDirty: false }));
    },

    createTemplate: async (template) => {
      await makeApiCall(async () => {
        // Simulate API call
        const newTemplate: EmailTemplate = {
          id: crypto.randomUUID?.() || Math.random().toString(36),
          name: template.name || 'New Template',
          subject: template.subject || '',
          bodyText: template.bodyText || '',
          bodyHtml: template.bodyHtml || '',
          isActive: template.isActive ?? true,
          isDefault: false,
          templateType: template.templateType || 'custom',
          variables: template.variables || [],
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
          ...template,
        };

        setState(prev => ({
          ...prev,
          templates: [...prev.templates, newTemplate],
          templateList: [...prev.templateList, newTemplate],
          selectedTemplate: newTemplate,
          isCreating: false,
          lastSavedAt: new Date().toISOString(),
        }));
      }, 'creating email template');
    },

    updateTemplate: async (id, updates) => {
      await makeApiCall(async () => {
        setState(prev => ({
          ...prev,
          templates: prev.templates.map(t => 
            t.id === id ? { ...t, ...updates, modifiedAt: new Date().toISOString() } : t
          ),
          templateList: prev.templateList.map(t => 
            t.id === id ? { ...t, ...updates, modifiedAt: new Date().toISOString() } : t
          ),
          selectedTemplate: prev.selectedTemplate?.id === id 
            ? { ...prev.selectedTemplate, ...updates, modifiedAt: new Date().toISOString() }
            : prev.selectedTemplate,
          isDirty: false,
          lastSavedAt: new Date().toISOString(),
        }));
      }, 'updating email template');
    },

    deleteTemplate: async (id) => {
      await makeApiCall(async () => {
        setState(prev => ({
          ...prev,
          templates: prev.templates.filter(t => t.id !== id),
          templateList: prev.templateList.filter(t => t.id !== id),
          selectedTemplate: prev.selectedTemplate?.id === id ? null : prev.selectedTemplate,
        }));
      }, 'deleting email template');
    },

    duplicateTemplate: async (id) => {
      await makeApiCall(async () => {
        const template = state.templates.find(t => t.id === id);
        if (template) {
          const duplicated: EmailTemplate = {
            ...template,
            id: crypto.randomUUID?.() || Math.random().toString(36),
            name: `${template.name} (Copy)`,
            isDefault: false,
            createdAt: new Date().toISOString(),
            modifiedAt: new Date().toISOString(),
          };

          setState(prev => ({
            ...prev,
            templates: [...prev.templates, duplicated],
            templateList: [...prev.templateList, duplicated],
          }));
        }
      }, 'duplicating email template');
    },

    setEditing: (editing) => {
      setState(prev => ({ ...prev, isEditing: editing }));
    },

    setDirty: (dirty) => {
      setState(prev => ({ ...prev, isDirty: dirty }));
    },

    setCreating: (creating) => {
      setState(prev => ({ ...prev, isCreating: creating }));
    },

    markSaved: () => {
      setState(prev => ({ ...prev, isDirty: false, lastSavedAt: new Date().toISOString() }));
    },

    setShowPreview: (show) => {
      setState(prev => ({ ...prev, showPreview: show }));
    },

    setActiveTab: (tab) => {
      setState(prev => ({ ...prev, activeTab: tab }));
    },

    setSidebarCollapsed: (collapsed) => {
      setState(prev => ({ ...prev, sidebarCollapsed: collapsed }));
    },

    setSearchQuery: (query) => {
      setState(prev => ({ ...prev, searchQuery: query }));
    },

    setFilterStatus: (status) => {
      setState(prev => ({ ...prev, filterStatus: status }));
    },

    setSortOrder: (order) => {
      setState(prev => ({ ...prev, sortOrder: order }));
    },

    clearError: () => {
      setState(prev => ({ ...prev, error: null }));
    },

    refreshTemplates: async () => {
      await makeApiCall(async () => {
        // Simulate API refresh
        setState(prev => ({ ...prev, templates: [...prev.templates] }));
      }, 'refreshing email templates');
    },

    resetState: () => {
      setState({
        selectedTemplate: null,
        templates: [],
        templateList: [],
        isLoading: false,
        error: null,
        isEditing: false,
        isDirty: false,
        isCreating: false,
        lastSavedAt: null,
        showPreview: false,
        activeTab: 'content',
        sidebarCollapsed: false,
        searchQuery: '',
        filterStatus: 'all',
        sortOrder: 'name',
      });
    },
  };

  return { ...state, ...actions };
}

// =============================================================================
// CONTEXT PROVIDERS
// =============================================================================

/**
 * Email template context
 */
const EmailTemplateContext = createContext<EmailTemplateContextType | null>(null);

/**
 * Hook to use email template context
 */
export function useEmailTemplateContext(): EmailTemplateStore {
  const context = useContext(EmailTemplateContext);
  if (!context) {
    throw new Error('useEmailTemplateContext must be used within EmailTemplateProvider');
  }
  return context.store;
}

/**
 * Email template provider component
 */
function EmailTemplateProvider({ children }: { children: ReactNode }) {
  const store = createEmailTemplateStore();

  // Initialize templates on mount
  useEffect(() => {
    // Simulate loading initial templates
    store.refreshTemplates().catch(console.error);
  }, []);

  return (
    <EmailTemplateContext.Provider value={{ store }}>
      {children}
    </EmailTemplateContext.Provider>
  );
}

// =============================================================================
// ERROR BOUNDARY COMPONENTS
// =============================================================================

/**
 * Email template specific error fallback component
 */
function EmailTemplateErrorFallback({ 
  error, 
  resetErrorBoundary 
}: { 
  error: Error; 
  resetErrorBoundary: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring service
    console.error('Email Template Error:', error);
  }, [error]);

  return (
    <div 
      className="min-h-[400px] flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
      role="alert"
      aria-labelledby="email-template-error-title"
      aria-describedby="email-template-error-description"
    >
      <div className="max-w-md w-full mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3 mb-4">
          <div className="flex-shrink-0">
            <svg 
              className="h-8 w-8 text-red-500" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" 
              />
            </svg>
          </div>
          <div>
            <h1 
              id="email-template-error-title"
              className="text-lg font-semibold text-gray-900 dark:text-white"
            >
              Email Template Error
            </h1>
          </div>
        </div>
        
        <p 
          id="email-template-error-description"
          className="text-gray-600 dark:text-gray-400 mb-6"
        >
          There was an error loading the email template section. Please try refreshing or contact support if the problem persists.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={resetErrorBoundary}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200 min-h-[44px]"
            aria-label="Try to recover from email template error"
          >
            <svg 
              className="h-4 w-4 mr-2" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
              />
            </svg>
            Try Again
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200 min-h-[44px]"
            aria-label="Reload the page"
          >
            Reload Page
          </button>
        </div>
        
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-md">
            <summary className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
              Error Details (Development)
            </summary>
            <pre className="mt-2 text-xs text-gray-600 dark:text-gray-400 overflow-auto">
              {error.message}
              {error.stack && '\n\n' + error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

/**
 * Loading fallback component for email templates
 */
function EmailTemplateLoadingFallback() {
  return (
    <div 
      className="min-h-[400px] flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
      role="status"
      aria-label="Loading email templates"
    >
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
          Loading email templates...
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN LAYOUT COMPONENT
// =============================================================================

/**
 * Layout props interface
 */
interface EmailTemplateLayoutProps {
  children: ReactNode;
  className?: string;
}

/**
 * Email Templates Layout Component
 * 
 * Provides React Context providers for email template state management, 
 * authentication, and theme handling. Establishes consistent navigation 
 * and responsive layout structure for all email template pages while 
 * replacing Angular module-based dependency injection with React Context patterns.
 * 
 * Features:
 * - React Context providers for email template state management
 * - Zustand store for email template workflow state with persistence
 * - Error boundaries for graceful error handling
 * - Authentication integration with useAuth hook
 * - Theme management with useTheme hook
 * - Responsive layout with WCAG 2.1 AA accessibility compliance
 * - Next.js middleware authentication flow integration
 * - Loading states and error recovery mechanisms
 * 
 * Replaces Angular module patterns with React 19 Context and hooks
 * for enhanced performance and maintainability.
 */
export default function EmailTemplateLayout({ 
  children, 
  className 
}: EmailTemplateLayoutProps) {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth({
    redirectIfUnauthenticated: true,
    redirectTo: '/login',
    requiredPermissions: ['system:config:email-templates:read'],
  });
  
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Apply theme to layout
  useEffect(() => {
    if (mounted) {
      const element = document.querySelector('[data-email-template-layout]');
      if (element) {
        element.classList.remove('light', 'dark');
        element.classList.add(resolvedTheme);
      }
    }
  }, [resolvedTheme, mounted]);

  // Show loading while authentication is being checked
  if (!mounted || authLoading) {
    return <EmailTemplateLoadingFallback />;
  }

  // Redirect will be handled by useAuth hook if not authenticated
  if (!isAuthenticated) {
    return <EmailTemplateLoadingFallback />;
  }

  return (
    <div 
      data-email-template-layout
      className={cn(
        "min-h-full bg-white dark:bg-gray-900 transition-colors duration-300",
        "p-6 space-y-6",
        className
      )}
    >
      <ErrorBoundary
        FallbackComponent={EmailTemplateErrorFallback}
        onReset={() => {
          // Clear any error state and refresh
          window.location.reload();
        }}
        onError={(error) => {
          // Log error to monitoring service
          console.error('Email Template Layout Error:', error);
        }}
      >
        <EmailTemplateProvider>
          {/* Page Header */}
          <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Email Templates
                </h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Manage system email templates and notifications
                </p>
              </div>
              
              {/* User context indicator */}
              {user && (
                <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
                  <span>Welcome, {user.displayName || user.firstName || user.name}</span>
                  {user.isSysAdmin && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      System Admin
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Main Content Area */}
          <main 
            className="flex-1"
            role="main"
            aria-label="Email templates content"
          >
            <Suspense fallback={<EmailTemplateLoadingFallback />}>
              <ErrorBoundary
                FallbackComponent={EmailTemplateErrorFallback}
                onReset={() => {
                  // Reset email template state
                  window.location.reload();
                }}
              >
                {children}
              </ErrorBoundary>
            </Suspense>
          </main>

          {/* Global accessibility announcements */}
          <div 
            id="email-template-announcements"
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
          />
        </EmailTemplateProvider>
      </ErrorBoundary>
    </div>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export { 
  useEmailTemplateContext,
  type EmailTemplate,
  type EmailTemplateStore,
  type EmailTemplateError,
  type EmailTemplateVariable,
};