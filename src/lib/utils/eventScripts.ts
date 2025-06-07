/**
 * @fileoverview Event script processing utilities for DreamFactory script event management
 * @description Provides utilities for normalizing and organizing script event endpoint definitions
 * 
 * This module contains essential utilities for processing DreamFactory script events,
 * including functions for flattening parameterized endpoints and generating wildcard
 * patterns for API workflow configurations. Designed for compatibility with React
 * Query/SWR data transformation patterns and React component state management.
 * 
 * Key Functions:
 * - groupEvents: Flatten parameterized endpoints into organized groups
 * - addGroupEntries: Generate wildcard patterns for API workflow configurations
 * 
 * @version 1.0.0
 * @license MIT
 * @author DreamFactory Team
 * @since React 19.0.0 / Next.js 15.1+
 * 
 * @example
 * ```typescript
 * import { groupEvents, addGroupEntries } from '@/lib/utils/eventScripts'
 * 
 * // Group events by service for React component display
 * const groupedEvents = groupEvents(scriptEvents, { groupBy: 'service' })
 * 
 * // Add wildcard entries for API generation
 * const withWildcards = addGroupEntries(groupedEvents, 'table/*')
 * ```
 */

import type { 
  ScriptEvent, 
  GroupedScriptEvent, 
  ScriptEventResponse,
  EventGroupConfig,
  EventProcessingResult,
  WildcardPattern
} from '../../types/scripts';
import { mapCamelToSnake } from './case';

// =============================================================================
// CONSTANTS AND DEFAULTS
// =============================================================================

/**
 * Default configuration for event grouping operations
 * Optimized for React component rendering and user experience
 */
const DEFAULT_GROUP_CONFIG: EventGroupConfig = {
  groupBy: 'service',
  includeWildcards: true,
  sortBy: 'name'
};

/**
 * Common wildcard patterns for DreamFactory API endpoints
 * Used for generating comprehensive API workflow configurations
 */
const COMMON_WILDCARD_PATTERNS: Record<string, string[]> = {
  database: [
    'table/*',
    'table/{tableName}',
    'table/{tableName}/field/*',
    'table/{tableName}/field/{fieldName}',
    '_schema',
    '_schema/{tableName}'
  ],
  file: [
    'folder/*',
    'folder/{folderPath}',
    'file/*',
    'file/{filePath}'
  ],
  user: [
    'session',
    'profile',
    'password',
    'register'
  ],
  system: [
    'admin',
    'config',
    'cache',
    'environment'
  ]
};

// =============================================================================
// CORE UTILITY FUNCTIONS
// =============================================================================

/**
 * Groups script events by specified criteria for organized display in React components
 * 
 * This function processes an array of script events and organizes them into logical
 * groups based on service, resource, type, or context. Designed to work seamlessly
 * with React Query/SWR caching mechanisms and provides optimized data structures
 * for React component rendering.
 * 
 * The function maintains backward compatibility with existing DreamFactory Core
 * script event definitions while providing enhanced TypeScript support and
 * React-specific optimizations.
 * 
 * @param events - Array of script events to group
 * @param config - Grouping configuration options
 * @returns Processed result with grouped events and metadata
 * 
 * @example
 * ```typescript
 * // Group events by service for service-based navigation
 * const serviceGroups = groupEvents(events, { 
 *   groupBy: 'service',
 *   sortBy: 'name'
 * });
 * 
 * // Group by event type for debugging purposes
 * const typeGroups = groupEvents(events, {
 *   groupBy: 'type',
 *   includeWildcards: false
 * });
 * 
 * // Custom grouping for complex UI requirements
 * const customGroups = groupEvents(events, {
 *   groupBy: 'service',
 *   customGrouper: (event) => `${event.service}-${event.context || 'default'}`
 * });
 * ```
 * 
 * @throws {Error} When events array is invalid or config contains invalid options
 * 
 * @performance Optimized for React component re-rendering with memoization-friendly output
 * @compatibility Works with React Query, SWR, and Zustand state management patterns
 */
export function groupEvents(
  events: ScriptEvent[], 
  config: Partial<EventGroupConfig> = {}
): EventProcessingResult {
  // Validate input parameters
  if (!Array.isArray(events)) {
    throw new Error('Events must be an array');
  }

  const finalConfig: EventGroupConfig = {
    ...DEFAULT_GROUP_CONFIG,
    ...config
  };

  const warnings: string[] = [];
  const groupMap = new Map<string, ScriptEvent[]>();

  // Process each event and assign to appropriate group
  for (const event of events) {
    try {
      const groupKey = getGroupKey(event, finalConfig);
      
      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, []);
      }
      
      groupMap.get(groupKey)!.push(event);
    } catch (error) {
      warnings.push(`Failed to process event: ${event.name || 'unknown'} - ${error}`);
      continue;
    }
  }

  // Convert map to grouped events array
  const groups: GroupedScriptEvent[] = Array.from(groupMap.entries()).map(([groupKey, groupEvents]) => {
    const firstEvent = groupEvents[0];
    const label = generateGroupLabel(groupKey, firstEvent, finalConfig);
    
    // Sort events within group
    const sortedEvents = sortEvents(groupEvents, finalConfig.sortBy);
    
    return {
      groupKey,
      label,
      events: sortedEvents,
      service: firstEvent.service,
      resource: firstEvent.resource,
      supportsWildcard: shouldSupportWildcard(firstEvent.service, firstEvent.resource)
    };
  });

  // Sort groups by label
  groups.sort((a, b) => a.label.localeCompare(b.label));

  return {
    groups,
    totalEvents: events.length,
    totalGroups: groups.length,
    meta: {
      processedAt: new Date().toISOString(),
      config: finalConfig,
      warnings: warnings.length > 0 ? warnings : undefined
    }
  };
}

/**
 * Adds wildcard entries to grouped events for comprehensive API workflow configuration
 * 
 * This function enhances grouped script events by generating wildcard patterns that
 * enable flexible API endpoint configuration. It's particularly useful for creating
 * comprehensive API generation workflows where users need to configure events for
 * dynamic endpoints with parameters.
 * 
 * The function maintains compatibility with existing DreamFactory API patterns
 * while providing React-optimized data structures for form components and
 * configuration interfaces.
 * 
 * @param groups - Array of grouped script events to enhance
 * @param customPattern - Optional custom wildcard pattern to add
 * @returns Enhanced groups with wildcard entries added
 * 
 * @example
 * ```typescript
 * // Add standard wildcard patterns for database service
 * const withWildcards = addGroupEntries(databaseGroups);
 * 
 * // Add custom wildcard pattern
 * const withCustom = addGroupEntries(groups, 'api/custom/{id}/action');
 * 
 * // Use in React component for form options
 * const eventOptions = withWildcards.flatMap(group => 
 *   group.events.map(event => ({
 *     label: `${group.label} - ${event.type}`,
 *     value: event.name
 *   }))
 * );
 * ```
 * 
 * @throws {Error} When groups array is invalid or pattern format is incorrect
 * 
 * @performance Designed for React Hook Form and form state management efficiency
 * @compatibility Optimized for React Query cache invalidation and SWR revalidation
 */
export function addGroupEntries(
  groups: GroupedScriptEvent[],
  customPattern?: string
): GroupedScriptEvent[] {
  // Validate input parameters
  if (!Array.isArray(groups)) {
    throw new Error('Groups must be an array');
  }

  return groups.map(group => {
    // Skip if group doesn't support wildcards
    if (!group.supportsWildcard) {
      return group;
    }

    const wildcardEvents: ScriptEvent[] = [];
    const patterns = getWildcardPatterns(group.service, customPattern);

    // Generate wildcard events for each pattern
    for (const pattern of patterns) {
      try {
        const wildcardEvent = createWildcardEvent(group, pattern);
        if (wildcardEvent) {
          wildcardEvents.push(wildcardEvent);
        }
      } catch (error) {
        // Log error but continue processing other patterns
        console.warn(`Failed to create wildcard event for pattern ${pattern}:`, error);
      }
    }

    // Return enhanced group with original events plus wildcards
    return {
      ...group,
      events: [
        ...group.events,
        ...wildcardEvents
      ]
    };
  });
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generates appropriate group key based on grouping configuration
 * 
 * @internal
 * @param event - Script event to generate key for
 * @param config - Grouping configuration
 * @returns Group key string
 */
function getGroupKey(event: ScriptEvent, config: EventGroupConfig): string {
  if (config.customGrouper) {
    return config.customGrouper(event);
  }

  switch (config.groupBy) {
    case 'service':
      return event.service;
    case 'resource':
      return event.resource || 'no-resource';
    case 'type':
      return event.type;
    case 'context':
      return event.context || 'api';
    default:
      return event.service;
  }
}

/**
 * Generates human-readable label for event group
 * 
 * @internal
 * @param groupKey - Generated group key
 * @param event - Representative event from group
 * @param config - Grouping configuration
 * @returns Display label for group
 */
function generateGroupLabel(
  groupKey: string, 
  event: ScriptEvent, 
  config: EventGroupConfig
): string {
  switch (config.groupBy) {
    case 'service':
      return event.service.charAt(0).toUpperCase() + event.service.slice(1);
    case 'resource':
      return event.resource || 'Global Resources';
    case 'type':
      return event.type.replace(/\./g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
    case 'context':
      return (event.context || 'API').toUpperCase() + ' Events';
    default:
      return groupKey;
  }
}

/**
 * Sorts events within a group based on specified criteria
 * 
 * @internal
 * @param events - Events to sort
 * @param sortBy - Sorting criteria
 * @returns Sorted events array
 */
function sortEvents(events: ScriptEvent[], sortBy?: string): ScriptEvent[] {
  const sortedEvents = [...events];

  switch (sortBy) {
    case 'name':
      return sortedEvents.sort((a, b) => a.name.localeCompare(b.name));
    case 'service':
      return sortedEvents.sort((a, b) => a.service.localeCompare(b.service));
    case 'type':
      return sortedEvents.sort((a, b) => a.type.localeCompare(b.type));
    default:
      return sortedEvents.sort((a, b) => a.name.localeCompare(b.name));
  }
}

/**
 * Determines if a service/resource combination should support wildcard patterns
 * 
 * @internal
 * @param service - Service name
 * @param resource - Resource path
 * @returns Whether wildcards are supported
 */
function shouldSupportWildcard(service: string, resource?: string): boolean {
  // Database services always support wildcards for table operations
  if (service.includes('database') || service.includes('sql')) {
    return true;
  }

  // File services support wildcards for file/folder operations
  if (service.includes('file') || service.includes('storage')) {
    return true;
  }

  // User services support some wildcard patterns
  if (service.includes('user') || service.includes('auth')) {
    return true;
  }

  // Check for common patterns in resource path
  if (resource && (resource.includes('{') || resource.includes('*'))) {
    return true;
  }

  return false;
}

/**
 * Gets appropriate wildcard patterns for a service
 * 
 * @internal
 * @param service - Service name
 * @param customPattern - Optional custom pattern to include
 * @returns Array of wildcard patterns
 */
function getWildcardPatterns(service: string, customPattern?: string): string[] {
  const patterns: string[] = [];

  // Add service-specific patterns
  for (const [serviceType, servicePatterns] of Object.entries(COMMON_WILDCARD_PATTERNS)) {
    if (service.toLowerCase().includes(serviceType)) {
      patterns.push(...servicePatterns);
    }
  }

  // Add custom pattern if provided
  if (customPattern && !patterns.includes(customPattern)) {
    patterns.push(customPattern);
  }

  // If no specific patterns found, add generic ones
  if (patterns.length === 0) {
    patterns.push('*', '{id}', '{name}');
  }

  return patterns;
}

/**
 * Creates a wildcard event based on group and pattern
 * 
 * @internal
 * @param group - Source group for wildcard generation
 * @param pattern - Wildcard pattern to apply
 * @returns Generated wildcard event or null if invalid
 */
function createWildcardEvent(group: GroupedScriptEvent, pattern: string): ScriptEvent | null {
  // Use the first event as template
  const templateEvent = group.events[0];
  if (!templateEvent) {
    return null;
  }

  // Generate unique name for wildcard event
  const wildcardName = `${templateEvent.name}_wildcard_${pattern.replace(/[^a-zA-Z0-9]/g, '_')}`;

  // Create wildcard event with pattern in resource
  const wildcardEvent: ScriptEvent = {
    ...templateEvent,
    name: wildcardName,
    resource: pattern,
    content: templateEvent.content ? 
      `// Wildcard pattern: ${pattern}\n${templateEvent.content}` :
      `// Auto-generated wildcard event for pattern: ${pattern}\n// TODO: Implement logic for ${pattern}`,
    config: {
      ...templateEvent.config,
      isWildcard: true,
      pattern: pattern
    }
  };

  return wildcardEvent;
}

// =============================================================================
// DATA TRANSFORMATION UTILITIES
// =============================================================================

/**
 * Transforms script event response from DreamFactory API for React component consumption
 * 
 * This utility function processes raw API responses from DreamFactory backend
 * and transforms them into React-friendly data structures. It handles data
 * normalization, camelCase conversion, and provides optimized structures for
 * React Query caching and component rendering.
 * 
 * @param response - Raw API response from DreamFactory
 * @returns Transformed and normalized script events
 * 
 * @example
 * ```typescript
 * // Transform API response for React Query
 * const transformedEvents = transformScriptEventResponse(apiResponse);
 * 
 * // Use in React Query hook
 * const { data: events } = useQuery({
 *   queryKey: ['scripts', serviceId],
 *   queryFn: async () => {
 *     const response = await api.getScriptEvents(serviceId);
 *     return transformScriptEventResponse(response);
 *   }
 * });
 * ```
 * 
 * @compatibility Designed for React Query, SWR, and Zustand integration
 * @performance Optimized for React component re-rendering patterns
 */
export function transformScriptEventResponse(response: ScriptEventResponse): ScriptEvent[] {
  if (!response || !response.resource) {
    return [];
  }

  // Transform each event to ensure consistent structure
  return response.resource.map(event => {
    // Convert snake_case to camelCase for React compatibility
    const transformedEvent = mapCamelToSnake(event);
    
    // Ensure required fields have defaults
    return {
      type: transformedEvent.type || 'api.get.pre_process',
      service: transformedEvent.service || 'unknown',
      name: transformedEvent.name || 'unnamed_script',
      language: transformedEvent.language || 'javascript',
      is_active: transformedEvent.is_active ?? true,
      ...transformedEvent
    } as ScriptEvent;
  });
}

/**
 * Prepares script event data for API submission
 * 
 * Transforms React component state data into the format expected by
 * DreamFactory backend APIs. Handles camelCase to snake_case conversion
 * and ensures all required fields are properly formatted.
 * 
 * @param events - Script events from React component state
 * @returns API-ready event data
 * 
 * @example
 * ```typescript
 * // Prepare form data for submission
 * const apiData = prepareScriptEventForSubmission(formEvents);
 * 
 * // Submit via React Query mutation
 * const mutation = useMutation({
 *   mutationFn: async (data) => {
 *     const prepared = prepareScriptEventForSubmission(data);
 *     return api.updateScriptEvents(prepared);
 *   }
 * });
 * ```
 * 
 * @compatibility Works with React Hook Form and form validation libraries
 * @performance Optimized for React state management patterns
 */
export function prepareScriptEventForSubmission(events: ScriptEvent[]): any[] {
  return events.map(event => {
    // Convert camelCase to snake_case for API compatibility
    const apiEvent = mapCamelToSnake(event);
    
    // Remove client-side only fields
    delete apiEvent.isWildcard;
    delete apiEvent.pattern;
    
    return apiEvent;
  });
}