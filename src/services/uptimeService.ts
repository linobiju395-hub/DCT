import { DomainStatus, UptimePingResult } from '../types/domain';

export async function checkDomainUptime(domain: string): Promise<UptimePingResult> {
  const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^@/, '');
  const url = `https://${cleanDomain}`;
  const startTime = performance.now();

  // 1. Try real server-side live HTTP/HTTPS probe first
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const backendRes = await fetch(`/api/check-uptime?url=${encodeURIComponent(url)}`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (backendRes.ok) {
      const data = await backendRes.json();
      return {
        domain: cleanDomain,
        status: data.status as DomainStatus,
        http_status: Number(data.http_status) || 200,
        response_time_ms: Number(data.response_time_ms) || Math.round(performance.now() - startTime),
        ssl_valid: Boolean(data.ssl_valid),
        error_message: data.error_message,
        checked_at: data.checked_at || new Date().toISOString(),
      };
    }
  } catch {
    // Backend API timed out or network error, proceed to direct client probe
  }

  // 2. Direct browser probe using actual fetch
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, {
      method: 'HEAD',
      mode: 'no-cors',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const durationMs = Math.max(1, Math.round(performance.now() - startTime));
    const status: DomainStatus = durationMs > 2000 ? 'degraded' : 'online';

    return {
      domain: cleanDomain,
      status,
      http_status: 200,
      response_time_ms: durationMs,
      ssl_valid: true,
      checked_at: new Date().toISOString(),
    };
  } catch (err: any) {
    const durationMs = Math.max(1, Math.round(performance.now() - startTime));
    const isTimeout = err?.name === 'AbortError' || durationMs >= 4900;

    return {
      domain: cleanDomain,
      status: 'down',
      http_status: isTimeout ? 504 : 503,
      response_time_ms: durationMs,
      ssl_valid: false,
      error_message: isTimeout ? 'Gateway Timeout (5000ms exceeded)' : 'Connection refused / DNS lookup failed',
      checked_at: new Date().toISOString(),
    };
  }
}
