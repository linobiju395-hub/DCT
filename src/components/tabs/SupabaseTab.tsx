import React, { useState, useEffect } from 'react';
import {
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Download,
  Check,
  RefreshCw,
  RotateCcw,
} from 'lucide-react';
import { useDomains } from '../../context/DomainContext';

export const SupabaseTab: React.FC = () => {
  const {
    exportCSV,
    domains,
    dbServiceUrl,
    dbApiKey,
    dbSyncFrequency,
    dbConfigSource,
    serverEnvDb,
    saveDbConnection,
    saveSyncFrequency,
    resetDbToEnv,
    saveSupabaseConnection,
    testSupabaseConnection,
  } = useDomains();

  // Connection credentials state (synced with global persistent context)
  const [serviceUrl, setServiceUrl] = useState(dbServiceUrl);
  const [apiKey, setApiKey] = useState(dbApiKey);
  const [showKey, setShowKey] = useState(false);
  const [syncFrequency, setSyncFrequency] = useState(dbSyncFrequency);

  // Sync inputs if context updates (e.g., loaded asynchronously from server environment variables)
  useEffect(() => {
    setServiceUrl(dbServiceUrl);
  }, [dbServiceUrl]);

  useEffect(() => {
    setApiKey(dbApiKey);
  }, [dbApiKey]);

  useEffect(() => {
    setSyncFrequency(dbSyncFrequency);
  }, [dbSyncFrequency]);

  // Feedback states
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    latency?: number;
  } | null>(null);

  const handleSaveConnection = async () => {
    setIsSaving(true);
    saveDbConnection(serviceUrl, apiKey, syncFrequency);
    await saveSupabaseConnection(serviceUrl, apiKey, true);

    setIsSaving(false);
    setSaveSuccess('Database connection parameters successfully saved to persistent storage. Auto-reconnect enabled.');
    setTimeout(() => setSaveSuccess(null), 3500);
  };

  const handleFrequencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFreq = e.target.value;
    setSyncFrequency(newFreq);
    saveSyncFrequency(newFreq);
  };

  const handleTestSync = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await testSupabaseConnection(serviceUrl, apiKey);
      setTestResult({
        success: res.success,
        message: res.message || 'Database sync operational.',
        latency: res.latency,
      });
    } catch {
      setTestResult({
        success: false,
        message: 'Could not establish connection to the specified service endpoint.',
      });
    } finally {
      setIsTesting(false);
      setTimeout(() => setTestResult(null), 5000);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl font-sans">
      {/* 1. Connection Setup Card */}
      <div className="bg-white border border-zinc-200/90 rounded-xl p-5 sm:p-6 shadow-xs">
        {/* Card Header with Status Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-zinc-100 gap-3">
          <div>
            <h2 className="text-base font-bold text-zinc-900 tracking-tight">
              Enterprise Database Sync
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Secure remote replication for assets, uptime health telemetry, and incident audit trails.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {dbConfigSource === 'environment' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Configured via Environment</span>
              </span>
            ) : Boolean(serviceUrl.trim()) ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Connected &bull; Cloud US-East</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
                <span>Disconnected</span>
              </span>
            )}

            {dbConfigSource === 'local' && serverEnvDb.isConfigured && (
              <button
                type="button"
                onClick={resetDbToEnv}
                title="Revert to environment variable configuration"
                className="inline-flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-800 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded px-2 py-0.5 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset to Env</span>
              </button>
            )}
          </div>
        </div>

        {/* Feedback Alerts */}
        {saveSuccess && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveSuccess}</span>
          </div>
        )}

        {testResult && (
          <div
            className={`mt-4 p-3 rounded-lg text-xs flex items-center gap-2 border ${
              testResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>
              {testResult.message}
              {testResult.latency !== undefined && (
                <span className="text-zinc-500 font-normal ml-1">
                  (Latency: {testResult.latency}ms)
                </span>
              )}
            </span>
          </div>
        )}

        {/* Input Fields */}
        <div className="space-y-4 pt-5">
          {/* Field 1: Project Service URL */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-zinc-700">
                Project Service URL
              </label>
              {dbConfigSource === 'environment' && (
                <span className="text-[10px] text-emerald-600 font-medium">
                  Auto-populated from NEXT_PUBLIC_DB_URL
                </span>
              )}
            </div>
            <input
              type="text"
              value={serviceUrl}
              onChange={(e) => setServiceUrl(e.target.value)}
              placeholder="https://corp-internal-storage.net"
              className="w-full bg-white border border-zinc-200 hover:border-zinc-300 focus:border-zinc-900 rounded-md px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 transition-colors"
            />
            <p className="text-[11px] text-zinc-400 mt-1">
              Internal cluster gateway or dedicated API storage endpoint.
            </p>
          </div>

          {/* Field 2: Service API Key */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-zinc-700">
                Service API Key
              </label>
              {dbConfigSource === 'environment' && (
                <span className="text-[10px] text-emerald-600 font-medium">
                  Auto-populated from DB_SERVICE_KEY
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="••••••••••••••••••••••••••••••"
                className="w-full bg-white border border-zinc-200 hover:border-zinc-300 focus:border-zinc-900 rounded-md px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 transition-colors pr-10"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-0.5 rounded transition-colors cursor-pointer"
                title={showKey ? 'Hide key' : 'Show key'}
              >
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              Bearer authentication key granting read and write capabilities to the asset repository.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-2.5">
            <button
              onClick={handleSaveConnection}
              disabled={isSaving}
              className="h-8 px-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-md text-xs font-medium shadow-xs transition-colors inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              <span>{isSaving ? 'Saving...' : 'Save Connection'}</span>
            </button>

            <button
              onClick={handleTestSync}
              disabled={isTesting}
              className="h-8 px-4 bg-white hover:bg-zinc-50 border border-zinc-200 hover:border-zinc-300 text-zinc-700 hover:text-zinc-900 rounded-md text-xs font-medium shadow-xs transition-colors inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {isTesting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-400" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5 text-zinc-400" />
              )}
              <span>{isTesting ? 'Verifying...' : 'Test Database Sync'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Data Maintenance & Backups */}
      <div className="bg-white border border-zinc-200/90 rounded-xl p-5 sm:p-6 shadow-xs">
        <div className="pb-4 border-b border-zinc-100">
          <h3 className="text-sm font-bold text-zinc-900 tracking-tight">
            Data Maintenance & Backups
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Schedule automated database snapshots and generate portable compliance exports.
          </p>
        </div>

        <div className="space-y-4 pt-4">
          {/* Auto-Sync Frequency Dropdown */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-zinc-50/70 border border-zinc-200/80 rounded-lg">
            <div>
              <div className="text-xs font-medium text-zinc-900">
                Auto-Sync Frequency
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Interval at which local asset changes are synchronized with the central cloud cluster.
              </p>
            </div>

            <div className="sm:w-56 shrink-0">
              <select
                value={syncFrequency}
                onChange={handleFrequencyChange}
                className="w-full bg-white border border-zinc-200 hover:border-zinc-300 focus:border-zinc-900 rounded-md px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 transition-colors shadow-2xs cursor-pointer font-medium"
              >
                <option value="Hourly">Hourly</option>
                <option value="Every 6 Hours">Every 6 Hours</option>
                <option value="Daily at 08:00 UTC">Daily at 08:00 UTC</option>
              </select>
            </div>
          </div>

          {/* Export Records Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-zinc-50/70 border border-zinc-200/80 rounded-lg">
            <div>
              <div className="text-xs font-medium text-zinc-900">
                Offline Backup Export
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Generate an immediate full tabular dump of all monitored domains and health telemetry.
              </p>
            </div>

            <button
              onClick={exportCSV}
              className="h-8 px-4 bg-white hover:bg-zinc-50 hover:border-zinc-300 text-zinc-700 hover:text-zinc-900 border border-zinc-200 rounded-md text-xs font-medium shadow-xs transition-colors inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
              title="Download current domain registry as CSV"
            >
              <Download className="w-3.5 h-3.5 text-zinc-400" />
              <span>Download Backup (.CSV)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
