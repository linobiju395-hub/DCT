export type DomainStatus = 'online' | 'degraded' | 'down' | 'pending';

export type NotificationType =
  | 'downtime_error'
  | 'expiry_30d'
  | 'expiry_repeating'
  | 'ssl_warning'
  | 'recovered'
  | 'email_renewal_30d';

export type TeamRole = 'admin' | 'lead' | 'member';

export interface DomainRecord {
  id: string;
  domain_name: string;
  company: string; // Internal team/department or company owner tag
  assignee?: string; // Designated team member lead
  client_name?: string; // Client contact or company name
  client_telegram_id?: string; // Client Telegram Chat ID, Group ID, or Channel ID
  send_alerts_to_client?: boolean; // Route domain alerts directly to client chat
  client_email?: string; // Client email for formal renewal reminders
  client_cc_emails?: string; // Comma-separated secondary contacts or team leads
  email_notifications_enabled?: boolean; // Automated 30-day email reminders toggle
  last_email_sent_at?: string; // Timestamp of last email notice dispatched
  last_email_stage?: '30d' | '30_day_warning' | '14d' | '7d' | 'expired'; // Tracks alert milestones sent
  mailjet_message_id?: string; // Mailjet v3.1 message delivery identifier for audit tracking
  brevo_message_id?: string; // Legacy message delivery identifier for audit tracking
  resend_message_id?: string; // Legacy message delivery identifier for audit tracking
  registrar: string;
  renewal_url: string; // Direct link to registrar renewal portal
  status: DomainStatus;
  http_status: number;
  response_time_ms: number;
  ssl_valid: boolean;
  ssl_expires_at?: string;
  registered_at?: string;
  expires_at: string;
  days_till_expiry: number; // Calculated remaining days
  nameservers: string[];
  alert_threshold_days: number;
  telegram_alert_enabled: boolean;
  security_score?: number; // 0-100 overall infrastructure security score
  security_gaps?: string[]; // Specific gap reasons (e.g. Missing DMARC, Expiry <30d)
  dnssec_enabled?: boolean;
  dnsbl_clean?: boolean;
  last_checked_at: string;
  created_at: string;
  updated_at: string;
}

export interface DNSBLCheckResult {
  target: string;
  ip: string;
  clean: boolean;
  listedCount: number;
  totalChecked: number;
  threatScore: number;
  reputation: 'Clean' | 'Suspicious' | 'Blacklisted';
  checkedAt: string;
  blacklists: Array<{
    name: string;
    host: string;
    description: string;
    listed: boolean;
    response: string;
    status: 'clean' | 'listed';
  }>;
}

export interface SecurityScoreEvaluation {
  domain: string;
  score: number;
  grade: string;
  gaps: string[];
  evaluatedAt: string;
}


export interface UptimeCheck {
  id: string;
  domain_id: string;
  status: DomainStatus;
  http_status: number;
  response_time_ms: number;
  error_message?: string;
  checked_at: string;
}

export interface NotificationItem {
  id: string;
  domain_id: string;
  domain_name: string;
  company: string;
  client_name?: string;
  client_email?: string;
  target_chat_id?: string;
  recipient_type?: 'client' | 'internal';
  type: NotificationType;
  channel: 'telegram' | 'inbox' | 'email';
  recipient: string;
  title: string;
  message: string;
  renewal_url?: string;
  delivered_at: string;
  read: boolean;
}

export interface TeamMember {
  id: string;
  email: string;
  full_name: string;
  role: TeamRole;
  department: string;
  created_at: string;
}

export interface TelegramConfig {
  bot_token: string;
  chat_id: string;
  channel_name?: string;
  webhook_url?: string;
  enabled: boolean;
}

export interface EmailConfig {
  provider: 'mailjet' | 'brevo' | 'resend' | 'sendgrid' | 'postmark' | 'ses' | 'smtp';
  api_key: string; // Mailjet API key, Brevo API key, or SMTP password
  secret_key?: string; // Mailjet Secret Key (Basic Auth)
  mailjet_api_key?: string; // Explicit persistent Mailjet API key
  mailjet_secret_key?: string; // Explicit persistent Mailjet Secret Key
  brevo_api_key?: string; // Legacy API key
  resend_api_key?: string; // Legacy API key
  from_email: string;
  from_name: string;
  verified_sender_email?: string;
  sender_display_name?: string;
  smtp_host?: string;
  smtp_port?: number;
  smtp_user?: string;
  enabled: boolean;
}

export interface RDAPLookupResult {
  domain: string;
  registrar: string;
  registered_at?: string;
  expires_at?: string;
  nameservers: string[];
  days_till_expiry: number;
  source: 'whois.com (api.who.is)' | 'whois_api' | 'rdap' | 'whois-fallback' | string;
  statuses?: string[];
  last_changed_at?: string;
  raw?: any;
}

export interface UptimePingResult {
  domain: string;
  status: DomainStatus;
  http_status: number;
  response_time_ms: number;
  ssl_valid: boolean;
  error_message?: string;
  checked_at: string;
}

export type ActivityLogType =
  | 'cron_run'
  | 'downtime'
  | 'telegram_alert'
  | 'email_alert'
  | 'domain_added'
  | 'domain_updated'
  | 'domain_deleted'
  | 'ping_batch';

export interface ActivityLogItem {
  id: string;
  type: ActivityLogType;
  title: string;
  description: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error' | 'info';
  metadata?: {
    domain?: string;
    company?: string;
    latency?: number;
    http_status?: number;
    channel?: string;
    target_chat_id?: string;
    client_name?: string;
    client_email?: string;
    email_stage?: string;
    recipient_type?: 'client' | 'internal';
    client_alerts_count?: number;
    internal_alerts_count?: number;
    emails_sent_count?: number;
    affected_count?: number;
  };
}

