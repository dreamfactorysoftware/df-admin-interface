export interface GuardianDashboardStats {
  total_evaluations: number;
  blocks: number;
  flags: number;
  allows: number;
  reviews: number;
  cache_hits: number;
  avg_latency_ms: number | null;
  pending_approvals: number;
}

export interface GuardianDashboardData {
  stats: GuardianDashboardStats;
  risk_distribution: Array<{ range: string; count: number }>;
  timeline: Array<{
    hour: string;
    allow: number;
    block: number;
    flag: number;
    review: number;
  }>;
  alert_counts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  recent_activity: GuardianLogEntry[];
}

export interface GuardianLogEntry {
  id: number;
  mode: string;
  method: string;
  service: string;
  resource: string;
  user_email: string;
  risk_score: number;
  risk_reasoning: string;
  threat_type: string | null;
  decision: string;
  ai_provider: string;
  ai_latency_ms: number;
  created_at: string;
}

export interface GuardianLogTableRow {
  id: number;
  method: string;
  service: string;
  resource: string;
  user_email: string;
  risk_score: number;
  decision: string;
  threat_type: string;
  ai_provider: string;
  created_at: string;
}

export interface GuardianAlertEntry {
  id: number;
  threat_type: string;
  severity: string;
  description: string;
  affected_users: string;
  affected_ips: string;
  recommended_action: string;
  detected_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
}

export interface GuardianAlertTableRow {
  id: number;
  severity: string;
  threat_type: string;
  description: string;
  detected_at: string;
  status: string;
}

export interface GuardianApprovalEntry {
  id: number;
  token: string;
  method: string;
  service: string;
  resource: string;
  user_email: string;
  risk_score: number;
  reasoning: string;
  threat_type: string | null;
  status: string;
  decided_by: string | null;
  decided_at: string | null;
  expires_at: string;
  created_at: string;
}

export interface GuardianApprovalTableRow {
  id: number;
  method: string;
  service: string;
  resource: string;
  user_email: string;
  risk_score: number;
  status: string;
  created_at: string;
}

export interface GuardianConfig {
  gatekeeper_enabled: boolean;
  logwatch_enabled: boolean;
  approval_enabled: boolean;
  cache_enabled: boolean;
  ai_service_name: string;
  fallback_ai_service_name: string;
  threshold: number;
  review_threshold: number;
  fallback_action: string;
  evaluation_timeout: number;
  max_body_size: number;
  cache_ttl: number;
  approval_timeout: number;
  approval_timeout_action: string;
  methods: string;
  bypass_services: string;
  bypass_users: string;
  bypass_ips: string;
  logwatch_frequency: number;
  base_url: string;
  notification_service_name: string;
  notification_email_recipients: string;
  webhook_url: string;
  webhook_format: string;
  telegram_bot_token: string;
  telegram_chat_id: string;
}
