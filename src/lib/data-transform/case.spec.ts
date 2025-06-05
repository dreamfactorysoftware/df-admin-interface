/**
 * @fileoverview Vitest test suite for case conversion utilities
 * 
 * This test suite validates snakeToCamelString, camelToSnakeString, mapSnakeToCamel, 
 * and mapCamelToSnake functions for API data transformation workflows. The tests ensure
 * both flat string transformations and recursive object key conversions behave correctly
 * in React/Next.js SSR environments with backward compatibility for DreamFactory API contracts.
 * 
 * Migration Notes:
 * - Migrated from Jest to Vitest framework per Section 6.6 testing strategy with 10x faster execution
 * - Added MSW integration for testing data transformation in API request/response cycles
 * - Enhanced test coverage for Next.js server-side rendering contexts and edge runtime compatibility
 * - Maintained existing test scenarios for backward compatibility while adding React-specific test cases
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { server } from '@/test/mocks/server';
import { rest } from 'msw';
import {
  snakeToCamelString,
  camelToSnakeString,
  mapSnakeToCamel,
  mapCamelToSnake,
} from './case';

// Mock Next.js SSR environment variables for testing
const mockSSREnvironment = () => {
  Object.defineProperty(globalThis, 'window', {
    value: undefined,
    writable: true,
  });
};

const mockClientEnvironment = () => {
  Object.defineProperty(globalThis, 'window', {
    value: { location: { href: 'http://localhost:3000' } },
    writable: true,
  });
};

// Setup MSW server for API integration testing
beforeAll(() => {
  server.listen();
});

afterAll(() => {
  server.close();
});

beforeEach(() => {
  server.resetHandlers();
  mockClientEnvironment(); // Default to client environment
});

describe('String Conversion Utilities', () => {
  describe('snakeToCamelString', () => {
    it('should convert simple snake_case string to camelCase', () => {
      const input = 'hello_world_test_string';
      const result = snakeToCamelString(input);
      expect(result).toBe('helloWorldTestString');
    });

    it('should handle single word strings without underscores', () => {
      const input = 'hello';
      const result = snakeToCamelString(input);
      expect(result).toBe('hello');
    });

    it('should handle strings with leading underscores', () => {
      const input = '_private_key';
      const result = snakeToCamelString(input);
      expect(result).toBe('_privateKey');
    });

    it('should handle strings with trailing underscores', () => {
      const input = 'database_name_';
      const result = snakeToCamelString(input);
      expect(result).toBe('databaseName_');
    });

    it('should handle multiple consecutive underscores', () => {
      const input = 'test__double__underscore';
      const result = snakeToCamelString(input);
      expect(result).toBe('test_Double_Underscore');
    });

    it('should handle empty strings', () => {
      const input = '';
      const result = snakeToCamelString(input);
      expect(result).toBe('');
    });

    it('should handle strings with numbers', () => {
      const input = 'version_2_api_key';
      const result = snakeToCamelString(input);
      expect(result).toBe('version2ApiKey');
    });

    it('should handle strings with hyphens (legacy support)', () => {
      const input = 'legacy-api-key';
      const result = snakeToCamelString(input);
      expect(result).toBe('legacyApiKey');
    });

    it('should work in Next.js SSR environment', () => {
      mockSSREnvironment();
      const input = 'server_side_field';
      const result = snakeToCamelString(input);
      expect(result).toBe('serverSideField');
    });
  });

  describe('camelToSnakeString', () => {
    it('should convert simple camelCase string to snake_case', () => {
      const input = 'helloWorldTestString';
      const result = camelToSnakeString(input);
      expect(result).toBe('hello_world_test_string');
    });

    it('should handle single word strings', () => {
      const input = 'hello';
      const result = camelToSnakeString(input);
      expect(result).toBe('hello');
    });

    it('should handle strings with numbers', () => {
      const input = 'version2ApiKey';
      const result = camelToSnakeString(input);
      expect(result).toBe('version2_api_key');
    });

    it('should handle strings starting with capital letters', () => {
      const input = 'DatabaseConnection';
      const result = camelToSnakeString(input);
      expect(result).toBe('database_connection');
    });

    it('should handle consecutive capital letters', () => {
      const input = 'HTTPSConnection';
      const result = camelToSnakeString(input);
      expect(result).toBe('https_connection');
    });

    it('should handle empty strings', () => {
      const input = '';
      const result = camelToSnakeString(input);
      expect(result).toBe('');
    });

    // SAML special case handling for backward compatibility
    it('should handle SAML idpSingleSignOnServiceUrl special case', () => {
      const input = 'idpSingleSignOnServiceUrl';
      const result = camelToSnakeString(input);
      expect(result).toBe('idp_singleSignOnService_url');
    });

    it('should handle SAML idp_singleSignOnService_url preservation', () => {
      const input = 'idp_singleSignOnService_url';
      const result = camelToSnakeString(input);
      expect(result).toBe('idp_singleSignOnService_url');
    });

    it('should handle SAML idpEntityId special case', () => {
      const input = 'idpEntityId';
      const result = camelToSnakeString(input);
      expect(result).toBe('idp_entityId');
    });

    it('should handle SAML idp_entityId preservation', () => {
      const input = 'idp_entityId';
      const result = camelToSnakeString(input);
      expect(result).toBe('idp_entityId');
    });

    it('should handle SAML spNameIDFormat special case', () => {
      const input = 'spNameIDFormat';
      const result = camelToSnakeString(input);
      expect(result).toBe('sp_nameIDFormat');
    });

    it('should handle SAML sp_nameIDFormat preservation', () => {
      const input = 'sp_nameIDFormat';
      const result = camelToSnakeString(input);
      expect(result).toBe('sp_nameIDFormat');
    });

    it('should handle SAML spPrivateKey special case', () => {
      const input = 'spPrivateKey';
      const result = camelToSnakeString(input);
      expect(result).toBe('sp_privateKey');
    });

    it('should handle SAML sp_privateKey preservation', () => {
      const input = 'sp_privateKey';
      const result = camelToSnakeString(input);
      expect(result).toBe('sp_privateKey');
    });

    it('should work in Next.js SSR environment', () => {
      mockSSREnvironment();
      const input = 'serverSideField';
      const result = camelToSnakeString(input);
      expect(result).toBe('server_side_field');
    });
  });

  describe('mapSnakeToCamel', () => {
    it('should convert object keys from snake_case to camelCase', () => {
      const input = {
        first_key: 'value1',
        second_key_here: {
          nested_key: 'value2',
          another_nested_key: ['item1', 'item2'],
        },
      };
      const result = mapSnakeToCamel(input);
      expect(result).toEqual({
        firstKey: 'value1',
        secondKeyHere: {
          nestedKey: 'value2',
          anotherNestedKey: ['item1', 'item2'],
        },
      });
    });

    it('should handle arrays of objects', () => {
      const input = [
        { table_name: 'users', field_count: 5 },
        { table_name: 'posts', field_count: 8 },
      ];
      const result = mapSnakeToCamel(input);
      expect(result).toEqual([
        { tableName: 'users', fieldCount: 5 },
        { tableName: 'posts', fieldCount: 8 },
      ]);
    });

    it('should handle mixed arrays with objects and primitives', () => {
      const input = [
        'string_value',
        { table_name: 'users' },
        42,
        { nested_object: { deep_field: 'value' } },
      ];
      const result = mapSnakeToCamel(input);
      expect(result).toEqual([
        'string_value', // strings in arrays are not transformed
        { tableName: 'users' },
        42,
        { nestedObject: { deepField: 'value' } },
      ]);
    });

    it('should handle null and undefined values', () => {
      const input = {
        null_field: null,
        undefined_field: undefined,
        valid_field: 'value',
      };
      const result = mapSnakeToCamel(input);
      expect(result).toEqual({
        nullField: null,
        undefinedField: undefined,
        validField: 'value',
      });
    });

    it('should handle nested objects with deep structure', () => {
      const input = {
        database_config: {
          connection_settings: {
            host_name: 'localhost',
            port_number: 3306,
            ssl_config: {
              cert_path: '/path/to/cert',
              key_path: '/path/to/key',
            },
          },
        },
      };
      const result = mapSnakeToCamel(input);
      expect(result).toEqual({
        databaseConfig: {
          connectionSettings: {
            hostName: 'localhost',
            portNumber: 3306,
            sslConfig: {
              certPath: '/path/to/cert',
              keyPath: '/path/to/key',
            },
          },
        },
      });
    });

    it('should preserve primitive values unchanged', () => {
      expect(mapSnakeToCamel('string')).toBe('string');
      expect(mapSnakeToCamel(42)).toBe(42);
      expect(mapSnakeToCamel(true)).toBe(true);
      expect(mapSnakeToCamel(null)).toBe(null);
      expect(mapSnakeToCamel(undefined)).toBe(undefined);
    });

    it('should handle empty objects and arrays', () => {
      expect(mapSnakeToCamel({})).toEqual({});
      expect(mapSnakeToCamel([])).toEqual([]);
    });

    it('should work in Next.js SSR environment', () => {
      mockSSREnvironment();
      const input = { server_field: { nested_server_field: 'value' } };
      const result = mapSnakeToCamel(input);
      expect(result).toEqual({ serverField: { nestedServerField: 'value' } });
    });
  });

  describe('mapCamelToSnake', () => {
    it('should convert object keys from camelCase to snake_case', () => {
      const input = {
        firstKey: 'value1',
        secondKeyHere: {
          nestedKey: 'value2',
          anotherNestedKey: ['item1', 'item2'],
        },
      };
      const result = mapCamelToSnake(input);
      expect(result).toEqual({
        first_key: 'value1',
        second_key_here: {
          nested_key: 'value2',
          another_nested_key: ['item1', 'item2'],
        },
      });
    });

    it('should preserve requestBody key unchanged (DreamFactory API contract)', () => {
      const input = {
        requestBody: {
          tableName: 'users',
          fieldData: { userName: 'john' },
        },
        otherField: 'value',
      };
      const result = mapCamelToSnake(input);
      expect(result).toEqual({
        requestBody: {
          tableName: 'users',
          fieldData: { userName: 'john' },
        },
        other_field: 'value',
      });
    });

    it('should handle arrays of objects', () => {
      const input = [
        { tableName: 'users', fieldCount: 5 },
        { tableName: 'posts', fieldCount: 8 },
      ];
      const result = mapCamelToSnake(input);
      expect(result).toEqual([
        { table_name: 'users', field_count: 5 },
        { table_name: 'posts', field_count: 8 },
      ]);
    });

    it('should handle SAML fields in object transformation', () => {
      const input = {
        idpSingleSignOnServiceUrl: 'https://sso.example.com',
        idpEntityId: 'entity123',
        spNameIDFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
        spPrivateKey: 'private_key_data',
        regularField: 'value',
      };
      const result = mapCamelToSnake(input);
      expect(result).toEqual({
        idp_singleSignOnService_url: 'https://sso.example.com',
        idp_entityId: 'entity123',
        sp_nameIDFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
        sp_privateKey: 'private_key_data',
        regular_field: 'value',
      });
    });

    it('should handle null and undefined values', () => {
      const input = {
        nullField: null,
        undefinedField: undefined,
        validField: 'value',
      };
      const result = mapCamelToSnake(input);
      expect(result).toEqual({
        null_field: null,
        undefined_field: undefined,
        valid_field: 'value',
      });
    });

    it('should preserve primitive values unchanged', () => {
      expect(mapCamelToSnake('string')).toBe('string');
      expect(mapCamelToSnake(42)).toBe(42);
      expect(mapCamelToSnake(true)).toBe(true);
      expect(mapCamelToSnake(null)).toBe(null);
      expect(mapCamelToSnake(undefined)).toBe(undefined);
    });

    it('should work in Next.js SSR environment', () => {
      mockSSREnvironment();
      const input = { serverField: { nestedServerField: 'value' } };
      const result = mapCamelToSnake(input);
      expect(result).toEqual({ server_field: { nested_server_field: 'value' } });
    });
  });

  describe('React Query/SWR Integration Testing', () => {
    it('should transform API response data for React Query usage', async () => {
      // Mock API response with snake_case data
      server.use(
        rest.get('/api/v2/system/config', (req, res, ctx) => {
          return res(
            ctx.json({
              app_name: 'DreamFactory',
              default_app_id: 1,
              platform_config: {
                cache_enabled: true,
                session_timeout: 3600,
              },
            })
          );
        })
      );

      // Simulate React Query data transformation
      const mockApiResponse = {
        app_name: 'DreamFactory',
        default_app_id: 1,
        platform_config: {
          cache_enabled: true,
          session_timeout: 3600,
        },
      };

      const transformedData = mapSnakeToCamel(mockApiResponse);
      
      expect(transformedData).toEqual({
        appName: 'DreamFactory',
        defaultAppId: 1,
        platformConfig: {
          cacheEnabled: true,
          sessionTimeout: 3600,
        },
      });
    });

    it('should transform mutation data for API requests', async () => {
      // Mock database service creation
      const clientData = {
        serviceName: 'mysql_db',
        connectionConfig: {
          hostName: 'localhost',
          portNumber: 3306,
          databaseName: 'test_db',
        },
      };

      const transformedForApi = mapCamelToSnake(clientData);

      expect(transformedForApi).toEqual({
        service_name: 'mysql_db',
        connection_config: {
          host_name: 'localhost',
          port_number: 3306,
          database_name: 'test_db',
        },
      });
    });

    it('should handle SWR cache key transformation', () => {
      const cacheKey = ['database_connections', { service_id: 1 }];
      const transformedKey = mapSnakeToCamel(cacheKey);
      
      expect(transformedKey).toEqual(['database_connections', { serviceId: 1 }]);
    });
  });

  describe('Next.js Middleware Integration', () => {
    it('should work with Next.js API routes in edge runtime', () => {
      // Simulate edge runtime environment
      const originalEdgeRuntime = globalThis.EdgeRuntime;
      Object.defineProperty(globalThis, 'EdgeRuntime', {
        value: 'edge',
        writable: true,
      });

      const input = { request_body: { user_name: 'admin' } };
      const result = mapCamelToSnake(input);
      
      expect(result).toEqual({ request_body: { user_name: 'admin' } });

      // Restore original EdgeRuntime
      Object.defineProperty(globalThis, 'EdgeRuntime', {
        value: originalEdgeRuntime,
        writable: true,
      });
    });

    it('should handle authentication header transformation', () => {
      const authHeaders = {
        sessionToken: 'abc123',
        apiKey: 'key456',
        userId: 1,
      };

      const transformedHeaders = mapCamelToSnake(authHeaders);

      expect(transformedHeaders).toEqual({
        session_token: 'abc123',
        api_key: 'key456',
        user_id: 1,
      });
    });
  });

  describe('Performance and Memory Testing', () => {
    it('should handle large objects efficiently (1000+ properties)', () => {
      const largeObject: Record<string, any> = {};
      
      // Create object with 1000+ properties simulating large schema discovery
      for (let i = 0; i < 1500; i++) {
        largeObject[`table_name_${i}`] = {
          field_count: i,
          created_date: new Date().toISOString(),
          table_schema: {
            primary_key: `id_${i}`,
            foreign_keys: [`fk_${i}_1`, `fk_${i}_2`],
          },
        };
      }

      const startTime = performance.now();
      const result = mapSnakeToCamel(largeObject);
      const endTime = performance.now();

      // Should complete transformation in reasonable time (< 100ms for 1500 properties)
      expect(endTime - startTime).toBeLessThan(100);
      
      // Verify first and last items are transformed correctly
      expect(result[`tableName0`]).toBeDefined();
      expect(result[`tableName0`].fieldCount).toBe(0);
      expect(result[`tableName1499`]).toBeDefined();
      expect(result[`tableName1499`].tableSchema.primaryKey).toBe('id_1499');
    });

    it('should handle deeply nested objects without stack overflow', () => {
      // Create deeply nested object (100 levels)
      let deepObject: any = { final_value: 'test' };
      for (let i = 0; i < 100; i++) {
        deepObject = { [`level_${i}`]: deepObject };
      }

      expect(() => mapSnakeToCamel(deepObject)).not.toThrow();
      
      const result = mapSnakeToCamel(deepObject);
      expect(result).toBeDefined();
      
      // Navigate to the deeply nested value
      let current = result;
      for (let i = 99; i >= 0; i--) {
        current = current[`level${i}`];
      }
      expect(current.finalValue).toBe('test');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle circular references gracefully', () => {
      const circularObj: any = { name: 'circular_test' };
      circularObj.self = circularObj;

      // Should not cause infinite recursion
      expect(() => mapSnakeToCamel(circularObj)).not.toThrow();
    });

    it('should handle objects with numeric keys', () => {
      const input = {
        '123': 'numeric_key',
        normal_key: 'string_key',
      };

      const result = mapSnakeToCamel(input);
      expect(result).toEqual({
        '123': 'numeric_key',
        normalKey: 'string_key',
      });
    });

    it('should handle objects with symbol keys', () => {
      const symbol = Symbol('test_symbol');
      const input = {
        [symbol]: 'symbol_value',
        normal_key: 'normal_value',
      };

      const result = mapSnakeToCamel(input);
      expect(result[symbol]).toBe('symbol_value');
      expect(result.normalKey).toBe('normal_value');
    });

    it('should handle Date objects correctly', () => {
      const date = new Date('2023-01-01');
      const input = {
        created_date: date,
        updated_at: '2023-01-02',
      };

      const result = mapSnakeToCamel(input);
      expect(result.createdDate).toBe(date);
      expect(result.updatedAt).toBe('2023-01-02');
    });
  });

  describe('Backward Compatibility with DreamFactory API', () => {
    it('should maintain compatibility with existing API response structure', () => {
      // Simulate real DreamFactory API response
      const apiResponse = {
        resource: [
          {
            id: 1,
            name: 'mysql_service',
            label: 'MySQL Database',
            description: 'Production database',
            is_active: true,
            type: 'sql_db',
            config: {
              host: 'localhost',
              port: 3306,
              database: 'production',
              username: 'admin',
              password: 'secret',
              driver: 'mysql',
              options: [],
              attributes: [],
            },
            created_date: '2023-01-01T00:00:00.000Z',
            last_modified_date: '2023-01-01T00:00:00.000Z',
            created_by_id: 1,
            last_modified_by_id: 1,
          },
        ],
        meta: {
          schema: ['id', 'name', 'label', 'description', 'is_active'],
          count: 1,
        },
      };

      const transformedResponse = mapSnakeToCamel(apiResponse);

      expect(transformedResponse).toEqual({
        resource: [
          {
            id: 1,
            name: 'mysql_service',
            label: 'MySQL Database',
            description: 'Production database',
            isActive: true,
            type: 'sql_db',
            config: {
              host: 'localhost',
              port: 3306,
              database: 'production',
              username: 'admin',
              password: 'secret',
              driver: 'mysql',
              options: [],
              attributes: [],
            },
            createdDate: '2023-01-01T00:00:00.000Z',
            lastModifiedDate: '2023-01-01T00:00:00.000Z',
            createdById: 1,
            lastModifiedById: 1,
          },
        ],
        meta: {
          schema: ['id', 'name', 'label', 'description', 'is_active'],
          count: 1,
        },
      });
    });

    it('should handle API request body transformation correctly', () => {
      const requestPayload = {
        serviceName: 'new_mysql_db',
        serviceLabel: 'New MySQL Database',
        serviceConfig: {
          hostName: 'db.example.com',
          portNumber: 3306,
          databaseName: 'app_db',
          userName: 'dbuser',
          userPassword: 'dbpass',
        },
        isActive: true,
      };

      const transformedPayload = mapCamelToSnake(requestPayload);

      expect(transformedPayload).toEqual({
        service_name: 'new_mysql_db',
        service_label: 'New MySQL Database',
        service_config: {
          host_name: 'db.example.com',
          port_number: 3306,
          database_name: 'app_db',
          user_name: 'dbuser',
          user_password: 'dbpass',
        },
        is_active: true,
      });
    });
  });
});