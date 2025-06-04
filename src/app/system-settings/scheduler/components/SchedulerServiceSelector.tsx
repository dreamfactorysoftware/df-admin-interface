'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Combobox, Transition } from '@headlessui/react';
import { ChevronUpDownIcon, CheckIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { useController, Control } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

// Types (would normally come from src/types/service.ts and src/types/scheduler.ts)
interface Service {
  id: string;
  name: string;
  description?: string;
  type: string;
  is_active: boolean;
}

interface ServiceComponent {
  name: string;
  description?: string;
  access_level: 'Read' | 'Write' | 'Admin';
  verbs: string[];
}

interface SchedulerServiceSelectorProps {
  name: string;
  control: Control<any>;
  serviceFieldName?: string;
  componentFieldName?: string;
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

// Mock hooks (would normally come from src/hooks/useServices.ts and src/hooks/useServiceComponents.ts)
const useServices = () => {
  return useQuery({
    queryKey: ['services'],
    queryFn: async (): Promise<Service[]> => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return [
        { id: '1', name: 'mysql-db', description: 'MySQL Database Service', type: 'mysql', is_active: true },
        { id: '2', name: 'postgres-main', description: 'PostgreSQL Production Database', type: 'postgresql', is_active: true },
        { id: '3', name: 'mongo-analytics', description: 'MongoDB Analytics Database', type: 'mongodb', is_active: true },
        { id: '4', name: 'oracle-legacy', description: 'Oracle Legacy System', type: 'oracle', is_active: false },
        { id: '5', name: 'snowflake-dw', description: 'Snowflake Data Warehouse', type: 'snowflake', is_active: true },
      ];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

const useServiceComponents = (serviceId?: string) => {
  return useQuery({
    queryKey: ['service-components', serviceId],
    queryFn: async (): Promise<ServiceComponent[]> => {
      if (!serviceId) return [];
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock component data based on service type
      const mockComponents: Record<string, ServiceComponent[]> = {
        '1': [ // MySQL
          { name: '_table', description: 'Table operations', access_level: 'Write', verbs: ['GET', 'POST', 'PUT', 'DELETE'] },
          { name: '_schema', description: 'Schema introspection', access_level: 'Read', verbs: ['GET'] },
          { name: '_procedure', description: 'Stored procedures', access_level: 'Admin', verbs: ['POST'] },
        ],
        '2': [ // PostgreSQL
          { name: '_table', description: 'Table operations', access_level: 'Write', verbs: ['GET', 'POST', 'PUT', 'DELETE'] },
          { name: '_schema', description: 'Schema introspection', access_level: 'Read', verbs: ['GET'] },
          { name: '_function', description: 'PostgreSQL functions', access_level: 'Admin', verbs: ['POST'] },
        ],
        '3': [ // MongoDB
          { name: '_table', description: 'Collection operations', access_level: 'Write', verbs: ['GET', 'POST', 'PUT', 'DELETE'] },
          { name: '_schema', description: 'Collection schema', access_level: 'Read', verbs: ['GET'] },
        ],
        '4': [ // Oracle
          { name: '_table', description: 'Table operations', access_level: 'Write', verbs: ['GET', 'POST', 'PUT', 'DELETE'] },
          { name: '_schema', description: 'Schema introspection', access_level: 'Read', verbs: ['GET'] },
          { name: '_procedure', description: 'Oracle procedures', access_level: 'Admin', verbs: ['POST'] },
          { name: '_function', description: 'Oracle functions', access_level: 'Admin', verbs: ['POST'] },
        ],
        '5': [ // Snowflake
          { name: '_table', description: 'Table operations', access_level: 'Write', verbs: ['GET', 'POST', 'PUT', 'DELETE'] },
          { name: '_schema', description: 'Schema introspection', access_level: 'Read', verbs: ['GET'] },
        ],
      };
      
      return mockComponents[serviceId] || [];
    },
    enabled: !!serviceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Badge component for access levels (would normally come from src/components/ui/badge.tsx)
const Badge: React.FC<{ 
  variant: 'Read' | 'Write' | 'Admin';
  children: React.ReactNode;
  className?: string;
}> = ({ variant, children, className }) => {
  const variantStyles = {
    Read: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    Write: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    Admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };

  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
      variantStyles[variant],
      className
    )}>
      {children}
    </span>
  );
};

// Spinner component for loading states (would normally come from src/components/ui/spinner.tsx)
const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ 
  size = 'md', 
  className 
}) => {
  const sizeStyles = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-gray-300 border-t-blue-600',
        sizeStyles[size],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

// Tooltip component (would normally come from src/components/ui/tooltip.tsx)
const Tooltip: React.FC<{
  content: string;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
}> = ({ content, children, side = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
      >
        {children}
      </div>
      {isVisible && (
        <div
          className={cn(
            'absolute z-50 px-2 py-1 text-sm text-white bg-gray-900 rounded shadow-lg',
            'max-w-xs break-words',
            side === 'top' && 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
            side === 'bottom' && 'top-full left-1/2 transform -translate-x-1/2 mt-2',
            side === 'left' && 'right-full top-1/2 transform -translate-y-1/2 mr-2',
            side === 'right' && 'left-full top-1/2 transform -translate-y-1/2 ml-2'
          )}
          role="tooltip"
        >
          {content}
          <div
            className={cn(
              'absolute w-2 h-2 bg-gray-900 transform rotate-45',
              side === 'top' && 'top-full left-1/2 -translate-x-1/2 -mt-1',
              side === 'bottom' && 'bottom-full left-1/2 -translate-x-1/2 -mb-1',
              side === 'left' && 'left-full top-1/2 -translate-y-1/2 -ml-1',
              side === 'right' && 'right-full top-1/2 -translate-y-1/2 -mr-1'
            )}
          />
        </div>
      )}
    </div>
  );
};

export const SchedulerServiceSelector: React.FC<SchedulerServiceSelectorProps> = ({
  name,
  control,
  serviceFieldName = 'service',
  componentFieldName = 'component',
  label = 'Service & Component',
  placeholder = 'Select a service...',
  error,
  disabled = false,
  required = false,
  className,
}) => {
  const [serviceQuery, setServiceQuery] = useState('');
  const [componentQuery, setComponentQuery] = useState('');

  // Hook form controllers
  const {
    field: serviceField,
    fieldState: serviceFieldState,
  } = useController({
    name: serviceFieldName,
    control,
    rules: { required: required ? 'Service is required' : false },
  });

  const {
    field: componentField,
    fieldState: componentFieldState,
  } = useController({
    name: componentFieldName,
    control,
    rules: { required: required ? 'Component is required' : false },
  });

  // Data queries
  const { 
    data: services = [], 
    isLoading: servicesLoading, 
    error: servicesError 
  } = useServices();

  const { 
    data: components = [], 
    isLoading: componentsLoading, 
    error: componentsError 
  } = useServiceComponents(serviceField.value);

  // Reset component selection when service changes
  useEffect(() => {
    if (serviceField.value !== serviceField.value) {
      componentField.onChange('');
    }
  }, [serviceField.value]);

  // Filter services based on search query
  const filteredServices = useMemo(() => {
    if (!serviceQuery) return services.filter(service => service.is_active);
    
    const query = serviceQuery.toLowerCase();
    return services
      .filter(service => service.is_active)
      .filter(service => 
        service.name.toLowerCase().includes(query) ||
        service.description?.toLowerCase().includes(query) ||
        service.type.toLowerCase().includes(query)
      );
  }, [services, serviceQuery]);

  // Filter components based on search query
  const filteredComponents = useMemo(() => {
    if (!componentQuery) return components;
    
    const query = componentQuery.toLowerCase();
    return components.filter(component =>
      component.name.toLowerCase().includes(query) ||
      component.description?.toLowerCase().includes(query)
    );
  }, [components, componentQuery]);

  // Find selected service and component
  const selectedService = services.find(service => service.id === serviceField.value);
  const selectedComponent = components.find(component => component.name === componentField.value);

  const hasServiceError = !!(serviceFieldState.error || error);
  const hasComponentError = !!(componentFieldState.error);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Service Selection */}
      <div className="space-y-2">
        <label 
          htmlFor={`${name}-service`}
          className="block text-sm font-medium text-gray-900 dark:text-gray-100"
        >
          Service {required && <span className="text-red-500">*</span>}
        </label>
        
        <Combobox 
          value={serviceField.value || ''} 
          onChange={serviceField.onChange}
          disabled={disabled}
        >
          <div className="relative">
            <div
              className={cn(
                'relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm',
                'border border-gray-300 dark:border-gray-600 dark:bg-gray-800',
                hasServiceError && 'border-red-500 dark:border-red-400',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <Combobox.Input
                id={`${name}-service`}
                className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 dark:text-gray-100 focus:ring-0 bg-transparent"
                displayValue={() => selectedService?.name || ''}
                onChange={(event) => setServiceQuery(event.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                aria-describedby={hasServiceError ? `${name}-service-error` : undefined}
                aria-invalid={hasServiceError}
              />
              <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                {servicesLoading ? (
                  <Spinner size="sm" />
                ) : (
                  <ChevronUpDownIcon
                    className="h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                )}
              </Combobox.Button>
            </div>
            
            <Transition
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Combobox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm dark:bg-gray-800 dark:ring-gray-600">
                {servicesLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Spinner size="sm" className="mr-2" />
                    <span className="text-gray-500 dark:text-gray-400">Loading services...</span>
                  </div>
                ) : servicesError ? (
                  <div className="flex items-center px-4 py-4 text-red-600 dark:text-red-400">
                    <InformationCircleIcon className="h-5 w-5 mr-2" />
                    <span>Error loading services</span>
                  </div>
                ) : filteredServices.length === 0 ? (
                  <div className="relative cursor-default select-none py-2 px-4 text-gray-700 dark:text-gray-300">
                    {serviceQuery ? 'No services found matching your search.' : 'No services available.'}
                  </div>
                ) : (
                  filteredServices.map((service) => (
                    <Combobox.Option
                      key={service.id}
                      className={({ active }) =>
                        `relative cursor-default select-none py-2 pl-10 pr-4 ${
                          active 
                            ? 'bg-teal-600 text-white' 
                            : 'text-gray-900 dark:text-gray-100'
                        }`
                      }
                      value={service.id}
                    >
                      {({ selected, active }) => (
                        <>
                          <div className="flex items-center justify-between">
                            <div className="truncate">
                              <span className={`block ${selected ? 'font-medium' : 'font-normal'}`}>
                                {service.name}
                              </span>
                              {service.description && (
                                <span className={`block text-xs ${
                                  active ? 'text-teal-200' : 'text-gray-500 dark:text-gray-400'
                                }`}>
                                  {service.description}
                                </span>
                              )}
                            </div>
                            {service.description && (
                              <Tooltip content={service.description}>
                                <InformationCircleIcon 
                                  className={`h-4 w-4 ml-2 ${
                                    active ? 'text-teal-200' : 'text-gray-400'
                                  }`} 
                                />
                              </Tooltip>
                            )}
                          </div>
                          {selected ? (
                            <span
                              className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                active ? 'text-white' : 'text-teal-600'
                              }`}
                            >
                              <CheckIcon className="h-5 w-5" aria-hidden="true" />
                            </span>
                          ) : null}
                        </>
                      )}
                    </Combobox.Option>
                  ))
                )}
              </Combobox.Options>
            </Transition>
          </div>
        </Combobox>
        
        {hasServiceError && (
          <p 
            id={`${name}-service-error`}
            className="text-sm text-red-600 dark:text-red-400"
            role="alert"
          >
            {serviceFieldState.error?.message || error}
          </p>
        )}
      </div>

      {/* Component Selection */}
      <div className="space-y-2">
        <label 
          htmlFor={`${name}-component`}
          className="block text-sm font-medium text-gray-900 dark:text-gray-100"
        >
          Component {required && <span className="text-red-500">*</span>}
        </label>
        
        <Combobox 
          value={componentField.value || ''} 
          onChange={componentField.onChange}
          disabled={disabled || !serviceField.value}
        >
          <div className="relative">
            <div
              className={cn(
                'relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm',
                'border border-gray-300 dark:border-gray-600 dark:bg-gray-800',
                hasComponentError && 'border-red-500 dark:border-red-400',
                (disabled || !serviceField.value) && 'opacity-50 cursor-not-allowed'
              )}
            >
              <Combobox.Input
                id={`${name}-component`}
                className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 dark:text-gray-100 focus:ring-0 bg-transparent"
                displayValue={() => selectedComponent?.name || ''}
                onChange={(event) => setComponentQuery(event.target.value)}
                placeholder={!serviceField.value ? 'Select a service first...' : 'Select a component...'}
                disabled={disabled || !serviceField.value}
                aria-describedby={hasComponentError ? `${name}-component-error` : undefined}
                aria-invalid={hasComponentError}
              />
              <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                {componentsLoading ? (
                  <Spinner size="sm" />
                ) : (
                  <ChevronUpDownIcon
                    className="h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                )}
              </Combobox.Button>
            </div>
            
            <Transition
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Combobox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm dark:bg-gray-800 dark:ring-gray-600">
                {!serviceField.value ? (
                  <div className="relative cursor-default select-none py-2 px-4 text-gray-700 dark:text-gray-300">
                    Please select a service first.
                  </div>
                ) : componentsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Spinner size="sm" className="mr-2" />
                    <span className="text-gray-500 dark:text-gray-400">Loading components...</span>
                  </div>
                ) : componentsError ? (
                  <div className="flex items-center px-4 py-4 text-red-600 dark:text-red-400">
                    <InformationCircleIcon className="h-5 w-5 mr-2" />
                    <span>Error loading components</span>
                  </div>
                ) : filteredComponents.length === 0 ? (
                  <div className="relative cursor-default select-none py-2 px-4 text-gray-700 dark:text-gray-300">
                    {componentQuery ? 'No components found matching your search.' : 'No components available.'}
                  </div>
                ) : (
                  filteredComponents.map((component) => (
                    <Combobox.Option
                      key={component.name}
                      className={({ active }) =>
                        `relative cursor-default select-none py-2 pl-10 pr-4 ${
                          active 
                            ? 'bg-teal-600 text-white' 
                            : 'text-gray-900 dark:text-gray-100'
                        }`
                      }
                      value={component.name}
                    >
                      {({ selected, active }) => (
                        <>
                          <div className="flex items-center justify-between">
                            <div className="truncate flex-1">
                              <span className={`block ${selected ? 'font-medium' : 'font-normal'}`}>
                                {component.name}
                              </span>
                              {component.description && (
                                <span className={`block text-xs ${
                                  active ? 'text-teal-200' : 'text-gray-500 dark:text-gray-400'
                                }`}>
                                  {component.description}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 ml-2">
                              <Badge variant={component.access_level}>
                                {component.access_level}
                              </Badge>
                              {component.description && (
                                <Tooltip content={component.description}>
                                  <InformationCircleIcon 
                                    className={`h-4 w-4 ${
                                      active ? 'text-teal-200' : 'text-gray-400'
                                    }`} 
                                  />
                                </Tooltip>
                              )}
                            </div>
                          </div>
                          {selected ? (
                            <span
                              className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                active ? 'text-white' : 'text-teal-600'
                              }`}
                            >
                              <CheckIcon className="h-5 w-5" aria-hidden="true" />
                            </span>
                          ) : null}
                        </>
                      )}
                    </Combobox.Option>
                  ))
                )}
              </Combobox.Options>
            </Transition>
          </div>
        </Combobox>
        
        {hasComponentError && (
          <p 
            id={`${name}-component-error`}
            className="text-sm text-red-600 dark:text-red-400"
            role="alert"
          >
            {componentFieldState.error?.message}
          </p>
        )}
      </div>

      {/* Help text */}
      {selectedService && selectedComponent && (
        <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
          <div className="flex items-start space-x-2">
            <InformationCircleIcon className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <p className="font-medium">Selected Configuration:</p>
              <p className="mt-1">
                Service: <span className="font-mono">{selectedService.name}</span> 
                ({selectedService.type})
              </p>
              <p>
                Component: <span className="font-mono">{selectedComponent.name}</span>
                <Badge variant={selectedComponent.access_level} className="ml-2">
                  {selectedComponent.access_level}
                </Badge>
              </p>
              {selectedComponent.description && (
                <p className="mt-1 text-xs">{selectedComponent.description}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchedulerServiceSelector;