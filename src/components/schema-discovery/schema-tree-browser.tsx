'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Disclosure } from '@headlessui/react';
import {
  ChevronRightIcon,
  ChevronDownIcon,
  TableCellsIcon,
  CircleStackIcon,
  KeyIcon,
  LinkIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { useSchemaStore } from '@/stores/schema-store';
import { apiClient } from '@/lib/api-client';

// Schema types based on DreamFactory API structure
interface DatabaseSchema {
  name: string;
  label?: string;
  description?: string;
  tables: SchemaTable[];
  totalTableCount?: number;
}

interface SchemaTable {
  name: string;
  label?: string;
  description?: string;
  type: 'table' | 'view' | 'procedure';
  fields?: SchemaField[];
  relationships?: SchemaRelationship[];
  fieldCount?: number;
  relationshipCount?: number;
}

interface SchemaField {
  name: string;
  type: string;
  dbType?: string;
  length?: number;
  precision?: number;
  scale?: number;
  allowNull?: boolean;
  autoIncrement?: boolean;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  refTable?: string;
  refField?: string;
  description?: string;
}

interface SchemaRelationship {
  name: string;
  type: 'belongs_to' | 'has_many' | 'many_to_many';
  refTable: string;
  refField?: string;
  localField?: string;
  junctionTable?: string;
  description?: string;
}

interface TreeNode {
  id: string;
  name: string;
  type: 'database' | 'table' | 'field' | 'relationship';
  level: number;
  isExpanded: boolean;
  isLoading: boolean;
  hasChildren: boolean;
  parent?: string;
  data: DatabaseSchema | SchemaTable | SchemaField | SchemaRelationship;
  icon: React.ComponentType<{ className?: string }>;
}

interface SchemaTreeBrowserProps {
  serviceName: string;
  onTableSelect?: (tableName: string) => void;
  onFieldSelect?: (tableName: string, fieldName: string) => void;
  onRelationshipSelect?: (tableName: string, relationshipName: string) => void;
  className?: string;
  searchable?: boolean;
  expandOnLoad?: boolean;
}

// React Query cache configuration per Section 5.2 Component Details
const QUERY_CONFIG = {
  staleTime: 300 * 1000, // 300 seconds
  cacheTime: 900 * 1000, // 900 seconds (renamed to gcTime in newer versions)
  gcTime: 900 * 1000, // For newer React Query versions
  refetchOnWindowFocus: false,
  retry: 2,
} as const;

export function SchemaTreeBrowser({
  serviceName,
  onTableSelect,
  onFieldSelect,
  onRelationshipSelect,
  className,
  searchable = true,
  expandOnLoad = false,
}: SchemaTreeBrowserProps) {
  // Zustand store for tree expansion state and navigation breadcrumbs
  const {
    expandedNodes,
    selectedNode,
    searchQuery,
    navigationBreadcrumbs,
    toggleNode,
    selectNode,
    setSearchQuery,
    addBreadcrumb,
    clearBreadcrumbs,
  } = useSchemaStore();

  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  // Root schema query with React Query caching
  const {
    data: schemaData,
    isLoading: isSchemaLoading,
    error: schemaError,
    refetch: refetchSchema,
  } = useQuery({
    queryKey: ['schema', serviceName],
    queryFn: async () => {
      const response = await apiClient.get<{ resource: SchemaTable[] }>(
        `/${serviceName}/_schema`
      );
      return {
        name: serviceName,
        label: serviceName,
        tables: response.data.resource || [],
        totalTableCount: response.data.resource?.length || 0,
      } as DatabaseSchema;
    },
    enabled: !!serviceName,
    ...QUERY_CONFIG,
  });

  // Table details query factory
  const useTableDetailsQuery = (tableName: string, enabled: boolean) => {
    return useQuery({
      queryKey: ['schema', serviceName, 'table', tableName],
      queryFn: async () => {
        const response = await apiClient.get<{ resource: SchemaTable }>(
          `/${serviceName}/_schema/${tableName}`
        );
        return response.data.resource;
      },
      enabled: enabled && !!tableName,
      ...QUERY_CONFIG,
    });
  };

  // Build flat tree structure for virtualization
  const treeNodes = useMemo(() => {
    if (!schemaData) return [];

    const nodes: TreeNode[] = [];
    const tables = schemaData.tables || [];

    // Filter tables based on search term
    const filteredTables = searchTerm
      ? tables.filter(
          (table) =>
            table.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            table.label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            table.description?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : tables;

    // Add database root node
    nodes.push({
      id: `db-${serviceName}`,
      name: schemaData.label || schemaData.name,
      type: 'database',
      level: 0,
      isExpanded: expandedNodes.has(`db-${serviceName}`) || expandOnLoad,
      isLoading: false,
      hasChildren: filteredTables.length > 0,
      data: schemaData,
      icon: CircleStackIcon,
    });

    // Add table nodes if database is expanded
    if (expandedNodes.has(`db-${serviceName}`) || expandOnLoad) {
      filteredTables.forEach((table) => {
        const tableId = `table-${serviceName}-${table.name}`;
        const isTableExpanded = expandedNodes.has(tableId);

        nodes.push({
          id: tableId,
          name: table.label || table.name,
          type: 'table',
          level: 1,
          isExpanded: isTableExpanded,
          isLoading: false,
          hasChildren: (table.fieldCount || 0) > 0 || (table.relationshipCount || 0) > 0,
          parent: `db-${serviceName}`,
          data: table,
          icon: TableCellsIcon,
        });

        // Add field and relationship nodes if table is expanded
        if (isTableExpanded) {
          // Add fields
          const fields = table.fields || [];
          fields.forEach((field) => {
            nodes.push({
              id: `field-${serviceName}-${table.name}-${field.name}`,
              name: field.name,
              type: 'field',
              level: 2,
              isExpanded: false,
              isLoading: false,
              hasChildren: false,
              parent: tableId,
              data: field,
              icon: field.isPrimaryKey
                ? KeyIcon
                : field.isForeignKey
                ? LinkIcon
                : TableCellsIcon,
            });
          });

          // Add relationships
          const relationships = table.relationships || [];
          relationships.forEach((relationship) => {
            nodes.push({
              id: `rel-${serviceName}-${table.name}-${relationship.name}`,
              name: relationship.name,
              type: 'relationship',
              level: 2,
              isExpanded: false,
              isLoading: false,
              hasChildren: false,
              parent: tableId,
              data: relationship,
              icon: LinkIcon,
            });
          });
        }
      });
    }

    return nodes;
  }, [schemaData, expandedNodes, searchTerm, serviceName, expandOnLoad]);

  // TanStack Virtual for performance optimization
  const parentRef = React.useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: treeNodes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48, // Base height per row
    overscan: 10, // Render extra items for smooth scrolling
  });

  // Handle node expansion with progressive loading
  const handleNodeToggle = useCallback(
    async (node: TreeNode) => {
      // Update Zustand store state
      toggleNode(node.id);

      // Add to navigation breadcrumbs
      if (node.type === 'table') {
        addBreadcrumb({
          id: node.id,
          label: node.name,
          type: 'table',
          path: `/${serviceName}/schema/${node.name}`,
        });
      }

      // Load table details if expanding a table node
      if (node.type === 'table' && !expandedNodes.has(node.id)) {
        const tableName = (node.data as SchemaTable).name;
        
        // Prefetch table details
        await queryClient.prefetchQuery({
          queryKey: ['schema', serviceName, 'table', tableName],
          queryFn: async () => {
            const response = await apiClient.get<{ resource: SchemaTable }>(
              `/${serviceName}/_schema/${tableName}`
            );
            return response.data.resource;
          },
          ...QUERY_CONFIG,
        });
      }
    },
    [
      toggleNode,
      addBreadcrumb,
      expandedNodes,
      serviceName,
      queryClient,
    ]
  );

  // Handle node selection
  const handleNodeSelect = useCallback(
    (node: TreeNode) => {
      selectNode(node.id);

      // Trigger appropriate callback based on node type
      switch (node.type) {
        case 'table':
          onTableSelect?.(node.name);
          break;
        case 'field':
          const tableData = treeNodes.find((n) => n.id === node.parent)?.data as SchemaTable;
          if (tableData) {
            onFieldSelect?.(tableData.name, node.name);
          }
          break;
        case 'relationship':
          const parentTable = treeNodes.find((n) => n.id === node.parent)?.data as SchemaTable;
          if (parentTable) {
            onRelationshipSelect?.(parentTable.name, node.name);
          }
          break;
      }
    },
    [selectNode, onTableSelect, onFieldSelect, onRelationshipSelect, treeNodes]
  );

  // Handle search input with debouncing
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setSearchQuery(searchTerm);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, setSearchQuery]);

  // Auto-expand on initial load if specified
  useEffect(() => {
    if (expandOnLoad && schemaData && !expandedNodes.has(`db-${serviceName}`)) {
      toggleNode(`db-${serviceName}`);
    }
  }, [expandOnLoad, schemaData, expandedNodes, serviceName, toggleNode]);

  // Loading state
  if (isSchemaLoading) {
    return (
      <div className={cn('flex flex-col h-full', className)}>
        <div className="animate-pulse space-y-2 p-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-12 bg-slate-200 rounded-md dark:bg-slate-700" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (schemaError) {
    return (
      <div className={cn('flex flex-col items-center justify-center h-full p-4', className)}>
        <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Failed to load schema
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
          Unable to connect to the database service "{serviceName}". Please check your connection.
        </p>
        <button
          onClick={() => refetchSchema()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full bg-white dark:bg-gray-900', className)}>
      {/* Search bar */}
      {searchable && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tables, fields, and relationships..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
        </div>
      )}

      {/* Virtualized tree view */}
      <div
        ref={parentRef}
        className="flex-1 overflow-auto"
        style={{ height: '100%' }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const node = treeNodes[virtualItem.index];
            if (!node) return null;

            const IndentComponent = ({ children }: { children: React.ReactNode }) => (
              <div style={{ paddingLeft: `${node.level * 24}px` }}>
                {children}
              </div>
            );

            return (
              <div
                key={virtualItem.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <div
                  className={cn(
                    'flex items-center py-2 px-4 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800',
                    selectedNode === node.id && 'bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500',
                    node.type === 'field' && 'text-sm',
                    node.type === 'relationship' && 'text-sm italic'
                  )}
                  onClick={() => handleNodeSelect(node)}
                >
                  <IndentComponent>
                    <div className="flex items-center space-x-2">
                      {/* Expansion toggle */}
                      {node.hasChildren && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNodeToggle(node);
                          }}
                          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                          aria-label={node.isExpanded ? 'Collapse' : 'Expand'}
                        >
                          {node.isExpanded ? (
                            <ChevronDownIcon className="h-4 w-4" />
                          ) : (
                            <ChevronRightIcon className="h-4 w-4" />
                          )}
                        </button>
                      )}

                      {/* Node icon */}
                      <node.icon
                        className={cn(
                          'h-4 w-4 flex-shrink-0',
                          node.type === 'database' && 'text-blue-600',
                          node.type === 'table' && 'text-green-600',
                          node.type === 'field' && node.data && (node.data as SchemaField).isPrimaryKey && 'text-yellow-600',
                          node.type === 'field' && node.data && (node.data as SchemaField).isForeignKey && 'text-purple-600',
                          node.type === 'field' && node.data && !(node.data as SchemaField).isPrimaryKey && !(node.data as SchemaField).isForeignKey && 'text-gray-600',
                          node.type === 'relationship' && 'text-purple-600'
                        )}
                      />

                      {/* Node name and metadata */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span
                            className={cn(
                              'truncate font-medium',
                              node.type === 'database' && 'text-gray-900 dark:text-gray-100',
                              node.type === 'table' && 'text-gray-800 dark:text-gray-200',
                              node.type === 'field' && 'text-gray-700 dark:text-gray-300',
                              node.type === 'relationship' && 'text-gray-600 dark:text-gray-400'
                            )}
                          >
                            {node.name}
                          </span>

                          {/* Type badges */}
                          {node.type === 'field' && node.data && (
                            <div className="flex space-x-1">
                              {(node.data as SchemaField).isPrimaryKey && (
                                <span className="px-1.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded dark:bg-yellow-900/20 dark:text-yellow-400">
                                  PK
                                </span>
                              )}
                              {(node.data as SchemaField).isForeignKey && (
                                <span className="px-1.5 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 rounded dark:bg-purple-900/20 dark:text-purple-400">
                                  FK
                                </span>
                              )}
                              <span className="px-1.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded dark:bg-gray-800 dark:text-gray-400">
                                {(node.data as SchemaField).type}
                              </span>
                            </div>
                          )}

                          {node.type === 'table' && node.data && (
                            <div className="flex space-x-1">
                              <span className="px-1.5 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded dark:bg-green-900/20 dark:text-green-400">
                                {(node.data as SchemaTable).type}
                              </span>
                              {(node.data as SchemaTable).fieldCount && (
                                <span className="px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded dark:bg-blue-900/20 dark:text-blue-400">
                                  {(node.data as SchemaTable).fieldCount} fields
                                </span>
                              )}
                            </div>
                          )}

                          {node.type === 'relationship' && node.data && (
                            <span className="px-1.5 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 rounded dark:bg-purple-900/20 dark:text-purple-400">
                              {(node.data as SchemaRelationship).type}
                            </span>
                          )}
                        </div>

                        {/* Description */}
                        {node.data && 'description' in node.data && node.data.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                            {node.data.description}
                          </p>
                        )}
                      </div>

                      {/* Loading indicator */}
                      {node.isLoading && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      )}
                    </div>
                  </IndentComponent>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer with stats */}
      {schemaData && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>
              {schemaData.totalTableCount} {schemaData.totalTableCount === 1 ? 'table' : 'tables'}
            </span>
            {searchTerm && (
              <span>
                {treeNodes.filter((n) => n.type === 'table').length} filtered
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SchemaTreeBrowser;