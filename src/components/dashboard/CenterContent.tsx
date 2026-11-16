import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  SlidersHorizontal,
  Plus,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Globe,
  RefreshCw,
  Check,
  Copy,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  XCircle,
  Clock,
  Layers,
  Network,
  Pencil,
  Trash2,
  Lock,
  Database,
  Send,
  Activity,
  FileCode,
  Bell,
} from 'lucide-react';
import { useDomains } from '../../context/DomainContext';
import { DomainRecord, DomainStatus } from '../../types/domain';
import { TEAM_OWNERS } from '../../data/teamData';
import { getOfficialRenewalUrl } from '../../utils/renewalUrls';
import { NavItem } from './LeftSidebar';
import { ActionsTab } from '../tabs/ActionsTab';
import { TelegramTab } from '../tabs/TelegramTab';
import { ActivityLogsTab } from '../tabs/ActivityLogsTab';
import { DNSTab } from '../tabs/DNSTab';
import { ReputationTab } from '../tabs/ReputationTab';
import { BackgroundJobsTab } from '../tabs/BackgroundJobsTab';
import { SupabaseTab } from '../tabs/SupabaseTab';
import { ExpiryCalendarTab } from '../tabs/ExpiryCalendarTab';
import { RDAPFinderTab } from '../tabs/RDAPFinderTab';
import { DNSCheckerTab } from '../tabs/DNSCheckerTab';
import { LiveInspectionModal } from './LiveInspectionModal';

interface CenterContentProps {
  activeNav: NavItem;
  setActiveNav: (nav: NavItem) => void;
  onOpenAddModal: () => void;
  onOpenEditDomain: (domain: DomainRecord) => void;
  onOpenDomainDetails: (domain: DomainRecord) => void;
  onOpenDNSInspector: (domainName: string) => void;
  selectedOwnerFilter: string | null;
  onClearOwnerFilter: () => void;
}

type SortField = 'days_till_expiry' | 'domain_name' | 'company' | 'status' | 'registrar' | 'security_score' | 'portfolio';
type SortOrder = 'asc' | 'desc';
type QuickFilter = 'all' | 'near-expiry' | 'down' | 'security-gaps';

export const CenterContent: React.FC<CenterContentProps> = ({
  activeNav,
  setActiveNav,
  onOpenAddModal,
  onOpenEditDomain,
  onOpenDomainDetails,
  onOpenDNSInspector,
  selectedOwnerFilter,
  onClearOwnerFilter,
}) => {
  const { domains, refreshDomainPing, refreshAllPings, updateDomain, deleteDomain, isScanning } = useDomains();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [sortField, setSortField] = useState<SortField>('days_till_expiry');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [pingingDomainId, setPingingDomainId] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState<string | null>(null);
  const [inspectingDomain, setInspectingDomain] = useState<string | null>(null);
  const [domainToDelete, setDomainToDelete] = useState<DomainRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(message);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Close typeahead dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const cleanSearchQuery = searchTerm.trim().toLowerCase().replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
  const isDomainPattern = cleanSearchQuery.includes('.');
  const domainToInspect = cleanSearchQuery ? (isDomainPattern ? cleanSearchQuery : `${cleanSearchQuery}.com`) : '';

  // Typeahead matching registry domains
  const matchingRegistryDomains = useMemo(() => {
    if (!cleanSearchQuery) return [];
    return domains
      .filter(
        (d) =>
          d.domain_name.toLowerCase().includes(cleanSearchQuery) ||
          d.company.toLowerCase().includes(cleanSearchQuery) ||
          d.registrar.toLowerCase().includes(cleanSearchQuery) ||
          (d.assignee && d.assignee.toLowerCase().includes(cleanSearchQuery)) ||
          (d.client_name && d.client_name.toLowerCase().includes(cleanSearchQuery))
      )
      .slice(0, 5);
  }, [domains, cleanSearchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchTerm.trim();
    if (!trimmed) return;

    setIsSearchFocused(false);
    const clean = trimmed.toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (clean.includes('.')) {
      setInspectingDomain(clean);
    } else {
      const matched = domains.find(
        (d) =>
          d.domain_name.toLowerCase() === clean.toLowerCase() ||
          d.domain_name.toLowerCase().startsWith(clean.toLowerCase() + '.')
      );
      if (matched) {
        setInspectingDomain(matched.domain_name);
      } else {
        setInspectingDomain(`${clean}.com`);
      }
    }
  };

  // Quick filter counts
  const nearExpiryCount = useMemo(() => {
    return domains.filter((d) => d.days_till_expiry <= 60).length;
  }, [domains]);

  const downOrDegradedCount = useMemo(() => {
    return domains.filter((d) => d.status === 'down' || d.status === 'degraded').length;
  }, [domains]);

  const securityGapsCount = useMemo(() => {
    return domains.filter((d) => (d.security_score !== undefined ? d.security_score < 80 : false)).length;
  }, [domains]);

  // Sort handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Re-ping single domain
  const handlePing = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPingingDomainId(id);
    await refreshDomainPing(id);
    setTimeout(() => setPingingDomainId(null), 400);
  };

  // Copy domain name
  const handleCopy = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(name);
    setCopiedDomain(name);
    setTimeout(() => setCopiedDomain(null), 1500);
  };

  // Delete domain with in-app confirmation modal (no window.confirm)
  const handleDelete = (domain: DomainRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    setDomainToDelete(domain);
  };

  const confirmDeleteDomain = () => {
    if (domainToDelete) {
      const targetName = domainToDelete.domain_name;
      deleteDomain(domainToDelete.id);
      setDomainToDelete(null);
      showToast(`Removed ${targetName} from monitored registry`);
    }
  };

  // Filter & Sort domains
  const processedDomains = useMemo(() => {
    return domains
      .filter((d) => {
        // Search term check
        const term = searchTerm.toLowerCase().trim();
        const matchesSearch =
          !term ||
          d.domain_name.toLowerCase().includes(term) ||
          d.company.toLowerCase().includes(term) ||
          d.registrar.toLowerCase().includes(term) ||
          (d.assignee && d.assignee.toLowerCase().includes(term)) ||
          (d.nameservers && d.nameservers.some((ns) => ns.toLowerCase().includes(term)));

        if (!matchesSearch) return false;

        // Department filter from left sidebar
        if (selectedOwnerFilter && !d.company.toLowerCase().includes(selectedOwnerFilter.toLowerCase())) {
          return false;
        }

        // Quick filter pills
        if (quickFilter === 'near-expiry') {
          return d.days_till_expiry <= 60;
        }
        if (quickFilter === 'down') {
          return d.status === 'down' || d.status === 'degraded';
        }
        if (quickFilter === 'security-gaps') {
          return (d.security_score !== undefined && d.security_score < 80) || !d.ssl_valid || (d.security_gaps && d.security_gaps.length > 0);
        }

        return true;
      })
      .sort((a, b) => {
        let comparison = 0;
        if (sortField === 'days_till_expiry') {
          comparison = a.days_till_expiry - b.days_till_expiry;
        } else if (sortField === 'security_score') {
          comparison = (a.security_score || 0) - (b.security_score || 0);
        } else if (sortField === 'domain_name') {
          comparison = a.domain_name.localeCompare(b.domain_name);
        } else if (sortField === 'company') {
          comparison = a.company.localeCompare(b.company);
        } else if (sortField === 'registrar') {
          comparison = a.registrar.localeCompare(b.registrar);
        } else if (sortField === 'status') {
          const statusPriority: Record<DomainStatus, number> = {
            down: 0,
            degraded: 1,
            pending: 2,
            online: 3,
          };
          comparison = statusPriority[a.status] - statusPriority[b.status];
        } else if (sortField === 'portfolio') {
          comparison = getPortfolioCategory(a).localeCompare(getPortfolioCategory(b));
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [domains, searchTerm, selectedOwnerFilter, quickFilter, sortField, sortOrder]);

  // Portfolio mapping helper
  const getPortfolioCategory = (domain: DomainRecord): string => {
    const text = `${domain.domain_name} ${domain.company} ${domain.assignee || ''}`.toLowerCase();
    if (
      text.includes('trademark') ||
      text.includes('brand') ||
      text.includes('venture') ||
      text.includes('builder') ||
      text.includes('holding') ||
      text.includes('hugedomains') ||
      text.includes('zoxfit')
    ) {
      return 'Brand & Trademarks';
    }
    if (
      text.includes('infra') ||
      text.includes('cloud') ||
      text.includes('devops') ||
      text.includes('security') ||
      text.includes('gateway') ||
      text.includes('paycloud') ||
      text.includes('core')
    ) {
      return 'Core Infrastructure';
    }
    if (
      text.includes('market') ||
      text.includes('digital') ||
      text.includes('campaign') ||
      text.includes('shop') ||
      text.includes('coffee') ||
      text.includes('food') ||
      text.includes('blackfriday') ||
      text.includes('launch')
    ) {
      return 'Marketing Campaigns';
    }
    if (
      text.includes('regional') ||
      text.includes('uae') ||
      text.includes('oman') ||
      text.includes('qatar') ||
      text.includes('india') ||
      text.includes('kannur') ||
      text.includes('dxb') ||
      text.includes('fze') ||
      text.includes('global') ||
      text.includes('asia') ||
      text.includes('nordic') ||
      text.includes('retail')
    ) {
      return 'Regional';
    }
    return 'SaaS Apps';
  };

  // Owner email helper
  const getOwnerEmail = (domain: DomainRecord): string => {
    if (domain.client_email) return domain.client_email;
    const cleanDomain = domain.domain_name.toLowerCase();
    const portfolio = getPortfolioCategory(domain);
    if (portfolio === 'Brand & Trademarks') return `admin@${cleanDomain}`;
    if (portfolio === 'Core Infrastructure') return `devops@${cleanDomain}`;
    if (portfolio === 'Marketing Campaigns') return `marketing@${cleanDomain}`;
    if (portfolio === 'Regional') return `legal@${cleanDomain}`;
    return `operations@${cleanDomain}`;
  };

  // Normalize registrar display to a single official registrar (no slash-combined strings)
  const getSingleRegistrar = (registrar?: string): string => {
    const raw = (registrar || 'Authoritative Registry').trim();
    if (raw.includes(' / ')) {
      return raw.split(' / ').pop()?.trim() || raw;
    }
    return raw;
  };

  // Sub-status caption
  const getSubStatusCaption = (domain: DomainRecord): string => {
    if (domain.status === 'down') return 'Connection failure';
    if (domain.http_status === 301 || domain.http_status === 302) return `Redirect ${domain.http_status} Active`;
    if (domain.status === 'degraded') {
      return domain.http_status && domain.http_status >= 400
        ? `HTTP ${domain.http_status} Restriction`
        : 'Latency Warning';
    }
    return 'Resolving DNS';
  };

  // Toggle alerts
  const handleToggleAlert = (domain: DomainRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    const isCurrentlyEnabled = domain.telegram_alert_enabled !== false && domain.email_notifications_enabled !== false;
    const nextState = !isCurrentlyEnabled;
    updateDomain(domain.id, {
      telegram_alert_enabled: nextState,
      email_notifications_enabled: nextState,
    });
    showToast(nextState ? `Active alerts enabled for ${domain.domain_name}` : `Alerts muted for ${domain.domain_name}`);
  };

  // Find owner avatar
  const getOwnerForCompany = (company: string) => {
    const found = TEAM_OWNERS.find((o) => company.toLowerCase().includes(o.department.toLowerCase()));
    return found || TEAM_OWNERS[0];
  };

  return (
    <div className="flex-1 min-w-0 bg-[#F8FAFC] p-3 sm:p-4 lg:p-5 flex flex-col gap-4 overflow-y-auto overflow-x-hidden">
      {/* 1. Top Search & Live Investigation Bar */}
      <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 sm:gap-3 w-full">
        <div ref={searchContainerRef} className="flex-1 relative">
          <div className="flex items-center bg-white border border-slate-200/80 rounded-full shadow-2xs hover:border-slate-300 focus-within:border-zinc-800 focus-within:ring-2 focus-within:ring-zinc-800/10 transition-all p-1.5 pl-3 sm:pl-4 pr-1.5">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search registry or enter domain to inspect (e.g. google.com)..."
              value={searchTerm}
              onFocus={() => setIsSearchFocused(true)}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsSearchFocused(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setIsSearchFocused(false);
                }
              }}
              className="flex-1 min-w-0 px-3 py-1.5 bg-transparent text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setIsSearchFocused(false);
                }}
                className="text-xs text-slate-400 hover:text-slate-600 font-medium px-2 py-1 rounded-md transition-colors mr-1 cursor-pointer"
              >
                Clear
              </button>
            )}
            <button
              type="submit"
              className="bg-zinc-900 text-white hover:bg-zinc-800 text-xs font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
              title="Search registry or inspect live domain"
            >
              <Globe className="w-3.5 h-3.5 text-zinc-300" />
              <span>Search</span>
            </button>
          </div>

          {/* Unified Typeahead Popover */}
          {isSearchFocused && searchTerm.trim().length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white border border-zinc-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
              {/* Section 1: Live Global Inspection (Always Available) */}
              {domainToInspect && (
                <div className="p-2 border-b border-zinc-100 bg-zinc-50/70">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 px-3 py-1 flex items-center justify-between">
                    <span>Live Global Inspection</span>
                    <span className="text-[10px] font-mono text-zinc-500">Authoritative RDAP / DNS</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setInspectingDomain(domainToInspect);
                      setIsSearchFocused(false);
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-zinc-100/90 flex items-center justify-between gap-3 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-zinc-900 text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <Globe className="w-4 h-4 text-zinc-200 group-hover:text-white" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-zinc-900 flex items-center gap-1.5 truncate">
                          <span>Inspect</span>
                          <span className="font-mono text-zinc-900 font-bold bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200">
                            {domainToInspect}
                          </span>
                          <span>with Live RDAP &amp; DNS</span>
                          <ExternalLink className="w-3 h-3 text-zinc-400 group-hover:text-zinc-700 shrink-0" />
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-0.5">
                          Run real-time WHOIS, SSL, and uptime check
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-white text-zinc-600 border border-zinc-200 shadow-2xs shrink-0 hidden sm:inline-block">
                      Press ↵ Enter
                    </span>
                  </button>
                </div>
              )}

              {/* Section 2: In Your Monitored Registry */}
              <div className="p-2 max-h-60 overflow-y-auto">
                <div className="flex items-center justify-between px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  <span>In Your Monitored Registry</span>
                  <span className="font-mono text-zinc-500">{matchingRegistryDomains.length} matching</span>
                </div>

                {matchingRegistryDomains.length > 0 ? (
                  <div className="space-y-1 mt-1">
                    {matchingRegistryDomains.map((d) => {
                      const isDown = d.status === 'down';
                      const isDegraded = d.status === 'degraded' || (d.response_time_ms && d.response_time_ms >= 1000);
                      return (
                        <div
                          key={d.id}
                          onClick={() => {
                            onOpenDomainDetails(d);
                            setIsSearchFocused(false);
                          }}
                          className="w-full px-3 py-2 rounded-lg hover:bg-zinc-50 flex items-center justify-between gap-2 transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                isDown ? 'bg-rose-500' : isDegraded ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                            />
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-zinc-900 truncate group-hover:text-zinc-600">
                                {d.domain_name}
                              </div>
                              <div className="text-[11px] text-zinc-400 truncate">
                                {d.company} &middot; {d.registrar}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700">
                              {d.days_till_expiry}d left
                            </span>
                            <span
                              className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                                isDown
                                  ? 'bg-rose-50 text-rose-700'
                                  : isDegraded
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-emerald-50 text-emerald-700'
                              }`}
                            >
                              {isDown ? 'Down 503' : isDegraded ? 'Degraded' : `Online ${d.http_status || 200}`}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-3 py-3 text-center">
                    <p className="text-xs text-zinc-500">
                      No tracked domains match <strong className="font-semibold text-zinc-700">"{searchTerm}"</strong>.
                    </p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Use the option above to inspect it live across global networks.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            if (quickFilter !== 'all') {
              setQuickFilter('all');
            } else {
              setQuickFilter('near-expiry');
            }
          }}
          className={`p-3 bg-white border border-slate-200/80 rounded-full text-slate-600 hover:text-zinc-900 shadow-2xs hover:bg-slate-50 transition-colors shrink-0 cursor-pointer ${
            quickFilter !== 'all' ? 'ring-2 ring-zinc-800 text-zinc-900' : ''
          }`}
          title="Toggle Quick Filter"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </form>

      {/* Owner Filter Pill if selected from left sidebar */}
      {selectedOwnerFilter && (
        <div className="flex items-center justify-between bg-zinc-900 text-white text-xs px-4 py-2.5 rounded-xl shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>
              Filtering domains for department: <strong className="font-semibold">{selectedOwnerFilter}</strong>
            </span>
          </div>
          <button
            onClick={onClearOwnerFilter}
            className="text-[11px] underline hover:text-slate-200 font-medium"
          >
            Clear Filter
          </button>
        </div>
      )}

      {/* Sub-navigation views */}
      {activeNav === 'calendar' && (
        <ExpiryCalendarTab
          onClose={() => setActiveNav('all-domains')}
          onOpenDomainDetails={onOpenDomainDetails}
          onOpenEditDomain={onOpenEditDomain}
        />
      )}

      {activeNav === 'rdap' && (
        <RDAPFinderTab
          onNavigateToRegistry={() => setActiveNav('all-domains')}
        />
      )}

      {(activeNav === 'dns-checker' || activeNav === 'dns') && (
        <DNSCheckerTab />
      )}

      {(activeNav === 'database' || activeNav === 'supabase') && (
        <div className="flex-1">
          <SupabaseTab />
        </div>
      )}

      {activeNav === 'inbox' && (
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs flex-1">
          <h2 className="text-base font-bold text-zinc-900 mb-4">Enterprise Alerts &amp; Incident Audit</h2>
          <ActivityLogsTab />
        </div>
      )}

      {/* Legacy Fallback routes if triggered */}
      {activeNav === 'monitoring' && (
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs flex-1">
          <h2 className="text-base font-bold text-zinc-900 mb-4">Cluster Endpoint Probing &amp; Latency</h2>
          <ActionsTab />
        </div>
      )}

      {activeNav === 'reputation' && (
        <div className="flex-1">
          <ReputationTab />
        </div>
      )}

      {activeNav === 'cron' && (
        <div className="flex-1">
          <BackgroundJobsTab />
        </div>
      )}

      {activeNav === 'telegram' && (
        <div className="flex-1">
          <TelegramTab />
        </div>
      )}

      {/* EXPANDED MAIN TABLE SECTION: All Domains / Assets & Registry */}
      {(activeNav === 'all-domains' || activeNav === 'dashboard') && (
        <div className="flex-1 flex flex-col bg-white border border-zinc-200/90 rounded-xl shadow-xs overflow-hidden">
          {/* Integrated Header Toolbar */}
          <div className="p-3.5 sm:p-5 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            {/* Section Title & Counter */}
            <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
              <h2 className="text-sm sm:text-base font-bold text-zinc-900 tracking-tight">
                All Domains Registry
              </h2>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 border border-zinc-200">
                [ {processedDomains.length} / {domains.length} ]
              </span>
            </div>

            {/* Action Buttons: Refresh Telemetry and + Add Domain */}
            <div className="flex items-center justify-end gap-2.5 w-full sm:w-auto">
              {/* Refresh Telemetry Button */}
              <button
                onClick={() => refreshAllPings()}
                disabled={isScanning}
                className="p-2 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-lg text-zinc-600 hover:text-zinc-900 transition-colors shadow-xs cursor-pointer"
                title="Refresh Telemetry"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-zinc-900' : ''}`} />
              </button>

              {/* + Add Domain Action Button */}
              <button
                onClick={onOpenAddModal}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Domain</span>
              </button>
            </div>
          </div>

          {/* Desktop & Tablet Table Container (hidden on mobile < md) */}
          <div className="hidden md:block flex-1 w-full overflow-hidden">
            <div className="w-full">
              <table className="w-full text-left border-collapse table-fixed">
                <colgroup>
                  <col className="w-[23%]" />
                  <col className="w-[16%]" />
                  <col className="w-[18%]" />
                  <col className="w-[20%]" />
                  <col className="w-[23%]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50/70 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 sticky top-0 z-10 backdrop-blur-xs">
                    {/* Column 1: DOMAIN (23%) */}
                    <th
                      onClick={() => handleSort('domain_name')}
                      className="py-3 pl-4 pr-2 text-left cursor-pointer hover:text-zinc-900 transition-colors select-none w-[23%]"
                    >
                      <div className="flex items-center gap-1">
                        <span>DOMAIN</span>
                        {sortField === 'domain_name' ? (
                          sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-zinc-900 shrink-0" /> : <ArrowDown className="w-3.5 h-3.5 text-zinc-900 shrink-0" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-zinc-400 shrink-0" />
                        )}
                      </div>
                    </th>

                    {/* Column 2: HTTP & LATENCY (16%) */}
                    <th
                      onClick={() => handleSort('status')}
                      className="py-3 px-2 sm:px-3 text-left cursor-pointer hover:text-zinc-900 transition-colors select-none w-[16%]"
                    >
                      <div className="flex items-center gap-1">
                        <span>HTTP &amp; LATENCY</span>
                        {sortField === 'status' ? (
                          sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-zinc-900 shrink-0" /> : <ArrowDown className="w-3.5 h-3.5 text-zinc-900 shrink-0" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-zinc-400 shrink-0" />
                        )}
                      </div>
                    </th>

                    {/* Column 3: REGISTRAR (18%) */}
                    <th
                      onClick={() => handleSort('registrar')}
                      className="py-3 px-2 sm:px-3 text-left cursor-pointer hover:text-zinc-900 transition-colors select-none w-[18%]"
                    >
                      <div className="flex items-center gap-1">
                        <span>REGISTRAR</span>
                        {sortField === 'registrar' ? (
                          sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-zinc-900 shrink-0" /> : <ArrowDown className="w-3.5 h-3.5 text-zinc-900 shrink-0" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-zinc-400 shrink-0" />
                        )}
                      </div>
                    </th>

                    {/* Column 4: EXPIRY (PRIORITY) (20%) */}
                    <th
                      onClick={() => handleSort('days_till_expiry')}
                      className="py-3 px-2 sm:px-3 text-left cursor-pointer hover:text-zinc-900 transition-colors select-none w-[20%]"
                    >
                      <div className="flex items-center gap-1">
                        <span>EXPIRY (PRIORITY)</span>
                        {sortField === 'days_till_expiry' ? (
                          sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-zinc-900 shrink-0" /> : <ArrowDown className="w-3.5 h-3.5 text-zinc-900 shrink-0" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-zinc-400 shrink-0" />
                        )}
                      </div>
                    </th>

                    {/* Column 5: ACTION (23%) */}
                    <th className="py-3 pr-3 sm:pr-4 pl-1 text-right select-none w-[23%]">
                      <span>ACTION</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {processedDomains.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-14 text-center align-middle">
                        <div className="max-w-md mx-auto flex flex-col items-center gap-2 px-4">
                          <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-700 shadow-2xs">
                            <Globe className="w-6 h-6 text-zinc-700" />
                          </div>
                          {searchTerm.trim() ? (
                            <>
                              <h3 className="text-sm font-semibold text-zinc-900 mt-1">
                                "{searchTerm.trim()}" is not in your monitored registry
                              </h3>
                              <p className="text-xs text-zinc-500 max-w-sm">
                                You can query live ICANN RDAP, SSL certificates, and DNS records on demand, or enroll it into 24/7 monitoring.
                              </p>
                              <div className="flex flex-wrap items-center justify-center gap-2.5 mt-3">
                                <button
                                  type="button"
                                  onClick={() => setInspectingDomain(domainToInspect)}
                                  className="h-8 px-4 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Globe className="w-3.5 h-3.5 text-zinc-300" />
                                  <span>Inspect "{domainToInspect}" Live ↗</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={onOpenAddModal}
                                  className="h-8 px-3.5 text-xs font-medium bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-300 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Add to Registry</span>
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setSearchTerm('');
                                  onClearOwnerFilter();
                                }}
                                className="mt-2 text-xs text-zinc-400 hover:text-zinc-700 underline font-medium cursor-pointer"
                              >
                                Clear search &amp; show all monitored assets
                              </button>
                            </>
                          ) : (
                            <>
                              <h3 className="text-sm font-semibold text-zinc-900 mt-1">No matching domains found</h3>
                              <p className="text-xs text-zinc-500">
                                {selectedOwnerFilter
                                  ? `No domains currently assigned to "${selectedOwnerFilter}".`
                                  : 'No domains match the selected quick filter.'}
                              </p>
                              <button
                                type="button"
                                onClick={() => {
                                  setSearchTerm('');
                                  onClearOwnerFilter();
                                  setQuickFilter('all');
                                }}
                                className="mt-2 text-xs font-semibold text-zinc-900 underline hover:text-zinc-700 cursor-pointer"
                              >
                                Reset filters
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    processedDomains.map((domain) => {
                      const isExpired = domain.days_till_expiry < 0;
                      const isCritical = domain.days_till_expiry >= 0 && domain.days_till_expiry <= 7;
                      const isActSoon = domain.days_till_expiry >= 0 && domain.days_till_expiry <= 30;

                      const officialRegistrar = getSingleRegistrar(domain.registrar);
                      const subStatusCaption = getSubStatusCaption(domain);
                      const isAlertActive = domain.telegram_alert_enabled !== false && domain.email_notifications_enabled !== false;

                      const isStatusDown = domain.status === 'down';
                      const isLatencyWarning = domain.response_time_ms >= 1000;
                      const isWarning = domain.status === 'degraded' || isLatencyWarning || (domain.http_status && domain.http_status >= 400);

                      const expiryDateFormatted = domain.expires_at ? domain.expires_at.split('T')[0] : '—';

                      return (
                        <tr
                          key={domain.id}
                          onClick={() => onOpenDomainDetails(domain)}
                          className="hover:bg-zinc-50/50 transition-colors group cursor-pointer border-b border-zinc-100"
                        >
                          {/* Column 1: DOMAIN (23%) */}
                          <td className="py-3 pl-4 pr-2 align-middle w-[23%] overflow-hidden text-left">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-semibold text-zinc-900 group-hover:text-zinc-700 tracking-tight truncate block">
                                  {domain.domain_name}
                                </span>
                                <a
                                  href={`https://${domain.domain_name}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-zinc-400 hover:text-zinc-700 p-0.5 transition-colors rounded shrink-0 cursor-pointer"
                                  title={`Open https://${domain.domain_name}`}
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              </div>
                              <div className="text-xs text-zinc-500 truncate block mt-0.5 font-normal">
                                {domain.company}
                              </div>
                            </div>
                          </td>

                          {/* Column 2: HTTP & LATENCY (16%) */}
                          <td className="py-3 px-2 sm:px-3 align-middle w-[16%] overflow-hidden text-left">
                            <div className="min-w-0">
                              {isStatusDown ? (
                                <span className="text-rose-700 font-semibold text-xs tracking-tight block">Down / Unreachable</span>
                              ) : isWarning ? (
                                <div className="flex items-center gap-1.5 font-mono text-xs">
                                  <span className="text-amber-700 font-bold">HTTP {domain.http_status || 200}</span>
                                  <span className="text-zinc-500">• {domain.response_time_ms}ms</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 font-mono text-xs">
                                  <span className="text-emerald-700 font-bold">HTTP {domain.http_status || 200}</span>
                                  <span className="text-zinc-500">• {domain.response_time_ms}ms</span>
                                </div>
                              )}
                              <div className="text-xs text-zinc-400 font-normal truncate block mt-0.5">
                                {subStatusCaption}
                              </div>
                            </div>
                          </td>

                          {/* Column 3: REGISTRAR (18%) */}
                          <td className="py-3 px-2 sm:px-3 align-middle w-[18%] overflow-hidden text-left">
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-zinc-800 truncate block" title={officialRegistrar}>
                                {officialRegistrar}
                              </div>
                            </div>
                          </td>

                          {/* Column 4: EXPIRY (PRIORITY) (20%) */}
                          <td className="py-3 px-2 sm:px-3 align-middle w-[20%] overflow-hidden text-left">
                            <div className="flex flex-col items-start gap-1 min-w-0">
                              <span className="text-xs font-mono font-semibold text-zinc-900 whitespace-nowrap">
                                {expiryDateFormatted}
                              </span>
                              <div className="whitespace-nowrap max-w-full">
                                {isExpired ? (
                                  <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium whitespace-nowrap bg-rose-50 text-rose-700 border border-rose-200 truncate max-w-full">
                                    EXPIRED ({Math.abs(domain.days_till_expiry)}d ago)
                                  </span>
                                ) : isActSoon ? (
                                  <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium whitespace-nowrap bg-amber-50 text-amber-800 border border-amber-200 truncate max-w-full">
                                    {domain.days_till_expiry}d remaining (Act soon)
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium whitespace-nowrap bg-emerald-50 text-emerald-700 border border-emerald-200 truncate max-w-full">
                                    {domain.days_till_expiry}d remaining (Healthy)
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Column 5: ACTION (23%) */}
                          <td className="py-3 pr-3 sm:pr-4 pl-1 align-middle text-right w-[23%] overflow-hidden">
                            <div className="flex items-center justify-end gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                              {/* Dynamic Primary Button */}
                              {isExpired || isCritical ? (
                                <a
                                  href={getOfficialRenewalUrl(domain)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center justify-center gap-1 h-7 px-2.5 rounded-md text-xs font-semibold text-white whitespace-nowrap shrink-0 shadow-xs bg-rose-600 hover:bg-rose-700 transition-colors cursor-pointer"
                                  title={`Renew ${domain.domain_name} immediately at official GoDaddy portal`}
                                >
                                  <span>Renew Now</span>
                                  <ExternalLink className="w-3 h-3 text-rose-100" />
                                </a>
                              ) : isActSoon ? (
                                <a
                                  href={getOfficialRenewalUrl(domain)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center justify-center gap-1 h-7 px-2.5 rounded-md text-xs font-semibold text-white whitespace-nowrap shrink-0 shadow-xs bg-amber-500 hover:bg-amber-600 transition-colors cursor-pointer"
                                  title={`Renew ${domain.domain_name} at official GoDaddy portal`}
                                >
                                  <span>Renew Soon</span>
                                  <ExternalLink className="w-3 h-3 text-amber-100" />
                                </a>
                              ) : (
                                <a
                                  href={getOfficialRenewalUrl(domain)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center justify-center gap-1 h-7 px-2.5 rounded-md text-xs font-semibold text-white whitespace-nowrap shrink-0 shadow-xs bg-zinc-900 hover:bg-zinc-800 transition-colors cursor-pointer"
                                  title={`Manage ${domain.domain_name} at official registrar`}
                                >
                                  <span>Manage</span>
                                  <ExternalLink className="w-3 h-3 text-zinc-300" />
                                </a>
                              )}

                              {/* Notification / Alert Bell Icon */}
                              <button
                                type="button"
                                onClick={(e) => handleToggleAlert(domain, e)}
                                title={isAlertActive ? "Mute automated Telegram & Email alerts" : "Enable automated Telegram & Email alerts"}
                                className={`h-7 w-7 inline-flex items-center justify-center rounded-md border shrink-0 transition-colors cursor-pointer ${
                                  isAlertActive
                                    ? 'border-amber-300 bg-amber-50 text-amber-600 hover:bg-amber-100 shadow-2xs'
                                    : 'border-zinc-200 bg-white text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50'
                                }`}
                              >
                                <Bell className={`w-3.5 h-3.5 ${isAlertActive ? 'fill-amber-500 text-amber-600' : ''}`} />
                              </button>

                              {/* Delete / Archive Icon */}
                              <button
                                type="button"
                                onClick={(e) => handleDelete(domain, e)}
                                title={`Delete ${domain.domain_name} from monitoring`}
                                className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 shrink-0 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card-View Alternative (< md) */}
          <div className="md:hidden flex flex-col p-3 gap-3 overflow-y-auto">
            {processedDomains.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-700 mx-auto mb-3 shadow-2xs">
                  <Globe className="w-6 h-6 text-zinc-700" />
                </div>
                {searchTerm.trim() ? (
                  <>
                    <h3 className="text-sm font-semibold text-zinc-900">
                      "{searchTerm.trim()}" not monitored yet
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
                      Inspect this domain's authoritative WHOIS, SSL, and DNS records live.
                    </p>
                    <div className="flex flex-col gap-2 mt-4 max-w-xs mx-auto">
                      <button
                        type="button"
                        onClick={() => setInspectingDomain(domainToInspect)}
                        className="w-full py-2.5 px-4 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Globe className="w-3.5 h-3.5 text-zinc-300" />
                        <span>Inspect "{domainToInspect}" Live ↗</span>
                      </button>
                      <button
                        type="button"
                        onClick={onOpenAddModal}
                        className="w-full py-2 px-3.5 text-xs font-medium bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-300 rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add to Monitored Registry</span>
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerm('');
                        onClearOwnerFilter();
                      }}
                      className="mt-3 text-xs text-zinc-400 hover:text-zinc-700 underline font-medium cursor-pointer"
                    >
                      Clear search
                    </button>
                  </>
                ) : (
                  <>
                    <h3 className="text-sm font-semibold text-zinc-900">No matching domains found</h3>
                    <p className="text-xs text-zinc-500 mt-1">Try clearing your search query or reset your filters.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerm('');
                        onClearOwnerFilter();
                        setQuickFilter('all');
                      }}
                      className="mt-2 text-xs font-semibold text-zinc-900 underline hover:text-zinc-700 cursor-pointer"
                    >
                      Reset filters
                    </button>
                  </>
                )}
              </div>
            ) : (
              processedDomains.map((domain) => {
                const isExpired = domain.days_till_expiry < 0;
                const isCritical = domain.days_till_expiry >= 0 && domain.days_till_expiry <= 7;
                const isActSoon = domain.days_till_expiry > 7 && domain.days_till_expiry <= 30;

                const officialRegistrar = getSingleRegistrar(domain.registrar);
                const subStatusCaption = getSubStatusCaption(domain);
                const isAlertActive = domain.telegram_alert_enabled !== false && domain.email_notifications_enabled !== false;

                const isStatusDown = domain.status === 'down';
                const isStatus301 = domain.http_status === 301 || domain.http_status === 302;
                const isStatusDegraded = domain.status === 'degraded' || domain.response_time_ms >= 1000 || (domain.http_status >= 400 && domain.http_status < 500);

                const expiryDateFormatted = domain.expires_at ? domain.expires_at.split('T')[0] : '—';

                return (
                  <div
                    key={domain.id}
                    onClick={() => onOpenDomainDetails(domain)}
                    className="bg-white border border-zinc-200/90 rounded-xl p-3.5 shadow-2xs space-y-3 cursor-pointer hover:border-zinc-300 transition-all active:scale-[0.99]"
                  >
                    {/* Header: Domain, External Link, Copy, and Subtitle Company */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-zinc-900 truncate">
                            {domain.domain_name}
                          </span>
                          <a
                            href={`https://${domain.domain_name}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-zinc-400 hover:text-zinc-700 p-0.5 rounded shrink-0 cursor-pointer"
                            title={`Open https://${domain.domain_name}`}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            type="button"
                            onClick={(e) => handleCopy(domain.domain_name, e)}
                            className="text-zinc-400 hover:text-zinc-700 p-0.5 rounded shrink-0 cursor-pointer"
                            title="Copy domain name"
                          >
                            {copiedDomain === domain.domain_name ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <span className="text-xs text-zinc-500 font-normal truncate block mt-0.5">
                          {domain.company}
                        </span>
                      </div>

                      {/* Expiry Pill */}
                      <div className="shrink-0">
                        {isExpired ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            EXPIRED
                          </span>
                        ) : isCritical ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            {domain.days_till_expiry}d (Critical)
                          </span>
                        ) : isActSoon ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            {domain.days_till_expiry}d (Act soon)
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {domain.days_till_expiry}d (Healthy)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-zinc-100 text-xs">
                      {/* HTTP & Latency */}
                      <div className="min-w-0">
                        <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">HTTP &amp; Latency</span>
                        <div className="flex items-center gap-1.5 mt-1 font-mono text-xs">
                          {isStatusDown ? (
                            <span className="text-rose-600 font-semibold font-sans">Down / Unreachable</span>
                          ) : isStatus301 ? (
                            <>
                              <span className="bg-blue-50 text-blue-700 border border-blue-200 px-1 py-0.2 rounded text-[10px] font-semibold">
                                301
                              </span>
                              <span className="text-zinc-400">• {domain.response_time_ms}ms</span>
                            </>
                          ) : isStatusDegraded ? (
                            <>
                              <span className="text-amber-700 font-semibold">{domain.http_status || 403}</span>
                              <span className="text-zinc-400">• {domain.response_time_ms}ms</span>
                            </>
                          ) : (
                            <>
                              <span className="text-emerald-600 font-semibold">200</span>
                              <span className="text-zinc-400">• {domain.response_time_ms}ms</span>
                            </>
                          )}
                        </div>
                        <span className="text-[11px] text-zinc-400 block truncate mt-0.5">
                          {subStatusCaption}
                        </span>
                      </div>

                      {/* Registrar */}
                      <div className="min-w-0">
                        <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">Registrar</span>
                        <span className="text-zinc-800 font-medium truncate block mt-1">{officialRegistrar}</span>
                      </div>

                      {/* Expiration Date */}
                      <div className="min-w-0 col-span-2 pt-1 border-t border-zinc-50 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">Renewal Deadline</span>
                          <span className="font-bold font-mono text-zinc-900 block mt-0.5">{expiryDateFormatted}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] text-zinc-500 font-medium block">
                            {isExpired ? 'Needs re-registration' : `${domain.days_till_expiry} days remaining`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions Toolbar */}
                    <div className="pt-2 border-t border-zinc-100 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                      {/* Dynamic Action Button */}
                      {isExpired || isCritical ? (
                        <a
                          href={getOfficialRenewalUrl(domain)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 py-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-2xs inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <span>Renew Now</span>
                          <ExternalLink className="w-3.5 h-3.5 text-rose-100" />
                        </a>
                      ) : isActSoon ? (
                        <a
                          href={getOfficialRenewalUrl(domain)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 py-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold shadow-2xs inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <span>Renew Soon</span>
                          <ExternalLink className="w-3.5 h-3.5 text-amber-100" />
                        </a>
                      ) : (
                        <a
                          href={getOfficialRenewalUrl(domain)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 py-1.5 px-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold shadow-2xs inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <span>Manage</span>
                          <ExternalLink className="w-3.5 h-3.5 text-zinc-300" />
                        </a>
                      )}

                      {/* Alert Bell Toggle */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleAlert(domain, e)}
                        title={isAlertActive ? "Mute automated alerts" : "Enable automated alerts"}
                        className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
                          isAlertActive
                            ? 'border-amber-300 bg-amber-50 text-amber-600'
                            : 'border-zinc-200 bg-white text-zinc-400 hover:text-zinc-700'
                        }`}
                      >
                        <Bell className={`w-3.5 h-3.5 ${isAlertActive ? 'fill-amber-500 text-amber-600' : ''}`} />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={(e) => handleDelete(domain, e)}
                        title={`Remove ${domain.domain_name}`}
                        className="w-8 h-8 rounded-lg border border-zinc-200 bg-white text-zinc-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Table Bottom Footer Summary */}
          <div className="px-4 py-3 border-t border-zinc-100 bg-zinc-50/50 flex flex-wrap items-center justify-between text-xs text-zinc-500 font-sans gap-3">
            <div>
              <span>Default sweep cycle: <strong className="font-semibold text-zinc-700">08:00 UTC Daily</strong> &middot; Automated ICANN RDAP sync enabled</span>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span className="text-zinc-700">&lt;14d Critical</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span className="text-zinc-700">14–60d Warning</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-zinc-700">&gt;60d Safe</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Delete Domain In-App Confirmation Modal (no window.confirm) */}
      {domainToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-zinc-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-5 sm:p-6">
              <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mb-4">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-zinc-900">
                Remove Domain from Monitoring?
              </h3>
              <p className="text-xs text-zinc-600 mt-2 leading-relaxed">
                Are you sure you want to remove <strong className="font-semibold text-zinc-900 font-mono">{domainToDelete.domain_name}</strong> from your enterprise monitoring registry?
              </p>
              <div className="mt-3 p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-[11px] text-zinc-600 space-y-1">
                <div><span className="font-semibold text-zinc-700">Company:</span> {domainToDelete.company}</div>
                <div><span className="font-semibold text-zinc-700">Registrar:</span> {domainToDelete.registrar}</div>
                <div><span className="font-semibold text-zinc-700">Days to expiry:</span> {domainToDelete.days_till_expiry} days</div>
              </div>
              <p className="text-[11px] text-zinc-500 mt-2">
                This will cease automated HTTP uptime probes, SSL validation, and renewal reminder alerts for this domain.
              </p>
            </div>
            <div className="px-5 py-3.5 bg-zinc-50 border-t border-zinc-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDomainToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-zinc-700 hover:text-zinc-900 hover:bg-zinc-200/60 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteDomain}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Domain</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Feedback Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-zinc-900 text-white px-4 py-2.5 rounded-xl text-xs font-medium shadow-xl border border-zinc-800 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Live Domain Inspection & Network Investigation Modal */}
      <LiveInspectionModal
        isOpen={Boolean(inspectingDomain)}
        domainName={inspectingDomain}
        onClose={() => setInspectingDomain(null)}
      />
    </div>
  );
};
