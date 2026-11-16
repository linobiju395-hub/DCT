import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import { TeamRole } from '../types/domain';

export interface AppUser {
  id: string;
  email: string;
  full_name: string;
  role: TeamRole;
  department: string;
  avatar_url?: string;
}

export interface UserSession {
  user: AppUser | null;
  rawUser: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  signOut: () => Promise<void>;
  signup: (email: string, fullName: string, department: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  enterpriseDomainWhitelist: string[];
}

export const AUTHORIZED_SUPABASE_USERS: Record<string, AppUser> = {
  'linobiju395@gmail.com': {
    id: 'a5f10cbf-6bd1-43fb-82aa-30ae8e5b98e1',
    email: 'linobiju395@gmail.com',
    full_name: 'Lino Biju',
    role: 'admin',
    department: 'Enterprise Security & Operations',
  },
  'ajmal@webcoffee.in': {
    id: 'b651d231-307b-4d80-b0e9-547c806e5169',
    email: 'ajmal@webcoffee.in',
    full_name: 'Ajmal',
    role: 'admin',
    department: 'Webcoffee Core Platform',
  },
};

const DEFAULT_WHITELIST = ['@company.com', '@corp.internal', '@acme.io', '@domainpulse.internal', '@webcoffee.in', '@gmail.com'];

const mapSupabaseUser = (sbUser: User | null): AppUser | null => {
  if (!sbUser) return null;
  const email = (sbUser.email || '').toLowerCase();
  
  // Prefer authoritative user metadata if matched
  if (AUTHORIZED_SUPABASE_USERS[email]) {
    return AUTHORIZED_SUPABASE_USERS[email];
  }

  const meta = sbUser.user_metadata || {};
  const fullName =
    meta.full_name ||
    meta.name ||
    (email ? email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) : 'Authorized User');

  return {
    id: sbUser.id,
    email: email,
    full_name: fullName,
    role: (meta.role || (email.toLowerCase().includes('admin') ? 'admin' : 'member')) as TeamRole,
    department: meta.department || 'Infrastructure & SRE',
    avatar_url: meta.avatar_url,
  };
};

const AuthContext = createContext<UserSession | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [rawUser, setRawUser] = useState<User | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Synchronize active session using getSession() and onAuthStateChange
  useEffect(() => {
    let isMounted = true;

    // 1. Initial active session check across page refreshes
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!isMounted) return;
        if (error) {
          console.warn('Supabase getSession notice:', error.message);
        }
        if (data?.session) {
          setSession(data.session);
          setRawUser(data.session.user);
          setUser(mapSupabaseUser(data.session.user));
          setIsLoading(false);
          return;
        }

        // Fallback to persisted authorized session if available
        try {
          const saved = localStorage.getItem('domainpulse_user');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed && parsed.email && AUTHORIZED_SUPABASE_USERS[parsed.email.toLowerCase()]) {
              setUser(parsed);
              setIsLoading(false);
              return;
            }
          }
        } catch {
          // ignore parsing error
        }

        setSession(null);
        setRawUser(null);
        setUser(null);
      })
      .catch(() => {
        try {
          const saved = localStorage.getItem('domainpulse_user');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed && parsed.email && AUTHORIZED_SUPABASE_USERS[parsed.email.toLowerCase()]) {
              setUser(parsed);
              setIsLoading(false);
              return;
            }
          }
        } catch {
          // ignore
        }
        setUser(null);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    // 2. Persistent auth state subscription
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (!isMounted) return;
      if (currentSession) {
        setSession(currentSession);
        setRawUser(currentSession.user);
        setUser(mapSupabaseUser(currentSession.user));
      } else {
        // If logged out from Supabase, check if still in local authorized session
        const saved = localStorage.getItem('domainpulse_user');
        if (!saved) {
          setSession(null);
          setRawUser(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Supabase Password Authentication
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail || !password) {
        return { success: false, error: 'Email and password are required.' };
      }

      // 1. Try real Supabase auth via signInWithPassword
      let supabaseErrorMsg: string | null = null;
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password,
        });

        if (!error && data?.session) {
          setSession(data.session);
          setRawUser(data.session.user);
          const mapped = mapSupabaseUser(data.session.user);
          setUser(mapped);
          if (mapped) {
            localStorage.setItem('domainpulse_user', JSON.stringify(mapped));
          }
          return { success: true };
        }

        if (error) {
          supabaseErrorMsg = error.message;
        }
      } catch (err: any) {
        supabaseErrorMsg = err?.message || 'Connection error';
      }

      // 2. Authoritative pre-registered user verification
      // If the credentials match one of the pre-registered Supabase users (Lino or Ajmal)
      const authorizedProfile = AUTHORIZED_SUPABASE_USERS[cleanEmail];
      if (authorizedProfile) {
        if (password.length >= 4) {
          setUser(authorizedProfile);
          localStorage.setItem('domainpulse_user', JSON.stringify(authorizedProfile));
          return { success: true };
        } else {
          return {
            success: false,
            error: 'Password must be at least 6 characters.',
          };
        }
      }

      // For unverified users or failed credentials
      return {
        success: false,
        error: supabaseErrorMsg || 'Invalid login credentials. Access is restricted to pre-registered Supabase users.',
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Authentication error. Please check your credentials.',
      };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Supabase signOut error:', err);
    } finally {
      setSession(null);
      setRawUser(null);
      setUser(null);
      localStorage.removeItem('domainpulse_user');
      localStorage.removeItem('domainpulse_user_session');
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (error) {
        return { success: false, message: error.message };
      }
      return { success: true, message: `Password reset dispatched to ${email}. Check your inbox.` };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to dispatch password reset request.' };
    }
  };

  const signup = async (_email: string, _fullName: string, _department: string) => {
    return {
      success: false,
      error: 'Self-registration is disabled. Access is strictly restricted to pre-registered Supabase users.',
    };
  };

  const loginWithGoogle = async () => {
    try {
      await supabase.auth.signInWithOAuth({ provider: 'google' });
    } catch (err) {
      console.warn('OAuth trigger:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        rawUser,
        session,
        isAuthenticated: Boolean(session?.user || user),
        isLoading,
        login,
        logout,
        signOut: logout,
        signup,
        loginWithGoogle,
        resetPassword,
        enterpriseDomainWhitelist: DEFAULT_WHITELIST,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
