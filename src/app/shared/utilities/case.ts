export const snakeToCamelString = (str: string) => {
  // For SOAP method paths, preserve the original case
  if (str.startsWith('_') || str.startsWith('/')) {
    return str;
  }
  return str.replace(/([-_]\w)/g, g => g[1].toUpperCase());
};

export function mapSnakeToCamel<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map(item => mapSnakeToCamel(item)) as unknown as T;
  } else if (typeof obj === 'object' && obj !== null) {
    const newObj: Record<string, unknown> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = (obj as Record<string, unknown>)[key];
        // For paths object, preserve the path keys but transform the contents
        if (key === 'paths') {
          const pathsObj = value as Record<string, unknown>;
          const newPathsObj: Record<string, unknown> = {};
          for (const pathKey in pathsObj) {
            // Preserve the original path key
            newPathsObj[pathKey] = mapSnakeToCamel(pathsObj[pathKey]);
          }
          newObj[key] = newPathsObj;
        } else {
          newObj[snakeToCamelString(key)] = mapSnakeToCamel(value);
        }
      }
    }
    return newObj as unknown as T;
  } else if (
    typeof obj === 'string' &&
    (obj.startsWith('_') || obj.startsWith('/'))
  ) {
    // Preserve SOAP method paths in string values
    return obj as unknown as T;
  } else {
    return obj;
  }
}

// export const camelToSnakeString = (str: string) =>
//   str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1_$2').toLowerCase();

// export function mapCamelToSnake<T>(obj: T): T {
//   if (Array.isArray(obj)) {
//     return obj.map(item => mapCamelToSnake(item)) as unknown as T;
//   } else if (typeof obj === 'object' && obj !== null) {
//     const newObj: Record<string, unknown> = {};
//     for (const key in obj) {
//       if (Object.prototype.hasOwnProperty.call(obj, key)) {
//         newObj[camelToSnakeString(key)] = mapCamelToSnake(
//           (obj as Record<string, unknown>)[key]
//         );
//       }
//     }
//     return newObj as unknown as T;
//   } else {
//     return obj;
//   }
// }

export const camelToSnakeString = (str: string) => {
  // Special cases for SAML fields
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
  // For SOAP method paths, preserve the original case
  if (str.startsWith('_') || str.startsWith('/')) {
    return str;
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
        // For paths object, preserve the path keys but transform the contents
        if (key === 'paths') {
          const pathsObj = value as Record<string, unknown>;
          const newPathsObj: Record<string, unknown> = {};
          for (const pathKey in pathsObj) {
            // Preserve the original path key
            newPathsObj[pathKey] = mapCamelToSnake(pathsObj[pathKey]);
          }
          newObj[key] = newPathsObj;
        } else if (key === 'requestBody') {
          newObj[key] = value;
        } else {
          newObj[camelToSnakeString(key)] = mapCamelToSnake(value);
        }
      }
    }
    return newObj as unknown as T;
  } else if (
    typeof obj === 'string' &&
    (obj.startsWith('_') || obj.startsWith('/'))
  ) {
    // Preserve SOAP method paths in string values
    return obj as unknown as T;
  } else {
    return obj;
  }
}
