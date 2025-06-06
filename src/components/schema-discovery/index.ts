/**
 * @fileoverview Schema Discovery Components Export Barrel
 * 
 * Centralized export structure for all schema discovery components providing clean imports
 * and consistent component usage across the application with TypeScript intellisense support.
 * 
 * This barrel file enables maintainable codebase organization per Section 3.2.6 UI Component 
 * Architecture requirements and supports React/Next.js Integration Requirements for component
 * reusability across schema management workflows.
 * 
 * Features:
 * - Clean module organization for maintainable codebase
 * - TypeScript 5.8+ with enhanced template literal types and improved inference
 * - Centralized component access for schema discovery features
 * - Component reusability across schema management workflows
 * 
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1.0
 */

// =============================================================================
// SCHEMA DISCOVERY COMPONENTS
// =============================================================================

/**
 * SchemaTreeBrowser - Hierarchical Database Exploration Component
 * 
 * Provides interactive tree-based navigation for database schemas with virtualized
 * rendering for 1000+ table datasets. Features include expandable nodes, search
 * filtering, and intelligent caching with React Query for optimal performance.
 * 
 * Key Features:
 * - TanStack Virtual integration for large schema datasets
 * - React Query caching with 300-second stale time
 * - Hierarchical tree navigation with progressive loading
 * - Real-time search and filtering capabilities
 * - WCAG 2.1 AA accessibility compliance
 * 
 * Usage:
 * ```tsx
 * import { SchemaTreeBrowser } from '@/components/schema-discovery';
 * 
 * <SchemaTreeBrowser
 *   serviceName="my-database"
 *   onTableSelect={(tableName) => handleTableSelection(tableName)}
 *   searchable={true}
 *   expandOnLoad={false}
 * />
 * ```
 */
export { SchemaTreeBrowser, default as SchemaTreeBrowserComponent } from './schema-tree-browser';

/**
 * SchemaMetadataViewer - Detailed Schema Information Display Component
 * 
 * Comprehensive metadata viewer for database tables, fields, indexes, constraints,
 * and relationships. Provides tabbed interface with search capabilities and 
 * detailed type information per Section 5.2 Component Details requirements.
 * 
 * Key Features:
 * - Tabbed interface for fields, indexes, constraints, and relationships
 * - Real-time search with 300ms debounced input
 * - Type-safe badge rendering for field types and constraints
 * - Interactive data tables with row selection callbacks
 * - Automatic metadata refresh with configurable intervals
 * 
 * Usage:
 * ```tsx
 * import { SchemaMetadataViewer } from '@/components/schema-discovery';
 * 
 * <SchemaMetadataViewer
 *   tableName="users"
 *   serviceName="my-database"
 *   onFieldSelect={(field) => handleFieldSelection(field)}
 *   autoRefresh={true}
 * />
 * ```
 */
export { SchemaMetadataViewer, default as SchemaMetadataViewerComponent } from './schema-metadata-viewer';

/**
 * SchemaSearchFilter - Advanced Search and Filtering Component
 * 
 * Sophisticated search interface with debounced input, filter presets, and 
 * real-time results using virtualized rendering for efficient display of 
 * large search result sets per Schema Discovery workflow requirements.
 * 
 * Key Features:
 * - Debounced search input with 300ms delay for optimal performance
 * - Advanced filtering by schema types, field types, and relationships
 * - Customizable filter presets with quick apply functionality
 * - TanStack Virtual rendering for 1000+ search results
 * - Real-time validation under 100ms response time
 * - React Hook Form integration with Zod schema validation
 * 
 * Usage:
 * ```tsx
 * import { SchemaSearchFilter } from '@/components/schema-discovery';
 * 
 * <SchemaSearchFilter
 *   onResultsChange={(results) => handleSearchResults(results)}
 *   onResultSelect={(result) => navigateToResult(result)}
 *   showAdvancedFilters={true}
 *   maxHeight={600}
 * />
 * ```
 */
export { SchemaSearchFilter, default as SchemaSearchFilterComponent } from './schema-search-filter';

/**
 * SchemaRelationshipVisualizer - Relationship Mapping and Navigation Component
 * 
 * Interactive visualization component for database table relationships and foreign
 * key constraints with relationship mapping capabilities per Section 2.1 Feature
 * Catalog requirements for comprehensive schema analysis.
 * 
 * Key Features:
 * - Interactive relationship diagram visualization
 * - Foreign key constraint mapping and analysis
 * - One-to-one, one-to-many, and many-to-many relationship support
 * - Constraint enforcement and cascade rule display
 * - Navigation to related tables and schema elements
 * - Responsive design with mobile-optimized touch interactions
 * 
 * Usage:
 * ```tsx
 * import { SchemaRelationshipVisualizer } from '@/components/schema-discovery';
 * 
 * <SchemaRelationshipVisualizer
 *   serviceName="my-database"
 *   tableName="users"
 *   onRelationshipSelect={(rel) => handleRelationshipNavigation(rel)}
 *   showConstraintDetails={true}
 * />
 * ```
 */
export { SchemaRelationshipVisualizer, default as SchemaRelationshipVisualizerComponent } from './schema-relationship-visualizer';

/**
 * SchemaExplorerNavigation - Breadcrumb Navigation and Path Tracking Component
 * 
 * Navigation breadcrumb system for schema exploration with bookmark management,
 * recent paths tracking, and path-based navigation per user experience requirements
 * for intuitive schema browsing workflows.
 * 
 * Key Features:
 * - Breadcrumb navigation with hierarchical path display
 * - Bookmark management for frequently accessed schema elements
 * - Recent paths history with quick access functionality
 * - Schema path persistence across browser sessions
 * - Keyboard navigation support with arrow key handling
 * - Search integration for quick path jumping
 * 
 * Usage:
 * ```tsx
 * import { SchemaExplorerNavigation } from '@/components/schema-discovery';
 * 
 * <SchemaExplorerNavigation
 *   currentPath="/my-database/public/users"
 *   onPathChange={(path) => handleNavigationChange(path)}
 *   showBookmarks={true}
 *   maxRecentPaths={10}
 * />
 * ```
 */
export { SchemaExplorerNavigation, default as SchemaExplorerNavigationComponent } from './schema-explorer-navigation';

/**
 * SchemaVirtualizedList - Efficient Large Dataset Rendering Component
 * 
 * High-performance virtualized list component optimized for rendering large
 * schema datasets with 1000+ tables per Section 5.2 scaling considerations.
 * Implements TanStack Virtual for optimal scroll performance and memory usage.
 * 
 * Key Features:
 * - TanStack Virtual integration for 1000+ item datasets
 * - Configurable item height estimation and overscan settings
 * - Infinite scrolling with progressive data loading
 * - Dynamic item sizing based on content complexity
 * - Optimized rendering with minimal re-renders
 * - Search result highlighting and filtering integration
 * 
 * Usage:
 * ```tsx
 * import { SchemaVirtualizedList } from '@/components/schema-discovery';
 * 
 * <SchemaVirtualizedList
 *   items={largeSchemaDataset}
 *   itemHeight={64}
 *   overscan={10}
 *   onItemSelect={(item) => handleItemSelection(item)}
 *   renderItem={(item, index) => <SchemaListItem {...item} />}
 * />
 * ```
 */
export { SchemaVirtualizedList, default as SchemaVirtualizedListComponent } from './schema-virtualized-list';

// =============================================================================
// TYPE EXPORTS
// =============================================================================

/**
 * Re-export commonly used types for external consumption
 * Enables clean type imports alongside component imports
 */

// Schema Tree Browser Types
export type {
  DatabaseSchema,
  SchemaTable,
  SchemaField,
  SchemaRelationship,
  TreeNode,
  SchemaTreeBrowserProps
} from './schema-tree-browser';

// Schema Metadata Viewer Types  
export type {
  SchemaField as MetadataSchemaField,
  SchemaIndex,
  SchemaConstraint,
  SchemaRelationship as MetadataSchemaRelationship,
  TableMetadata,
  SchemaMetadataViewerProps
} from './schema-metadata-viewer';

// Schema Search Filter Types
export type {
  SchemaFilterOptions,
  SchemaSearchResult,
  SchemaType,
  FieldType,
  RelationshipPattern,
  FilterPreset,
  SchemaSearchFilterProps
} from './schema-search-filter';

// =============================================================================
// UTILITY EXPORTS
// =============================================================================

/**
 * Schema Discovery Utilities
 * 
 * Common utilities and helper functions used across schema discovery components
 * for consistent behavior and shared functionality.
 */

/**
 * Schema type detection utility
 * Determines the schema type based on service configuration
 */
export const detectSchemaType = (serviceName: string, metadata?: Record<string, any>): SchemaType => {
  // Default implementation - would be enhanced based on actual service metadata
  const servicePrefix = serviceName.toLowerCase();
  
  if (servicePrefix.includes('mysql')) return 'mysql';
  if (servicePrefix.includes('postgres') || servicePrefix.includes('pg')) return 'postgresql';
  if (servicePrefix.includes('sqlserver') || servicePrefix.includes('mssql')) return 'sqlserver';
  if (servicePrefix.includes('oracle')) return 'oracle';
  if (servicePrefix.includes('mongo')) return 'mongodb';
  if (servicePrefix.includes('snowflake')) return 'snowflake';
  if (servicePrefix.includes('sqlite')) return 'sqlite';
  
  // Default fallback
  return 'mysql';
};

/**
 * Field type normalization utility
 * Normalizes database-specific field types to common FieldType enum
 */
export const normalizeFieldType = (dbType: string, schemaType: SchemaType): FieldType => {
  const normalizedType = dbType.toLowerCase();
  
  // String types
  if (normalizedType.includes('varchar') || normalizedType.includes('char') || normalizedType.includes('text')) {
    return normalizedType.includes('text') ? 'text' : 'string';
  }
  
  // Numeric types
  if (normalizedType.includes('int') || normalizedType.includes('bigint')) {
    return normalizedType.includes('bigint') ? 'bigint' : 'integer';
  }
  
  if (normalizedType.includes('decimal') || normalizedType.includes('numeric')) {
    return 'decimal';
  }
  
  if (normalizedType.includes('float') || normalizedType.includes('double') || normalizedType.includes('real')) {
    return 'float';
  }
  
  // Date/time types
  if (normalizedType.includes('timestamp')) return 'timestamp';
  if (normalizedType.includes('datetime')) return 'datetime';
  if (normalizedType.includes('date')) return 'date';
  
  // Boolean types
  if (normalizedType.includes('bool') || normalizedType.includes('bit')) return 'boolean';
  
  // JSON types
  if (normalizedType.includes('json')) return 'json';
  
  // UUID types
  if (normalizedType.includes('uuid') || normalizedType.includes('guid')) return 'uuid';
  
  // Binary types
  if (normalizedType.includes('blob') || normalizedType.includes('binary')) return 'binary';
  
  // Enum types
  if (normalizedType.includes('enum')) return 'enum';
  
  // Default fallback
  return 'string';
};

/**
 * Schema path builder utility
 * Constructs hierarchical paths for schema navigation
 */
export const buildSchemaPath = (
  serviceName: string, 
  databaseName?: string, 
  tableName?: string, 
  fieldName?: string
): string => {
  const parts = [serviceName];
  
  if (databaseName) parts.push(databaseName);
  if (tableName) parts.push(tableName);
  if (fieldName) parts.push(fieldName);
  
  return '/' + parts.join('/');
};

// =============================================================================
// VERSION AND METADATA
// =============================================================================

/**
 * Schema Discovery Component Library Metadata
 */
export const SCHEMA_DISCOVERY_VERSION = '1.0.0';
export const SCHEMA_DISCOVERY_BUILD_TARGET = 'React 19.0.0 / Next.js 15.1.0';
export const SCHEMA_DISCOVERY_AUTHOR = 'DreamFactory Admin Interface';

/**
 * Component library feature flags for progressive enhancement
 */
export const SCHEMA_DISCOVERY_FEATURES = {
  /** Enable TanStack Virtual for large datasets */
  VIRTUALIZATION: true,
  /** Enable React Query integration for intelligent caching */
  QUERY_CACHING: true,
  /** Enable advanced search and filtering */
  ADVANCED_SEARCH: true,
  /** Enable relationship visualization */
  RELATIONSHIP_MAPPING: true,
  /** Enable bookmark and navigation features */
  NAVIGATION_BOOKMARKS: true,
  /** Enable accessibility features (WCAG 2.1 AA) */
  ACCESSIBILITY: true,
} as const;