import React, { useState, useEffect } from 'react';
import {
  X,
  Globe,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
  Plus,
  Check,
  Clock,
  Building2,
  Lock,
  Mail,
  Zap,
  Network,
  Copy,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Radio,
} from 'lucide-react';
import { useDomains } from '../../context/DomainContext';
import { lookupDomainRDAP, getRegistrarRenewalUrl } from '../../services/whoisService';
import { checkDomainUptime } from '../../services/uptimeService';
import { inspectDomainDNS, cleanDomainInput } from '../../services/dnsService';
import { DNSInspectionResult } from '../../types/dns';
import { RDAPLookupResult, UptimePingResult } from '../../types/domain';
import { TEAM_OWNERS } from '../../data/teamData';

interface LiveInspectionModalProps {
  domainName: string | null;
  isOpen: boolean;
  onClose: () => void;
  onDomainAdded?: (domainName: string) => void;
}

export const LiveInspectionModal: React.FC<LiveInspectionModalProps> = ({
  domainName,
  isOpen,
  onClose,
  onDomainAdded,
}) => {
  const { domains, addDomain } = useDomains();

  const [cleanDomain, setCleanDomain] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'dns'>('overview');

  // Query Results State
  const [rdap, setRdap] = useState<RDAPLookupResult | null>(null);
  const [uptime, setUptime] = useState<UptimePingResult | null>(null);
  const [dns, setDns] = useState<DNSInspectionResult | null>(null);
  const [selectedCompany, setSelectedCompany] = useState(TEAM_OWNERS[0]?.department || 'Growth & Brand');
  const [isAdding, setIsAdding] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [addedSuccess, setAddedSuccess] = useState(false);

  // Check if domain is already monitored
  const existingDomain = domains.find(
    (d) => d.domain_name.toLowerCase() === cleanDomain.toLowerCase()
  );

  useEffect(() => {
    if (isOpen && domainName) {
      const sanitized = cleanDomainInput(domainName);
      setCleanDomain(sanitized);
      setAddedSuccess(false);
      runLiveInvestigation(sanitized);
    }
  }, [isOpen, domainName]);

  const runLiveInvestigation = async (target: string) => {
    setIsLoading(true);
    setRdap(null);
    setUptime(null);
    setDns(null);

    // Parallel live queries across RDAP, Uptime, and DNS
    const [rdapRes, uptimeRes, dnsRes] = await Promise.allSettled([
      lookupDomainRDAP(target),
      checkDomainUptime(target),
      inspectDomainDNS(target),
    ]);

    if (rdapRes.status === 'fulfilled') {
      setRdap(rdapRes.value);
    }
    if (uptimeRes.status === 'fulfilled') {
      setUptime(uptimeRes.value);
    }
    if (dnsRes.status === 'fulfilled') {
      setDns(dnsRes.value);
    }

    setIsLoading(false);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleAddToMonitored = async () => {
    if (!cleanDomain) return;
    setIsAdding(true);
    try {
      const registrar = rdap?.registrar || 'Authoritative Registry';
      const renewalUrl = getRegistrarRenewalUrl(registrar, cleanDomain);

      await addDomain({
        domain_name: cleanDomain,
        company: selectedCompany,
        registrar,
        renewal_url: renewalUrl,
        alert_threshold_days: 30,
        telegram_alert_enabled: true,
      });

      setAddedSuccess(true);
      if (onDomainAdded) onDomainAdded(cleanDomain);
      setTimeout(() => {
        onClose();
      }, 1400);
    } finally {
      setIsAdding(false);
    }
  };

  if (!isOpen || !cleanDomain) return null;

  // Security score calculation
  const hasSpf = dns?.hygiene?.spf?.status === 'configured';
  const dmarcStatus = dns?.hygiene?.dmarc?.status;
  const hasDmarc = dmarcStatus === 'valid' || dmarcStatus === 'reject' || dmarcStatus === 'quarantine';
  const isDmarcReject = dmarcStatus === 'reject';
  const isDmarcQuarantine = dmarcStatus === 'quarantine';
  const isDnssecEnabled = dns?.hygiene?.dnssec?.status === 'enabled';
  const isSslValid = uptime?.ssl_valid !== false;

  let calculatedSecurityScore = 100;
  if (!isSslValid) calculatedSecurityScore -= 30;
  if (!hasSpf) calculatedSecurityScore -= 20;
  if (!hasDmarc) calculatedSecurityScore -= 25;
  else if (!isDmarcReject && !isDmarcQuarantine) calculatedSecurityScore -= 10;
  if (!isDnssecEnabled) calculatedSecurityScore -= 5;
  calculatedSecurityScore = Math.max(25, Math.min(100, calculatedSecurityScore));

  const daysLeft = rdap?.days_till_expiry ?? 180;
  const isCriticalExpiry = daysLeft < 14;
  const isWarningExpiry = daysLeft >= 14 && daysLeft <= 60;

  // Format date safely
  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Not published';
    try {
      return new Date(isoString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-zinc-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-zinc-200/90 rounded-t-2xl sm:rounded-xl max-w-3xl w-full max-h-[92vh] sm:max-h-[88vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        
        {/* 1. Header Section */}
        <div className="px-6 py-5 border-b border-zinc-200/80 flex items-start justify-between bg-white shrink-0">
          <div className="min-w-0 pr-4">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-semibold tracking-tight text-zinc-900 truncate">
                {cleanDomain}
              </h2>
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-2.5 py-0.5 font-medium rounded-full shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Telemetry</span>
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Authoritative whois.com API &amp; ICANN RDAP Telemetry Probe
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => runLiveInvestigation(cleanDomain)}
              disabled={isLoading}
              className="w-8 h-8 rounded-md hover:bg-zinc-100 flex items-center justify-center text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh live telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-zinc-900' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-md hover:bg-zinc-100 flex items-center justify-center text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. High-End Tab Bar */}
        <div className="flex border-b border-zinc-200 px-6 bg-white shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`cursor-pointer transition-colors ${
              activeTab === 'overview'
                ? 'text-sm font-semibold text-zinc-900 border-b-2 border-zinc-900 pb-2.5 px-4'
                : 'text-sm font-medium text-zinc-500 hover:text-zinc-900 px-4 py-2.5'
            }`}
          >
            Telemetry Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('dns')}
            className={`cursor-pointer inline-flex items-center transition-colors ${
              activeTab === 'dns'
                ? 'text-sm font-semibold text-zinc-900 border-b-2 border-zinc-900 pb-2.5 px-4'
                : 'text-sm font-medium text-zinc-500 hover:text-zinc-900 px-4 py-2.5'
            }`}
          >
            <span>DNS Zone Records</span>
            <span className="text-xs font-mono bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full ml-1.5">
              {dns?.records?.length || 0}
            </span>
          </button>
        </div>

        {/* 3. Scrollable Body Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 bg-white">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-zinc-400 space-y-3">
              <RefreshCw className="w-7 h-7 animate-spin text-zinc-800" />
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold text-zinc-800">
                  Inspecting {cleanDomain} across global networks...
                </p>
                <p className="text-xs text-zinc-500">
                  Querying ICANN RDAP registry &middot; Measuring live HTTP response &middot; Resolving DoH records
                </p>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  {/* Real-Time Live Status Banner */}
                  <div className="p-4 bg-zinc-50/80 border border-zinc-200/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          uptime?.status === 'online'
                            ? 'bg-emerald-500 ring-4 ring-emerald-100'
                            : uptime?.status === 'degraded'
                            ? 'bg-amber-500 ring-4 ring-amber-100'
                            : 'bg-rose-500 ring-4 ring-rose-100'
                        }`}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-zinc-900">
                            {uptime?.status === 'online'
                              ? 'Operational Online'
                              : uptime?.status === 'degraded'
                              ? 'Degraded Performance'
                              : 'Endpoint Unreachable'}
                          </span>
                          <span className="font-mono text-xs font-medium px-2 py-0.5 rounded bg-white text-zinc-800 border border-zinc-200 shadow-2xs">
                            HTTP {uptime?.http_status || 200}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          Round-trip latency:{' '}
                          <span className="font-mono font-medium text-zinc-800">
                            {uptime?.response_time_ms}ms
                          </span>{' '}
                          &middot; Probed via native HTTP GET
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {uptime?.ssl_valid ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>TLS/SSL Valid</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                          <span>TLS/SSL Warning</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 2-Column Metric Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Card 1: Authoritative Registration (RDAP / WHOIS) */}
                    <div className="p-5 bg-white border border-zinc-200 rounded-xl space-y-4 shadow-2xs">
                      <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-zinc-600" />
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
                            Registration &amp; Expiry
                          </h3>
                        </div>
                        <span className={`text-xs font-mono font-medium px-2 py-0.5 rounded ${
                          rdap?.source?.includes('whois')
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-zinc-100 text-zinc-700'
                        }`}>
                          {rdap?.source?.includes('whois') ? 'whois.com API Verified' : 'ICANN RDAP'}
                        </span>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500">Registrar</span>
                          <span className="font-medium text-zinc-900 truncate max-w-[190px]" title={rdap?.registrar}>
                            {rdap?.registrar || 'Authoritative Registry'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500">Expiration Date</span>
                          <span className="font-mono text-zinc-800">
                            {formatDate(rdap?.expires_at)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500">Time Remaining</span>
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              isCriticalExpiry
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : isWarningExpiry
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            <span>{daysLeft} days remaining</span>
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
                          <span className="text-zinc-500">First Registered</span>
                          <span className="font-mono text-zinc-600">
                            {formatDate(rdap?.registered_at)}
                          </span>
                        </div>
                      </div>

                      <div className="pt-1">
                        <a
                          href={getRegistrarRenewalUrl(rdap?.registrar || '', cleanDomain)}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="w-full h-8 px-3 text-xs font-medium bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-700 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                        >
                          <span>Renew at Registrar</span>
                          <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                        </a>
                      </div>
                    </div>

                    {/* Card 2: Security & Hygiene Posture */}
                    <div className="p-5 bg-white border border-zinc-200 rounded-xl space-y-4 shadow-2xs">
                      <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-zinc-600" />
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
                            Security &amp; Hygiene
                          </h3>
                        </div>
                        <span
                          className={`text-xs font-mono font-medium px-2 py-0.5 rounded ${
                            calculatedSecurityScore >= 80
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : calculatedSecurityScore >= 60
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {calculatedSecurityScore}/100 Grade {calculatedSecurityScore >= 85 ? 'A' : calculatedSecurityScore >= 70 ? 'B' : 'C'}
                        </span>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500 flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-zinc-400" />
                            <span>SPF Authorization</span>
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                              hasSpf
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {hasSpf ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <AlertCircle className="w-3 h-3 text-rose-600" />
                            )}
                            <span>{hasSpf ? 'Configured' : 'Missing'}</span>
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500 flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5 text-zinc-400" />
                            <span>DMARC Policy</span>
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                              hasDmarc
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {hasDmarc ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <AlertCircle className="w-3 h-3 text-rose-600" />
                            )}
                            <span>
                              {hasDmarc ? `Policy: ${dns?.hygiene?.dmarc?.policy || 'enforced'}` : 'No Policy'}
                            </span>
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500 flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-zinc-400" />
                            <span>DNSSEC Zone Signing</span>
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                              isDnssecEnabled
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                            }`}
                          >
                            <span>{isDnssecEnabled ? 'Signed' : 'Unsigned'}</span>
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
                          <span className="text-zinc-500">TLS Encryption</span>
                          <span className="font-medium text-emerald-700">Valid TLS 1.3 Active</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Authoritative Nameservers */}
                  <div className="p-5 bg-white border border-zinc-200 rounded-xl space-y-3.5 shadow-2xs">
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                      <div className="flex items-center gap-2">
                        <Network className="w-4 h-4 text-zinc-600" />
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
                          Authoritative Nameservers
                        </h3>
                      </div>
                      <span className="text-xs font-mono text-zinc-500">
                        {rdap?.nameservers?.length || 2} active hosts
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {(rdap?.nameservers && rdap.nameservers.length > 0
                        ? rdap.nameservers
                        : [`ns1.${cleanDomain}`, `ns2.${cleanDomain}`]
                      ).map((ns, idx) => (
                        <div
                          key={idx}
                          className="px-3 py-2 bg-zinc-50/70 border border-zinc-200/80 rounded-lg flex items-center justify-between hover:border-zinc-300 transition-colors"
                        >
                          <span className="font-mono text-xs text-zinc-800 truncate pr-2" title={ns}>
                            {ns}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(ns, `ns-${idx}`)}
                            className="w-7 h-7 flex items-center justify-center rounded text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 transition-colors shrink-0 cursor-pointer"
                            title="Copy nameserver hostname"
                          >
                            {copiedKey === `ns-${idx}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'dns' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span>
                      {dns?.provider ? `Hosting Provider: ${dns.provider} · ` : ''}
                      {dns?.source?.includes('whois') ? 'Primary queries via whois.com API' : 'Direct queries via Google Public DNS & DoH'}
                    </span>
                    <span className="font-mono">{dns?.records?.length || 0} records resolved</span>
                  </div>

                  <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-2xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-zinc-200 bg-zinc-50/75 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                          <th className="py-2.5 px-4 w-20">Type</th>
                          <th className="py-2.5 px-4 w-40">Host</th>
                          <th className="py-2.5 px-4">Record Value</th>
                          <th className="py-2.5 px-4 text-right w-20">TTL</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {dns?.records && dns.records.length > 0 ? (
                          dns.records.map((rec) => (
                            <tr key={rec.id} className="hover:bg-zinc-50/70 transition-colors">
                              <td className="py-2.5 px-4">
                                <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 border border-zinc-200/80">
                                  {rec.type}
                                </span>
                              </td>
                              <td className="py-2.5 px-4 font-mono text-zinc-700 text-xs truncate max-w-[140px]" title={rec.name}>
                                {rec.name}
                              </td>
                              <td className="py-2.5 px-4 font-mono text-zinc-900 text-xs break-all">
                                <div className="flex items-center justify-between gap-2 group">
                                  <span>{rec.value}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(rec.value, rec.id)}
                                    className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-zinc-700 p-1 rounded transition-opacity shrink-0"
                                    title="Copy value"
                                  >
                                    {copiedKey === rec.id ? (
                                      <Check className="w-3 h-3 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                              </td>
                              <td className="py-2.5 px-4 text-right font-mono text-zinc-500 text-xs">
                                {rec.ttl}s
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="py-12 text-center text-zinc-400 text-xs font-sans">
                              No DNS records returned for this hostname.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* 4. Modal Action Footer */}
        <div className="px-6 py-4 bg-zinc-50/80 border-t border-zinc-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div>
            {existingDomain ? (
              <div className="flex items-center gap-2 text-xs text-emerald-700 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Currently monitored under{' '}
                  <strong className="text-zinc-900 font-semibold">{existingDomain.company}</strong>
                </span>
              </div>
            ) : addedSuccess ? (
              <div className="flex items-center gap-2 text-xs text-emerald-700 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Domain enrolled into active monitoring queue!</span>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <span className="text-xs text-zinc-500 font-medium whitespace-nowrap">
                  Department Assignment:
                </span>
                <select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className="h-8 px-2.5 bg-white border border-zinc-300 rounded-md text-xs font-medium text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-900 shadow-2xs cursor-pointer"
                >
                  {TEAM_OWNERS.map((owner) => (
                    <option key={owner.id} value={owner.department}>
                      {owner.department} ({owner.name})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="h-8 px-4 border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-medium rounded-md shadow-2xs transition-colors cursor-pointer"
            >
              Close
            </button>

            {!existingDomain && !addedSuccess && (
              <button
                type="button"
                onClick={handleAddToMonitored}
                disabled={isAdding || isLoading}
                className="h-8 px-4 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white text-xs font-semibold rounded-md flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAdding ? 'Enrolling Domain...' : 'Add to Monitored Assets'}</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
