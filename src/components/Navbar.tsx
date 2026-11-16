import React from 'react';
import {
  Shield,
  LayoutDashboard,
  Zap,
  Bot,
  Database,
  Activity,
  Plus,
  User,
} from 'lucide-react';
import { NotificationInbox } from './NotificationInbox';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '../context/AuthContext';

export type WorkspaceTab =
  | 'dashboard'
  | 'actions'
  | 'telegram'
  | 'supabase'
  | 'activity';

interface NavbarProps {
  activeTab: WorkspaceTab;
  setActiveTab: (tab: WorkspaceTab) => void;
  onOpenAddModal: () => void;
  onOpenAuthModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddModal,
  onOpenAuthModal,
}) => {
  const { user } = useAuth();

  const tabs: { id: WorkspaceTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
    { id: 'actions', label: 'Actions & Automation', icon: <Zap className="w-3.5 h-3.5" /> },
    { id: 'telegram', label: 'Telegram Bot & Alerts', icon: <Bot className="w-3.5 h-3.5" /> },
    { id: 'supabase', label: 'Supabase & RLS', icon: <Database className="w-3.5 h-3.5" /> },
    { id: 'activity', label: 'Activity Logs', icon: <Activity className="w-3.5 h-3.5" /> },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-[#090a0f]/90 backdrop-blur-md border-b border-zinc-200/90 dark:border-zinc-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Wordmark & Brand Badge */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2.5 text-left focus:outline-none group"
          >
            <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-white flex items-center justify-center text-white dark:text-zinc-950 font-bold shadow-xs">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                DomainPulse
              </span>
              <span className="ml-2 text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                ENTERPRISE
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Dedicated Workspace Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1 text-xs font-medium bg-zinc-100/80 dark:bg-zinc-900/80 p-1 rounded-xl border border-zinc-200/70 dark:border-zinc-800/70">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  isActive
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Header Utilities (Inbox, Theme Toggle, Profile, Add Domain) */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Notification Inbox */}
          <NotificationInbox />

          {/* Persistent Theme Toggle (System / Light / Dark) */}
          <ThemeToggle />

          {/* User Profile Chip with Role Indicator */}
          <button
            onClick={onOpenAuthModal}
            className="p-1 sm:px-2 sm:py-1 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-800/80 transition-colors flex items-center gap-2 text-xs"
            title={user ? `Signed in as ${user.email} (${user.role})` : 'Sign In'}
          >
            <div className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 flex items-center justify-center text-[10px] font-bold font-mono">
              {user ? user.full_name.slice(0, 1) : <User className="w-3 h-3" />}
            </div>
            {user && (
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 leading-none truncate max-w-[90px]">
                  {user.full_name.split(' ')[0]}
                </span>
                <span className="text-[9px] uppercase tracking-wider font-mono text-indigo-600 dark:text-indigo-400 mt-0.5 leading-none">
                  {user.role}
                </span>
              </div>
            )}
          </button>

          {/* Primary Action Button */}
          <button
            onClick={onOpenAddModal}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 shadow-xs transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Domain</span>
          </button>
        </div>
      </div>

      {/* Mobile Sub-Navigation for Tabs */}
      <div className="lg:hidden border-t border-zinc-200/80 dark:border-zinc-800/80 px-4 py-2 flex items-center gap-1 overflow-x-auto text-xs bg-zinc-50/50 dark:bg-zinc-950/40">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap flex items-center gap-1 text-[11px] ${
                isActive
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
