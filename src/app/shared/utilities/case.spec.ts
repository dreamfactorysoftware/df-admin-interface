import {
  camelToSnakeString,
  mapCamelToSnake,
  mapSnakeToCamel,
  snakeToCamelString,
} from './case';

describe('String Conversion Utilities', () => {
  it('should convert snake_case string to camelCase', () => {
    const input = 'hello_world_test_string';
    const result = snakeToCamelString(input);
    expect(result).toBe('helloWorldTestString');
  });

  it('should convert camelCase string to snake_case', () => {
    const input = 'helloWorldTestString';
    const result = camelToSnakeString(input);
    expect(result).toBe('hello_world_test_string');
  });

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

  // The API Builder execution_plan / response_mapping hold user-authored blobs
  // whose inner keys are real data field names + output aliases. Those keys must
  // round-trip verbatim; only the envelope key is transformed. Adjacent keys
  // must still transform normally (so the exception is tightly scoped).
  it('keeps execution_plan/response_mapping values verbatim (snake->camel)', () => {
    const input = {
      api_id: 7,
      execution_plan: {
        steps: [
          {
            aliases: {
              orders_by_customer_id: 'customer_orders',
              cust_name: 'x',
            },
            params: { fields: 'id,cust_name' },
          },
        ],
      },
      response_mapping: { data: '{steps.s.resource}' },
    };
    const result = mapSnakeToCamel(input) as any;
    expect(result.apiId).toBe(7); // adjacent key still transformed
    // inner keys untouched (NOT camelCased)
    expect(result.executionPlan.steps[0].aliases).toEqual({
      orders_by_customer_id: 'customer_orders',
      cust_name: 'x',
    });
    expect(result.executionPlan.steps[0].params).toEqual({
      fields: 'id,cust_name',
    });
    expect(result.responseMapping).toEqual({ data: '{steps.s.resource}' });
  });

  it('keeps executionPlan/responseMapping values verbatim (camel->snake)', () => {
    const input = {
      apiId: 7,
      executionPlan: {
        steps: [{ aliases: { orders_by_customer_id: 'customer_orders' } }],
      },
      responseMapping: { data: '{steps.s.resource}' },
    };
    const result = mapCamelToSnake(input) as any;
    expect(result.api_id).toBe(7); // adjacent key still transformed
    expect(result.execution_plan.steps[0].aliases).toEqual({
      orders_by_customer_id: 'customer_orders',
    });
    expect(result.response_mapping).toEqual({ data: '{steps.s.resource}' });
  });
});
