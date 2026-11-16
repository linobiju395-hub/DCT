import React, { useState, useMemo } from 'react';
import {
  ExternalLink,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Globe,
  Trash2,
  Edit2,
  Copy,
  Check,
  Building2,
  ShieldCheck,
  ShieldAlert,
  Send,
  Plus,
  Mail,
  MoreHorizontal,
} from 'lucide-react';
import { useDomains } from '../context/DomainContext';
import { DomainRecord } from '../types/domain';
import { SendTestEmailModal } from './modals/SendTestEmailModal';
import { getOfficialRenewalUrl } from '../utils/renewalUrls';

interface DomainTableProps {
  onOpenAddModal: () => void;
  onOpenEditModal: (domain: DomainRecord) => void;
  onNavigateToActions?: () => void;
}

type SortField = 'days_till_expiry' | 'domain_name' | 'company' | 'status' | 'response_time_ms';
type SortOrder = 'asc' | 'desc';

export const DomainTable: React.FC<DomainTableProps> = ({
  onOpenAddModal,
  onOpenEditModal,
  onNavigateToActions,
}) => {
  const {
    domains,
    refreshDomainPing,
    refreshAllPings,
    deleteDomain,
    runDailyExpiryCron,
    isScanning,
  } = useDomains();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'critical' | 'warning' | 'down'>('all');
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('days_till_expiry'); // Default auto-sort by "Near Expiry" (lowest days first)
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [pingingDomainId, setPingingDomainId] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState<string | null>(null);
  const [cronRunning, setCronRunning] = useState(false);
  const [cronFeedback, setCronFeedback] = useState<string | null>(null);
  const [testEmailTarget, setTestEmailTarget] = useState<DomainRecord | null>(null);
  const [isSendTestModalOpen, setIsSendTestModalOpen] = useState(false);
  const [openMenuRowId, setOpenMenuRowId] = useState<string | null>(null);

  // Extract unique companies for filtering
  const companies = useMemo(() => {
    const set = new Set(domains.map((d) => d.company));
    return Array.from(set).sort();
  }, [domains]);

  // Handle manual ping on single domain
  const handlePing = async (id: string) => {
    setPingingDomainId(id);
    await refreshDomainPing(id);
    setTimeout(() => setPingingDomainId(null), 400);
  };

  // Copy domain to clipboard
  const handleCopy = (domain: string) => {
    navigator.clipboard.writeText(domain);
    setCopiedDomain(domain);
    setTimeout(() => setCopiedDomain(null), 1500);
  };

  // Run daily cron trigger
  const handleRunCron = async () => {
    setCronRunning(true);
    setCronFeedback(null);
    const res = await runDailyExpiryCron();
    setCronFeedback(res.summary);
    setCronRunning(false);
    setTimeout(() => setCronFeedback(null), 5000);
  };

  // Sort handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filter & Sort domains
  const processedDomains = useMemo(() => {
    return domains
      .filter((d) => {
        // Search filter
        const matchesSearch =
          d.domain_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.registrar.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        // Company filter
        if (selectedCompany !== 'all' && d.company !== selectedCompany) {
          return false;
        }

        // Status / Expiry filter
        if (filterType === 'critical') return d.days_till_expiry <= 30;
        if (filterType === 'warning') return d.days_till_expiry > 30 && d.days_till_expiry <= 60;
        if (filterType === 'down') return d.status === 'down' || d.status === 'degraded';

        return true;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortField === 'days_till_expiry') {
          cmp = a.days_till_expiry - b.days_till_expiry;
        } else if (sortField === 'domain_name') {
          cmp = a.domain_name.localeCompare(b.domain_name);
        } else if (sortField === 'company') {
          cmp = a.company.localeCompare(b.company);
        } else if (sortField === 'status') {
          cmp = a.status.localeCompare(b.status);
        } else if (sortField === 'response_time_ms') {
          cmp = a.response_time_ms - b.response_time_ms;
        }
        return sortOrder === 'asc' ? cmp : -cmp;
      });
  }, [domains, searchTerm, filterType, selectedCompany, sortField, sortOrder]);

  // Metrics summary
  const summary = useMemo(() => {
    const total = domains.length;
    const criticalExpiry = domains.filter((d) => d.days_till_expiry <= 30).length;
    const warningExpiry = domains.filter((d) => d.days_till_expiry > 30 && d.days_till_expiry <= 60).length;
    const downCount = domains.filter((d) => d.status === 'down').length;
    const degradedCount = domains.filter((d) => d.status === 'degraded').length;
    const healthyCount = domains.filter((d) => d.status === 'online').length;

    return { total, criticalExpiry, warningExpiry, downCount, degradedCount, healthyCount };
  }, [domains]);

  return (
    <div className="space-y-4">
      {/* Top Metric Strip - High-Density Clean Craft */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-[#10121a] border border-zinc-200/90 dark:border-zinc-800/80 rounded-xl p-3.5 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-xs text-zinc-500 font-medium">Monitored Domains</div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-mono tabular-nums mt-0.5">
              {summary.total}
            </div>
          </div>
          <Globe className="w-5 h-5 text-indigo-500 opacity-80" />
        </div>

        <div className="bg-white dark:bg-[#10121a] border border-zinc-200/90 dark:border-zinc-800/80 rounded-xl p-3.5 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-xs text-zinc-500 font-medium">Critical (&lt; 30d)</div>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 font-mono tabular-nums mt-0.5">
              {summary.criticalExpiry}
            </div>
          </div>
          <AlertTriangle className="w-5 h-5 text-rose-500 opacity-80" />
        </div>

        <div className="bg-white dark:bg-[#10121a] border border-zinc-200/90 dark:border-zinc-800/80 rounded-xl p-3.5 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-xs text-zinc-500 font-medium">Expiring Soon (30–60d)</div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono tabular-nums mt-0.5">
              {summary.warningExpiry}
            </div>
          </div>
          <Clock className="w-5 h-5 text-amber-500 opacity-80" />
        </div>

        <div className="bg-white dark:bg-[#10121a] border border-zinc-200/90 dark:border-zinc-800/80 rounded-xl p-3.5 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-xs text-zinc-500 font-medium">Down / Degraded</div>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 font-mono tabular-nums mt-0.5">
              {summary.downCount + summary.degradedCount}
            </div>
          </div>
          <XCircle className="w-5 h-5 text-rose-500 opacity-80" />
        </div>
      </div>

      {/* Control Filter Toolbar */}
      <div className="bg-white dark:bg-[#10121a] border border-zinc-200/90 dark:border-zinc-800/80 rounded-xl p-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-xs">
        {/* Left: Search & Segmented Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Live Search */}
          <div className="relative min-w-[220px] max-w-sm">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search domain, team, registrar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Segmented Pills */}
          <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-950 rounded-lg border border-zinc-200/80 dark:border-zinc-800/80 text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
                filterType === 'all'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              All ({domains.length})
            </button>
            <button
              onClick={() => setFilterType('critical')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                filterType === 'critical'
                  ? 'bg-white dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/70 shadow-xs'
                  : 'text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400'
              }`}
            >
              <span>Near Expiry (&lt;30d)</span>
              {summary.criticalExpiry > 0 && (
                <span className="font-mono text-[10px] bg-rose-500/20 text-rose-600 dark:text-rose-400 px-1 rounded">
                  {summary.criticalExpiry}
                </span>
              )}
            </button>
            <button
              onClick={() => setFilterType('warning')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
                filterType === 'warning'
                  ? 'bg-white dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/70 shadow-xs'
                  : 'text-zinc-500 hover:text-amber-600 dark:hover:text-amber-400'
              }`}
            >
              30–60d ({summary.warningExpiry})
            </button>
            <button
              onClick={() => setFilterType('down')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                filterType === 'down'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <span>Down / Degraded</span>
              {summary.downCount > 0 && (
                <span className="font-mono text-[10px] bg-rose-600 text-white px-1 rounded">
                  {summary.downCount}
                </span>
              )}
            </button>
          </div>

          {/* Department Dropdown Filter */}
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Building2 className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Departments / Teams</option>
              {companies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleRunCron}
            disabled={cronRunning || isScanning}
            className="px-3 py-1.5 text-xs font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-lg border border-zinc-200 dark:border-zinc-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            title="Execute 30-day expiry calculation & reminder cron"
          >
            <Send className={`w-3.5 h-3.5 ${cronRunning ? 'animate-spin' : ''}`} />
            <span>Run Cron</span>
          </button>

          <button
            onClick={refreshAllPings}
            disabled={isScanning}
            className="px-3 py-1.5 text-xs font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-lg border border-zinc-200 dark:border-zinc-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            title="Ping all endpoints to benchmark latency and status"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>Ping All</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="px-3.5 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-xs transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Domain</span>
          </button>
        </div>
      </div>

      {/* Cron Feedback Banner */}
      {cronFeedback && (
        <div className="bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 text-indigo-900 dark:text-indigo-300 text-xs px-3.5 py-2 rounded-lg flex items-center justify-between animate-in fade-in">
          <span>{cronFeedback}</span>
        </div>
      )}

      {/* MAIN DATA TABLE: Responsive 6-Column Specification */}
      <div className="bg-white dark:bg-[#10121a] border border-zinc-200/90 dark:border-zinc-800/80 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            {/* Table Header */}
            <thead>
              <tr className="border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-950/60 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                {/* 1. Domain */}
                <th
                  onClick={() => handleSort('domain_name')}
                  className="py-3 px-4 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>1. Domain</span>
                    {sortField === 'domain_name' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-500" /> : <ArrowDown className="w-3 h-3 text-indigo-500" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-40" />
                    )}
                  </div>
                </th>

                {/* 2. Company / Team */}
                <th
                  onClick={() => handleSort('company')}
                  className="py-3 px-4 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>2. Company / Team</span>
                    {sortField === 'company' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-500" /> : <ArrowDown className="w-3 h-3 text-indigo-500" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-40" />
                    )}
                  </div>
                </th>

                {/* 3. Working (Status) */}
                <th
                  onClick={() => handleSort('status')}
                  className="py-3 px-4 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>3. Working (Status)</span>
                    {sortField === 'status' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-500" /> : <ArrowDown className="w-3 h-3 text-indigo-500" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-40" />
                    )}
                  </div>
                </th>

                {/* 4. Registrar */}
                <th className="py-3 px-4 whitespace-nowrap">
                  <span>4. Registrar</span>
                </th>

                {/* 5. Days Till Expiry */}
                <th
                  onClick={() => handleSort('days_till_expiry')}
                  className="py-3 px-4 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>5. Days Till Expiry</span>
                    {sortField === 'days_till_expiry' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-500" /> : <ArrowDown className="w-3 h-3 text-indigo-500" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-40" />
                    )}
                  </div>
                </th>

                {/* 6. Actions */}
                <th className="py-3 px-4 text-right whitespace-nowrap">
                  <span>6. Actions</span>
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/60">
              {processedDomains.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500">
                    <Globe className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-medium text-zinc-700 dark:text-zinc-300">No domains matching your filters</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      Try clearing search terms or registering a new domain.
                    </p>
                  </td>
                </tr>
              ) : (
                processedDomains.map((domain) => {
                  const isPinging = pingingDomainId === domain.id;

                  // Expiry thresholds:
                  // Critical: < 30 days (Crimson/Rose)
                  // Warning: 30-60 days (Amber)
                  // Healthy: > 60 days (Emerald/Zinc)
                  const isCritical = domain.days_till_expiry <= 30;
                  const isWarning = domain.days_till_expiry > 30 && domain.days_till_expiry <= 60;
                  const isHealthy = domain.days_till_expiry > 60;

                  return (
                    <tr
                      key={domain.id}
                      className="hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40 transition-colors group"
                    >
                      {/* Column 1: Domain Name with Clickable Link & SSL Badge */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {domain.ssl_valid ? (
                            <span title="Valid SSL/TLS Certificate">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            </span>
                          ) : (
                            <span title="SSL/TLS Certificate Error or Missing">
                              <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            </span>
                          )}

                          <a
                            href={`https://${domain.domain_name}`}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="font-mono font-medium text-zinc-900 dark:text-zinc-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1"
                          >
                            <span>{domain.domain_name}</span>
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                          </a>

                          <button
                            onClick={() => handleCopy(domain.domain_name)}
                            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-0.5 rounded transition-colors opacity-0 group-hover:opacity-100"
                            title="Copy domain name"
                          >
                            {copiedDomain === domain.domain_name ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <div className="text-[10px] text-zinc-500 mt-0.5 font-mono">
                          {domain.nameservers && domain.nameservers.length > 0
                            ? domain.nameservers.slice(0, 2).join(' · ')
                            : 'Standard Authoritative DNS'}
                        </div>
                      </td>

                      {/* Column 2: Company / Department Tag */}
                      <td className="py-3 px-4">
                        <span className="font-medium text-zinc-800 dark:text-zinc-200">{domain.company}</span>
                        {domain.client_name ? (
                          <div
                            className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium mt-0.5 truncate max-w-[180px] flex items-center gap-1"
                            title={`Client: ${domain.client_name} · Email: ${domain.client_email || 'Unassigned'} · Telegram: ${domain.client_telegram_id || 'Internal'}`}
                          >
                            <span className="truncate">👤 {domain.client_name}</span>
                            {domain.email_notifications_enabled && domain.client_email && (
                              <span
                                className="inline-flex items-center px-1 rounded text-[9px] bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60 font-mono"
                                title={`30-Day Renewal Email: ${domain.client_email}`}
                              >
                                ✉ 30d
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="text-[10px] text-zinc-500 mt-0.5">
                            Threshold: {domain.alert_threshold_days}d
                          </div>
                        )}
                      </td>

                      {/* Column 3: Working (Status) with Latency & Inline Refresh Icon */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {domain.status === 'online' && (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 whitespace-nowrap">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                              <span>Online {domain.http_status}</span>
                            </span>
                          )}

                          {domain.status === 'degraded' && (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 whitespace-nowrap">
                              <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                              <span>Degraded {domain.http_status}</span>
                            </span>
                          )}

                          {domain.status === 'down' && (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 whitespace-nowrap">
                              <XCircle className="w-3 h-3 text-rose-500 shrink-0" />
                              <span>Down {domain.http_status || '503'}</span>
                            </span>
                          )}

                          {domain.status === 'pending' && (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 whitespace-nowrap">
                              <Clock className="w-3 h-3 text-zinc-400 shrink-0" />
                              <span>Pending</span>
                            </span>
                          )}

                          {/* Discrete Inline Refresh Icon to Re-Ping */}
                          <button
                            onClick={() => handlePing(domain.id)}
                            disabled={isPinging}
                            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                            title="Ping now to test live HTTP latency"
                          >
                            <RefreshCw className={`w-3 h-3 ${isPinging ? 'animate-spin text-indigo-500' : ''}`} />
                          </button>
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono tabular-nums mt-0.5">
                          {domain.response_time_ms}ms · {new Date(domain.last_checked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* Column 4: Registrar */}
                      <td className="py-3 px-4">
                        <span className="text-zinc-800 dark:text-zinc-200 font-medium">{domain.registrar}</span>
                        <div className="text-[10px] text-zinc-500 mt-0.5">
                          Reg: {new Date(domain.registered_at || domain.created_at).toLocaleDateString([], { month: 'short', year: 'numeric' })}
                        </div>
                      </td>

                      {/* Column 5: Days Till Expiry with Urgency Labels & Exact Expiry Date */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono font-bold text-xs tabular-nums px-2 py-0.5 rounded-md border ${
                              isCritical
                                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/80'
                                : isWarning
                                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/80'
                                : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80'
                            }`}
                          >
                            {domain.days_till_expiry} days
                          </span>

                          <span
                            className={`text-[10px] font-semibold uppercase tracking-wider ${
                              isCritical
                                ? 'text-rose-600 dark:text-rose-400'
                                : isWarning
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-zinc-500'
                            }`}
                          >
                            {isCritical
                              ? 'CRITICAL / URGENT'
                              : isWarning
                              ? 'EXPIRING SOON'
                              : 'HEALTHY'}
                          </span>
                        </div>
                        <div className="text-[10px] text-zinc-500 mt-0.5 font-mono">
                          Expires: {new Date(domain.expires_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </td>

                      {/* Column 6: Renew Action Button & Row Tools */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Primary Renew ↗ Button */}
                          <a
                            href={getOfficialRenewalUrl(domain)}
                            target="_blank"
                            rel="noreferrer noopener"
                            onClick={(e) => e.stopPropagation()}
                            className={`px-3 py-1 text-xs font-semibold rounded-lg flex items-center gap-1 transition-all ${
                              isCritical
                                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-xs'
                                : isWarning
                                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-xs'
                                : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700'
                            }`}
                            title={`Renew ${domain.domain_name} directly at official GoDaddy portal`}
                          >
                            <span>Renew ↗</span>
                          </a>

                          {/* Quick Send Client Test Email via Mailjet */}
                          <button
                            onClick={() => {
                              setTestEmailTarget(domain);
                              setIsSendTestModalOpen(true);
                            }}
                            className="p-1.5 text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors cursor-pointer"
                            title={domain.client_email ? `Send live renewal test email to ${domain.client_email}` : 'Send live renewal test email via Mailjet'}
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Edit */}
                          <button
                            onClick={() => onOpenEditModal(domain)}
                            className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                            title="Edit domain configuration"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Action Menu ••• */}
                          <div className="relative">
                            <button
                              onClick={() => setOpenMenuRowId(openMenuRowId === domain.id ? null : domain.id)}
                              className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                              title="More actions"
                            >
                              <MoreHorizontal className="w-3.5 h-3.5" />
                            </button>

                            {openMenuRowId === domain.id && (
                              <div
                                className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-30 py-1 text-left animate-in fade-in zoom-in-95 duration-100"
                                onMouseLeave={() => setOpenMenuRowId(null)}
                              >
                                <button
                                  onClick={() => {
                                    setTestEmailTarget(domain);
                                    setIsSendTestModalOpen(true);
                                    setOpenMenuRowId(null);
                                  }}
                                  className="w-full px-3 py-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-2 cursor-pointer transition-colors"
                                >
                                  <Mail className="w-3.5 h-3.5 text-emerald-500" />
                                  <span>Send Client Test Email</span>
                                </button>
                                <button
                                  onClick={() => {
                                    onOpenEditModal(domain);
                                    setOpenMenuRowId(null);
                                  }}
                                  className="w-full px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2 cursor-pointer transition-colors"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-zinc-400" />
                                  <span>Edit Configuration</span>
                                </button>
                                <button
                                  onClick={() => {
                                    handleCopy(domain.domain_name);
                                    setOpenMenuRowId(null);
                                  }}
                                  className="w-full px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2 cursor-pointer transition-colors"
                                >
                                  <Copy className="w-3.5 h-3.5 text-zinc-400" />
                                  <span>Copy Domain Name</span>
                                </button>
                                <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />
                                <button
                                  onClick={() => {
                                    setOpenMenuRowId(null);
                                    deleteDomain(domain.id);
                                  }}
                                  className="w-full px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 cursor-pointer transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete Asset</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-3 bg-zinc-50/70 dark:bg-zinc-950/60 border-t border-zinc-200/80 dark:border-zinc-800/80 text-[11px] text-zinc-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span>Showing {processedDomains.length} of {domains.length} domains</span>
            <span aria-hidden="true">·</span>
            <span>Sorted by Near Expiry by default</span>
          </div>
          <div className="flex items-center gap-4 text-zinc-500 text-[10px]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> &gt; 60d Healthy
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> 30–60d Expiring Soon
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span> &lt; 30d Critical / Urgent
            </span>
          </div>
        </div>
      </div>

      {/* Live On-Demand Test Email Dispatcher Modal */}
      <SendTestEmailModal
        isOpen={isSendTestModalOpen}
        onClose={() => {
          setIsSendTestModalOpen(false);
          setTestEmailTarget(null);
        }}
        initialDomainId={testEmailTarget?.id}
        initialRecipient={testEmailTarget?.client_email}
      />
    </div>
  );
};
