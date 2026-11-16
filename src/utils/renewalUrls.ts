import { DomainRecord } from '../types/domain';

/**
 * Normalizes and returns the official registrar renewal portal URL.
 * Specifically for GoDaddy domains, ensures navigation directly to the official
 * GoDaddy renewal management dashboard: https://account.godaddy.com/renewals
 */
export function getOfficialRenewalUrl(domain?: Partial<DomainRecord> | null): string {
  if (!domain) return 'https://account.godaddy.com/renewals';

  const domainName = (domain.domain_name || '').toLowerCase().trim();
  const reg = (domain.registrar || '').toLowerCase().trim();
  const rawUrl = (domain.renewal_url || '').trim();

  // UAE nic.ae
  if (domainName.endsWith('.ae') || rawUrl.includes('nic.ae') || reg.includes('nic.ae')) {
    return 'https://www.nic.ae';
  }

  // Cloudflare
  if (reg.includes('cloudflare') || rawUrl.includes('cloudflare.com')) {
    return 'https://dash.cloudflare.com';
  }

  // Namecheap
  if (reg.includes('namecheap') || rawUrl.includes('namecheap.com')) {
    return 'https://www.namecheap.com/myaccount/renewals/';
  }

  // Porkbun
  if (reg.includes('porkbun') || rawUrl.includes('porkbun.com')) {
    return 'https://porkbun.com/account/domains';
  }

  // Google / Squarespace
  if (reg.includes('google') || reg.includes('squarespace') || rawUrl.includes('squarespace')) {
    return 'https://domains.squarespace.com';
  }

  // Official GoDaddy renewals management dashboard
  // Avoid deprecated/internal dcc.godaddy.com links
  return 'https://account.godaddy.com/renewals';
}
