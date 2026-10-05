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

/** The name list an event's `{table_name}`-style placeholder can take. */
export function scriptEventParameter(
  parameter: Record<string, string[]> | null | undefined
): { kind: ScriptParamKind; options: string[] } | null {
  const key = Object.keys(parameter ?? {}).find(k => KINDS[k]);
  return key && parameter
    ? { kind: KINDS[key], options: [...parameter[key]] }
    : null;
}
