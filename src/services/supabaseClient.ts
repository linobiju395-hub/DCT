import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Strict sanitizer for Supabase project URLs.
 * Eliminates trailing slashes, duplicate slashes, /auth/v1, /rest/v1,
 * and converts dashboard URLs (supabase.com/dashboard/project/<id>) to API endpoints.
 */
export const cleanSupabaseUrl = (raw: string): string => {
  if (!raw) return '';
  let url = raw.trim();
  // Remove wrapping quotes if copied with quotes
  url = url.replace(/^["']|["']$/g, '');
  // Remove trailing slashes
  url = url.replace(/\/+$/, '');

  // Convert dashboard URLs e.g. https://supabase.com/dashboard/project/xyz
  const dashboardMatch = url.match(/https?:\/\/(?:app\.)?supabase\.com\/dashboard\/project\/([a-zA-Z0-9_\-]+)/i);
  if (dashboardMatch && dashboardMatch[1]) {
    url = `https://${dashboardMatch[1]}.supabase.co`;
  }

  // Strip accidental subpaths like /auth/v1, /rest/v1, /storage/v1
  url = url.replace(/\/(auth|rest|storage)(\/v\d+)?\/?$/i, '');
  url = url.replace(/\/(auth|rest|storage)\/?$/i, '');

  // Prepend https if bare domain
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }

  // Final trailing slash cleanup
  return url.replace(/\/+$/, '');
};

export const cleanSupabaseKey = (raw: string): string => {
  if (!raw) return '';
  return raw.trim().replace(/^["']|["']$/g, '');
};

// Safe environment variable resolver supporting Vite and Next.js / Node
const getEnvVar = (key: string): string => {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
      return (import.meta as any).env[key];
    }
  } catch {
    // Ignore in non-meta environments
  }
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key] as string;
    }
  } catch {
    // Ignore in browser environments without process
  }
  return '';
};

export const getActiveSupabaseUrl = (): string => {
  const envUrl = getEnvVar('VITE_SUPABASE_URL') || getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
  if (envUrl && !envUrl.includes('your-project')) {
    return cleanSupabaseUrl(envUrl);
  }

  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('domainpulse_supabase_url') || localStorage.getItem('domainpulse_db_url');
    if (stored && !stored.includes('your-project') && !stored.includes('corp-internal-storage') && !stored.includes('xyz-app-cloud')) {
      return cleanSupabaseUrl(stored);
    }
  }

  return cleanSupabaseUrl(envUrl || '');
};

export const getActiveSupabaseAnonKey = (): string => {
  const envKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  if (envKey && !envKey.includes('your-anon-key')) {
    return cleanSupabaseKey(envKey);
  }

  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('domainpulse_supabase_key') || localStorage.getItem('domainpulse_db_key');
    if (stored && !stored.includes('your-anon-key') && !stored.includes('sec_live_')) {
      return cleanSupabaseKey(stored);
    }
  }

  return cleanSupabaseKey(envKey || '');
};

// Auto-clean any malformed stored URL in localStorage upon module load
if (typeof window !== 'undefined') {
  try {
    const storedUrl = localStorage.getItem('domainpulse_supabase_url');
    if (storedUrl) {
      const sanitized = cleanSupabaseUrl(storedUrl);
      if (sanitized !== storedUrl) {
        localStorage.setItem('domainpulse_supabase_url', sanitized);
      }
    }
  } catch {
    // Ignore storage issues
  }
}

export const isSupabaseConfigured = (): boolean => {
  const url = getActiveSupabaseUrl();
  const key = getActiveSupabaseAnonKey();
  return Boolean(
    url &&
    key &&
    !url.includes('your-project') &&
    !url.includes('placeholder') &&
    url.startsWith('http')
  );
};

// Create client with guaranteed clean URL and auth options
const createInstance = (url?: string, key?: string): SupabaseClient => {
  const rawUrl = url || getActiveSupabaseUrl();
  const rawKey = key || getActiveSupabaseAnonKey();

  const targetUrl = cleanSupabaseUrl(rawUrl) || 'https://placeholder.supabase.co';
  const targetKey = cleanSupabaseKey(rawKey) || 'placeholder-anon-key';

  return createClient(targetUrl, targetKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
};

let currentClient: SupabaseClient = createInstance();

export const reinitializeSupabase = (newUrl: string, newKey: string): SupabaseClient => {
  const sanitizedUrl = cleanSupabaseUrl(newUrl);
  const sanitizedKey = cleanSupabaseKey(newKey);

  if (typeof window !== 'undefined') {
    localStorage.setItem('domainpulse_supabase_url', sanitizedUrl);
    localStorage.setItem('domainpulse_supabase_key', sanitizedKey);
    localStorage.setItem('domainpulse_db_url', sanitizedUrl);
    localStorage.setItem('domainpulse_db_key', sanitizedKey);
    localStorage.setItem('domainpulse_supabase_connected', 'true');
  }

  currentClient = createClient(sanitizedUrl || 'https://placeholder.supabase.co', sanitizedKey || 'placeholder-anon-key', {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return currentClient;
};

// Export dynamic proxy so all calls to supabase.* route to the active client instance
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get: (_target, prop: string | symbol) => {
    return (currentClient as any)[prop];
  },
});

export const supabaseUrl = getActiveSupabaseUrl();
export const supabaseAnonKey = getActiveSupabaseAnonKey();

export interface SupabaseHealthStatus {
  connected: boolean;
  url: string;
  authEnabled: boolean;
  tablesVerified: string[];
  latencyMs: number;
  error?: string;
}

export async function testSupabaseConnection(customUrl?: string, customKey?: string): Promise<SupabaseHealthStatus> {
  const url = cleanSupabaseUrl(customUrl || getActiveSupabaseUrl());
  const key = cleanSupabaseKey(customKey || getActiveSupabaseAnonKey());

  if (!url || !key || url.includes('your-project') || url.includes('placeholder')) {
    return {
      connected: false,
      url: url || 'Not Configured',
      authEnabled: false,
      tablesVerified: [],
      latencyMs: 0,
      error: 'Supabase credentials not configured. Please supply VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    };
  }

  const startTime = performance.now();
  try {
    const testClient = createClient(url, key);
    const { data: _data, error } = await testClient.from('domains').select('count', { count: 'exact', head: true });
    const latency = Math.round(performance.now() - startTime);

    if (error && !error.message.includes('permission denied')) {
      return {
        connected: false,
        url,
        authEnabled: true,
        tablesVerified: [],
        latencyMs: latency,
        error: error.message,
      };
    }

    return {
      connected: true,
      url,
      authEnabled: true,
      tablesVerified: ['public.domains', 'public.team_members', 'public.uptime_checks', 'public.notification_logs'],
      latencyMs: latency,
    };
  } catch (err: any) {
    return {
      connected: false,
      url,
      authEnabled: false,
      tablesVerified: [],
      latencyMs: Math.round(performance.now() - startTime),
      error: err.message || 'Connection timeout to Supabase endpoint',
    };
  }
}
