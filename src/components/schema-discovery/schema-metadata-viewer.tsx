'use client';

import React, { useState, useMemo } from 'react';
import { 
  MagnifyingGlassIcon, 
  TableCellsIcon, 
  KeyIcon, 
  LinkIcon,
  InformationCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

// Types for schema metadata based on DreamFactory API patterns
interface SchemaField {
  name: string;
  type: string;
  length?: number;
  nullable: boolean;
  default?: string;
  comment?: string;
  primaryKey?: boolean;
  foreignKey?: {
    table: string;
    column: string;
  };
  autoIncrement?: boolean;
}

interface SchemaIndex {
  name: string;
  type: 'PRIMARY' | 'UNIQUE' | 'INDEX' | 'FULLTEXT';
  columns: string[];
  comment?: string;
}

interface SchemaConstraint {
  name: string;
  type: 'PRIMARY KEY' | 'FOREIGN KEY' | 'UNIQUE' | 'CHECK';
  columns: string[];
  referencedTable?: string;
  referencedColumns?: string[];
  onUpdate?: string;
  onDelete?: string;
}

interface SchemaRelationship {
  type: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
  localTable: string;
  localColumn: string;
  foreignTable: string;
  foreignColumn: string;
  constraintName?: string;
}

interface TableMetadata {
  name: string;
  schema?: string;
  type: 'table' | 'view';
  comment?: string;
  fields: SchemaField[];
  indexes: SchemaIndex[];
  constraints: SchemaConstraint[];
  relationships: SchemaRelationship[];
  rowCount?: number;
  collation?: string;
  engine?: string;
  created?: string;
  updated?: string;
}

interface SchemaMetadataViewerProps {
  tableName: string;
  serviceName: string;
  className?: string;
  onFieldSelect?: (field: SchemaField) => void;
  onRelationshipSelect?: (relationship: SchemaRelationship) => void;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

// Mock data fetching hook (will be replaced by actual use-schema-metadata hook)
const useSchemaMetadata = (serviceName: string, tableName: string, options?: {
  autoRefresh?: boolean;
  refreshInterval?: number;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Mock data - in real implementation this would use React Query
  const data: TableMetadata = {
    name: tableName,
    schema: 'public',
    type: 'table',
    comment: 'User accounts and authentication data',
    rowCount: 15420,
    collation: 'utf8mb4_unicode_ci',
    engine: 'InnoDB',
    created: '2024-01-15T10:30:00Z',
    updated: '2024-12-20T14:22:00Z',
    fields: [
      {
        name: 'id',
        type: 'int',
        length: 11,
        nullable: false,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Primary key identifier'
      },
      {
        name: 'email',
        type: 'varchar',
        length: 255,
        nullable: false,
        comment: 'User email address (unique)'
      },
      {
        name: 'password_hash',
        type: 'varchar',
        length: 255,
        nullable: false,
        comment: 'Encrypted password hash'
      },
      {
        name: 'first_name',
        type: 'varchar',
        length: 100,
        nullable: true,
        comment: 'User first name'
      },
      {
        name: 'last_name',
        type: 'varchar',
        length: 100,
        nullable: true,
        comment: 'User last name'
      },
      {
        name: 'role_id',
        type: 'int',
        length: 11,
        nullable: false,
        foreignKey: {
          table: 'roles',
          column: 'id'
        },
        comment: 'Reference to user role'
      },
      {
        name: 'created_at',
        type: 'timestamp',
        nullable: false,
        default: 'CURRENT_TIMESTAMP',
        comment: 'Record creation timestamp'
      },
      {
        name: 'updated_at',
        type: 'timestamp',
        nullable: false,
        default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
        comment: 'Record last update timestamp'
      }
    ],
    indexes: [
      {
        name: 'PRIMARY',
        type: 'PRIMARY',
        columns: ['id']
      },
      {
        name: 'idx_email_unique',
        type: 'UNIQUE',
        columns: ['email'],
        comment: 'Unique constraint on email field'
      },
      {
        name: 'idx_role_id',
        type: 'INDEX',
        columns: ['role_id'],
        comment: 'Index for role foreign key lookups'
      },
      {
        name: 'idx_created_at',
        type: 'INDEX',
        columns: ['created_at'],
        comment: 'Index for date-based queries'
      }
    ],
    constraints: [
      {
        name: 'PRIMARY',
        type: 'PRIMARY KEY',
        columns: ['id']
      },
      {
        name: 'fk_users_role_id',
        type: 'FOREIGN KEY',
        columns: ['role_id'],
        referencedTable: 'roles',
        referencedColumns: ['id'],
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      {
        name: 'uk_users_email',
        type: 'UNIQUE',
        columns: ['email']
      }
    ],
    relationships: [
      {
        type: 'many-to-one',
        localTable: 'users',
        localColumn: 'role_id',
        foreignTable: 'roles',
        foreignColumn: 'id',
        constraintName: 'fk_users_role_id'
      },
      {
        type: 'one-to-many',
        localTable: 'users',
        localColumn: 'id',
        foreignTable: 'user_sessions',
        foreignColumn: 'user_id',
        constraintName: 'fk_sessions_user_id'
      },
      {
        type: 'one-to-many',
        localTable: 'users',
        localColumn: 'id',
        foreignTable: 'user_preferences',
        foreignColumn: 'user_id',
        constraintName: 'fk_preferences_user_id'
      }
    ]
  };

  return {
    data,
    isLoading,
    error,
    refetch: () => setIsLoading(true)
  };
};

// Simple debounce utility
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Card component (simplified version of what would be in ui/card.tsx)
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm ${className}`}>
    {children}
  </div>
);

const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <div className={`px-6 py-4 border-b border-gray-200 dark:border-gray-700 ${className}`}>
    {children}
  </div>
);

const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <div className={`px-6 py-4 ${className}`}>
    {children}
  </div>
);

// Badge component (simplified version of what would be in ui/badge.tsx)
const Badge: React.FC<{ 
  children: React.ReactNode; 
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
}> = ({ 
  children, 
  variant = 'default', 
  className = '' 
}) => {
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    primary: 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300',
    success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

// Tabs component (simplified version)
const Tabs: React.FC<{ 
  children: React.ReactNode;
  defaultValue: string;
  className?: string;
}> = ({ children, defaultValue, className = '' }) => {
  const [activeTab, setActiveTab] = useState(defaultValue);

  return (
    <div className={`w-full ${className}`} data-active-tab={activeTab}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { activeTab, setActiveTab });
        }
        return child;
      })}
    </div>
  );
};

const TabsList: React.FC<{ 
  children: React.ReactNode;
  className?: string;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}> = ({ children, className = '', activeTab, setActiveTab }) => (
  <div className={`inline-flex h-10 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-800 p-1 text-gray-500 dark:text-gray-400 ${className}`}>
    {React.Children.map(children, child => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child, { activeTab, setActiveTab });
      }
      return child;
    })}
  </div>
);

const TabsTrigger: React.FC<{ 
  children: React.ReactNode;
  value: string;
  className?: string;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}> = ({ children, value, className = '', activeTab, setActiveTab }) => {
  const isActive = activeTab === value;
  
  return (
    <button
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
        isActive 
          ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' 
          : 'hover:bg-gray-200 dark:hover:bg-gray-700'
      } ${className}`}
      onClick={() => setActiveTab?.(value)}
      role="tab"
      aria-selected={isActive}
    >
      {children}
    </button>
  );
};

const TabsContent: React.FC<{ 
  children: React.ReactNode;
  value: string;
  className?: string;
  activeTab?: string;
}> = ({ children, value, className = '', activeTab }) => {
  if (activeTab !== value) return null;
  
  return (
    <div className={`mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${className}`}>
      {children}
    </div>
  );
};

// Data Table component (simplified version)
const DataTable: React.FC<{
  data: any[];
  columns: Array<{
    key: string;
    header: string;
    render?: (value: any, row: any) => React.ReactNode;
  }>;
  className?: string;
  onRowClick?: (row: any) => void;
}> = ({ data, columns, className = '', onRowClick }) => (
  <div className={`overflow-hidden ${className}`}>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {data.map((row, index) => (
            <tr
              key={index}
              className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${
                onRowClick ? 'cursor-pointer' : ''
              }`}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
                >
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// Main component
export const SchemaMetadataViewer: React.FC<SchemaMetadataViewerProps> = ({
  tableName,
  serviceName,
  className = '',
  onFieldSelect,
  onRelationshipSelect,
  autoRefresh = true,
  refreshInterval = 30000
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['fields', 'overview'])
  );

  // Debounce search input for performance optimization
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Fetch table metadata with React Query (mocked for now)
  const {
    data: metadata,
    isLoading,
    error,
    refetch
  } = useSchemaMetadata(serviceName, tableName, {
    autoRefresh,
    refreshInterval
  });

  // Filter fields based on search term
  const filteredFields = useMemo(() => {
    if (!metadata?.fields || !debouncedSearchTerm) return metadata?.fields || [];
    
    return metadata.fields.filter(field =>
      field.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      field.type.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      field.comment?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [metadata?.fields, debouncedSearchTerm]);

  // Filter other entities based on search term
  const filteredIndexes = useMemo(() => {
    if (!metadata?.indexes || !debouncedSearchTerm) return metadata?.indexes || [];
    
    return metadata.indexes.filter(index =>
      index.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      index.columns.some(col => col.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
    );
  }, [metadata?.indexes, debouncedSearchTerm]);

  const filteredConstraints = useMemo(() => {
    if (!metadata?.constraints || !debouncedSearchTerm) return metadata?.constraints || [];
    
    return metadata.constraints.filter(constraint =>
      constraint.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      constraint.columns.some(col => col.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
    );
  }, [metadata?.constraints, debouncedSearchTerm]);

  const filteredRelationships = useMemo(() => {
    if (!metadata?.relationships || !debouncedSearchTerm) return metadata?.relationships || [];
    
    return metadata.relationships.filter(rel =>
      rel.localColumn.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      rel.foreignTable.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      rel.foreignColumn.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [metadata?.relationships, debouncedSearchTerm]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const getFieldTypeBadgeVariant = (type: string): 'primary' | 'success' | 'warning' | 'info' => {
    if (type.includes('int') || type.includes('decimal') || type.includes('float')) return 'info';
    if (type.includes('varchar') || type.includes('text') || type.includes('char')) return 'primary';
    if (type.includes('timestamp') || type.includes('date') || type.includes('time')) return 'warning';
    if (type.includes('bool') || type.includes('bit')) return 'success';
    return 'primary';
  };

  const getConstraintTypeBadgeVariant = (type: string): 'primary' | 'success' | 'warning' | 'error' => {
    switch (type) {
      case 'PRIMARY KEY': return 'error';
      case 'FOREIGN KEY': return 'warning';
      case 'UNIQUE': return 'success';
      case 'CHECK': return 'primary';
      default: return 'primary';
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading metadata...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <InformationCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Failed to load metadata
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {error.message || 'An unexpected error occurred while loading table metadata.'}
        </p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!metadata) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <TableCellsIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">No metadata available for this table.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {metadata.name}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="info">{metadata.type}</Badge>
            {metadata.schema && (
              <Badge variant="default">{metadata.schema}</Badge>
            )}
            {metadata.rowCount !== undefined && (
              <Badge variant="success">{metadata.rowCount.toLocaleString()} rows</Badge>
            )}
          </div>
        </div>
        
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search fields, types, comments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            aria-label="Search table metadata"
          />
        </div>
      </div>

      {/* Table Overview */}
      <Card>
        <CardHeader className="cursor-pointer" onClick={() => toggleSection('overview')}>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
              <InformationCircleIcon className="h-5 w-5 mr-2" />
              Table Overview
            </h3>
            {expandedSections.has('overview') ? (
              <ChevronDownIcon className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronRightIcon className="h-5 w-5 text-gray-500" />
            )}
          </div>
        </CardHeader>
        
        {expandedSections.has('overview') && (
          <CardContent>
            {metadata.comment && (
              <p className="text-gray-600 dark:text-gray-400 mb-4">{metadata.comment}</p>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {metadata.engine && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Engine</dt>
                  <dd className="text-sm text-gray-900 dark:text-gray-100">{metadata.engine}</dd>
                </div>
              )}
              {metadata.collation && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Collation</dt>
                  <dd className="text-sm text-gray-900 dark:text-gray-100">{metadata.collation}</dd>
                </div>
              )}
              {metadata.created && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</dt>
                  <dd className="text-sm text-gray-900 dark:text-gray-100">
                    {new Date(metadata.created).toLocaleDateString()}
                  </dd>
                </div>
              )}
              {metadata.updated && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</dt>
                  <dd className="text-sm text-gray-900 dark:text-gray-100">
                    {new Date(metadata.updated).toLocaleDateString()}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Fields</dt>
                <dd className="text-sm text-gray-900 dark:text-gray-100">{metadata.fields.length}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Relationships</dt>
                <dd className="text-sm text-gray-900 dark:text-gray-100">{metadata.relationships.length}</dd>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Tabbed Content */}
      <Tabs defaultValue="fields" className="w-full">
        <TabsList>
          <TabsTrigger value="fields">
            Fields ({filteredFields.length})
          </TabsTrigger>
          <TabsTrigger value="indexes">
            Indexes ({filteredIndexes.length})
          </TabsTrigger>
          <TabsTrigger value="constraints">
            Constraints ({filteredConstraints.length})
          </TabsTrigger>
          <TabsTrigger value="relationships">
            Relationships ({filteredRelationships.length})
          </TabsTrigger>
        </TabsList>

        {/* Fields Tab */}
        <TabsContent value="fields">
          <Card>
            <CardContent className="p-0">
              <DataTable
                data={filteredFields}
                onRowClick={onFieldSelect}
                columns={[
                  {
                    key: 'name',
                    header: 'Field Name',
                    render: (name, field) => (
                      <div className="flex items-center">
                        <span className="font-medium">{name}</span>
                        {field.primaryKey && (
                          <KeyIcon className="h-4 w-4 ml-2 text-yellow-500" aria-label="Primary key" />
                        )}
                        {field.foreignKey && (
                          <LinkIcon className="h-4 w-4 ml-2 text-blue-500" aria-label="Foreign key" />
                        )}
                      </div>
                    )
                  },
                  {
                    key: 'type',
                    header: 'Type',
                    render: (type, field) => (
                      <Badge variant={getFieldTypeBadgeVariant(type)}>
                        {type}{field.length ? `(${field.length})` : ''}
                      </Badge>
                    )
                  },
                  {
                    key: 'nullable',
                    header: 'Nullable',
                    render: (nullable) => (
                      <Badge variant={nullable ? 'warning' : 'success'}>
                        {nullable ? 'Yes' : 'No'}
                      </Badge>
                    )
                  },
                  {
                    key: 'default',
                    header: 'Default',
                    render: (defaultValue) => (
                      defaultValue ? (
                        <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                          {defaultValue}
                        </code>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )
                    )
                  },
                  {
                    key: 'comment',
                    header: 'Description',
                    render: (comment) => (
                      comment ? (
                        <span className="text-gray-600 dark:text-gray-400">{comment}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )
                    )
                  }
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Indexes Tab */}
        <TabsContent value="indexes">
          <Card>
            <CardContent className="p-0">
              <DataTable
                data={filteredIndexes}
                columns={[
                  {
                    key: 'name',
                    header: 'Index Name',
                    render: (name) => <span className="font-medium">{name}</span>
                  },
                  {
                    key: 'type',
                    header: 'Type',
                    render: (type) => (
                      <Badge variant={type === 'PRIMARY' ? 'error' : type === 'UNIQUE' ? 'success' : 'info'}>
                        {type}
                      </Badge>
                    )
                  },
                  {
                    key: 'columns',
                    header: 'Columns',
                    render: (columns) => (
                      <div className="flex flex-wrap gap-1">
                        {columns.map((col: string, idx: number) => (
                          <Badge key={idx} variant="default" className="text-xs">
                            {col}
                          </Badge>
                        ))}
                      </div>
                    )
                  },
                  {
                    key: 'comment',
                    header: 'Description',
                    render: (comment) => (
                      comment ? (
                        <span className="text-gray-600 dark:text-gray-400">{comment}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )
                    )
                  }
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Constraints Tab */}
        <TabsContent value="constraints">
          <Card>
            <CardContent className="p-0">
              <DataTable
                data={filteredConstraints}
                columns={[
                  {
                    key: 'name',
                    header: 'Constraint Name',
                    render: (name) => <span className="font-medium">{name}</span>
                  },
                  {
                    key: 'type',
                    header: 'Type',
                    render: (type) => (
                      <Badge variant={getConstraintTypeBadgeVariant(type)}>
                        {type}
                      </Badge>
                    )
                  },
                  {
                    key: 'columns',
                    header: 'Columns',
                    render: (columns) => (
                      <div className="flex flex-wrap gap-1">
                        {columns.map((col: string, idx: number) => (
                          <Badge key={idx} variant="default" className="text-xs">
                            {col}
                          </Badge>
                        ))}
                      </div>
                    )
                  },
                  {
                    key: 'referencedTable',
                    header: 'References',
                    render: (referencedTable, constraint) => (
                      referencedTable ? (
                        <span className="text-blue-600 dark:text-blue-400">
                          {referencedTable}({constraint.referencedColumns?.join(', ')})
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )
                    )
                  }
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Relationships Tab */}
        <TabsContent value="relationships">
          <Card>
            <CardContent className="p-0">
              <DataTable
                data={filteredRelationships}
                onRowClick={onRelationshipSelect}
                columns={[
                  {
                    key: 'type',
                    header: 'Type',
                    render: (type) => (
                      <Badge variant="primary" className="text-xs">
                        {type}
                      </Badge>
                    )
                  },
                  {
                    key: 'localColumn',
                    header: 'Local Column',
                    render: (localColumn) => (
                      <span className="font-medium">{localColumn}</span>
                    )
                  },
                  {
                    key: 'foreignTable',
                    header: 'Related Table',
                    render: (foreignTable, relationship) => (
                      <span className="text-blue-600 dark:text-blue-400">
                        {foreignTable}.{relationship.foreignColumn}
                      </span>
                    )
                  },
                  {
                    key: 'constraintName',
                    header: 'Constraint',
                    render: (constraintName) => (
                      constraintName ? (
                        <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                          {constraintName}
                        </code>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )
                    )
                  }
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SchemaMetadataViewer;