-- ==============================================================================
-- DOMAINPULSE: Supabase Database Schema & Row Level Security (RLS)
-- Production PostgreSQL DDL for Internal Company Domain & Uptime Checker Tool
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS
DO $$ BEGIN
  CREATE TYPE domain_status_enum AS ENUM ('online', 'degraded', 'down', 'pending');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_type_enum AS ENUM ('downtime_error', 'expiry_30d', 'expiry_repeating', 'ssl_warning', 'recovered');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE team_role_enum AS ENUM ('admin', 'lead', 'member');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. TABLES

-- Team Members (Internal company employees authorized to access domain checker)
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role team_role_enum NOT NULL DEFAULT 'member',
  department TEXT NOT NULL DEFAULT 'Engineering',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Domains Table (Core domain registry, WHOIS data, uptime status, and renewal targets)
CREATE TABLE IF NOT EXISTS public.domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_name TEXT NOT NULL UNIQUE,
  company TEXT NOT NULL, -- Internal team/department tag (e.g. Payments, Infrastructure, SecOps)
  registrar TEXT NOT NULL DEFAULT 'Unknown Registrar',
  renewal_url TEXT NOT NULL, -- Direct quick-action link to registrar's renewal page
  status domain_status_enum NOT NULL DEFAULT 'pending',
  http_status INTEGER DEFAULT 200,
  response_time_ms INTEGER DEFAULT 0,
  ssl_valid BOOLEAN DEFAULT true,
  ssl_expires_at TIMESTAMPTZ,
  registered_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  nameservers TEXT[] DEFAULT ARRAY[]::TEXT[],
  alert_threshold_days INTEGER NOT NULL DEFAULT 30,
  telegram_alert_enabled BOOLEAN NOT NULL DEFAULT true,
  last_checked_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Uptime Checks Table (Historical ping logs, response time, and downtime diagnostic errors)
CREATE TABLE IF NOT EXISTS public.uptime_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID NOT NULL REFERENCES public.domains(id) ON DELETE CASCADE,
  status domain_status_enum NOT NULL,
  http_status INTEGER,
  response_time_ms INTEGER NOT NULL,
  error_message TEXT,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Notification Logs Table (Audit trail of Telegram and inbox alerts sent for expiry & downtime)
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID REFERENCES public.domains(id) ON DELETE SET NULL,
  type notification_type_enum NOT NULL,
  channel TEXT NOT NULL DEFAULT 'telegram', -- 'telegram' | 'inbox'
  recipient TEXT NOT NULL, -- Telegram chat ID or user email
  message TEXT NOT NULL,
  delivered_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  acknowledged BOOLEAN NOT NULL DEFAULT false
);

-- 4. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_domains_expires_at ON public.domains(expires_at ASC);
CREATE INDEX IF NOT EXISTS idx_domains_status ON public.domains(status);
CREATE INDEX IF NOT EXISTS idx_domains_company ON public.domains(company);
CREATE INDEX IF NOT EXISTS idx_uptime_checks_domain_id ON public.uptime_checks(domain_id, checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_logs_domain ON public.notification_logs(domain_id, delivered_at DESC);

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- Enforce enterprise-only access: only authenticated team members can view or manage domains.

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uptime_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to verify if the current authenticated user belongs to an internal team member
CREATE OR REPLACE FUNCTION public.is_internal_team_member()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if the current user is an admin or lead
CREATE OR REPLACE FUNCTION public.is_team_admin_or_lead()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members
    WHERE user_id = auth.uid() AND role IN ('admin', 'lead')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- POLICIES: team_members
CREATE POLICY "Allow authenticated team members to view team directory"
  ON public.team_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admins to manage team members"
  ON public.team_members FOR ALL
  TO authenticated
  USING (public.is_team_admin_or_lead());

-- POLICIES: domains
CREATE POLICY "Allow authenticated team members to view all domains"
  ON public.domains FOR SELECT
  TO authenticated
  USING (public.is_internal_team_member());

CREATE POLICY "Allow authenticated team members to insert new domains"
  ON public.domains FOR INSERT
  TO authenticated
  WITH CHECK (public.is_internal_team_member());

CREATE POLICY "Allow authenticated team members to update domain records"
  ON public.domains FOR UPDATE
  TO authenticated
  USING (public.is_internal_team_member());

CREATE POLICY "Allow admins and leads to delete domains"
  ON public.domains FOR DELETE
  TO authenticated
  USING (public.is_team_admin_or_lead());

-- POLICIES: uptime_checks
CREATE POLICY "Allow authenticated team members to view uptime checks"
  ON public.uptime_checks FOR SELECT
  TO authenticated
  USING (public.is_internal_team_member());

CREATE POLICY "Allow system service role or authenticated members to log checks"
  ON public.uptime_checks FOR INSERT
  TO authenticated
  WITH CHECK (public.is_internal_team_member());

-- POLICIES: notification_logs
CREATE POLICY "Allow authenticated team members to view alert logs"
  ON public.notification_logs FOR SELECT
  TO authenticated
  USING (public.is_internal_team_member());

CREATE POLICY "Allow authenticated team members to acknowledge alerts"
  ON public.notification_logs FOR UPDATE
  TO authenticated
  USING (public.is_internal_team_member());

-- 6. AUTOMATED DAYS TILL EXPIRY COMPUTED VIEW
CREATE OR REPLACE VIEW public.vw_domains_expiry_overview AS
SELECT 
  id,
  domain_name,
  company,
  registrar,
  renewal_url,
  status,
  http_status,
  response_time_ms,
  ssl_valid,
  expires_at,
  EXTRACT(DAY FROM (expires_at - now()))::INTEGER AS days_till_expiry,
  CASE
    WHEN EXTRACT(DAY FROM (expires_at - now())) <= 30 THEN 'critical'
    WHEN EXTRACT(DAY FROM (expires_at - now())) <= 60 THEN 'warning'
    ELSE 'healthy'
  END AS expiry_severity,
  last_checked_at
FROM public.domains;
