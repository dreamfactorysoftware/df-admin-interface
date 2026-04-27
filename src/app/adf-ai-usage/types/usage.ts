import { ChatMessage, ChatSession } from 'src/app/adf-ai-chat/types/chat';

/** Per-session record enriched with the chat-service name it came from. */
export interface UsageSessionRow extends ChatSession {
  service_name: string;
  service_label?: string;
}

/** A single bucket in a time-series. */
export interface TimeBucket {
  date: string; // YYYY-MM-DD
  inputTokens: number;
  outputTokens: number;
  toolCalls: number;
  sessions: number;
}

/** Aggregated totals for a single grouping key (user, role, service, etc.). */
export interface GroupRow {
  key: string;
  label: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  toolCalls: number;
  sessions: number;
}

/** Top-line summary cards. */
export interface UsageSummary {
  sessionCount: number; // requests for the gateway, sessions in chat-only views
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  toolCalls: number;
  avgTokensPerSession: number;
  avgToolCallsPerSession: number;
  errors?: number;
  avgLatencyMs?: number;
}

export type GroupBy = 'user' | 'role' | 'service';
export type TimeRange = '24h' | '7d' | '30d' | 'all';

/** Provider rate sheet for cost estimation. Costs are per 1k tokens. */
export interface ProviderRates {
  provider: string;
  inputPer1k: number;
  outputPer1k: number;
}

/** Re-export common types so consumers don't chase imports. */
export type { ChatMessage, ChatSession };
