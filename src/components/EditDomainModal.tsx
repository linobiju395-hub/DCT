import React, { useState, useEffect } from 'react';
import { X, Edit2, Building2, Link2, Bell, Save, Mail, Send } from 'lucide-react';
import { useDomains } from '../context/DomainContext';
import { DomainRecord } from '../types/domain';

interface EditDomainModalProps {
  isOpen: boolean;
  domain: DomainRecord | null;
  onClose: () => void;
}

export const EditDomainModal: React.FC<EditDomainModalProps> = ({ isOpen, domain, onClose }) => {
  const { updateDomain } = useDomains();

  const [company, setCompany] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientCcEmails, setClientCcEmails] = useState('');
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true);
  const [clientTelegramId, setClientTelegramId] = useState('');
  const [sendAlertsToClient, setSendAlertsToClient] = useState(true);
  const [registrar, setRegistrar] = useState('');
  const [renewalUrl, setRenewalUrl] = useState('');
  const [alertThresholdDays, setAlertThresholdDays] = useState(30);
  const [telegramAlertEnabled, setTelegramAlertEnabled] = useState(true);

  useEffect(() => {
    if (domain) {
      setCompany(domain.company);
      setClientName(domain.client_name || '');
      setClientEmail(domain.client_email || '');
      setClientCcEmails(domain.client_cc_emails || '');
      setEmailNotificationsEnabled(domain.email_notifications_enabled ?? true);
      setClientTelegramId(domain.client_telegram_id || '');
      setSendAlertsToClient(domain.send_alerts_to_client ?? Boolean(domain.client_telegram_id));
      setRegistrar(domain.registrar);
      setRenewalUrl(domain.renewal_url);
      setAlertThresholdDays(domain.alert_threshold_days);
      setTelegramAlertEnabled(domain.telegram_alert_enabled);
    }
  }, [domain]);

  if (!isOpen || !domain) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateDomain(domain.id, {
      company: company.trim() || domain.company,
      client_name: clientName.trim() || undefined,
      client_email: clientEmail.trim() || undefined,
      client_cc_emails: clientCcEmails.trim() || undefined,
      email_notifications_enabled: emailNotificationsEnabled,
      client_telegram_id: clientTelegramId.trim() || undefined,
      send_alerts_to_client: sendAlertsToClient,
      registrar: registrar.trim() || domain.registrar,
      renewal_url: renewalUrl.trim() || domain.renewal_url,
      alert_threshold_days: Number(alertThresholdDays),
      telegram_alert_enabled: telegramAlertEnabled,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-zinc-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#10121a] border border-zinc-200 dark:border-zinc-800 rounded-t-2xl sm:rounded-xl max-w-lg w-full max-h-[92vh] sm:max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Edit2 className="w-4 h-4 text-indigo-500" />
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Edit Domain Settings</h3>
              <p className="text-[11px] font-mono text-zinc-500">{domain.domain_name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 text-xs overflow-y-auto">
          {/* Company / Department */}
          <div>
            <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-zinc-400" />
              <span>Company / Internal Team Tag</span>
            </label>
            <input
              type="text"
              required
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Client Communication Channels Card */}
          <div className="p-3.5 bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200/90 dark:border-zinc-800 rounded-lg space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-500" />
                <span>Client Communication & Renewal Routing</span>
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">Dedicated Dispatch</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Client / Owner Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Acme Corporation or Alex Vance"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-zinc-400" />
                  <span>Client Email Address</span>
                </label>
                <input
                  type="email"
                  placeholder="billing@clientbrand.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  CC Team Contacts (Optional)
                </label>
                <input
                  type="text"
                  placeholder="domain-ops@clientbrand.com, tech@..."
                  value={clientCcEmails}
                  onChange={(e) => setClientCcEmails(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                  <Send className="w-3 h-3 text-zinc-400" />
                  <span>Client Telegram Chat ID</span>
                </label>
                <input
                  type="text"
                  placeholder="@client_channel or 123456789"
                  value={clientTelegramId}
                  onChange={(e) => setClientTelegramId(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Email Reminders Toggle */}
            <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <label htmlFor="edit-send-email-client" className="font-medium text-zinc-800 dark:text-zinc-200 cursor-pointer block">
                  Enable 30-Day Automated Email Reminders
                </label>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  Automatically delivers formal executive renewal notices directly to client email 30 days prior to expiry.
                </p>
              </div>
              <input
                id="edit-send-email-client"
                type="checkbox"
                checked={emailNotificationsEnabled}
                onChange={(e) => setEmailNotificationsEnabled(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
              />
            </div>

            {/* Telegram Direct Alert Toggle */}
            <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <label htmlFor="edit-send-alerts-client" className="font-medium text-zinc-800 dark:text-zinc-200 cursor-pointer block">
                  Send Telegram Alerts to Client directly
                </label>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  Route bot notifications to this client's chat. Falls back to internal team chat if unassigned.
                </p>
              </div>
              <input
                id="edit-send-alerts-client"
                type="checkbox"
                checked={sendAlertsToClient}
                onChange={(e) => setSendAlertsToClient(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
              />
            </div>
          </div>

          {/* Registrar & Threshold */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Registrar
              </label>
              <input
                type="text"
                value={registrar}
                onChange={(e) => setRegistrar(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                <Bell className="w-3.5 h-3.5 text-zinc-400" />
                <span>Threshold (Days)</span>
              </label>
              <input
                type="number"
                min="7"
                max="180"
                value={alertThresholdDays}
                onChange={(e) => setAlertThresholdDays(Number(e.target.value))}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Direct Renewal URL */}
          <div>
            <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
              <Link2 className="w-3.5 h-3.5 text-zinc-400" />
              <span>Direct Registrar Renewal URL</span>
            </label>
            <input
              type="url"
              value={renewalUrl}
              onChange={(e) => setRenewalUrl(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Alert Channel Toggle */}
          <div className="p-3 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80 rounded-lg flex items-center justify-between">
            <div>
              <span className="font-medium text-zinc-800 dark:text-zinc-200">Alert Channel Notifications</span>
              <p className="text-[10px] text-zinc-500 mt-0.5">
                Enable expiry warnings and immediate downtime alerts for this domain.
              </p>
            </div>
            <input
              type="checkbox"
              checked={telegramAlertEnabled}
              onChange={(e) => setTelegramAlertEnabled(e.target.checked)}
              className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-indigo-600 focus:ring-indigo-500"
            />
          </div>

          {/* Footer buttons */}
          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
