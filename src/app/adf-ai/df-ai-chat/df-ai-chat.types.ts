export interface DataChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | null;
  toolCalls?: DataChatToolCall[];
}

export interface DataChatToolCall {
  tool: string;
  input: Record<string, unknown>;
  outputPreview: string;
  isError: boolean;
  durationMs: number;
}

export interface DataChatRequest {
  messages: { role: string; content: string }[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface DataChatResponse {
  content: string;
  toolCallsMade: DataChatToolCall[];
  messages: DataChatMessage[];
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  iterations: number;
}

export interface DataChatConfig {
  configured: boolean;
  supportsToolUse: boolean;
  appName: string | null;
  roleName: string | null;
  databaseServices: string[];
}

export interface ServiceInfo {
  id: number;
  name: string;
  label: string;
  type: string;
}

export interface ChatEntry {
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: DataChatToolCall[];
  inputTokens?: number;
  outputTokens?: number;
  latencyMs?: number;
  iterations?: number;
}
