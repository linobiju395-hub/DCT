import React, { useState } from 'react';
import {
  Clock,
  Play,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Server,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowRight,
  Activity,
  Terminal,
} from 'lucide-react';
import { useDomains } from '../../context/DomainContext';

interface JobExecutionLog {
  id: string;
  jobName: string;
  cronSchedule: string;
  status: 'success' | 'warning' | 'error';
  durationMs: number;
  assetsProcessed: number;
  summary: string;
  executedAt: string;
}

export const BackgroundJobsTab: React.FC = () => {
  const { domains, runDailyExpiryCron, refreshAllPings, batchWhoisRefresh } = useDomains();
  const [runningJob, setRunningJob] = useState<string | null>(null);
  const [lastActionMessage, setLastActionMessage] = useState<string | null>(null);

  const [jobLogs, setJobLogs] = useState<JobExecutionLog[]>([
    {
      id: 'job-run-1',
      jobName: 'Daily Expiry Sweep',
      cronSchedule: '0 8 * * * (Daily 08:00 UTC)',
      status: 'success',
      durationMs: 412,
      assetsProcessed: 7,
      summary: 'Evaluated 7 domains. Dispatched 2 client renewal email(s), sent 2 alerts to client Telegram chats, and 1 alert to internal channel.',
      executedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    },
    {
      id: 'job-run-2',
      jobName: 'High-Frequency Uptime Prober',
      cronSchedule: '*/5 * * * * (Every 5 mins)',
      status: 'warning',
      durationMs: 820,
      assetsProcessed: 7,
      summary: 'Cluster probe complete. 5 online (200), 1 degraded (429), 1 outage (503).',
      executedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    },
    {
      id: 'job-run-3',
      jobName: 'SSL Expiry & Certificate Watchdog',
      cronSchedule: '0 */12 * * * (Every 12h)',
      status: 'success',
      durationMs: 310,
      assetsProcessed: 7,
      summary: 'Validated TLS/SSL certificates and SAN wildcards. 6 valid, 1 untrusted.',
      executedAt: new Date(Date.now() - 7 * 3600 * 1000).toISOString(),
    },
    {
      id: 'job-run-4',
      jobName: 'DNSBL Threat Reputation Scanner',
      cronSchedule: '0 2 * * * (Daily 02:00 UTC)',
      status: 'success',
      durationMs: 1250,
      assetsProcessed: 7,
      summary: 'Checked 4 blacklist databases (Spamhaus, Barracuda, SpamCop, SORBS). 0 listed.',
      executedAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
    },
  ]);

  const triggerExpirySweep = async () => {
    setRunningJob('expiry');
    const start = performance.now();
    try {
      const res = await runDailyExpiryCron();
      const duration = Math.round(performance.now() - start);
      const newLog: JobExecutionLog = {
        id: `job-run-${Date.now()}`,
        jobName: 'Daily Expiry Sweep (Email Dispatcher)',
        cronSchedule: '0 8 * * * (Manual Trigger)',
        status: 'success',
        durationMs: duration,
        assetsProcessed: domains.length,
        summary: res.summary,
        executedAt: new Date().toISOString(),
      };
      setJobLogs((prev) => [newLog, ...prev]);
      setLastActionMessage(res.summary);
      setTimeout(() => setLastActionMessage(null), 5000);
    } finally {
      setRunningJob(null);
    }
  };

  const triggerUptimeProber = async () => {
    setRunningJob('uptime');
    const start = performance.now();
    try {
      await refreshAllPings();
      const duration = Math.round(performance.now() - start);
      const newLog: JobExecutionLog = {
        id: `job-run-${Date.now()}`,
        jobName: 'High-Frequency Uptime Prober',
        cronSchedule: '*/5 * * * * (Manual Trigger)',
        status: 'success',
        durationMs: duration,
        assetsProcessed: domains.length,
        summary: `Successfully pinged ${domains.length} production endpoints. Latency & HTTP codes refreshed.`,
        executedAt: new Date().toISOString(),
      };
      setJobLogs((prev) => [newLog, ...prev]);
      setLastActionMessage(`Uptime probe executed for all ${domains.length} domains.`);
      setTimeout(() => setLastActionMessage(null), 4000);
    } finally {
      setRunningJob(null);
    }
  };

  const triggerWhoisSync = async () => {
    setRunningJob('whois');
    const start = performance.now();
    try {
      const res = await batchWhoisRefresh();
      const duration = Math.round(performance.now() - start);
      const newLog: JobExecutionLog = {
        id: `job-run-${Date.now()}`,
        jobName: 'RDAP/WHOIS Registry Sync',
        cronSchedule: '0 0 * * 0 (Manual Trigger)',
        status: 'success',
        durationMs: duration,
        assetsProcessed: res.updatedCount,
        summary: `Synchronized expiration dates & nameservers for ${res.updatedCount} domains from official RDAP.`,
        executedAt: new Date().toISOString(),
      };
      setJobLogs((prev) => [newLog, ...prev]);
      setLastActionMessage(`RDAP WHOIS sync updated ${res.updatedCount} domains.`);
      setTimeout(() => setLastActionMessage(null), 4000);
    } finally {
      setRunningJob(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-zinc-200/90 rounded-xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-zinc-100 text-zinc-900 rounded-lg">
                <Clock className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-zinc-900">Background Jobs & Cron Engine</h2>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Automated scheduler orchestrating daily RDAP expiry sweeps, 5-minute health probes, and alert dispatchers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Scheduler Active (Node/Express Worker)
            </span>
          </div>
        </div>

        {lastActionMessage && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-medium text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{lastActionMessage}</span>
          </div>
        )}
      </div>

      {/* Active Cron Tasks Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* Task 1 */}
        <div className="bg-white border border-zinc-200/90 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Cron Routine 1</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-100 text-zinc-700">
                0 8 * * *
              </span>
            </div>
            <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-zinc-700" />
              <span>Daily Expiry Sweep</span>
            </h3>
            <p className="text-xs text-zinc-500 mt-1.5">
              Scans all monitored domains for expiration thresholds (&lt;30d, &lt;14d). Dispatches automated 30-day client reminder emails directly to domain owners, client Telegram alerts, and internal channel warnings.
            </p>
          </div>
          <div className="mt-5 pt-4 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-[11px] font-mono text-zinc-400">Next: 08:00 UTC</span>
            <button
              onClick={triggerExpirySweep}
              disabled={runningJob === 'expiry'}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-md text-xs font-semibold disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
            >
              <Play className="w-3 h-3 fill-white" />
              <span>{runningJob === 'expiry' ? 'Executing...' : 'Trigger Now'}</span>
            </button>
          </div>
        </div>

        {/* Task 2 */}
        <div className="bg-white border border-zinc-200/90 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Cron Routine 2</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-100 text-zinc-700">
                */5 * * * *
              </span>
            </div>
            <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-zinc-700" />
              <span>Cluster Uptime Prober</span>
            </h3>
            <p className="text-xs text-zinc-500 mt-1.5">
              Sends lightweight HEAD/GET HTTP probes to calculate latency, response codes, and detect downtime incidents in real-time.
            </p>
          </div>
          <div className="mt-5 pt-4 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-[11px] font-mono text-zinc-400">Interval: 5 min</span>
            <button
              onClick={triggerUptimeProber}
              disabled={runningJob === 'uptime'}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-md text-xs font-semibold disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${runningJob === 'uptime' ? 'animate-spin' : ''}`} />
              <span>{runningJob === 'uptime' ? 'Probing...' : 'Probe Cluster'}</span>
            </button>
          </div>
        </div>

        {/* Task 3 */}
        <div className="bg-white border border-zinc-200/90 rounded-xl p-5 shadow-xs flex flex-col justify-between md:col-span-2 xl:col-span-1">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Cron Routine 3</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-100 text-zinc-700">
                Weekly RDAP
              </span>
            </div>
            <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <Server className="w-4 h-4 text-zinc-700" />
              <span>WHOIS / RDAP Re-sync</span>
            </h3>
            <p className="text-xs text-zinc-500 mt-1.5">
              Refreshes authoritative registrar records, nameserver zone allocations, and true registry expiration timestamps from ICANN.
            </p>
          </div>
          <div className="mt-5 pt-4 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-[11px] font-mono text-zinc-400">Target: ICANN RDAP</span>
            <button
              onClick={triggerWhoisSync}
              disabled={runningJob === 'whois'}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-md text-xs font-semibold disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
            >
              <Play className="w-3 h-3 fill-white" />
              <span>{runningJob === 'whois' ? 'Syncing...' : 'Sync WHOIS'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Execution Telemetry Log Table */}
      <div className="bg-white border border-zinc-200/90 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-zinc-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-zinc-900">Cron Execution Telemetry & Audit Logs</h3>
            <p className="text-xs text-zinc-500">Historical run history with execution duration, assets affected, and job status</p>
          </div>
          <span className="text-xs font-mono text-zinc-500">{jobLogs.length} executions logged</span>
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left border-collapse min-w-[720px]">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/75">
                <th className="py-2.5 px-4 text-[11px] font-bold tracking-wider text-zinc-600 uppercase">Job Name</th>
                <th className="py-2.5 px-4 text-[11px] font-bold tracking-wider text-zinc-600 uppercase">Schedule</th>
                <th className="py-2.5 px-4 text-[11px] font-bold tracking-wider text-zinc-600 uppercase">Status</th>
                <th className="py-2.5 px-4 text-[11px] font-bold tracking-wider text-zinc-600 uppercase">Duration</th>
                <th className="py-2.5 px-4 text-[11px] font-bold tracking-wider text-zinc-600 uppercase">Execution Summary</th>
                <th className="py-2.5 px-4 text-[11px] font-bold tracking-wider text-zinc-600 uppercase text-right">Executed At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-xs">
              {jobLogs.map((log) => (
                <tr key={log.id} className="hover:bg-zinc-50/70 transition-colors">
                  <td className="py-3 px-4 font-semibold text-zinc-900 flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{log.jobName}</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-zinc-500 text-[11px]">
                    {log.cronSchedule}
                  </td>
                  <td className="py-3 px-4">
                    {log.status === 'success' ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Success
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 border border-amber-200 text-amber-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        Warning
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono text-zinc-600">
                    {log.durationMs}ms
                  </td>
                  <td className="py-3 px-4 text-zinc-700 max-w-lg">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-xs leading-tight">{log.summary}</span>
                      {(log.summary.toLowerCase().includes('client') || log.summary.toLowerCase().includes('email')) && (
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                          {log.summary.toLowerCase().includes('email') && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                              Client Email (30d)
                            </span>
                          )}
                          {log.summary.toLowerCase().includes('client') && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                              Client Chats
                            </span>
                          )}
                          {log.summary.toLowerCase().includes('internal') && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-zinc-200 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
                              Internal Channel
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-zinc-400 text-[11px]">
                    {new Date(log.executedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
