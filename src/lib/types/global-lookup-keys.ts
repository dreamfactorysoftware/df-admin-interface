/**
 * Global Lookup Key Types
 * 
 * This module provides type definitions for global lookup key management
 * in the DreamFactory Admin Interface. These types maintain full compatibility
 * with existing backend APIs while supporting React component integration
 * patterns including React Hook Form, React Query, and table components.
 * 
 * Key Features:
 * - Maintains backend API compatibility with DreamFactory Core
 * - Supports React Hook Form integration for lookup key management
 * - Provides types for React Query cache management and data fetching
 * - Includes table component interfaces for lookup key listings
 * - Supports React component state management patterns
 * 
 * @module GlobalLookupKeyTypes
 */

/**
 * Global Lookup Key Entity
 * 
 * Represents a global lookup key as returned by the DreamFactory API.
 * This interface maintains exact compatibility with the backend API
 * response format and should not be modified to preserve API contracts.
 * 
 * Used for:
 * - API response type safety
 * - Database entity representation
 * - React component prop types
 * - React Query cache types
 * 
 * @interface LookupKeyType
 * @example
 * ```typescript
 * // React component using lookup key data
 * const LookupKeyDisplay: React.FC<{ lookupKey: LookupKeyType }> = ({ lookupKey }) => {
 *   return (
 *     <div>
 *       <h3>{lookupKey.name}</h3>
 *       <p>{lookupKey.value}</p>
 *       <span>{lookupKey.private ? 'Private' : 'Public'}</span>
 *     </div>
 *   );
 * };
 * 
 * // React Query usage
 * const { data: lookupKeys } = useQuery<LookupKeyType[]>({
 *   queryKey: ['lookupKeys'],
 *   queryFn: () => fetchLookupKeys()
 * });
 * ```
 */
export interface LookupKeyType {
  /** Unique identifier for the lookup key (auto-generated on create) */
  id?: number;
  
  /** Name/key identifier for the lookup value */
  name: string;
  
  /** The lookup value associated with the key */
  value: string;
  
  /** Whether this lookup key is private (restricted access) */
  private: boolean;
  
  /** Optional description explaining the purpose of this lookup key */
  description?: string;
  
  /** ISO string timestamp when the lookup key was created */
  created_date?: string;
  
  /** ISO string timestamp when the lookup key was last modified */
  last_modified_date?: string;
  
  /** ID of the user who created this lookup key */
  created_by_id?: number;
  
  /** ID of the user who last modified this lookup key */
  last_modified_by_id?: number;
}

/**
 * Lookup Key Table Row Data
 * 
 * Simplified interface for displaying lookup keys in React table components.
 * Contains essential fields needed for table listing views with performance
 * optimization for large datasets.
 * 
 * Used for:
 * - React table component data prop
 * - List view optimizations
 * - Search and filter operations
 * - Bulk operations selection
 * 
 * @interface LookupKeyRow
 * @example
 * ```typescript
 * // React table component integration
 * const LookupKeyTable: React.FC<{ data: LookupKeyRow[] }> = ({ data }) => {
 *   const columns = [
 *     { key: 'name', header: 'Name' },
 *     { key: 'value', header: 'Value' },
 *     { key: 'private', header: 'Private' }
 *   ];
 *   
 *   return <DataTable data={data} columns={columns} />;
 * };
 * ```
 */
export interface LookupKeyRow {
  /** Unique identifier for row operations */
  id: number;
  
  /** Display name for the lookup key */
  name: string;
  
  /** The lookup value (may be truncated for display) */
  value: string;
  
  /** Privacy status for access control display */
  private: boolean;
  
  /** Optional description for tooltip or expanded view */
  description?: string;
}

/**
 * Create Lookup Key Payload
 * 
 * Data structure for creating new global lookup keys.
 * Excludes auto-generated fields (id, timestamps) and includes
 * only user-provided data for React Hook Form integration.
 * 
 * Used for:
 * - React Hook Form schema validation
 * - API request payloads
 * - Form component prop types
 * - Zod schema definitions
 * 
 * @interface CreateLookupKeyPayload
 * @example
 * ```typescript
 * // React Hook Form usage
 * const { register, handleSubmit } = useForm<CreateLookupKeyPayload>();
 * 
 * const onSubmit = async (data: CreateLookupKeyPayload) => {
 *   await createLookupKey(data);
 * };
 * 
 * // Form JSX
 * <form onSubmit={handleSubmit(onSubmit)}>
 *   <input {...register('name', { required: true })} />
 *   <input {...register('value', { required: true })} />
 *   <input type="checkbox" {...register('private')} />
 *   <textarea {...register('description')} />
 * </form>
 * ```
 */
export interface CreateLookupKeyPayload {
  /** Name/key identifier for the lookup value */
  name: string;
  
  /** The lookup value to store */
  value: string;
  
  /** Whether this lookup key should be private (default: false) */
  private: boolean;
  
  /** Optional description explaining the purpose */
  description?: string;
}

/**
 * Update Lookup Key Payload
 * 
 * Data structure for updating existing global lookup keys.
 * All fields are optional to support partial updates through
 * React Hook Form and PATCH operations.
 * 
 * Used for:
 * - React Hook Form edit forms
 * - API PATCH request payloads
 * - Optimistic update operations
 * - Form component prop types
 * 
 * @interface UpdateLookupKeyPayload
 * @example
 * ```typescript
 * // React Hook Form update usage
 * const { register, handleSubmit } = useForm<UpdateLookupKeyPayload>({
 *   defaultValues: existingLookupKey
 * });
 * 
 * const onUpdate = async (data: UpdateLookupKeyPayload) => {
 *   await updateLookupKey(lookupKeyId, data);
 * };
 * ```
 */
export interface UpdateLookupKeyPayload {
  /** Updated name/key identifier */
  name?: string;
  
  /** Updated lookup value */
  value?: string;
  
  /** Updated privacy setting */
  private?: boolean;
  
  /** Updated description */
  description?: string;
}

/**
 * Lookup Key Form Data
 * 
 * Extended interface combining entity data with form-specific
 * metadata for React Hook Form integration. Includes validation
 * state and UI-specific properties.
 * 
 * Used for:
 * - React Hook Form TypeScript integration
 * - Form component state management
 * - Validation error handling
 * - Form field configuration
 * 
 * @interface LookupKeyFormData
 * @example
 * ```typescript
 * // Advanced form integration
 * const LookupKeyForm: React.FC<{ initialData?: LookupKeyFormData }> = ({ initialData }) => {
 *   const {
 *     register,
 *     handleSubmit,
 *     formState: { errors, isSubmitting }
 *   } = useForm<LookupKeyFormData>({
 *     defaultValues: initialData
 *   });
 * 
 *   return (
 *     <form>
 *       <div>
 *         <input
 *           {...register('name', {
 *             required: 'Name is required',
 *             maxLength: { value: 255, message: 'Name too long' }
 *           })}
 *         />
 *         {errors.name && <span>{errors.name.message}</span>}
 *       </div>
 *     </form>
 *   );
 * };
 * ```
 */
export interface LookupKeyFormData extends CreateLookupKeyPayload {
  /** Form field ID for React Hook Form registration */
  id?: number;
  
  /** Form mode to determine validation rules */
  mode?: 'create' | 'edit';
  
  /** Whether the form is in a loading state */
  isLoading?: boolean;
  
  /** Whether the form has been modified */
  isDirty?: boolean;
}

/**
 * Lookup Key Component Props
 * 
 * Common prop interface for React components that display or manage
 * lookup keys. Provides type safety for component composition and
 * consistent prop patterns across the application.
 * 
 * Used for:
 * - React component prop types
 * - Component composition patterns
 * - Event handler type safety
 * - React component documentation
 * 
 * @interface LookupKeyComponentProps
 * @example
 * ```typescript
 * // Component implementation
 * const LookupKeyManager: React.FC<LookupKeyComponentProps> = ({
 *   lookupKey,
 *   onEdit,
 *   onDelete,
 *   onSelect,
 *   readonly = false,
 *   className
 * }) => {
 *   return (
 *     <div className={className}>
 *       <LookupKeyDisplay lookupKey={lookupKey} />
 *       {!readonly && (
 *         <div>
 *           <button onClick={() => onEdit?.(lookupKey)}>Edit</button>
 *           <button onClick={() => onDelete?.(lookupKey.id!)}>Delete</button>
 *         </div>
 *       )}
 *     </div>
 *   );
 * };
 * ```
 */
export interface LookupKeyComponentProps {
  /** The lookup key data to display/manage */
  lookupKey: LookupKeyType;
  
  /** Optional callback when lookup key is edited */
  onEdit?: (lookupKey: LookupKeyType) => void;
  
  /** Optional callback when lookup key is deleted */
  onDelete?: (id: number) => void;
  
  /** Optional callback when lookup key is selected */
  onSelect?: (lookupKey: LookupKeyType) => void;
  
  /** Whether the component is in read-only mode */
  readonly?: boolean;
  
  /** Additional CSS classes for styling */
  className?: string;
  
  /** Test ID for automated testing */
  'data-testid'?: string;
}

/**
 * Lookup Key List Component Props
 * 
 * Props interface for React components that display lists of lookup keys.
 * Supports pagination, filtering, sorting, and bulk operations commonly
 * needed in administrative interfaces.
 * 
 * Used for:
 * - Table component prop types
 * - List view component integration
 * - Bulk operation handlers
 * - Search and filter integration
 * 
 * @interface LookupKeyListProps
 * @example
 * ```typescript
 * // List component usage
 * const LookupKeyList: React.FC<LookupKeyListProps> = ({
 *   lookupKeys,
 *   loading,
 *   onEdit,
 *   onDelete,
 *   onBulkDelete,
 *   searchTerm,
 *   onSearchChange
 * }) => {
 *   const [selectedKeys, setSelectedKeys] = useState<number[]>([]);
 * 
 *   const filteredKeys = lookupKeys.filter(key =>
 *     key.name.toLowerCase().includes(searchTerm.toLowerCase())
 *   );
 * 
 *   return (
 *     <div>
 *       <SearchInput value={searchTerm} onChange={onSearchChange} />
 *       <LookupKeyTable 
 *         data={filteredKeys}
 *         loading={loading}
 *         onRowEdit={onEdit}
 *         onRowDelete={onDelete}
 *         selectedRows={selectedKeys}
 *         onSelectionChange={setSelectedKeys}
 *       />
 *       {selectedKeys.length > 0 && (
 *         <button onClick={() => onBulkDelete?.(selectedKeys)}>
 *           Delete Selected
 *         </button>
 *       )}
 *     </div>
 *   );
 * };
 * ```
 */
export interface LookupKeyListProps {
  /** Array of lookup keys to display */
  lookupKeys: LookupKeyType[];
  
  /** Loading state for async operations */
  loading?: boolean;
  
  /** Error state for error handling */
  error?: string | null;
  
  /** Search term for filtering */
  searchTerm?: string;
  
  /** Callback for search term changes */
  onSearchChange?: (term: string) => void;
  
  /** Callback for editing a lookup key */
  onEdit?: (lookupKey: LookupKeyType) => void;
  
  /** Callback for deleting a single lookup key */
  onDelete?: (id: number) => void;
  
  /** Callback for bulk delete operations */
  onBulkDelete?: (ids: number[]) => void;
  
  /** Callback for creating new lookup keys */
  onCreate?: () => void;
  
  /** Whether bulk operations are enabled */
  enableBulkOperations?: boolean;
  
  /** Additional CSS classes */
  className?: string;
}

/**
 * Lookup Key Filter Options
 * 
 * Configuration interface for filtering lookup keys in React components.
 * Supports various filter criteria commonly used in administrative
 * interfaces for lookup key management.
 * 
 * Used for:
 * - Search and filter components
 * - React Query filter parameters
 * - URL search params integration
 * - Advanced filtering UI
 * 
 * @interface LookupKeyFilters
 * @example
 * ```typescript
 * // Filter integration
 * const useLookupKeyFilters = () => {
 *   const [filters, setFilters] = useState<LookupKeyFilters>({});
 * 
 *   const { data: lookupKeys } = useQuery({
 *     queryKey: ['lookupKeys', filters],
 *     queryFn: () => fetchLookupKeys(filters)
 *   });
 * 
 *   return { lookupKeys, filters, setFilters };
 * };
 * ```
 */
export interface LookupKeyFilters {
  /** Text search across name, value, and description */
  search?: string;
  
  /** Filter by privacy setting */
  private?: boolean;
  
  /** Filter by creation date range */
  createdAfter?: string;
  createdBefore?: string;
  
  /** Filter by last modified date range */
  modifiedAfter?: string;
  modifiedBefore?: string;
  
  /** Filter by creator user ID */
  createdBy?: number;
  
  /** Filter by last modifier user ID */
  lastModifiedBy?: number;
  
  /** Sort field and direction */
  sortBy?: 'name' | 'value' | 'created_date' | 'last_modified_date';
  sortDirection?: 'asc' | 'desc';
  
  /** Pagination parameters */
  page?: number;
  pageSize?: number;
}

/**
 * Lookup Key Validation Rules
 * 
 * Validation configuration for React Hook Form and Zod schema
 * integration. Defines business rules and constraints for
 * lookup key data validation.
 * 
 * Used for:
 * - React Hook Form validation rules
 * - Zod schema definitions
 * - Client-side validation
 * - Form error messages
 * 
 * @interface LookupKeyValidationRules
 * @example
 * ```typescript
 * // React Hook Form validation
 * const validationRules: LookupKeyValidationRules = {
 *   name: {
 *     required: 'Name is required',
 *     maxLength: { value: 255, message: 'Name must be 255 characters or less' },
 *     pattern: {
 *       value: /^[a-zA-Z0-9_-]+$/,
 *       message: 'Name can only contain letters, numbers, underscores, and hyphens'
 *     }
 *   },
 *   value: {
 *     required: 'Value is required',
 *     maxLength: { value: 4000, message: 'Value must be 4000 characters or less' }
 *   }
 * };
 * 
 * // Usage in form
 * <input {...register('name', validationRules.name)} />
 * ```
 */
export interface LookupKeyValidationRules {
  name: {
    required: string;
    maxLength: { value: number; message: string };
    pattern?: { value: RegExp; message: string };
  };
  value: {
    required: string;
    maxLength: { value: number; message: string };
  };
  description?: {
    maxLength: { value: number; message: string };
  };
}

/**
 * Type alias for backward compatibility with existing code.
 * Maintains the original interface name while supporting the
 * new type system architecture.
 * 
 * @deprecated Use LookupKeyType instead for new code
 */
export type GlobalLookupKey = LookupKeyType;

/**
 * Type alias for React Query cache keys.
 * Provides type safety for React Query key management
 * and cache invalidation operations.
 * 
 * @example
 * ```typescript
 * // React Query usage
 * const queryKey: LookupKeyQueryKey = ['lookupKeys', { search: 'test' }];
 * 
 * const { data } = useQuery({
 *   queryKey,
 *   queryFn: () => fetchLookupKeys(queryKey[1])
 * });
 * 
 * // Cache invalidation
 * queryClient.invalidateQueries({ queryKey: ['lookupKeys'] });
 * ```
 */
export type LookupKeyQueryKey = [
  'lookupKeys',
  LookupKeyFilters?
] | [
  'lookupKey',
  number
];

/**
 * Union type for lookup key-related API operations.
 * Provides type safety for API client methods and
 * React Query mutation operations.
 * 
 * @example
 * ```typescript
 * // API client method
 * const performLookupKeyOperation = async (
 *   operation: LookupKeyOperation,
 *   data?: CreateLookupKeyPayload | UpdateLookupKeyPayload
 * ) => {
 *   switch (operation) {
 *     case 'create':
 *       return createLookupKey(data as CreateLookupKeyPayload);
 *     case 'update':
 *       return updateLookupKey(id, data as UpdateLookupKeyPayload);
 *     // ... other operations
 *   }
 * };
 * ```
 */
export type LookupKeyOperation = 
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'list'
  | 'search';