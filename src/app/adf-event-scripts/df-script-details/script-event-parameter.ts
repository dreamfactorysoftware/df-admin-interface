export type ScriptParamKind = 'table' | 'procedure' | 'function';

// /system/event is exempt from the case interceptor, so the API's raw
// snake_case keys arrive as-is; camelCase is kept for older responses.
const KINDS: Record<string, ScriptParamKind> = {
  table_name: 'table',
  tableName: 'table',
  procedure_name: 'procedure',
  procedureName: 'procedure',
  function_name: 'function',
  functionName: 'function',
};

/**
 * The name list an event's `{table_name}`-style placeholder can take. The API
 * sends `parameter: null` when the service has none (e.g. no stored
 * functions), so fall back to the placeholder in the event name and return an
 * empty list: the picker still shows and a name can be typed in.
 */
export function scriptEventParameter(
  parameter: Record<string, string[]> | null | undefined,
  eventName = ''
): { kind: ScriptParamKind; options: string[] } | null {
  const key = Object.keys(parameter ?? {}).find(k => KINDS[k]);
  if (key && parameter) {
    return { kind: KINDS[key], options: [...parameter[key]] };
  }
  const placeholder = eventName.match(
    /\{(table_name|procedure_name|function_name)\}/
  );
  return placeholder ? { kind: KINDS[placeholder[1]], options: [] } : null;
}
