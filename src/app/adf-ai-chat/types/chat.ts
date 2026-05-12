export type ChatMessageRole = 'user' | 'assistant' | 'tool' | 'system';

export interface ToolCall {
  id?: string;
  name: string;
  arguments?: Record<string, unknown> | string;
  service?: string;
  table?: string;
}

export interface ChatMessage {
  id: number;
  session_id: number;
  role: ChatMessageRole;
  content: string | null;
  tool_calls?: ToolCall[] | null;
  tool_call_id?: string | null;
  tool_name?: string | null;
  is_error?: boolean;
  input_tokens?: number;
  output_tokens?: number;
  latency_ms?: number;
  created_at?: string;
}

export interface ChatSession {
  id: number;
  service_id: number;
  ai_service_id: number;
  ai_role_id: number;
  user_id?: number | null;
  data_services?: string[] | null;
  allowed_resources?: Record<string, string[]> | null;
  title?: string | null;
  system_prompt?: string | null;
  status: 'active' | 'archived' | string;
  total_input_tokens?: number;
  total_output_tokens?: number;
  tool_call_count?: number;
  created_at?: string;
  updated_at?: string;
  messages?: ChatMessage[];
}

export interface ChatService {
  id: number;
  name: string;
  label: string;
  type: 'ai_chat';
  description?: string;
  isActive: boolean;
}

export interface CreateSessionPayload {
  ai_service_id?: number;
  ai_role_id?: number;
  data_services?: string[];
  allowed_resources?: Record<string, string[]>;
  title?: string;
  system_prompt?: string;
}

export interface SendMessageResponse {
  id: number;
  session_id: number;
  role: ChatMessageRole;
  content: string | null;
  tool_calls?: ToolCall[] | null;
  input_tokens?: number;
  output_tokens?: number;
  latency_ms?: number;
}
