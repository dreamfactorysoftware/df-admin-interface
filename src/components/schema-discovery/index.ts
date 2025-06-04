/**
 * Schema Discovery Components - Export Barrel
 * 
 * Centralized export file providing access to all schema discovery components
 * per React/Next.js Integration Requirements and TypeScript 5.8+ best practices.
 * 
 * This barrel export enables clean imports across the application and maintains
 * consistent component usage patterns for schema management workflows.
 * 
 * @see Section 3.2.6 UI Component Architecture
 * @see Section 5.2 Component Details - Schema Discovery and Browsing Component
 */

// Core schema browsing component for hierarchical database exploration
// Implements TanStack Virtual for progressive loading of large schemas (1000+ tables)
export { default as SchemaTreeBrowser } from './schema-tree-browser';
export type { SchemaTreeBrowserProps } from './schema-tree-browser';

// Detailed schema metadata display component
// Features responsive design with React Query for real-time data updates
export { default as SchemaMetadataViewer } from './schema-metadata-viewer';
export type { SchemaMetadataViewerProps } from './schema-metadata-viewer';

// Advanced search and filtering component for schema discovery
// Integrates debounced input handling with TanStack Virtual for large result sets
export { default as SchemaSearchFilter } from './schema-search-filter';
export type { SchemaSearchFilterProps } from './schema-search-filter';

// Interactive relationship visualization component
// Provides foreign key constraint visualization and navigation between related tables
export { default as SchemaRelationshipVisualizer } from './schema-relationship-visualizer';
export type { SchemaRelationshipVisualizerProps } from './schema-relationship-visualizer';

// Navigation component for breadcrumb trails and schema path tracking
// Features navigation history, bookmarking, and quick access to frequently viewed schemas
export { default as SchemaExplorerNavigation } from './schema-explorer-navigation';
export type { SchemaExplorerNavigationProps } from './schema-explorer-navigation';

// Virtualized list component for efficient rendering of large schema datasets
// Optimized for enterprise-scale databases with progressive loading and sorting
export { default as SchemaVirtualizedList } from './schema-virtualized-list';
export type { SchemaVirtualizedListProps } from './schema-virtualized-list';