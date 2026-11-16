import React, { useState, useMemo } from 'react';
import {
  Activity,
  Search,
  Clock,
  ShieldAlert,
  Send,
  PlusCircle,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Info,
  Calendar,
} from 'lucide-react';
import { useDomains } from '../../context/DomainContext';
import { ActivityLogItem, ActivityLogType } from '../../types/domain';

export const ActivityLogsTab: React.FC = () => {
  const { activityLogs } = useDomains();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<ActivityLogType | 'all'>('all');

  const filteredLogs = useMemo(() => {
    return activityLogs.filter((log) => {
      const matchesSearch =
        log.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.metadata?.domain && log.metadata.domain.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;
      if (filterType !== 'all' && log.type !== filterType) return false;
      return true;
    });
  }, [activityLogs, searchTerm, filterType]);

  const getLogIcon = (type: ActivityLogType, status: ActivityLogItem['status']) => {
    switch (type) {
      case 'downtime':
        return <ShieldAlert className="w-4 h-4 text-rose-500" />;
      case 'telegram_alert':
        return <Send className="w-4 h-4 text-amber-500" />;
      case 'cron_run':
        return <Clock className="w-4 h-4 text-indigo-500" />;
      case 'ping_batch':
        return <RefreshCw className="w-4 h-4 text-emerald-500" />;
      case 'domain_added':
        return <PlusCircle className="w-4 h-4 text-indigo-500" />;
      default:
        return <Info className="w-4 h-4 text-zinc-400" />;
    }
  };

  const getStatusBadge = (status: ActivityLogItem['status']) => {
    switch (status) {
      case 'error':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 uppercase">
            Outage / Error
          </span>
        );
      case 'warning':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 uppercase">
            Threshold / Alert
          </span>
        );
      case 'success':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 uppercase">
            Nominal / Success
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 uppercase">
            Info
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Toolbar */}
      <div className="bg-white dark:bg-[#10121a] border border-zinc-200/90 dark:border-zinc-800/80 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search activity audit logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
              filterType === 'all'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            All Logs ({activityLogs.length})
          </button>
          <button
            onClick={() => setFilterType('downtime')}
            className={`px-3 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
              filterType === 'downtime'
                ? 'bg-white dark:bg-zinc-800 text-rose-600 dark:text-rose-400 shadow-xs'
                : 'text-zinc-500 hover:text-rose-600'
            }`}
          >
            Downtime
          </button>
          <button
            onClick={() => setFilterType('telegram_alert')}
            className={`px-3 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
              filterType === 'telegram_alert'
                ? 'bg-white dark:bg-zinc-800 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-zinc-500 hover:text-amber-600'
            }`}
          >
            Channel Alerts
          </button>
          <button
            onClick={() => setFilterType('cron_run')}
            className={`px-3 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
              filterType === 'cron_run'
                ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-zinc-500 hover:text-indigo-600'
            }`}
          >
            Cron Runs
          </button>
          <button
            onClick={() => setFilterType('ping_batch')}
            className={`px-3 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
              filterType === 'ping_batch'
                ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-zinc-500 hover:text-emerald-600'
            }`}
          >
            Sweeps
          </button>
        </div>
      </div>

      {/* Activity Logs Stream */}
      <div className="bg-white dark:bg-[#10121a] border border-zinc-200/90 dark:border-zinc-800/80 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-500" />
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Audit Trail & Operational Event Log
            </h2>
          </div>
          <span className="text-[11px] text-zinc-500 font-mono">
            {filteredLogs.length} events logged
          </span>
        </div>

        <div className="divide-y divide-zinc-200/80 dark:divide-zinc-800/60">
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 text-xs">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="font-medium text-zinc-700 dark:text-zinc-300">No activity events found</p>
              <p className="mt-1">Try clearing filters or trigger a cron check in Actions & Automation.</p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40 transition-colors flex items-start gap-3.5 text-xs"
              >
                <div className="mt-0.5 p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 shrink-0">
                  {getLogIcon(log.type, log.status)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {log.title}
                      </span>
                      {getStatusBadge(log.status)}
                    </div>
                    <span className="text-[11px] text-zinc-500 font-mono tabular-nums shrink-0">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-zinc-600 dark:text-zinc-400 text-xs leading-relaxed">
                    {log.description}
                  </p>

                  {/* Metadata Chips if present */}
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-zinc-500 font-mono">
                      {log.metadata.domain && (
                        <span className="bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded text-zinc-700 dark:text-zinc-300">
                          Domain: {log.metadata.domain}
                        </span>
                      )}
                      {log.metadata.company && (
                        <span className="bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded text-zinc-700 dark:text-zinc-300">
                          Team: {log.metadata.company}
                        </span>
                      )}
                      {log.metadata.http_status && (
                        <span className="bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded text-zinc-700 dark:text-zinc-300">
                          HTTP: {log.metadata.http_status}
                        </span>
                      )}
                      {log.metadata.client_alerts_count !== undefined && (
                        <span className="bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded font-semibold">
                          Client Alerts: {log.metadata.client_alerts_count}
                        </span>
                      )}
                      {log.metadata.internal_alerts_count !== undefined && (
                        <span className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded font-semibold">
                          Internal Alerts: {log.metadata.internal_alerts_count}
                        </span>
                      )}
                      {log.metadata.affected_count !== undefined && (
                        <span className="bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded text-zinc-700 dark:text-zinc-300">
                          Count: {log.metadata.affected_count}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
