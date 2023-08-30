export function mapSnakeToCamel(obj: any): any {
  const convert = (str: string) =>
    str.replace(/([-_]\w)/g, g => g[1].toUpperCase());

  if (Array.isArray(obj)) {
    return obj.map(item => mapSnakeToCamel(item));
  } else if (typeof obj === 'object' && obj !== null) {
    const newObj: any = {};
    for (const key in obj) {
      newObj[convert(key)] = mapSnakeToCamel(obj[key]);
    }
    return newObj;
  } else {
    return obj;
  }
}

export function mapCamelToSnake(obj: any): any {
  const convert = (str: string) =>
    str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1_$2').toLowerCase();

  if (Array.isArray(obj)) {
    return obj.map(item => mapCamelToSnake(item));
  } else if (typeof obj === 'object' && obj !== null) {
    const newObj: any = {};
    for (const key in obj) {
      newObj[convert(key)] = mapCamelToSnake(obj[key]);
    }
    return newObj;
  } else {
    return obj;
  }
}
