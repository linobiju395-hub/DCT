import React, { useState, useEffect, useMemo } from 'react';
import {
  Network,
  Search,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Globe,
  Download,
  CheckCircle2,
  Lock,
  Mail,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { useDomains } from '../../context/DomainContext';
import { DNSInspectionResult, DNSRecord, DNSRecordType } from '../../types/dns';
import { inspectDomainDNS, cleanDomainInput } from '../../services/dnsService';
import { DomainRecord } from '../../types/domain';

interface DNSTabProps {
  initialDomain?: string;
  onOpenDomainDetails?: (domain: DomainRecord) => void;
}

type TabType = 'ALL' | 'A_AAAA' | 'CNAME' | 'MX' | 'TXT_SPF' | 'NS' | 'SOA';

export const DNSTab: React.FC<DNSTabProps> = ({ initialDomain }) => {
  const { domains } = useDomains();
  const [inputDomain, setInputDomain] = useState(initialDomain || (domains[0]?.domain_name || 'internal.company.com'));
  const [activeDomain, setActiveDomain] = useState(inputDomain);
  const [data, setData] = useState<DNSInspectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedZone, setCopiedZone] = useState(false);

  useEffect(() => {
    if (activeDomain) {
      handleLookup(activeDomain);
    }
  }, [activeDomain]);

  const handleLookup = async (domainToQuery: string) => {
    const clean = cleanDomainInput(domainToQuery);
    if (!clean) return;
    setLoading(true);
    try {
      const res = await inspectDomainDNS(clean);
      setData(res);
    } catch {
      // Handled
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

  const formatTtl = (ttl: number) => {
    if (ttl >= 86400) return `${ttl}s (${Math.round(ttl / 86400)}d)`;
    if (ttl >= 3600) return `${ttl}s (${Math.round(ttl / 3600)}h)`;
    if (ttl >= 60) return `${ttl}s (${Math.round(ttl / 60)}m)`;
    return `${ttl}s`;
  };

  return (
    <div className="space-y-6">
      {/* Search & Domain Investigation Bar */}
      <div className="bg-white border border-zinc-200/90 rounded-xl p-5 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 tracking-tight flex items-center gap-2">
            <Network className="w-4.5 h-4.5 text-zinc-800" />
            <span>DNS Health & Records Inspector Workbench</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Probe live nameservers, check SPF/DMARC mail hygiene, and verify global edge propagation
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setActiveDomain(inputDomain);
          }}
          className="flex flex-col sm:flex-row items-center gap-3"
        >
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Enter any domain or hostname (e.g. internal.company.com or google.com)..."
              value={inputDomain}
              onChange={(e) => setInputDomain(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-50/70 border border-zinc-200 rounded-lg text-xs font-mono text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-800 focus:bg-white transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 shrink-0 active:scale-95"
          >
            {loading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5" />
            )}
            <span>Inspect DNS</span>
          </button>
        </form>

        {/* Quick select chips from monitored domains */}
        <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
          <span className="text-zinc-400 font-medium text-[11px]">Quick inspect:</span>
          {domains.slice(0, 5).map((d) => (
            <button
              key={d.id}
              onClick={() => {
                setInputDomain(d.domain_name);
                setActiveDomain(d.domain_name);
              }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono border transition-colors ${
                activeDomain === d.domain_name
                  ? 'bg-zinc-900 text-white border-zinc-900 font-semibold'
                  : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-200/80'
              }`}
            >
              {d.domain_name}
            </button>
          ))}
        </div>
      </div>

      {loading && !data && (
        <div className="bg-white border border-zinc-200/90 rounded-xl p-16 flex flex-col items-center justify-center text-zinc-400 space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-zinc-800" />
          <p className="text-xs font-mono">Querying authorative nameservers & edge resolvers...</p>
        </div>
      )}

      {data && (
        <div className="space-y-6">
          {/* Header Summary for Current Domain */}
          <div className="bg-white border border-zinc-200/90 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-zinc-900 font-sans tracking-tight">
                  {data.domain}
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {data.primaryIp}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 font-mono">
                Last queried: {new Date(data.queriedAt).toLocaleTimeString()} · Total records: {data.records.length}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleLookup(data.domain)}
                disabled={loading}
                className="px-3 py-1.5 text-xs font-medium text-zinc-700 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Re-probe</span>
              </button>
              <button
                onClick={handleCopyZone}
                className="px-3 py-1.5 text-xs font-medium text-zinc-700 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
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
            </div>
          </div>

          {/* 1. Security & Mail Hygiene Cards */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Security & Mail Hygiene Analysis
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* DMARC */}
              <div className="p-4 bg-white border border-zinc-200/90 rounded-xl shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-zinc-600 flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-zinc-500" />
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
                <div className="text-xs text-zinc-400 font-mono truncate mt-1">
                  {data.hygiene.dmarc.rawRecord || '_dmarc record not found in DNS'}
                </div>
              </div>

              {/* SPF */}
              <div className="p-4 bg-white border border-zinc-200/90 rounded-xl shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-zinc-600 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-zinc-500" />
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
                <div className="text-xs text-zinc-400 font-mono truncate mt-1">
                  {data.hygiene.spf.rawRecord || 'v=spf1 ... missing'}
                </div>
              </div>

              {/* DNSSEC */}
              <div className="p-4 bg-white border border-zinc-200/90 rounded-xl shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-zinc-600 flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-zinc-500" />
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
                <div className="text-xs text-zinc-400 font-mono truncate mt-1">
                  {data.hygiene.dnssec.details || 'No RRSIG records found'}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Global Edge Propagation Grid */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                <span>Global Edge Propagation Checker</span>
              </h3>
              <span className="text-xs text-zinc-400 font-mono">
                Target IP: {data.primaryIp}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {data.edgeResults.map((edge) => (
                <div
                  key={edge.provider}
                  className="p-3.5 bg-white border border-zinc-200/90 rounded-xl shadow-xs hover:border-zinc-300 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-zinc-800">{edge.provider}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  </div>
                  <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                    {edge.serverIp}
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-zinc-100 flex items-center justify-between text-xs">
                    <span className="text-emerald-700 font-semibold font-mono text-xs">
                      {edge.latencyMs}ms
                    </span>
                    <span className="text-zinc-600 font-mono text-xs truncate max-w-[100px]" title={edge.resolvedValue}>
                      {edge.resolvedValue}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Record Query Tabs & Records Table */}
          <div className="bg-white border border-zinc-200/90 rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-zinc-100 flex flex-wrap items-center justify-between gap-3 bg-white">
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

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200/80 bg-zinc-50/70 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    <th className="py-3 px-4 w-16">Type</th>
                    <th className="py-3 px-4 w-32">Host / Name</th>
                    <th className="py-3 px-4">Value / Target IP</th>
                    <th className="py-3 px-4 w-28">TTL</th>
                    <th className="py-3 px-4 w-32 text-right">Health / Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-xs">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-16 text-center text-zinc-400 font-sans">
                        No records matching selected category filter.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((r) => {
                      const isCopied = copiedId === r.id;
                      const isHighTtl = r.status === 'high_ttl';

                      return (
                        <tr key={r.id} className="hover:bg-zinc-50/70 transition-colors group">
                          {/* Type */}
                          <td className="py-3.5 px-4 align-middle">
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
                          <td className="py-3.5 px-4 align-middle font-mono font-medium text-zinc-800">
                            {r.name}
                          </td>

                          {/* Value / Target IP */}
                          <td className="py-3.5 px-4 align-middle">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-zinc-800 text-xs break-all select-all">
                                {r.priority !== undefined ? `[pri: ${r.priority}] ` : ''}
                                {r.value}
                              </span>
                              <button
                                onClick={() => handleCopyValue(r.id, r.value)}
                                className="p-1 text-zinc-400 hover:text-zinc-800 rounded hover:bg-zinc-100 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Copy value"
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
                          <td className="py-3.5 px-4 align-middle">
                            <span className="font-mono text-xs tabular-nums text-zinc-600">
                              {formatTtl(r.ttl)}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 align-middle text-right">
                            {isHighTtl ? (
                              <span
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-amber-50 border border-amber-200 text-amber-800"
                                title={r.statusMessage}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                <span>High TTL</span>
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-emerald-50 border border-emerald-200 text-emerald-700"
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
      )}
    </div>
  );
};
