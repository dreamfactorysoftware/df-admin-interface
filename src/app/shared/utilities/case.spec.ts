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
});
