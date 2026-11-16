import React, { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getActiveSupabaseUrl,
  getActiveSupabaseAnonKey,
  cleanSupabaseUrl,
  reinitializeSupabase,
} from '../../services/supabaseClient';

export const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-clean any trailing slashes or invalid subpaths on mount
  useEffect(() => {
    const rawUrl = getActiveSupabaseUrl();
    const cleaned = cleanSupabaseUrl(rawUrl);
    if (rawUrl && rawUrl !== cleaned) {
      reinitializeSupabase(cleaned, getActiveSupabaseAnonKey());
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    // Proactively clean the active endpoint before sending the request
    const currentUrl = getActiveSupabaseUrl();
    const sanitizedUrl = cleanSupabaseUrl(currentUrl);
    if (currentUrl && currentUrl !== sanitizedUrl) {
      reinitializeSupabase(sanitizedUrl, getActiveSupabaseAnonKey());
    }

    setIsSubmitting(true);

    try {
      const result = await login(cleanEmail, password);
      if (!result.success) {
        let err = result.error || 'Authentication failed. Please check your credentials.';

        // Detect Kong gateway "Invalid path" error and auto-correct
        if (err.includes('Invalid path specified in request URL')) {
          const autoCleaned = cleanSupabaseUrl(getActiveSupabaseUrl());
          reinitializeSupabase(autoCleaned, getActiveSupabaseAnonKey());
          err = 'Authentication endpoint refreshed. Please re-enter your password to sign in.';
        }

        setErrorMessage(err);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'An unexpected error occurred during sign in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-zinc-900 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center text-white shadow-md">
              <Shield className="w-6 h-6 fill-white" />
            </div>
            <span
              className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse"
              title="System Online"
            />
          </div>

          <h2 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
            DomainPulse
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            Authoritative Registry &amp; Domain Operations Portal
          </p>
        </div>

        {/* Card Container */}
        <div className="mt-6 bg-white py-8 px-6 sm:px-8 shadow-xs border border-slate-200/80 rounded-2xl">
          {/* Error Message Box */}
          {errorMessage && (
            <div
              className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 text-[12px] leading-relaxed">
                <span className="font-semibold block mb-0.5">Authentication Error</span>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-slate-800 mb-1"
              >
                Corporate Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  autoFocus
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-slate-800 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-10 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Clean footer notice */}
          <div className="mt-4 pt-3 text-center">
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Access is restricted to authorized enterprise domain administrators.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
