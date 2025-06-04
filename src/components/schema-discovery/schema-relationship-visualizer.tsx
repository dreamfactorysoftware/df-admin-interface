/**
 * @fileoverview Schema Relationship Visualizer Component
 * 
 * Interactive React component for visualizing database table relationships and foreign key 
 * constraints using modern diagram components. Provides relationship mapping, constraint 
 * visualization, and navigation to related tables with responsive design and accessibility support.
 * 
 * Implements React Query for relationship metadata fetching with automatic background refresh,
 * Tailwind CSS styling with consistent theme injection, and WCAG 2.1 AA compliance through
 * proper semantic markup and keyboard navigation.
 * 
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1.0
 */

'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { 
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  ArrowTopRightOnSquareIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Database table relationship metadata
 */
interface TableRelationship {
  id: string;
  sourceTable: string;
  targetTable: string;
  sourceColumn: string;
  targetColumn: string;
  relationshipType: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
  foreignKeyName: string;
  constraintType: 'foreign_key' | 'primary_key' | 'unique' | 'check';
  isEnforced: boolean;
  cascadeOnDelete: boolean;
  cascadeOnUpdate: boolean;
  createdAt?: string;
  metadata?: {
    description?: string;
    isIndexed?: boolean;
    isNullable?: boolean;
  };
}

/**
 * Table node for visualization
 */
interface TableNode {
  id: string;
  name: string;
  displayName: string;
  position: { x: number; y: number };
  columns: ColumnInfo[];
  isSelected?: boolean;
  isHighlighted?: boolean;
  metadata?: {
    tableType: 'table' | 'view' | 'materialized_view';
    rowCount?: number;
    description?: string;
  };
}

/**
 * Column information for tables
 */
interface ColumnInfo {
  name: string;
  dataType: string;
  isNullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  defaultValue?: string;
}

/**
 * Relationship edge for visualization
 */
interface RelationshipEdge {
  id: string;
  source: string;
  target: string;
  sourceColumn: string;
  targetColumn: string;
  relationshipType: TableRelationship['relationshipType'];
  isHighlighted?: boolean;
  metadata: Pick<TableRelationship, 'foreignKeyName' | 'constraintType' | 'isEnforced'>;
}

/**
 * Filter options for relationships
 */
interface RelationshipFilters {
  relationshipTypes: TableRelationship['relationshipType'][];
  constraintTypes: TableRelationship['constraintType'][];
  showEnforcedOnly: boolean;
  showCascadingOnly: boolean;
  searchTerm: string;
}

/**
 * Component props interface
 */
interface SchemaRelationshipVisualizerProps {
  /** Database service identifier */
  serviceId: string;
  
  /** Optional table to focus on initially */
  focusTable?: string;
  
  /** Height of the visualization container */
  height?: number;
  
  /** Enable interactive navigation */
  enableNavigation?: boolean;
  
  /** Show relationship details panel */
  showDetailsPanel?: boolean;
  
  /** Custom CSS classes */
  className?: string;
  
  /** Callback when table is selected */
  onTableSelect?: (tableId: string) => void;
  
  /** Callback when relationship is selected */
  onRelationshipSelect?: (relationship: TableRelationship) => void;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** Default filter state */
const DEFAULT_FILTERS: RelationshipFilters = {
  relationshipTypes: ['one-to-one', 'one-to-many', 'many-to-one', 'many-to-many'],
  constraintTypes: ['foreign_key', 'primary_key', 'unique', 'check'],
  showEnforcedOnly: false,
  showCascadingOnly: false,
  searchTerm: '',
};

/** Relationship type colors for visualization */
const RELATIONSHIP_COLORS = {
  'one-to-one': 'stroke-blue-500',
  'one-to-many': 'stroke-green-500',
  'many-to-one': 'stroke-yellow-500',
  'many-to-many': 'stroke-purple-500',
} as const;

/** Constraint type icons */
const CONSTRAINT_ICONS = {
  foreign_key: '🔗',
  primary_key: '🔑',
  unique: '⚡',
  check: '✅',
} as const;

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Fetch table relationships for a database service
 */
async function fetchTableRelationships(serviceId: string): Promise<TableRelationship[]> {
  const response = await fetch(`/api/v2/${serviceId}/_schema/_relationships`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch relationships: ${response.statusText}`);
  }

  const data = await response.json();
  return data.resource || [];
}

/**
 * Fetch table schema information for visualization
 */
async function fetchTableSchema(serviceId: string): Promise<TableNode[]> {
  const response = await fetch(`/api/v2/${serviceId}/_schema`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch schema: ${response.statusText}`);
  }

  const data = await response.json();
  
  // Transform API response to table nodes
  return (data.resource || []).map((table: any, index: number) => ({
    id: table.name,
    name: table.name,
    displayName: table.label || table.name,
    position: { 
      x: (index % 5) * 300 + 50, 
      y: Math.floor(index / 5) * 200 + 50 
    },
    columns: (table.field || []).map((field: any) => ({
      name: field.name,
      dataType: field.type,
      isNullable: field.allow_null || false,
      isPrimaryKey: field.is_primary_key || false,
      isForeignKey: field.is_foreign_key || false,
      defaultValue: field.default_value,
    })),
    metadata: {
      tableType: table.is_view ? 'view' : 'table',
      description: table.description,
    },
  }));
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Filter relationships based on current filter state
 */
function filterRelationships(
  relationships: TableRelationship[],
  filters: RelationshipFilters
): TableRelationship[] {
  return relationships.filter((rel) => {
    // Filter by relationship type
    if (!filters.relationshipTypes.includes(rel.relationshipType)) {
      return false;
    }

    // Filter by constraint type
    if (!filters.constraintTypes.includes(rel.constraintType)) {
      return false;
    }

    // Filter by enforcement
    if (filters.showEnforcedOnly && !rel.isEnforced) {
      return false;
    }

    // Filter by cascading
    if (filters.showCascadingOnly && !rel.cascadeOnDelete && !rel.cascadeOnUpdate) {
      return false;
    }

    // Filter by search term
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      return (
        rel.sourceTable.toLowerCase().includes(searchLower) ||
        rel.targetTable.toLowerCase().includes(searchLower) ||
        rel.sourceColumn.toLowerCase().includes(searchLower) ||
        rel.targetColumn.toLowerCase().includes(searchLower) ||
        rel.foreignKeyName.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });
}

/**
 * Convert relationships to visualization edges
 */
function relationshipsToEdges(
  relationships: TableRelationship[],
  selectedRelationship?: string
): RelationshipEdge[] {
  return relationships.map((rel) => ({
    id: rel.id,
    source: rel.sourceTable,
    target: rel.targetTable,
    sourceColumn: rel.sourceColumn,
    targetColumn: rel.targetColumn,
    relationshipType: rel.relationshipType,
    isHighlighted: selectedRelationship === rel.id,
    metadata: {
      foreignKeyName: rel.foreignKeyName,
      constraintType: rel.constraintType,
      isEnforced: rel.isEnforced,
    },
  }));
}

/**
 * Calculate optimal layout for table nodes
 */
function calculateNodeLayout(tables: TableNode[], relationships: RelationshipEdge[]): TableNode[] {
  // Simple force-directed layout algorithm
  const nodes = [...tables];
  const iterations = 100;
  const repulsionStrength = 5000;
  const attractionStrength = 0.1;
  const damping = 0.9;

  for (let i = 0; i < iterations; i++) {
    // Apply repulsion between all nodes
    for (let j = 0; j < nodes.length; j++) {
      let forceX = 0;
      let forceY = 0;

      for (let k = 0; k < nodes.length; k++) {
        if (j === k) continue;

        const dx = nodes[j].position.x - nodes[k].position.x;
        const dy = nodes[j].position.y - nodes[k].position.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        
        const repulsion = repulsionStrength / (distance * distance);
        forceX += (dx / distance) * repulsion;
        forceY += (dy / distance) * repulsion;
      }

      // Apply attraction for connected nodes
      relationships.forEach((edge) => {
        if (edge.source === nodes[j].id || edge.target === nodes[j].id) {
          const connectedNodeId = edge.source === nodes[j].id ? edge.target : edge.source;
          const connectedNode = nodes.find(n => n.id === connectedNodeId);
          
          if (connectedNode) {
            const dx = connectedNode.position.x - nodes[j].position.x;
            const dy = connectedNode.position.y - nodes[j].position.y;
            const distance = Math.sqrt(dx * dx + dy * dy) || 1;
            
            forceX += dx * attractionStrength;
            forceY += dy * attractionStrength;
          }
        }
      });

      // Apply damping and update position
      nodes[j].position.x += forceX * damping;
      nodes[j].position.y += forceY * damping;
    }
  }

  return nodes;
}

// =============================================================================
// VISUALIZATION COMPONENTS
// =============================================================================

/**
 * Table node component for the diagram
 */
const TableNodeComponent: React.FC<{
  table: TableNode;
  isSelected: boolean;
  onSelect: (tableId: string) => void;
  onNavigate?: (tableId: string) => void;
}> = ({ table, isSelected, onSelect, onNavigate }) => {
  return (
    <div
      className={`
        absolute transform -translate-x-1/2 -translate-y-1/2 
        bg-white dark:bg-gray-800 border-2 rounded-lg shadow-lg
        min-w-48 max-w-64 cursor-pointer transition-all duration-200
        ${isSelected 
          ? 'border-primary-500 shadow-primary-500/25 scale-105' 
          : 'border-gray-300 dark:border-gray-600 hover:border-primary-400'
        }
        ${table.isHighlighted ? 'ring-2 ring-yellow-400' : ''}
      `}
      style={{
        left: table.position.x,
        top: table.position.y,
      }}
      onClick={() => onSelect(table.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(table.id);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Table ${table.displayName}${isSelected ? ' (selected)' : ''}`}
    >
      {/* Table Header */}
      <div className="bg-primary-50 dark:bg-primary-900/20 px-3 py-2 rounded-t-lg border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
            {table.displayName}
          </h3>
          {onNavigate && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNavigate(table.id);
              }}
              className="text-gray-400 hover:text-primary-500 transition-colors"
              aria-label={`Navigate to ${table.displayName} details`}
            >
              <ArrowTopRightOnSquareIcon className="w-4 h-4" />
            </button>
          )}
        </div>
        {table.metadata?.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
            {table.metadata.description}
          </p>
        )}
      </div>

      {/* Table Columns */}
      <div className="px-3 py-2 max-h-40 overflow-y-auto">
        {table.columns.slice(0, 8).map((column) => (
          <div
            key={column.name}
            className="flex items-center justify-between py-1 text-xs"
          >
            <span className={`
              truncate flex-1 mr-2
              ${column.isPrimaryKey ? 'font-semibold text-yellow-600 dark:text-yellow-400' : ''}
              ${column.isForeignKey ? 'text-blue-600 dark:text-blue-400' : ''}
            `}>
              {column.isPrimaryKey && '🔑'} 
              {column.isForeignKey && '🔗'} 
              {column.name}
            </span>
            <span className="text-gray-500 text-xs">{column.dataType}</span>
          </div>
        ))}
        {table.columns.length > 8 && (
          <div className="text-xs text-gray-500 text-center py-1">
            +{table.columns.length - 8} more columns
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Relationship edge component
 */
const RelationshipEdgeComponent: React.FC<{
  edge: RelationshipEdge;
  sourceNode: TableNode;
  targetNode: TableNode;
  isSelected: boolean;
  onClick: () => void;
}> = ({ edge, sourceNode, targetNode, isSelected, onClick }) => {
  const dx = targetNode.position.x - sourceNode.position.x;
  const dy = targetNode.position.y - sourceNode.position.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  const strokeColor = RELATIONSHIP_COLORS[edge.relationshipType];
  const strokeWidth = isSelected ? 3 : 2;

  return (
    <g
      className="cursor-pointer transition-all duration-200"
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Relationship: ${edge.sourceColumn} to ${edge.targetColumn}`}
    >
      {/* Relationship line */}
      <line
        x1={sourceNode.position.x}
        y1={sourceNode.position.y}
        x2={targetNode.position.x}
        y2={targetNode.position.y}
        className={`${strokeColor} ${isSelected ? 'opacity-100' : 'opacity-70'} hover:opacity-100`}
        strokeWidth={strokeWidth}
        strokeDasharray={edge.metadata.isEnforced ? undefined : '5,5'}
        markerEnd="url(#arrowhead)"
      />

      {/* Relationship label */}
      <text
        x={sourceNode.position.x + dx / 2}
        y={sourceNode.position.y + dy / 2 - 10}
        className="fill-gray-700 dark:fill-gray-300 text-xs pointer-events-none"
        textAnchor="middle"
        transform={`rotate(${angle < -90 || angle > 90 ? angle + 180 : angle}, ${sourceNode.position.x + dx / 2}, ${sourceNode.position.y + dy / 2 - 10})`}
      >
        {CONSTRAINT_ICONS[edge.metadata.constraintType]} {edge.relationshipType}
      </text>
    </g>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * Schema Relationship Visualizer Component
 * 
 * Provides interactive visualization of database table relationships and foreign key constraints
 */
export const SchemaRelationshipVisualizer: React.FC<SchemaRelationshipVisualizerProps> = ({
  serviceId,
  focusTable,
  height = 600,
  enableNavigation = true,
  showDetailsPanel = true,
  className = '',
  onTableSelect,
  onRelationshipSelect,
}) => {
  // =============================================================================
  // STATE MANAGEMENT
  // =============================================================================

  const router = useRouter();
  const [filters, setFilters] = useState<RelationshipFilters>(DEFAULT_FILTERS);
  const [selectedTable, setSelectedTable] = useState<string | null>(focusTable || null);
  const [selectedRelationship, setSelectedRelationship] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 1200, height: 800 });

  // =============================================================================
  // DATA FETCHING
  // =============================================================================

  // Fetch table relationships with React Query caching
  const {
    data: relationships = [],
    isLoading: isLoadingRelationships,
    error: relationshipsError,
    isStale: isRelationshipsStale,
  } = useQuery({
    queryKey: ['schema-relationships', serviceId],
    queryFn: () => fetchTableRelationships(serviceId),
    staleTime: 300000, // 5 minutes as per spec requirements
    cacheTime: 900000, // 15 minutes as per spec requirements
    refetchOnWindowFocus: true,
    retry: 3,
  });

  // Fetch table schema information
  const {
    data: tables = [],
    isLoading: isLoadingTables,
    error: tablesError,
  } = useQuery({
    queryKey: ['schema-tables', serviceId],
    queryFn: () => fetchTableSchema(serviceId),
    staleTime: 300000, // 5 minutes as per spec requirements
    cacheTime: 900000, // 15 minutes as per spec requirements
    refetchOnWindowFocus: true,
    retry: 3,
  });

  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================

  // Filter relationships based on current filters
  const filteredRelationships = useMemo(
    () => filterRelationships(relationships, filters),
    [relationships, filters]
  );

  // Convert relationships to visualization edges
  const edges = useMemo(
    () => relationshipsToEdges(filteredRelationships, selectedRelationship || undefined),
    [filteredRelationships, selectedRelationship]
  );

  // Calculate node layout with relationship constraints
  const layoutedTables = useMemo(
    () => calculateNodeLayout(tables, edges),
    [tables, edges]
  );

  // Highlight related tables when a table is selected
  const highlightedTables = useMemo(() => {
    if (!selectedTable) return layoutedTables;

    return layoutedTables.map(table => ({
      ...table,
      isSelected: table.id === selectedTable,
      isHighlighted: edges.some(edge => 
        (edge.source === selectedTable && edge.target === table.id) ||
        (edge.target === selectedTable && edge.source === table.id)
      ),
    }));
  }, [layoutedTables, selectedTable, edges]);

  // Get selected relationship details
  const selectedRelationshipDetails = useMemo(
    () => selectedRelationship 
      ? relationships.find(rel => rel.id === selectedRelationship)
      : null,
    [relationships, selectedRelationship]
  );

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  const handleTableSelect = useCallback((tableId: string) => {
    setSelectedTable(tableId === selectedTable ? null : tableId);
    setSelectedRelationship(null);
    onTableSelect?.(tableId);
  }, [selectedTable, onTableSelect]);

  const handleRelationshipSelect = useCallback((edge: RelationshipEdge) => {
    const relationship = relationships.find(rel => rel.id === edge.id);
    if (relationship) {
      setSelectedRelationship(edge.id === selectedRelationship ? null : edge.id);
      setSelectedTable(null);
      onRelationshipSelect?.(relationship);
    }
  }, [relationships, selectedRelationship, onRelationshipSelect]);

  const handleTableNavigate = useCallback((tableId: string) => {
    if (enableNavigation) {
      router.push(`/adf-schema/tables/${tableId}?service=${serviceId}`);
    }
  }, [enableNavigation, router, serviceId]);

  const handleFilterChange = useCallback(<K extends keyof RelationshipFilters>(
    key: K,
    value: RelationshipFilters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  // =============================================================================
  // EFFECTS
  // =============================================================================

  // Focus on specified table when prop changes
  useEffect(() => {
    if (focusTable && focusTable !== selectedTable) {
      setSelectedTable(focusTable);
    }
  }, [focusTable, selectedTable]);

  // =============================================================================
  // ERROR HANDLING
  // =============================================================================

  if (relationshipsError || tablesError) {
    return (
      <div className={`rounded-lg border border-red-200 bg-red-50 p-4 ${className}`}>
        <div className="flex">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Error Loading Schema Relationships
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>
                {relationshipsError?.message || tablesError?.message || 'Failed to load schema data'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header Controls */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Schema Relationships
          </h2>
          {isRelationshipsStale && (
            <div className="flex items-center text-sm text-yellow-600 dark:text-yellow-400">
              <InformationCircleIcon className="w-4 h-4 mr-1" />
              Data refreshing...
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search tables, columns..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                       focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              aria-label="Search relationships"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`
              p-2 rounded-md border transition-colors
              ${showFilters 
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' 
                : 'border-gray-300 dark:border-gray-600 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }
            `}
            aria-label="Toggle filters"
            aria-expanded={showFilters}
          >
            <AdjustmentsHorizontalIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Relationship Types */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Relationship Types
              </label>
              <div className="space-y-2">
                {(['one-to-one', 'one-to-many', 'many-to-one', 'many-to-many'] as const).map(type => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.relationshipTypes.includes(type)}
                      onChange={(e) => {
                        const newTypes = e.target.checked
                          ? [...filters.relationshipTypes, type]
                          : filters.relationshipTypes.filter(t => t !== type);
                        handleFilterChange('relationshipTypes', newTypes);
                      }}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      {type}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Constraint Types */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Constraint Types
              </label>
              <div className="space-y-2">
                {(['foreign_key', 'primary_key', 'unique', 'check'] as const).map(type => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.constraintTypes.includes(type)}
                      onChange={(e) => {
                        const newTypes = e.target.checked
                          ? [...filters.constraintTypes, type]
                          : filters.constraintTypes.filter(t => t !== type);
                        handleFilterChange('constraintTypes', newTypes);
                      }}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      {CONSTRAINT_ICONS[type]} {type.replace('_', ' ')}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Options
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.showEnforcedOnly}
                    onChange={(e) => handleFilterChange('showEnforcedOnly', e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Enforced only
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.showCascadingOnly}
                    onChange={(e) => handleFilterChange('showCascadingOnly', e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Cascading only
                  </span>
                </label>
              </div>
            </div>

            {/* Reset */}
            <div className="flex items-end">
              <button
                onClick={resetFilters}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                         bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 
                         rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex h-full">
        {/* Visualization Area */}
        <div className="flex-1 relative overflow-hidden" style={{ height }}>
          {isLoadingRelationships || isLoadingTables ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Loading schema relationships...
                </p>
              </div>
            </div>
          ) : (
            <svg
              width="100%"
              height="100%"
              viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
              className="bg-gray-50 dark:bg-gray-900"
            >
              {/* Arrow marker definition */}
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon
                    points="0 0, 10 3.5, 0 7"
                    className="fill-gray-600 dark:fill-gray-400"
                  />
                </marker>
              </defs>

              {/* Relationship edges */}
              {edges.map(edge => {
                const sourceNode = highlightedTables.find(t => t.id === edge.source);
                const targetNode = highlightedTables.find(t => t.id === edge.target);
                
                if (!sourceNode || !targetNode) return null;

                return (
                  <RelationshipEdgeComponent
                    key={edge.id}
                    edge={edge}
                    sourceNode={sourceNode}
                    targetNode={targetNode}
                    isSelected={selectedRelationship === edge.id}
                    onClick={() => handleRelationshipSelect(edge)}
                  />
                );
              })}
            </svg>
          )}

          {/* Table nodes overlay */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="relative w-full h-full">
              {highlightedTables.map(table => (
                <div key={table.id} className="pointer-events-auto">
                  <TableNodeComponent
                    table={table}
                    isSelected={selectedTable === table.id}
                    onSelect={handleTableSelect}
                    onNavigate={enableNavigation ? handleTableNavigate : undefined}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Details Panel */}
        {showDetailsPanel && (selectedTable || selectedRelationship) && (
          <div className="w-80 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {selectedTable ? 'Table Details' : 'Relationship Details'}
                </h3>
                <button
                  onClick={() => {
                    setSelectedTable(null);
                    setSelectedRelationship(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  aria-label="Close details panel"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 overflow-y-auto">
              {selectedTable && (
                <div>
                  {/* Table details content */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {highlightedTables.find(t => t.id === selectedTable)?.displayName}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {highlightedTables.find(t => t.id === selectedTable)?.metadata?.description || 'No description available'}
                      </p>
                    </div>

                    <div>
                      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Related Tables
                      </h5>
                      <div className="space-y-1">
                        {edges
                          .filter(edge => edge.source === selectedTable || edge.target === selectedTable)
                          .map(edge => {
                            const relatedTable = edge.source === selectedTable ? edge.target : edge.source;
                            return (
                              <div key={edge.id} className="text-sm text-gray-600 dark:text-gray-400">
                                → {relatedTable} ({edge.relationshipType})
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedRelationshipDetails && (
                <div>
                  {/* Relationship details content */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {selectedRelationshipDetails.foreignKeyName}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {selectedRelationshipDetails.relationshipType} relationship
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Source:</span>
                        <p className="text-gray-600 dark:text-gray-400">
                          {selectedRelationshipDetails.sourceTable}.{selectedRelationshipDetails.sourceColumn}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Target:</span>
                        <p className="text-gray-600 dark:text-gray-400">
                          {selectedRelationshipDetails.targetTable}.{selectedRelationshipDetails.targetColumn}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-700 dark:text-gray-300">Enforced:</span>
                        <span className={selectedRelationshipDetails.isEnforced ? 'text-green-600' : 'text-red-600'}>
                          {selectedRelationshipDetails.isEnforced ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700 dark:text-gray-300">Cascade Delete:</span>
                        <span className={selectedRelationshipDetails.cascadeOnDelete ? 'text-green-600' : 'text-red-600'}>
                          {selectedRelationshipDetails.cascadeOnDelete ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700 dark:text-gray-300">Cascade Update:</span>
                        <span className={selectedRelationshipDetails.cascadeOnUpdate ? 'text-green-600' : 'text-red-600'}>
                          {selectedRelationshipDetails.cascadeOnUpdate ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
        Showing {filteredRelationships.length} of {relationships.length} relationships
        {selectedTable && ` • Table: ${selectedTable}`}
        {selectedRelationship && ` • Relationship: ${selectedRelationshipDetails?.foreignKeyName}`}
      </div>
    </div>
  );
};

export default SchemaRelationshipVisualizer;