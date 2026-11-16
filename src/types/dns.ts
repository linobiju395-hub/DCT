export type DNSRecordType = 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'NS' | 'SOA' | 'CAA';

export interface DNSRecord {
  id: string;
  type: DNSRecordType;
  name: string; // Target host or root (@ or subdomain)
  value: string; // Target IP or record data
  ttl: number; // Time-to-live in seconds
  status: 'resolved' | 'high_ttl' | 'warning' | 'error';
  statusMessage?: string;
  priority?: number; // for MX
}

export interface EdgePropagationResult {
  provider: 'Cloudflare' | 'Google' | 'OpenDNS' | 'Quad9';
  serverIp: string;
  location: string;
  resolvedValue: string;
  latencyMs: number;
  status: 'ok' | 'mismatch' | 'timeout';
}

export interface MailSecurityHygiene {
  dmarc: {
    status: 'valid' | 'quarantine' | 'reject' | 'missing';
    policy?: string;
    rawRecord?: string;
  };
  spf: {
    status: 'configured' | 'multiple_found' | 'missing';
    rawRecord?: string;
    count: number;
  };
  dnssec: {
    status: 'enabled' | 'disabled';
    details?: string;
  };
}

export interface DNSInspectionResult {
  domain: string;
  records: DNSRecord[];
  edgeResults: EdgePropagationResult[];
  hygiene: MailSecurityHygiene;
  queriedAt: string;
  primaryIp?: string;
  source?: string;
  provider?: string;
}
