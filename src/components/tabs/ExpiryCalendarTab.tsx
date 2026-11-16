import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  X,
  AlertTriangle,
  Clock,
  Calendar,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useDomains } from '../../context/DomainContext';
import { DomainRecord } from '../../types/domain';
import { getOfficialRenewalUrl } from '../../utils/renewalUrls';

interface ExpiryCalendarTabProps {
  onClose?: () => void;
  onOpenDomainDetails?: (domain: DomainRecord) => void;
  onOpenEditDomain?: (domain: DomainRecord) => void;
}

export const ExpiryCalendarTab: React.FC<ExpiryCalendarTabProps> = ({
  onClose,
  onOpenDomainDetails,
}) => {
  const { domains } = useDomains();

  // Expanded sections state for long categories
  const [expandedUpcoming, setExpandedUpcoming] = useState(false);
  const [expandedLongTerm, setExpandedLongTerm] = useState(false);

  // Group domains into the 5 explicit tiers chronologically
  const tiers = useMemo(() => {
    // 1. Expired (days_till_expiry < 0)
    const expired = domains
      .filter((d) => d.days_till_expiry < 0)
      .sort((a, b) => a.days_till_expiry - b.days_till_expiry);

    // 2. Critical (0 <= days_till_expiry <= 7)
    const critical = domains
      .filter((d) => d.days_till_expiry >= 0 && d.days_till_expiry <= 7)
      .sort((a, b) => a.days_till_expiry - b.days_till_expiry);

    // 3. Act Soon (8 <= days_till_expiry <= 30)
    const actSoon = domains
      .filter((d) => d.days_till_expiry >= 8 && d.days_till_expiry <= 30)
      .sort((a, b) => a.days_till_expiry - b.days_till_expiry);

    // 4. Upcoming (31 <= days_till_expiry <= 90)
    const upcoming = domains
      .filter((d) => d.days_till_expiry >= 31 && d.days_till_expiry <= 90)
      .sort((a, b) => a.days_till_expiry - b.days_till_expiry);

    // 5. Secured Long-Term (days_till_expiry > 90)
    const longTerm = domains
      .filter((d) => d.days_till_expiry > 90)
      .sort((a, b) => a.days_till_expiry - b.days_till_expiry);

    return {
      expired,
      critical,
      actSoon,
      upcoming,
      longTerm,
    };
  }, [domains]);

  const formatDate = (isoString?: string) => {
    if (!isoString) return '2026-11-01';
    return isoString.split('T')[0];
  };

  return (
    <div className="bg-white text-zinc-800 rounded-2xl border border-zinc-200 p-5 sm:p-7 shadow-sm flex flex-col gap-6 animate-in fade-in duration-150">
      {/* 1. Header Area */}
      <div className="flex items-start justify-between pb-5 border-b border-zinc-100">
        <div className="flex items-center gap-3.5">
          {/* Light Neutral Icon Badge */}
          <div className="bg-zinc-100 text-zinc-700 p-2.5 rounded-lg border border-zinc-200 flex items-center justify-center shrink-0">
            <CalendarIcon className="w-5 h-5 text-zinc-700" />
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-zinc-900 font-semibold text-lg tracking-tight">
                Expiry Calendar &amp; Timeline
              </h1>
              <span className="bg-zinc-100 text-zinc-600 border border-zinc-200 text-xs font-mono px-2 py-0.5 rounded-full">
                {domains.length} Tracked
              </span>
            </div>
            <p className="text-zinc-500 text-xs mt-1">
              Chronological expiration runway mapped across registry renewal windows
            </p>
          </div>
        </div>

        {/* Close Icon Button (X) */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-md p-1.5 transition-colors cursor-pointer"
            aria-label="Close Calendar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 2. Tiered Expiration Categories */}
      <div className="space-y-6">
        {/* TIER 1: EXPIRED DOMAINS (Overdue) */}
        {tiers.expired.length > 0 && (
          <section className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <div className="text-rose-700 font-semibold text-xs tracking-wide uppercase flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>EXPIRED DOMAINS</span>
              </div>
              <span className="text-zinc-400 text-xs font-normal">
                {tiers.expired.length} {tiers.expired.length === 1 ? 'domain' : 'domains'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tiers.expired.map((domain) => (
                <div
                  key={domain.id}
                  onClick={() => onOpenDomainDetails?.(domain)}
                  className="bg-white border border-rose-200 bg-rose-50/20 rounded-lg p-3.5 shadow-xs transition-colors hover:shadow-sm flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-zinc-900 tracking-tight font-mono truncate">
                      {domain.domain_name}
                    </h3>
                    <div className="text-xs font-mono mt-1 flex items-center">
                      <span className="text-xs text-zinc-400 font-normal">{formatDate(domain.expires_at)}</span>
                      <span className="text-zinc-300 mx-1.5">&bull;</span>
                      <span className="text-rose-700 font-semibold text-xs">Expired</span>
                    </div>
                  </div>

                  <a
                    href={getOfficialRenewalUrl(domain)}
                    target="_blank"
                    rel="noreferrer noopener"
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-semibold px-3 py-1.5 border border-zinc-200 rounded-md shadow-xs transition-colors inline-flex items-center gap-1.5 shrink-0"
                  >
                    <span>Renew</span>
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                  </a>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TIER 2: CRITICAL EXPIRATIONS (≤ 7 DAYS) */}
        {tiers.critical.length > 0 && (
          <section className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <div className="text-rose-700 font-semibold text-xs tracking-wide uppercase flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-rose-600" />
                <span>CRITICAL EXPIRATIONS (&le; 7 DAYS)</span>
              </div>
              <span className="text-zinc-400 text-xs font-normal">
                {tiers.critical.length} {tiers.critical.length === 1 ? 'domain' : 'domains'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tiers.critical.map((domain) => (
                <div
                  key={domain.id}
                  onClick={() => onOpenDomainDetails?.(domain)}
                  className="bg-white border border-rose-200 bg-rose-50/20 rounded-lg p-3.5 shadow-xs transition-colors hover:shadow-sm flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-zinc-900 tracking-tight font-mono truncate">
                      {domain.domain_name}
                    </h3>
                    <div className="text-xs font-mono mt-1 flex items-center">
                      <span className="text-xs text-zinc-400 font-normal">{formatDate(domain.expires_at)}</span>
                      <span className="text-zinc-300 mx-1.5">&bull;</span>
                      <span className="text-rose-700 font-semibold text-xs">{domain.days_till_expiry}d remaining</span>
                    </div>
                  </div>

                  <a
                    href={getOfficialRenewalUrl(domain)}
                    target="_blank"
                    rel="noreferrer noopener"
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-semibold px-3 py-1.5 border border-zinc-200 rounded-md shadow-xs transition-colors inline-flex items-center gap-1.5 shrink-0"
                  >
                    <span>Renew</span>
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                  </a>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TIER 3: ACT SOON (8 - 30 DAYS) */}
        {tiers.actSoon.length > 0 && (
          <section className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <div className="text-amber-800 font-semibold text-xs tracking-wide uppercase flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>ACT SOON (8 - 30 DAYS)</span>
              </div>
              <span className="text-zinc-400 text-xs font-normal">
                {tiers.actSoon.length} {tiers.actSoon.length === 1 ? 'domain' : 'domains'}
              </span>
            </div>

            {/* 2-Column Responsive Grid matching reference */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tiers.actSoon.map((domain) => (
                <div
                  key={domain.id}
                  onClick={() => onOpenDomainDetails?.(domain)}
                  className="bg-white border border-amber-200 bg-amber-50/20 rounded-lg p-3.5 shadow-xs transition-colors hover:shadow-sm flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-zinc-900 tracking-tight font-mono truncate">
                      {domain.domain_name}
                    </h3>
                    <div className="text-xs font-mono mt-1 flex items-center">
                      <span className="text-xs text-zinc-400 font-normal">{formatDate(domain.expires_at)}</span>
                      <span className="text-zinc-300 mx-1.5">&bull;</span>
                      <span className="text-amber-800 font-semibold text-xs">{domain.days_till_expiry}d remaining</span>
                    </div>
                  </div>

                  <a
                    href={getOfficialRenewalUrl(domain)}
                    target="_blank"
                    rel="noreferrer noopener"
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-semibold px-3 py-1.5 border border-zinc-200 rounded-md shadow-xs transition-colors inline-flex items-center gap-1.5 shrink-0"
                  >
                    <span>Renew</span>
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                  </a>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TIER 4: UPCOMING (31 - 90 DAYS) */}
        {tiers.upcoming.length > 0 && (
          <section className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <div className="text-zinc-700 font-semibold text-xs tracking-wide uppercase flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-zinc-500" />
                <span>UPCOMING (31 - 90 DAYS)</span>
              </div>
              <span className="text-zinc-400 text-xs font-normal">
                {tiers.upcoming.length} {tiers.upcoming.length === 1 ? 'domain' : 'domains'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(expandedUpcoming ? tiers.upcoming : tiers.upcoming.slice(0, 6)).map((domain) => (
                <div
                  key={domain.id}
                  onClick={() => onOpenDomainDetails?.(domain)}
                  className="bg-white border border-zinc-200 bg-zinc-50/40 rounded-lg p-3.5 shadow-xs transition-colors hover:shadow-sm flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-zinc-900 tracking-tight font-mono truncate">
                      {domain.domain_name}
                    </h3>
                    <div className="text-xs font-mono mt-1 flex items-center">
                      <span className="text-xs text-zinc-400 font-normal">{formatDate(domain.expires_at)}</span>
                      <span className="text-zinc-300 mx-1.5">&bull;</span>
                      <span className="text-zinc-600 font-semibold text-xs">{domain.days_till_expiry}d remaining</span>
                    </div>
                  </div>

                  <a
                    href={getOfficialRenewalUrl(domain)}
                    target="_blank"
                    rel="noreferrer noopener"
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-semibold px-3 py-1.5 border border-zinc-200 rounded-md shadow-xs transition-colors inline-flex items-center gap-1.5 shrink-0"
                  >
                    <span>Renew</span>
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                  </a>
                </div>
              ))}
            </div>

            {tiers.upcoming.length > 6 && (
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setExpandedUpcoming(!expandedUpcoming)}
                  className="px-3 py-1.5 text-xs text-zinc-600 hover:text-zinc-900 font-medium inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>{expandedUpcoming ? 'Show less' : `Show all ${tiers.upcoming.length} upcoming domains`}</span>
                  {expandedUpcoming ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </section>
        )}

        {/* TIER 5: SECURED LONG-TERM (90+ DAYS) */}
        {tiers.longTerm.length > 0 && (
          <section className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <div className="text-emerald-700 font-semibold text-xs tracking-wide uppercase flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>SECURED LONG-TERM (90+ DAYS)</span>
              </div>
              <span className="text-zinc-400 text-xs font-normal">
                {tiers.longTerm.length} {tiers.longTerm.length === 1 ? 'domain' : 'domains'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(expandedLongTerm ? tiers.longTerm : tiers.longTerm.slice(0, 8)).map((domain) => (
                <div
                  key={domain.id}
                  onClick={() => onOpenDomainDetails?.(domain)}
                  className="bg-white border border-emerald-200 bg-emerald-50/20 rounded-lg p-3.5 shadow-xs transition-colors hover:shadow-sm flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-zinc-900 tracking-tight font-mono truncate">
                      {domain.domain_name}
                    </h3>
                    <div className="text-xs font-mono mt-1 flex items-center">
                      <span className="text-xs text-zinc-400 font-normal">{formatDate(domain.expires_at)}</span>
                      <span className="text-zinc-300 mx-1.5">&bull;</span>
                      <span className="text-emerald-700 font-semibold text-xs">{domain.days_till_expiry}d remaining</span>
                    </div>
                  </div>

                  <a
                    href={getOfficialRenewalUrl(domain)}
                    target="_blank"
                    rel="noreferrer noopener"
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-semibold px-3 py-1.5 border border-zinc-200 rounded-md shadow-xs transition-colors inline-flex items-center gap-1.5 shrink-0"
                  >
                    <span>Renew</span>
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                  </a>
                </div>
              ))}
            </div>

            {tiers.longTerm.length > 8 && (
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setExpandedLongTerm(!expandedLongTerm)}
                  className="px-3 py-1.5 text-xs text-zinc-600 hover:text-zinc-900 font-medium inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>{expandedLongTerm ? 'Show less' : `Show all ${tiers.longTerm.length} secured domains`}</span>
                  {expandedLongTerm ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </section>
        )}
      </div>

      {/* 3. Footer Area */}
      <div className="pt-4 border-t border-zinc-100 flex items-center justify-end">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer shadow-xs active:scale-95"
        >
          Close Calendar
        </button>
      </div>
    </div>
  );
};
