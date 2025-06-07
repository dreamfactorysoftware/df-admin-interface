/**
 * Email template types for system configuration management
 * Supports CRUD operations, validation, and React Query integration
 */

import { z } from 'zod';

// Base email template interface from DreamFactory API
export interface EmailTemplate {
  id: number;
  name: string;
  description?: string;
  to?: string;
  cc?: string;
  bcc?: string;
  subject?: string;
  attachment?: string;
  bodyText?: string;
  bodyHtml?: string;
  fromName?: string;
  fromEmail?: string;
  replyToName?: string;
  replyToEmail?: string;
  defaults?: Record<string, any>;
  createdDate: string;
  lastModifiedDate: string;
  createdById?: number;
  lastModifiedById?: number;
}

// Table row interface for data table display
export interface EmailTemplateRow {
  id: number;
  name: string;
  description?: string;
  createdDate: string;
  lastModifiedDate: string;
}

// Payload interface for create/update operations
export interface EmailTemplatePayload {
  name: string;
  description?: string;
  to?: string;
  cc?: string;
  bcc?: string;
  subject?: string;
  attachment?: string;
  bodyText?: string;
  bodyHtml?: string;
  fromName?: string;
  fromEmail?: string;
  replyToName?: string;
  replyToEmail?: string;
  defaults?: Record<string, any>;
}

// Zod validation schema for email template forms
export const emailTemplateSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(255, 'Name must be less than 255 characters'),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  to: z.string()
    .email('Invalid email format')
    .optional()
    .or(z.literal('')),
  cc: z.string()
    .email('Invalid email format')
    .optional()
    .or(z.literal('')),
  bcc: z.string()
    .email('Invalid email format')
    .optional()
    .or(z.literal('')),
  subject: z.string()
    .max(500, 'Subject must be less than 500 characters')
    .optional(),
  attachment: z.string()
    .optional(),
  bodyText: z.string()
    .optional(),
  bodyHtml: z.string()
    .optional(),
  fromName: z.string()
    .max(255, 'From name must be less than 255 characters')
    .optional(),
  fromEmail: z.string()
    .email('Invalid email format')
    .optional()
    .or(z.literal('')),
  replyToName: z.string()
    .max(255, 'Reply-to name must be less than 255 characters')
    .optional(),
  replyToEmail: z.string()
    .email('Invalid email format')
    .optional()
    .or(z.literal('')),
  defaults: z.record(z.any()).optional(),
});

// Type inference from Zod schema
export type EmailTemplateForm = z.infer<typeof emailTemplateSchema>;

// Query options for email templates
export interface EmailTemplateQueryOptions {
  limit?: number;
  offset?: number;
  filter?: string;
  fields?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

// Search/filter state for email templates
export interface EmailTemplateFilters {
  name?: string;
  description?: string;
  dateRange?: {
    start?: string;
    end?: string;
  };
}

// Email template workflow state
export interface EmailTemplateWorkflowState {
  selectedTemplate?: EmailTemplate;
  isCreating: boolean;
  isEditing: boolean;
  filters: EmailTemplateFilters;
  searchQuery: string;
  sortBy: 'name' | 'description' | 'createdDate' | 'lastModifiedDate';
  sortOrder: 'asc' | 'desc';
  currentPage: number;
  pageSize: number;
}

// Email template actions for Zustand store
export interface EmailTemplateActions {
  setSelectedTemplate: (template?: EmailTemplate) => void;
  setCreating: (creating: boolean) => void;
  setEditing: (editing: boolean) => void;
  setFilters: (filters: Partial<EmailTemplateFilters>) => void;
  setSearchQuery: (query: string) => void;
  setSorting: (sortBy: EmailTemplateWorkflowState['sortBy'], order: 'asc' | 'desc') => void;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  resetFilters: () => void;
  resetWorkflow: () => void;
}

// Combined store interface
export interface EmailTemplateStore extends EmailTemplateWorkflowState, EmailTemplateActions {}

// API response types
export interface EmailTemplateListResponse {
  resource: EmailTemplate[];
  meta: {
    count: number;
    total: number;
    limit: number;
    offset: number;
  };
}

// Error types for email template operations
export interface EmailTemplateError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// Constants for email templates
export const EMAIL_TEMPLATE_CONSTANTS = {
  DEFAULT_PAGE_SIZE: 25,
  MAX_PAGE_SIZE: 100,
  MIN_PAGE_SIZE: 10,
  CACHE_TIME: 5 * 60 * 1000, // 5 minutes
  STALE_TIME: 2 * 60 * 1000, // 2 minutes
  DEFAULT_SORT: 'name' as const,
  DEFAULT_ORDER: 'asc' as const,
} as const;

// Query keys for React Query
export const EMAIL_TEMPLATE_QUERY_KEYS = {
  all: ['emailTemplates'] as const,
  lists: () => [...EMAIL_TEMPLATE_QUERY_KEYS.all, 'list'] as const,
  list: (options: EmailTemplateQueryOptions) => 
    [...EMAIL_TEMPLATE_QUERY_KEYS.lists(), options] as const,
  details: () => [...EMAIL_TEMPLATE_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...EMAIL_TEMPLATE_QUERY_KEYS.details(), id] as const,
} as const;