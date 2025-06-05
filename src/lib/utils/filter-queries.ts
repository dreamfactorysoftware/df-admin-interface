/**
 * Filter query construction utility for DreamFactory resource filtering operations.
 * 
 * This module provides type-safe SQL-like WHERE clause generation for different
 * resource types in the DreamFactory system. It maintains exact compatibility
 * with the backend API filtering parameters while being optimized for React
 * component usage with SWR/React Query data fetching operations.
 * 
 * @example
 * ```typescript
 * import { getFilterQuery, FilterQueryType } from '@/lib/utils/filter-queries';
 * 
 * // Create a filter function for user resources
 * const filterUsers = getFilterQuery('user');
 * const userFilter = filterUsers('john'); // Returns SQL-like filter string
 * 
 * // Use with SWR in a React component
 * const { data } = useSWR(
 *   `/api/v2/system/user?filter=${encodeURIComponent(filterUsers(searchValue))}`,
 *   fetcher
 * );
 * ```
 */

/**
 * Union type defining all supported resource types for filtering operations.
 * Each type corresponds to a specific DreamFactory resource with its own
 * searchable field configuration.
 */
export type FilterQueryType =
  | 'user'
  | 'apiDocs'
  | 'apps'
  | 'emailTemplates'
  | 'serviceReports'
  | 'roles'
  | 'limits'
  | 'services'
  | 'eventScripts';

/**
 * Higher-order function that creates SQL-like WHERE clause fragments for
 * filtering DreamFactory resources based on type and search value.
 * 
 * This function maintains exact compatibility with DreamFactory's backend
 * filtering API while providing a type-safe interface for React components.
 * 
 * @param type - The resource type to filter (determines which fields are searched)
 * @returns A function that takes a search value and returns a SQL WHERE clause fragment
 * 
 * @example
 * ```typescript
 * // Filter users by name or email
 * const userFilter = getFilterQuery('user');
 * const clause = userFilter('admin');
 * // Returns: "(first_name like "%admin%") or (last_name like "%admin%") or (name like "%admin%") or (email like "%admin%")"
 * 
 * // Filter services by name, label, description, or type
 * const serviceFilter = getFilterQuery('services');
 * const serviceClause = serviceFilter('database');
 * // Returns: "(name like "%database%") or (label like "%database%") or (description like "%database%") or (type like "%database%")"
 * ```
 */
export const getFilterQuery = (type?: FilterQueryType) => (value: string): string => {
  switch (type) {
    case 'user':
      /**
       * User resource filtering: searches across name fields and email
       * Fields: first_name, last_name, name, email
       */
      return `(first_name like "%${value}%") or (last_name like "%${value}%") or (name like "%${value}%") or (email like "%${value}%")`;
    
    case 'apiDocs':
      /**
       * API Documentation filtering: searches name, label, and description
       * Fields: name, label, description
       */
      return `(name like "%${value}%") or (label like "%${value}%") or (description like "%${value}%")`;
    
    case 'apps':
      /**
       * Application filtering: searches name and description
       * Fields: name, description
       */
      return `(name like "%${value}%") or (description like "%${value}%")`;
    
    case 'emailTemplates':
      /**
       * Email template filtering: searches name and description
       * Fields: name, description
       */
      return `(name like "%${value}%") or (description like "%${value}%")`;
    
    case 'serviceReports':
      /**
       * Service report filtering: searches service info, user, and action details
       * Fields: service_id, service_name, user_email, action, request_verb
       * Note: service_id uses exact match (no wildcards)
       */
      return `(service_id like ${value}) or (service_name like "%${value}%") or (user_email like "%${value}%") or (action like "%${value}%") or (request_verb like "%${value}%")`;
    
    case 'roles':
      /**
       * Role filtering: searches name and description
       * Fields: name, description
       */
      return `(name like "%${value}%") or (description like "%${value}%")`;
    
    case 'limits':
      /**
       * Limit filtering: searches by name only
       * Fields: name
       */
      return `(name like "%${value}%")`;
    
    case 'services':
      /**
       * Service filtering: searches across all descriptive fields
       * Fields: name, label, description, type
       */
      return `(name like "%${value}%") or (label like "%${value}%") or (description like "%${value}%") or (type like "%${value}%")`;
    
    case 'eventScripts':
      /**
       * Event script filtering: searches name and type
       * Fields: name, type
       */
      return `(name like "%${value}%") or (type like "%${value}%")`;
    
    default:
      /**
       * Default case: returns empty string for unknown types
       * This maintains backward compatibility and prevents errors
       */
      return '';
  }
};

/**
 * Type guard to check if a string is a valid FilterQueryType.
 * Useful for runtime validation of filter types.
 * 
 * @param type - String to check
 * @returns True if the string is a valid FilterQueryType
 * 
 * @example
 * ```typescript
 * if (isValidFilterQueryType(userInput)) {
 *   const filter = getFilterQuery(userInput);
 *   // Safe to use userInput as FilterQueryType
 * }
 * ```
 */
export const isValidFilterQueryType = (type: string): type is FilterQueryType => {
  const validTypes: FilterQueryType[] = [
    'user',
    'apiDocs',
    'apps',
    'emailTemplates',
    'serviceReports',
    'roles',
    'limits',
    'services',
    'eventScripts'
  ];
  return validTypes.includes(type as FilterQueryType);
};

/**
 * Utility function to safely create filter queries with input validation.
 * Provides additional safety for React components that might receive
 * invalid filter types from user input or URL parameters.
 * 
 * @param type - Potentially invalid filter type
 * @param value - Search value
 * @returns Filter query string or empty string if type is invalid
 * 
 * @example
 * ```typescript
 * // Safe filtering with potential invalid input
 * const safeFilter = createSafeFilterQuery(urlParam, searchValue);
 * if (safeFilter) {
 *   // Use the filter query
 *   const url = `/api/v2/system/user?filter=${encodeURIComponent(safeFilter)}`;
 * }
 * ```
 */
export const createSafeFilterQuery = (
  type: string | undefined,
  value: string
): string => {
  if (!type || !value || !isValidFilterQueryType(type)) {
    return '';
  }
  
  return getFilterQuery(type)(value);
};