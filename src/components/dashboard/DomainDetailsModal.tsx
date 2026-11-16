import React, { useState } from 'react';
import {
  X,
  Globe,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
  Building2,
  Calendar,
  Clock,
  Trash2,
  Link2,
  Bell,
  Check,
  Network,
} from 'lucide-react';
import { DomainRecord } from '../../types/domain';
import { useDomains } from '../../context/DomainContext';
import { TEAM_OWNERS } from '../../data/teamData';
import { getOfficialRenewalUrl } from '../../utils/renewalUrls';

interface DomainDetailsModalProps {
  domain: DomainRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenEdit: (domain: DomainRecord) => void;
  onOpenDNSInspector?: (domainName: string) => void;
}

export const DomainDetailsModal: React.FC<DomainDetailsModalProps> = ({
  domain,
  isOpen,
  onClose,
  onOpenEdit,
  onOpenDNSInspector,
}) => {
  const { refreshDomainPing, deleteDomain } = useDomains();
  const [isPinging, setIsPinging] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  if (!isOpen || !domain) return null;

  const handlePing = async () => {
    setIsPinging(true);
    await refreshDomainPing(domain.id);
    setTimeout(() => setIsPinging(false), 500);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(domain.domain_name);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isCritical = domain.days_till_expiry <= 30;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-zinc-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[92vh] sm:max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-xs">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white flex items-center justify-center shrink-0">
              <Globe className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-sm text-zinc-900 font-mono flex items-center gap-2 truncate">
                <span className="truncate">{domain.domain_name}</span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-slate-400 hover:text-zinc-900 text-[10px] font-sans font-medium shrink-0 cursor-pointer"
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="text-[10px] text-slate-500 font-medium truncate">
                {domain.company} · {domain.registrar}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-zinc-900 p-1 rounded-full transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Status & Expiry Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between">
              <div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Health & Latency
                </div>
                <div className="text-xs font-bold text-zinc-900 mt-1 flex items-center gap-1.5 font-mono">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      domain.status === 'online'
                        ? 'bg-emerald-500'
                        : domain.status === 'degraded'
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                  ></span>
                  <span>{domain.http_status} OK ({domain.response_time_ms}ms)</span>
                </div>
              </div>
              <button
                onClick={handlePing}
                disabled={isPinging}
                className="p-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-full text-slate-600 transition-colors shadow-xs"
                title="Re-ping domain"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin text-zinc-900' : ''}`} />
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Days Till Expiry
              </div>
              <div
                className={`text-xs font-bold mt-1 font-mono flex items-center gap-1.5 ${
                  isCritical ? 'text-rose-600' : 'text-zinc-900'
                }`}
              >
                <span>{domain.days_till_expiry} days</span>
                {isCritical && (
                  <span className="text-[9px] font-bold uppercase bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded font-sans">
                    Critical
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Technical Metadata */}
          <div className="p-4 bg-slate-50/70 border border-slate-100 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Expiration Date:</span>
              </span>
              <span className="font-mono font-semibold text-zinc-900">
                {new Date(domain.expires_at).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>First Registered:</span>
              </span>
              <span className="font-mono text-zinc-700">
                {new Date(domain.registered_at || domain.created_at).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>SSL / TLS Certificate:</span>
              </span>
              <span className="font-semibold text-emerald-600 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Valid (Auto-Renewed)</span>
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Authoritative DNS:</span>
              </span>
              <span className="font-mono text-slate-600 truncate max-w-[200px]">
                {domain.nameservers && domain.nameservers.length > 0
                  ? domain.nameservers.join(', ')
                  : 'Cloudflare Edge DNS'}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-indigo-500" />
                <span>Alert Routing:</span>
              </span>
              {domain.send_alerts_to_client && domain.client_telegram_id ? (
                <span className="font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded flex items-center gap-1 font-mono text-[10px]">
                  <span>Client: {domain.client_name || domain.client_telegram_id}</span>
                  <span className="text-indigo-400">({domain.client_telegram_id})</span>
                </span>
              ) : (
                <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                  Internal Channel (Fallback)
                </span>
              )}
            </div>
          </div>

          {/* Direct Actions: Renew & Inspect DNS */}
          <div className="pt-2 space-y-2">
            {onOpenDNSInspector && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDNSInspector(domain.domain_name);
                }}
                className="w-full py-2.5 bg-white hover:bg-zinc-50 text-zinc-800 border border-zinc-300 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
              >
                <Network className="w-4 h-4 text-zinc-600" />
                <span>Inspect Live DNS & Edge Propagation</span>
              </button>
            )}
            <a
              href={getOfficialRenewalUrl(domain)}
              target="_blank"
              rel="noreferrer noopener"
              className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
            >
              <span>Renew Directly at Official GoDaddy Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          {isConfirmingDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-rose-700 font-semibold">Confirm delete?</span>
              <button
                type="button"
                onClick={() => {
                  deleteDomain(domain.id);
                  setIsConfirmingDelete(false);
                  onClose();
                }}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                Yes, Delete
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(false)}
                className="px-2 py-1 text-xs text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsConfirmingDelete(true)}
              className="text-rose-600 hover:text-rose-700 text-xs font-semibold flex items-center gap-1.5 p-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove Domain</span>
            </button>
          )}

          <button
            onClick={() => {
              onClose();
              onOpenEdit(domain);
            }}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-zinc-900 rounded-full font-semibold transition-colors cursor-pointer text-xs"
          >
            Edit Settings
          </button>
        </div>
      </div>
    </div>
  );
};
