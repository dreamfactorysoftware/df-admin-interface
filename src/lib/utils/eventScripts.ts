import { ScriptEventResponse } from '../../types/scripts';
import { mapCamelToSnake } from './case';

/**
 * Groups and flattens script event endpoint definitions from parameterized configurations.
 * 
 * This function processes DreamFactory Core script event response data by:
 * 1. Converting camelCase properties to snake_case for backend API compatibility
 * 2. Flattening nested event groups into a flat array structure
 * 3. Expanding parameterized endpoints by substituting parameter values
 * 4. Removing duplicate endpoint entries
 * 
 * @param data - Script event response data from DreamFactory Core API
 * @returns Array of grouped events with expanded endpoint definitions
 * 
 * @example
 * ```typescript
 * const events = groupEvents(scriptEventResponse);
 * // Returns: [{ name: 'user.created', endpoints: ['/api/v2/user', '/api/v2/user/123'] }]
 * ```
 */
export function groupEvents(data: ScriptEventResponse) {
  return Object.values(mapCamelToSnake(data)).flatMap(group => {
    return Object.entries(group).map(([subKey, item]) => {
      let endpoints: Array<string> = [];

      if (item.parameter) {
        endpoints = item.endpoints.flatMap((endpoint: string) => {
          const matches = endpoint.match(/{(.*?)}/);
          if (matches) {
            const paramKey = matches[1];
            const paramValues = item.parameter?.[paramKey] || [];
            return [
              endpoint,
              ...paramValues.map((value: string) =>
                endpoint.replace(`{${paramKey}}`, value)
              ),
            ];
          }
          return endpoint;
        });
      } else {
        endpoints = item.endpoints;
      }

      return {
        name: subKey,
        endpoints: [...new Set(endpoints)],
      };
    });
  });
}

/**
 * Adds wildcard group entries to a list of script event names for API workflow configurations.
 * 
 * This function generates wildcard entries (prefix.*) for event groups to enable
 * bulk event handling in DreamFactory script configurations. It ensures that
 * both specific events and their corresponding wildcard groups are available
 * for selection in event script management interfaces.
 * 
 * @param input - Array of specific event names (e.g., ['user.created', 'user.updated'])
 * @returns Array with both specific events and wildcard group entries
 * 
 * @example
 * ```typescript
 * const events = addGroupEntries(['user.created', 'user.updated', 'order.placed']);
 * // Returns: ['user.*', 'user.created', 'user.updated', 'order.*', 'order.placed']
 * ```
 */
export function addGroupEntries(input: string[]): string[] {
  const output: string[] = [];
  const seenPrefixes = new Set<string>();

  for (const item of input) {
    const prefix = item.split('.')[0];
    if (!seenPrefixes.has(prefix)) {
      seenPrefixes.add(prefix);
      output.push(`${prefix}.*`);
    }
    output.push(item);
  }

  return output;
}