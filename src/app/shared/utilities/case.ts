export const snakeToCamelString = (str: string) =>
  str.replace(/([-_]\w)/g, g => g[1].toUpperCase());

// Keys whose VALUE is a verbatim, user-authored blob that must never have its
// inner keys case-transformed. The API Builder execution plan / response mapping
// contain real data-source field names and user-defined output aliases
// (e.g. {"cust_name": "custName"}); camelCasing those keys silently breaks the
// rename mapping on reload. The key itself is still transformed so the
// camelCase<->snake_case envelope (executionPlan <-> execution_plan) still works.
const OPAQUE_VALUE_KEYS = new Set([
  'execution_plan',
  'executionPlan',
  'response_mapping',
  'responseMapping',
]);

export function mapSnakeToCamel<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map(item => mapSnakeToCamel(item)) as unknown as T;
  } else if (typeof obj === 'object' && obj !== null) {
    const newObj: Record<string, unknown> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = (obj as Record<string, unknown>)[key];
        newObj[snakeToCamelString(key)] = OPAQUE_VALUE_KEYS.has(key)
          ? value
          : mapSnakeToCamel(value);
      }
    }
    return newObj as unknown as T;
  } else {
    return obj;
  }
}

export const camelToSnakeString = (str: string) => {
  if (
    str === 'idpSingleSignOnServiceUrl' ||
    str === 'idp_singleSignOnService_url'
  ) {
    return 'idp_singleSignOnService_url';
  }
  if (str === 'idpEntityId' || str === 'idp_entityId') {
    return 'idp_entityId';
  }
  if (str === 'spNameIDFormat' || str === 'sp_nameIDFormat') {
    return 'sp_nameIDFormat';
  }
  if (str === 'spPrivateKey' || str === 'sp_privateKey') {
    return 'sp_privateKey';
  }
  return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1_$2').toLowerCase();
};

export function mapCamelToSnake<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map(item => mapCamelToSnake(item)) as unknown as T;
  } else if (typeof obj === 'object' && obj !== null) {
    const newObj: Record<string, unknown> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = (obj as Record<string, unknown>)[key];
        if (key === 'requestBody') {
          newObj[key] = value;
        } else if (OPAQUE_VALUE_KEYS.has(key)) {
          // Transform the envelope key but keep the blob value verbatim.
          newObj[camelToSnakeString(key)] = value;
        } else {
          newObj[camelToSnakeString(key)] = mapCamelToSnake(value);
        }
      }
    }
    return newObj as unknown as T;
  } else {
    return obj;
  }
}
