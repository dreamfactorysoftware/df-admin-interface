export interface ScriptDetailsType {
  [serviceName: string]: any;
}

export interface ScriptType {
  name: string;
  label: string;
  description: string;
  sandboxed: boolean;
  supportsInlineExecution: boolean;
}
