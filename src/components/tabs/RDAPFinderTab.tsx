import React, { useState, useEffect } from 'react';
import {
  Search,
  Globe,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  Building,
  Mail,
  Phone,
  Server,
  Copy,
  Check,
  ExternalLink,
  Plus,
  RefreshCw,
  Code2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useDomains } from '../../context/DomainContext';
import { queryAuthoritativeRDAP, AuthoritativeRDAPRecord, getRegistrarRenewalUrl } from '../../services/whoisService';

interface RDAPFinderTabProps {
  onNavigateToRegistry?: () => void;
}

export const RDAPFinderTab: React.FC<RDAPFinderTabProps> = ({ onNavigateToRegistry }) => {
  const { domains, addDomain } = useDomains();
  const [searchInput, setSearchInput] = useState('stripe.com');
  const [isLoading, setIsLoading] = useState(false);
  const [record, setRecord] = useState<AuthoritativeRDAPRecord | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [addSuccessMessage, setAddSuccessMessage] = useState<string | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);

  // Perform initial query on mount
  useEffect(() => {
    handleLookup('stripe.com');
  }, []);

  const handleLookup = async (domainToQuery?: string) => {
    const target = (domainToQuery || searchInput).trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!target) return;

    setIsLoading(true);
    setAddSuccessMessage(null);

    try {
      const data = await queryAuthoritativeRDAP(target);
      setRecord(data);
    } catch {
      // handled inside queryAuthoritativeRDAP fallback
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const isAlreadyMonitored = record
    ? domains.some((d) => d.domain_name.toLowerCase() === record.domain.toLowerCase())
    : false;

  const handleAddToMonitored = async () => {
    if (!record || isAlreadyMonitored) return;
    setIsAdding(true);

    try {
      await addDomain({
        domain_name: record.domain,
        company: 'ICANN RDAP Import',
        registrar: record.registrarName,
        renewal_url: getRegistrarRenewalUrl(record.registrarName, record.domain),
        client_name: record.registrarName,
        email_notifications_enabled: true,
      });

      setAddSuccessMessage(`Added "${record.domain}" to All Monitored Domains registry.`);
      setTimeout(() => setAddSuccessMessage(null), 4000);
    } catch {
      setAddSuccessMessage('Could not import domain to registry.');
      setTimeout(() => setAddSuccessMessage(null), 3000);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
          <Search className="w-3.5 h-3.5 text-zinc-500" />
          <span>Core Monitoring</span>
          <span aria-hidden="true">&middot;</span>
          <span className="text-zinc-700 font-medium">Authoritative Registry Probe</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 mt-1">
          ICANN RDAP Finder &amp; WHOIS Inspection
        </h1>
        <p className="text-xs text-zinc-500 mt-1">
          Query authoritative whois.com API &amp; ICANN Registration Data Access Protocol endpoints for verified ownership, registrar identity, and lifecycle timestamps.
        </p>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLookup();
          }}
          className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
        >
          <div className="relative flex-1">
            <Globe className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Enter any domain or TLD (e.g., github.com, webcoffee.in, airtics.org)..."
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !searchInput.trim()}
            className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Querying...' : 'Query RDAP'}</span>
          </button>
        </form>

        {/* Quick Suggestion Pills */}
        <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-zinc-500">
          <span className="text-zinc-400">Quick Probes:</span>
          {['google.com', 'webcoffee.in', 'ahadbuilders.com', 'airtics.org', 'mitkannur.ac.in'].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => {
                setSearchInput(d);
                handleLookup(d);
              }}
              className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-mono text-[11px] font-medium transition-colors"
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Add Success Toast */}
      {addSuccessMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{addSuccessMessage}</span>
          </div>
          {onNavigateToRegistry && (
            <button
              type="button"
              onClick={onNavigateToRegistry}
              className="font-bold underline hover:text-emerald-950 text-xs"
            >
              View in All Domains &rarr;
            </button>
          )}
        </div>
      )}

      {/* Results Workbench */}
      {record && (
        <div className="space-y-4">
          {/* Main Card with Header & Action */}
          <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow-xs shrink-0">
                  <Globe className="w-5 h-5 text-zinc-100" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-bold font-mono text-zinc-900 tracking-tight">
                      {record.domain}
                    </h2>
                    {isAlreadyMonitored && (
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        Already in Monitored Registry
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                    <span>
                      {record.source?.includes('whois')
                        ? 'Authoritative whois.com API Engine'
                        : 'Authoritative ICANN RDAP Bootstrap Response'}
                    </span>
                    <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-700 border border-zinc-200">
                      {record.source || 'whois.com (api.who.is)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button: + Add to All Domains */}
              <div className="flex items-center gap-2">
                {!isAlreadyMonitored ? (
                  <button
                    type="button"
                    onClick={handleAddToMonitored}
                    disabled={isAdding}
                    className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isAdding ? 'Adding...' : '+ Add to All Domains'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="px-4 py-2 bg-zinc-100 text-zinc-500 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-not-allowed"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Monitored</span>
                  </button>
                )}

                <a
                  href={getRegistrarRenewalUrl(record.registrarName, record.domain)}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="px-3 py-2 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-xl text-xs font-medium shadow-2xs flex items-center gap-1 transition-colors"
                >
                  <span>Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* 3-Column Detailed Metadata Display */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5">
              {/* Column 1: Registrar & Identity */}
              <div className="space-y-3.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 uppercase tracking-wider">
                  <Building className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Registrar Entity</span>
                </div>

                <div className="bg-zinc-50/70 border border-zinc-200/80 rounded-xl p-3.5 space-y-2.5 text-xs">
                  <div>
                    <span className="text-zinc-400 text-[10px] uppercase font-semibold block">Registrar Name</span>
                    <span className="font-semibold text-zinc-900 text-sm">{record.registrarName}</span>
                  </div>

                  {record.registrarIanaId && (
                    <div>
                      <span className="text-zinc-400 text-[10px] uppercase font-semibold block">IANA ID</span>
                      <span className="font-mono text-zinc-700">{record.registrarIanaId}</span>
                    </div>
                  )}

                  {record.abuseEmail && (
                    <div>
                      <span className="text-zinc-400 text-[10px] uppercase font-semibold block">Abuse Contact Email</span>
                      <div className="flex items-center justify-between gap-1 text-zinc-700 font-mono text-[11px]">
                        <span className="truncate">{record.abuseEmail}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(record.abuseEmail!, 'abuseEmail')}
                          className="text-zinc-400 hover:text-zinc-700"
                          title="Copy email"
                        >
                          {copiedField === 'abuseEmail' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {record.abusePhone && (
                    <div>
                      <span className="text-zinc-400 text-[10px] uppercase font-semibold block">Abuse Contact Phone</span>
                      <span className="font-mono text-zinc-700 text-[11px]">{record.abusePhone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Column 2: Lifecycle Timestamps */}
              <div className="space-y-3.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 uppercase tracking-wider">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Lifecycle &amp; Expiry</span>
                </div>

                <div className="bg-zinc-50/70 border border-zinc-200/80 rounded-xl p-3.5 space-y-2.5 text-xs">
                  <div>
                    <span className="text-zinc-400 text-[10px] uppercase font-semibold block">Expiration Timestamp</span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="font-mono font-bold text-zinc-900 text-sm">
                        {record.expiresDate?.split('T')[0] || 'Unknown'}
                      </span>
                      <span
                        className={`text-xs font-bold font-mono ${
                          record.daysTillExpiry <= 30 ? 'text-rose-600' : 'text-emerald-700'
                        }`}
                      >
                        ({record.daysTillExpiry} days left)
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-zinc-400 text-[10px] uppercase font-semibold block">Created / Registration</span>
                    <span className="font-mono text-zinc-700 text-[11px]">
                      {record.createdDate || 'Historical'}
                    </span>
                  </div>

                  <div>
                    <span className="text-zinc-400 text-[10px] uppercase font-semibold block">Last Synchronized</span>
                    <span className="font-mono text-zinc-700 text-[11px]">
                      {record.updatedDate || new Date().toISOString()}
                    </span>
                  </div>

                  <div>
                    <span className="text-zinc-400 text-[10px] uppercase font-semibold block">DNSSEC Delegation</span>
                    <span className="font-semibold text-zinc-800">
                      {record.dnssecDelegated ? '✓ Signed (DNSSEC Enabled)' : '✗ Unsigned'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Column 3: Statuses & Nameservers */}
              <div className="space-y-3.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 uppercase tracking-wider">
                  <Server className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Nameservers &amp; Status</span>
                </div>

                <div className="bg-zinc-50/70 border border-zinc-200/80 rounded-xl p-3.5 space-y-2.5 text-xs">
                  <div>
                    <span className="text-zinc-400 text-[10px] uppercase font-semibold block mb-1">
                      ICANN Domain Status
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {record.status.map((st) => (
                        <span
                          key={st}
                          className="px-1.5 py-0.5 rounded bg-white border border-zinc-200 font-mono text-[10px] text-zinc-700"
                        >
                          {st}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-zinc-400 text-[10px] uppercase font-semibold block mb-1">
                      Delegated Nameservers ({record.nameservers.length})
                    </span>
                    <div className="space-y-1">
                      {record.nameservers.map((ns, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between bg-white px-2 py-1 rounded border border-zinc-200 font-mono text-[11px] text-zinc-700"
                        >
                          <span className="truncate">{ns}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(ns, `ns-${idx}`)}
                            className="text-zinc-400 hover:text-zinc-700 ml-1 shrink-0"
                            title="Copy nameserver"
                          >
                            {copiedField === `ns-${idx}` ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Collapsible Raw JSON Viewer */}
            {record.rawJson && (
              <div className="mt-5 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowRawJson(!showRawJson)}
                  className="flex items-center gap-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 transition-colors"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>{showRawJson ? 'Hide Raw RDAP JSON Payload' : 'View Authoritative RDAP JSON Payload'}</span>
                  {showRawJson ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showRawJson && (
                  <pre className="mt-3 p-4 bg-zinc-900 text-zinc-200 rounded-xl text-[11px] font-mono overflow-x-auto max-h-80 border border-zinc-800">
                    {JSON.stringify(record.rawJson, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
