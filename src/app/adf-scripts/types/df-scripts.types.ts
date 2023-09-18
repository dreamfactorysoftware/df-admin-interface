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

export interface ScriptObject {
  name: string;
  type: string;
  content: string;
  isActive: boolean;
  allowEventModification: boolean;
  storageServiceId: number | null;
  scmRepository: string | null;
  scmReference: string | null;
  storagePath: string | null;
  config?: any;
  createdById?: number;
  createdDate?: string;
  lastModifiedById?: number;
  lastModifiedDate?: string;
}

// TODO: may need to update this from snake case to camel case
// additonal note: this object appears in snake case
export interface GithubFileObject {
  content: string;
  download_url: string;
  encoding: string;
  git_url: string;
  html_url: string;
  name: string;
  path: string;
  sha: string;
  size: number;
  type: string;
  url: string;
  _links: { self: string; git: string; html: string };
}
