import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Globe,
  Server,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { useDomains } from '../../context/DomainContext';
import { checkDNSBLReputation } from '../../services/reputationService';
import { DNSBLCheckResult } from '../../types/domain';

export const ReputationTab: React.FC = () => {
  const { domains } = useDomains();
  const [target, setTarget] = useState<string>(domains[0]?.domain_name || 'payments-gateway.corp-checkout.io');
  const [customInput, setCustomInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<DNSBLCheckResult | null>(null);

  const runScan = async (queryTarget: string) => {
    setIsScanning(true);
    try {
      const res = await checkDNSBLReputation(queryTarget);
      setScanResult(res);
    } catch (err) {
      console.error('Scan error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    if (target) {
      runScan(target);
    }
  }, [target]);

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customInput.trim()) {
      setTarget(customInput.trim());
      runScan(customInput.trim());
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Description */}
      <div className="bg-white border border-zinc-200/90 rounded-xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-zinc-100 text-zinc-900 rounded-lg">
                <ShieldAlert className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-zinc-900">DNSBL & Threat Reputation Scanner</h2>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Real-time threat intelligence scan across global spam databases, IP blacklists, and blocklist operators.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => runScan(target)}
              disabled={isScanning}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-zinc-900 text-white rounded-lg text-xs font-semibold hover:bg-zinc-800 disabled:opacity-50 transition-colors shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Querying DNSBLs...' : 'Scan Reputation'}</span>
            </button>
          </div>
        </div>

        {/* Target Select & Search */}
        <div className="mt-5 pt-5 border-t border-zinc-100 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
              Select Monitored Asset
            </label>
            <select
              value={target}
              onChange={(e) => {
                setTarget(e.target.value);
                setCustomInput('');
              }}
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900"
            >
              {domains.map((d) => (
                <option key={d.id} value={d.domain_name}>
                  {d.domain_name} ({d.company})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
              Or Scan Any Custom Hostname / IP
            </label>
            <form onSubmit={handleCustomSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. mail.acme.com or 1.1.1.1"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                className="flex-1 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-mono text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
              <button
                type="submit"
                disabled={isScanning || !customInput.trim()}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                Inspect
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Metrics Card Summary */}
      {scanResult && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-zinc-200/90 rounded-xl p-4 shadow-xs">
            <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Reputation Status</div>
            <div className="mt-2 flex items-center gap-2">
              {scanResult.clean ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="text-base font-bold text-emerald-700">Clean & Neutral</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-rose-600" />
                  <span className="text-base font-bold text-rose-700">Blacklisted ({scanResult.listedCount})</span>
                </>
              )}
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">
              {scanResult.clean ? 'No listings found on active blacklists' : 'Flagged on email/IP blocklists'}
            </div>
          </div>

          <div className="bg-white border border-zinc-200/90 rounded-xl p-4 shadow-xs">
            <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Threat Risk Score</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-2xl font-bold font-mono ${scanResult.threatScore === 0 ? 'text-emerald-700' : scanResult.threatScore < 40 ? 'text-amber-700' : 'text-rose-700'}`}>
                {scanResult.threatScore}
              </span>
              <span className="text-xs text-zinc-400 font-mono">/ 100</span>
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">
              {scanResult.threatScore === 0 ? 'Optimal zero-risk score' : 'Potential delivery impact'}
            </div>
          </div>

          <div className="bg-white border border-zinc-200/90 rounded-xl p-4 shadow-xs">
            <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Target IP Address</div>
            <div className="mt-2 text-sm font-bold font-mono text-zinc-900">
              {scanResult.ip}
            </div>
            <div className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1">
              <Server className="w-3 h-3 text-zinc-400" />
              <span>Resolved from {scanResult.target}</span>
            </div>
          </div>

          <div className="bg-white border border-zinc-200/90 rounded-xl p-4 shadow-xs">
            <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Checked Databases</div>
            <div className="mt-2 text-base font-bold text-zinc-900 font-mono">
              {scanResult.totalChecked} Providers
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">
              Checked at {new Date(scanResult.checkedAt).toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}

      {/* Blacklist Inspection Table */}
      <div className="bg-white border border-zinc-200/90 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-zinc-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-zinc-900">Blacklist Operators Telemetry</h3>
            <p className="text-xs text-zinc-500">Live query status returned by authoritative DNSBL servers</p>
          </div>
          <span className="text-xs font-mono text-zinc-400">RFC 5782 Compliant</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/75">
                <th className="py-2.5 px-4 text-[11px] font-bold tracking-wider text-zinc-600 uppercase">Provider / Zone</th>
                <th className="py-2.5 px-4 text-[11px] font-bold tracking-wider text-zinc-600 uppercase">Operator Description</th>
                <th className="py-2.5 px-4 text-[11px] font-bold tracking-wider text-zinc-600 uppercase">DNS Query Zone</th>
                <th className="py-2.5 px-4 text-[11px] font-bold tracking-wider text-zinc-600 uppercase">Reputation Status</th>
                <th className="py-2.5 px-4 text-[11px] font-bold tracking-wider text-zinc-600 uppercase text-right">Direct Lookup</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-xs">
              {scanResult?.blacklists.map((bl) => (
                <tr key={bl.name} className="hover:bg-zinc-50/70 transition-colors">
                  <td className="py-3 px-4 font-semibold text-zinc-900 flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span>{bl.name}</span>
                  </td>
                  <td className="py-3 px-4 text-zinc-500">
                    {bl.description}
                  </td>
                  <td className="py-3 px-4 font-mono text-zinc-600">
                    {bl.host}
                  </td>
                  <td className="py-3 px-4">
                    {bl.listed ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 border border-rose-200 text-rose-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                        Listed ({bl.response})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Clean (Not Listed)
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <a
                      href={`https://mxtoolbox.com/SuperTool.aspx?action=blacklist%3a${encodeURIComponent(scanResult.ip)}&run=toolpage`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-zinc-600 hover:text-zinc-900 font-medium"
                    >
                      <span>Delist Guide</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Guidance */}
        <div className="p-4 bg-zinc-50/80 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-zinc-400" />
            <span>Clean reputation guarantees maximum transactional email delivery & SPF/DKIM trust.</span>
          </div>
          <span className="font-mono text-[11px]">TTL Cache: 300s</span>
        </div>
      </div>
    </div>
  );
};
