import React, { useState } from 'react';
import { X, ShieldCheck, Mail, Lock, User, Building, LogIn, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { user, login, signup, loginWithGoogle, logout, resetPassword, enterpriseDomainWhitelist } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('Engineering & SRE');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Authentication failed');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signup(email, fullName, department);
    setLoading(false);

    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Sign up failed');
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await resetPassword(email);
    setLoading(false);
    setSuccessMsg(res.message);
  };

  const handleGoogleLogin = async () => {
    await loginWithGoogle();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-zinc-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#10121a] border border-zinc-200 dark:border-zinc-800 rounded-t-2xl sm:rounded-xl max-w-md w-full max-h-[92vh] sm:max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {user
                ? 'Internal Account Profile'
                : mode === 'signin'
                ? 'Internal Team Sign In'
                : mode === 'signup'
                ? 'Request Internal Access'
                : 'Reset Password'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* If user is already logged in, show user profile */}
        {user ? (
          <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
            <div className="p-3.5 bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/80 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-sm">
                {user.full_name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{user.full_name}</div>
                <div className="text-zinc-500 font-mono text-[11px] truncate">{user.email}</div>
                <div className="flex items-center gap-2 mt-1 text-[10px]">
                  <span className="text-indigo-600 dark:text-indigo-400 uppercase font-semibold tracking-wider font-mono">
                    {user.role}
                  </span>
                  <span>·</span>
                  <span className="text-zinc-500">{user.department}</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">
              🔐 <b>Active Supabase Session:</b> Authenticated under Row Level Security. All domain updates, uptime checks, and renewal records are attributed to this user ID.
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={logout}
                className="w-full py-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 rounded-lg font-medium transition-colors"
              >
                Sign Out
              </button>
              <button
                onClick={onClose}
                className="w-full py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
            {/* Whitelist disclaimer */}
            <div className="p-2.5 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80 rounded-lg text-[11px] text-zinc-500">
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">Corporate Whitelist: </span>
              Emails matching {enterpriseDomainWhitelist.slice(0, 3).join(', ')} are granted access.
            </div>

            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-lg text-[11px] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-lg text-[11px] flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Google Enterprise SSO Button */}
            <button
              onClick={handleGoogleLogin}
              className="w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google Enterprise SSO</span>
            </button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
              <span className="flex-shrink mx-3 text-zinc-400 text-[10px] uppercase tracking-wider">
                Or with corporate email
              </span>
              <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
            </div>

            {/* Mode 1: Sign In */}
            {mode === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-3">
                <div>
                  <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">Company Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="alex.vance@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-zinc-700 dark:text-zinc-300 font-medium">Password</label>
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </button>

                <div className="text-center pt-1 text-[11px] text-zinc-500">
                  New team member?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                  >
                    Request access
                  </button>
                </div>
              </form>
            )}

            {/* Mode 2: Sign Up */}
            {mode === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-3">
                <div>
                  <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="Jordan Taylor"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">Company Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="jordan.taylor@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">Department / Team</label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="Payments, DevOps, SRE, CX"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>Join Internal Workspace</span>
                </button>

                <div className="text-center pt-1 text-[11px] text-zinc-500">
                  Already registered?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('signin')}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                  >
                    Back to sign in
                  </button>
                </div>
              </form>
            )}

            {/* Mode 3: Forgot Password */}
            {mode === 'forgot' && (
              <form onSubmit={handleForgot} className="space-y-3">
                <p className="text-zinc-500 text-[11px]">
                  Enter your company email. A password recovery link will be sent to your corporate address.
                </p>

                <div>
                  <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">Company Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="alex.vance@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg shadow-xs transition-colors"
                >
                  Send Reset Link
                </button>

                <div className="text-center pt-1 text-[11px] text-zinc-500">
                  <button
                    type="button"
                    onClick={() => setMode('signin')}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                  >
                    Back to sign in
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
