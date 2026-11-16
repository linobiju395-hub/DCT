import React, { useState } from 'react';
import {
  Plus,
  Send,
  RefreshCw,
  Download,
  Upload,
  Globe,
  Sparkles,
  Building2,
  Link2,
  Bell,
  Loader2,
  CheckCircle2,
  FileText,
  Database,
  ArrowRight,
} from 'lucide-react';
import { useDomains } from '../../context/DomainContext';
import { lookupDomainRDAP, getRegistrarRenewalUrl } from '../../services/whoisService';

export const ActionsTab: React.FC = () => {
  const {
    addDomain,
    refreshAllPings,
    batchWhoisRefresh,
    runDailyExpiryCron,
    exportCSV,
    exportJSON,
    importJSON,
    isScanning,
    domains,
  } = useDomains();

  // Form state
  const [domainName, setDomainName] = useState('');
  const [company, setCompany] = useState('Growth & Brand');
  const [registrar, setRegistrar] = useState('');
  const [renewalUrl, setRenewalUrl] = useState('');
  const [alertThresholdDays, setAlertThresholdDays] = useState(30);
  const [telegramChannelId, setTelegramChannelId] = useState('@corp_domain_alerts');
  const [telegramAlertEnabled, setTelegramAlertEnabled] = useState(true);

  // Status & Feedback state
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lookupFeedback, setLookupFeedback] = useState<string | null>(null);
  const [actionProgress, setActionProgress] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Import file state
  const [jsonInput, setJsonInput] = useState('');
  const [showImportBox, setShowImportBox] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleAutoLookup = async () => {
    if (!domainName.trim()) return;
    setIsLookingUp(true);
    setLookupFeedback(null);

    try {
      const clean = domainName.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      const rdap = await lookupDomainRDAP(clean);

      setRegistrar(rdap.registrar);
      setRenewalUrl(getRegistrarRenewalUrl(rdap.registrar, clean));
      setLookupFeedback(`Auto-detected "${rdap.registrar}" (${rdap.days_till_expiry} days remaining).`);
    } catch {
      setLookupFeedback('WHOIS lookup completed with defaults.');
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleAddDomainSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainName.trim()) return;

    setIsSubmitting(true);
    try {
      await addDomain({
        domain_name: domainName,
        company,
        registrar: registrar || 'Auto-detected Registrar',
        renewal_url: renewalUrl || undefined,
        alert_threshold_days: Number(alertThresholdDays),
        telegram_alert_enabled: telegramAlertEnabled,
      });

      setActionSuccess(`Domain ${domainName} successfully registered to monitoring queue!`);
      setDomainName('');
      setRegistrar('');
      setRenewalUrl('');
      setLookupFeedback(null);
      setTimeout(() => setActionSuccess(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRunCron = async () => {
    setActionProgress('Evaluating domain expirations against alert thresholds...');
    const res = await runDailyExpiryCron();
    setActionProgress(null);
    setActionSuccess(`Daily cron finished: ${res.alertsGenerated} threshold reminder(s) generated.`);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const handleRefreshPings = async () => {
    setActionProgress('Executing live HTTP ping check across all endpoints...');
    await refreshAllPings();
    setActionProgress(null);
    setActionSuccess(`Ping sweep finished for all ${domains.length} endpoints.`);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const handleBatchWhois = async () => {
    setActionProgress('Querying official RDAP/WHOIS registry for all domains...');
    const res = await batchWhoisRefresh();
    setActionProgress(null);
    setActionSuccess(`Batch WHOIS refresh complete for ${res.updatedCount} domains.`);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const handleImportSubmit = () => {
    if (!jsonInput.trim()) return;
    const res = importJSON(jsonInput);
    if (res.success) {
      setImportResult({ success: true, message: `Successfully imported ${res.count} domain records!` });
      setJsonInput('');
      setTimeout(() => setShowImportBox(false), 2000);
    } else {
      setImportResult({ success: false, message: res.error || 'Failed to import JSON.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Progress Banner */}
      {actionProgress && (
        <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 rounded-xl flex items-center gap-2.5 text-xs text-indigo-900 dark:text-indigo-300 animate-in fade-in">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span className="font-medium">{actionProgress}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-xl flex items-center gap-2.5 text-xs text-emerald-900 dark:text-emerald-300 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-medium">{actionSuccess}</span>
        </div>
      )}

      {/* Grid: Left = Add Domain Form, Right = Automation & Batch Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Register New Domain Form */}
        <div className="lg:col-span-7 bg-white dark:bg-[#10121a] border border-zinc-200/90 dark:border-zinc-800/80 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Register New Domain to Monitor
              </h2>
            </div>
            <span className="text-[11px] text-zinc-500">WHOIS & Uptime Sync</span>
          </div>

          <form onSubmit={handleAddDomainSubmit} className="p-5 space-y-4 text-xs">
            {/* Domain FQDN */}
            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Domain FQDN <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="e.g. billing-gateway.stripe-internal.io"
                  value={domainName}
                  onChange={(e) => setDomainName(e.target.value)}
                  className="flex-1 bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={handleAutoLookup}
                  disabled={isLookingUp || !domainName.trim()}
                  className="px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50"
                  title="Autofill registrar and expiry date from RDAP servers"
                >
                  {isLookingUp ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  )}
                  <span>Auto-detect</span>
                </button>
              </div>
              {lookupFeedback && (
                <p className="mt-1 text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                  {lookupFeedback}
                </p>
              )}
            </div>

            {/* Department Tag & Registrar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Company / Department Tag</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SecOps & IAM, Payments, CX"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Registrar Name
                </label>
                <input
                  type="text"
                  placeholder="Cloudflare, GoDaddy, Route 53"
                  value={registrar}
                  onChange={(e) => setRegistrar(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                />
              </div>
            </div>

            {/* Direct Renewal URL */}
            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                <Link2 className="w-3.5 h-3.5 text-zinc-400" />
                <span>Renewal Portal Direct URL</span>
              </label>
              <input
                type="url"
                placeholder="https://dash.cloudflare.com/domains"
                value={renewalUrl}
                onChange={(e) => setRenewalUrl(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-[11px]"
              />
              <p className="mt-1 text-[10px] text-zinc-500">
                Direct quick-action link team members can click from the dashboard to renew immediately.
              </p>
            </div>

            {/* Alert Threshold & Telegram Channel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                  <Bell className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Alert Threshold (Days)</span>
                </label>
                <input
                  type="number"
                  min="7"
                  max="180"
                  value={alertThresholdDays}
                  onChange={(e) => setAlertThresholdDays(Number(e.target.value))}
                  className="w-full bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Destination Chat ID / Channel
                </label>
                <input
                  type="text"
                  placeholder="-100123456789 or #ops-alerts"
                  value={telegramChannelId}
                  onChange={(e) => setTelegramChannelId(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Alert Channel Toggle */}
            <div className="p-3 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80 rounded-lg flex items-center justify-between">
              <div>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  Instant Channel Downtime & Expiry Alerts
                </span>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  Route 30-day renewal warnings and immediate downtime failures to the alert channel.
                </p>
              </div>
              <input
                type="checkbox"
                checked={telegramAlertEnabled}
                onChange={(e) => setTelegramAlertEnabled(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-indigo-600 focus:ring-indigo-500"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !domainName.trim()}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 text-xs"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                <span>Register Domain & Initiate Monitoring</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Automation Triggers & Data Operations */}
        <div className="lg:col-span-5 space-y-6">
          {/* Manual Trigger Panel with visual states */}
          <div className="bg-white dark:bg-[#10121a] border border-zinc-200/90 dark:border-zinc-800/80 rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Automated Pipelines & Triggers</span>
              </h2>
              <span className="text-[10px] text-zinc-500 font-mono">CRON & PROBES</span>
            </div>

            <div className="p-4 space-y-3 text-xs">
              {/* Trigger 1: Daily Expiry Cron */}
              <div className="p-3 bg-zinc-50/70 dark:bg-zinc-950/60 border border-zinc-200/70 dark:border-zinc-800/70 rounded-lg flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100">Run Daily Expiry Cron</div>
                  <div className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">
                    Evaluates all domains against the 30-day threshold and dispatches reminders.
                  </div>
                </div>
                <button
                  onClick={handleRunCron}
                  disabled={isScanning}
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-md font-medium transition-colors shrink-0 flex items-center gap-1.5 disabled:opacity-50 text-xs shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Execute</span>
                </button>
              </div>

              {/* Trigger 2: Ping All Endpoints */}
              <div className="p-3 bg-zinc-50/70 dark:bg-zinc-950/60 border border-zinc-200/70 dark:border-zinc-800/70 rounded-lg flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100">Refresh All Pings</div>
                  <div className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">
                    Executes immediate uptime probe across all {domains.length} endpoints to measure latency and HTTP status.
                  </div>
                </div>
                <button
                  onClick={handleRefreshPings}
                  disabled={isScanning}
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-md font-medium transition-colors shrink-0 flex items-center gap-1.5 disabled:opacity-50 text-xs shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sweep</span>
                </button>
              </div>

              {/* Trigger 3: Batch WHOIS Sync */}
              <div className="p-3 bg-zinc-50/70 dark:bg-zinc-950/60 border border-zinc-200/70 dark:border-zinc-800/70 rounded-lg flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100">Batch WHOIS Refresh</div>
                  <div className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">
                    Re-queries authoritative RDAP servers for registration updates and nameservers.
                  </div>
                </div>
                <button
                  onClick={handleBatchWhois}
                  disabled={isScanning}
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-md font-medium transition-colors shrink-0 flex items-center gap-1.5 disabled:opacity-50 text-xs shadow-xs"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Sync</span>
                </button>
              </div>
            </div>
          </div>

          {/* Import / Export Backup Panel */}
          <div className="bg-white dark:bg-[#10121a] border border-zinc-200/90 dark:border-zinc-800/80 rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Registry Backup & Data Portability</span>
              </h2>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <p className="text-zinc-500 text-[11px] leading-relaxed">
                Download your current enterprise registry for offsite audits, or import a JSON domain batch.
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={exportCSV}
                  className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-lg font-medium transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>

                <button
                  onClick={exportJSON}
                  className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-lg font-medium transition-colors flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Export JSON</span>
                </button>

                <button
                  onClick={() => setShowImportBox(!showImportBox)}
                  className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-lg font-medium transition-colors flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Import JSON Batch</span>
                </button>
              </div>

              {/* Import Drawer */}
              {showImportBox && (
                <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2 animate-in fade-in">
                  <textarea
                    rows={4}
                    placeholder='[{"domain_name": "api.corp.io", "company": "Payments", "registrar": "Cloudflare"}]'
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg p-2 font-mono text-[11px] text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  {importResult && (
                    <div
                      className={`p-2 rounded text-[11px] ${
                        importResult.success
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                          : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                      }`}
                    >
                      {importResult.message}
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowImportBox(false)}
                      className="px-2.5 py-1 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleImportSubmit}
                      disabled={!jsonInput.trim()}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium disabled:opacity-50"
                    >
                      Process Import
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
