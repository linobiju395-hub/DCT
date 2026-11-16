import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Network,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Globe,
  ExternalLink,
  Download,
  CheckCircle2,
  Lock,
  Mail,
  Zap,
} from 'lucide-react';
import { DNSInspectionResult, DNSRecord, DNSRecordType } from '../../types/dns';
import { inspectDomainDNS } from '../../services/dnsService';

interface DNSInspectorDrawerProps {
  isOpen: boolean;
  domainName: string;
  onClose: () => void;
}

type TabType = 'ALL' | 'A_AAAA' | 'CNAME' | 'MX' | 'TXT_SPF' | 'NS' | 'SOA';

export const DNSInspectorDrawer: React.FC<DNSInspectorDrawerProps> = ({
  isOpen,
  domainName,
  onClose,
}) => {
  const [data, setData] = useState<DNSInspectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedZone, setCopiedZone] = useState(false);

  useEffect(() => {
    if (isOpen && domainName) {
      loadDNS(domainName);
    }
  }, [isOpen, domainName]);

  const loadDNS = async (target: string) => {
    setLoading(true);
    try {
      const res = await inspectDomainDNS(target);
      setData(res);
    } catch {
      // Fallback handled in service
    } finally {
      setLoading(false);
    }
  };

  const handleCopyValue = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleCopyZone = () => {
    if (!data) return;
    const zoneLines = [
      `; Zone inspection for ${data.domain}`,
      `; Queried at ${data.queriedAt}`,
      ...data.records.map((r) => `${r.name.padEnd(20)} ${r.ttl.toString().padEnd(6)} IN ${r.type.padEnd(6)} ${r.value}`),
    ].join('\n');
    navigator.clipboard.writeText(zoneLines);
    setCopiedZone(true);
    setTimeout(() => setCopiedZone(false), 2000);
  };

  const filteredRecords = useMemo(() => {
    if (!data) return [];
    if (activeTab === 'ALL') return data.records;
    if (activeTab === 'A_AAAA') return data.records.filter((r) => r.type === 'A' || r.type === 'AAAA');
    if (activeTab === 'CNAME') return data.records.filter((r) => r.type === 'CNAME');
    if (activeTab === 'MX') return data.records.filter((r) => r.type === 'MX');
    if (activeTab === 'TXT_SPF') return data.records.filter((r) => r.type === 'TXT');
    if (activeTab === 'NS') return data.records.filter((r) => r.type === 'NS');
    if (activeTab === 'SOA') return data.records.filter((r) => r.type === 'SOA');
    return data.records;
  }, [data, activeTab]);

  if (!isOpen) return null;

  // Format TTL helper
  const formatTtl = (ttl: number) => {
    if (ttl >= 86400) return `${ttl}s (${Math.round(ttl / 86400)}d)`;
    if (ttl >= 3600) return `${ttl}s (${Math.round(ttl / 3600)}h)`;
    if (ttl >= 60) return `${ttl}s (${Math.round(ttl / 60)}m)`;
    return `${ttl}s`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-zinc-950/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div
        className="w-full max-w-3xl bg-white h-full shadow-2xl flex flex-col border-l border-zinc-200 overflow-hidden animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-6 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-white shadow-xs shrink-0">
              <Network className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 truncate">
                <h2 className="text-base font-semibold text-zinc-900 tracking-tight font-sans truncate">
                  {domainName}
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold font-mono uppercase bg-zinc-100 text-zinc-700 border border-zinc-200 shrink-0">
                  DNS Inspector
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5 truncate">
                Real-time authorative zone records & global edge resolution
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 w-full sm:w-auto shrink-0">
            <button
              onClick={() => loadDNS(domainName)}
              disabled={loading}
              className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors border border-zinc-200 cursor-pointer"
              title="Re-query DNS"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-zinc-900' : ''}`} />
            </button>
            <button
              onClick={handleCopyZone}
              className="px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 rounded-lg border border-zinc-200 flex items-center gap-1.5 transition-colors"
              title="Copy DNS Zone file"
            >
              {copiedZone ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Zone</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && !data && (
            <div className="py-24 flex flex-col items-center justify-center text-zinc-400 space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-zinc-800" />
              <p className="text-xs font-mono">Querying authorative nameservers & edge resolvers...</p>
            </div>
          )}

          {data && (
            <>
              {/* 1. Security & Mail Hygiene Checks (3 Summary Cards) */}
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2.5">
                  Security & Mail Hygiene
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Card 1: DMARC */}
                  <div className="p-3.5 bg-zinc-50/70 border border-zinc-200/80 rounded-xl">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-zinc-500 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5" />
                        <span>DMARC Record</span>
                      </span>
                      {data.hygiene.dmarc.status === 'valid' || data.hygiene.dmarc.status === 'reject' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {data.hygiene.dmarc.policy === 'reject' ? 'REJECT' : 'VALID'}
                        </span>
                      ) : data.hygiene.dmarc.status === 'quarantine' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          QUARANTINE
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          MISSING
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-semibold text-zinc-900">
                      {data.hygiene.dmarc.status === 'missing' ? 'No policy published' : `Policy: ${data.hygiene.dmarc.policy}`}
                    </div>
                    <div className="text-[11px] text-zinc-400 font-mono truncate mt-1">
                      {data.hygiene.dmarc.rawRecord || '_dmarc record not found'}
                    </div>
                  </div>

                  {/* Card 2: SPF */}
                  <div className="p-3.5 bg-zinc-50/70 border border-zinc-200/80 rounded-xl">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-zinc-500 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>SPF Record</span>
                      </span>
                      {data.hygiene.spf.status === 'configured' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          CONFIGURED
                        </span>
                      ) : data.hygiene.spf.status === 'multiple_found' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          MULTIPLE (ERROR)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          MISSING
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-semibold text-zinc-900">
                      {data.hygiene.spf.status === 'multiple_found'
                        ? 'Multiple SPF entries (RFC violation)'
                        : data.hygiene.spf.status === 'configured'
                        ? 'Authorized senders mapped'
                        : 'No SPF TXT record'}
                    </div>
                    <div className="text-[11px] text-zinc-400 font-mono truncate mt-1">
                      {data.hygiene.spf.rawRecord || 'v=spf1 ... missing'}
                    </div>
                  </div>

                  {/* Card 3: DNSSEC */}
                  <div className="p-3.5 bg-zinc-50/70 border border-zinc-200/80 rounded-xl">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-zinc-500 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5" />
                        <span>DNSSEC Signature</span>
                      </span>
                      {data.hygiene.dnssec.status === 'enabled' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          SECURE
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200">
                          DISABLED
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-semibold text-zinc-900">
                      {data.hygiene.dnssec.status === 'enabled' ? 'Cryptographically Verified' : 'Unsigned DNS Zone'}
                    </div>
                    <div className="text-[11px] text-zinc-400 font-mono truncate mt-1">
                      {data.hygiene.dnssec.details || 'No RRSIG records returned'}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Global Edge Propagation Checker (Mini Grid) */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Global Edge Propagation Checker</span>
                  </span>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    Target: {data.primaryIp}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {data.edgeResults.map((edge) => (
                    <div
                      key={edge.provider}
                      className="p-3 bg-white border border-zinc-200/90 rounded-xl shadow-2xs hover:border-zinc-300 transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-zinc-800">{edge.provider}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      </div>
                      <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                        {edge.serverIp}
                      </div>
                      <div className="mt-2.5 pt-2 border-t border-zinc-100 flex items-center justify-between text-xs">
                        <span className="text-emerald-700 font-medium font-mono text-[11px]">
                          {edge.latencyMs}ms
                        </span>
                        <span className="text-zinc-600 font-mono text-[11px] truncate max-w-[80px]" title={edge.resolvedValue}>
                          {edge.resolvedValue}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Record Query Tabs */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="inline-flex items-center p-0.5 bg-zinc-100 rounded-lg border border-zinc-200 text-xs">
                    <button
                      onClick={() => setActiveTab('ALL')}
                      className={`px-3 py-1.5 rounded-md transition-all ${
                        activeTab === 'ALL'
                          ? 'bg-white text-zinc-900 shadow-xs font-semibold'
                          : 'text-zinc-600 hover:text-zinc-900 font-medium'
                      }`}
                    >
                      All ({data.records.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('A_AAAA')}
                      className={`px-3 py-1.5 rounded-md transition-all ${
                        activeTab === 'A_AAAA'
                          ? 'bg-white text-zinc-900 shadow-xs font-semibold'
                          : 'text-zinc-600 hover:text-zinc-900 font-medium'
                      }`}
                    >
                      A / AAAA
                    </button>
                    <button
                      onClick={() => setActiveTab('CNAME')}
                      className={`px-3 py-1.5 rounded-md transition-all ${
                        activeTab === 'CNAME'
                          ? 'bg-white text-zinc-900 shadow-xs font-semibold'
                          : 'text-zinc-600 hover:text-zinc-900 font-medium'
                      }`}
                    >
                      CNAME
                    </button>
                    <button
                      onClick={() => setActiveTab('MX')}
                      className={`px-3 py-1.5 rounded-md transition-all ${
                        activeTab === 'MX'
                          ? 'bg-white text-zinc-900 shadow-xs font-semibold'
                          : 'text-zinc-600 hover:text-zinc-900 font-medium'
                      }`}
                    >
                      MX
                    </button>
                    <button
                      onClick={() => setActiveTab('TXT_SPF')}
                      className={`px-3 py-1.5 rounded-md transition-all ${
                        activeTab === 'TXT_SPF'
                          ? 'bg-white text-zinc-900 shadow-xs font-semibold'
                          : 'text-zinc-600 hover:text-zinc-900 font-medium'
                      }`}
                    >
                      TXT / SPF
                    </button>
                    <button
                      onClick={() => setActiveTab('NS')}
                      className={`px-3 py-1.5 rounded-md transition-all ${
                        activeTab === 'NS'
                          ? 'bg-white text-zinc-900 shadow-xs font-semibold'
                          : 'text-zinc-600 hover:text-zinc-900 font-medium'
                      }`}
                    >
                      NS
                    </button>
                    <button
                      onClick={() => setActiveTab('SOA')}
                      className={`px-3 py-1.5 rounded-md transition-all ${
                        activeTab === 'SOA'
                          ? 'bg-white text-zinc-900 shadow-xs font-semibold'
                          : 'text-zinc-600 hover:text-zinc-900 font-medium'
                      }`}
                    >
                      SOA
                    </button>
                  </div>

                  <span className="text-xs text-zinc-400 font-mono">
                    Showing {filteredRecords.length} records
                  </span>
                </div>

                {/* 4. DNS Records Table */}
                <div className="bg-white border border-zinc-200/90 rounded-xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-200/80 bg-zinc-50/70 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                          <th className="py-2.5 px-3.5 w-16">Type</th>
                          <th className="py-2.5 px-3.5 w-32">Host / Name</th>
                          <th className="py-2.5 px-3.5">Value / Target IP</th>
                          <th className="py-2.5 px-3.5 w-24">TTL</th>
                          <th className="py-2.5 px-3.5 w-28 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 text-xs">
                        {filteredRecords.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-12 text-center text-zinc-400 font-sans">
                              No records found matching tab filter.
                            </td>
                          </tr>
                        ) : (
                          filteredRecords.map((r) => {
                            const isCopied = copiedId === r.id;
                            const isHighTtl = r.status === 'high_ttl';

                            return (
                              <tr key={r.id} className="hover:bg-zinc-50/80 transition-colors group">
                                {/* Type - Sharp square pill */}
                                <td className="py-3 px-3.5 align-middle">
                                  <span
                                    className={`px-2 py-1 rounded-md text-[11px] font-bold font-mono inline-block border ${
                                      r.type === 'A' || r.type === 'AAAA'
                                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                                        : r.type === 'MX'
                                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                                        : r.type === 'TXT'
                                        ? 'bg-zinc-100 text-zinc-800 border-zinc-200'
                                        : r.type === 'CNAME'
                                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                                        : r.type === 'NS'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                                    }`}
                                  >
                                    {r.type}
                                  </span>
                                </td>

                                {/* Host / Name */}
                                <td className="py-3 px-3.5 align-middle font-mono font-medium text-zinc-800">
                                  {r.name}
                                </td>

                                {/* Value / Target IP with 1-click copy */}
                                <td className="py-3 px-3.5 align-middle">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-mono text-zinc-800 text-xs break-all select-all">
                                      {r.priority !== undefined ? `[${r.priority}] ` : ''}
                                      {r.value}
                                    </span>
                                    <button
                                      onClick={() => handleCopyValue(r.id, r.value)}
                                      className="p-1 text-zinc-400 hover:text-zinc-800 rounded hover:bg-zinc-100 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                      title="Copy record value"
                                    >
                                      {isCopied ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  </div>
                                </td>

                                {/* TTL */}
                                <td className="py-3 px-3.5 align-middle">
                                  <span className="font-mono text-xs tabular-nums text-zinc-600">
                                    {formatTtl(r.ttl)}
                                  </span>
                                </td>

                                {/* Health / Status Indicator */}
                                <td className="py-3 px-3.5 align-middle text-right">
                                  {isHighTtl ? (
                                    <span
                                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 border border-amber-200 text-amber-800"
                                      title={r.statusMessage}
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                      <span>High TTL</span>
                                    </span>
                                  ) : (
                                    <span
                                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 border border-emerald-200 text-emerald-700"
                                      title={r.statusMessage}
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                      <span>Resolved</span>
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Drawer Bottom Action Strip */}
        <div className="p-4 border-t border-zinc-100 bg-zinc-50/60 flex items-center justify-between text-xs text-zinc-500 shrink-0">
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Connected to Anycast Edge Network</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white font-medium rounded-lg shadow-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
