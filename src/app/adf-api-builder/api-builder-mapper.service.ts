import { Injectable } from '@angular/core';

export type ApiDefinition = {
  id?: number;
  name: string;
  label?: string;
  description?: string;
  basePath?: string;
  base_path?: string;
  status?: string;
  version?: string;
};

export type EndpointDefinition = {
  id?: number;
  apiId?: number;
  api_id?: number;
  method: string;
  path: string;
  label?: string;
  description?: string;
  isActive?: boolean;
  is_active?: boolean;
  executionPlan?: unknown;
  execution_plan?: unknown;
  responseMapping?: unknown;
  response_mapping?: unknown;
  requestSchema?: unknown;
  request_schema?: unknown;
  responseSchema?: unknown;
  response_schema?: unknown;
};

@Injectable({ providedIn: 'root' })
export class ApiBuilderMapperService {
  toApiPayload(input: {
    name: string;
    basePath: string;
    label?: string;
    description?: string;
    status?: string;
  }): Record<string, unknown> {
    return {
      name: input.name,
      base_path: input.basePath,
      label: input.label,
      description: input.description,
      status: input.status,
    };
  }

  toEndpointPayload(input: {
    apiId: number | null | undefined;
    method: string;
    path: string;
    label?: string;
    description?: string;
    isActive: boolean;
    requestSchema: unknown;
    responseSchema: unknown;
    executionPlan: unknown;
    responseMapping: unknown;
  }): Record<string, unknown> {
    return {
      api_id: input.apiId,
      method: input.method,
      path: input.path,
      label: input.label,
      description: input.description,
      is_active: input.isActive,
      request_schema: input.requestSchema,
      response_schema: input.responseSchema,
      execution_plan: input.executionPlan,
      response_mapping: input.responseMapping,
    };
  }
}
