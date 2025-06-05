import { z } from 'zod';

/**
 * CSV validation regex pattern - matches comma-separated word values with optional whitespace
 * Pattern: /^\w+(?:\s*,\s*\w+)*$/
 * - ^ : Start of string
 * - \w+ : One or more word characters (letters, digits, underscores)
 * - (?:\s*,\s*\w+)* : Non-capturing group repeated zero or more times:
 *   - \s* : Zero or more whitespace characters
 *   - , : A comma
 *   - \s* : Zero or more whitespace characters
 *   - \w+ : One or more word characters
 * - $ : End of string
 */
const CSV_REGEX = /^\w+(?:\s*,\s*\w+)*$/;

/**
 * Zod schema for CSV string validation that replaces the Angular CsvValidator function.
 * 
 * Validates comma-separated values used in:
 * - Bulk ID inputs
 * - Tag selectors  
 * - Import field lists
 * - Database field picklists
 * 
 * Maintains the same validation logic as the original Angular implementation:
 * - Empty strings are considered valid (allows optional fields)
 * - Non-empty strings must match the CSV regex pattern
 * - Provides type-safe validation for React Hook Form integration
 * 
 * @example
 * ```typescript
 * // Valid CSV values
 * csvSchema.parse('') // ✓ Empty string allowed
 * csvSchema.parse('apple') // ✓ Single word
 * csvSchema.parse('apple,banana,cherry') // ✓ Multiple words
 * csvSchema.parse('apple, banana, cherry') // ✓ With spaces
 * csvSchema.parse('item1, item_2, item3') // ✓ With underscores and numbers
 * 
 * // Invalid CSV values
 * csvSchema.parse(',') // ✗ Leading comma
 * csvSchema.parse('apple,') // ✗ Trailing comma
 * csvSchema.parse('apple,,banana') // ✗ Double comma
 * csvSchema.parse('apple, ,banana') // ✗ Empty item
 * csvSchema.parse('apple banana') // ✗ Missing comma
 * ```
 * 
 * @example React Hook Form usage
 * ```typescript
 * import { useForm } from 'react-hook-form';
 * import { zodResolver } from '@hookform/resolvers/zod';
 * import { csvSchema } from './csv-validation';
 * 
 * const formSchema = z.object({
 *   tags: csvSchema,
 *   picklist: csvSchema.optional(),
 * });
 * 
 * const { register, handleSubmit, formState: { errors } } = useForm({
 *   resolver: zodResolver(formSchema),
 * });
 * ```
 */
export const csvSchema = z
  .string()
  .refine(
    (value) => {
      // Empty strings are valid (same behavior as Angular CsvValidator)
      if (!value || value.length === 0) {
        return true;
      }
      
      // Non-empty strings must match the CSV regex pattern
      return CSV_REGEX.test(value);
    },
    {
      message: 'Please enter a valid comma-separated list of values (e.g., "item1, item2, item3")',
    }
  );

/**
 * TypeScript type for validated CSV data - enables compile-time type inference
 * 
 * @example
 * ```typescript
 * type CsvData = z.infer<typeof csvSchema>; // string
 * 
 * // Use in component props
 * interface TagSelectorProps {
 *   tags: CsvData;
 *   onTagsChange: (tags: CsvData) => void;
 * }
 * ```
 */
export type CsvData = z.infer<typeof csvSchema>;

/**
 * Optional CSV schema for fields that may be undefined
 * Commonly used for optional form fields like picklists
 * 
 * @example
 * ```typescript
 * const fieldSchema = z.object({
 *   name: z.string().min(1),
 *   picklist: csvSchemaOptional, // Can be undefined
 * });
 * ```
 */
export const csvSchemaOptional = csvSchema.optional();

/**
 * Utility function to parse and split CSV string into array of trimmed values
 * Provides runtime validation and transformation for validated CSV data
 * 
 * @param csvString - The CSV string to parse (must be valid according to csvSchema)
 * @returns Array of trimmed string values
 * 
 * @example
 * ```typescript
 * const tags = parseCsvString('apple, banana, cherry');
 * // Result: ['apple', 'banana', 'cherry']
 * 
 * const emptyTags = parseCsvString('');
 * // Result: []
 * ```
 */
export function parseCsvString(csvString: CsvData): string[] {
  // Handle empty strings
  if (!csvString || csvString.length === 0) {
    return [];
  }
  
  // Split on commas and trim whitespace from each value
  return csvString
    .split(',')
    .map(item => item.trim())
    .filter(item => item.length > 0); // Remove any empty items (defensive)
}

/**
 * Utility function to format an array of strings into a CSV string
 * Ensures the result is valid according to csvSchema
 * 
 * @param values - Array of string values to format as CSV
 * @returns CSV formatted string
 * 
 * @example
 * ```typescript
 * const csvString = formatAsCsv(['apple', 'banana', 'cherry']);
 * // Result: 'apple,banana,cherry'
 * 
 * const emptyString = formatAsCsv([]);
 * // Result: ''
 * ```
 */
export function formatAsCsv(values: string[]): CsvData {
  // Handle empty arrays
  if (!values || values.length === 0) {
    return '';
  }
  
  // Filter out empty/whitespace-only values and join with commas
  const filteredValues = values
    .map(value => value.trim())
    .filter(value => value.length > 0);
    
  return filteredValues.join(',');
}

/**
 * Validation helper for React Hook Form field validation
 * Provides immediate validation feedback for form controls
 * 
 * @param value - The form field value to validate
 * @returns Validation result compatible with React Hook Form
 * 
 * @example
 * ```typescript
 * const { register } = useForm();
 * 
 * <input
 *   {...register('tags', { 
 *     validate: validateCsvField 
 *   })}
 *   placeholder="Enter comma-separated tags"
 * />
 * ```
 */
export function validateCsvField(value: string): string | true {
  try {
    csvSchema.parse(value);
    return true;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.errors[0]?.message || 'Invalid CSV format';
    }
    return 'Validation error occurred';
  }
}

// Re-export for backwards compatibility and consistency
export { csvSchema as default };