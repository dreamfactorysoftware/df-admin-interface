'use client';

import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { ChevronRightIcon, ChevronDownIcon, DatabaseIcon, TableCellsIcon, KeyIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

// Type definitions for schema data structures
interface SchemaTableField {
  id: string;
  name: string;
  type: string;
  nullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  defaultValue?: string;
  maxLength?: number;
  precision?: number;
  scale?: number;
}

interface SchemaTable {
  id: string;
  name: string;
  type: 'table' | 'view';
  schema: string;
  fieldCount: number;
  fields?: SchemaTableField[];
  relationships?: {
    parentTables: string[];
    childTables: string[];
  };
  metadata?: {
    engine?: string;
    collation?: string;
    rowCount?: number;
    dataLength?: number;
    indexLength?: number;
    autoIncrement?: number;
    createTime?: string;
    updateTime?: string;
  };
}

interface SchemaDatabase {
  id: string;
  name: string;
  serviceId: string;
  type: 'database' | 'schema';
  tableCount: number;
  tables?: SchemaTable[];
  metadata?: {
    charset?: string;
    collation?: string;
    version?: string;
  };
}

interface SchemaListItem {
  id: string;
  type: 'database' | 'table' | 'field';
  name: string;
  parent?: string;
  level: number;
  expanded?: boolean;
  data: SchemaDatabase | SchemaTable | SchemaTableField;
  hasChildren: boolean;
  isLoading?: boolean;
  height?: number;
}

interface VirtualizedListProps {
  serviceId: string;
  searchQuery?: string;
  sortBy?: 'name' | 'type' | 'size' | 'modified';
  sortDirection?: 'asc' | 'desc';
  filterType?: 'all' | 'tables' | 'views' | 'fields';
  onItemSelect?: (item: SchemaListItem) => void;
  onItemExpand?: (item: SchemaListItem) => void;
  onItemCollapse?: (item: SchemaListItem) => void;
  className?: string;
  maxHeight?: number;
  enableInfiniteScroll?: boolean;
  pageSize?: number;
}

interface SchemaApiResponse {
  data: SchemaDatabase[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

interface SchemaQueryParams {
  serviceId: string;
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  filter?: string;
  parentId?: string;
}

// Custom hook for schema data fetching with React Query optimization
const useSchemaData = (params: SchemaQueryParams) => {
  const {
    data,
    error,
    isLoading,
    isFetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['schema', params.serviceId, params.search, params.sort, params.filter],
    queryFn: async ({ pageParam = 1 }) => {
      // Simulate API call with proper caching headers
      const searchParams = new URLSearchParams({
        page: pageParam.toString(),
        limit: (params.limit || 50).toString(),
        ...(params.search && { search: params.search }),
        ...(params.sort && { sort: params.sort }),
        ...(params.filter && { filter: params.filter }),
        ...(params.parentId && { parentId: params.parentId }),
      });

      const response = await fetch(`/api/v2/${params.serviceId}/_schema?${searchParams}`, {
        headers: {
          'Cache-Control': 'max-age=300, stale-while-revalidate=900',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Schema fetch failed: ${response.statusText}`);
      }

      const result: SchemaApiResponse = await response.json();
      return {
        ...result,
        pageParam,
      };
    },
    getNextPageParam: (lastPage) => {
      return lastPage.pagination?.hasMore ? (lastPage.pagination.page + 1) : undefined;
    },
    staleTime: 300 * 1000, // 5 minutes
    cacheTime: 900 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });

  const flatData = useMemo(() => {
    return data?.pages.flatMap(page => page.data) || [];
  }, [data]);

  return {
    data: flatData,
    error,
    isLoading,
    isFetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
};

// Custom hook for intersection observer-based progressive loading
const useIntersectionObserver = (callback: () => void, dependencies: any[] = []) => {
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          callback();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px',
      }
    );

    observer.observe(target);

    return () => {
      observer.unobserve(target);
    };
  }, [callback, ...dependencies]);

  return targetRef;
};

// Utility function for transforming flat data to hierarchical list
const useHierarchicalData = (
  databases: SchemaDatabase[],
  expandedItems: Set<string>,
  searchQuery?: string,
  sortBy?: string,
  sortDirection?: 'asc' | 'desc',
  filterType?: string
): SchemaListItem[] => {
  return useMemo(() => {
    const items: SchemaListItem[] = [];
    
    // Filter and sort databases
    let filteredDatabases = [...databases];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredDatabases = filteredDatabases.filter(db => 
        db.name.toLowerCase().includes(query) ||
        db.tables?.some(table => 
          table.name.toLowerCase().includes(query) ||
          table.fields?.some(field => field.name.toLowerCase().includes(query))
        )
      );
    }

    if (sortBy === 'name') {
      filteredDatabases.sort((a, b) => {
        const comparison = a.name.localeCompare(b.name);
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    // Build hierarchical list
    filteredDatabases.forEach(database => {
      const databaseItem: SchemaListItem = {
        id: database.id,
        type: 'database',
        name: database.name,
        level: 0,
        expanded: expandedItems.has(database.id),
        data: database,
        hasChildren: (database.tableCount || 0) > 0,
        height: 48, // Base height for database items
      };

      items.push(databaseItem);

      // Add tables if database is expanded
      if (expandedItems.has(database.id) && database.tables) {
        let filteredTables = database.tables;

        if (filterType && filterType !== 'all') {
          if (filterType === 'tables') {
            filteredTables = filteredTables.filter(table => table.type === 'table');
          } else if (filterType === 'views') {
            filteredTables = filteredTables.filter(table => table.type === 'view');
          }
        }

        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filteredTables = filteredTables.filter(table =>
            table.name.toLowerCase().includes(query) ||
            table.fields?.some(field => field.name.toLowerCase().includes(query))
          );
        }

        if (sortBy === 'name') {
          filteredTables.sort((a, b) => {
            const comparison = a.name.localeCompare(b.name);
            return sortDirection === 'desc' ? -comparison : comparison;
          });
        }

        filteredTables.forEach(table => {
          const tableItem: SchemaListItem = {
            id: table.id,
            type: 'table',
            name: table.name,
            parent: database.id,
            level: 1,
            expanded: expandedItems.has(table.id),
            data: table,
            hasChildren: (table.fieldCount || 0) > 0,
            height: 44, // Slightly smaller height for table items
          };

          items.push(tableItem);

          // Add fields if table is expanded
          if (expandedItems.has(table.id) && table.fields) {
            let filteredFields = table.fields;

            if (searchQuery) {
              const query = searchQuery.toLowerCase();
              filteredFields = filteredFields.filter(field =>
                field.name.toLowerCase().includes(query) ||
                field.type.toLowerCase().includes(query)
              );
            }

            if (sortBy === 'name') {
              filteredFields.sort((a, b) => {
                const comparison = a.name.localeCompare(b.name);
                return sortDirection === 'desc' ? -comparison : comparison;
              });
            }

            filteredFields.forEach(field => {
              const fieldItem: SchemaListItem = {
                id: field.id,
                type: 'field',
                name: field.name,
                parent: table.id,
                level: 2,
                data: field,
                hasChildren: false,
                height: 40, // Smallest height for field items
              };

              items.push(fieldItem);
            });
          }
        });
      }
    });

    return items;
  }, [databases, expandedItems, searchQuery, sortBy, sortDirection, filterType]);
};

// Main virtualized list component
export const SchemaVirtualizedList: React.FC<VirtualizedListProps> = ({
  serviceId,
  searchQuery,
  sortBy = 'name',
  sortDirection = 'asc',
  filterType = 'all',
  onItemSelect,
  onItemExpand,
  onItemCollapse,
  className,
  maxHeight = 600,
  enableInfiniteScroll = true,
  pageSize = 50,
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const parentRef = useRef<HTMLDivElement>(null);

  // Fetch schema data with React Query
  const {
    data: databases,
    isLoading,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    error,
  } = useSchemaData({
    serviceId,
    limit: pageSize,
    search: searchQuery,
    sort: sortBy && sortDirection ? `${sortBy}:${sortDirection}` : undefined,
    filter: filterType !== 'all' ? filterType : undefined,
  });

  // Transform data to hierarchical list
  const listItems = useHierarchicalData(
    databases,
    expandedItems,
    searchQuery,
    sortBy,
    sortDirection,
    filterType
  );

  // Calculate dynamic item height
  const estimateSize = useCallback((index: number) => {
    const item = listItems[index];
    return item?.height || 44;
  }, [listItems]);

  // Initialize virtualizer with TanStack Virtual
  const virtualizer = useVirtualizer({
    count: listItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize,
    overscan: 10, // Render 10 extra items for smooth scrolling
    measureElement: (element) => {
      // Dynamic measurement for variable height items
      const item = listItems[element.dataset.index ? parseInt(element.dataset.index) : 0];
      if (item?.type === 'database') return 48;
      if (item?.type === 'table') return 44;
      if (item?.type === 'field') return 40;
      return 44;
    },
  });

  // Handle item expansion/collapse
  const handleToggleExpand = useCallback((item: SchemaListItem) => {
    const newExpandedItems = new Set(expandedItems);
    
    if (expandedItems.has(item.id)) {
      newExpandedItems.delete(item.id);
      onItemCollapse?.(item);
    } else {
      newExpandedItems.add(item.id);
      onItemExpand?.(item);
    }
    
    setExpandedItems(newExpandedItems);
  }, [expandedItems, onItemExpand, onItemCollapse]);

  // Handle item selection
  const handleItemSelect = useCallback((item: SchemaListItem) => {
    onItemSelect?.(item);
  }, [onItemSelect]);

  // Intersection observer for infinite scroll
  const loadMoreRef = useIntersectionObserver(() => {
    if (enableInfiniteScroll && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [enableInfiniteScroll, hasNextPage, isFetchingNextPage]);

  // Render individual list item
  const renderItem = useCallback((virtualItem: any) => {
    const item = listItems[virtualItem.index];
    if (!item) return null;

    const indent = item.level * 20;
    const isExpanded = expandedItems.has(item.id);

    return (
      <div
        key={virtualItem.key}
        data-index={virtualItem.index}
        ref={virtualizer.measureElement}
        className={cn(
          "absolute top-0 left-0 w-full flex items-center px-3 py-2 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors",
          "focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:outline-none",
          item.type === 'database' && "bg-gray-50 dark:bg-gray-900/50 font-medium",
          item.type === 'table' && "bg-white dark:bg-gray-900",
          item.type === 'field' && "bg-gray-25 dark:bg-gray-950/50 text-sm"
        )}
        style={{
          height: virtualItem.size,
          transform: `translateY(${virtualItem.start}px)`,
          paddingLeft: `${12 + indent}px`,
        }}
        onClick={() => handleItemSelect(item)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleItemSelect(item);
          }
          if (e.key === 'ArrowRight' && item.hasChildren && !isExpanded) {
            e.preventDefault();
            handleToggleExpand(item);
          }
          if (e.key === 'ArrowLeft' && item.hasChildren && isExpanded) {
            e.preventDefault();
            handleToggleExpand(item);
          }
        }}
        tabIndex={0}
        role="treeitem"
        aria-expanded={item.hasChildren ? isExpanded : undefined}
        aria-level={item.level + 1}
        aria-label={`${item.type} ${item.name}${item.hasChildren ? (isExpanded ? ', expanded' : ', collapsed') : ''}`}
      >
        {/* Expansion indicator */}
        {item.hasChildren && (
          <button
            className="mr-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleExpand(item);
            }}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronDownIcon className="w-4 h-4" />
            ) : (
              <ChevronRightIcon className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Item icon */}
        <div className="mr-3 flex-shrink-0">
          {item.type === 'database' && (
            <DatabaseIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          )}
          {item.type === 'table' && (
            <TableCellsIcon className={cn(
              "w-4 h-4",
              (item.data as SchemaTable).type === 'view' 
                ? "text-purple-600 dark:text-purple-400" 
                : "text-green-600 dark:text-green-400"
            )} />
          )}
          {item.type === 'field' && (
            <KeyIcon className={cn(
              "w-3 h-3",
              (item.data as SchemaTableField).isPrimaryKey 
                ? "text-yellow-600 dark:text-yellow-400"
                : "text-gray-500 dark:text-gray-400"
            )} />
          )}
        </div>

        {/* Item content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
              {item.name}
            </span>
            
            {/* Item metadata */}
            <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
              {item.type === 'database' && (
                <span>{(item.data as SchemaDatabase).tableCount} tables</span>
              )}
              {item.type === 'table' && (
                <>
                  <span className={cn(
                    "px-2 py-1 rounded text-xs font-medium",
                    (item.data as SchemaTable).type === 'view'
                      ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                      : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                  )}>
                    {(item.data as SchemaTable).type}
                  </span>
                  <span>{(item.data as SchemaTable).fieldCount} fields</span>
                </>
              )}
              {item.type === 'field' && (
                <>
                  <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">
                    {(item.data as SchemaTableField).type}
                  </span>
                  {(item.data as SchemaTableField).isPrimaryKey && (
                    <span className="text-yellow-600 dark:text-yellow-400 font-medium">PK</span>
                  )}
                  {(item.data as SchemaTableField).isForeignKey && (
                    <span className="text-blue-600 dark:text-blue-400 font-medium">FK</span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }, [listItems, expandedItems, handleToggleExpand, handleItemSelect, virtualizer.measureElement]);

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="space-y-2 p-3">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="animate-pulse flex items-center space-x-3">
          <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
          <div className="w-16 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      ))}
    </div>
  );

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-600 dark:text-red-400 font-medium mb-2">
          Failed to load schema data
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {error.message}
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {/* Loading state */}
      {isLoading && <LoadingSkeleton />}

      {/* Virtualized list */}
      {!isLoading && (
        <div
          ref={parentRef}
          className="overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
          style={{ height: maxHeight }}
          role="tree"
          aria-label="Database schema tree"
        >
          <div
            style={{
              height: virtualizer.getTotalSize(),
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map(renderItem)}
          </div>

          {/* Infinite scroll loader */}
          {enableInfiniteScroll && hasNextPage && (
            <div ref={loadMoreRef} className="p-4 text-center">
              {isFetchingNextPage ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Loading more...</span>
                </div>
              ) : (
                <button
                  onClick={() => fetchNextPage()}
                  className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium"
                >
                  Load more
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && listItems.length === 0 && (
        <div className="p-8 text-center border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900">
          <DatabaseIcon className="mx-auto w-12 h-12 text-gray-400 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No schema data found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchQuery ? `No results found for "${searchQuery}"` : 'This service has no schema data available.'}
          </p>
        </div>
      )}

      {/* Background refresh indicator */}
      {isFetching && !isLoading && (
        <div className="absolute top-2 right-2">
          <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

export default SchemaVirtualizedList;