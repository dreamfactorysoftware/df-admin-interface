export function mapSnakeToCamel<T>(obj: T): T {
  const convert = (str: string) =>
    str.replace(/([-_]\w)/g, g => g[1].toUpperCase());

  if (Array.isArray(obj)) {
    return obj.map(item => mapSnakeToCamel(item)) as unknown as T;
  } else if (typeof obj === 'object' && obj !== null) {
    const newObj: Record<string, unknown> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        newObj[convert(key)] = mapSnakeToCamel(
          (obj as Record<string, unknown>)[key]
        );
      }
    }
    return newObj as unknown as T;
  } else {
    return obj;
  }
}

export function mapCamelToSnake<T>(obj: T): T {
  const convert = (str: string) =>
    str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1_$2').toLowerCase();

  if (Array.isArray(obj)) {
    return obj.map(item => mapCamelToSnake(item)) as unknown as T;
  } else if (typeof obj === 'object' && obj !== null) {
    const newObj: Record<string, unknown> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        newObj[convert(key)] = mapCamelToSnake(
          (obj as Record<string, unknown>)[key]
        );
      }
    }
    return newObj as unknown as T;
  } else {
    return obj;
  }
}
