/**
 * Link Service Component
 * 
 * Service and event endpoint selection component for event scripts 
 * in the DreamFactory Admin Interface. Provides cascading selection
 * of services, events, endpoints, and related parameters.
 * 
 * Features:
 * - Cascading service and event selection
 * - Dynamic endpoint filtering
 * - Table/procedure parameter support
 * - Real-time script name generation
 * - WCAG 2.1 AA compliant
 * - TypeScript type safety
 */

import React, { useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Select, SelectOption } from '@/components/ui/select';
import { FormField, FormLabel, FormDescription } from '@/components/ui/form';
import { ScriptEventResponse } from '@/types/scripts';
import { StorageServiceOption } from '@/hooks/use-storage-services';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface LinkServiceProps {
  selectedService?: string;
  selectedEvent?: string;
  selectedRoute?: string;
  selectedTable?: string;
  onServiceChange: (service: string) => void;
  onEventChange: (event: string) => void;
  onRouteChange: (route: string) => void;
  onTableChange?: (table: string) => void;
  onCompleteNameChange?: (name: string) => void;
  scriptEvents: ScriptEventResponse;
  storageServices: StorageServiceOption[];
  className?: string;
  disabled?: boolean;
}

interface ServiceEventInfo {
  type: string;
  endpoints: string[];
  parameter?: {
    [key: string]: string[];
  };
}

interface ProcessedEvent {
  name: string;
  displayName: string;
  info: ServiceEventInfo;
}

interface ProcessedRoute {
  name: string;
  displayName: string;
  requiresTable: boolean;
  tableType?: 'table' | 'procedure' | 'function';
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert service name for display purposes
 */
function formatServiceName(serviceName: string): string {
  const nameMap: Record<string, string> = {
    'api_docs': 'API Documentation',
    'system': 'System',
    'user': 'User Management',
    'admin': 'Admin',
  };
  
  return nameMap[serviceName] || serviceName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Convert event name for display purposes
 */
function formatEventName(eventName: string): string {
  return eventName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Convert route name for display purposes
 */
function formatRouteName(route: string): string {
  // Remove leading slash and format
  const clean = route.replace(/^\/+/, '');
  return clean.replace(/_/g, ' ').replace(/\{|\}/g, '');
}

/**
 * Check if route requires table parameter
 */
function routeRequiresTable(route: string): boolean {
  return route.includes('{table_name}') || route.includes('{tableName}');
}

/**
 * Determine table type from parameters
 */
function getTableType(parameters?: { [key: string]: string[] }): 'table' | 'procedure' | 'function' | undefined {
  if (!parameters) return undefined;
  
  if (parameters.tableName) return 'table';
  if (parameters.procedureName) return 'procedure';
  if (parameters.functionName) return 'function';
  
  return undefined;
}

/**
 * Generate complete script name
 */
function generateCompleteName(route: string, table?: string): string {
  if (!route) return '';
  
  let completeName = route;
  
  // Replace table name placeholder if table is selected
  if (table && routeRequiresTable(route)) {
    completeName = completeName.replace('{table_name}', table);
    completeName = completeName.replace('{tableName}', table);
  }
  
  // Clean up the name
  completeName = completeName.replace(/^\/+/, ''); // Remove leading slashes
  completeName = completeName.replace(/\/+/g, '.'); // Replace slashes with dots
  
  return completeName;
}

// ============================================================================
// LINK SERVICE COMPONENT
// ============================================================================

const LinkService = React.forwardRef<HTMLDivElement, LinkServiceProps>(
  ({
    selectedService,
    selectedEvent,
    selectedRoute,
    selectedTable,
    onServiceChange,
    onEventChange,
    onRouteChange,
    onTableChange,
    onCompleteNameChange,
    scriptEvents,
    storageServices,
    className,
    disabled = false,
    ...props
  }, ref) => {
    // Process services for dropdown
    const serviceOptions = useMemo((): SelectOption[] => {
      return Object.keys(scriptEvents).map(serviceName => ({
        value: serviceName,
        label: formatServiceName(serviceName),
        description: `${Object.keys(scriptEvents[serviceName]).length} events available`
      }));
    }, [scriptEvents]);
    
    // Process events for selected service
    const eventOptions = useMemo((): SelectOption[] => {
      if (!selectedService || !scriptEvents[selectedService]) return [];
      
      return Object.entries(scriptEvents[selectedService]).map(([eventName, eventInfo]) => ({
        value: eventName,
        label: formatEventName(eventName),
        description: `${eventInfo.endpoints.length} endpoints`
      }));
    }, [selectedService, scriptEvents]);
    
    // Process routes for selected event
    const routeOptions = useMemo((): SelectOption[] => {
      if (!selectedService || !selectedEvent || !scriptEvents[selectedService]?.[selectedEvent]) {
        return [];
      }
      
      const eventInfo = scriptEvents[selectedService][selectedEvent];
      
      return eventInfo.endpoints.map(endpoint => ({
        value: endpoint,
        label: formatRouteName(endpoint),
        description: routeRequiresTable(endpoint) ? 'Requires table selection' : undefined
      }));
    }, [selectedService, selectedEvent, scriptEvents]);
    
    // Process table options for selected event
    const tableOptions = useMemo((): SelectOption[] => {
      if (!selectedService || !selectedEvent || !scriptEvents[selectedService]?.[selectedEvent]) {
        return [];
      }
      
      const eventInfo = scriptEvents[selectedService][selectedEvent];
      const parameters = eventInfo.parameter;
      
      if (!parameters) return [];
      
      // Get table names from various parameter types
      const tables: string[] = [];
      if (parameters.tableName) tables.push(...parameters.tableName);
      if (parameters.procedureName) tables.push(...parameters.procedureName);
      if (parameters.functionName) tables.push(...parameters.functionName);
      
      return tables.map(table => ({
        value: table,
        label: table,
        description: getTableType(parameters) || 'table'
      }));
    }, [selectedService, selectedEvent, scriptEvents]);
    
    // Check if table selection is required
    const requiresTableSelection = useMemo(() => {
      return selectedRoute && routeRequiresTable(selectedRoute) && tableOptions.length > 0;
    }, [selectedRoute, tableOptions]);
    
    // Generate complete script name when route or table changes
    const completeName = useMemo(() => {
      return generateCompleteName(selectedRoute || '', selectedTable);
    }, [selectedRoute, selectedTable]);
    
    // Notify parent of complete name changes
    React.useEffect(() => {
      if (onCompleteNameChange) {
        onCompleteNameChange(completeName);
      }
    }, [completeName, onCompleteNameChange]);
    
    // Handle service selection
    const handleServiceChange = useCallback((value: string | number | (string | number)[]) => {
      const service = Array.isArray(value) ? value[0]?.toString() : value.toString();
      onServiceChange(service);
      
      // Reset dependent selections
      onEventChange('');
      onRouteChange('');
      if (onTableChange) onTableChange('');
    }, [onServiceChange, onEventChange, onRouteChange, onTableChange]);
    
    // Handle event selection
    const handleEventChange = useCallback((value: string | number | (string | number)[]) => {
      const event = Array.isArray(value) ? value[0]?.toString() : value.toString();
      onEventChange(event);
      
      // Reset dependent selections
      onRouteChange('');
      if (onTableChange) onTableChange('');
    }, [onEventChange, onRouteChange, onTableChange]);
    
    // Handle route selection
    const handleRouteChange = useCallback((value: string | number | (string | number)[]) => {
      const route = Array.isArray(value) ? value[0]?.toString() : value.toString();
      onRouteChange(route);
      
      // Reset table selection if route doesn't require it
      if (!routeRequiresTable(route) && onTableChange) {
        onTableChange('');
      }
    }, [onRouteChange, onTableChange]);
    
    // Handle table selection
    const handleTableChange = useCallback((value: string | number | (string | number)[]) => {
      if (!onTableChange) return;
      const table = Array.isArray(value) ? value[0]?.toString() : value.toString();
      onTableChange(table);
    }, [onTableChange]);
    
    return (
      <div 
        ref={ref}
        className={cn('space-y-6', className)}
        {...props}
      >
        {/* Service Selection */}
        <FormField>
          <FormLabel required>
            Service
          </FormLabel>
          <FormDescription>
            Select the service that will trigger this script
          </FormDescription>
          <Select
            value={selectedService || ''}
            onChange={handleServiceChange}
            options={serviceOptions}
            placeholder="Select a service..."
            disabled={disabled}
            searchable
          />
        </FormField>
        
        {/* Event Selection */}
        {selectedService && (
          <FormField>
            <FormLabel required>
              Event
            </FormLabel>
            <FormDescription>
              Choose the specific event that will trigger the script
            </FormDescription>
            <Select
              value={selectedEvent || ''}
              onChange={handleEventChange}
              options={eventOptions}
              placeholder="Select an event..."
              disabled={disabled || !selectedService}
              searchable
            />
          </FormField>
        )}
        
        {/* Route/Endpoint Selection */}
        {selectedService && selectedEvent && (
          <FormField>
            <FormLabel required>
              Endpoint
            </FormLabel>
            <FormDescription>
              Select the API endpoint for this event script
            </FormDescription>
            <Select
              value={selectedRoute || ''}
              onChange={handleRouteChange}
              options={routeOptions}
              placeholder="Select an endpoint..."
              disabled={disabled || !selectedEvent}
              searchable
            />
          </FormField>
        )}
        
        {/* Table Selection (conditional) */}
        {requiresTableSelection && (
          <FormField>
            <FormLabel required>
              {getTableType(scriptEvents[selectedService!]?.[selectedEvent!]?.parameter) || 'Table'}
            </FormLabel>
            <FormDescription>
              Select the table/procedure/function for this endpoint
            </FormDescription>
            <Select
              value={selectedTable || ''}
              onChange={handleTableChange}
              options={tableOptions}
              placeholder={`Select a ${getTableType(scriptEvents[selectedService!]?.[selectedEvent!]?.parameter) || 'table'}...`}
              disabled={disabled || !selectedRoute}
              searchable
            />
          </FormField>
        )}
        
        {/* Generated Script Name Preview */}
        {completeName && (
          <FormField>
            <FormLabel>
              Generated Script Name
            </FormLabel>
            <FormDescription>
              This will be the final name of your event script
            </FormDescription>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
              <code className="text-sm font-mono text-gray-900 dark:text-gray-100">
                {completeName}
              </code>
            </div>
          </FormField>
        )}
        
        {/* Selection Summary */}
        {selectedService && selectedEvent && selectedRoute && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              Script Configuration Summary
            </h4>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-blue-700 dark:text-blue-300">Service:</dt>
                <dd className="text-blue-900 dark:text-blue-100 font-medium">
                  {formatServiceName(selectedService)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-blue-700 dark:text-blue-300">Event:</dt>
                <dd className="text-blue-900 dark:text-blue-100 font-medium">
                  {formatEventName(selectedEvent)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-blue-700 dark:text-blue-300">Endpoint:</dt>
                <dd className="text-blue-900 dark:text-blue-100 font-medium font-mono text-xs">
                  {selectedRoute}
                </dd>
              </div>
              {selectedTable && (
                <div className="flex justify-between">
                  <dt className="text-blue-700 dark:text-blue-300">
                    {getTableType(scriptEvents[selectedService]?.[selectedEvent]?.parameter) || 'Table'}:
                  </dt>
                  <dd className="text-blue-900 dark:text-blue-100 font-medium">
                    {selectedTable}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </div>
    );
  }
);

LinkService.displayName = 'LinkService';

export { LinkService };
export type { LinkServiceProps };