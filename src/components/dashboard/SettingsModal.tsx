import React, { useState, useEffect } from 'react';
import {
  X,
  Settings,
  Check,
  Save,
  Mail,
  Eye,
  EyeOff,
  Send,
  ExternalLink,
  RefreshCw,
  FileText,
  Users,
  Shield,
  Plus,
  Trash2,
  Database,
  Bell,
  Radio,
} from 'lucide-react';
import { useDomains } from '../../context/DomainContext';
import { useAuth } from '../../context/AuthContext';
import { EmailConfig } from '../../types/domain';
import { generateRenewalEmailHtml } from '../../services/emailService';
import { SendTestEmailModal } from '../modals/SendTestEmailModal';
import { TEAM_OWNERS, TeamOwner } from '../../data/teamData';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'alert' | 'email' | 'team' | 'database';
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'alert',
}) => {
  const {
    alertBotToken,
    alertChatId,
    alertNotifyOutage,
    alertNotifyExpiry30d,
    alertNotifyWeeklyDigest,
    saveAlertCredentials,
    saveAlertToggles,
    testTelegramConnection,
    dbServiceUrl,
    dbApiKey,
    saveDbConnection,
    saveSupabaseConnection,
    emailConfig,
    updateEmailConfig,
    testEmailConnection,
    domains,
  } = useDomains();

  const [activeTab, setActiveTab] = useState<'alert' | 'email' | 'team' | 'database'>(defaultTab);

  // Tab 1: Alert Channel (Bot & Webhooks)
  const [botToken, setBotToken] = useState(alertBotToken);
  const [chatId, setChatId] = useState(alertChatId);
  const [showBotToken, setShowBotToken] = useState(false);
  const [routeToClients, setRouteToClients] = useState(() => {
    return localStorage.getItem('domainpulse_route_to_clients') !== 'false';
  });
  const [notifyOutage, setNotifyOutage] = useState(alertNotifyOutage);
  const [notifyExpiry30d, setNotifyExpiry30d] = useState(alertNotifyExpiry30d);
  const [notifyWeeklyDigest, setNotifyWeeklyDigest] = useState(alertNotifyWeeklyDigest);
  const [isTestingBot, setIsTestingBot] = useState(false);
  const [botTestResult, setBotTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Tab 2: Email Service (Mailjet)
  const [emailApiKey, setEmailApiKey] = useState(emailConfig.mailjet_api_key || emailConfig.api_key || '');
  const [emailSecretKey, setEmailSecretKey] = useState(emailConfig.mailjet_secret_key || emailConfig.secret_key || '');
  const [fromEmail, setFromEmail] = useState(emailConfig.verified_sender_email || emailConfig.from_email || 'alerts@domainpulse.corp');
  const [fromName, setFromName] = useState(emailConfig.sender_display_name || emailConfig.from_name || 'Domain Operations Team');
  const [emailRemindersEnabled, setEmailRemindersEnabled] = useState(emailConfig.enabled ?? true);
  const [showEmailKey, setShowEmailKey] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [isLiveTestModalOpen, setIsLiveTestModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Tab 3: Team & Access Management
  const [teamMembers, setTeamMembers] = useState<Array<TeamOwner & { roleType?: 'Admin' | 'Manager' | 'Viewer' }>>(() => {
    try {
      const saved = localStorage.getItem('domainpulse_team_members');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return TEAM_OWNERS.map((m, idx) => ({
      ...m,
      roleType: idx === 0 ? 'Admin' : idx <= 2 ? 'Manager' : 'Viewer',
    }));
  });
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberDept, setNewMemberDept] = useState('Core Engineering');
  const [newMemberRole, setNewMemberRole] = useState<'Admin' | 'Manager' | 'Viewer'>('Manager');

  // Tab 4: Database & APIs (whois.com + Supabase)
  const [whoisApiKey, setWhoisApiKey] = useState(() => {
    return localStorage.getItem('domainpulse_whois_api_key') || 'wis_live_AEwE2WYgyrFRZlI4s6k8tXDqa05QuEjwsrIAFFRb';
  });
  const [showWhoisKey, setShowWhoisKey] = useState(false);
  const [isTestingWhois, setIsTestingWhois] = useState(false);
  const [whoisTestResult, setWhoisTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [serviceUrl, setServiceUrl] = useState(dbServiceUrl);
  const [serviceKey, setServiceKey] = useState(dbApiKey);

  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);

  // Synchronize on open or prop change
  useEffect(() => {
    if (defaultTab) setActiveTab(defaultTab);
  }, [defaultTab, isOpen]);

  useEffect(() => {
    setBotToken(alertBotToken);
  }, [alertBotToken]);

  useEffect(() => {
    setChatId(alertChatId);
  }, [alertChatId]);

  useEffect(() => {
    setEmailApiKey(emailConfig.mailjet_api_key || emailConfig.api_key || '');
    setEmailSecretKey(emailConfig.mailjet_secret_key || emailConfig.secret_key || '');
    setFromEmail(emailConfig.verified_sender_email || emailConfig.from_email || 'alerts@domainpulse.corp');
    setFromName(emailConfig.sender_display_name || emailConfig.from_name || 'Domain Operations Team');
    setEmailRemindersEnabled(emailConfig.enabled ?? true);
  }, [emailConfig]);

  if (!isOpen) return null;

  const handleSave = () => {
    // 1. Save Alert Channel
    saveAlertCredentials(botToken.trim(), chatId.trim());
    saveAlertToggles({
      notifyOutage,
      notifyExpiry30d,
      notifyWeeklyDigest,
    });
    localStorage.setItem('domainpulse_route_to_clients', String(routeToClients));

    // 2. Save Email Service (Mailjet)
    const cleanApiKey = emailApiKey.trim();
    const cleanSecretKey = emailSecretKey.trim();
    const cleanFromEmail = fromEmail.trim();
    const cleanFromName = fromName.trim();

    updateEmailConfig({
      provider: 'mailjet',
      api_key: cleanApiKey,
      secret_key: cleanSecretKey,
      mailjet_api_key: cleanApiKey,
      mailjet_secret_key: cleanSecretKey,
      from_email: cleanFromEmail,
      verified_sender_email: cleanFromEmail,
      from_name: cleanFromName,
      sender_display_name: cleanFromName,
      enabled: emailRemindersEnabled,
    });

    localStorage.setItem('domainpulse_mailjet_api_key', cleanApiKey);
    localStorage.setItem('domainpulse_mailjet_secret_key', cleanSecretKey);
    localStorage.setItem('domainpulse_email_from_email', cleanFromEmail);
    localStorage.setItem('domainpulse_email_from_name', cleanFromName);

    // 3. Save Team Members
    localStorage.setItem('domainpulse_team_members', JSON.stringify(teamMembers));

    // 4. Save Database Connection & Whois API Engine
    saveDbConnection(serviceUrl, serviceKey);
    saveSupabaseConnection(serviceUrl, serviceKey, true);
    localStorage.setItem('domainpulse_whois_api_key', whoisApiKey.trim());

    setSavedFeedback('Settings and credentials saved successfully.');
    setTimeout(() => setSavedFeedback(null), 3500);
  };

  const handleTestBotPing = async () => {
    setIsTestingBot(true);
    setBotTestResult(null);

    // Persist input first so test uses current values
    saveAlertCredentials(botToken.trim(), chatId.trim());

    try {
      const res = await testTelegramConnection();
      if (res.success) {
        setBotTestResult({
          success: true,
          message: 'Test ping successfully transmitted to Telegram bot and chat.',
        });
      } else {
        setBotTestResult({
          success: false,
          message: res.error || 'Test ping failed. Check token and chat ID.',
        });
      }
    } catch (err: any) {
      setBotTestResult({
        success: false,
        message: err?.message || 'Connection error while dispatching test ping.',
      });
    } finally {
      setIsTestingBot(false);
    }
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberEmail.trim()) return;

    const newOwner: TeamOwner & { roleType: 'Admin' | 'Manager' | 'Viewer' } = {
      id: `team-${Date.now()}`,
      name: newMemberName.trim(),
      email: newMemberEmail.trim(),
      role: newMemberRole === 'Admin' ? 'Director of Engineering' : 'Domain Lead',
      roleType: newMemberRole,
      department: newMemberDept.trim(),
      avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80`,
      assignedDomainsCount: 0,
    };

    const updated = [newOwner, ...teamMembers];
    setTeamMembers(updated);
    localStorage.setItem('domainpulse_team_members', JSON.stringify(updated));

    setNewMemberName('');
    setNewMemberEmail('');
    setShowAddMember(false);
  };

  const handleUpdateRole = (id: string, newRole: 'Admin' | 'Manager' | 'Viewer') => {
    const updated = teamMembers.map((m) => (m.id === id ? { ...m, roleType: newRole } : m));
    setTeamMembers(updated);
    localStorage.setItem('domainpulse_team_members', JSON.stringify(updated));
  };

  const handleRemoveMember = (id: string) => {
    const updated = teamMembers.filter((m) => m.id !== id);
    setTeamMembers(updated);
    localStorage.setItem('domainpulse_team_members', JSON.stringify(updated));
  };

  const handleTestWhoisPing = async () => {
    setIsTestingWhois(true);
    setWhoisTestResult(null);
    try {
      const res = await fetch(`/api/whois/details?domain=webcoffee.in`);
      if (res.ok) {
        const data = await res.json();
        setWhoisTestResult({
          success: true,
          message: `whois.com API OK: Verified ${data.domain || 'webcoffee.in'} (${data.registrar || 'Registrar'}) with ${data.dns?.records?.length || 0} DNS records.`,
        });
      } else {
        setWhoisTestResult({
          success: false,
          message: `whois.com API error (HTTP ${res.status}). Fallback sources active.`,
        });
      }
    } catch (err: any) {
      setWhoisTestResult({
        success: false,
        message: err?.message || 'Failed to ping whois.com API.',
      });
    } finally {
      setIsTestingWhois(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-zinc-200 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-xs">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow-xs">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-900">Unified System Settings</h3>
              <p className="text-[11px] text-zinc-500">Alert triggers, delivery engines, and access management</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-900 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 4 Tabs Header */}
        <div className="flex border-b border-zinc-100 px-4 sm:px-6 pt-3 gap-4 sm:gap-6 bg-white shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('alert')}
            className={`pb-2.5 px-1 font-bold text-xs border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'alert'
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-400 hover:text-zinc-700'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Alert Channel</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('email')}
            className={`pb-2.5 px-1 font-bold text-xs border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'email'
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-400 hover:text-zinc-700'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email Service (Mailjet)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('team')}
            className={`pb-2.5 px-1 font-bold text-xs border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'team'
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-400 hover:text-zinc-700'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Team &amp; Access</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('database')}
            className={`pb-2.5 px-1 font-bold text-xs border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'database'
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-400 hover:text-zinc-700'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Database &amp; APIs</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {savedFeedback && (
            <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{savedFeedback}</span>
            </div>
          )}

          {/* TAB 1: ALERT CHANNEL (BOT & WEBHOOKS) */}
          {activeTab === 'alert' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-sm text-zinc-900">Telegram Bot &amp; Webhook Channel</h4>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Real-time alerts for server outages, SSL drops, and renewal notices.
                </p>
              </div>

              {/* Bot Configuration Inputs */}
              <div className="p-4 bg-zinc-50/80 border border-zinc-200/90 rounded-2xl space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-zinc-800 text-xs">Bot Access Token</label>
                    <button
                      type="button"
                      onClick={() => setShowBotToken(!showBotToken)}
                      className="text-[11px] text-zinc-500 hover:text-zinc-900 flex items-center gap-1 cursor-pointer"
                    >
                      {showBotToken ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showBotToken ? 'Mask' : 'Reveal'}</span>
                    </button>
                  </div>
                  <input
                    type={showBotToken ? 'text' : 'password'}
                    placeholder="7123456789:AAH••••••••••••••••••••••••"
                    value={botToken}
                    onChange={(e) => setBotToken(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-zinc-900 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                  <p className="text-[10px] text-zinc-400 mt-1">
                    Obtained from @BotFather on Telegram. Saved to local persistent storage.
                  </p>
                </div>

                <div>
                  <label className="font-semibold text-zinc-800 text-xs block mb-1">
                    Default Fallback Chat ID / Channel ID
                  </label>
                  <input
                    type="text"
                    placeholder="-1001984729103 or @channel_name"
                    value={chatId}
                    onChange={(e) => setChatId(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-zinc-900 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                  <p className="text-[10px] text-zinc-400 mt-1">
                    Receives internal team alerts and notices when client-specific chat is not configured.
                  </p>
                </div>
              </div>

              {/* Client Routing Toggle */}
              <div className="p-3.5 bg-zinc-50/80 border border-zinc-200/90 rounded-2xl flex items-center justify-between gap-3">
                <div>
                  <span className="font-semibold text-zinc-900 text-xs block">
                    Route Alerts to Individual Client Telegram IDs
                  </span>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    When enabled, domain notifications are routed directly to the client's assigned Telegram ID, falling back to default chat.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={routeToClients}
                    onChange={(e) => setRouteToClients(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-zinc-900"></div>
                </label>
              </div>

              {/* Alert Triggers Toggles */}
              <div className="space-y-2 pt-1">
                <span className="font-bold text-xs uppercase tracking-wider text-zinc-500 block">
                  Alert Trigger Rules
                </span>

                <div className="space-y-2">
                  <div className="p-3 bg-white border border-zinc-200 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-zinc-900 text-xs block">Instant Downtime Alerts</span>
                      <span className="text-[11px] text-zinc-500">Trigger immediate notice when HTTP status != 200 or DNS drops.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifyOutage}
                      onChange={(e) => setNotifyOutage(e.target.checked)}
                      className="w-4 h-4 accent-zinc-900 cursor-pointer"
                    />
                  </div>

                  <div className="p-3 bg-white border border-zinc-200 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-zinc-900 text-xs block">30-Day Expiry Warnings</span>
                      <span className="text-[11px] text-zinc-500">Dispatch alerts at 30 days, 14 days, and 7 days before registration expires.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifyExpiry30d}
                      onChange={(e) => setNotifyExpiry30d(e.target.checked)}
                      className="w-4 h-4 accent-zinc-900 cursor-pointer"
                    />
                  </div>

                  <div className="p-3 bg-white border border-zinc-200 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-zinc-900 text-xs block">Weekly Infrastructure Digest</span>
                      <span className="text-[11px] text-zinc-500">Consolidated Monday summary with average latency and portfolio stats.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifyWeeklyDigest}
                      onChange={(e) => setNotifyWeeklyDigest(e.target.checked)}
                      className="w-4 h-4 accent-zinc-900 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Test Action */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleTestBotPing}
                  disabled={isTestingBot || !botToken}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Send className={`w-3.5 h-3.5 ${isTestingBot ? 'animate-pulse' : ''}`} />
                  <span>{isTestingBot ? 'Transmitting Ping...' : 'Send Test Ping'}</span>
                </button>

                {botTestResult && (
                  <span
                    className={`text-xs font-medium ${
                      botTestResult.success ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    {botTestResult.message}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: EMAIL SERVICE (MAILJET) */}
          {activeTab === 'email' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-zinc-900">Mailjet Transactional v3.1 REST API</h4>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Direct transactional delivery for client 30-day renewal notices via api.mailjet.com/v3.1/send (Basic Auth).
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Ready (v3.1 REST API Configured)
                </span>
              </div>

              {/* Mailjet API Key & Secret Key */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-zinc-800 text-xs">Mailjet API Key (MAILJET_API_KEY)</label>
                    <button
                      type="button"
                      onClick={() => setShowEmailKey(!showEmailKey)}
                      className="text-[11px] text-zinc-500 hover:text-zinc-900 flex items-center gap-1 cursor-pointer"
                    >
                      {showEmailKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showEmailKey ? 'Mask' : 'Reveal'}</span>
                    </button>
                  </div>
                  <input
                    type={showEmailKey ? 'text' : 'password'}
                    placeholder="••••••••••••••••••••••••••••••••"
                    value={emailApiKey}
                    onChange={(e) => setEmailApiKey(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-zinc-900 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-zinc-800 text-xs">Mailjet Secret Key (MAILJET_SECRET_KEY)</label>
                    <button
                      type="button"
                      onClick={() => setShowSecretKey(!showSecretKey)}
                      className="text-[11px] text-zinc-500 hover:text-zinc-900 flex items-center gap-1 cursor-pointer"
                    >
                      {showSecretKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showSecretKey ? 'Mask' : 'Reveal'}</span>
                    </button>
                  </div>
                  <input
                    type={showSecretKey ? 'text' : 'password'}
                    placeholder="••••••••••••••••••••••••••••••••"
                    value={emailSecretKey}
                    onChange={(e) => setEmailSecretKey(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-zinc-900 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                </div>
              </div>

              {/* Verified Sender & Display Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-800 mb-1 text-xs">
                    Verified Sender Email
                  </label>
                  <input
                    type="email"
                    value={fromEmail}
                    onChange={(e) => setFromEmail(e.target.value)}
                    placeholder="alerts@domainpulse.corp or alerts@yourdomain.com"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-zinc-900 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-800 mb-1 text-xs">
                    Sender Display Name
                  </label>
                  <input
                    type="text"
                    value={fromName}
                    onChange={(e) => setFromName(e.target.value)}
                    placeholder="Domain Operations Team"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-zinc-900 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                </div>
              </div>

              {/* 30-Day Reminder Toggle */}
              <div className="p-3.5 bg-zinc-50/80 border border-zinc-200/90 rounded-2xl flex items-center justify-between gap-3">
                <div>
                  <span className="font-semibold text-zinc-900 text-xs block">
                    Enable 30-Day Automated Client Email Reminders
                  </span>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Automatically generate and send formal renewal reminders with direct registrar links during daily sweep.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={emailRemindersEnabled}
                    onChange={(e) => setEmailRemindersEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-zinc-900"></div>
                </label>
              </div>

              {/* Live Test Dispatcher Trigger */}
              <div className="p-4 bg-zinc-900 text-white rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">Live Email Dispatcher</span>
                  <span className="text-[10px] font-mono text-emerald-400">Production Test Mode</span>
                </div>
                <p className="text-[11px] text-zinc-300">
                  Transmit an authentic renewal warning email to any destination address to verify Mailjet inbox delivery.
                </p>
                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsLiveTestModalOpen(true)}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Live Test Email &nearr;</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPreviewOpen(true)}
                    className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Preview HTML Template</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TEAM & ACCESS MANAGEMENT */}
          {activeTab === 'team' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-zinc-900">Team &amp; Access Directory</h4>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Assign member roles (Admin, Manager, Viewer) for domain authorizations.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddMember(!showAddMember)}
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Invite Member</span>
                </button>
              </div>

              {/* Add Member Form */}
              {showAddMember && (
                <form onSubmit={handleAddMember} className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-3 animate-in fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-zinc-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rachel Adams"
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                        className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-zinc-700 mb-1">Email Address</label>
                      <input
                        type="email"
                        required
                        placeholder="rachel@company.com"
                        value={newMemberEmail}
                        onChange={(e) => setNewMemberEmail(e.target.value)}
                        className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-zinc-700 mb-1">Department</label>
                      <input
                        type="text"
                        value={newMemberDept}
                        onChange={(e) => setNewMemberDept(e.target.value)}
                        className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-zinc-700 mb-1">Access Role</label>
                      <select
                        value={newMemberRole}
                        onChange={(e) => setNewMemberRole(e.target.value as any)}
                        className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                      >
                        <option value="Admin">Admin (Full Control &amp; Settings)</option>
                        <option value="Manager">Manager (Edit &amp; Renew Domains)</option>
                        <option value="Viewer">Viewer (Read-only Telemetry)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddMember(false)}
                      className="px-3 py-1.5 bg-white border border-zinc-200 text-zinc-600 rounded-lg text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-zinc-900 text-white rounded-lg text-xs font-semibold"
                    >
                      Add Member
                    </button>
                  </div>
                </form>
              )}

              {/* Members List */}
              <div className="divide-y divide-zinc-100 border border-zinc-200 rounded-2xl overflow-hidden">
                {teamMembers.map((member) => (
                  <div key={member.id} className="p-3.5 bg-white flex items-center justify-between gap-3 hover:bg-zinc-50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-8 h-8 rounded-full object-cover border border-zinc-200"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-zinc-900 text-xs truncate">{member.name}</span>
                          <span className="text-[10px] text-zinc-400">({member.department})</span>
                        </div>
                        <span className="text-[11px] text-zinc-500 font-mono block truncate">{member.email}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={member.roleType || 'Manager'}
                        onChange={(e) => handleUpdateRole(member.id, e.target.value as any)}
                        className="bg-zinc-50 border border-zinc-200 text-zinc-800 text-[11px] font-semibold rounded-lg px-2 py-1 focus:outline-none"
                      >
                        <option value="Admin">Admin</option>
                        <option value="Manager">Manager</option>
                        <option value="Viewer">Viewer</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-zinc-400 hover:text-rose-600 p-1 rounded transition-colors"
                        title="Remove member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: DATABASE & STORAGE */}
          {activeTab === 'database' && (
            <div className="space-y-5">
              {/* Primary Engine: Whois.com API */}
              <div className="p-4 bg-zinc-50/80 border border-zinc-200/90 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-zinc-900">whois.com (api.who.is) API Engine</h4>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Primary authoritative engine for domain registrars, expiry dates, DNS records, and TLS certificates.
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Active (Primary Source)
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-zinc-800 text-xs">API Token (WHOIS_API_KEY)</label>
                    <button
                      type="button"
                      onClick={() => setShowWhoisKey(!showWhoisKey)}
                      className="text-[11px] text-zinc-500 hover:text-zinc-900 flex items-center gap-1 cursor-pointer"
                    >
                      {showWhoisKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showWhoisKey ? 'Mask' : 'Reveal'}</span>
                    </button>
                  </div>
                  <input
                    type={showWhoisKey ? 'text' : 'password'}
                    value={whoisApiKey}
                    onChange={(e) => setWhoisApiKey(e.target.value)}
                    placeholder="wis_live_••••••••••••••••••••••••"
                    className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-zinc-900 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                  <p className="text-[10px] text-zinc-400 mt-1">
                    Bearer token authenticated against https://api.who.is/v1/.
                  </p>
                </div>

                <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <button
                    type="button"
                    onClick={handleTestWhoisPing}
                    disabled={isTestingWhois}
                    className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer self-start"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTestingWhois ? 'animate-spin' : ''}`} />
                    <span>{isTestingWhois ? 'Testing Endpoint...' : 'Ping whois.com API (Test Query)'}</span>
                  </button>

                  {whoisTestResult && (
                    <span
                      className={`text-xs font-medium ${
                        whoisTestResult.success ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      {whoisTestResult.message}
                    </span>
                  )}
                </div>
              </div>

              {/* PostgreSQL / Supabase Storage Sync */}
              <div className="p-4 bg-zinc-50/80 border border-zinc-200/90 rounded-2xl space-y-3">
                <div>
                  <h4 className="font-bold text-sm text-zinc-900">PostgreSQL / Supabase Storage Sync</h4>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Synchronize domain telemetry records and audit logs to remote PostgreSQL.
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Project Endpoint URL</label>
                  <input
                    type="text"
                    value={serviceUrl}
                    onChange={(e) => setServiceUrl(e.target.value)}
                    placeholder="https://xyzcompany.supabase.co"
                    className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-zinc-900 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Service / Anon Key</label>
                  <input
                    type="password"
                    value={serviceKey}
                    onChange={(e) => setServiceKey(e.target.value)}
                    placeholder="eyJhbGciOi..."
                    className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-zinc-900 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-zinc-100 flex items-center justify-between bg-zinc-50/50 shrink-0">
          <span className="text-[11px] text-zinc-400">
            Changes persist across all browser sessions.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 rounded-xl font-medium text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Configuration</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mount SendTestEmailModal */}
      <SendTestEmailModal
        isOpen={isLiveTestModalOpen}
        onClose={() => setIsLiveTestModalOpen(false)}
        initialRecipient="linobiju395@gmail.com"
        initialDomainId={domains[0]?.id}
      />

      {/* HTML Template Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
              <span className="font-bold text-xs text-zinc-900">HTML Renewal Email Preview</span>
              <button onClick={() => setIsPreviewOpen(false)} className="text-zinc-400 hover:text-zinc-900 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <div
                dangerouslySetInnerHTML={{
                  __html: generateRenewalEmailHtml(
                    domains[0] || {
                      id: 'sample-1',
                      domain_name: 'webcoffee.in',
                      company: 'Webcoffee Innovations Pvt Ltd',
                      client_name: 'Webcoffee Innovations',
                      registrar: 'GoDaddy.com, LLC',
                      renewal_url: 'https://account.godaddy.com/renewals',
                      status: 'online',
                      http_status: 200,
                      response_time_ms: 45,
                      ssl_valid: true,
                      expires_at: '2026-11-12T00:00:00Z',
                      days_till_expiry: 14,
                      nameservers: ['ns1.godaddy.com', 'ns2.godaddy.com'],
                      alert_threshold_days: 30,
                      telegram_alert_enabled: true,
                      last_checked_at: new Date().toISOString(),
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                    },
                    14,
                    fromName
                  ),
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
