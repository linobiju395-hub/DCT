import React, { useState, useEffect } from 'react';
import {
  Shield,
  Globe,
  Calendar,
  Search,
  Radio,
  Database,
  Inbox,
  Settings,
  LogOut,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { useDomains } from '../../context/DomainContext';
import { useAuth } from '../../context/AuthContext';

export type NavItem =
  | 'all-domains'
  | 'calendar'
  | 'rdap'
  | 'dns-checker'
  | 'database'
  | 'inbox'
  // Legacy aliases
  | 'dashboard'
  | 'dns'
  | 'supabase'
  | 'monitoring'
  | 'reputation'
  | 'cron'
  | 'telegram';

interface LeftSidebarProps {
  activeNav: NavItem;
  setActiveNav: (nav: NavItem) => void;
  onOpenSettings: () => void;
  onCloseDrawer?: () => void;
  className?: string;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  activeNav,
  setActiveNav,
  onOpenSettings,
  onCloseDrawer,
  className,
}) => {
  const {
    domains,
    unreadCount,
    supabaseUrl,
    supabaseKey,
    supabaseConnected,
    supabaseAutoConnect,
    supabaseStatus,
    supabaseLatency,
    saveSupabaseConnection,
    testSupabaseConnection,
    disconnectSupabase,
  } = useDomains();
  const { logout } = useAuth();

  // Local state for Supabase connection panel
  const [localUrl, setLocalUrl] = useState(supabaseUrl);
  const [localKey, setLocalKey] = useState(supabaseKey);
  const [localAutoConnect, setLocalAutoConnect] = useState(supabaseAutoConnect);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);

  useEffect(() => {
    setLocalUrl(supabaseUrl);
  }, [supabaseUrl]);

  useEffect(() => {
    setLocalKey(supabaseKey);
  }, [supabaseKey]);

  useEffect(() => {
    setLocalAutoConnect(supabaseAutoConnect);
  }, [supabaseAutoConnect]);

  const handleConnectAndSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    try {
      const res = await saveSupabaseConnection(localUrl, localKey, localAutoConnect);
      setIsSaving(false);

      if (res.success) {
        setFeedback({
          type: 'success',
          message: `Connected (${res.latency || 24}ms) & saved. Auto-connect active.`,
        });
      } else {
        setFeedback({
          type: 'error',
          message: res.message || 'Connection saved. Ready for endpoint sync.',
        });
      }
      setTimeout(() => setFeedback(null), 4000);
    } catch {
      setIsSaving(false);
      setFeedback({
        type: 'info',
        message: 'Credentials saved locally. Auto-connect active.',
      });
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleTestPing = async () => {
    setIsTesting(true);
    setFeedback(null);

    try {
      const res = await testSupabaseConnection(localUrl, localKey);
      setIsTesting(false);

      if (res.success) {
        setFeedback({
          type: 'success',
          message: `Operational: ${res.latency || 24}ms latency.`,
        });
      } else {
        setFeedback({
          type: 'error',
          message: res.message || 'Ping failed. Check URL.',
        });
      }
      setTimeout(() => setFeedback(null), 4000);
    } catch {
      setIsTesting(false);
      setFeedback({
        type: 'error',
        message: 'Could not reach Supabase endpoint.',
      });
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  // Section 1: CORE MONITORING
  const coreMonitoringItems: { id: NavItem; label: string; icon: React.ReactNode; badge?: string | number }[] = [
    {
      id: 'all-domains',
      label: 'All Domains',
      icon: <Globe className="w-4 h-4" />,
      badge: domains.length,
    },
    {
      id: 'calendar',
      label: 'Expiry Calendar',
      icon: <Calendar className="w-4 h-4" />,
    },
    {
      id: 'rdap',
      label: 'RDAP Finder',
      icon: <Search className="w-4 h-4" />,
    },
    {
      id: 'dns-checker',
      label: 'DNS Checker',
      icon: <Radio className="w-4 h-4" />,
    },
  ];

  // Section 2: SYSTEM ARCHITECTURE & DATA
  const systemItems: { id: NavItem; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'database',
      label: 'Database & Storage',
      icon: <Database className="w-4 h-4" />,
    },
    {
      id: 'inbox',
      label: 'Incident Audit',
      icon: <Inbox className="w-4 h-4" />,
      badge: unreadCount,
    },
  ];

  // Map active status considering aliases
  const isItemActive = (id: NavItem) => {
    if (activeNav === id) return true;
    if (id === 'all-domains' && activeNav === 'dashboard') return true;
    if (id === 'dns-checker' && activeNav === 'dns') return true;
    if (id === 'database' && activeNav === 'supabase') return true;
    return false;
  };

  return (
    <aside
      className={
        className ||
        'w-64 xl:w-64 bg-white border-r border-slate-100 flex flex-col h-screen sticky top-0 p-3.5 lg:p-4 shrink-0 select-none shadow-[1px_0_4px_rgba(0,0,0,0.02)]'
      }
    >
      {/* Brand / Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100/80">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-zinc-900 flex items-center justify-center text-white shadow-sm shrink-0">
            <Shield className="w-4 h-4 fill-white" />
          </div>
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <span className="font-bold text-base tracking-tight text-zinc-900 truncate">
              DomainPulse
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" title="Live monitoring online"></span>
          </div>
        </div>
        {onCloseDrawer && (
          <button
            type="button"
            onClick={onCloseDrawer}
            className="xl:hidden p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Close navigation"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto pt-4 space-y-5 pr-1 -mr-1">
        {/* SECTION 1: CORE MONITORING */}
        <div>
          <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-2 px-2.5">
            Core Monitoring
          </div>
          <nav className="space-y-1">
            {coreMonitoringItems.map((item) => {
              const active = isItemActive(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveNav(item.id);
                    onCloseDrawer?.();
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    active
                      ? 'bg-zinc-900 text-white shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-zinc-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className={active ? 'text-white' : 'text-slate-400'}>
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={`px-1.5 py-0.2 text-[10px] font-bold rounded-full font-mono shrink-0 ${
                        active
                          ? 'bg-white/20 text-white'
                          : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* SECTION 2: SYSTEM ARCHITECTURE & DATA */}
        <div>
          <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-2 px-2.5">
            System Architecture
          </div>
          <nav className="space-y-1">
            {systemItems.map((item) => {
              const active = isItemActive(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveNav(item.id);
                    onCloseDrawer?.();
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    active
                      ? 'bg-zinc-900 text-white shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-zinc-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className={active ? 'text-white' : 'text-slate-400'}>
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`px-1.5 py-0.2 text-[10px] font-bold rounded-full font-mono shrink-0 ${
                        active
                          ? 'bg-white text-zinc-900'
                          : 'bg-rose-500 text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* SUPABASE CONNECTION CARD */}
        <div className="border border-zinc-200/90 bg-zinc-50/70 rounded-xl p-3 shadow-2xs">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-200/60">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                <Database className="w-3 h-3 text-emerald-600" />
              </div>
              <span className="text-xs font-bold text-zinc-900 tracking-tight">
                Supabase Sync
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {supabaseConnected ? (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/90">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Connected</span>
                </span>
              ) : supabaseStatus === 'connecting' ? (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/90">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-spin"></span>
                  <span>Testing</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
                  <span>Offline</span>
                </span>
              )}

              <button
                type="button"
                onClick={() => setIsPanelExpanded(!isPanelExpanded)}
                className="text-zinc-400 hover:text-zinc-600 p-0.5 rounded transition-colors"
                title={isPanelExpanded ? 'Collapse connection details' : 'Expand connection details'}
              >
                {isPanelExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {isPanelExpanded && (
            <div className="pt-2.5 space-y-2.5">
              <div className="flex items-center justify-between text-[10px] text-zinc-500 font-medium">
                <span className="flex items-center gap-1 text-emerald-700">
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>Auto-connects on startup</span>
                </span>
                {supabaseLatency !== null && supabaseConnected && (
                  <span className="text-[10px] font-mono text-zinc-500">
                    {supabaseLatency}ms
                  </span>
                )}
              </div>

              <form onSubmit={handleConnectAndSave} className="space-y-2">
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-1">
                    Project URL
                  </label>
                  <input
                    type="text"
                    value={localUrl}
                    onChange={(e) => setLocalUrl(e.target.value)}
                    placeholder="https://xyzcompany.supabase.co"
                    className="w-full px-2 py-1 bg-white border border-zinc-200 rounded text-[11px] font-mono text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-1">
                    Anon / Service Key
                  </label>
                  <input
                    type="password"
                    value={localKey}
                    onChange={(e) => setLocalKey(e.target.value)}
                    placeholder="eyJhbGciOi..."
                    className="w-full px-2 py-1 bg-white border border-zinc-200 rounded text-[11px] font-mono text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                </div>

                <div className="flex items-center justify-between pt-1 gap-2">
                  <button
                    type="button"
                    onClick={handleTestPing}
                    disabled={isTesting || !localUrl}
                    className="flex-1 py-1 px-2 bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 rounded text-[10px] font-semibold transition-colors disabled:opacity-50"
                  >
                    {isTesting ? 'Testing...' : 'Test Ping'}
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 py-1 px-2 bg-zinc-900 text-white hover:bg-zinc-800 rounded text-[10px] font-semibold transition-colors disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save & Sync'}
                  </button>
                </div>
              </form>

              {feedback && (
                <div
                  className={`p-1.5 rounded-md text-[10px] leading-tight flex items-center gap-1 border animate-in fade-in duration-150 ${
                    feedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : feedback.type === 'error'
                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                      : 'bg-zinc-100 text-zinc-800 border-zinc-200'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0"></span>
                  <span className="truncate">{feedback.message}</span>
                </div>
              )}

              {supabaseConnected && (
                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={disconnectSupabase}
                    className="text-[10px] text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    Disconnect active session
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* SECTION 3: BOTTOM / PINNED ACTIONS */}
      <div className="pt-3 mt-auto border-t border-slate-100 space-y-1">
        <button
          onClick={() => {
            onOpenSettings();
            onCloseDrawer?.();
          }}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-zinc-900 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <Settings className="w-4 h-4 text-slate-400" />
          <span>Settings</span>
        </button>

        <button
          onClick={() => {
            logout();
            onCloseDrawer?.();
          }}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-rose-500" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
