import { ScriptEventResponse } from '../types/scripts';
import { mapCamelToSnake } from './case';

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
