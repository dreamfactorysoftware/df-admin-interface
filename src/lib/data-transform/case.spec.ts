/**
 * Vitest test suite for case conversion utilities in the DreamFactory Admin Interface.
 * Tests data transformation functions for both client-side React components and 
 * server-side Next.js SSR contexts, ensuring compatibility with DreamFactory API contracts.
 * 
 * Validates snakeToCamelString, camelToSnakeString, mapSnakeToCamel, and mapCamelToSnake
 * functions for API data transformation workflows with React Query/SWR integration.
 * 
 * @module CaseTransformationTests
 * @version 1.0.0
 * @author DreamFactory Admin Interface Team
 */

import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import {
  snakeToCamelString,
  camelToSnakeString,
  mapSnakeToCamel,
  mapCamelToSnake,
  type CaseTransformed,
} from './case';

// Mock Service Worker server for testing API request/response cycles
const server = setupServer();

// Test fixtures representing typical DreamFactory API responses
const mockDatabaseServiceResponse = {
  name: 'mysql_production',
  type: 'mysql',
  config: {
    host: 'localhost',
    port: 3306,
    database_name: 'production_db',
    user_name: 'api_user',
    max_connections: 100,
    ssl_enabled: true,
    connection_timeout: 30,
  },
  service_definition: {
    api_endpoints: [
      {
        resource_name: 'user_profiles',
        http_methods: ['GET', 'POST', 'PUT', 'DELETE'],
        auth_required: true,
        rate_limit_enabled: true,
      },
    ],
  },
};

const mockSamlConfiguration = {
  idp_entity_id: 'https://example.com/saml/metadata',
  idp_single_sign_on_service_url: 'https://example.com/saml/sso',
  sp_name_id_format: 'urn:oasis:names:tc:SAML:2.0:nameid-format:persistent',
  sp_private_key: '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----',
  other_config: {
    session_timeout: 3600,
    auto_provision_users: true,
  },
};

const mockRequestBody = {
  userName: 'john_doe',
  apiSettings: {
    maxRateLimit: 1000,
    authMethods: ['bearer', 'apiKey'],
  },
  requestBody: {
    data: 'This should be preserved as-is',
    nested_field: 'example',
  },
};

// Setup MSW server for integration testing
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

describe('Case Transformation Utilities', () => {
  describe('snakeToCamelString', () => {
    it('should convert basic snake_case to camelCase', () => {
      expect(snakeToCamelString('user_name')).toBe('userName');
      expect(snakeToCamelString('api_key_id')).toBe('apiKeyId');
      expect(snakeToCamelString('database_connection')).toBe('databaseConnection');
      expect(snakeToCamelString('max_rate_limit')).toBe('maxRateLimit');
    });

    it('should handle SAML special field mappings correctly', () => {
      expect(snakeToCamelString('idp_entity_id')).toBe('idpEntityId');
      expect(snakeToCamelString('idp_single_sign_on_service_url')).toBe('idpSingleSignOnServiceUrl');
      expect(snakeToCamelString('sp_name_id_format')).toBe('spNameIDFormat');
      expect(snakeToCamelString('sp_private_key')).toBe('spPrivateKey');
    });

    it('should handle edge cases and invalid inputs', () => {
      expect(snakeToCamelString('')).toBe('');
      expect(snakeToCamelString('already_camelCase')).toBe('alreadyCamelCase');
      expect(snakeToCamelString('single')).toBe('single');
      expect(snakeToCamelString('multiple_under_scores_here')).toBe('multipleUnderScoresHere');
    });

    it('should handle null and undefined inputs gracefully', () => {
      expect(snakeToCamelString(null as any)).toBeNull();
      expect(snakeToCamelString(undefined as any)).toBeUndefined();
    });

    it('should work in Next.js server-side rendering context', () => {
      // Simulate SSR environment where window is undefined
      const originalWindow = global.window;
      delete (global as any).window;

      expect(snakeToCamelString('server_side_field')).toBe('serverSideField');
      expect(snakeToCamelString('api_endpoint_config')).toBe('apiEndpointConfig');

      // Restore window for other tests
      if (originalWindow) {
        global.window = originalWindow;
      }
    });
  });

  describe('camelToSnakeString', () => {
    it('should convert basic camelCase to snake_case', () => {
      expect(camelToSnakeString('userName')).toBe('user_name');
      expect(camelToSnakeString('apiKeyId')).toBe('api_key_id');
      expect(camelToSnakeString('databaseConnection')).toBe('database_connection');
      expect(camelToSnakeString('maxRateLimit')).toBe('max_rate_limit');
    });

    it('should handle SAML special field mappings correctly', () => {
      expect(camelToSnakeString('idpEntityId')).toBe('idp_entity_id');
      expect(camelToSnakeString('idpSingleSignOnServiceUrl')).toBe('idp_single_sign_on_service_url');
      expect(camelToSnakeString('spNameIDFormat')).toBe('sp_name_id_format');
      expect(camelToSnakeString('spPrivateKey')).toBe('sp_private_key');
    });

    it('should handle edge cases and invalid inputs', () => {
      expect(camelToSnakeString('')).toBe('');
      expect(camelToSnakeString('alreadysnakecase')).toBe('alreadysnakecase');
      expect(camelToSnakeString('Single')).toBe('_single');
      expect(camelToSnakeString('multipleCapitalLettersHERE')).toBe('multiple_capital_letters_h_e_r_e');
    });

    it('should handle null and undefined inputs gracefully', () => {
      expect(camelToSnakeString(null as any)).toBeNull();
      expect(camelToSnakeString(undefined as any)).toBeUndefined();
    });

    it('should work in Next.js edge runtime context', () => {
      // Simulate edge runtime environment
      const originalProcess = global.process;
      global.process = { env: { NEXT_RUNTIME: 'edge' } } as any;

      expect(camelToSnakeString('edgeRuntimeField')).toBe('edge_runtime_field');
      expect(camelToSnakeString('apiEndpointConfig')).toBe('api_endpoint_config');

      // Restore process for other tests
      global.process = originalProcess;
    });
  });

  describe('mapSnakeToCamel', () => {
    it('should transform flat objects correctly', () => {
      const input = {
        user_name: 'john_doe',
        api_key: 'secret123',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
      };

      const expected = {
        userName: 'john_doe',
        apiKey: 'secret123',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
      };

      expect(mapSnakeToCamel(input)).toEqual(expected);
    });

    it('should transform nested objects recursively', () => {
      const input = {
        service_config: {
          database_name: 'production',
          connection_pool: {
            max_connections: 100,
            idle_timeout: 30,
          },
        },
        api_endpoints: [
          {
            resource_name: 'users',
            http_methods: ['GET', 'POST'],
          },
        ],
      };

      const expected = {
        serviceConfig: {
          databaseName: 'production',
          connectionPool: {
            maxConnections: 100,
            idleTimeout: 30,
          },
        },
        apiEndpoints: [
          {
            resourceName: 'users',
            httpMethods: ['GET', 'POST'],
          },
        ],
      };

      expect(mapSnakeToCamel(input)).toEqual(expected);
    });

    it('should handle arrays correctly', () => {
      const input = [
        { user_name: 'john', is_admin: false },
        { user_name: 'jane', is_admin: true },
      ];

      const expected = [
        { userName: 'john', isAdmin: false },
        { userName: 'jane', isAdmin: true },
      ];

      expect(mapSnakeToCamel(input)).toEqual(expected);
    });

    it('should preserve primitive values', () => {
      expect(mapSnakeToCamel('string')).toBe('string');
      expect(mapSnakeToCamel(123)).toBe(123);
      expect(mapSnakeToCamel(true)).toBe(true);
      expect(mapSnakeToCamel(null)).toBeNull();
      expect(mapSnakeToCamel(undefined)).toBeUndefined();
    });

    it('should handle SAML configuration transformation', () => {
      const transformed = mapSnakeToCamel(mockSamlConfiguration);
      
      expect(transformed).toEqual({
        idpEntityId: 'https://example.com/saml/metadata',
        idpSingleSignOnServiceUrl: 'https://example.com/saml/sso',
        spNameIDFormat: 'urn:oasis:names:tc:SAML:2.0:nameid-format:persistent',
        spPrivateKey: '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----',
        otherConfig: {
          sessionTimeout: 3600,
          autoProvisionUsers: true,
        },
      });
    });

    it('should handle complex DreamFactory API response', () => {
      const transformed = mapSnakeToCamel(mockDatabaseServiceResponse);
      
      expect(transformed.name).toBe('mysql_production');
      expect(transformed.config.databaseName).toBe('production_db');
      expect(transformed.config.userName).toBe('api_user');
      expect(transformed.serviceDefinition.apiEndpoints[0].resourceName).toBe('user_profiles');
      expect(transformed.serviceDefinition.apiEndpoints[0].rateLimitEnabled).toBe(true);
    });
  });

  describe('mapCamelToSnake', () => {
    it('should transform flat objects correctly', () => {
      const input = {
        userName: 'john_doe',
        apiKey: 'secret123',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
      };

      const expected = {
        user_name: 'john_doe',
        api_key: 'secret123',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
      };

      expect(mapCamelToSnake(input)).toEqual(expected);
    });

    it('should preserve requestBody key for API compatibility', () => {
      const transformed = mapCamelToSnake(mockRequestBody);
      
      expect(transformed).toEqual({
        user_name: 'john_doe',
        api_settings: {
          max_rate_limit: 1000,
          auth_methods: ['bearer', 'apiKey'],
        },
        requestBody: {
          data: 'This should be preserved as-is',
          nested_field: 'example',
        },
      });
    });

    it('should transform nested objects recursively while preserving requestBody', () => {
      const input = {
        serviceConfig: {
          databaseName: 'production',
          requestBody: {
            keepThisKey: 'unchanged',
            nestedData: { someField: 'value' },
          },
        },
        apiEndpoints: [
          {
            resourceName: 'users',
            httpMethods: ['GET', 'POST'],
          },
        ],
      };

      const expected = {
        service_config: {
          database_name: 'production',
          requestBody: {
            keepThisKey: 'unchanged',
            nestedData: { someField: 'value' },
          },
        },
        api_endpoints: [
          {
            resource_name: 'users',
            http_methods: ['GET', 'POST'],
          },
        ],
      };

      expect(mapCamelToSnake(input)).toEqual(expected);
    });

    it('should handle SAML configuration reverse transformation', () => {
      const camelInput = {
        idpEntityId: 'https://example.com/saml/metadata',
        idpSingleSignOnServiceUrl: 'https://example.com/saml/sso',
        spNameIDFormat: 'urn:oasis:names:tc:SAML:2.0:nameid-format:persistent',
        spPrivateKey: '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----',
        otherConfig: {
          sessionTimeout: 3600,
          autoProvisionUsers: true,
        },
      };

      const transformed = mapCamelToSnake(camelInput);
      
      expect(transformed).toEqual({
        idp_entity_id: 'https://example.com/saml/metadata',
        idp_single_sign_on_service_url: 'https://example.com/saml/sso',
        sp_name_id_format: 'urn:oasis:names:tc:SAML:2.0:nameid-format:persistent',
        sp_private_key: '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----',
        other_config: {
          session_timeout: 3600,
          auto_provision_users: true,
        },
      });
    });
  });

  describe('MSW Integration Tests - API Request/Response Cycles', () => {
    it('should transform API response data with React Query pattern', async () => {
      // Setup MSW handler for database service endpoint
      server.use(
        http.get('/api/v2/db/_schema', () => {
          return HttpResponse.json({
            resource: [
              {
                table_name: 'user_profiles',
                field_count: 10,
                primary_key: 'user_id',
                created_at: '2024-01-01T00:00:00Z',
              },
              {
                table_name: 'api_tokens',
                field_count: 5,
                primary_key: 'token_id',
                created_at: '2024-01-01T00:00:00Z',
              },
            ],
          });
        })
      );

      // Simulate React Query data fetching with case transformation
      const response = await fetch('/api/v2/db/_schema');
      const data = await response.json();
      const transformedData = mapSnakeToCamel(data);

      expect(transformedData.resource).toHaveLength(2);
      expect(transformedData.resource[0].tableName).toBe('user_profiles');
      expect(transformedData.resource[0].fieldCount).toBe(10);
      expect(transformedData.resource[0].primaryKey).toBe('user_id');
      expect(transformedData.resource[1].tableName).toBe('api_tokens');
    });

    it('should transform request data for API submission with SWR pattern', async () => {
      // Setup MSW handler for service creation endpoint
      server.use(
        http.post('/api/v2/system/service', async ({ request }) => {
          const body = await request.json();
          return HttpResponse.json({
            id: 1,
            name: body.name,
            type: body.type,
            config: body.config,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          });
        })
      );

      // Simulate SWR mutation with case transformation
      const requestData = {
        name: 'testService',
        type: 'mysql',
        config: {
          hostName: 'localhost',
          portNumber: 3306,
          databaseName: 'test_db',
          userName: 'admin',
          maxConnections: 50,
        },
      };

      const transformedRequest = mapCamelToSnake(requestData);
      const response = await fetch('/api/v2/system/service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transformedRequest),
      });

      const responseData = await response.json();
      const transformedResponse = mapSnakeToCamel(responseData);

      expect(transformedResponse.createdAt).toBe('2024-01-01T00:00:00Z');
      expect(transformedResponse.updatedAt).toBe('2024-01-01T00:00:00Z');
    });

    it('should handle middleware data transformation in Next.js context', async () => {
      // Setup MSW handler for authentication endpoint
      server.use(
        http.post('/api/v2/system/admin/session', async ({ request }) => {
          const body = await request.json();
          return HttpResponse.json({
            session_token: 'mock-jwt-token',
            session_id: 'session-123',
            expires_in: 3600,
            user_info: {
              display_name: 'Admin User',
              first_name: 'Admin',
              last_name: 'User',
              email_address: 'admin@example.com',
              is_sys_admin: true,
            },
          });
        })
      );

      // Simulate Next.js middleware authentication flow
      const loginRequest = {
        emailAddress: 'admin@example.com',
        password: 'secret123',
        rememberMe: true,
      };

      const transformedRequest = mapCamelToSnake(loginRequest);
      const response = await fetch('/api/v2/system/admin/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transformedRequest),
      });

      const responseData = await response.json();
      const transformedResponse = mapSnakeToCamel(responseData);

      expect(transformedResponse.sessionToken).toBe('mock-jwt-token');
      expect(transformedResponse.sessionId).toBe('session-123');
      expect(transformedResponse.expiresIn).toBe(3600);
      expect(transformedResponse.userInfo.displayName).toBe('Admin User');
      expect(transformedResponse.userInfo.emailAddress).toBe('admin@example.com');
      expect(transformedResponse.userInfo.isSysAdmin).toBe(true);
    });
  });

  describe('Type Safety and TypeScript Integration', () => {
    it('should maintain type safety with CaseTransformed utility type', () => {
      interface ApiResponse {
        user_name: string;
        api_settings: {
          max_rate_limit: number;
          auth_methods: string[];
        };
      }

      const apiData: ApiResponse = {
        user_name: 'john_doe',
        api_settings: {
          max_rate_limit: 1000,
          auth_methods: ['bearer', 'jwt'],
        },
      };

      const transformed = mapSnakeToCamel(apiData);
      
      // TypeScript should infer the transformed structure
      expect(typeof transformed.userName).toBe('string');
      expect(typeof transformed.apiSettings.maxRateLimit).toBe('number');
      expect(Array.isArray(transformed.apiSettings.authMethods)).toBe(true);
    });

    it('should handle complex nested type transformations', () => {
      interface DatabaseSchema {
        table_name: string;
        field_definitions: Array<{
          field_name: string;
          field_type: string;
          is_nullable: boolean;
          default_value: string | null;
        }>;
      }

      const schemaData: DatabaseSchema = {
        table_name: 'user_profiles',
        field_definitions: [
          {
            field_name: 'user_id',
            field_type: 'integer',
            is_nullable: false,
            default_value: null,
          },
          {
            field_name: 'email_address',
            field_type: 'string',
            is_nullable: false,
            default_value: '',
          },
        ],
      };

      const transformed = mapSnakeToCamel(schemaData);
      
      expect(transformed.tableName).toBe('user_profiles');
      expect(transformed.fieldDefinitions).toHaveLength(2);
      expect(transformed.fieldDefinitions[0].fieldName).toBe('user_id');
      expect(transformed.fieldDefinitions[0].isNullable).toBe(false);
      expect(transformed.fieldDefinitions[1].emailAddress).toBeUndefined(); // Field values aren't transformed
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large datasets efficiently', () => {
      // Generate a large dataset to test performance
      const largeDataset = {
        database_tables: Array.from({ length: 1000 }, (_, i) => ({
          table_name: `table_${i}`,
          field_count: Math.floor(Math.random() * 50) + 1,
          has_primary_key: Math.random() > 0.5,
          created_at: '2024-01-01T00:00:00Z',
        })),
      };

      const start = performance.now();
      const transformed = mapSnakeToCamel(largeDataset);
      const end = performance.now();

      // Transformation should complete within reasonable time (< 100ms for 1000 items)
      expect(end - start).toBeLessThan(100);
      expect(transformed.databaseTables).toHaveLength(1000);
      expect(transformed.databaseTables[0].tableName).toBe('table_0');
      expect(typeof transformed.databaseTables[0].hasPrimaryKey).toBe('boolean');
    });

    it('should handle circular references gracefully', () => {
      const obj: any = {
        name: 'test_object',
        nested_data: {
          parent_ref: null,
        },
      };
      
      // Create circular reference
      obj.nested_data.parent_ref = obj;

      // Should not throw or cause infinite loop
      expect(() => {
        const transformed = mapSnakeToCamel(obj);
        expect(transformed.name).toBe('test_object');
        expect(transformed.nestedData).toBeDefined();
      }).not.toThrow();
    });

    it('should handle deeply nested structures', () => {
      const deepObject = {
        level_1: {
          level_2: {
            level_3: {
              level_4: {
                level_5: {
                  deep_field: 'deep_value',
                  another_field: 'another_value',
                },
              },
            },
          },
        },
      };

      const transformed = mapSnakeToCamel(deepObject);
      
      expect(transformed.level1.level2.level3.level4.level5.deepField).toBe('deep_value');
      expect(transformed.level1.level2.level3.level4.level5.anotherField).toBe('another_value');
    });
  });

  describe('DreamFactory API Contract Compatibility', () => {
    it('should maintain backward compatibility with existing service definitions', () => {
      // Test data representing typical DreamFactory service response
      const serviceDefinition = {
        name: 'mysql_prod',
        label: 'Production MySQL',
        description: 'Production database service',
        is_active: true,
        type: 'mysql',
        config: {
          host: 'prod-db.example.com',
          port: 3306,
          database: 'production',
          username: 'api_user',
          password: 'encrypted_password',
          driver_options: {
            charset: 'utf8mb4',
            collation: 'utf8mb4_unicode_ci',
          },
        },
        created_date: '2024-01-01T00:00:00.000Z',
        last_modified_date: '2024-01-01T00:00:00.000Z',
        created_by_id: 1,
        last_modified_by_id: 1,
      };

      const transformed = mapSnakeToCamel(serviceDefinition);
      
      // Verify all fields are properly transformed
      expect(transformed.isActive).toBe(true);
      expect(transformed.config.driverOptions.charset).toBe('utf8mb4');
      expect(transformed.createdDate).toBe('2024-01-01T00:00:00.000Z');
      expect(transformed.lastModifiedDate).toBe('2024-01-01T00:00:00.000Z');
      expect(transformed.createdById).toBe(1);
      expect(transformed.lastModifiedById).toBe(1);

      // Verify reverse transformation maintains API contract
      const reversed = mapCamelToSnake(transformed);
      expect(reversed.is_active).toBe(true);
      expect(reversed.config.driver_options.charset).toBe('utf8mb4');
      expect(reversed.created_date).toBe('2024-01-01T00:00:00.000Z');
    });

    it('should handle API endpoint definition structures', () => {
      const endpointDefinition = {
        paths: {
          '/api/v2/db/_table': {
            get: {
              tags: ['Database'],
              summary: 'List database tables',
              parameters: [
                {
                  name: 'include_count',
                  in: 'query',
                  required: false,
                  schema: {
                    type: 'boolean',
                    default: false,
                  },
                },
              ],
              responses: {
                '200': {
                  description: 'Success',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          resource: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                table_name: { type: 'string' },
                                field_count: { type: 'integer' },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      };

      const transformed = mapSnakeToCamel(endpointDefinition);
      
      expect(transformed.paths['/api/v2/db/_table'].get.parameters[0].name).toBe('include_count');
      expect(transformed.paths['/api/v2/db/_table'].get.responses['200'].content['application/json'].schema.properties.resource.items.properties.tableName).toBeDefined();
      expect(transformed.paths['/api/v2/db/_table'].get.responses['200'].content['application/json'].schema.properties.resource.items.properties.fieldCount).toBeDefined();
    });
  });
});