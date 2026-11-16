import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Building2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Eye,
  Sparkles,
} from 'lucide-react';
import { useDomains } from '../../context/DomainContext';
import { DomainRecord } from '../../types/domain';
import { sendLiveMailjetEmail } from '../../services/emailService';

interface SendTestEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDomainId?: string;
  initialRecipient?: string;
}

export const SendTestEmailModal: React.FC<SendTestEmailModalProps> = ({
  isOpen,
  onClose,
  initialDomainId,
  initialRecipient,
}) => {
  const { domains, emailConfig } = useDomains();

  const [selectedDomainId, setSelectedDomainId] = useState<string>('');
  const [recipient, setRecipient] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [cc, setCc] = useState<string>('');
  const [bcc, setBcc] = useState<string>('');
  const [showAdvancedHeaders, setShowAdvancedHeaders] = useState<boolean>(false);
  const [includeTestBadge, setIncludeTestBadge] = useState<boolean>(true);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [showHtmlPreview, setShowHtmlPreview] = useState<boolean>(false);

  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
    resendId?: string;
  } | null>(null);

  // Sync state when opened
  useEffect(() => {
    if (isOpen) {
      setFeedback(null);
      const targetDomain =
        domains.find((d) => d.id === initialDomainId) ||
        domains.find((d) => d.client_email) ||
        domains[0];

      if (targetDomain) {
        setSelectedDomainId(targetDomain.id);
        setRecipient(initialRecipient || targetDomain.client_email || 'linobiju395@gmail.com');
        setClientName(targetDomain.client_name || targetDomain.company || 'Valued Client');
        setCc(targetDomain.client_cc_emails || '');
      } else {
        setRecipient(initialRecipient || 'linobiju395@gmail.com');
      }
    }
  }, [isOpen, initialDomainId, initialRecipient, domains]);

  const activeDomain: DomainRecord | undefined =
    domains.find((d) => d.id === selectedDomainId) || domains[0];

  const handleDomainChange = (domainId: string) => {
    setSelectedDomainId(domainId);
    const d = domains.find((item) => item.id === domainId);
    if (d) {
      if (d.client_email) {
        setRecipient(d.client_email);
      }
      setClientName(d.client_name || d.company || 'Valued Client');
      setCc(d.client_cc_emails || '');
    }
    setFeedback(null);
  };

  const handleSendLiveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient.trim()) return;

    setIsSending(true);
    setFeedback(null);

    const domainName = activeDomain?.domain_name || 'example.com';
    const daysLeft = activeDomain?.days_till_expiry || 30;
    const expiryDate = activeDomain?.expires_at || new Date().toISOString();
    const registrar = activeDomain?.registrar || 'Accredited Registrar';
    const renewalUrl = activeDomain?.renewal_url || `https://${domainName}`;

    const res = await sendLiveMailjetEmail({
      to: recipient.trim(),
      client_name: clientName.trim(),
      domain_name: domainName,
      days_left: daysLeft,
      expiry_date: expiryDate,
      registrar: registrar,
      renewal_url: renewalUrl,
      is_test: includeTestBadge,
      include_test_badge: includeTestBadge,
      cc: cc.trim() || undefined,
      bcc: bcc.trim() || undefined,
      api_key: emailConfig.mailjet_api_key || emailConfig.api_key,
      secret_key: emailConfig.mailjet_secret_key || emailConfig.secret_key,
      from_name: emailConfig.sender_display_name || emailConfig.from_name || 'Domain Operations Team',
      from_email: emailConfig.verified_sender_email || emailConfig.from_email || 'alerts@domainpulse.corp',
    });

    setIsSending(false);

    if (res.success) {
      setFeedback({
        type: 'success',
        message: `Live email dispatched to ${recipient.trim()}`,
        resendId: res.mailjet_message_id || res.messageId,
      });
    } else {
      setFeedback({
        type: 'error',
        message: res.error || 'Failed to dispatch email via Mailjet.',
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden text-zinc-900 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center shadow-xs">
              <Mail className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-zinc-900">Send Live Test Email</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Mailjet v3.1 REST API
                </span>
              </div>
              <p className="text-[11px] text-zinc-500">
                Dispatch transactional renewal notices directly via api.mailjet.com/v3.1/send
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-800 p-1.5 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSendLiveEmail} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Status Feedback */}
          {feedback && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50/90 text-emerald-900 border-emerald-200'
                  : 'bg-rose-50/90 text-rose-900 border-rose-200'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <p className="font-medium">{feedback.message}</p>
                {feedback.resendId && (
                  <p className="text-[11px] font-mono text-emerald-700">
                    Mailjet Message ID: <span className="font-bold">{feedback.resendId}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Domain Preview Selector */}
          <div>
            <label className="block font-semibold text-zinc-800 mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-zinc-400" />
              <span>Target Domain Asset Data</span>
            </label>
            <select
              value={selectedDomainId}
              onChange={(e) => handleDomainChange(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-zinc-900 font-medium focus:outline-none focus:ring-1 focus:ring-zinc-800 cursor-pointer"
            >
              {domains.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.domain_name} — {d.client_name ? `${d.client_name} · ` : ''}Expires in {d.days_till_expiry}d ({d.registrar})
                </option>
              ))}
            </select>
            <p className="text-[10px] text-zinc-500 mt-1">
              Populates official RDAP registrar, expiration date, and one-click renewal portal into the email.
            </p>
          </div>

          {/* Recipient & Client Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-zinc-800 mb-1">
                Recipient Email <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="billing@clientbrand.com"
                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-zinc-900 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-800 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-zinc-800 mb-1">Client Contact Name</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Acme Billing Team"
                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-zinc-900 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-800"
              />
            </div>
          </div>

          {/* Advanced Headers Toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvancedHeaders(!showAdvancedHeaders)}
              className="text-[11px] font-semibold text-zinc-500 hover:text-zinc-900 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>{showAdvancedHeaders ? 'Hide CC / BCC Contacts' : '+ Add CC / BCC Oversight Contacts'}</span>
              {showAdvancedHeaders ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {showAdvancedHeaders && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2 p-3 bg-zinc-50/70 border border-zinc-200 rounded-xl animate-in fade-in duration-100">
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">CC Email Contacts</label>
                  <input
                    type="text"
                    value={cc}
                    onChange={(e) => setCc(e.target.value)}
                    placeholder="domain-ops@company.com"
                    className="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-zinc-900 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-800"
                  />
                </div>
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">BCC (Audit Lead)</label>
                  <input
                    type="text"
                    value={bcc}
                    onChange={(e) => setBcc(e.target.value)}
                    placeholder="audit-trail@internal.corp"
                    className="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-zinc-900 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-800"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Sender Credentials Indicator */}
          <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-zinc-500">Mailjet REST API Sender:</span>
              <span className="font-mono font-medium text-zinc-800">
                {emailConfig.sender_display_name || emailConfig.from_name || 'Domain Operations Team'} &lt;
                {emailConfig.verified_sender_email || emailConfig.from_email || 'alerts@domainpulse.corp'}&gt;
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-zinc-500">Active API Key:</span>
              <span className="font-mono text-zinc-700">
                {(emailConfig.mailjet_api_key || emailConfig.api_key)
                  ? (emailConfig.mailjet_api_key || emailConfig.api_key)!.slice(0, 7) + '••••••••' + (emailConfig.mailjet_api_key || emailConfig.api_key)!.slice(-4)
                  : '•••••••••••••••• (Configured via env)'}
              </span>
            </div>
          </div>

          {/* Test Watermark Toggle */}
          <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl flex items-center justify-between">
            <div>
              <span className="font-semibold text-amber-950 text-xs block">
                Include [TEST PREVIEW] in Subject Line
              </span>
              <p className="text-[10px] text-amber-800/80 mt-0.5">
                Clearly flags the notice as an administrative simulation. Uncheck for genuine client delivery.
              </p>
            </div>
            <input
              type="checkbox"
              checked={includeTestBadge}
              onChange={(e) => setIncludeTestBadge(e.target.checked)}
              className="w-4 h-4 rounded border-amber-300 text-zinc-900 focus:ring-zinc-800 cursor-pointer shrink-0"
            />
          </div>

          {/* Template Live Preview Toggle */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowHtmlPreview(!showHtmlPreview)}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{showHtmlPreview ? 'Hide Email Preview' : 'Show Live Email Template Preview'}</span>
            </button>

            {showHtmlPreview && activeDomain && (
              <div className="mt-2.5 p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3">
                <div className="text-[11px] text-zinc-500 font-mono border-b border-zinc-200 pb-2">
                  <strong>Subject:</strong>{' '}
                  {includeTestBadge
                    ? `[Test] Renewal Reminder: ${activeDomain.domain_name} expires in ${activeDomain.days_till_expiry} days`
                    : `Urgent: ${activeDomain.domain_name} is scheduled to expire in ${activeDomain.days_till_expiry} days`}
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs">
                  Your domain is due for renewal in <strong>{activeDomain.days_till_expiry} days</strong> (Expiration Date:{' '}
                  <strong>{new Date(activeDomain.expires_at).toLocaleDateString()}</strong>).
                </div>
                <div className="text-[11px] space-y-1 text-zinc-600">
                  <p>• <strong>Asset:</strong> {activeDomain.domain_name}</p>
                  <p>• <strong>Registrar:</strong> {activeDomain.registrar}</p>
                  <p>• <strong>Status:</strong> Active / Needs Renewal</p>
                  <p>• <strong>Renewal URL:</strong> {activeDomain.renewal_url}</p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-zinc-600 hover:text-zinc-900 font-semibold text-xs rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSending || !recipient.trim()}
              className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer transition-all active:scale-[0.98]"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>Sending via Mailjet...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Send Live Email via Mailjet &nearr;</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
