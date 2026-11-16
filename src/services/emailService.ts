import { DomainRecord, EmailConfig } from '../types/domain';

export interface EmailDispatchPayload {
  to: string;
  cc?: string;
  subject: string;
  html: string;
  text: string;
  domain: string;
  stage: '30d' | '14d' | '7d' | 'expired';
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  recipient: string;
  stage: string;
  error?: string;
  simulated?: boolean;
}

/**
 * Generate formal, executive-grade responsive HTML email for client domain renewal notices
 */
export function generateRenewalEmailHtml(domain: DomainRecord, daysLeft: number, fromName: string = 'DomainPulse Infrastructure Operations'): string {
  const clientName = domain.client_name ? `${domain.client_name} Team` : 'Domain Administrator';
  const formattedExpiry = new Date(domain.expires_at).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const nameserverList = (domain.nameservers && domain.nameservers.length > 0)
    ? domain.nameservers.slice(0, 2).join(', ')
    : `ns1.${domain.domain_name}, ns2.${domain.domain_name}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Action Required: Domain Expiration Notice</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f4f5f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
    table { border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%; }
    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e4e7eb; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04); }
    .header { padding: 32px 40px 24px 40px; border-bottom: 1px solid #f0f2f5; }
    .brand-pill { display: inline-block; padding: 4px 10px; background-color: #18181b; color: #ffffff; border-radius: 6px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; }
    .content { padding: 36px 40px; }
    .alert-banner { background-color: #fffbeb; border: 1px solid #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 16px 20px; margin-bottom: 28px; }
    .alert-title { color: #92400e; font-size: 14px; font-weight: 700; margin: 0 0 4px 0; }
    .alert-sub { color: #b45309; font-size: 13px; margin: 0; }
    .details-table { width: 100%; margin: 24px 0; border: 1px solid #edf0f3; border-radius: 8px; background-color: #fafbfc; }
    .details-table td { padding: 12px 18px; border-bottom: 1px solid #edf0f3; font-size: 13px; }
    .details-table tr:last-child td { border-bottom: none; }
    .detail-label { color: #64748b; font-weight: 500; width: 38%; }
    .detail-val { color: #0f172a; font-weight: 600; text-align: right; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .detail-val-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    .cta-container { text-align: center; margin: 36px 0 28px 0; }
    .cta-btn { display: inline-block; background-color: #0f172a; color: #ffffff !important; padding: 14px 32px; border-radius: 8px; font-size: 14px; font-weight: 600; text-decoration: none; box-shadow: 0 2px 6px rgba(15, 23, 42, 0.2); }
    .cta-btn:hover { background-color: #1e293b; }
    .footer { padding: 24px 40px 32px 40px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand-pill">DomainPulse &middot; Infrastructure Operations</div>
      <h1 style="margin: 16px 0 0 0; font-size: 20px; font-weight: 700; color: #0f172a; letter-spacing: -0.3px;">
        Action Required: Domain Expiration Warning
      </h1>
      <p style="margin: 6px 0 0 0; font-size: 13px; color: #64748b;">
        Automated Enterprise Registry &amp; Lifecycle Alert
      </p>
    </div>

    <div class="content">
      <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #334155;">
        Hello <strong>${clientName}</strong>,
      </p>
      <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #334155;">
        This is an official automated advisory to notify you that your registered domain asset 
        <strong style="color: #0f172a; font-family: monospace;">${domain.domain_name}</strong> 
        is scheduled to expire in <strong>${daysLeft} days</strong>.
      </p>

      <div class="alert-banner">
        <p class="alert-title">Upcoming Expiry: ${daysLeft} Days Remaining</p>
        <p class="alert-sub">To maintain uninterrupted DNS resolution and secure SSL routing, please ensure renewal is processed before the expiration date.</p>
      </div>

      <table class="details-table" cellpadding="0" cellspacing="0">
        <tr>
          <td class="detail-label">Asset Domain</td>
          <td class="detail-val detail-val-mono" style="color: #0f172a; font-size: 14px;">${domain.domain_name}</td>
        </tr>
        <tr>
          <td class="detail-label">Official Expiration Date</td>
          <td class="detail-val">${formattedExpiry}</td>
        </tr>
        <tr>
          <td class="detail-label">Accredited Registrar</td>
          <td class="detail-val">${domain.registrar}</td>
        </tr>
        <tr>
          <td class="detail-label">Authoritative Nameservers</td>
          <td class="detail-val detail-val-mono" style="font-size: 12px; color: #475569;">${nameserverList}</td>
        </tr>
        <tr>
          <td class="detail-label">Managing Department</td>
          <td class="detail-val">${domain.company}</td>
        </tr>
      </table>

      <div class="cta-container">
        <a href="${domain.renewal_url || 'https://' + domain.domain_name}" target="_blank" class="cta-btn">
          Renew Domain Now &rarr;
        </a>
      </div>

      <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.5; text-align: center;">
        Direct link: <a href="${domain.renewal_url}" style="color: #2563eb; text-decoration: underline; word-break: break-all;">${domain.renewal_url}</a>
      </p>
    </div>

    <div class="footer">
      <p style="margin: 0 0 8px 0;">
        This is an automated lifecycle notice dispatched by <strong>${fromName}</strong>.
      </p>
      <p style="margin: 0;">
        If this domain is already set to auto-renew with your registrar, or has been recently processed, you may safely disregard this message.
      </p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generate clean plain-text fallback for client renewal notice
 */
export function generateRenewalEmailText(domain: DomainRecord, daysLeft: number, fromName: string = 'DomainPulse Infrastructure Operations'): string {
  const clientName = domain.client_name ? `${domain.client_name} Team` : 'Domain Administrator';
  const formattedExpiry = new Date(domain.expires_at).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `ACTION REQUIRED: DOMAIN RENEWAL NOTICE (${domain.domain_name})

Hello ${clientName},

This is an automated advisory from ${fromName} to notify you that your domain is scheduled to expire in ${daysLeft} days.

==================================================
ASSET DETAILS
==================================================
Domain: ${domain.domain_name}
Official Expiry Date: ${formattedExpiry}
Accredited Registrar: ${domain.registrar}
Managing Team: ${domain.company}
Authoritative Nameservers: ${(domain.nameservers || []).join(', ')}

==================================================
RENEWAL ACTION
==================================================
Renew immediately via your accredited registrar portal:
${domain.renewal_url}

To ensure zero downtime to public web traffic, email delivery, and SSL certificates, please process renewal before ${formattedExpiry}.

If this asset is already enrolled in automated renewal with your registrar, you may safely disregard this advisory.

Best regards,
${fromName}`;
}

export interface EmailSendResult {
  success: boolean;
  status?: string;
  provider?: string;
  messageId?: string;
  mailjet_message_id?: string;
  brevo_message_id?: string;
  resend_id?: string;
  recipient: string;
  stage: string;
  error?: string;
  simulated?: boolean;
}

export interface LiveEmailPayload {
  to: string;
  client_name?: string;
  domain_name: string;
  days_left: number;
  expiry_date?: string;
  registrar?: string;
  renewal_url?: string;
  is_test?: boolean;
  include_test_badge?: boolean;
  cc?: string;
  bcc?: string;
  api_key?: string;
  secret_key?: string;
  from_name?: string;
  from_email?: string;
}

/**
 * Dispatch live on-demand email via Mailjet transactional v3.1 REST API
 */
export async function sendLiveResendEmail(payload: LiveEmailPayload): Promise<EmailSendResult> {
  return sendLiveMailjetEmail(payload);
}

export async function sendLiveBrevoEmail(payload: LiveEmailPayload): Promise<EmailSendResult> {
  return sendLiveMailjetEmail(payload);
}

export async function sendLiveMailjetEmail(payload: LiveEmailPayload): Promise<EmailSendResult> {
  try {
    const res = await fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok && (data.success || data.messageId)) {
      const msgId = data.mailjet_message_id || data.messageId || data.brevo_message_id || data.resend_id;
      return {
        success: true,
        status: data.status || 'sent',
        provider: 'mailjet',
        messageId: msgId,
        mailjet_message_id: msgId,
        brevo_message_id: msgId,
        resend_id: msgId,
        recipient: data.recipient || payload.to,
        stage: payload.is_test ? 'test' : '30_day_warning',
        simulated: data.status === 'queued' || data.simulated,
      };
    }

    return {
      success: false,
      status: 'failed',
      provider: 'mailjet',
      recipient: payload.to,
      stage: payload.is_test ? 'test' : '30_day_warning',
      error: data.error || 'Failed to dispatch email via Mailjet',
    };
  } catch (err: any) {
    return {
      success: false,
      status: 'error',
      provider: 'mailjet',
      recipient: payload.to,
      stage: payload.is_test ? 'test' : '30_day_warning',
      error: err.message || 'Network error connecting to email dispatcher',
    };
  }
}

/**
 * Dispatch renewal notice email via Mailjet backend API
 */
export async function dispatchClientRenewalEmail(
  domain: DomainRecord,
  daysLeft: number,
  emailConfig?: EmailConfig
): Promise<EmailSendResult> {
  const recipientEmail = domain.client_email?.trim();
  if (!recipientEmail) {
    return {
      success: false,
      status: 'error',
      provider: 'mailjet',
      recipient: 'none',
      stage: '30_day_warning',
      error: 'Domain does not have a client_email address configured.',
    };
  }

  const fromName = emailConfig?.sender_display_name || emailConfig?.from_name || 'Domain Operations Team';
  const fromEmail = emailConfig?.verified_sender_email || emailConfig?.from_email || 'alerts@domainpulse.corp';
  const apiKey = emailConfig?.mailjet_api_key || emailConfig?.api_key;
  const secretKey = emailConfig?.mailjet_secret_key || emailConfig?.secret_key;

  try {
    const res = await fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: recipientEmail,
        cc: domain.client_cc_emails,
        domain_name: domain.domain_name,
        days_left: daysLeft,
        expiry_date: domain.expires_at,
        client_name: domain.client_name,
        registrar: domain.registrar,
        renewal_url: domain.renewal_url,
        from_name: fromName,
        from_email: fromEmail,
        api_key: apiKey,
        secret_key: secretKey,
        is_test: false,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok && (data.success || data.messageId)) {
      const msgId = data.mailjet_message_id || data.messageId || data.brevo_message_id || data.resend_id;
      return {
        success: true,
        status: data.status || 'sent',
        provider: 'mailjet',
        messageId: msgId,
        mailjet_message_id: msgId,
        brevo_message_id: msgId,
        resend_id: msgId,
        recipient: recipientEmail,
        stage: '30_day_warning',
        simulated: data.status === 'queued' || data.simulated,
      };
    }

    return {
      success: false,
      status: 'failed',
      provider: 'mailjet',
      recipient: recipientEmail,
      stage: '30_day_warning',
      error: data.error || 'Mailjet delivery failed',
    };
  } catch (err: any) {
    return {
      success: false,
      status: 'error',
      provider: 'mailjet',
      recipient: recipientEmail,
      stage: '30_day_warning',
      error: err.message || 'Failed to dispatch email',
    };
  }
}

/**
 * Dispatch test email to verify Mailjet connection
 */
export async function sendTestEmail(
  toEmail: string,
  emailConfig: EmailConfig
): Promise<{ success: boolean; status?: string; messageId?: string; mailjet_message_id?: string; brevo_message_id?: string; resend_id?: string; error?: string; simulated?: boolean }> {
  try {
    const fromName = emailConfig?.sender_display_name || emailConfig?.from_name || 'Domain Operations Team';
    const fromEmail = emailConfig?.verified_sender_email || emailConfig?.from_email || 'alerts@domainpulse.corp';
    const apiKey = emailConfig?.mailjet_api_key || emailConfig?.api_key;
    const secretKey = emailConfig?.mailjet_secret_key || emailConfig?.secret_key;

    const res = await fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: toEmail,
        is_test: true,
        include_test_badge: true,
        from_name: fromName,
        from_email: fromEmail,
        api_key: apiKey,
        secret_key: secretKey,
        domain_name: 'test-preview.internal',
        days_left: 30,
        client_name: 'Infrastructure Lead',
        registrar: 'Cloudflare Registrar',
        renewal_url: 'https://dash.cloudflare.com',
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok && (data.success || data.messageId)) {
      const msgId = data.mailjet_message_id || data.messageId || data.brevo_message_id || data.resend_id;
      return {
        success: true,
        status: data.status || 'sent',
        messageId: msgId,
        mailjet_message_id: msgId,
        brevo_message_id: msgId,
        resend_id: msgId,
        simulated: data.status === 'queued' || data.simulated,
      };
    }

    return {
      success: false,
      error: data.error || 'Server rejected test email dispatch',
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to dispatch test email',
    };
  }
}
